import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Select, MenuItem, FormControl } from "@mui/material";
import { styled } from "@mui/material/styles";
import "./Welcome.css";
import startBg from "../assets/images/startBg.png";
import formBg from "../assets/images/formBg.png";
import troubleOtp from "../assets/images/troubleOtp.png";
import Header from "../components/Header";
import FirstRewardPopup from "../components/FirstRewardPopup";
import { firstRewardConfig } from "../data/firstRewardConfig";

// Import avatar images
import avatar1 from "../assets/avatar/avatar1.png";
import avatar2 from "../assets/avatar/avatar2.png";
import avatar3 from "../assets/avatar/avatar3.png";
import avatar4 from "../assets/avatar/avatar4.png";
import avatar5 from "../assets/avatar/avatar5.png";
import avatar6 from "../assets/avatar/avatar6.png";
import avatar7 from "../assets/avatar/avatar7.png";
import avatar from "../assets/avatar/avatar.png";

// Styled Material UI components
const StyledSelect = styled(Select)({
  height: 50,
  backgroundColor: "#edf2f7",
  borderRadius: 12,
  "& .MuiOutlinedInput-notchedOutline": {
    border: "none",
  },
  "& .MuiSelect-select": {
    padding: "12px 16px !important",
    color: "#1a202c",
    fontSize: "1rem",
    fontFamily:
      '"SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  "& .MuiSelect-icon": {
    color: "#1a202c",
    right: 16,
  },
  "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
    border: "none",
  },
});

const StyledMenuItem = styled(MenuItem)({
  fontSize: "1rem",
  color: "#1a202c",
  fontFamily:
    '"SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
});

const Welcome = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [showAvatarSelection, setShowAvatarSelection] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [showOTP, setShowOTP] = useState(false);
  const [selectedAvatar, setSelectedAvatar] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    country: "",
    city: "",
    postcode: "",
    email: "",
    phone: "+61",
  });
  const [otp, setOtp] = useState("");
  const [resendTimer, setResendTimer] = useState(0);
  const [showTroubleModal, setShowTroubleModal] = useState(false);
  const [showFirstReward, setShowFirstReward] = useState(false);

  // Avatar options - using actual avatar images
  const avatarOptions = [
    { id: 1, image: avatar1 },
    { id: 2, image: avatar2 },
    { id: 3, image: avatar3 },
    { id: 4, image: avatar4 },
    { id: 5, image: avatar5 },
    { id: 6, image: avatar6 },
    { id: 7, image: avatar7 },
    { id: 8, image: avatar },
  ];

  // Log navigation state changes
  useEffect(() => {
    console.log("Welcome - Current location:", location.pathname);
    console.log("Welcome - History length:", window.history.length);
    console.log("Welcome - Location state:", location.state);
  }, [location]);

  useEffect(() => {
    let interval;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  const handleStart = () => {
    console.log("Welcome - handleStart called");
    setShowAvatarSelection(true);
  };

  const handleAvatarSelect = (avatar) => {
    setSelectedAvatar(avatar);
  };

  const handleAvatarNext = () => {
    if (selectedAvatar) {
      setShowAvatarSelection(false);
      setShowForm(true);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSelectChange = (e, field) => {
    setFormData((prev) => ({
      ...prev,
      [field]: e.target.value,
    }));
  };

  const handleSendOtp = () => {
    setShowOTP(true);
    setResendTimer(30);
  };

  const handleResendOtp = () => {
    setResendTimer(30);
    // Add your OTP resend logic here
  };

  const handleVerifyOtp = () => {
    console.log("Welcome - About to navigate to /hunt");
    console.log(
      "Welcome - History length before navigate:",
      window.history.length
    );

    // Store user data with verification status as true
    const userData = {
      ...formData,
      avatar: selectedAvatar,
      isVerified: true,
      loginMethod: "otp",
    };

    // Store user data in localStorage or sessionStorage
    localStorage.setItem("userData", JSON.stringify(userData));

    // Show first reward popup before navigating
    setShowFirstReward(true);
  };

  const handleGuestLogin = () => {
    console.log("Welcome - Guest login clicked, navigating to /hunt");
    console.log(
      "Welcome - History length before navigate:",
      window.history.length
    );

    // Store user data with verification status as false
    const userData = {
      ...formData,
      avatar: selectedAvatar,
      isVerified: false,
      loginMethod: "guest",
    };

    // Store user data in localStorage or sessionStorage
    localStorage.setItem("userData", JSON.stringify(userData));

    // Show first reward popup before navigating
    setShowFirstReward(true);
  };

  const handleCollectReward = () => {
    // Store the collected reward in localStorage
    const collectedRewards = JSON.parse(
      localStorage.getItem("collectedRewards") || "[]"
    );
    collectedRewards.push({
      ...firstRewardConfig,
      collectedAt: new Date().toISOString(),
      id: "first-reward",
    });
    localStorage.setItem("collectedRewards", JSON.stringify(collectedRewards));

    // Close the popup and navigate to hunt
    setShowFirstReward(false);
    navigate("/hunt");

    setTimeout(() => {
      console.log(
        "Welcome - History length after navigate:",
        window.history.length
      );
    }, 100);
  };

  const renderOTPVerification = () => {
    return (
      <div className="otp-verification">
        <div className="otp-header">
          <h1>Enter One Time Password</h1>
          <p>
            We've sent a 6-digit code to your E-mail. Please enter it below to
            verify your identity.
          </p>
        </div>
        <div className="otp-input-group">
          <label>One Time Password</label>
          <input
            type="text"
            className="otp-input-field"
            placeholder="Enter OTP"
            value={otp}
            onChange={(e) =>
              setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
            }
            maxLength={6}
          />
        </div>
        <div className="otp-actions">
          <span className="resend-text">Didn't receive the code?</span>
          {resendTimer > 0 ? (
            <button className="resend-button" disabled>
              Resend in 00:{String(resendTimer).padStart(2, "0")} sec
            </button>
          ) : (
            <button className="resend-button" onClick={handleResendOtp}>
              Resend OTP
            </button>
          )}
        </div>
        <button className="verify-button" onClick={handleVerifyOtp}>
          VERIFY
        </button>
        <button
          className="trouble-link"
          onClick={() => setShowTroubleModal(true)}
        >
          Trouble recieving OTP?
        </button>
      </div>
    );
  };

  const renderTroubleModal = () => {
    if (!showTroubleModal) return null;

    return (
      <div
        className="trouble-modal-overlay"
        onClick={() => setShowTroubleModal(false)}
      >
        <div className="trouble-modal" onClick={(e) => e.stopPropagation()}>
          <h2 className="trouble-modal-title">Trouble Receiving OTP?</h2>

          <div className="trouble-modal-illustration">
            <img
              src={troubleOtp}
              alt="Trouble OTP Illustration"
              className="trouble-illustration-img"
            />
          </div>

          <p className="trouble-modal-message">
            Oops! We're currently unable to send an OTP. You can proceed as a
            guest and verify your account later.
          </p>

          <div className="trouble-modal-actions">
            <button
              className="guest-login-button"
              onClick={() => {
                setShowTroubleModal(false);
                handleGuestLogin();
              }}
            >
              LOG IN AS A GUEST
            </button>
            <button
              className="retry-button"
              onClick={() => {
                setShowTroubleModal(false);
                handleResendOtp();
              }}
            >
              RETRY
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderAvatarSelection = () => {
    return (
      <div className="avatar-selection">
        <div className="avatar-header">
          <h1>Let's set your look!</h1>
          <p>Choose how you'll appear on the leaderboard</p>
        </div>
        <div className="avatar-grid">
          {avatarOptions.map((avatar) => (
            <div
              key={avatar.id}
              className={`avatar-option ${
                selectedAvatar?.id === avatar.id ? "selected" : ""
              }`}
              onClick={() => handleAvatarSelect(avatar)}
            >
              <img
                src={avatar.image}
                alt={`Avatar ${avatar.id}`}
                className="avatar-image"
              />
              {selectedAvatar?.id === avatar.id && (
                <div className="avatar-tick-icon">✓</div>
              )}
            </div>
          ))}
        </div>
        <button
          className="avatar-next-button"
          onClick={handleAvatarNext}
          disabled={!selectedAvatar}
        >
          NEXT
        </button>
      </div>
    );
  };

  if (showAvatarSelection) {
    return (
      <div className="welcome-screen">
        <Header />
        <div className="form-background">
          <div className="form-image-container">
            <img src={formBg} alt="Background" />
          </div>
          <div className="center-card">
            <div className="form-content">{renderAvatarSelection()}</div>
          </div>
        </div>

        <FirstRewardPopup
          isOpen={showFirstReward}
          onClose={() => setShowFirstReward(false)}
          onCollect={handleCollectReward}
          rewardData={firstRewardConfig}
        />
      </div>
    );
  }

  if (showForm) {
    return (
      <div className="welcome-screen">
        <Header />
        <div className="form-background">
          <div className="form-image-container">
            <img src={formBg} alt="Background" />
          </div>
          <div className="center-card">
            <div className="form-content">
              {showOTP ? (
                <>
                  {renderOTPVerification()}
                  {renderTroubleModal()}
                </>
              ) : (
                <>
                  <div className="form-welcome">
                    <h1>Welcome!</h1>
                    <p>
                      Fill in your details to start your augmented reality
                      treasure hunt adventure.
                    </p>
                  </div>
                  <form className="registration-form">
                    <div className="form-group">
                      <label>Name</label>
                      <input
                        type="text"
                        name="name"
                        placeholder="Your full name"
                        value={formData.name}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div className="form-group">
                      <label>Email ID</label>
                      <input
                        type="email"
                        name="email"
                        placeholder="Your email ID"
                        value={formData.email}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div className="form-group">
                      <label>Country</label>
                      <FormControl fullWidth>
                        <StyledSelect
                          value={formData.country}
                          onChange={(e) => handleSelectChange(e, "country")}
                          displayEmpty
                        >
                          <StyledMenuItem value="" disabled>
                            Country of origin
                          </StyledMenuItem>
                          <StyledMenuItem value="australia">
                            Australia
                          </StyledMenuItem>
                          <StyledMenuItem value="usa">
                            United States
                          </StyledMenuItem>
                          <StyledMenuItem value="uk">
                            United Kingdom
                          </StyledMenuItem>
                          <StyledMenuItem value="canada">Canada</StyledMenuItem>
                          <StyledMenuItem value="other">Other</StyledMenuItem>
                        </StyledSelect>
                      </FormControl>
                    </div>
                    <div className="form-group">
                      <label>Postcode</label>
                      <input
                        type="text"
                        name="postcode"
                        placeholder="Your postcode"
                        value={formData.postcode}
                        onChange={handleInputChange}
                      />
                    </div>
                    <button
                      type="button"
                      className="send-otp-button"
                      onClick={handleSendOtp}
                    >
                      SEND OTP
                    </button>
                  </form>
                </>
              )}
            </div>
          </div>
        </div>

        <FirstRewardPopup
          isOpen={showFirstReward}
          onClose={() => setShowFirstReward(false)}
          onCollect={handleCollectReward}
          rewardData={firstRewardConfig}
        />
      </div>
    );
  }

  return (
    <div className="welcome-screen">
      <div className="welcome-background">
        <img src={startBg} alt="Background" className="bg-image" />
      </div>
      {/* <Header /> */}
      <div className="welcome-overlay">
        <div className="welcome-content">
          <div className="welcome-text">
            <h1>EXPERIENCE. PLAY. WIN.</h1>
            <h2>
              TCS SYDNEY MARATHON
              <br />
              PRESENTED BY ASICS
            </h2>
            <p>
              Explore Sydney In Augmented Reality. Collect Hidden Rewards.
              Unlock Instant Wins. And Rise To The Top Of The Leaderboard For
              Your Chance To Win $1,000.
            </p>
            <div className="terms-link">
              <a href="#terms">T&Cs Apply.</a>
            </div>
          </div>
          <button className="start-button" onClick={handleStart}>
            START
          </button>
        </div>
      </div>

      <FirstRewardPopup
        isOpen={showFirstReward}
        onClose={() => setShowFirstReward(false)}
        onCollect={handleCollectReward}
        rewardData={firstRewardConfig}
      />
    </div>
  );
};

export default Welcome;
