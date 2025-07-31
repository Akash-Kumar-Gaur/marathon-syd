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
import puzzleTile from "../assets/images/puzzleTile.png";
import matchTile from "../assets/images/matchTile.png";
import trivia from "../assets/images/trivia.png";
// import mascot from "../assets/images/mascot.png";
import headphones from "../assets/images/headphones.svg";
import shokzLogo from "../assets/images/shokz.png";
import { useDrawer } from "../context/DrawerContext";
import { useUser } from "../context/UserContext";
import { treasureData } from "../data/treasureData";
import FAQModal from "./FAQModal";
import LeaderboardModal from "./LeaderboardModal";
import { leaderboardData } from "../data/leaderboardData";

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

const CHALLENGES = [
  {
    name: "PUZZLE",
    img: puzzleTile,
    points: 0,
    totalPoints: 120,
    progress: 0,
    totalProgress: 4,
    alt: "Puzzle",
  },
  {
    name: "MATCH TILE",
    img: matchTile,
    points: 40,
    totalPoints: 80,
    progress: 0,
    totalProgress: 2,
    alt: "Match Tile",
  },
  {
    name: "TRIVIA",
    img: trivia,
    points: 60,
    totalPoints: 120,
    progress: 0,
    totalProgress: 4,
    alt: "Trivia",
  },
];

function TreasureDetailCard({ onBack }) {
  const coupon = "NSOCBWINIOW100";
  const handleCopy = () => {
    navigator.clipboard.writeText(coupon);
  };
  return (
    <div
      style={{
        width: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        minHeight: 0,
        height: "100%",
        padding: "16px",
        marginBottom: 32,
      }}
    >
      <button
        onClick={onBack}
        style={{
          background: "none",
          border: "none",
          color: "#081F2D",
          fontWeight: 600,
          fontSize: 15,
          marginBottom: 10,
          alignSelf: "flex-start",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
        }}
      >
        <span style={{ fontSize: 18, marginRight: 6 }}>&larr;</span> Go Back
      </button>
      <div
        style={{
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <div
          style={{
            fontWeight: 700,
            fontSize: 18,
            color: "#081F2D",
            marginBottom: 4,
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <span style={{ fontSize: 22 }}>&#127873;</span> TREASURE
        </div>
      </div>
      <div
        style={{
          width: "100%",
          display: "flex",
          justifyContent: "center",
          marginTop: 8,
        }}
      >
        <div
          style={{
            background: "#fff",
            borderRadius: 18,
            boxShadow: "0px 3.11px 12px 0px #00000030",
            padding: "16px",
            width: "100%",
            maxWidth: 340,
            margin: "0 4px",
            textAlign: "center",
            minHeight: 0,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <img
            src={shokzLogo}
            alt="Shokz"
            style={{ height: 20, marginBottom: 6 }}
          />
          <div
            style={{
              fontWeight: 800,
              fontSize: 16,
              color: "#081F2D",
              marginBottom: 1,
              letterSpacing: 1,
            }}
          >
            OPEN PRO 2
          </div>
          <div
            style={{
              color: "#22313F",
              fontWeight: 600,
              fontSize: 11,
              marginBottom: 8,
            }}
          >
            VALID TILL: JULY 31 2025
          </div>
          <img
            src={headphones}
            alt="Headphones"
            style={{
              width: "80%",
              maxWidth: 120,
              margin: "8px auto 10px auto",
              display: "block",
            }}
          />
          <div
            style={{
              textAlign: "left",
              fontWeight: 700,
              fontSize: 11,
              color: "#081F2D",
              marginBottom: 2,
              display: "flex",
              alignItems: "center",
              justifyContent: "flex-start",
              width: "100%",
            }}
          >
            CODE
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              marginBottom: 8,
              width: "100%",
            }}
          >
            <div
              style={{
                flex: 1,
                border: "1.5px dashed #1693f6",
                borderRadius: 8,
                padding: "7px 6px",
                fontWeight: 600,
                fontSize: 12,
                color: "#081F2D",
                background: "#f7fbfd",
                letterSpacing: 1,
              }}
            >
              {coupon}
            </div>
            <button
              onClick={handleCopy}
              style={{
                marginLeft: 6,
                background: "#1693f6",
                color: "#fff",
                border: "none",
                borderRadius: 8,
                fontWeight: 700,
                fontSize: 12,
                padding: "7px 12px",
                cursor: "pointer",
              }}
            >
              COPY
            </button>
          </div>
          <div style={{ textAlign: "left", marginBottom: 7 }}>
            <div
              style={{
                fontWeight: 700,
                fontSize: 12,
                color: "#081F2D",
                marginBottom: 2,
                marginTop: 24,
              }}
            >
              How to Avail :
            </div>
            <ul
              style={{
                color: "#22313F",
                fontSize: 11,
                margin: 0,
                paddingLeft: 16,
                marginBottom: 0,
                listStyle: "disc",
                // marginLeft: 12,
              }}
            >
              <li>Sign up on our website using a valid email address.</li>
              <li>Complete your profile and verify your account.</li>
              <li>Input the coupon code to complete the process.</li>
              <li>Once verified, you'll receive the product at no cost.</li>
            </ul>
          </div>
          <div style={{ textAlign: "left", marginBottom: 10 }}>
            <div
              style={{
                fontWeight: 700,
                fontSize: 12,
                color: "#081F2D",
                marginBottom: 2,
                marginTop: 24,
              }}
            >
              Terms and Conditions:
            </div>
            <ol
              style={{
                color: "#22313F",
                fontSize: 11,
                margin: 0,
                paddingLeft: 16,
                listStyle: "decimal",
                // marginLeft: 12,
              }}
            >
              <li>Offer valid for first-time users only.</li>
              <li>One free product per verified account.</li>
              <li>
                Company reserves the right to modify or cancel the offer
                anytime.
              </li>
            </ol>
          </div>
          <button
            style={{
              width: "100%",
              padding: "10px 0",
              background: "#0096db",
              color: "#fff",
              border: "none",
              borderRadius: 10,
              fontWeight: 700,
              fontSize: 13,
              letterSpacing: 1,
              marginTop: 4,
              cursor: "pointer",
              boxShadow: "0px 3.11px 3.11px 0px #00000040",
            }}
          >
            REDEEM NOW
          </button>
        </div>
      </div>
    </div>
  );
}

const Header = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const isHomePage = location.pathname === "/home";
  const isFindRoutePage = location.pathname === "/find-my-route";
  const isWayfinderPage = location.pathname === "/wayfinder";
  const { isDrawerOpen, setIsDrawerOpen } = useDrawer();
  const [drawerClosing, setDrawerClosing] = useState(false);
  const [collapse, setCollapse] = useState({
    challenges: true,
    treasure: false,
  });
  const { userData } = useUser();
  const [selectedTreasure, setSelectedTreasure] = useState(null);
  const [showFAQModal, setShowFAQModal] = useState(false);
  const [showLeaderboardModal, setShowLeaderboardModal] = useState(false);

  // Log navigation state changes
  useEffect(() => {
    console.log("Header - Current location:", location.pathname);
    console.log("Header - Location state:", location.state);
    console.log("Header - Full location object:", location);
  }, [location]);

  const handleHelp = () => {
    // Close drawer first, then show FAQ modal
    handleDrawerClose();
    setTimeout(() => {
      // setShowFAQModal(true);
    }, 300); // Wait for drawer close animation to complete
  };

  const handleTrophy = () => {
    // setShowLeaderboardModal(true);
  };

  const handleNotifications = () => {
    console.log("Notifications clicked");
  };

  const handleMenu = () => {
    setIsDrawerOpen(true);
    setDrawerClosing(false);
  };

  const handleDrawerClose = () => {
    setDrawerClosing(true);
    setTimeout(() => {
      setIsDrawerOpen(false);
      setDrawerClosing(false);
    }, 300); // match the CSS animation duration
  };

  const handleBack = () => {
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

  const handleChallengeClick = (challenge) => {
    // Only navigate if the challenge has no points (progress is 0)
    if (challenge.progress === 0) {
      let gameType = null;
      switch (challenge.name) {
        case "PUZZLE":
          gameType = "jigsaw";
          break;
        case "MATCH TILE":
          gameType = "flip";
          break;
        case "TRIVIA":
          gameType = "quiz";
          break;
        default:
          console.log("Unknown challenge:", challenge.name);
          return;
      }

      // Navigate to home page with game type in state
      navigate("/home", {
        state: {
          selectedGame: gameType,
        },
      });

      // Close the drawer after navigation
      handleDrawerClose();
    }
  };

  const handleCollapse = (section) => {
    setCollapse((prev) => {
      const newState = { ...prev, [section]: !prev[section] };
      if (section === "challenges" && newState.challenges)
        newState.treasure = false;
      if (section === "treasure" && newState.treasure)
        newState.challenges = false;
      return newState;
    });
  };

  const handleSignOut = () => {
    // Implement sign out functionality
    console.log("Signing out");
    localStorage.removeItem("userData");
    setIsDrawerOpen(false);
    navigate("/");
  };

  // Avatar logic
  const avatarImg =
    userData.selectedAvatar && avatarMap[userData.selectedAvatar.id]
      ? avatarMap[userData.selectedAvatar.id]
      : avatar5;

  // Example: unlocked treasures indices from user data
  const unlockedTreasures = [0, 2, 5]; // Replace with actual user data

  // Prepare treasure data with unlocked status
  const treasures = treasureData.map((treasure, i) => ({
    index: i,
    unlocked: unlockedTreasures.includes(i),
    name: treasure.treasure,
  }));
  // Sort unlocked treasures to the start
  const sortedTreasures = [
    ...treasures.filter((t) => t.unlocked),
    ...treasures.filter((t) => !t.unlocked),
  ];

  useEffect(() => {
    console.log("userData", userData, userData.challengeScores);
  }, [userData]);

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
          {isHomePage || isFindRoutePage || isWayfinderPage ? null : (
            <button className="help-button" onClick={handleHelp}>
              FAQ <span className="help-icon">?</span>
            </button>
          )}
        </div>
      </header>
      {isDrawerOpen && (
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
                  aspectRatio: 1 / 1,
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
                    color: userData.verified === false ? "#ff4444" : "#6D6D6D",
                    fontWeight: 500,
                    fontSize: 14,
                    wordBreak: "break-all",
                    whiteSpace: "normal",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {userData.email || "alex.johnson@example.com"}
                  {userData.verified === false && (
                    <span
                      style={{
                        marginLeft: "8px",
                        fontSize: "12px",
                        opacity: 0.8,
                      }}
                    >
                      (Guest)
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="drawer-section" style={{ padding: "0 24px" }}>
              {/* Challenges */}
              <div
                className="drawer-list-item"
                onClick={() => handleCollapse("challenges")}
                style={{
                  display: "flex",
                  alignItems: "center",
                  fontWeight: 700,
                  fontSize: 16,
                  color: "#0a2a3a",
                  cursor: "pointer",
                  gap: 16,
                  padding: "18px 0",
                }}
              >
                <i className="fas fa-th-large"></i>
                <span>SCORE BOOSTERS</span>
                <span
                  style={{
                    marginLeft: "auto",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    transition: "transform 0.2s",
                  }}
                >
                  {/* <span
                    style={{ fontSize: 14, color: "#1693f6", fontWeight: 600 }}
                  >
                    Total: {userData?.totalBoosterScore || 0}
                  </span> */}
                  <i
                    className={`fas fa-chevron-down${
                      collapse.challenges ? " fa-rotate-180" : ""
                    }`}
                  ></i>
                </span>
              </div>
              <hr
                style={{
                  border: 0,
                  borderTop: "2px solid #081F2D",
                  margin: "0 !important",
                }}
              />
              {collapse.challenges && (
                <div
                  className="drawer-expand-content"
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(3, 1fr)",
                    gap: 10,
                    padding: "16px 0 8px 0",
                    background: "#eaf7fc",
                    borderRadius: 18,
                    maxHeight: 420,
                    overflowY: "auto",
                  }}
                >
                  {CHALLENGES.map((challenge) => {
                    const earnedPoints =
                      userData?.challengeScores?.[challenge.name] || 0;
                    const isClickable = earnedPoints === 0;
                    return (
                      <div
                        key={challenge.name}
                        style={{
                          width: "100%",
                          cursor: isClickable ? "pointer" : "default",
                        }}
                        onClick={() =>
                          isClickable && handleChallengeClick(challenge)
                        }
                      >
                        <div
                          style={{
                            background: "#fff",
                            fontWeight: 700,
                            fontSize: 10,
                            color: "#081F2D",
                            textAlign: "center",
                            height: "-webkit-fill-available",
                            fontWeight: "bold",
                            width: "100%",
                            borderRadius: 10,
                            padding: "10px 6px",
                            // boxShadow: "0px 3.11px 3.11px 0px #00000040",
                          }}
                        >
                          {challenge.name}
                        </div>
                        <div
                          style={{
                            background: "#fff",
                            width: "100%",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexDirection: "column",
                            borderRadius: 10,
                            padding: " 0 6px 10px 6px",
                            boxShadow: "0px 3.11px 3.11px 0px #00000040",
                          }}
                        >
                          <img
                            src={challenge.img}
                            alt={challenge.alt}
                            style={{
                              width: 36,
                              height: 36,
                              objectFit: "contain",
                              marginBottom: 8,
                            }}
                          />
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              width: "100%",
                              flexDirection: "column",
                            }}
                          >
                            <div
                              style={{
                                fontWeight: 600,
                                fontSize: 10,
                                color: "#1693f6",
                              }}
                            >
                              {earnedPoints} Points
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              {/* Treasure */}
              <div
                className="drawer-list-item"
                onClick={() => handleCollapse("treasure")}
                style={{
                  display: "flex",
                  alignItems: "center",
                  fontWeight: 700,
                  fontSize: 16,
                  color: "#0a2a3a",
                  cursor: "pointer",
                  gap: 16,
                  padding: "18px 0",
                }}
              >
                <i className="fas fa-gift"></i>
                <span>TREASURES</span>
                <span
                  style={{ marginLeft: "auto", transition: "transform 0.2s" }}
                >
                  <i
                    className={`fas fa-chevron-down${
                      collapse.treasure ? " fa-rotate-180" : ""
                    }`}
                  ></i>
                </span>
              </div>
              <hr
                style={{
                  border: 0,
                  borderTop: "2px solid #081F2D",
                  margin: "0 !important",
                }}
              />
              {collapse.treasure &&
                (selectedTreasure === null ? (
                  <div
                    className="drawer-expand-content"
                    style={{
                      maxHeight: "32vh",
                      overflowY: "auto",
                      background: "#eaf7fc",
                      padding: "0px 0 8px 0",
                      display: "grid",
                      gridTemplateColumns: "repeat(2, 1fr)",
                      gap: 14,
                      marginTop: 16,
                    }}
                  >
                    {sortedTreasures.map(({ index, unlocked, name }) => {
                      const cardStyle = {
                        background: "#fff",
                        borderRadius: 12,
                        padding: 6,
                        width: "100%",
                        aspectRatio: 1 / 0.7,
                        position: "relative",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        boxSizing: "border-box",
                        minHeight: 0,
                        boxShadow: "0px 3.11px 3.11px 0px #00000040",
                        ...(unlocked ? { cursor: "pointer" } : {}),
                      };
                      return (
                        <div
                          key={index}
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            width: "100%",
                          }}
                        >
                          <div
                            style={{
                              fontWeight: 700,
                              fontSize: 12,
                              color: unlocked ? "#081F2D" : "#fff",
                              background: unlocked ? "#fff" : "#081F2DCC",
                              borderRadius: 8,
                              padding: "10px 6px",
                              width: "100%",
                              boxSizing: "border-box",
                              textAlign: "center",
                              // boxShadow: "0px 3.11px 3.11px 0px #00000040",
                            }}
                          >
                            {unlocked
                              ? name.length > 12
                                ? `${name.substring(0, 12)}...`
                                : name
                              : "Locked"}
                          </div>
                          {/* <div
                            style={cardStyle}
                            onClick={() =>
                              unlocked && setSelectedTreasure(index)
                            }
                          >
                            {unlocked ? (
                              <div
                                style={{
                                  fontWeight: 600,
                                  fontSize: 14,
                                  color: "#1693f6",
                                }}
                              >
                                Reward
                              </div>
                            ) : (
                              <div
                                style={{
                                  position: "absolute",
                                  top: 0,
                                  left: 0,
                                  width: "100%",
                                  height: "100%",
                                  background: "#081F2DCC",
                                  display: "flex",
                                  flexDirection: "column",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  borderRadius: 12,
                                  zIndex: 2,
                                  margin: 0,
                                }}
                              >
                                <div
                                  style={{
                                    fontSize: 28,
                                    color: "#fff",
                                    marginBottom: 6,
                                  }}
                                >
                                  🔒
                                </div>
                                <div
                                  style={{
                                    fontWeight: 700,
                                    fontSize: 16,
                                    color: "#fff",
                                    letterSpacing: 1,
                                  }}
                                >
                                  Locked
                                </div>
                              </div>
                            )}
                          </div> */}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      width: "100%",
                      height: "100%",
                      background: "#eaf7fc",
                      zIndex: 100,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      overflowY: "auto",
                      padding: 0,
                    }}
                  >
                    <TreasureDetailCard
                      onBack={() => setSelectedTreasure(null)}
                    />
                  </div>
                ))}
            </div>
            <div style={{ flex: 1 }}></div>
            <button
              className="drawer-photo-booth"
              onClick={() => {
                handleDrawerClose();
                navigate("/photobooth");
              }}
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
              TRY PHOTOBOOTH
            </button>
            <div
              style={{
                display: "flex",
                gap: "8px",
                margin: "16px",
                marginTop: 0,
              }}
            >
              <button
                className="drawer-faq"
                onClick={handleHelp}
                style={{
                  flex: 1,
                  background: "transparent",
                  color: "#081F2D",
                  fontWeight: 500,
                  fontSize: 14,
                  border: "none",
                  borderRadius: 0,
                  height: 48,
                  // textDecoration: "underline",
                  letterSpacing: 0.5,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px",
                }}
              >
                FAQ
                <span
                  className="help-icon"
                  style={{ border: "2px solid #081F2D", color: "#081F2D" }}
                >
                  ?
                </span>
              </button>
              <button
                className="drawer-signout"
                onClick={handleSignOut}
                style={{
                  flex: 1,
                  background: "transparent",
                  color: "#081F2D",
                  fontWeight: 700,
                  fontSize: 18,
                  border: "1px solid #000000",
                  borderRadius: 14,
                  height: 54,
                  boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                  letterSpacing: 1,
                }}
              >
                SIGN OUT
              </button>
            </div>
          </div>
        </div>
      )}

      <FAQModal isOpen={showFAQModal} onClose={() => setShowFAQModal(false)} />
      <LeaderboardModal
        isOpen={showLeaderboardModal}
        onClose={() => setShowLeaderboardModal(false)}
        userData={userData}
        leaderboardData={leaderboardData}
      />
    </>
  );
};

export default Header;
