import React from "react";
import "./FirstRewardPopup.css";

const FirstRewardPopup = ({ isOpen, onClose, onCollect, rewardData }) => {
  if (!isOpen) return null;

  return (
    <div className="first-reward-overlay" onClick={onClose}>
      <div className="first-reward-modal" onClick={(e) => e.stopPropagation()}>
        <div className="first-reward-header">
          <h2 className="first-reward-title">{rewardData.name}</h2>
        </div>
        <div className="first-reward-image-container">
          <img
            src={rewardData.image}
            alt={rewardData.name}
            className="first-reward-image"
          />
        </div>

        <div className="first-reward-content">
          <div className="first-reward-description">
            <p>{rewardData.offer}</p>
          </div>
        </div>

        <div className="first-reward-actions">
          <button className="first-reward-collect-button" onClick={onCollect}>
            COLLECT
          </button>
        </div>
      </div>
    </div>
  );
};

export default FirstRewardPopup;
