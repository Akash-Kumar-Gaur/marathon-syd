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
import { db, functions, httpsCallable } from "../services/firebase";
import {
  collection,
  addDoc,
  doc,
  getDoc,
  updateDoc,
  query,
  where,
  getDocs,
  deleteDoc,
} from "firebase/firestore";
import { useUser } from "../context/UserContext";

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
  const { updateUserData, setUserDocumentId } = useUser();
  const [showAvatarSelection, setShowAvatarSelection] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [showOTP, setShowOTP] = useState(false);
  const [selectedAvatar, setSelectedAvatar] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    country: "",
    postcode: "",
    email: "",
    avatar: "",
  });
  const [otp, setOtp] = useState("");
  const [resendTimer, setResendTimer] = useState(0);
  const [showTroubleModal, setShowTroubleModal] = useState(false);
  const [showFirstReward, setShowFirstReward] = useState(false);
  const [userDocId, setUserDocId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    setFormData((prev) => ({
      ...prev,
      avatar: avatar.image,
    }));
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

  // Form validation function
  const isFormValid = () => {
    return (
      formData.name.trim() !== "" &&
      formData.email.trim() !== "" &&
      formData.country !== "" &&
      formData.postcode.trim() !== ""
    );
  };

  const handleSendOtp = async () => {
    if (!isFormValid()) {
      alert("Please fill in all required fields.");
      return;
    }

    // Prevent double submission
    if (isSubmitting) {
      console.log("Already submitting, ignoring duplicate request");
      return;
    }

    setIsSubmitting(true);

    try {
      console.log("Starting OTP process for email:", formData.email);

      // 1. Check if user with same email already exists
      try {
        const emailQuery = query(
          collection(db, "users"),
          where("email", "==", formData.email)
        );
        const emailSnapshot = await getDocs(emailQuery);

        console.log(
          "Email query result - empty:",
          emailSnapshot.empty,
          "docs count:",
          emailSnapshot.docs.length
        );

        if (!emailSnapshot.empty) {
          // User with same email exists
          const existingUser = emailSnapshot.docs[0].data();

          if (existingUser.verified) {
            // User is already verified, proceed to hunt page
            console.log(
              "Verified user with same email exists, proceeding to hunt page"
            );

            updateUserData({
              ...formData,
              avatar: selectedAvatar,
              verified: true,
              loginMethod: "existing_user",
            });

            setIsSubmitting(false);
            setShowFirstReward(true);
            return;
          } else {
            // User exists but not verified, use existing user
            console.log(
              "Unverified user with same email exists, using existing user"
            );
            const existingUserDoc = emailSnapshot.docs[0];
            setUserDocumentId(existingUserDoc.id);

            // Continue with OTP flow using existing user
            try {
              const sendOtpEmail = httpsCallable(functions, "sendOtpEmail");
              const result = await sendOtpEmail({
                email: formData.email,
                userId: existingUserDoc.id,
              });
              console.log("OTP email sent to existing user:", result.data);

              setShowOTP(true);
              setResendTimer(30);
              setIsSubmitting(false);
              return;
            } catch (otpError) {
              console.error("Error sending OTP to existing user:", otpError);
              alert("Error sending OTP. Please try again.");
              setIsSubmitting(false);
              return;
            }
          }
        }
      } catch (queryError) {
        console.error("Error checking for existing users:", queryError);

        // Don't proceed with user creation if there's any error checking for duplicates
        // This prevents creating duplicate users when we can't verify if one already exists
        alert("Error checking for existing users. Please try again.");
        setIsSubmitting(false);
        return;
      }

      // 2. Create user in Firestore
      console.log(
        "No existing user found, creating new user for email:",
        formData.email
      );
      const userRef = await addDoc(collection(db, "users"), {
        ...formData,
        createdAt: new Date(),
        verified: false,
      });
      setUserDocumentId(userRef.id);
      console.log("User created in Firestore with ID:", userRef.id);

      // 3. Call Firebase Function to send OTP email
      try {
        const sendOtpEmail = httpsCallable(functions, "sendOtpEmail");
        const result = await sendOtpEmail({
          email: formData.email,
          userId: userRef.id,
        });
        console.log("OTP email sent:", result.data);

        // 4. Show OTP screen only after successful email send
        setShowOTP(true);
        setResendTimer(30);
      } catch (otpError) {
        console.error("Error sending OTP to new user:", otpError);
        // Delete the user we just created since OTP failed
        try {
          await deleteDoc(doc(db, "users", userRef.id));
          console.log("Deleted user due to OTP failure:", userRef.id);
        } catch (deleteError) {
          console.error("Error deleting user after OTP failure:", deleteError);
        }
        alert("Error sending OTP. Please try again.");
        setIsSubmitting(false);
        return;
      }
    } catch (error) {
      console.error("Error creating user or sending OTP:", error);
      // Show OTP verification UI first, then trouble modal
      setShowOTP(true);
      setResendTimer(30);
      setShowTroubleModal(true);
      setIsSubmitting(false);
    }
  };

  const handleResendOtp = () => {
    setResendTimer(30);
    // Add your OTP resend logic here
  };

  const handleVerifyOtp = async () => {
    if (!userDocId) {
      alert("User not found. Please try again.");
      return;
    }
    try {
      const userSnap = await getDoc(doc(db, "users", userDocId));
      if (!userSnap.exists()) {
        alert("User not found. Please try again.");
        return;
      }
      const userData = userSnap.data();
      if (userData.otp === otp) {
        // Mark user as verified
        await updateDoc(doc(db, "users", userDocId), { verified: true });
        // Proceed as before
        updateUserData({
          ...formData,
          avatar: selectedAvatar,
          verified: true,
          loginMethod: "otp",
        });
        setShowFirstReward(true);
      } else {
        alert("Invalid OTP. Please try again.");
      }
    } catch (error) {
      console.error("Error verifying OTP:", error);
      alert("Verification failed. Please try again.");
    }
  };

  const handleGuestLogin = async () => {
    console.log("Welcome - Guest login clicked, navigating to /hunt");
    console.log(
      "Welcome - History length before navigate:",
      window.history.length
    );

    try {
      // Check if user with same email already exists
      const emailQuery = query(
        collection(db, "users"),
        where("email", "==", formData.email)
      );
      const emailSnapshot = await getDocs(emailQuery);

      let userDocId;

      if (!emailSnapshot.empty) {
        // User exists, use existing user
        const existingUser = emailSnapshot.docs[0];
        userDocId = existingUser.id;
        console.log("Using existing guest user with ID:", userDocId);
      } else {
        // Create new guest user in Firestore
        const userRef = await addDoc(collection(db, "users"), {
          ...formData,
          avatar: selectedAvatar,
          verified: false,
          loginMethod: "guest",
          createdAt: new Date(),
          challengeScores: {},
          totalBoosterScore: 0,
        });
        userDocId = userRef.id;
        console.log("Guest user created in Firestore with ID:", userDocId);
      }

      setUserDocumentId(userDocId);

      // Store user data with verification status as false
      updateUserData({
        ...formData,
        avatar: selectedAvatar,
        verified: false,
        loginMethod: "guest",
        challengeScores: {},
        totalBoosterScore: 0,
      });

      // Show first reward popup before navigating
      setShowFirstReward(true);
    } catch (error) {
      console.error("Error creating guest user:", error);

      // Fallback to localStorage only if Firebase fails
      updateUserData({
        ...formData,
        avatar: selectedAvatar,
        verified: false,
        loginMethod: "guest",
        challengeScores: {},
        totalBoosterScore: 0,
      });

      setShowFirstReward(true);
    }
  };

  const handleCollectReward = () => {
    localStorage.setItem(
      "collectedRewards",
      JSON.stringify({
        ...firstRewardConfig,
        collectedAt: new Date().toISOString(),
        id: "first-reward",
      })
    );

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
                    {renderTroubleModal()}
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
                          <StyledMenuItem value="afghanistan">
                            Afghanistan
                          </StyledMenuItem>
                          <StyledMenuItem value="albania">
                            Albania
                          </StyledMenuItem>
                          <StyledMenuItem value="algeria">
                            Algeria
                          </StyledMenuItem>
                          <StyledMenuItem value="andorra">
                            Andorra
                          </StyledMenuItem>
                          <StyledMenuItem value="angola">Angola</StyledMenuItem>
                          <StyledMenuItem value="antigua-and-barbuda">
                            Antigua and Barbuda
                          </StyledMenuItem>
                          <StyledMenuItem value="argentina">
                            Argentina
                          </StyledMenuItem>
                          <StyledMenuItem value="armenia">
                            Armenia
                          </StyledMenuItem>
                          <StyledMenuItem value="australia">
                            Australia
                          </StyledMenuItem>
                          <StyledMenuItem value="austria">
                            Austria
                          </StyledMenuItem>
                          <StyledMenuItem value="azerbaijan">
                            Azerbaijan
                          </StyledMenuItem>
                          <StyledMenuItem value="bahamas">
                            Bahamas
                          </StyledMenuItem>
                          <StyledMenuItem value="bahrain">
                            Bahrain
                          </StyledMenuItem>
                          <StyledMenuItem value="bangladesh">
                            Bangladesh
                          </StyledMenuItem>
                          <StyledMenuItem value="barbados">
                            Barbados
                          </StyledMenuItem>
                          <StyledMenuItem value="belarus">
                            Belarus
                          </StyledMenuItem>
                          <StyledMenuItem value="belgium">
                            Belgium
                          </StyledMenuItem>
                          <StyledMenuItem value="belize">Belize</StyledMenuItem>
                          <StyledMenuItem value="benin">Benin</StyledMenuItem>
                          <StyledMenuItem value="bhutan">Bhutan</StyledMenuItem>
                          <StyledMenuItem value="bolivia">
                            Bolivia
                          </StyledMenuItem>
                          <StyledMenuItem value="bosnia-and-herzegovina">
                            Bosnia and Herzegovina
                          </StyledMenuItem>
                          <StyledMenuItem value="botswana">
                            Botswana
                          </StyledMenuItem>
                          <StyledMenuItem value="brazil">Brazil</StyledMenuItem>
                          <StyledMenuItem value="brunei">Brunei</StyledMenuItem>
                          <StyledMenuItem value="bulgaria">
                            Bulgaria
                          </StyledMenuItem>
                          <StyledMenuItem value="burkina-faso">
                            Burkina Faso
                          </StyledMenuItem>
                          <StyledMenuItem value="burundi">
                            Burundi
                          </StyledMenuItem>
                          <StyledMenuItem value="cambodia">
                            Cambodia
                          </StyledMenuItem>
                          <StyledMenuItem value="cameroon">
                            Cameroon
                          </StyledMenuItem>
                          <StyledMenuItem value="canada">Canada</StyledMenuItem>
                          <StyledMenuItem value="cape-verde">
                            Cape Verde
                          </StyledMenuItem>
                          <StyledMenuItem value="central-african-republic">
                            Central African Republic
                          </StyledMenuItem>
                          <StyledMenuItem value="chad">Chad</StyledMenuItem>
                          <StyledMenuItem value="chile">Chile</StyledMenuItem>
                          <StyledMenuItem value="china">China</StyledMenuItem>
                          <StyledMenuItem value="colombia">
                            Colombia
                          </StyledMenuItem>
                          <StyledMenuItem value="comoros">
                            Comoros
                          </StyledMenuItem>
                          <StyledMenuItem value="congo">Congo</StyledMenuItem>
                          <StyledMenuItem value="costa-rica">
                            Costa Rica
                          </StyledMenuItem>
                          <StyledMenuItem value="croatia">
                            Croatia
                          </StyledMenuItem>
                          <StyledMenuItem value="cuba">Cuba</StyledMenuItem>
                          <StyledMenuItem value="cyprus">Cyprus</StyledMenuItem>
                          <StyledMenuItem value="czech-republic">
                            Czech Republic
                          </StyledMenuItem>
                          <StyledMenuItem value="denmark">
                            Denmark
                          </StyledMenuItem>
                          <StyledMenuItem value="djibouti">
                            Djibouti
                          </StyledMenuItem>
                          <StyledMenuItem value="dominica">
                            Dominica
                          </StyledMenuItem>
                          <StyledMenuItem value="dominican-republic">
                            Dominican Republic
                          </StyledMenuItem>
                          <StyledMenuItem value="east-timor">
                            East Timor
                          </StyledMenuItem>
                          <StyledMenuItem value="ecuador">
                            Ecuador
                          </StyledMenuItem>
                          <StyledMenuItem value="egypt">Egypt</StyledMenuItem>
                          <StyledMenuItem value="el-salvador">
                            El Salvador
                          </StyledMenuItem>
                          <StyledMenuItem value="equatorial-guinea">
                            Equatorial Guinea
                          </StyledMenuItem>
                          <StyledMenuItem value="eritrea">
                            Eritrea
                          </StyledMenuItem>
                          <StyledMenuItem value="estonia">
                            Estonia
                          </StyledMenuItem>
                          <StyledMenuItem value="eswatini">
                            Eswatini
                          </StyledMenuItem>
                          <StyledMenuItem value="ethiopia">
                            Ethiopia
                          </StyledMenuItem>
                          <StyledMenuItem value="fiji">Fiji</StyledMenuItem>
                          <StyledMenuItem value="finland">
                            Finland
                          </StyledMenuItem>
                          <StyledMenuItem value="france">France</StyledMenuItem>
                          <StyledMenuItem value="gabon">Gabon</StyledMenuItem>
                          <StyledMenuItem value="gambia">Gambia</StyledMenuItem>
                          <StyledMenuItem value="georgia">
                            Georgia
                          </StyledMenuItem>
                          <StyledMenuItem value="germany">
                            Germany
                          </StyledMenuItem>
                          <StyledMenuItem value="ghana">Ghana</StyledMenuItem>
                          <StyledMenuItem value="greece">Greece</StyledMenuItem>
                          <StyledMenuItem value="grenada">
                            Grenada
                          </StyledMenuItem>
                          <StyledMenuItem value="guatemala">
                            Guatemala
                          </StyledMenuItem>
                          <StyledMenuItem value="guinea">Guinea</StyledMenuItem>
                          <StyledMenuItem value="guinea-bissau">
                            Guinea-Bissau
                          </StyledMenuItem>
                          <StyledMenuItem value="guyana">Guyana</StyledMenuItem>
                          <StyledMenuItem value="haiti">Haiti</StyledMenuItem>
                          <StyledMenuItem value="honduras">
                            Honduras
                          </StyledMenuItem>
                          <StyledMenuItem value="hungary">
                            Hungary
                          </StyledMenuItem>
                          <StyledMenuItem value="iceland">
                            Iceland
                          </StyledMenuItem>
                          <StyledMenuItem value="india">India</StyledMenuItem>
                          <StyledMenuItem value="indonesia">
                            Indonesia
                          </StyledMenuItem>
                          <StyledMenuItem value="iran">Iran</StyledMenuItem>
                          <StyledMenuItem value="iraq">Iraq</StyledMenuItem>
                          <StyledMenuItem value="ireland">
                            Ireland
                          </StyledMenuItem>
                          <StyledMenuItem value="israel">Israel</StyledMenuItem>
                          <StyledMenuItem value="italy">Italy</StyledMenuItem>
                          <StyledMenuItem value="ivory-coast">
                            Ivory Coast
                          </StyledMenuItem>
                          <StyledMenuItem value="jamaica">
                            Jamaica
                          </StyledMenuItem>
                          <StyledMenuItem value="japan">Japan</StyledMenuItem>
                          <StyledMenuItem value="jordan">Jordan</StyledMenuItem>
                          <StyledMenuItem value="kazakhstan">
                            Kazakhstan
                          </StyledMenuItem>
                          <StyledMenuItem value="kenya">Kenya</StyledMenuItem>
                          <StyledMenuItem value="kiribati">
                            Kiribati
                          </StyledMenuItem>
                          <StyledMenuItem value="kuwait">Kuwait</StyledMenuItem>
                          <StyledMenuItem value="kyrgyzstan">
                            Kyrgyzstan
                          </StyledMenuItem>
                          <StyledMenuItem value="laos">Laos</StyledMenuItem>
                          <StyledMenuItem value="latvia">Latvia</StyledMenuItem>
                          <StyledMenuItem value="lebanon">
                            Lebanon
                          </StyledMenuItem>
                          <StyledMenuItem value="lesotho">
                            Lesotho
                          </StyledMenuItem>
                          <StyledMenuItem value="liberia">
                            Liberia
                          </StyledMenuItem>
                          <StyledMenuItem value="libya">Libya</StyledMenuItem>
                          <StyledMenuItem value="liechtenstein">
                            Liechtenstein
                          </StyledMenuItem>
                          <StyledMenuItem value="lithuania">
                            Lithuania
                          </StyledMenuItem>
                          <StyledMenuItem value="luxembourg">
                            Luxembourg
                          </StyledMenuItem>
                          <StyledMenuItem value="madagascar">
                            Madagascar
                          </StyledMenuItem>
                          <StyledMenuItem value="malawi">Malawi</StyledMenuItem>
                          <StyledMenuItem value="malaysia">
                            Malaysia
                          </StyledMenuItem>
                          <StyledMenuItem value="maldives">
                            Maldives
                          </StyledMenuItem>
                          <StyledMenuItem value="mali">Mali</StyledMenuItem>
                          <StyledMenuItem value="malta">Malta</StyledMenuItem>
                          <StyledMenuItem value="marshall-islands">
                            Marshall Islands
                          </StyledMenuItem>
                          <StyledMenuItem value="mauritania">
                            Mauritania
                          </StyledMenuItem>
                          <StyledMenuItem value="mauritius">
                            Mauritius
                          </StyledMenuItem>
                          <StyledMenuItem value="mexico">Mexico</StyledMenuItem>
                          <StyledMenuItem value="micronesia">
                            Micronesia
                          </StyledMenuItem>
                          <StyledMenuItem value="moldova">
                            Moldova
                          </StyledMenuItem>
                          <StyledMenuItem value="monaco">Monaco</StyledMenuItem>
                          <StyledMenuItem value="mongolia">
                            Mongolia
                          </StyledMenuItem>
                          <StyledMenuItem value="montenegro">
                            Montenegro
                          </StyledMenuItem>
                          <StyledMenuItem value="morocco">
                            Morocco
                          </StyledMenuItem>
                          <StyledMenuItem value="mozambique">
                            Mozambique
                          </StyledMenuItem>
                          <StyledMenuItem value="myanmar">
                            Myanmar
                          </StyledMenuItem>
                          <StyledMenuItem value="namibia">
                            Namibia
                          </StyledMenuItem>
                          <StyledMenuItem value="nauru">Nauru</StyledMenuItem>
                          <StyledMenuItem value="nepal">Nepal</StyledMenuItem>
                          <StyledMenuItem value="netherlands">
                            Netherlands
                          </StyledMenuItem>
                          <StyledMenuItem value="new-zealand">
                            New Zealand
                          </StyledMenuItem>
                          <StyledMenuItem value="nicaragua">
                            Nicaragua
                          </StyledMenuItem>
                          <StyledMenuItem value="niger">Niger</StyledMenuItem>
                          <StyledMenuItem value="nigeria">
                            Nigeria
                          </StyledMenuItem>
                          <StyledMenuItem value="north-korea">
                            North Korea
                          </StyledMenuItem>
                          <StyledMenuItem value="north-macedonia">
                            North Macedonia
                          </StyledMenuItem>
                          <StyledMenuItem value="norway">Norway</StyledMenuItem>
                          <StyledMenuItem value="oman">Oman</StyledMenuItem>
                          <StyledMenuItem value="pakistan">
                            Pakistan
                          </StyledMenuItem>
                          <StyledMenuItem value="palau">Palau</StyledMenuItem>
                          <StyledMenuItem value="panama">Panama</StyledMenuItem>
                          <StyledMenuItem value="papua-new-guinea">
                            Papua New Guinea
                          </StyledMenuItem>
                          <StyledMenuItem value="paraguay">
                            Paraguay
                          </StyledMenuItem>
                          <StyledMenuItem value="peru">Peru</StyledMenuItem>
                          <StyledMenuItem value="philippines">
                            Philippines
                          </StyledMenuItem>
                          <StyledMenuItem value="poland">Poland</StyledMenuItem>
                          <StyledMenuItem value="portugal">
                            Portugal
                          </StyledMenuItem>
                          <StyledMenuItem value="qatar">Qatar</StyledMenuItem>
                          <StyledMenuItem value="romania">
                            Romania
                          </StyledMenuItem>
                          <StyledMenuItem value="russia">Russia</StyledMenuItem>
                          <StyledMenuItem value="rwanda">Rwanda</StyledMenuItem>
                          <StyledMenuItem value="saint-kitts-and-nevis">
                            Saint Kitts and Nevis
                          </StyledMenuItem>
                          <StyledMenuItem value="saint-lucia">
                            Saint Lucia
                          </StyledMenuItem>
                          <StyledMenuItem value="saint-vincent-and-the-grenadines">
                            Saint Vincent and the Grenadines
                          </StyledMenuItem>
                          <StyledMenuItem value="samoa">Samoa</StyledMenuItem>
                          <StyledMenuItem value="san-marino">
                            San Marino
                          </StyledMenuItem>
                          <StyledMenuItem value="sao-tome-and-principe">
                            São Tomé and Príncipe
                          </StyledMenuItem>
                          <StyledMenuItem value="saudi-arabia">
                            Saudi Arabia
                          </StyledMenuItem>
                          <StyledMenuItem value="senegal">
                            Senegal
                          </StyledMenuItem>
                          <StyledMenuItem value="serbia">Serbia</StyledMenuItem>
                          <StyledMenuItem value="seychelles">
                            Seychelles
                          </StyledMenuItem>
                          <StyledMenuItem value="sierra-leone">
                            Sierra Leone
                          </StyledMenuItem>
                          <StyledMenuItem value="singapore">
                            Singapore
                          </StyledMenuItem>
                          <StyledMenuItem value="slovakia">
                            Slovakia
                          </StyledMenuItem>
                          <StyledMenuItem value="slovenia">
                            Slovenia
                          </StyledMenuItem>
                          <StyledMenuItem value="solomon-islands">
                            Solomon Islands
                          </StyledMenuItem>
                          <StyledMenuItem value="somalia">
                            Somalia
                          </StyledMenuItem>
                          <StyledMenuItem value="south-africa">
                            South Africa
                          </StyledMenuItem>
                          <StyledMenuItem value="south-korea">
                            South Korea
                          </StyledMenuItem>
                          <StyledMenuItem value="south-sudan">
                            South Sudan
                          </StyledMenuItem>
                          <StyledMenuItem value="spain">Spain</StyledMenuItem>
                          <StyledMenuItem value="sri-lanka">
                            Sri Lanka
                          </StyledMenuItem>
                          <StyledMenuItem value="sudan">Sudan</StyledMenuItem>
                          <StyledMenuItem value="suriname">
                            Suriname
                          </StyledMenuItem>
                          <StyledMenuItem value="sweden">Sweden</StyledMenuItem>
                          <StyledMenuItem value="switzerland">
                            Switzerland
                          </StyledMenuItem>
                          <StyledMenuItem value="syria">Syria</StyledMenuItem>
                          <StyledMenuItem value="taiwan">Taiwan</StyledMenuItem>
                          <StyledMenuItem value="tajikistan">
                            Tajikistan
                          </StyledMenuItem>
                          <StyledMenuItem value="tanzania">
                            Tanzania
                          </StyledMenuItem>
                          <StyledMenuItem value="thailand">
                            Thailand
                          </StyledMenuItem>
                          <StyledMenuItem value="togo">Togo</StyledMenuItem>
                          <StyledMenuItem value="tonga">Tonga</StyledMenuItem>
                          <StyledMenuItem value="trinidad-and-tobago">
                            Trinidad and Tobago
                          </StyledMenuItem>
                          <StyledMenuItem value="tunisia">
                            Tunisia
                          </StyledMenuItem>
                          <StyledMenuItem value="turkey">Turkey</StyledMenuItem>
                          <StyledMenuItem value="turkmenistan">
                            Turkmenistan
                          </StyledMenuItem>
                          <StyledMenuItem value="tuvalu">Tuvalu</StyledMenuItem>
                          <StyledMenuItem value="uganda">Uganda</StyledMenuItem>
                          <StyledMenuItem value="ukraine">
                            Ukraine
                          </StyledMenuItem>
                          <StyledMenuItem value="united-arab-emirates">
                            United Arab Emirates
                          </StyledMenuItem>
                          <StyledMenuItem value="uk">
                            United Kingdom
                          </StyledMenuItem>
                          <StyledMenuItem value="usa">
                            United States
                          </StyledMenuItem>
                          <StyledMenuItem value="uruguay">
                            Uruguay
                          </StyledMenuItem>
                          <StyledMenuItem value="uzbekistan">
                            Uzbekistan
                          </StyledMenuItem>
                          <StyledMenuItem value="vanuatu">
                            Vanuatu
                          </StyledMenuItem>
                          <StyledMenuItem value="vatican-city">
                            Vatican City
                          </StyledMenuItem>
                          <StyledMenuItem value="venezuela">
                            Venezuela
                          </StyledMenuItem>
                          <StyledMenuItem value="vietnam">
                            Vietnam
                          </StyledMenuItem>
                          <StyledMenuItem value="yemen">Yemen</StyledMenuItem>
                          <StyledMenuItem value="zambia">Zambia</StyledMenuItem>
                          <StyledMenuItem value="zimbabwe">
                            Zimbabwe
                          </StyledMenuItem>
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
                      disabled={!isFormValid() || isSubmitting}
                      style={{
                        opacity: !isFormValid() || isSubmitting ? 0.6 : 1,
                        cursor:
                          !isFormValid() || isSubmitting
                            ? "not-allowed"
                            : "pointer",
                      }}
                    >
                      {isSubmitting ? "SENDING..." : "SEND OTP"}
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
