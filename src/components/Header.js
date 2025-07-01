import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./Header.css";
import logo from "../assets/images/syd-tcs-logo.png";
import avatarDefault from "../assets/avatar/avatar.png";
import avatar1 from "../assets/avatar/avatar1.png";
import avatar2 from "../assets/avatar/avatar2.png";
import avatar3 from "../assets/avatar/avatar3.png";
import avatar4 from "../assets/avatar/avatar4.png";
import avatar5 from "../assets/avatar/avatar5.png";
import avatar6 from "../assets/avatar/avatar6.png";
import avatar7 from "../assets/avatar/avatar7.png";

const avatarMap = {
  1: avatar1,
  2: avatar2,
  3: avatar3,
  4: avatar4,
  5: avatar5,
  6: avatar6,
  7: avatar7,
  8: avatarDefault,
};

const Header = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const isHomePage = location.pathname === "/home";
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerClosing, setDrawerClosing] = useState(false);
  const [collapse, setCollapse] = useState({
    challenges: false,
    treasure: false,
  });
  const [userData, setUserData] = useState({
    name: "Akash Gaur",
    email: "akash@test.com",
    phone: "+61 412345678",
  });

  useEffect(() => {
    if (drawerOpen) {
      try {
        const stored = localStorage.getItem("userData");
        if (stored) {
          setUserData(JSON.parse(stored));
        } else {
          setUserData({ name: "", email: "", phone: "" });
        }
      } catch {
        setUserData({ name: "", email: "", phone: "" });
      }
    }
  }, [drawerOpen]);

  // Log navigation state changes
  useEffect(() => {
    console.log("Header - Current location:", location.pathname);
    console.log("Header - Location state:", location.state);
    console.log("Header - Full location object:", location);
  }, [location]);

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
    setDrawerOpen(true);
    setDrawerClosing(false);
  };

  const handleDrawerClose = () => {
    setDrawerClosing(true);
    setTimeout(() => {
      setDrawerOpen(false);
      setDrawerClosing(false);
    }, 300); // match the CSS animation duration
  };

  const handleBack = () => {
    console.log("Back button clicked from:", location.pathname);
    console.log("History length:", window.history.length);
    console.log("History state:", window.history.state);

    // Define explicit back navigation routes based on current location
    const backRoutes = {
      "/welcome": "/", // From welcome, go to splash/root
      "/hunt": "/welcome", // From hunt tutorial, go back to welcome
      "/home": "/hunt", // From home, go back to hunt tutorial (though this shouldn't show back button)
    };

    const targetRoute = backRoutes[location.pathname];

    if (targetRoute) {
      console.log("Navigating to explicit route:", targetRoute);
      navigate(targetRoute, { replace: true });
    } else {
      console.log("No explicit route found, trying navigate(-1)");
      // Fallback to navigate(-1) with a check
      const currentPath = location.pathname;
      navigate(-1);

      // Check if navigation actually happened after a short delay
      setTimeout(() => {
        if (window.location.pathname === currentPath) {
          console.log("navigate(-1) didn't work, falling back to root");
          navigate("/", { replace: true });
        }
      }, 100);
    }
  };

  const handleCollapse = (section) => {
    setCollapse({ ...collapse, [section]: !collapse[section] });
  };

  const handleSignOut = () => {
    // Implement sign out functionality
    console.log("Signing out");
  };

  // Avatar logic
  const avatarImg =
    userData.selectedAvatar && avatarMap[userData.selectedAvatar.id]
      ? avatarMap[userData.selectedAvatar.id]
      : avatar5;

  return (
    <>
      <header className="app-header">
        <div className="header-logo-container">
          {isHomePage ? (
            <img src={logo} alt="TCS Sydney Marathon" className="header-logo" />
          ) : (
            <button className="back-button" onClick={handleBack}>
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M15 18L9 12L15 6"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          )}
        </div>
        <div className="header-actions">
          {isHomePage ? (
            <>
              <button className="icon-button" onClick={handleTrophy}>
                <i className="fas fa-trophy"></i>
              </button>
              <button className="icon-button" onClick={handleMenu}>
                <i className="fas fa-bars"></i>
              </button>
            </>
          ) : null}
          {isHomePage ? null : (
            <button className="help-button" onClick={handleHelp}>
              HELP <span className="help-icon">?</span>
            </button>
          )}
        </div>
      </header>
      {drawerOpen && (
        <div className="drawer-overlay" onClick={handleDrawerClose}>
          <div
            className={`drawer${drawerClosing ? " drawer-closing" : ""}`}
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "#e6f4fa",
              display: "flex",
              flexDirection: "column",
              padding: 0,
            }}
          >
            <button className="drawer-close" onClick={handleDrawerClose}>
              &times;
            </button>
            <div
              className="drawer-profile"
              style={{
                padding: "32px 24px 16px 24px",
                display: "flex",
                alignItems: "center",
                gap: 10,
              }}
            >
              <img
                src={avatarImg}
                alt="avatar"
                className="drawer-avatar"
                style={{
                  width: 50,
                  height: 50,
                  borderRadius: "50%",
                  background: "#fff",
                  objectFit: "cover",
                }}
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = avatar5;
                }}
              />
              <div style={{ minWidth: 0 }}>
                <div
                  className="drawer-name"
                  style={{ fontWeight: 700, fontSize: 18, color: "#081F2D" }}
                >
                  {userData.name || "Akash Gaur"}
                </div>
                <div
                  className="drawer-email"
                  style={{
                    color: "#6D6D6D",
                    fontWeight: 500,
                    fontSize: 14,
                    wordBreak: "break-all",
                    whiteSpace: "normal",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {userData.email || "alex.johnson@example.com"}
                </div>
                <div
                  className="drawer-phone"
                  style={{ color: "#6D6D6D", fontWeight: 500, fontSize: 14 }}
                >
                  {userData.phone || "+61 9393020202"}
                </div>
              </div>
            </div>
            <div
              className="drawer-section"
              style={{ margin: "32px 0 0 0", padding: "0 24px" }}
            >
              {/* Challenges */}
              <div
                className="drawer-list-item"
                onClick={() => handleCollapse("challenges")}
                style={{
                  display: "flex",
                  alignItems: "center",
                  fontWeight: 700,
                  fontSize: 20,
                  color: "#0a2a3a",
                  cursor: "pointer",
                  gap: 16,
                  padding: "18px 0",
                }}
              >
                <i className="fas fa-th-large"></i>
                <span>CHALLENGES</span>
                <span
                  style={{ marginLeft: "auto", transition: "transform 0.2s" }}
                >
                  <i
                    className={`fas fa-chevron-down${
                      collapse.challenges ? " rotated" : ""
                    }`}
                  ></i>
                </span>
              </div>
              {collapse.challenges && (
                <div className="drawer-expand-content">No challenges yet.</div>
              )}
              <hr
                style={{ border: 0, borderTop: "2px solid #b3d6e6", margin: 0 }}
              />
              {/* Treasure */}
              <div
                className="drawer-list-item"
                onClick={() => handleCollapse("treasure")}
                style={{
                  display: "flex",
                  alignItems: "center",
                  fontWeight: 700,
                  fontSize: 20,
                  color: "#0a2a3a",
                  cursor: "pointer",
                  gap: 16,
                  padding: "18px 0",
                }}
              >
                <i className="fas fa-gift"></i>
                <span>TREASURE</span>
                <span
                  style={{ marginLeft: "auto", transition: "transform 0.2s" }}
                >
                  <i
                    className={`fas fa-chevron-down${
                      collapse.treasure ? " rotated" : ""
                    }`}
                  ></i>
                </span>
              </div>
              {collapse.treasure && (
                <div className="drawer-expand-content">No treasures yet.</div>
              )}
              <hr
                style={{ border: 0, borderTop: "2px solid #b3d6e6", margin: 0 }}
              />
            </div>
            <div style={{ flex: 1 }}></div>
            <button
              className="drawer-signout"
              onClick={handleSignOut}
              style={{
                margin: 24,
                marginTop: "auto",
                background: "#0096db",
                color: "#fff",
                fontWeight: 700,
                fontSize: 18,
                border: "none",
                borderRadius: 14,
                width: "calc(100% - 48px)",
                height: 54,
                boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                letterSpacing: 1,
              }}
            >
              SIGN OUT
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default Header;
