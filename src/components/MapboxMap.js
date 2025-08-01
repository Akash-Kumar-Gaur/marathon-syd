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
    </Map>
  );
};

export default MapboxMap;
