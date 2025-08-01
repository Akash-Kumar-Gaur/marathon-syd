import React from "react";
import "./RewardPopup.css";

const RewardPopup = ({
  isOpen,
  onClose,
  onCollect,
  data: rewardData,
  isSavingTreasure,
}) => {
  if (!isOpen) return null;
  console.log("rewardData", rewardData);
  return (
    <div className="reward-popup-overlay" onClick={onClose}>
      <div className="reward-popup" onClick={(e) => e.stopPropagation()}>
        <div className="reward-header">
          <div className="reward-points">
            <span className="points-text">+10 Points</span>
          </div>
        </div>

        <div className="reward-content-container">
          <div className="reward-content">
            <img
              src={rewardData.image}
              alt="Product"
              className="reward-image"
            />
            {/* <h2 className="reward-title">{rewardData.title}</h2> */}
          </div>
          {/* <div className="reward-subtitle-container">
            <p className="reward-subtitle">{rewardData.offer}</p>
            <p className="reward-subtitle">{rewardData.address}</p>
          </div> */}
        </div>

        {isSavingTreasure ? (
          <button className="collect-button" onClick={onCollect} disabled>
            COLLECTING...
          </button>
        ) : (
          <button className="collect-button" onClick={onCollect}>
            COLLECT
          </button>
        )}
      </div>
    </div>
  );
};

export default RewardPopup;
