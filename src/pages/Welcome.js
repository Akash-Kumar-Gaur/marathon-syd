import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Select, MenuItem, FormControl } from "@mui/material";
import { styled } from "@mui/material/styles";
import "./Welcome.css";
import startBg from "../assets/images/startBg.png";
import formBg from "../assets/images/formBg.png";
import Header from "../components/Header";

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
  backgroundColor: "rgba(255, 255, 255, 0.95)",
  borderRadius: 12,
  "& .MuiOutlinedInput-notchedOutline": {
    border: "none",
  },
  "& .MuiSelect-select": {
    padding: "8px 16px !important",
    color: "#081F2D",
    fontSize: "1rem",
  },
  "& .MuiSelect-icon": {
    color: "#081F2D",
    right: 16,
  },
  "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
    border: "none",
  },
});

const StyledMenuItem = styled(MenuItem)({
  fontSize: "1rem",
  color: "#081F2D",
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
    // Add your OTP verification logic here
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
            We've sent a 6-digit code to your mobile number. Please enter it
            below to verify your identity.
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
        <div>
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
          <button className="trouble-link">Trouble recieving OTP?</button>
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
                renderOTPVerification()
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
                    <div className="form-row">
                      <div className="form-group half">
                        <label>City</label>
                        <FormControl fullWidth>
                          <StyledSelect
                            value={formData.city}
                            onChange={(e) => handleSelectChange(e, "city")}
                            displayEmpty
                          >
                            <StyledMenuItem value="" disabled>
                              Your city
                            </StyledMenuItem>
                            <StyledMenuItem value="sydney">
                              Sydney
                            </StyledMenuItem>
                            <StyledMenuItem value="melbourne">
                              Melbourne
                            </StyledMenuItem>
                            <StyledMenuItem value="brisbane">
                              Brisbane
                            </StyledMenuItem>
                            <StyledMenuItem value="perth">Perth</StyledMenuItem>
                            <StyledMenuItem value="other">Other</StyledMenuItem>
                          </StyledSelect>
                        </FormControl>
                      </div>
                      <div className="form-group half">
                        <label>Postcode</label>
                        <input
                          type="text"
                          name="postcode"
                          placeholder="Your Postcode"
                          value={formData.postcode}
                          onChange={handleInputChange}
                        />
                      </div>
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
                      <label>Phone Number</label>
                      <div className="phone-input-container">
                        <span className="phone-prefix">+61</span>
                        <input
                          type="tel"
                          name="phone"
                          className="phone-input"
                          placeholder="XXXXXXXXX"
                          value={formData.phone.replace("+61", "")}
                          onChange={(e) => {
                            const value = e.target.value.replace(/\D/g, "");
                            setFormData((prev) => ({
                              ...prev,
                              phone: "+61" + value,
                            }));
                          }}
                        />
                      </div>
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
    </div>
  );
};

export default Welcome;
