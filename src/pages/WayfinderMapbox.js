import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Map, Marker, Popup, NavigationControl } from "react-map-gl/mapbox";
import "mapbox-gl/dist/mapbox-gl.css";
import "./Wayfinder.css";
import Header from "../components/Header";
import RouteSource from "../components/RouteSource";
import { getCachedDistance } from "../services/firebase";

const MAPBOX_ACCESS_TOKEN =
  "pk.eyJ1IjoiYWs0NWhoaCIsImEiOiJjbWQ4Z3JxNHowMDNtMndxeGFudDVjdnExIn0.nuEfmn0U6SbyiFI_T_rnTg"; // Replace with your token

// BIB Registry (simplified version of what we discussed)
const BIB_REGISTRY = {
  1001: {
    assemblyPoint: "Green Assembly Entry",
    startingPoint: "Crows Nest Metro Station",
    routes: {
      primary: { id: "CN-G1", name: "Pacific Hwy Path", closureTime: "07:30" },
      secondary: { id: "CN-G2", name: "Miller St Walk", closureTime: "08:00" },
    },
    assemblyCoordinates: [151.2102639, -33.8312477], // St Leonards Park coordinates - Mapbox uses [lng, lat]
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

  const [viewState, setViewState] = useState({
    longitude: 151.20741,
    latitude: -33.84115,
    zoom: 15,
  });

  const [userLocation, setUserLocation] = useState([151.20741, -33.84115]); // North Sydney coordinates - Mapbox uses [lng, lat]
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

  const [routeDistance, setRouteDistance] = useState(null);
  const [originalStartLocation, setOriginalStartLocation] = useState(null);
  const [cachedRoute, setCachedRoute] = useState(null);
  const [lastRouteUpdate, setLastRouteUpdate] = useState(0);
  const [routeStartLocation, setRouteStartLocation] = useState(null);
  const [routeEndLocation, setRouteEndLocation] = useState(null);

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
      // Center map on default location
      setViewState((prev) => ({
        ...prev,
        longitude: 151.20741,
        latitude: -33.84115,
      }));
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
            position.coords.longitude, // Mapbox uses [lng, lat]
            position.coords.latitude,
          ];
          setUserLocation(newLocation);
          setIsLoadingLocation(false);

          // Center map on current location
          setViewState((prev) => ({
            ...prev,
            longitude: newLocation[0],
            latitude: newLocation[1],
          }));
          console.log("Map centered on current location");
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

    // Store the original starting location for route calculation
    setOriginalStartLocation([...userLocation]);
    setLocationConfirmed(true);
  };

  // Continuous location tracking to update map marker - works when using current location
  useEffect(() => {
    let watchId;

    if (useCurrentLocation && locationConfirmed) {
      console.log("Starting continuous location tracking for map updates");
      watchId = navigator.geolocation.watchPosition(
        (position) => {
          const currentLat = position.coords.latitude;
          const currentLon = position.coords.longitude;
          const newLocation = [currentLon, currentLat];

          // Update user location on map
          setUserLocation(newLocation);

          // Check if route should be updated (throttled)
          if (showDirections && shouldUpdateRoute(newLocation)) {
            console.log("Updating route due to significant movement");
            setRouteStartLocation(newLocation);
            setRouteEndLocation(bibData.assemblyCoordinates);
            setLastRouteUpdate(Date.now());
          }

          console.log("Updated user location on map:", currentLat, currentLon);
        },
        (error) => {
          console.error("Error updating location on map:", error);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 30000,
        }
      );
    }

    return () => {
      if (watchId) {
        console.log("Stopping continuous location tracking");
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [useCurrentLocation, locationConfirmed, showDirections, bibData]);

  // Track user location to detect arrival - works for both current and default location
  useEffect(() => {
    let watchId;
    if (locationConfirmed && bibData && !hasArrived) {
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
    }

    return () => {
      if (watchId) {
        console.log("Stopping location tracking");
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [locationConfirmed, bibData, hasArrived]);

  const handleArrivalDone = () => {
    setHasArrived(false);
    // Could navigate to next screen or back to home
    // navigate("/");
  };

  // Function to check if route should be updated (throttled)
  const shouldUpdateRoute = (currentLocation) => {
    if (!routeStartLocation) return true;

    const now = Date.now();
    const timeSinceLastUpdate = now - lastRouteUpdate;

    // Only update route every 30 seconds or if user moved significantly (>200m)
    if (timeSinceLastUpdate < 30000) return false;

    const distanceFromLastUpdate = calculateDistance(
      currentLocation[1],
      currentLocation[0],
      routeStartLocation[1],
      routeStartLocation[0]
    );

    return distanceFromLastUpdate > 0.2; // 200 meters - more conservative
  };

  const handleDirectionsClick = () => {
    const newShowDirections = !showDirections;
    setShowDirections(newShowDirections);

    if (newShowDirections) {
      // When showing directions, center map to show both points
      const centerLng = (userLocation[0] + bibData.assemblyCoordinates[0]) / 2;
      const centerLat = (userLocation[1] + bibData.assemblyCoordinates[1]) / 2;

      // Calculate bounds to ensure both points are visible
      const lngDiff = Math.abs(
        userLocation[0] - bibData.assemblyCoordinates[0]
      );
      const latDiff = Math.abs(
        userLocation[1] - bibData.assemblyCoordinates[1]
      );
      const maxDiff = Math.max(lngDiff, latDiff);

      // Set zoom level based on distance between points
      let zoom = 15; // default zoom
      if (maxDiff > 0.01) zoom = 13; // if points are far apart
      if (maxDiff > 0.05) zoom = 11; // if points are very far apart

      setViewState((prev) => ({
        ...prev,
        longitude: centerLng,
        latitude: centerLat,
        zoom: zoom,
      }));

      // Set initial route locations when first showing directions
      setRouteStartLocation(userLocation);
      setRouteEndLocation(bibData.assemblyCoordinates);
      setLastRouteUpdate(Date.now());

      console.log("Map centered to show both start and end points");
    } else {
      // Reset route distance when hiding directions
      setRouteDistance(null);
      setRouteStartLocation(null);
      setRouteEndLocation(null);
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
    setUserLocation([result.lon, result.lat]); // Mapbox uses [lng, lat]
    setCustomLocation(result.display_name);
    setShowSearchResults(false);
    setSearchResults([]);

    // Center map on selected location
    setViewState((prev) => ({
      ...prev,
      longitude: result.lon,
      latitude: result.lat,
    }));
    console.log("Map centered on selected location");
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
        <Map
          {...viewState}
          onMove={(evt) => setViewState(evt.viewState)}
          style={{ height: "100%", width: "100%" }}
          mapStyle="mapbox://styles/mapbox/light-v11"
          mapboxAccessToken={MAPBOX_ACCESS_TOKEN}
        >
          <NavigationControl position="top-right" />

          {/* User Location Marker */}
          <Marker
            longitude={userLocation[0]}
            latitude={userLocation[1]}
            anchor="bottom"
          >
            <div className="current-location-marker">
              <div className="current-location-dot"></div>
              <div className="current-location-pulse"></div>
            </div>
          </Marker>

          {/* Assembly Point Marker - show after location confirmation */}
          {bibData && locationConfirmed && (
            <Marker
              longitude={bibData.assemblyCoordinates[0]}
              latitude={bibData.assemblyCoordinates[1]}
              anchor="bottom"
            >
              <div className="assembly-point-marker">
                <div className="assembly-point-icon"></div>
              </div>
              <Popup
                anchor="top"
                longitude={bibData.assemblyCoordinates[0]}
                latitude={bibData.assemblyCoordinates[1]}
              >
                <div>
                  <strong>{bibData.assemblyPoint}</strong>
                  <br />
                  Route: {selectedRoute?.name}
                </div>
              </Popup>
            </Marker>
          )}

          {/* Route Control - show path only after directions button clicked */}
          {bibData &&
            locationConfirmed &&
            showDirections &&
            routeStartLocation &&
            routeEndLocation && (
              <RouteSource
                start={routeStartLocation}
                end={routeEndLocation}
                onRouteFound={(routeData) => {
                  console.log("Route found:", routeData);
                  if (routeData && routeData.distance) {
                    setRouteDistance(routeData.distance);
                  }
                }}
              />
            )}
        </Map>
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
                // Show current route distance (updates as user moves)
                const currentDistance =
                  routeDistance ||
                  calculateDistance(
                    userLocation[1], // lat
                    userLocation[0], // lng
                    bibData.assemblyCoordinates[1], // lat
                    bibData.assemblyCoordinates[0] // lng
                  );
                return currentDistance.toFixed(1);
              })()}{" "}
              km (~
              {(() => {
                // Show current route time
                const currentDistance =
                  routeDistance ||
                  calculateDistance(
                    userLocation[1], // lat
                    userLocation[0], // lng
                    bibData.assemblyCoordinates[1], // lat
                    bibData.assemblyCoordinates[0] // lng
                  );
                return Math.round(currentDistance * 12);
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
