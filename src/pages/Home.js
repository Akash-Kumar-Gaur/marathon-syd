import React, { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-routing-machine/dist/leaflet-routing-machine.css";
import L from "leaflet";
import "./Home.css";
import Header from "../components/Header";
import MapModeToggle from "../components/MapModeToggle";
import RouteControl from "../components/RouteControl";
import { Toaster, toast } from "react-hot-toast";
import HintModal from "../components/HintModal";
import RewardPopup from "../components/RewardPopup";
import BoostScorePopup from "../components/BoostScorePopup";
import GamePopup from "../components/GamePopup";
import JigsawTrayPuzzle from "../components/JigsawTrayPuzzle";
import FlipCardsGame from "../components/FlipCardsGame";
import MarathonQuizGame from "../components/MarathonQuizGame";
import coinsIcon from "../assets/images/coins.svg";
import treasureImage from "../assets/images/treasure1.png";

// Fix for default marker icons in react-leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require("leaflet/dist/images/marker-icon-2x.png"),
  iconUrl: require("leaflet/dist/images/marker-icon.png"),
  shadowUrl: require("leaflet/dist/images/marker-shadow.png"),
});

// Custom treasure marker icons
const treasureMarker = new L.DivIcon({
  className: "treasure-marker",
  html: `
    <div class="treasure-icon"></div>
  `,
  iconSize: [44, 44],
  iconAnchor: [22, 22],
});

const activeTreasureMarker = new L.DivIcon({
  className: "treasure-marker active",
  html: `
    <div class="treasure-icon"></div>
    <div class="treasure-highlight"></div>
  `,
  iconSize: [56, 56],
  iconAnchor: [28, 28],
});

// Custom current location marker icon
const currentLocationMarker = new L.DivIcon({
  className: "current-location-marker",
  html: `
    <div class="current-location-dot"></div>
    <div class="current-location-pulse"></div>
  `,
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

const Home = () => {
  const [center] = useState([-33.8688, 151.2093]);
  const [treasures] = useState([
    { id: 1, position: [-33.8688, 151.208], found: false },
    { id: 2, position: [-33.8695, 151.208], found: false },
    { id: 3, position: [-33.871, 151.208], found: false },
  ]);
  const [userPosition] = useState([-33.8688, 151.2093]);
  const [isLiveMap, setIsLiveMap] = useState(false);
  const [activeView, setActiveView] = useState("map");
  const [selectedTreasure, setSelectedTreasure] = useState(null);
  const [isHintModalOpen, setIsHintModalOpen] = useState(false);
  const [isRewardPopupOpen, setIsRewardPopupOpen] = useState(false);
  const [rewardData, setRewardData] = useState(null);
  const [showBoostPopup, setShowBoostPopup] = useState(false);
  const [selectedGame, setSelectedGame] = useState(null); // 'jigsaw', 'flip', 'quiz'

  // // Simulation trigger - remove this in production
  // useEffect(() => {
  //   const simulationTimer = setTimeout(() => {
  //     const demoRewardData = {
  //       headerText: "Open Run Pro 2",
  //       pointsIcon: coinsIcon,
  //       points: "+20 Points",
  //       productImage: treasureImage,
  //       title: "OPEN RUN PRO 2",
  //       subtitle: "NEW FLAGSHIP MODEL\nRedefining The Sound Of Sports",
  //       gameType: "quiz", // Change to 'flip' or 'quiz' to test other games
  //     };

  //     setRewardData(demoRewardData);
  //     setIsRewardPopupOpen(true);
  //   }, 1000);

  //   return () => clearTimeout(simulationTimer);
  // }, []); // Only run once on mount

  // Original postMessage handler
  useEffect(() => {
    const handleMessage = (event) => {
      // Only accept messages from our trusted domain
      if (event.origin !== "https://akashgaur.8thwall.app") return;

      // Check if the message is about image target detection
      if (event.data && event.data.type === "imageTargetDetected") {
        const { targetName } = event.data;
        console.log("🎯 Image Target Detected:", targetName);

        // Example reward data - this should be dynamic based on targetName
        const demoRewardData = {
          headerText: "Open Run Pro 2",
          pointsIcon: coinsIcon,
          points: "+20 Points",
          productImage: treasureImage,
          title: "OPEN RUN PRO 2",
          subtitle: "NEW FLAGSHIP MODEL\nRedefining The Sound Of Sports",
          gameType: "flip", // Change to 'flip' or 'quiz' to test other games
        };

        setRewardData(demoRewardData);

        // Show toast notification
        toast(`Found target: ${targetName}`, {
          duration: 3000,
          position: "bottom-center",
          style: {
            background: "#081F2D",
            color: "#fff",
            borderRadius: "16px",
            padding: "16px",
            maxWidth: "90%",
            textAlign: "center",
            marginBottom: "120px",
          },
        });

        // Show reward popup after 3 seconds
        setTimeout(() => {
          setIsRewardPopupOpen(true);
        }, 3000);
      }
    };

    window.addEventListener("message", handleMessage);

    return () => {
      window.removeEventListener("message", handleMessage);
    };
  }, []);

  // Handler for BoostScorePopup play
  const handleBoostPlay = () => {
    if (!rewardData) return;
    if (rewardData.gameType === "jigsaw") setSelectedGame("jigsaw");
    else if (rewardData.gameType === "flip") setSelectedGame("flip");
    else if (rewardData.gameType === "quiz") setSelectedGame("quiz");
    setShowBoostPopup(false);
  };

  const handleTreasureClick = (treasure) => {
    // Toggle selection if clicking the same treasure
    if (selectedTreasure && selectedTreasure.id === treasure.id) {
      setSelectedTreasure(null);
    } else {
      setSelectedTreasure(treasure);
    }
  };

  const toggleMapMode = () => {
    setIsLiveMap(!isLiveMap);
  };

  const toggleView = (view) => {
    if (view !== activeView) {
      setActiveView(view);
      if (view === "camera") {
        toast(
          "Spot the poster, scan it, and watch the treasure come to life!",
          {
            duration: 3000,
            position: "bottom-center",
            style: {
              background: "#081F2D",
              color: "#fff",
              borderRadius: "16px",
              padding: "16px",
              maxWidth: "90%",
              textAlign: "center",
              marginBottom: "120px", // Add margin to avoid overlap with bottom buttons
            },
          }
        );
      }
    }
  };

  const handleHintClick = () => {
    setIsHintModalOpen(true);
  };

  return (
    <div className="home-screen">
      <Toaster />
      <HintModal
        isOpen={isHintModalOpen}
        onClose={() => setIsHintModalOpen(false)}
      />
      <RewardPopup
        isOpen={isRewardPopupOpen}
        onClose={() => setIsRewardPopupOpen(false)}
        onCollect={() => {
          setIsRewardPopupOpen(false);
          setShowBoostPopup(true);
        }}
        rewardData={rewardData}
      />
      <BoostScorePopup
        isOpen={showBoostPopup}
        onPlay={handleBoostPlay}
        onSkip={() => setShowBoostPopup(false)}
      />
      <GamePopup
        isOpen={selectedGame === "jigsaw"}
        onClose={() => setSelectedGame(null)}
      >
        <div style={{ fontWeight: 700, fontSize: 20, marginBottom: 16 }}>
          Complete the puzzle!
          <p style={{ fontSize: 12, fontWeight: "normal", color: "#081F2D" }}>
            Drag and drop to complete the puzzle
          </p>
        </div>
        <JigsawTrayPuzzle />
      </GamePopup>
      <GamePopup
        isOpen={selectedGame === "flip"}
        onClose={() => setSelectedGame(null)}
      >
        <div style={{ fontWeight: 700, fontSize: 20, marginBottom: 16 }}>
          Match in the given time!
          <p style={{ fontSize: 12, fontWeight: "normal", color: "#081F2D" }}>
            Tap on the individual squares to flip the cards, once a match they
            will stay visible.
          </p>
          <p style={{ fontSize: 12, fontWeight: "normal", color: "#081F2D" }}>
            TIME - 00:18
          </p>
        </div>
        <FlipCardsGame />
      </GamePopup>
      <GamePopup
        isOpen={selectedGame === "quiz"}
        onClose={() => setSelectedGame(null)}
      >
        <MarathonQuizGame />
      </GamePopup>
      <Header />

      {/* Stats Bar */}
      <div className="stats-bar">
        <div className="stat-item pill">
          <i className="fas fa-gift"></i>
          <span>4</span>
        </div>
        <div className="stat-item pill">
          <i className="fas fa-coins"></i>
          <span>150 Pt</span>
        </div>
      </div>

      <MapModeToggle isLive={isLiveMap} onToggle={toggleMapMode} />

      <div className="views-container">
        <div
          className={`map-container ${activeView === "map" ? "active" : ""}`}
        >
          <MapContainer
            center={center}
            zoom={15}
            style={{ height: "100%", width: "100%" }}
            zoomControl={false}
            attributionControl={false}
          >
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              maxZoom={19}
              minZoom={13}
            />

            {/* User Position with new marker */}
            <Marker position={userPosition} icon={currentLocationMarker}>
              <Popup>You are here</Popup>
            </Marker>

            {/* Treasure Markers with active state */}
            {treasures.map((treasure) => (
              <Marker
                key={treasure.id}
                position={treasure.position}
                icon={
                  selectedTreasure?.id === treasure.id
                    ? activeTreasureMarker
                    : treasureMarker
                }
                eventHandlers={{
                  click: () => handleTreasureClick(treasure),
                }}
              >
                {/* <Popup>
                  <div className="treasure-popup">
                    <h3>Treasure {treasure.id}</h3>
                    <p>{treasure.found ? "Found" : "Not Found"}</p>
                    <button
                      className="treasure-action-btn"
                      onClick={() => handleTreasureClick(treasure)}
                    >
                      {selectedTreasure?.id === treasure.id
                        ? "Hide Route"
                        : "Show Route"}
                    </button>
                  </div>
                </Popup> */}
              </Marker>
            ))}

            {/* Route Control */}
            {selectedTreasure && (
              <RouteControl
                start={userPosition}
                end={selectedTreasure.position}
              />
            )}
          </MapContainer>
        </div>

        {/* Camera View */}
        <div
          className={`camera-container ${
            activeView === "camera" ? "active" : ""
          }`}
        >
          <iframe
            // src="https://8thwall.8thwall.app/image-targets/"
            src="https://akashgaur.8thwall.app/markers/"
            title="Camera View"
            className="camera-webview"
            allow="camera"
          />
        </div>
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
        <button className="action-button idea-button" onClick={handleHintClick}>
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
      </div>
    </div>
  );
};

export default Home;
