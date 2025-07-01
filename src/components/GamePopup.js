import React from "react";

const GamePopup = ({ isOpen, onClose, children }) => {
  if (!isOpen) return null;
  return (
    <div
      style={{
        position: "fixed",
        zIndex: 10010,
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(0,0,0,0.4)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          background: "#EAF7FC",
          borderRadius: 20,
          minWidth: 320,
          maxWidth: 400,
          padding: 16,
          boxShadow: "0 4px 32px rgba(0,0,0,0.12)",
          textAlign: "center",
          position: "relative",
        }}
      >
        <button
          style={{
            position: "absolute",
            top: 16,
            right: 16,
            background: "none",
            border: "none",
            fontSize: 24,
            cursor: "pointer",
          }}
          onClick={onClose}
          aria-label="Close"
        >
          ×
        </button>
        {children}
      </div>
    </div>
  );
};

export default GamePopup;
