import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Welcome.css";
import bibFormBg from "../assets/images/bibForm.png";
import Header from "../components/Header";

const FindMyRoute = () => {
  const [bibNumber, setBibNumber] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!bibNumber.trim()) {
      alert("Please enter your BIB number");
      return;
    }

    setIsLoading(true);

    // Simulate API call or processing
    setTimeout(() => {
      console.log("BIB Number submitted:", bibNumber);
      setIsLoading(false);

      // Navigate to Wayfinder with BIB number
      navigate("/wayfinder", {
        state: { bibNumber: parseInt(bibNumber) },
      });
    }, 1000);
  };

  const handleInputChange = (e) => {
    setBibNumber(e.target.value);
  };

  return (
    <div className="welcome-screen">
      <Header />
      <div className="form-background">
        <div className="form-image-container">
          <img
            src={bibFormBg}
            alt="Marathon runners"
            style={{
              marginTop: 60,
              objectFit: "contain",
            }}
          />
        </div>
        <div className="center-card">
          <div className="form-content">
            <div className="form-welcome">
              <h1>Find My Route</h1>
              <p>
                Enter your Bib Number to get your personalized walking route.
              </p>
            </div>
            <form onSubmit={handleSubmit} className="registration-form">
              <div className="form-group">
                <label>BIB Number</label>
                <input
                  type="text"
                  value={bibNumber}
                  onChange={handleInputChange}
                  placeholder="Enter your BIB number"
                  disabled={isLoading}
                />
              </div>
              <button
                type="submit"
                className="send-otp-button"
                disabled={isLoading || !bibNumber.trim()}
              >
                {isLoading ? "PROCESSING..." : "SUBMIT"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FindMyRoute;
