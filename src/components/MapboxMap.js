import React, { useState, useCallback } from "react";
import {
  Map,
  Marker,
  Popup,
  NavigationControl,
  Source,
  Layer,
} from "react-map-gl/mapbox";
import "mapbox-gl/dist/mapbox-gl.css";
import "./MapboxMap.css";
import RouteSource from "./RouteSource";

// You'll need to get a free Mapbox access token from https://account.mapbox.com/
const MAPBOX_ACCESS_TOKEN =
  "pk.eyJ1IjoiYWs0NWhoaCIsImEiOiJjbWQ4Z3JxNHowMDNtMndxeGFudDVjdnExIn0.nuEfmn0U6SbyiFI_T_rnTg"; // Replace with your token

const MapboxMap = ({
  center = [-74.5, 40],
  zoom = 9,
  markers = [],
  onMarkerClick,
  onMapMove,
  showRoute = false,
  routeStart = null,
  routeEnd = null,
  style = { height: "100%", width: "100%" },
}) => {
  const [viewState, setViewState] = useState({
    longitude: center[0],
    latitude: center[1],
    zoom: zoom,
  });

  const [popupInfo, setPopupInfo] = useState(null);
  const [mapError, setMapError] = useState(null);
  const [isMapLoading, setIsMapLoading] = useState(true);

  const onMove = useCallback(
    (evt) => {
      setViewState(evt.viewState);
      // Call onMapMove callback with new center coordinates
      if (onMapMove) {
        onMapMove([evt.viewState.longitude, evt.viewState.latitude]);
      }
    },
    [onMapMove]
  );

  const handleMarkerClick = useCallback(
    (event, marker) => {
      event.originalEvent.stopPropagation();
      // Only show popup for user marker, not treasure markers
      if (marker.id === "user") {
        setPopupInfo(null);
      } else {
        setPopupInfo(null);
      }
      if (onMarkerClick) {
        onMarkerClick(marker);
      }
    },
    [onMarkerClick]
  );

  return (
    <Map
      {...viewState}
      onMove={onMove}
      style={style}
      mapStyle="mapbox://styles/mapbox/light-v11"
      mapboxAccessToken={MAPBOX_ACCESS_TOKEN}
      onLoad={() => {
        setIsMapLoading(false);
        setMapError(null);
        console.log("Map loaded successfully");
      }}
      onError={(error) => {
        console.error("Mapbox error:", error);
        setMapError(error);
        setIsMapLoading(false);
      }}
      // iOS-specific optimizations
      attributionControl={false}
      preserveDrawingBuffer={false}
      antialias={false}
      maxZoom={18}
      minZoom={3}
    >
      {/* NavigationControl removed to hide default Mapbox controls */}

      {markers.map((marker, index) => (
        <Marker
          key={marker.id || index}
          longitude={marker.position[0]}
          latitude={marker.position[1]}
          anchor="bottom"
          onClick={(event) => handleMarkerClick(event, marker)}
        >
          <div className={`marker ${marker.className || ""}`}>
            {marker.icon ? (
              <img src={marker.icon} alt={marker.title || "Marker"} />
            ) : (
              <div className="default-marker" />
            )}
          </div>
        </Marker>
      ))}

      {popupInfo && (
        <Popup
          anchor="top"
          longitude={popupInfo.position[0]}
          latitude={popupInfo.position[1]}
          onClose={() => setPopupInfo(null)}
          closeOnClick={false}
        >
          <div className="popup-content-data">
            <h3>{popupInfo.title}</h3>
            {popupInfo.description && <p>{popupInfo.description}</p>}
            {popupInfo.content && popupInfo.content}
          </div>
        </Popup>
      )}

      {showRoute && routeStart && routeEnd && (
        <RouteSource
          start={routeStart}
          end={routeEnd}
          onRouteFound={(routeData) => {
            console.log("Route found:", routeData);
          }}
        />
      )}

      {/* Loading overlay */}
      {isMapLoading && (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(255, 255, 255, 0.8)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
        >
          <div style={{ textAlign: "center" }}>
            <div
              style={{
                width: "40px",
                height: "40px",
                border: "4px solid #f3f3f3",
                borderTop: "4px solid #3498db",
                borderRadius: "50%",
                animation: "spin 1s linear infinite",
                margin: "0 auto 10px",
              }}
            ></div>
            <p>Loading map...</p>
          </div>
        </div>
      )}

      {/* Error overlay */}
      {mapError && (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(255, 255, 255, 0.9)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
        >
          <div style={{ textAlign: "center", padding: "20px" }}>
            <h3>Map Loading Error</h3>
            <p>
              Unable to load the map. Please check your internet connection and
              try again.
            </p>
            <div
              style={{
                backgroundColor: "#f8f9fa",
                border: "1px solid #dee2e6",
                borderRadius: "5px",
                padding: "10px",
                margin: "10px 0",
                fontSize: "12px",
                fontFamily: "monospace",
                textAlign: "left",
                maxHeight: "100px",
                overflow: "auto",
              }}
            >
              <strong>Error Details:</strong>
              <br />
              {mapError?.message || mapError?.toString() || "Unknown error"}
            </div>
            <button
              onClick={() => window.location.reload()}
              style={{
                padding: "10px 20px",
                backgroundColor: "#3498db",
                color: "white",
                border: "none",
                borderRadius: "5px",
                cursor: "pointer",
                marginTop: "10px",
              }}
            >
              Retry
            </button>
          </div>
        </div>
      )}
    </Map>
  );
};

export default MapboxMap;
