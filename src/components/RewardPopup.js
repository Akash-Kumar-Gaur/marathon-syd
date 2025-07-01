import React from "react";
import "./RewardPopup.css";

const RewardPopup = ({ isOpen, onClose, onCollect, rewardData }) => {
  if (!isOpen) return null;

  return (
    <div className="reward-popup-overlay" onClick={onClose}>
      <div className="reward-popup" onClick={(e) => e.stopPropagation()}>
        <div className="reward-header">
          <div className="reward-points">
            <span className="points-text">{rewardData.points}</span>
          </div>
        </div>

        <div className="reward-content-container">
          <div className="reward-content">
            <img
              src={rewardData.productImage}
              alt="Product"
              className="reward-image"
            />
            <h2 className="reward-title">{rewardData.title}</h2>
          </div>
          <div className="reward-subtitle-container">
            <p className="reward-subtitle">{rewardData.subtitle}</p>
            <p className="reward-subtitle">{rewardData.subtitle2}</p>
          </div>
        </div>

        <button className="collect-button" onClick={onCollect}>
          COLLECT
        </button>
      </div>
    </div>
  );
};

export default RewardPopup;
