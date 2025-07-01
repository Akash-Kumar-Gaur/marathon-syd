import React from "react";
import "./BoostScorePopup.css";
import boostBg from "../assets/images/boost.png";

const BoostScorePopup = ({ isOpen, onPlay, onSkip }) => {
  if (!isOpen) return null;

  return (
    <div className="boost-popup-overlay">
      <div
        className="boost-popup"
        style={{ backgroundImage: `url(${boostBg})` }}
      >
        <div className="boost-buttons">
          <button className="boost-btn primary" onClick={onPlay}>
            PLAY
          </button>
          <button className="boost-btn secondary" onClick={onSkip}>
            SKIP
          </button>
        </div>
      </div>
    </div>
  );
};

export default BoostScorePopup;
