import React, { useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import "./Home.css";
import Header from "../components/Header";
import sydTcsLogo from "../assets/images/syd-tcs-logo.png";

// Fix for default marker icons in react-leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require("leaflet/dist/images/marker-icon-2x.png"),
  iconUrl: require("leaflet/dist/images/marker-icon.png"),
  shadowUrl: require("leaflet/dist/images/marker-shadow.png"),
});

// Custom treasure chest icon
const treasureIcon = new L.Icon({
  iconUrl: "/treasure-chest.png", // You'll need to add this image
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
});

const Home = () => {
  const [center] = useState([-33.8688, 151.2093]); // Sydney coordinates
  const [treasures] = useState([
    { id: 1, position: [-33.8688, 151.2093], found: false },
    { id: 2, position: [-33.87, 151.2082], found: false },
    { id: 3, position: [-33.868, 151.21], found: false },
  ]);
  const [userPosition] = useState([-33.8688, 151.2093]);
  const [isLiveMap, setIsLiveMap] = useState(false);
  const [activeView, setActiveView] = useState("map"); // 'map' or 'camera'

  const pathCoordinates = [
    [-33.8688, 151.2093],
    [-33.87, 151.2082],
    [-33.868, 151.21],
  ];

  const toggleMapMode = () => {
    setIsLiveMap(!isLiveMap);
  };

  const toggleView = (view) => {
    setActiveView(view);
  };

  return (
    <div className="home-screen">
      <Header />

      {/* Stats Bar */}
      <div className="stats-bar">
        <div className="stat-item">
          <i className="fas fa-chest"></i>
          <span>0/10</span>
        </div>
        <div className="stat-item">
          <i className="fas fa-map-marker"></i>
          <span>500m</span>
        </div>
        <div className="stat-item">
          <i className="fas fa-coins"></i>
          <span>150 Pt</span>
        </div>
      </div>

      {/* Map Mode Toggle */}
      <button
        className={`map-mode-toggle ${isLiveMap ? "live" : "static"}`}
        onClick={toggleMapMode}
      >
        <span className="mode-label">{isLiveMap ? "LIVE" : "STATIC"}</span>
        <div className="toggle-switch">
          <div className="toggle-circle"></div>
        </div>
      </button>

      {/* Map Container */}
      <div className={`map-container ${activeView === "map" ? "active" : ""}`}>
        <MapContainer
          center={center}
          zoom={15}
          style={{ height: "100%", width: "100%" }}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />

          {/* User Position */}
          <Marker position={userPosition}>
            <Popup>You are here</Popup>
          </Marker>

          {/* Treasure Markers */}
          {treasures.map((treasure) => (
            <Marker
              key={treasure.id}
              position={treasure.position}
              icon={treasureIcon}
            >
              <Popup>
                Treasure {treasure.id}
                {treasure.found ? " (Found)" : ""}
              </Popup>
            </Marker>
          ))}

          {/* Path Line */}
          <Polyline
            positions={pathCoordinates}
            color="#3388ff"
            weight={3}
            opacity={0.6}
            dashArray="10, 10"
          />
        </MapContainer>
      </div>

      {/* Camera View Container */}
      <div
        className={`camera-container ${
          activeView === "camera" ? "active" : ""
        }`}
      >
        <div className="camera-placeholder">Camera View</div>
      </div>

      {/* Bottom Action Buttons */}
      <div className="bottom-actions">
        <div className="action-slider">
          <button
            className={`action-button ${activeView === "map" ? "active" : ""}`}
            onClick={() => toggleView("map")}
          >
            <i className="fas fa-location-dot"></i>
          </button>
          <button
            className={`action-button ${
              activeView === "camera" ? "active" : ""
            }`}
            onClick={() => toggleView("camera")}
          >
            <i className="fas fa-camera"></i>
          </button>
          <div className={`slider-background ${activeView}`}></div>
        </div>
      </div>
    </div>
  );
};

export default Home;
