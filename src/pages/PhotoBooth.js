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
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [facingMode, setFacingMode] = useState("user"); // "user" for front camera, "environment" for back camera
  const [prizePosition, setPrizePosition] = useState({ x: 50, y: 50 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const cameraViewRef = useRef(null);
  const [timer, setTimer] = useState(0);
  const [pendingCapture, setPendingCapture] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  const randomQuote = useMemo(() => {
    if (!confirmed) return null;
    const idx = Math.floor(Math.random() * QUOTES.length);
    return QUOTES[idx];
  }, [confirmed]);

  useEffect(() => {
    startCamera();
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [facingMode]);

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
        const basePrizeWidth = 220; // px, adjust as needed
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
      prizeImg.src = prizePng;
    }
  };

  const retakePhoto = async () => {
    if (capturedImage) {
      URL.revokeObjectURL(capturedImage);
      setCapturedImage(null);
    }

    // Reset prize position
    setPrizePosition({ x: 50, y: 50 });

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

  const handlePrizeMouseDown = (e) => {
    setIsDragging(true);
    const rect = cameraViewRef.current.getBoundingClientRect();
    const prizeElement = e.target;
    const prizeRect = prizeElement.getBoundingClientRect();
    setDragOffset({
      x: e.clientX - prizeRect.left - prizeRect.width / 2,
      y: e.clientY - prizeRect.top - prizeRect.height / 2,
    });
  };

  const handlePrizeTouchStart = (e) => {
    setIsDragging(true);
    const touch = e.touches[0];
    const rect = cameraViewRef.current.getBoundingClientRect();
    const prizeElement = e.target;
    const prizeRect = prizeElement.getBoundingClientRect();
    setDragOffset({
      x: touch.clientX - prizeRect.left - prizeRect.width / 2,
      y: touch.clientY - prizeRect.top - prizeRect.height / 2,
    });
  };

  const handleMouseMove = (e) => {
    if (!isDragging || !cameraViewRef.current) return;

    const rect = cameraViewRef.current.getBoundingClientRect();
    const x = ((e.clientX - dragOffset.x - rect.left) / rect.width) * 100;
    const y = ((e.clientY - dragOffset.y - rect.top) / rect.height) * 100;

    setPrizePosition({
      x: Math.max(0, Math.min(100, x)),
      y: Math.max(0, Math.min(100, y)),
    });
  };

  const handleTouchMove = (e) => {
    if (!isDragging || !cameraViewRef.current) return;

    const touch = e.touches[0];
    const rect = cameraViewRef.current.getBoundingClientRect();
    const x = ((touch.clientX - dragOffset.x - rect.left) / rect.width) * 100;
    const y = ((touch.clientY - dragOffset.y - rect.top) / rect.height) * 100;

    setPrizePosition({
      x: Math.max(0, Math.min(100, x)),
      y: Math.max(0, Math.min(100, y)),
    });
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleDragEnd);
      document.addEventListener("touchmove", handleTouchMove);
      document.addEventListener("touchend", handleDragEnd);

      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleDragEnd);
        document.removeEventListener("touchmove", handleTouchMove);
        document.removeEventListener("touchend", handleDragEnd);
      };
    }
  }, [isDragging, dragOffset]);

  // Wrap the capture button logic
  const handleStartCapture = () => {
    setTimer(3);
    setPendingCapture(true);
  };

  return (
    <div className="photobooth-container">
      <Header />
      <div className="photobooth-content">
        {/* Timer Overlay */}
        {timer > 0 && (
          <div className="timer-overlay">
            <div className="timer-number">{timer}</div>
          </div>
        )}

        {isLoading && (
          <div className="loading-overlay">
            <div className="loading-spinner"></div>
            <p>Starting camera...</p>
          </div>
        )}

        {error && (
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

        {!capturedImage ? (
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
              className="draggable-prize"
              style={{
                left: `${prizePosition.x}%`,
                top: `${prizePosition.y}%`,
                cursor: isDragging ? "grabbing" : "grab",
              }}
              onMouseDown={handlePrizeMouseDown}
              onTouchStart={handlePrizeTouchStart}
              draggable={false}
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
        ) : (
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
