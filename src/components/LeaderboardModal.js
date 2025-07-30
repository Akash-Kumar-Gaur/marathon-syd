import React from "react";
import "./LeaderboardModal.css";
import avatar1 from "../assets/avatar/avatar1.png";
import avatar2 from "../assets/avatar/avatar2.png";
import avatar3 from "../assets/avatar/avatar3.png";
import avatar4 from "../assets/avatar/avatar4.png";
import avatar5 from "../assets/avatar/avatar5.png";
import avatar6 from "../assets/avatar/avatar6.png";
import avatar7 from "../assets/avatar/avatar7.png";
import avatar from "../assets/avatar/avatar.png";

const LeaderboardModal = ({ isOpen, onClose, userData, leaderboardData }) => {
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

  const getAvatarImage = (avatarId) => {
    return avatarMap[avatarId] || avatar;
  };

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
              src={userData?.avatar?.image || getAvatarImage(1)}
              alt="User Avatar"
            />
          </div>
          <div className="user-info">
            <span className="user-name">
              {userData?.name || "Alex Johnson"}
            </span>
          </div>
          <div className="user-points">
            <span>{userData?.points || 55} Points</span>
          </div>
        </div>

        {/* Leaderboard Table */}
        <div className="leaderboard-table-container">
          <div className="leaderboard-table">
            <div className="table-header">
              <div className="header-position">POSITION</div>
              <div className="header-name">NAME</div>
              <div className="header-points">POINTS</div>
            </div>

            <div className="table-body">
              {leaderboardData.map((player, index) => (
                <div
                  key={player.id}
                  className={`table-row ${index % 2 === 0 ? "even" : "odd"}`}
                >
                  <div className="position-cell">
                    <span className="position-pill">{player.position}</span>
                  </div>
                  <div className="name-cell">
                    <div className="player-avatar">
                      <img
                        src={getAvatarImage(player.avatarId || 1)}
                        alt={`${player.name} Avatar`}
                      />
                    </div>
                    <span className="player-name">{player.name}</span>
                  </div>
                  <div className="points-cell">
                    <span>{player.points}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeaderboardModal;
