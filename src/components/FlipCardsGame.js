import React, { useState, useEffect } from "react";
import flipPlace from "../assets/images/flipPlace.png";
import bottle from "../assets/images/bottle.png";
import boy from "../assets/images/boy.png";
import shoe from "../assets/images/shoe.png";
import { useUser } from "../context/UserContext";

// Use images for card faces
const CARD_IMAGES = [
  { src: bottle, alt: "Bottle" },
  { src: boy, alt: "Boy" },
  { src: shoe, alt: "Shoe" },
];
const CARDS = [...CARD_IMAGES, ...CARD_IMAGES]; // 3 pairs, 6 cards

function shuffle(array) {
  const arr = array.slice();
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function formatTime(seconds) {
  const m = Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

const FlipCardsGame = ({ onClose }) => {
  const { addBoosterScore } = useUser();
  const [cards, setCards] = useState(() =>
    shuffle(CARDS.map((image, i) => ({ id: i, ...image })))
  );
  const [flipped, setFlipped] = useState([]); // indices of currently flipped cards
  const [matched, setMatched] = useState([]); // indices of matched cards
  const [hasTried, setHasTried] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(120);
  const [score, setScore] = useState(0);

  useEffect(() => {
    if (submitted) return;
    if (timeLeft === 0) {
      setSubmitted(true);
      return;
    }
    const timer = setInterval(() => {
      setTimeLeft((t) => (t > 0 ? t - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft, submitted]);

  const handleFlip = (idx) => {
    if (
      flipped.length === 2 ||
      flipped.includes(idx) ||
      matched.includes(idx) ||
      submitted
    )
      return;
    const newFlipped = [...flipped, idx];
    setFlipped(newFlipped);
    if (!hasTried && newFlipped.length === 2) setHasTried(true);
    if (newFlipped.length === 2) {
      const [i1, i2] = newFlipped;
      if (cards[i1].src === cards[i2].src) {
        setTimeout(() => {
          setMatched((prev) => [...prev, i1, i2]);
          setFlipped([]);
        }, 700);
      } else {
        setTimeout(() => setFlipped([]), 900);
      }
    }
  };

  const handleSubmit = () => {
    // Calculate score based on matched pairs
    const matchedPairs = matched.length / 2;
    let points = 0;
    if (matchedPairs === 3) {
      points = 5; // All pairs matched
    } else if (matchedPairs >= 1) {
      points = 2; // At least 1 pair matched
    } else {
      points = 0; // No pairs matched
    }
    setScore(points);
    setSubmitted(true);
  };

  const handleCollectPoints = async () => {
    // Add points to user's booster scores
    await addBoosterScore(score, "MATCH TILE");
    // setSubmitted(false);
    if (onClose) {
      onClose();
    }
    // You can add logic to close the popup or trigger next flow
  };

  return (
    <div style={{ width: 320, margin: "0 auto" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 12,
          fontSize: 16,
          fontWeight: 600,
          color: "#081F2D",
          justifyContent: "center",
        }}
      >
        <span>TIME - {formatTime(timeLeft)}</span>
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 70px)",
          gridGap: 12,
          justifyContent: "center",
          marginBottom: 24,
        }}
      >
        {cards.map((card, idx) => {
          const isFlipped =
            flipped.includes(idx) || matched.includes(idx) || submitted;
          return (
            <div
              key={card.id}
              style={{
                width: 70,
                height: 70,
                perspective: 600,
                cursor: isFlipped || submitted ? "default" : "pointer",
              }}
              onClick={() => handleFlip(idx)}
            >
              <div
                style={{
                  width: "100%",
                  height: "100%",
                  borderRadius: 10,
                  boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                  background: "#fff",
                  position: "relative",
                  transformStyle: "preserve-3d",
                  transition: "transform 0.4s",
                  transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
                }}
              >
                {/* Card Back */}
                <div
                  style={{
                    position: "absolute",
                    width: "100%",
                    height: "100%",
                    backfaceVisibility: "hidden",
                    background: "#fff",
                    borderRadius: 10,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: "0 4px 8px rgba(0,0,0,0.08)",
                  }}
                >
                  <img
                    src={flipPlace}
                    alt="flip"
                    style={{ width: 36, height: 36, objectFit: "contain" }}
                  />
                </div>
                {/* Card Front */}
                <div
                  style={{
                    position: "absolute",
                    width: "100%",
                    height: "100%",
                    backfaceVisibility: "hidden",
                    background: "#081F2D",
                    borderRadius: 10,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transform: "rotateY(180deg)",
                  }}
                >
                  <img
                    src={card.src}
                    alt={card.alt}
                    style={{ width: 36, height: 36, objectFit: "contain" }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
      {submitted ? (
        <div
          style={{
            width: "100%",
            padding: "14px",
            background: "rgba(255,255,255,0.95)",
            borderRadius: 16,
            margin: "0 auto",
            textAlign: "center",
          }}
        >
          <div
            style={{
              fontWeight: 700,
              fontSize: 16,
              color: "#1693f6",
              margin: "0 0 24px 0",
            }}
          >
            Score: {score} points
          </div>
          <button
            style={{
              width: "100%",
              padding: "8px 0",
              background: "#1693f6",
              color: "#fff",
              border: "none",
              borderRadius: 10,
              fontSize: 14,
              fontWeight: 700,
              cursor: "pointer",
            }}
            onClick={handleCollectPoints}
          >
            COLLECT POINTS
          </button>
        </div>
      ) : (
        hasTried && (
          <button
            style={{
              width: "100%",
              margin: "0 auto",
              padding: "12px 0",
              fontSize: 18,
              fontWeight: 600,
              background: "#1693f6",
              color: "#fff",
              border: "none",
              borderRadius: 12,
              cursor: "pointer",
              display: "block",
            }}
            onClick={handleSubmit}
          >
            Submit
          </button>
        )
      )}
    </div>
  );
};

export default FlipCardsGame;
