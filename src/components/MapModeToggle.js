import React from "react";
import "./MapModeToggle.css";

const MapModeToggle = ({ isLive, onToggle }) => {
  return (
    <button
      className={`map-mode-toggle ${isLive ? "live" : ""}`}
      onClick={onToggle}
    >
      <div className="toggle-switch">
        <span className="mode-label static">STATIC</span>
        <span className="mode-label live">LIVE</span>
        <div className="toggle-circle"></div>
      </div>
    </button>
  );
};

export default MapModeToggle;
