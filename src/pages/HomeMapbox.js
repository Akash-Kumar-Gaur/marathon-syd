import React, { useState, useEffect, useRef, useCallback } from "react";
import { useLocation } from "react-router-dom";
import "./Home.css";
import MapboxMap from "../components/MapboxMap";
import Header from "../components/Header";
import RewardPopup from "../components/RewardPopup";
import HintModal from "../components/HintModal";
import GamePopup from "../components/GamePopup";
import BoostScorePopup from "../components/BoostScorePopup";
import JigsawTrayPuzzle from "../components/JigsawTrayPuzzle";
import FlipCardsGame from "../components/FlipCardsGame";
import MarathonQuizGame from "../components/MarathonQuizGame";
import toast, { Toaster } from "react-hot-toast";
import { useUser } from "../context/UserContext";
import { useDrawer } from "../context/DrawerContext";
import { getTreasureData } from "../utils/treasureDataSelector";
import { normalizeTreasureId } from "../utils/dataValidation";
import treasureImage from "../assets/images/treasureIcon.png";
import { getCachedDistance } from "../services/firebase";

const Home = () => {
  const location = useLocation();
  const { userData, updateUserData } = useUser();

  // Calculate distance between two points using cached version
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    return getCachedDistance([lon1, lat1], [lon2, lat2]);
  };

  const [center, setCenter] = useState([151.2093, -33.8688]); // Note: Mapbox uses [lng, lat] format

  // State for current treasure data
  const [currentTreasureData, setCurrentTreasureData] = useState([]);

  // Convert treasure data to the format expected by the component
  const [treasures, setTreasures] = useState([]);
  const [userPosition] = useState([151.2093, -33.8688]);
  const [activeView, setActiveView] = useState("map");
  const [selectedTreasure, setSelectedTreasure] = useState(null);
  const [isHintModalOpen, setIsHintModalOpen] = useState(false);
  const [isRewardPopupOpen, setIsRewardPopupOpen] = useState(false);
  const [rewardData, setRewardData] = useState(null);
  const [showBoostPopup, setShowBoostPopup] = useState(false);
  const [selectedGame, setSelectedGame] = useState(null);
  const [permissionsChecked, setPermissionsChecked] = useState(false);
  const [showHintBalloon, setShowHintBalloon] = useState(false);
  const [isSavingTreasure, setIsSavingTreasure] = useState(false);
  const permissionInitRef = useRef(false);
  const { isDrawerOpen } = useDrawer();

  // Load treasure data based on current time
  useEffect(() => {
    const loadTreasureData = async () => {
      try {
        const treasureDataResult = await getTreasureData();
        setCurrentTreasureData(treasureDataResult);
        console.log(
          "Loaded treasure data:",
          treasureDataResult.length,
          "treasures"
        );
      } catch (error) {
        console.error("Failed to load treasure data:", error);
        // Fallback to empty array
        setCurrentTreasureData([]);
      }
    };

    loadTreasureData();

    // Set up periodic refresh every 5 minutes to check for race day transition
    const refreshInterval = setInterval(() => {
      loadTreasureData();
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(refreshInterval);
  }, []);

  // Update treasures to filter out already collected ones
  useEffect(() => {
    if (
      userData &&
      userData.collectedTreasures &&
      currentTreasureData.length > 0
    ) {
      console.log(
        "Filtering treasures based on collected:",
        userData.collectedTreasures
      );

      // Get all treasures and filter out collected ones
      const initialCenter = [151.2093, -33.8688]; // Default center
      const allTreasures = currentTreasureData
        .map((treasure, index) => ({
          id: treasure.id,
          position: [
            treasure.coordinates.longitude,
            treasure.coordinates.latitude,
          ],
          found: false,
          title: treasure.name,
          description: treasure.offer,
          hint: treasure.hint,
          address: treasure.address,
          openingHours: treasure.hours,
          uniqueRedemption: treasure.code,
          image: treasure.image,
          distance: calculateDistance(
            initialCenter[1], // lat
            initialCenter[0], // lng
            treasure.coordinates.latitude,
            treasure.coordinates.longitude
          ),
        }))
        .sort((a, b) => a.distance - b.distance) // Sort by distance
        .filter((treasure) => {
          // Normalize treasure ID and check against collected treasures
          const treasureId = normalizeTreasureId(treasure.id);
          return !userData.collectedTreasures.some(
            (collectedId) => normalizeTreasureId(collectedId) === treasureId
          );
        }) // Filter out collected
        .slice(0, 10); // Take the 10 closest uncollected

      console.log("Filtered treasures count:", allTreasures.length);
      setTreasures(allTreasures);
    }
  }, [userData, currentTreasureData]);

  // Check permissions and initialize popup on mount
  useEffect(() => {
    console.log(
      "Home useEffect running, permissionsChecked:",
      permissionsChecked,
      "permissionInitRef.current:",
      permissionInitRef.current
    );

    if (!permissionsChecked && !permissionInitRef.current) {
      console.log("Checking if permissions are already granted");
      permissionInitRef.current = true;
      checkAndInitializePermissions();
    }
  }, []);

  // Handle game selection from navigation state
  useEffect(() => {
    if (location.state && location.state.selectedGame) {
      setSelectedGame(location.state.selectedGame);
      // Clear the state to prevent re-triggering on re-renders
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (debouncedMapMove.current) {
        clearTimeout(debouncedMapMove.current);
      }
    };
  }, []);

  // Show hint balloon for 5 seconds after render
  useEffect(() => {
    setShowHintBalloon(true);
    const timer = setTimeout(() => {
      setShowHintBalloon(false);
    }, 5000);
    return () => clearTimeout(timer);
  }, []);

  const checkAndInitializePermissions = async () => {
    try {
      const cameraPermission = await navigator.permissions.query({
        name: "camera",
      });

      console.log("Camera permission state:", cameraPermission.state);

      if (cameraPermission.state === "granted") {
        console.log("Camera permission already granted, skipping popup");
        setPermissionsChecked(true);
      } else {
        console.log("Camera permission not granted, showing popup");
        setPermissionsChecked(true);
      }
    } catch (error) {
      console.error("Error checking camera permission:", error);
      console.log("Couldn't check permissions, showing popup");
      setPermissionsChecked(true);
    }
  };

  // Original postMessage handler
  useEffect(() => {
    let isProcessing = false; // Prevent multiple simultaneous processing
    let lastProcessedTarget = null; // Track last processed target
    let lastProcessedTime = 0; // Track last processed time

    const handleMessage = (event) => {
      // Only accept messages from our trusted domain
      if (event.origin !== "https://nxtinteractive.8thwall.app") return;

      // Check if the message is about image target detection
      if (event.data && event.data.type === "imageTargetDetected") {
        const { targetName } = event.data;
        const currentTime = Date.now();

        // Prevent multiple simultaneous processing
        if (isProcessing) {
          console.log("🎯 Already processing image target, ignoring duplicate");
          return;
        }

        // Prevent duplicate processing of same target within 10 seconds
        if (
          lastProcessedTarget === targetName &&
          currentTime - lastProcessedTime < 10000
        ) {
          console.log(
            "🎯 Same target detected recently, ignoring:",
            targetName
          );
          return;
        }

        isProcessing = true;
        lastProcessedTarget = targetName;
        lastProcessedTime = currentTime;

        console.log("🎯 Image Target Detected:", targetName);

        const treasure =
          currentTreasureData.find((t) => t.name === targetName) || false;

        if (treasure) {
          setRewardData(treasure);

          // Show reward popup after 5 seconds
          setTimeout(() => {
            setIsRewardPopupOpen(true);
            isProcessing = false; // Reset flag after processing
          }, 5000);
        } else {
          toast("Treasure not found", {
            style: {
              borderRadius: "8px",
              background: "#fffbe6",
              color: "#081F2D",
              fontWeight: "bold",
            },
          });
          isProcessing = false; // Reset flag after processing
        }
      }
    };

    window.addEventListener("message", handleMessage);

    return () => {
      window.removeEventListener("message", handleMessage);
    };
  }, [currentTreasureData]); // Add currentTreasureData as dependency

  // Handler for BoostScorePopup play
  const handleBoostPlay = () => {
    setShowBoostPopup(false);
    // Add your boost play logic here
  };

  const handleTreasureClick = (treasure) => {
    // Use the full treasure data if available, otherwise find it by ID
    const fullTreasure =
      treasure.treasureData ||
      treasures.find(
        (t) => t.id === parseInt(treasure.id.replace("treasure-", ""))
      );

    setSelectedTreasure(
      selectedTreasure?.id === fullTreasure?.id ? null : fullTreasure
    );
    // hide reward popup when treasure is clicked
    setIsRewardPopupOpen(false);
  };

  const toggleView = (view) => {
    setActiveView(view);
  };

  const handleHintClick = () => {
    if (selectedTreasure) {
      setIsHintModalOpen(true);
    }
  };

  // Find nearby treasures based on current map center
  const findNearbyTreasures = (mapCenter) => {
    console.log("findNearbyTreasures called with mapCenter:", mapCenter);
    console.log(
      "Current userData.collectedTreasures:",
      userData?.collectedTreasures
    );
    console.log("userData available:", !!userData);
    console.log(
      "collectedTreasures length:",
      userData?.collectedTreasures?.length
    );

    if (!currentTreasureData || currentTreasureData.length === 0) {
      console.log("No treasure data available");
      return [];
    }

    const nearbyTreasures = currentTreasureData
      .map((treasure, index) => ({
        id: treasure.id,
        position: [
          treasure.coordinates.longitude,
          treasure.coordinates.latitude,
        ],
        found: false,
        title: treasure.name,
        description: treasure.offer,
        hint: treasure.hint,
        address: treasure.address,
        openingHours: treasure.hours,
        uniqueRedemption: treasure.code,
        image: treasure.image,
        distance: calculateDistance(
          mapCenter[1], // lat
          mapCenter[0], // lng
          treasure.coordinates.latitude,
          treasure.coordinates.longitude
        ),
      }))
      .sort((a, b) => a.distance - b.distance) // Sort by distance
      .filter((treasure) => {
        // Normalize treasure ID and check against collected treasures
        const treasureId = normalizeTreasureId(treasure.id);
        const isCollected = userData?.collectedTreasures?.some(
          (collectedId) => normalizeTreasureId(collectedId) === treasureId
        );
        if (isCollected) {
          console.log("Filtering out collected treasure:", treasure.id);
        }
        return !isCollected;
      }) // Filter out collected
      .slice(0, 10); // Take the 10 closest uncollected

    console.log(
      "findNearbyTreasures returning:",
      nearbyTreasures.length,
      "treasures"
    );
    return nearbyTreasures;
  };

  // Debounced map movement handler
  const debouncedMapMove = useRef(null);

  // Handle map movement with delay
  const handleMapMove = useCallback(
    (newCenter) => {
      setCenter(newCenter);

      // Clear existing timeout
      if (debouncedMapMove.current) {
        clearTimeout(debouncedMapMove.current);
      }

      // Set new timeout for finding nearby treasures
      debouncedMapMove.current = setTimeout(() => {
        // Only update treasures if userData and treasure data are available
        if (userData && currentTreasureData.length > 0) {
          console.log("Map move - userData available, updating treasures");
          const nearbyTreasures = findNearbyTreasures(newCenter);
          setTreasures(nearbyTreasures);
        } else {
          console.log(
            "Map move - userData or treasure data not available, skipping treasure update"
          );
        }
      }, 500); // 500ms delay
    },
    [userData, currentTreasureData]
  );

  // Prepare markers for Mapbox
  const mapMarkers = [
    // User position marker
    {
      id: "user",
      position: userPosition,
      title: "You are here",
      className: "current-location-marker",
      content: (
        <div className="current-location-marker">
          <div className="current-location-dot"></div>
          <div className="current-location-pulse"></div>
        </div>
      ),
    },
    // Treasure markers
    ...treasures.map((treasure) => ({
      id: `treasure-${treasure.id}`,
      position: treasure.position,
      title: treasure.title,
      description: treasure.description,
      className:
        selectedTreasure?.id === treasure.id
          ? "treasure-marker active"
          : "treasure-marker",
      icon: treasureImage,
      treasureData: treasure, // Include the full treasure data
    })),
  ];

  return (
    <div className="home">
      <Toaster />

      <HintModal
        isOpen={isHintModalOpen}
        onClose={() => setIsHintModalOpen(false)}
        hint={selectedTreasure?.hint}
      />

      <RewardPopup
        isOpen={isRewardPopupOpen}
        onClose={() => setIsRewardPopupOpen(false)}
        data={rewardData}
        isSavingTreasure={isSavingTreasure}
        onCollect={() => {
          setIsRewardPopupOpen(false);
          return;
          console.log("onCollect called with rewardData:", rewardData);

          // Set saving state to keep popup open
          setIsSavingTreasure(true);

          // Save the collected treasure ID to user data
          if (rewardData && rewardData.id) {
            const currentCollectedTreasures = userData.collectedTreasures || [];
            console.log(
              "Current collected treasures:",
              currentCollectedTreasures
            );

            // Normalize treasure ID to ensure consistency
            const treasureId = normalizeTreasureId(rewardData.id);
            console.log("Normalized treasure ID:", treasureId);

            // Check if already collected
            if (currentCollectedTreasures.includes(treasureId)) {
              console.log("Treasure already collected:", treasureId);
              setIsSavingTreasure(false);
              setSelectedTreasure(null);
              setIsRewardPopupOpen(false);
              toast("Treasure already collected!", {
                style: {
                  borderRadius: "8px",
                  background: "#fffbe6",
                  color: "#081F2D",
                  fontWeight: "bold",
                },
              });
            } else {
              const updatedCollectedTreasures = [
                ...currentCollectedTreasures,
                treasureId,
              ];
              console.log(
                "Updated collected treasures:",
                updatedCollectedTreasures
              );

              const updatedUserData = {
                ...userData,
                collectedTreasures: updatedCollectedTreasures,
              };

              console.log("Updating user data with:", updatedUserData);
              updateUserData(updatedUserData);
              console.log("Collected treasure saved:", treasureId);

              // Keep popup open for a moment to show saving
              setTimeout(() => {
                setIsSavingTreasure(false);
                setSelectedTreasure(null);
                setIsRewardPopupOpen(false);
              }, 1000);
            }
          } else {
            console.log("No rewardData or rewardData.id found:", rewardData);
            setIsSavingTreasure(false);
            setSelectedTreasure(null);
            setIsRewardPopupOpen(false);
          }
        }}
      />

      <BoostScorePopup
        isOpen={showBoostPopup}
        onClose={() => setShowBoostPopup(false)}
        onPlay={handleBoostPlay}
      />

      <GamePopup
        isOpen={selectedGame === "jigsaw"}
        onClose={() => setSelectedGame(null)}
      >
        <div style={{ textAlign: "center", padding: "20px" }}>
          <h3 style={{ marginBottom: "10px", color: "#081F2D" }}>
            Complete the puzzle!
          </h3>
          <p style={{ fontSize: 12, fontWeight: "normal", color: "#081F2D" }}>
            Drag and drop to complete the puzzle
          </p>
        </div>
        <JigsawTrayPuzzle onClose={() => setSelectedGame(null)} />
      </GamePopup>

      <GamePopup
        isOpen={selectedGame === "flip"}
        onClose={() => setSelectedGame(null)}
      >
        <div style={{ textAlign: "center", padding: "20px" }}>
          <h3 style={{ marginBottom: "10px", color: "#081F2D" }}>
            Match in the given time!
          </h3>
          <p style={{ fontSize: 12, fontWeight: "normal", color: "#081F2D" }}>
            Tap on the individual squares to flip the <br />
            cards, once a match they will stay visible.
          </p>
        </div>
        <FlipCardsGame onClose={() => setSelectedGame(null)} />
      </GamePopup>

      <GamePopup
        isOpen={selectedGame === "quiz"}
        onClose={() => setSelectedGame(null)}
      >
        <MarathonQuizGame onClose={() => setSelectedGame(null)} />
      </GamePopup>

      <Header />

      {/* Stats Bar */}
      <div className="stats-bar">
        <div className="stat-item pill">
          <i className="fas fa-gift"></i>
          <span>{userData?.collectedTreasures?.length || 0}</span>
        </div>
        <div className="stat-item pill">
          <i className="fas fa-coins"></i>
          <span>
            {(userData?.collectedTreasures?.length || 0) * 10 +
              (userData?.totalBoosterScore || 0)}{" "}
            Pts
          </span>
        </div>
      </div>

      {/* {activeView === "map" && (
        <MapModeToggle isLive={isLiveMap} onToggle={toggleMapMode} />
      )} */}

      <div className="views-container">
        <div
          className={`map-container ${activeView === "map" ? "active" : ""}`}
        >
          <MapboxMap
            center={center}
            zoom={15}
            markers={mapMarkers}
            onMarkerClick={handleTreasureClick}
            onMapMove={handleMapMove}
            showRoute={!!selectedTreasure}
            routeStart={selectedTreasure ? userPosition : null}
            routeEnd={selectedTreasure ? selectedTreasure.position : null}
          />
        </div>

        {/* Camera View */}
        {activeView === "camera" && (
          <div className="camera-container active">
            <iframe
              src="https://nxtinteractive.8thwall.app/sydney-treasure-hunt/"
              title="Camera View"
              className="camera-webview"
              allow="camera; microphone; autoplay; encrypted-media; fullscreen; gyroscope; accelerometer; magnetometer"
              allowfullscreen
              webkitallowfullscreen="true"
              mozallowfullscreen="true"
              style={{
                visibility:
                  isHintModalOpen || isDrawerOpen ? "hidden" : "visible",
              }}
            />
          </div>
        )}
      </div>

      {/* Bottom Action Buttons */}
      <div className="bottom-actions">
        <div className="action-slider">
          <div className={`slider-pill ${activeView}`}></div>
          <button
            className={`action-button ${activeView === "map" ? "active" : ""}`}
            onClick={() => toggleView("map")}
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <circle cx="12" cy="12" r="3" fill="currentColor" />
              <path
                d="M12 2C7.58 2 4 5.58 4 10c0 5.25 7 12 8 12s8-6.75 8-12c0-4.42-3.58-8-8-8zm0 11c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3z"
                fill="currentColor"
              />
            </svg>
          </button>
          <button
            className={`action-button ${
              activeView === "camera" ? "active" : ""
            }`}
            onClick={() => toggleView("camera")}
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M12 15.2C13.7673 15.2 15.2 13.7673 15.2 12C15.2 10.2327 13.7673 8.8 12 8.8C10.2327 8.8 8.8 10.2327 8.8 12C8.8 13.7673 10.2327 15.2 12 15.2Z"
                fill="currentColor"
              />
              <path
                d="M9 2L7.17 4H4C2.9 4 2 4.9 2 6V18C2 19.1 2.9 20 4 20H20C21.1 20 22 19.1 22 18V6C22 4.9 21.1 4 20 4H16.83L15 2H9ZM12 17C9.24 17 7 14.76 7 12C7 9.24 9.24 7 12 7C14.76 7 17 9.24 17 12C17 14.76 14.76 17 12 17Z"
                fill="currentColor"
              />
            </svg>
          </button>
        </div>
        {selectedTreasure && (
          <div className="hint-button-container">
            <button
              className="action-button idea-button"
              onClick={handleHintClick}
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M9 21c0 .55.45 1 1 1h4c.55 0 1-.45 1-1v-1H9v1zm3-19C8.14 2 5 5.14 5 9c0 2.38 1.19 4.47 3 5.74V17c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-2.26c1.81-1.27 3-3.36 3-5.74 0-3.86-3.14-7-7-7zm2.85 11.1l-.85.6V16h-4v-2.3l-.85-.6C7.8 12.16 7 10.63 7 9c0-2.76 2.24-5 5-5s5 2.24 5 5c0 1.63-.8 3.16-2.15 4.1z"
                  fill="currentColor"
                />
              </svg>
            </button>
            {showHintBalloon && (
              <div className="hint-balloon">
                <div className="hint-balloon-content">
                  Need help? Use a hint to uncover your
                  <br />
                  next hidden treasure.
                </div>
                <div className="hint-balloon-arrow"></div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;
