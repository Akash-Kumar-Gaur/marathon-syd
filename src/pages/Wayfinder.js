import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-routing-machine/dist/leaflet-routing-machine.css";
import L from "leaflet";
import "./Wayfinder.css";
import Header from "../components/Header";
import RouteControl from "../components/RouteControl";
import { getCachedDistance } from "../services/firebase";

// Fix for default marker icons in react-leaflet (exactly like Home.js)
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require("leaflet/dist/images/marker-icon-2x.png"),
  iconUrl: require("leaflet/dist/images/marker-icon.png"),
  shadowUrl: require("leaflet/dist/images/marker-shadow.png"),
});

// Custom markers
const currentLocationMarker = new L.DivIcon({
  className: "current-location-marker",
  html: `
    <div class="current-location-dot"></div>
    <div class="current-location-pulse"></div>
  `,
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

const assemblyPointMarker = new L.DivIcon({
  className: "assembly-point-marker",
  html: `
    <div class="assembly-point-icon"></div>
  `,
  iconSize: [40, 40],
  iconAnchor: [20, 40],
});

// BIB Registry (simplified version of what we discussed)
const BIB_REGISTRY = {
  1001: {
    assemblyPoint: "Green Assembly Entry",
    startingPoint: "Crows Nest Metro Station",
    routes: {
      primary: { id: "CN-G1", name: "Pacific Hwy Path", closureTime: "07:30" },
      secondary: { id: "CN-G2", name: "Miller St Walk", closureTime: "08:00" },
    },
    assemblyCoordinates: [-33.8312477, 151.2102639], // St Leonards Park coordinates
  },
  1002: {
    assemblyPoint: "Red Assembly Entry 1",
    startingPoint: "North Sydney Station",
    routes: {
      primary: { id: "NS-R1", name: "Blue St Walk", closureTime: "07:00" },
      secondary: { id: "NS-R2", name: "Mount St Path", closureTime: "07:45" },
    },
    assemblyCoordinates: [-33.8312477, 151.2102639], // St Leonards Park coordinates
  },
  1003: {
    assemblyPoint: "Orange Assembly Entry",
    startingPoint: "Victoria Cross Metro Station",
    routes: {
      primary: { id: "VC-O1", name: "Denison St Walk", closureTime: "06:30" },
      secondary: { id: "VC-O2", name: "Berry St Path", closureTime: "07:15" },
    },
    assemblyCoordinates: [-33.8312477, 151.2102639], // St Leonards Park coordinates
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

// Route via points for specific named routes - optimized for direct routing
const routeViaPoints = {
  "NS-R1": [], // Blue St Walk - let routing choose best path
  "NS-R2": [], // Mount St Path - let routing choose best path
  "CN-G1": [], // Pacific Hwy Path - direct route
  "CN-G2": [], // Miller St Walk - direct route (no via points to avoid loops)
  "VC-O1": [], // Denison St Walk - direct route
  "VC-O2": [], // Berry St Path - direct route
};

const Wayfinder = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const bibNumber = location.state?.bibNumber;
  const mapRef = useRef(null);

  const [center] = useState([-33.84115, 151.20741]); // Fixed map center - North Sydney
  const [userLocation, setUserLocation] = useState([-33.84115, 151.20741]); // North Sydney coordinates from Google Maps
  const [customLocation, setCustomLocation] = useState("");
  const [useCurrentLocation, setUseCurrentLocation] = useState(false); // Changed to false by default
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
  const [routeDistance, setRouteDistance] = useState(null); // Store actual route distance

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
      setUserLocation([-33.84115, 151.20741]);
      // Reset loading state when unchecking current location
      setIsLoadingLocation(false);
      // Center map on default location
      if (mapRef.current) {
        mapRef.current.setView([-33.84115, 151.20741], 15);
      }
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
            position.coords.latitude,
            position.coords.longitude,
          ];
          setUserLocation(newLocation);
          setIsLoadingLocation(false);

          // Center map on current location
          if (mapRef.current) {
            mapRef.current.setView(newLocation, 15);
            console.log("Map centered on current location");
          }
        },
        (error) => {
          console.error("Error getting location:", error);
          console.log("Falling back to default North Sydney location");
          // Reset to North Sydney if geolocation fails
          setUserLocation([-33.84115, 151.20741]);
          setIsLoadingLocation(false);
        }
      );
    } else {
      console.log(
        "Geolocation not supported, using default North Sydney location"
      );
      setUserLocation([-33.84115, 151.20741]);
      setIsLoadingLocation(false);
    }
  };

  // Calculate distance between two coordinates (using cached version)
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    return getCachedDistance([lon1, lat1], [lon2, lat2]);
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
            bibData.assemblyCoordinates[0],
            bibData.assemblyCoordinates[1]
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
    setUserLocation([result.lat, result.lon]);
    setCustomLocation(result.display_name);
    setShowSearchResults(false);
    setSearchResults([]);

    // Center map on selected location
    if (mapRef.current) {
      mapRef.current.setView([result.lat, result.lon], 15);
      console.log("Map centered on selected location");
    }
  };

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
        <MapContainer
          ref={mapRef}
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

          {/* User Location Marker */}
          <Marker position={userLocation} icon={currentLocationMarker}>
            <Popup>Your Current Location</Popup>
          </Marker>

          {/* Assembly Point Marker - show after location confirmation */}
          {bibData && locationConfirmed && (
            <Marker
              position={bibData.assemblyCoordinates}
              icon={assemblyPointMarker}
            >
              <Popup>
                <div>
                  <strong>{bibData.assemblyPoint}</strong>
                  <br />
                  Route: {selectedRoute?.name}
                </div>
              </Popup>
            </Marker>
          )}

          {/* Route Control - show path only after directions button clicked */}
          {bibData && locationConfirmed && showDirections && (
            <RouteControl
              start={userLocation}
              end={bibData.assemblyCoordinates}
              viaPoints={routeViaPoints[selectedRoute?.id] || []}
              animate={true}
              onRouteFound={(distance) => setRouteDistance(distance)}
              onRoutePlotted={() =>
                console.log("Route plotted, map will recenter")
              }
            />
          )}
        </MapContainer>
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

          {/* Route Info */}
          {/* {selectedRoute && (
            <div className="route-info">
              <p>
                <strong>Assembly Point:</strong> {bibData.assemblyPoint}
              </p>
              <p>
                <strong>Selected Route:</strong> {selectedRoute.name}
              </p>
              <p>
                <strong>Route Type:</strong> {selectedRoute.type}
              </p>
            </div>
          )} */}
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
                    userLocation[0],
                    userLocation[1],
                    bibData.assemblyCoordinates[0],
                    bibData.assemblyCoordinates[1]
                  );
                return distance.toFixed(1);
              })()}{" "}
              km (~
              {(() => {
                // Use actual route distance for time calculation if available
                const distance =
                  routeDistance ||
                  calculateDistance(
                    userLocation[0],
                    userLocation[1],
                    bibData.assemblyCoordinates[0],
                    bibData.assemblyCoordinates[1]
                  );
                return Math.round(distance * 12);
              })()}{" "}
              min walk)
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
