import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./SplashScreen.css";
import sydTcsLogo from "../assets/images/syd-tcs-logo.png";

const SplashScreen = () => {
  const [progress, setProgress] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            setIsLoading(false);
            navigate("/welcome");
          }, 500);
          return 100;
        }
        return prev + 2;
      });
    }, 40);

    return () => clearInterval(interval);
  }, [navigate]);

  if (!isLoading) return null;

  return (
    <div className="splash-screen">
      <div className="splash-content">
        <div className="logo-section">
          <div className="tcs-logo">
            <img
              src={sydTcsLogo}
              alt="TCS Sydney Marathon"
              className="logo-image"
            />
          </div>
        </div>

        <div className="progress-section">
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SplashScreen;
