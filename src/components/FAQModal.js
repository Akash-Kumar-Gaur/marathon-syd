import React, { useState } from "react";
import "./FAQModal.css";

const FAQModal = ({ isOpen, onClose }) => {
  const [expandedItem, setExpandedItem] = useState(1); // Start with second item expanded

  const faqData = [
    {
      id: 1,
      question: "How do I find treasures?",
      answer:
        "Follow the route shown on the map and move closer to the treasure chest icon. If you're unsure about the exact location, refer to the hints provided. Once you're near, look for the AR poster, switch to camera mode, and scan the poster to unlock the treasure.",
    },
    {
      id: 2,
      question: "What is Augmented Reality (AR)?",
      answer:
        "Augmented Reality (AR) is a technology that overlays digital 3D graphics onto the real world using your phone or device camera, creating an interactive and immersive experience.",
    },
    {
      id: 3,
      question: "How do I scan AR posters?",
      answer:
        "Tap the camera icon next to the map. Once the camera opens, point it at the AR poster and scan it using your device. The treasure chest will appear through augmented reality.",
    },
    {
      id: 4,
      question: "How do I redeem the treasures?",
      answer:
        "All collected treasures appear in your profile. Visit the store section and use the unique code displayed with each treasure to redeem your offer.",
    },
    {
      id: 5,
      question: "How long are the treasures valid?",
      answer:
        "Each treasure or coupon comes with its own validity period. Please check the date mentioned on each item for details.",
    },
  ];

  const toggleItem = (id) => {
    setExpandedItem(expandedItem === id ? null : id);
  };

  if (!isOpen) return null;

  return (
    <div className="faq-modal-overlay" onClick={onClose}>
      <div className="faq-modal" onClick={(e) => e.stopPropagation()}>
        <div className="faq-header">
          <h2 className="faq-title">FAQs</h2>
          <p className="faq-subtitle">
            Click to view some frequently asked questions about the app
          </p>
        </div>

        <div className="faq-content">
          {faqData.map((item, index) => (
            <div key={item.id} className="faq-item">
              <button
                className="faq-question"
                onClick={() => toggleItem(item.id)}
              >
                <span className="question-text">{item.question}</span>
                <span
                  className={`chevron ${
                    expandedItem === item.id ? "expanded" : ""
                  }`}
                >
                  ▼
                </span>
              </button>
              {expandedItem === item.id && (
                <div className="faq-answer">
                  <p>{item.answer}</p>
                </div>
              )}
              {index < faqData.length - 1 && (
                <div className="faq-divider"></div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FAQModal;
