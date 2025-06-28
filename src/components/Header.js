import React from "react";
import "./Header.css";
import logo from "../assets/images/syd-tcs-logo.png";

const Header = () => {
  const handleHelp = () => {
    // Handle help functionality
    console.log("Help clicked");
  };

  const handleTrophy = () => {
    console.log("Trophy clicked");
  };

  const handleNotifications = () => {
    console.log("Notifications clicked");
  };

  const handleMenu = () => {
    console.log("Menu clicked");
  };

  return (
    <header className="app-header">
      <div className="header-logo-container">
        <img src={logo} alt="TCS Sydney Marathon" className="header-logo" />
      </div>
      <div className="header-actions">
        <button className="icon-button" onClick={handleTrophy}>
          <i className="fas fa-trophy"></i>
        </button>
        <button className="icon-button" onClick={handleNotifications}>
          <i className="fas fa-bell"></i>
        </button>
        <button className="icon-button" onClick={handleMenu}>
          <i className="fas fa-bars"></i>
        </button>
        <button className="help-button" onClick={handleHelp}>
          HELP <span className="help-icon">?</span>
        </button>
      </div>
    </header>
  );
};

export default Header;
