import React from "react";
import "./HintModal.css";
import hintIcon from "../assets/images/hintIcon.png";

const HintModal = ({ isOpen, onClose, hint }) => {
  if (!isOpen) return null;

  return (
    <div className="hint-modal-overlay" onClick={onClose}>
      <div className="hint-modal" onClick={(e) => e.stopPropagation()}>
        <h2 className="hint-title">Hint</h2>
        <div className="hint-icon">
          <img src={hintIcon} alt="Hint" />
        </div>
        <p className="hint-message">
          {hint || "No hint available for this treasure."}
        </p>
      </div>
    </div>
  );
};

export default HintModal;
