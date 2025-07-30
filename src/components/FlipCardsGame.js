import React, { useState, useEffect } from "react";
import flipPlace from "../assets/images/flipPlace.png";
import bottle from "../assets/images/bottle.png";
import boy from "../assets/images/boy.png";
import shoe from "../assets/images/shoe.png";

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

const FlipCardsGame = () => {
  const [cards, setCards] = useState(() =>
    shuffle(CARDS.map((image, i) => ({ id: i, ...image })))
  );
  const [flipped, setFlipped] = useState([]); // indices of currently flipped cards
  const [matched, setMatched] = useState([]); // indices of matched cards
  const [hasTried, setHasTried] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(120);

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

  const handleSubmit = () => setSubmitted(true);

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
            fontSize: 22,
            fontWeight: 600,
            color: "#1693f6",
            background: "rgba(255,255,255,0.85)",
            borderRadius: 12,
            padding: 16,
            textAlign: "center",
          }}
        >
          {matched.length / 2} out of 3 pairs matched!
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
