import React, { useState, useEffect } from "react";
import "./LeaderboardModal.css";
import avatar1 from "../assets/avatar/avatar1.png";
import avatar2 from "../assets/avatar/avatar2.png";
import avatar3 from "../assets/avatar/avatar3.png";
import avatar4 from "../assets/avatar/avatar4.png";
import avatar5 from "../assets/avatar/avatar5.png";
import avatar6 from "../assets/avatar/avatar6.png";
import avatar7 from "../assets/avatar/avatar7.png";
import avatar from "../assets/avatar/avatar.png";
import {
  fetchLeaderboardData,
  calculateUserScore,
  getUserRank,
} from "../services/firebase";
import { useUser } from "../context/UserContext";

const LeaderboardModal = ({ isOpen, onClose }) => {
  const { userData, userDocId } = useUser();
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [userRank, setUserRank] = useState(null);

  const avatarMap = {
    1: avatar1,
    2: avatar2,
    3: avatar3,
    4: avatar4,
    5: avatar5,
    6: avatar6,
    7: avatar7,
    8: avatar,
  };

  const getAvatarImage = (avatarId, avatarImage) => {
    // If user has a custom avatar image, use it
    if (avatarImage) {
      return avatarImage;
    }
    // Otherwise use avatar map
    return avatarMap[avatarId] || avatar;
  };

  // Fetch leaderboard data when modal opens
  useEffect(() => {
    if (isOpen) {
      loadLeaderboardData();
    }
  }, [isOpen]);

  const loadLeaderboardData = async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await fetchLeaderboardData();
      setLeaderboardData(data);

      // Get current user's rank if they have a score
      if (userDocId && userData) {
        const userScore = calculateUserScore(userData);
        if (userScore > 0) {
          const rank = await getUserRank(userDocId, userScore);
          setUserRank(rank);
        }
      }
    } catch (err) {
      console.error("Error loading leaderboard:", err);
      setError("Failed to load leaderboard data");
    } finally {
      setLoading(false);
    }
  };

  // Calculate current user's total score
  const currentUserScore = calculateUserScore(userData);

  if (!isOpen) return null;

  return (
    <div className="leaderboard-overlay" onClick={onClose}>
      <div className="leaderboard-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="leaderboard-header">
          <h2 className="leaderboard-title">Leaderboard</h2>
          <p className="leaderboard-subtitle">
            Only the top 25 hunters make the board.
          </p>
          <button className="leaderboard-close" onClick={onClose}>
            <span>×</span>
          </button>
        </div>

        {/* User's Current Score */}
        <div className="user-score-bar">
          <div className="user-avatar">
            <img
              src={getAvatarImage(
                userData?.avatar?.id || 1,
                userData?.avatar?.image
              )}
              alt="User Avatar"
            />
          </div>
          <div className="user-info">
            <span className="user-name">{userData?.name || "Anonymous"}</span>
            {userRank && (
              <span
                style={{
                  fontSize: "12px",
                  color: "#ffffff95",
                  marginLeft: "8px",
                }}
              >
                Rank #{userRank}
              </span>
            )}
          </div>
          <div className="user-points">
            <span>{currentUserScore} Points</span>
          </div>
        </div>

        {/* Leaderboard Table */}
        <div className="leaderboard-table-container">
          <div className="leaderboard-table">
            <div className="table-header">
              <div className="header-position">POS.</div>
              <div className="header-name">NAME</div>
              <div className="header-points">POINTS</div>
            </div>

            <div className="table-body">
              {loading ? (
                <div
                  style={{
                    padding: "20px",
                    textAlign: "center",
                    color: "#666",
                  }}
                >
                  Loading leaderboard...
                </div>
              ) : error ? (
                <div
                  style={{
                    padding: "20px",
                    textAlign: "center",
                    color: "#ff6b6b",
                  }}
                >
                  {error}
                  <button
                    onClick={loadLeaderboardData}
                    style={{
                      display: "block",
                      margin: "10px auto",
                      padding: "8px 16px",
                      backgroundColor: "#007bff",
                      color: "white",
                      border: "none",
                      borderRadius: "4px",
                      cursor: "pointer",
                    }}
                  >
                    Retry
                  </button>
                </div>
              ) : leaderboardData.length === 0 ? (
                <div
                  style={{
                    padding: "20px",
                    textAlign: "center",
                    color: "#666",
                  }}
                >
                  No players on the leaderboard yet. Be the first to collect
                  treasures!
                </div>
              ) : (
                leaderboardData.map((player, index) => (
                  <div
                    key={player.id}
                    className={`table-row ${index % 2 === 0 ? "even" : "odd"} ${
                      player.id === userDocId ? "current-user" : ""
                    }`}
                  >
                    <div className="position-cell">
                      <span className="position-pill">{player.position}</span>
                    </div>
                    <div className="name-cell">
                      <div className="player-avatar">
                        <img
                          src={getAvatarImage(
                            player.avatarId || 1,
                            player.avatarImage
                          )}
                          alt={`${player.name} Avatar`}
                        />
                      </div>
                      <span className="player-name">
                        {player.name}
                        {player.id === userDocId && (
                          <span
                            style={{
                              fontSize: "10px",
                              color: "#007bff",
                              marginLeft: "4px",
                            }}
                          >
                            (You)
                          </span>
                        )}
                      </span>
                    </div>
                    <div className="points-cell">
                      <span>{player.points}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeaderboardModal;
