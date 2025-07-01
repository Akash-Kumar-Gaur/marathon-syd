import React from "react";
import "./HintModal.css";
import hintIcon from "../assets/images/hintIcon.png";

const HintModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="hint-modal-overlay" onClick={onClose}>
      <div className="hint-modal" onClick={(e) => e.stopPropagation()}>
        <h2 className="hint-title">Hint</h2>
        <div className="hint-icon">
          <img src={hintIcon} alt="Hint" />
        </div>
        <p className="hint-message">
          Head to where runners re-energize, look for a banner with bold goals
          and bold flavors.
        </p>
      </div>
    </div>
  );
};

export default HintModal;
