import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "./LearnToHunt.css";
import startBg from "../assets/images/startBg.png";
import slide1 from "../assets/images/slide1.png";
import slide2 from "../assets/images/slide2.png";
import slide3 from "../assets/images/slide3.png";
import Header from "../components/Header";

const slides = [
  {
    image: slide1,
    title: "Learn to Hunt",
    description:
      "Go through the explore mode and complete the augmented reality treasure Hunt successfully.",
  },
  {
    image: slide2,
    title: "Scan Posters Around the City",
    description:
      "Look out for the posters based on the treasure locations on your explore mode. Use your phone to scan them and unlock hidden treasures.",
  },
  {
    image: slide3,
    title: "Collect. Redeem.",
    description:
      "Each checkpoint gives you points. Collect them to redeem exclusive marathon rewards and partner discounts.",
  },
];

const LearnToHunt = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [currentSlide, setCurrentSlide] = useState(0);

  // Log navigation state changes
  useEffect(() => {
    console.log("LearnToHunt - Current location:", location.pathname);
    console.log("LearnToHunt - History length:", window.history.length);
    console.log("LearnToHunt - Location state:", location.state);
  }, [location]);

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    }
  };

  const handlePrev = () => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1);
    }
  };

  const handleStartHunt = () => {
    console.log("LearnToHunt - About to navigate to /home");
    console.log(
      "LearnToHunt - History length before navigate:",
      window.history.length
    );
    navigate("/home");
    setTimeout(() => {
      console.log(
        "LearnToHunt - History length after navigate:",
        window.history.length
      );
    }, 100);
  };

  return (
    <div className="tutorial-screen">
      <div
        className="tutorial-background"
        style={{ backgroundImage: `url(${slides[currentSlide].image})` }}
      >
        <div className="background-overlay"></div>
      </div>

      <Header />

      <div className="tutorial-content">
        <div className="slide-content">
          <h1>{slides[currentSlide].title}</h1>
          <p>{slides[currentSlide].description}</p>
        </div>

        <div className="slide-navigation">
          <button
            className="nav-button prev"
            onClick={handlePrev}
            style={{ visibility: currentSlide > 0 ? "visible" : "hidden" }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path
                d="M15 18L9 12L15 6"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          <button
            className="nav-button next"
            onClick={handleNext}
            style={{
              visibility:
                currentSlide < slides.length - 1 ? "visible" : "hidden",
            }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path
                d="M9 6L15 12L9 18"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>

        <div className="slide-indicators">
          {slides.map((_, index) => (
            <div
              key={index}
              className={`indicator ${index === currentSlide ? "active" : ""}`}
              onClick={() => setCurrentSlide(index)}
            />
          ))}
        </div>

        {currentSlide === slides.length - 1 && (
          <button className="start-hunt-button" onClick={handleStartHunt}>
            START THE HUNT!
          </button>
        )}
      </div>
    </div>
  );
};

export default LearnToHunt;
