import React, { useState, useRef, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import "./PhotoBooth.css";
import prizePng from "../assets/images/prize.png";

const QUOTES = [
  { text: "Striding forward for a better future!", author: "Unknown" },
  { text: "Every step is a step toward greatness.", author: "Unknown" },
  { text: "Moving with purpose, chasing new horizons.", author: "Unknown" },
  { text: "Active today, stronger tomorrow.", author: "Unknown" },
  { text: "Pushing boundaries, embracing the journey.", author: "Unknown" },
  { text: "On the move, making every moment count.", author: "Unknown" },
  { text: "Energy in motion, dreams in progress.", author: "Unknown" },
  { text: "With every stride, we shape our story.", author: "Unknown" },
  { text: "Progress is made one step at a time.", author: "Unknown" },
  { text: "Fueling life with movement and passion.", author: "Unknown" },
  { text: "Chasing goals, embracing growth.", author: "Unknown" },
  {
    text: "Every journey begins with a single stride.",
    author: "Maya Angelou (attributed)",
  },
  { text: "Active hearts, inspired minds.", author: "Unknown" },
  { text: "Forward is the only way.", author: "Unknown" },
  {
    text: "Building a brighter tomorrow, one step at a time.",
    author: "Unknown",
  },
];

const PhotoBooth = () => {
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [capturedImage, setCapturedImage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [facingMode, setFacingMode] = useState("user"); // "user" for front camera, "environment" for back camera
  const [prizePosition, setPrizePosition] = useState({ x: 80, y: 75 }); // Bottom right corner, avoiding capture button
  const cameraViewRef = useRef(null);
  const [timer, setTimer] = useState(0);
  const [pendingCapture, setPendingCapture] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  // New state for popup flow
  const [showIntroPopup, setShowIntroPopup] = useState(true);
  const [showPledgePopup, setShowPledgePopup] = useState(false);
  const [selectedPledge, setSelectedPledge] = useState("");
  const [cameraStarted, setCameraStarted] = useState(false);

  const randomQuote = useMemo(() => {
    if (!confirmed) return null;
    const idx = Math.floor(Math.random() * QUOTES.length);
    return QUOTES[idx];
  }, [confirmed]);

  useEffect(() => {
    if (cameraStarted) {
      startCamera();
    }
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [facingMode, cameraStarted]);

  // Ensure video plays when returning to camera view
  useEffect(() => {
    if (!capturedImage && stream && videoRef.current) {
      videoRef.current.srcObject = stream;
      videoRef.current.play().catch(console.error);
    }
  }, [capturedImage, stream]);

  // Timer countdown effect
  useEffect(() => {
    if (timer > 0) {
      const timeout = setTimeout(() => setTimer(timer - 1), 1000);
      return () => clearTimeout(timeout);
    } else if (timer === 0 && pendingCapture) {
      setPendingCapture(false);
      capturePhoto();
    }
  }, [timer, pendingCapture]);

  const startCamera = async () => {
    try {
      setIsLoading(true);
      setError("");

      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }

      const newStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      setStream(newStream);
      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
      }
      setIsLoading(false);
    } catch (err) {
      console.error("Error accessing camera:", err);
      setError("Unable to access camera. Please check permissions.");
      setIsLoading(false);
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current && cameraViewRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext("2d");
      const cameraView = cameraViewRef.current;

      // Set canvas dimensions to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      // Mirror the video frame horizontally
      context.save();
      context.translate(canvas.width, 0);
      context.scale(-1, 1);
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      context.restore();

      // Draw the prize overlay on the canvas
      const prizeImg = new Image();
      prizeImg.crossOrigin = "anonymous";
      prizeImg.onload = () => {
        // Use a larger base size for the prize
        const basePrizeWidth = 180; // px, adjust as needed
        // Maintain aspect ratio
        const aspect = prizeImg.naturalWidth / prizeImg.naturalHeight;
        const basePrizeHeight = basePrizeWidth / aspect;

        // Calculate scaling from camera view to canvas
        const viewRect = cameraView.getBoundingClientRect();
        const scale = Math.min(
          canvas.width / viewRect.width,
          canvas.height / viewRect.height
        );
        const prizeFinalWidth = basePrizeWidth * scale;
        const prizeFinalHeight = basePrizeHeight * scale;

        // Calculate position directly on canvas coordinates
        const prizeX =
          (prizePosition.x / 100) * canvas.width - prizeFinalWidth / 2;
        const prizeY =
          (prizePosition.y / 100) * canvas.height - prizeFinalHeight / 2;

        // Draw the prize (not mirrored)
        console.log("Drawing prize at:", {
          prizeX,
          prizeY,
          prizeFinalWidth,
          prizeFinalHeight,
        });
        context.drawImage(
          prizeImg,
          prizeX,
          prizeY,
          prizeFinalWidth,
          prizeFinalHeight
        );

        // Convert canvas to blob and create URL
        canvas.toBlob(
          (blob) => {
            const imageUrl = URL.createObjectURL(blob);
            setCapturedImage(imageUrl);
          },
          "image/jpeg",
          0.9
        );
      };
      prizeImg.onerror = (error) => {
        console.error("Error loading prize image:", error);
        // Continue without prize if image fails to load
        canvas.toBlob(
          (blob) => {
            const imageUrl = URL.createObjectURL(blob);
            setCapturedImage(imageUrl);
          },
          "image/jpeg",
          0.9
        );
      };
      prizeImg.src = prizePng;
    }
  };

  const retakePhoto = async () => {
    if (capturedImage) {
      URL.revokeObjectURL(capturedImage);
      setCapturedImage(null);
    }

    // Ensure camera is working when returning to camera view
    if (stream && videoRef.current) {
      // Reassign the stream to the video element
      videoRef.current.srcObject = stream;
    } else {
      // Restart camera if stream is lost
      await startCamera();
    }
  };

  const savePhoto = () => {
    if (capturedImage) {
      const link = document.createElement("a");
      link.download = `selfie-${Date.now()}.jpg`;
      link.href = capturedImage;
      link.click();

      // Optional: Show success message or navigate back
      setTimeout(() => {
        navigate("/home");
      }, 1000);
    }
  };

  const switchCamera = () => {
    setFacingMode((prevMode) => (prevMode === "user" ? "environment" : "user"));
  };

  // Wrap the capture button logic
  const handleStartCapture = () => {
    setTimer(3);
    setPendingCapture(true);
  };

  // Popup handlers
  const handleTakePledge = () => {
    setShowIntroPopup(false);
    setShowPledgePopup(true);
  };

  const handlePledgeSelect = (pledge) => {
    setSelectedPledge(pledge);
  };

  const handleTakeSelfie = () => {
    setShowPledgePopup(false);
    setCameraStarted(true);
    setIsLoading(true);
  };

  return (
    <div className="photobooth-container">
      <Header />
      <div className="photobooth-content">
        {/* Intro Popup */}
        {showIntroPopup && (
          <div className="popup-overlay">
            <div className="popup-content intro-popup">
              <h2>AR Photobooth</h2>
              <h3>Pledge Selfie</h3>
              <p>Take a pledge by capturing a selfie with an AR filter</p>
              <div className="popup-buttons">
                <button
                  className="popup-button primary"
                  onClick={handleTakePledge}
                >
                  TAKE A PLEDGE
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Pledge Selection Popup */}
        {showPledgePopup && (
          <div className="popup-overlay">
            <div className="popup-content pledge-popup">
              <h2>Take the Sydney Marathon Pledge!</h2>
              <h3>Pick Your Pledge!</h3>
              <div className="pledge-options">
                <button
                  className={`pledge-option ${
                    selectedPledge === "I run for strength" ? "selected" : ""
                  }`}
                  onClick={() => handlePledgeSelect("I run for strength")}
                >
                  I run for strength
                </button>
                <button
                  className={`pledge-option ${
                    selectedPledge === "Striding forward for a better future!"
                      ? "selected"
                      : ""
                  }`}
                  onClick={() =>
                    handlePledgeSelect("Striding forward for a better future!")
                  }
                >
                  Striding forward for a better future!
                </button>
              </div>
              <button
                className="popup-button primary take-selfie-button"
                onClick={handleTakeSelfie}
                disabled={!selectedPledge}
              >
                TAKE A SELFIE
              </button>
            </div>
          </div>
        )}

        {/* Timer Overlay */}
        {timer > 0 && cameraStarted && (
          <div className="timer-overlay">
            <div className="timer-number">{timer}</div>
          </div>
        )}

        {isLoading && cameraStarted && (
          <div className="loading-overlay">
            <div className="loading-spinner"></div>
            <p>Starting camera...</p>
          </div>
        )}

        {error && cameraStarted && (
          <div className="error-overlay">
            <div className="error-message">
              <i className="fas fa-exclamation-triangle"></i>
              <p>{error}</p>
              <button onClick={startCamera} className="retry-button">
                Try Again
              </button>
            </div>
          </div>
        )}

        {!capturedImage && cameraStarted ? (
          <div className="camera-view" ref={cameraViewRef}>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="camera-video"
            />
            <canvas ref={canvasRef} style={{ display: "none" }} />

            <img
              src={prizePng}
              alt="Prize"
              className="fixed-prize"
              style={{
                left: `${prizePosition.x}%`,
                top: `${prizePosition.y}%`,
              }}
            />

            <div className="camera-controls">
              <div className="control-button-spacer"></div>

              <button
                onClick={handleStartCapture}
                className="capture-button"
                disabled={isLoading || error || timer > 0}
              >
                <div className="capture-ring">
                  <div className="capture-inner"></div>
                </div>
              </button>

              <button
                onClick={() => navigate("/home")}
                className="control-button close-button"
                title="Close"
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
          </div>
        ) : null}

        {capturedImage && (
          <div className="photo-preview">
            <div className="preview-header">
              <h2>
                {confirmed
                  ? "You Look Amazing! Here's Your Marathon Moment."
                  : "Looking Strong! Here's Your Pledge Shot."}
              </h2>
            </div>
            <div
              style={{
                backgroundColor: !confirmed ? "transparent" : "white",
                border: confirmed ? "1px solid #081F2D" : "none",
                borderRadius: 20,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                padding: confirmed ? "16px" : "0",
                marginBottom: confirmed ? 16 : 32,
                width: confirmed ? "min-content" : "100%",
                boxShadow: confirmed
                  ? "3.93px 5.25px 11.41px 0px #00000040"
                  : "none",
              }}
            >
              <div className="preview-image-container">
                <img
                  src={capturedImage}
                  alt="Captured selfie"
                  className="captured-image"
                />
              </div>
              {confirmed && (
                <>
                  <div
                    className="final-quote responsive-quote"
                    style={{
                      textAlign: "left",
                      fontWeight: 600,
                      marginBottom: 0,
                      fontSize: 18,
                      padding: "0 5px",
                    }}
                  >
                    {randomQuote ? randomQuote.text : ""}
                  </div>
                  {randomQuote.author !== "Unknown" && (
                    <div
                      className="final-author responsive-quote"
                      style={{ fontSize: 14, padding: "0 5px" }}
                    >
                      {randomQuote ? `-${randomQuote.author}` : ""}
                    </div>
                  )}
                </>
              )}
            </div>
            <div className="preview-controls">
              {confirmed ? (
                <>
                  <button
                    className="preview-button upload-button"
                    onClick={() => navigate("/home")}
                  >
                    DONE
                  </button>
                  <button
                    className="preview-button retake-button"
                    onClick={savePhoto}
                  >
                    DOWNLOAD IMAGE
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={retakePhoto}
                    className="preview-button retake-button"
                  >
                    RETAKE
                  </button>
                  <button
                    onClick={() => setConfirmed(true)}
                    className="preview-button upload-button"
                  >
                    CONFIRM
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PhotoBooth;
