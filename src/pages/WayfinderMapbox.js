import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Map, Marker, Popup } from "react-map-gl/mapbox";
import "mapbox-gl/dist/mapbox-gl.css";
import "./Wayfinder.css";
import Header from "../components/Header";
import RouteSource from "../components/RouteSource";
import { getCachedDistance } from "../services/firebase";
import { findParticipantByBIB } from "../wayfinder-data-index.js";
import { isCurrentlyInClosurePeriod } from "../time-utility.js";

const MAPBOX_ACCESS_TOKEN =
  "pk.eyJ1IjoiYWs0NWhoaCIsImEiOiJjbWQ4Z3JxNHowMDNtMndxeGFudDVjdnExIn0.nuEfmn0U6SbyiFI_T_rnTg"; // Replace with your token

// Utility function to convert coordinates from [lat, lng] to [lng, lat] for Mapbox
const convertToMapboxFormat = (coordinates) => {
  if (!coordinates || !Array.isArray(coordinates) || coordinates.length !== 2) {
    return null;
  }
  // Convert from [lat, lng] to [lng, lat] for Mapbox
  return [coordinates[1], coordinates[0]];
};

// Ultra-fast BIB lookup function using new chunked data
const getBibData = (bibNumber) => {
  return findParticipantByBIB(bibNumber);
};

// Route selection logic - updated for new data structure with 3 Ped Crossing routes
const getSelectedRoute = (bibNumber) => {
  const data = getBibData(bibNumber);
  if (!data) return null;

  // Check if any route is currently closed
  const isCurrentlyClosed = isCurrentlyInClosurePeriod(
    data.closureTimeStart,
    data.closureTimeEnd
  );

  if (isCurrentlyClosed) {
    return {
      id: `AVOID-${bibNumber}`,
      name: "Route Closed - Avoid Ped Crossings",
      coordinates: null,
      closureTime: "CLOSED",
      isClosed: true,
      type: "Closed",
    };
  }

  // Route assignment based on BIB number modulo 3
  const routeIndex = parseInt(bibNumber) % 3; // 0, 1, or 2

  let selectedRoute;
  let routeName;

  switch (routeIndex) {
    case 0:
      selectedRoute = data["Ped Crossing 1"];
      routeName = "Ped Crossing 1 Route";
      break;
    case 1:
      selectedRoute = data["Ped Crossing 2"];
      routeName = "Ped Crossing 2 Route";
      break;
    case 2:
      selectedRoute = data["Ped Crossing 3"];
      routeName = "Ped Crossing 3 Route";
      break;
    default:
      selectedRoute = data["Ped Crossing 1"]; // fallback
      routeName = "Ped Crossing 1 Route";
  }

  return {
    id: `PC${routeIndex + 1}-${bibNumber}`,
    name: routeName,
    coordinates: convertToMapboxFormat(selectedRoute),
    closureTime: data.closureTimeStart.split(", ")[routeIndex] || "Unknown",
    isClosed: false,
    type: `Ped Crossing ${routeIndex + 1}`,
    routeIndex: routeIndex,
  };
};

const Wayfinder = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const bibNumber = location.state?.bibNumber;

  const [viewState, setViewState] = useState({
    longitude: 151.2077778,
    latitude: -33.8358333,
    zoom: 15,
  });

  const [userLocation, setUserLocation] = useState([151.2077778, -33.8358333]); // Updated default location - Mapbox uses [lng, lat]
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
  const [lastRouteUpdate, setLastRouteUpdate] = useState(0);
  const [routeStartLocation, setRouteStartLocation] = useState(null);
  const [routeEndLocation, setRouteEndLocation] = useState(null);
  const [currentRouteLeg, setCurrentRouteLeg] = useState(null); // 'to-route-start' or 'to-assembly'
  const [showRouteSwitchNotification, setShowRouteSwitchNotification] =
    useState(false);
  const [showDebugRoute, setShowDebugRoute] = useState(false); // Debug: show original route from start to assembly

  // Collapsible sections state
  const [isRouteStatusCollapsed, setIsRouteStatusCollapsed] = useState(true);
  const [isStartingPointCollapsed, setIsStartingPointCollapsed] =
    useState(true);

  useEffect(() => {
    if (bibNumber) {
      const data = getBibData(bibNumber);
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
      console.log("Checkbox unchecked - using default simulated location");
      // Always reset to simulated location when not using current location
      setUserLocation([151.2077778, -33.8358333]);
      // Reset loading state when unchecking current location
      setIsLoadingLocation(false);
      // Center map on default location
      setViewState((prev) => ({
        ...prev,
        longitude: 151.2077778,
        latitude: -33.8358333,
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
          console.log("Falling back to default simulated location");
          // Reset to simulated location if geolocation fails
          setUserLocation([151.2077778, -33.8358333]);
          setIsLoadingLocation(false);
        }
      );
    } else {
      console.log(
        "Geolocation not supported, using default simulated location"
      );
      setUserLocation([151.2077778, -33.8358333]);
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
      console.log("Using default simulated location near route start");
    }

    setLocationConfirmed(true);
  };

  // Continuous location tracking - disabled for simulation
  // useEffect(() => {
  //   // Location tracking code removed for simulation
  // }, [useCurrentLocation, locationConfirmed, showDirections, bibData, currentRouteLeg]);

  // Track user location to detect arrival - disabled for simulation
  // useEffect(() => {
  //   // Arrival tracking code removed for simulation
  // }, [locationConfirmed, bibData, hasArrived]);

  const handleArrivalDone = () => {
    setHasArrived(false);
    // Could navigate to next screen or back to home
    // navigate("/");
  };

  // New function to handle smart routing based on user distance from assembly
  const handleSmartRouting = () => {
    if (!bibData || !userLocation) return;

    // Check if routes are currently closed
    if (selectedRoute?.isClosed) {
      console.log("Routes are currently closed - providing safety guidance");
      // When routes are closed, guide users to stay away from Ped Crossings
      // and provide alternative guidance to assembly point
      setRouteStartLocation(userLocation);
      setRouteEndLocation(convertToMapboxFormat(bibData.assemblyCoordinates));
      setCurrentRouteLeg("to-assembly-safety");
      setLastRouteUpdate(Date.now());
      return;
    }

    // Get converted coordinates for Mapbox format
    const assemblyCoords = convertToMapboxFormat(bibData.assemblyCoordinates);
    const routeStartCoords = convertToMapboxFormat(
      bibData.routeStartCoordinates
    );

    if (!assemblyCoords || !routeStartCoords) {
      console.error("Invalid coordinates in bibData");
      return;
    }

    // Calculate distance from user to assembly coordinates
    const distanceToAssembly = calculateDistance(
      userLocation[1], // lat
      userLocation[0], // lng
      assemblyCoords[1], // assembly lat
      assemblyCoords[0] // assembly lng
    );

    // Calculate distance from user to route start coordinates
    const distanceToRouteStart = calculateDistance(
      userLocation[1], // lat
      userLocation[0], // lng
      routeStartCoords[1], // route start lat
      routeStartCoords[0] // route start lng
    );

    console.log("Distance to assembly:", distanceToAssembly.toFixed(3), "km");
    console.log(
      "Distance to route start:",
      distanceToRouteStart.toFixed(3),
      "km"
    );

    // If user is within 400m (0.4 km) of assembly coordinates
    if (distanceToAssembly <= 0.4) {
      console.log(
        "User is within 400m of assembly - showing route directly to assembly"
      );
      // Show route from user location directly to assembly
      setRouteStartLocation(userLocation);
      setRouteEndLocation(assemblyCoords);
      setCurrentRouteLeg("to-assembly");
    } else if (distanceToRouteStart <= 0.05) {
      // If user is within 50m (0.05 km) of route start, they're essentially at the starting point
      console.log(
        `User is at starting point (${distanceToRouteStart.toFixed(
          3
        )} km away) - showing route directly to assembly`
      );
      // Show route from user location directly to assembly
      setRouteStartLocation(userLocation);
      setRouteEndLocation(assemblyCoords);
      setCurrentRouteLeg("to-assembly");
    } else {
      console.log(
        `User is far from both assembly (${distanceToAssembly.toFixed(
          3
        )} km) and starting point (${distanceToRouteStart.toFixed(
          3
        )} km) - showing route to starting point first`
      );
      // Show route from user location to route start point first
      // This will guide users to their assigned route start point
      setRouteStartLocation(userLocation);
      setRouteEndLocation(routeStartCoords);
      setCurrentRouteLeg("to-route-start");
    }

    setLastRouteUpdate(Date.now());
  };

  const handleDirectionsClick = () => {
    const newShowDirections = !showDirections;
    setShowDirections(newShowDirections);

    if (newShowDirections) {
      // Get converted coordinates for Mapbox format
      const assemblyCoords = convertToMapboxFormat(bibData.assemblyCoordinates);

      if (!assemblyCoords) {
        console.error("Invalid assembly coordinates in bibData");
        return;
      }

      // When showing directions, center map to show both points
      const centerLng = (userLocation[0] + assemblyCoords[0]) / 2;
      const centerLat = (userLocation[1] + assemblyCoords[1]) / 2;

      // Calculate bounds to ensure both points are visible
      const lngDiff = Math.abs(userLocation[0] - assemblyCoords[0]);
      const latDiff = Math.abs(userLocation[1] - assemblyCoords[1]);
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

      // Use smart routing logic instead of simple route
      handleSmartRouting();

      // For simulation: Check routing logic based on distance to assembly
      if (bibData) {
        const distanceToAssembly = calculateDistance(
          userLocation[1], // lat
          userLocation[0], // lng
          assemblyCoords[1], // assembly lat
          assemblyCoords[0] // assembly lng
        );

        const distanceToRouteStart = calculateDistance(
          userLocation[1], // lat
          userLocation[0], // lng
          convertToMapboxFormat(bibData.routeStartCoordinates)[1], // route start lat
          convertToMapboxFormat(bibData.routeStartCoordinates)[0] // route start lng
        );

        // Check if user is within 400m of assembly
        if (distanceToAssembly <= 0.4) {
          // Route should be: User → Assembly (direct route)
          setRouteStartLocation(userLocation);
          setRouteEndLocation(assemblyCoords);
          setCurrentRouteLeg("to-assembly");
          setLastRouteUpdate(Date.now());

          // Cache verification - this route should be cached
          console.log(
            "Route cache key:",
            `${userLocation[0]},${userLocation[1]}-${assemblyCoords[0]},${assemblyCoords[1]}`
          );
        } else if (distanceToRouteStart <= 0.05) {
          // If user is within 50m of route start, they're essentially at the starting point
          console.log(
            `User is at starting point (${distanceToRouteStart.toFixed(
              3
            )} km away) - showing route directly to assembly`
          );
          setRouteStartLocation(userLocation);
          setRouteEndLocation(assemblyCoords);
          setCurrentRouteLeg("to-assembly");
          setLastRouteUpdate(Date.now());
        } else {
          // Route should be: User → Route Start
          console.log(
            `User needs to go to starting point first (${distanceToRouteStart.toFixed(
              3
            )} km away)`
          );
          setRouteStartLocation(userLocation);
          setRouteEndLocation(
            convertToMapboxFormat(bibData.routeStartCoordinates)
          );
          setCurrentRouteLeg("to-route-start");
          setLastRouteUpdate(Date.now());
        }
      }

      console.log("Map centered to show both start and end points");
    } else {
      // Reset route distance when hiding directions
      setRouteDistance(null);
      setRouteStartLocation(null);
      setRouteEndLocation(null);
      setCurrentRouteLeg(null);
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

          {/* Route Start Point Marker - show after location confirmation */}
          {bibData &&
            locationConfirmed &&
            (() => {
              const routeStartCoords = convertToMapboxFormat(
                bibData.routeStartCoordinates
              );
              if (!routeStartCoords) return null;

              return (
                <Marker
                  longitude={routeStartCoords[0]}
                  latitude={routeStartCoords[1]}
                  anchor="bottom"
                >
                  <div className="route-start-marker">
                    <div className="route-start-icon"></div>
                  </div>
                  <Popup
                    anchor="top"
                    longitude={routeStartCoords[0]}
                    latitude={routeStartCoords[1]}
                  >
                    <div>
                      <strong>Route Start Point</strong>
                      <br />
                      {bibData.startingPoint}
                      <br />
                      Route: {selectedRoute?.name}
                    </div>
                  </Popup>
                </Marker>
              );
            })()}

          {/* Assembly Point Marker - show after location confirmation */}
          {bibData &&
            locationConfirmed &&
            (() => {
              const assemblyCoords = convertToMapboxFormat(
                bibData.assemblyCoordinates
              );
              if (!assemblyCoords) return null;

              return (
                <Marker
                  longitude={assemblyCoords[0]}
                  latitude={assemblyCoords[1]}
                  anchor="bottom"
                >
                  <div className="assembly-point-marker">
                    <div className="assembly-point-icon"></div>
                  </div>
                  <Popup
                    anchor="top"
                    longitude={assemblyCoords[0]}
                    latitude={assemblyCoords[1]}
                  >
                    <div>
                      <strong>{bibData.assemblyPoint}</strong>
                      <br />
                      Route: {selectedRoute?.name}
                    </div>
                  </Popup>
                </Marker>
              );
            })()}

          {/* Route Control - show path only after directions button clicked */}
          {bibData &&
            locationConfirmed &&
            showDirections &&
            routeStartLocation &&
            routeEndLocation && (
              <RouteSource
                sourceId="main-route"
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

          {/* Debug Route - show original route from start to assembly */}
          {bibData && locationConfirmed && showDirections && showDebugRoute && (
            <RouteSource
              sourceId="debug-route"
              start={bibData.routeStartCoordinates}
              end={bibData.assemblyCoordinates}
              isDebug={true}
              onRouteFound={(routeData) => {
                console.log("Debug route found:", routeData);
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

          {/* Route Status Information - Only show when heading to assembly */}
          {selectedRoute &&
            showDirections &&
            currentRouteLeg &&
            currentRouteLeg !== "to-route-start" && (
              <div className="route-status-info">
                <div
                  className="section-header"
                  onClick={() =>
                    setIsRouteStatusCollapsed(!isRouteStatusCollapsed)
                  }
                >
                  <span>Route Information</span>
                  <i
                    className={`fas fa-chevron-${
                      isRouteStatusCollapsed ? "down" : "up"
                    }`}
                  ></i>
                </div>

                {!isRouteStatusCollapsed && (
                  <>
                    {selectedRoute.isClosed ? (
                      <div className="route-closed-warning">
                        <i className="fas fa-exclamation-triangle"></i>
                        <span>⚠️ ALL ROUTES CLOSED - Avoid Ped Crossings</span>
                        <div className="closure-times">
                          Closure Times: {bibData.closureTimeStart} -{" "}
                          {bibData.closureTimeEnd}
                        </div>
                      </div>
                    ) : (
                      <div className="route-assignment">
                        <i className="fas fa-route"></i>
                        <span>Assigned Route: {selectedRoute.name}</span>
                        <div className="route-details">
                          <span>Type: {selectedRoute.type}</span>
                          <span>Closure: {selectedRoute.closureTime}</span>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

          {/* Starting Point Guidance - Show when heading to starting point */}
          {showDirections && currentRouteLeg === "to-route-start" && (
            <div className="starting-point-guidance">
              <div
                className="section-header"
                onClick={() =>
                  setIsStartingPointCollapsed(!isStartingPointCollapsed)
                }
              >
                <i
                  className={`fas fa-chevron-${
                    isStartingPointCollapsed ? "down" : "up"
                  }`}
                ></i>
                <span>Starting Point Guidance</span>
                <button className="collapse-toggle">
                  {isStartingPointCollapsed ? "Show" : "Hide"}
                </button>
              </div>

              {!isStartingPointCollapsed && (
                <>
                  <i className="fas fa-map-marker-alt"></i>
                  <span>
                    First, head to your assigned starting point to begin your
                    route
                  </span>
                </>
              )}
            </div>
          )}

          <div className="assembly-details">
            {/* Current Destination Indicator */}
            {showDirections && currentRouteLeg && (
              <div className="destination-indicator">
                <i
                  className={`fas ${
                    currentRouteLeg === "to-route-start"
                      ? "fa-map-marker-alt"
                      : currentRouteLeg === "to-assembly-safety"
                      ? "fa-shield-alt"
                      : "fa-flag-checkered"
                  }`}
                ></i>
                <span>
                  {currentRouteLeg === "to-route-start"
                    ? `Heading to: ${bibData.startingPoint}`
                    : currentRouteLeg === "to-assembly-safety"
                    ? `Safety Route to: ${bibData.assemblyPoint} (Avoid Ped Crossings)`
                    : `Heading to: ${bibData.assemblyPoint}`}
                </span>
              </div>
            )}

            <div className="distance-info">
              {selectedRoute?.isClosed ? (
                <div className="route-closed-distance">
                  <i className="fas fa-ban"></i>
                  <span>
                    Routes closed - maintain safe distance from Ped Crossings
                  </span>
                </div>
              ) : showDirections && currentRouteLeg ? (
                <>
                  {currentRouteLeg === "to-route-start" ? (
                    <>
                      Distance to Starting Point:{" "}
                      {(() => {
                        const distanceToStart = calculateDistance(
                          userLocation[1], // lat
                          userLocation[0], // lng
                          convertToMapboxFormat(
                            bibData.routeStartCoordinates
                          )[1], // route start lat
                          convertToMapboxFormat(
                            bibData.routeStartCoordinates
                          )[0] // route start lng
                        );
                        return distanceToStart.toFixed(1);
                      })()}{" "}
                      km (~
                      {(() => {
                        const distanceToStart = calculateDistance(
                          userLocation[1], // lat
                          userLocation[0], // lng
                          convertToMapboxFormat(
                            bibData.routeStartCoordinates
                          )[1], // route start lat
                          convertToMapboxFormat(
                            bibData.routeStartCoordinates
                          )[0] // route start lng
                        );
                        return Math.round(distanceToStart * 12);
                      })()}{" "}
                      min walk)
                    </>
                  ) : (
                    <>
                      Distance to Assembly:{" "}
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
                    </>
                  )}
                </>
              ) : (
                <>
                  Distance to Assembly:{" "}
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
                </>
              )}
            </div>
            {/* {showDirections && (
              <div className="route-status">
                <i className="fas fa-route"></i>
                Route displayed on map
              </div>
            )} */}
          </div>

          <div className="assembly-actions">
            <button
              className={`direction-button ${showDirections ? "active" : ""}`}
              onClick={handleDirectionsClick}
              disabled={selectedRoute?.isClosed}
              title={
                selectedRoute?.isClosed
                  ? "Routes are currently closed"
                  : "Show route directions"
              }
            >
              <i
                className={`fas ${
                  showDirections ? "fa-eye-slash" : "fa-directions"
                }`}
              ></i>
              {selectedRoute?.isClosed
                ? "ROUTES CLOSED"
                : showDirections
                ? "HIDE ROUTE"
                : "DIRECTION"}
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

      {/* Route Switch Notification */}
      {showRouteSwitchNotification && (
        <div className="route-switch-notification">
          <div className="notification-content">
            <i className="fas fa-route"></i>
            <span>Route updated! Now heading to assembly point.</span>
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
