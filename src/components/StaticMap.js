import React from "react";
import "./StaticMap.css";

const StaticMap = ({
  center = [-33.8688, 151.2093],
  zoom = 15,
  markers = [],
  onMarkerClick,
  style = { height: "100%", width: "100%" },
}) => {
  // Convert coordinates to pixel positions on the static map
  const mapBounds = {
    north: -33.86,
    south: -33.88,
    east: 151.22,
    west: 151.2,
  };

  const mapSize = { width: 400, height: 400 };

  const latLngToPixel = (lat, lng) => {
    const x =
      ((lng - mapBounds.west) / (mapBounds.east - mapBounds.west)) *
      mapSize.width;
    const y =
      ((mapBounds.north - lat) / (mapBounds.north - mapBounds.south)) *
      mapSize.height;
    return { x, y };
  };

  return (
    <div className="static-map" style={style}>
      <div className="map-background">
        {/* You can replace this with your own static map image */}
        <div className="map-placeholder">
          <div className="map-overlay">
            <h3>Interactive Map</h3>
            <p>Map view with markers</p>
          </div>
        </div>

        {/* Render markers */}
        {markers.map((marker, index) => {
          const pixelPos = latLngToPixel(
            marker.position[1],
            marker.position[0]
          );
          return (
            <div
              key={marker.id || index}
              className={`static-marker ${marker.className || ""}`}
              style={{
                position: "absolute",
                left: `${pixelPos.x}px`,
                top: `${pixelPos.y}px`,
                transform: "translate(-50%, -50%)",
              }}
              onClick={() => onMarkerClick && onMarkerClick(marker)}
            >
              {marker.icon ? (
                <img src={marker.icon} alt={marker.title || "Marker"} />
              ) : (
                <div className="default-marker" />
              )}
              {marker.title && (
                <div className="marker-tooltip">{marker.title}</div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default StaticMap;
