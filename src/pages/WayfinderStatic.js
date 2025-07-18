import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import StaticMap from "../components/StaticMap";
import "./Wayfinder.css";
import Header from "../components/Header";

// BIB Registry (simplified version of what we discussed)
const BIB_REGISTRY = {
  1001: {
    assemblyPoint: "Green Assembly Entry",
    startingPoint: "Crows Nest Metro Station",
    routes: {
      primary: { id: "CN-G1", name: "Pacific Hwy Path", closureTime: "07:30" },
      secondary: { id: "CN-G2", name: "Miller St Walk", closureTime: "08:00" },
    },
    assemblyCoordinates: [151.2102639, -33.8312477], // St Leonards Park coordinates
  },
  1002: {
    assemblyPoint: "Red Assembly Entry 1",
    startingPoint: "North Sydney Station",
    routes: {
      primary: { id: "NS-R1", name: "Blue St Walk", closureTime: "07:00" },
      secondary: { id: "NS-R2", name: "Mount St Path", closureTime: "07:45" },
    },
    assemblyCoordinates: [151.2102639, -33.8312477], // St Leonards Park coordinates
  },
  1003: {
    assemblyPoint: "Orange Assembly Entry",
    startingPoint: "Victoria Cross Metro Station",
    routes: {
      primary: { id: "VC-O1", name: "Denison St Walk", closureTime: "06:30" },
      secondary: { id: "VC-O2", name: "Berry St Path", closureTime: "07:15" },
    },
    assemblyCoordinates: [151.2102639, -33.8312477], // St Leonards Park coordinates
  },
};

// Route selection logic
const getSelectedRoute = (bibNumber) => {
  const data = BIB_REGISTRY[bibNumber];
  if (!data) return null;

  // Simple odd/even logic for route selection
  const isPrimary = bibNumber % 2 === 0;
  const route = isPrimary ? data.routes.primary : data.routes.secondary;

  // Add route type to the returned object
  return {
    ...route,
    type: isPrimary ? "Primary" : "Secondary",
  };
};

const Wayfinder = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const bibNumber = location.state?.bibNumber;

  const [userLocation, setUserLocation] = useState([151.20741, -33.84115]); // North Sydney coordinates
  const [customLocation, setCustomLocation] = useState("");
  const [useCurrentLocation, setUseCurrentLocation] = useState(false);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [isSearchingLocation, setIsSearchingLocation] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [bibData, setBibData] = useState(null);
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [locationConfirmed, setLocationConfirmed] = useState(false);
  const [hasArrived, setHasArrived] = useState(false);
  const [isTrackingLocation, setIsTrackingLocation] = useState(false);
  const [showDirections, setShowDirections] = useState(false);
  const [showArrivalModal, setShowArrivalModal] = useState(false);
  const [routeDistance, setRouteDistance] = useState(null);

  useEffect(() => {
    if (bibNumber) {
      const data = BIB_REGISTRY[bibNumber];
      const route = getSelectedRoute(bibNumber);
      setBibData(data);
      setSelectedRoute(route);
    }
  }, [bibNumber]);

  useEffect(() => {
    if (useCurrentLocation) {
      console.log("Checkbox checked - getting current location");
      getCurrentLocation();
    } else {
      console.log("Checkbox unchecked - using default North Sydney location");
      // Always reset to North Sydney when not using current location
      setUserLocation([151.20741, -33.84115]);
      // Reset loading state when unchecking current location
      setIsLoadingLocation(false);
    }
  }, [useCurrentLocation]);

  const getCurrentLocation = () => {
    setIsLoadingLocation(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          console.log(
            "Got current location:",
            position.coords.latitude,
            position.coords.longitude
          );
          const newLocation = [
            position.coords.longitude,
            position.coords.latitude,
          ];
          setUserLocation(newLocation);
          setIsLoadingLocation(false);
          console.log("Location updated to current position");
        },
        (error) => {
          console.error("Error getting location:", error);
          console.log("Falling back to default North Sydney location");
          // Reset to North Sydney if geolocation fails
          setUserLocation([151.20741, -33.84115]);
          setIsLoadingLocation(false);
        }
      );
    } else {
      console.log(
        "Geolocation not supported, using default North Sydney location"
      );
      setUserLocation([151.20741, -33.84115]);
      setIsLoadingLocation(false);
    }
  };

  // Calculate distance between two coordinates
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Radius of the Earth in kilometers
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in kilometers
  };

  const handleConfirm = () => {
    if (!bibData || !selectedRoute) {
      alert("BIB data not found. Please go back and try again.");
      return;
    }

    // If using custom location input (optional), log it
    if (!useCurrentLocation && customLocation.trim()) {
      console.log(
        "Using custom location input:",
        customLocation,
        "(with default coordinates)"
      );
    } else if (!useCurrentLocation) {
      console.log("Using default North Sydney location");
    }

    setLocationConfirmed(true);
    setIsTrackingLocation(true);
  };

  // Track user location to detect arrival - only if using current location
  useEffect(() => {
    let watchId;

    if (isTrackingLocation && bibData && !hasArrived && useCurrentLocation) {
      console.log("Starting location tracking for arrival detection");
      watchId = navigator.geolocation.watchPosition(
        (position) => {
          const currentLat = position.coords.latitude;
          const currentLon = position.coords.longitude;
          const distance = calculateDistance(
            currentLat,
            currentLon,
            bibData.assemblyCoordinates[1], // lat
            bibData.assemblyCoordinates[0] // lng
          );

          console.log(
            "Current distance to assembly:",
            distance.toFixed(3),
            "km"
          );

          // If within 50 meters (0.05 km) of assembly point
          if (distance <= 0.05) {
            console.log("Arrived at assembly point!");
            setHasArrived(true);
            setIsTrackingLocation(false);
          }
        },
        (error) => {
          console.error("Error tracking location:", error);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 30000,
        }
      );
    } else if (isTrackingLocation && !useCurrentLocation) {
      console.log("Location tracking disabled - using default location");
      setIsTrackingLocation(false);
    }

    return () => {
      if (watchId) {
        console.log("Stopping location tracking");
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [isTrackingLocation, bibData, hasArrived, useCurrentLocation]);

  const handleArrivalDone = () => {
    setHasArrived(false);
    // Could navigate to next screen or back to home
    // navigate("/");
  };

  const handleDirectionsClick = () => {
    setShowDirections(!showDirections);
    // Reset route distance when hiding directions
    if (showDirections) {
      setRouteDistance(null);
    }
  };

  const handleLocationTypeChange = (e) => {
    setCustomLocation(e.target.value);
  };

  // Geocoding function to search for locations
  const searchLocation = async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    setIsSearchingLocation(true);
    try {
      // Using OpenStreetMap Nominatim API for geocoding
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          query
        )}&limit=5&addressdetails=1&countrycodes=au`
      );
      const data = await response.json();

      const results = data.map((item) => ({
        display_name: item.display_name,
        lat: parseFloat(item.lat),
        lon: parseFloat(item.lon),
        type: item.type,
      }));

      setSearchResults(results);
      setShowSearchResults(true);
    } catch (error) {
      console.error("Error searching location:", error);
      setSearchResults([]);
    } finally {
      setIsSearchingLocation(false);
    }
  };

  // Handle location search with debouncing
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (customLocation.trim() && !useCurrentLocation) {
        searchLocation(customLocation);
      } else {
        setSearchResults([]);
        setShowSearchResults(false);
      }
    }, 500); // 500ms delay

    return () => clearTimeout(timeoutId);
  }, [customLocation, useCurrentLocation]);

  // Handle selecting a search result
  const handleLocationSelect = (result) => {
    console.log(
      "Selected location:",
      result.display_name,
      "at",
      result.lat,
      result.lon
    );
    setUserLocation([result.lon, result.lat]);
    setCustomLocation(result.display_name);
    setShowSearchResults(false);
    setSearchResults([]);
    console.log("Location updated to selected position");
  };

  // Prepare markers for static map
  const mapMarkers = [
    // User location marker
    {
      id: "user",
      position: userLocation,
      title: "Your Current Location",
      className: "current-location-marker",
      content: (
        <div className="current-location-marker">
          <div className="current-location-dot"></div>
          <div className="current-location-pulse"></div>
        </div>
      ),
    },
    // Assembly point marker (show after location confirmation)
    ...(bibData && locationConfirmed
      ? [
          {
            id: "assembly",
            position: bibData.assemblyCoordinates,
            title: bibData.assemblyPoint,
            description: `Route: ${selectedRoute?.name}`,
            className: "assembly-point-marker",
            content: (
              <div className="assembly-point-marker">
                <div className="assembly-point-icon"></div>
              </div>
            ),
          },
        ]
      : []),
  ];

  if (!bibNumber || !bibData) {
    return (
      <div className="wayfinder-screen">
        <Header />
        <div className="error-container">
          <h2>No BIB Number Found</h2>
          <p>Please go back and enter your BIB number.</p>
          <button
            onClick={() => navigate("/find-my-route")}
            className="go-back-button"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="wayfinder-screen">
      <Header />

      {/* Map Container */}
      <div className="map-container">
        <StaticMap
          center={userLocation}
          markers={mapMarkers}
          onMarkerClick={(marker) => {
            if (marker.id === "assembly") {
              console.log("Assembly point clicked");
            }
          }}
        />
      </div>

      {/* Conditional Panel Rendering */}
      {!locationConfirmed ? (
        /* Location Confirmation Panel */
        <div className="location-panel">
          <h2 className="panel-title">Confirm Your Location</h2>

          <div className="location-options">
            <div className="location-option">
              <div className="location-option-content">
                <div className="location-icon">
                  <i className="fas fa-location-dot"></i>
                </div>
                <span className="location-text">Current Location</span>
              </div>
              <input
                type="checkbox"
                checked={useCurrentLocation}
                onChange={(e) => setUseCurrentLocation(e.target.checked)}
                className="location-checkbox"
              />
            </div>

            <div className="custom-location-input">
              <div className="search-icon">
                <i className="fas fa-search"></i>
              </div>
              <input
                type="text"
                placeholder="Search for your location..."
                value={customLocation}
                onChange={handleLocationTypeChange}
                className="location-input"
                disabled={useCurrentLocation}
              />
              {isSearchingLocation && (
                <div className="search-loading">
                  <i className="fas fa-spinner fa-spin"></i>
                </div>
              )}

              {/* Search Results Dropdown */}
              {showSearchResults && searchResults.length > 0 && (
                <div className="search-results">
                  {searchResults.map((result, index) => (
                    <div
                      key={index}
                      className="search-result-item"
                      onClick={() => handleLocationSelect(result)}
                    >
                      <i className="fas fa-map-marker-alt"></i>
                      <div className="result-details">
                        <div className="result-name">{result.display_name}</div>
                        <div className="result-type">{result.type}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <button
            className="confirm-button"
            onClick={handleConfirm}
            disabled={useCurrentLocation && isLoadingLocation}
          >
            {isLoadingLocation ? "GETTING LOCATION..." : "CONFIRM"}
          </button>
        </div>
      ) : (
        /* Assembly Point Information Panel */
        <div className="assembly-info-panel">
          <div className="assembly-header">
            <button
              className="close-button"
              onClick={() => setLocationConfirmed(false)}
            >
              ×
            </button>
            <div className="assembly-title">
              <i className="fas fa-location-dot assembly-icon"></i>
              <h2>{bibData.assemblyPoint}</h2>
            </div>
          </div>

          <div className="assembly-details">
            <div className="distance-info">
              Distance:{" "}
              {(() => {
                // Use actual route distance if available, otherwise use straight-line distance
                const distance =
                  routeDistance ||
                  calculateDistance(
                    userLocation[1], // lat
                    userLocation[0], // lng
                    bibData.assemblyCoordinates[1], // lat
                    bibData.assemblyCoordinates[0] // lng
                  );
                return distance.toFixed(1);
              })()}{" "}
              km (~
              {(() => {
                // Use actual route distance for time calculation if available
                const distance =
                  routeDistance ||
                  calculateDistance(
                    userLocation[1], // lat
                    userLocation[0], // lng
                    bibData.assemblyCoordinates[1], // lat
                    bibData.assemblyCoordinates[0] // lng
                  );
                return Math.round(distance * 12);
              })()}{" "}
              min walk) {routeDistance ? "(route)" : "(direct)"}
            </div>
            {showDirections && (
              <div className="route-status">
                <i className="fas fa-route"></i>
                Route displayed on map
              </div>
            )}
          </div>

          <div className="assembly-actions">
            <button
              className={`direction-button ${showDirections ? "active" : ""}`}
              onClick={handleDirectionsClick}
            >
              <i
                className={`fas ${
                  showDirections ? "fa-eye-slash" : "fa-directions"
                }`}
              ></i>
              {showDirections ? "HIDE ROUTE" : "DIRECTION"}
            </button>
            <button
              className="start-button"
              onClick={() => setHasArrived(true)}
            >
              <i className="fas fa-play"></i>
              START
            </button>
          </div>
        </div>
      )}

      {/* Arrival Confirmation Modal */}
      {hasArrived && (
        <div className="arrival-overlay">
          <div className="arrival-modal">
            <div className="arrival-header">
              <div className="arrival-icon">
                <i className="fas fa-check"></i>
              </div>
              <h2 className="arrival-title">You've arrived!</h2>
            </div>

            <div className="arrival-content">
              <h3 className="arrival-zone">{bibData?.assemblyPoint}</h3>
              <p className="arrival-description">
                You're now at your designated marathon starting area.
              </p>
            </div>

            <button className="arrival-done-button" onClick={handleArrivalDone}>
              <i className="fas fa-check"></i>
              DONE
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Wayfinder;
