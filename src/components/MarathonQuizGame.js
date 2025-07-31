import React, { useState } from "react";

const QUESTIONS = [
  {
    question: "Which Sydney landmark does the marathon pass through?",
    options: ["A. OPERA HOUSE", "B. HARBOUR BRIDGE"],
    answer: 1, // 0-based index, correct is B
  },
  {
    question: "What is the official distance of a marathon?",
    options: ["A. 21.1 km", "B. 42.195 km"],
    answer: 1, // correct is B
  },
];

const QuizResult = ({ score, total, onCollect }) => {
  // 3 stars: 100% (5/5), 2 stars: >= 60% (3/5), 1 star: >= 40% (2/5), 0: < 40%
  const maxScore = 5;
  const percent = score / maxScore;
  let stars = 1;
  if (percent >= 0.95) stars = 3;
  else if (percent >= 0.6) stars = 2;
  else if (percent >= 0.4) stars = 1;
  else stars = 0;
  return (
    <div
      style={{
        margin: "0 auto",
        textAlign: "center",
      }}
    >
      <h2
        style={{ fontWeight: 700, fontSize: 28, margin: 0, color: "#081F2D" }}
      >
        Well done!
      </h2>
      <div style={{ color: "#22313F", fontSize: 16, margin: "12px 0 24px 0" }}>
        You've completed the quiz and earned <b>+{score} Bonus Points!</b>
      </div>
      <div style={{ margin: "16px 0" }}>
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            style={{
              fontSize: 36,
              color: i < stars ? "#081F2D" : "#B3C1D1",
              margin: "0 6px",
            }}
          >
            ★
          </span>
        ))}
      </div>
      <div
        style={{
          fontWeight: 700,
          fontSize: 24,
          color: "#081F2D",
          margin: "16px 0 24px 0",
        }}
      >
        Your Score: {score}/5
      </div>
      <button
        style={{
          width: "100%",
          padding: "16px 0",
          background: "#1693f6",
          color: "#fff",
          border: "none",
          borderRadius: 12,
          fontSize: 18,
          fontWeight: 700,
          cursor: "pointer",
        }}
        onClick={onCollect}
      >
        COLLECT REWARDS
      </button>
    </div>
  );
};

const MarathonQuizGame = () => {
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [submitted, setSubmitted] = useState(false);
  const [showResult, setShowResult] = useState(false);

  const handleOption = (idx) => {
    if (submitted) return;
    setSelected(idx);
  };

  const handleSubmit = () => {
    if (selected === null) return;
    const newAnswers = [...answers, selected];
    if (current < QUESTIONS.length - 1) {
      setAnswers(newAnswers);
      setCurrent(current + 1);
      setSelected(null);
    } else {
      setAnswers(newAnswers);
      setSubmitted(true);
    }
  };

  const handleCollect = () => {
    setShowResult(false);
    // You can add logic to close the popup or trigger next flow
  };

  const correctCount = answers.filter(
    (ans, i) => ans === QUESTIONS[i].answer
  ).length;

  // New scoring system: each question = 2 points, bonus 1 for both correct
  let score = correctCount * 2;
  if (correctCount === 2) {
    score += 1; // Bonus point for getting both correct
  }

  return (
    <div
      style={{
        background: "#eaf7fc",
        borderRadius: 20,
        padding: 24,
        width: 340,
        margin: "0 auto",
        textAlign: "center",
      }}
    >
      {submitted || showResult ? (
        <QuizResult
          score={score}
          total={QUESTIONS.length}
          onCollect={handleCollect}
        />
      ) : (
        <>
          <h2
            style={{
              fontWeight: 700,
              fontSize: 28,
              margin: 0,
              color: "#081F2D",
            }}
          >
            Marathon Quiz
          </h2>
          <div
            style={{ color: "#22313F", fontSize: 16, margin: "12px 0 24px 0" }}
          >
            Answer quick questions and earn bonus points or rewards!
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 12,
            }}
          >
            <div style={{ fontWeight: 700, fontSize: 20, color: "#081F2D" }}>
              {current + 1}.{" "}
              <span style={{ fontWeight: 700 }}>
                {QUESTIONS[current].question}
              </span>
            </div>
            <div
              style={{
                color: "#7B8A99",
                fontWeight: 600,
                fontSize: 16,
                marginLeft: 8,
              }}
            >
              {current + 1}/{QUESTIONS.length}
            </div>
          </div>
          <div style={{ margin: "24px 0 32px 0" }}>
            {QUESTIONS[current].options.map((opt, idx) => (
              <button
                key={idx}
                onClick={() => handleOption(idx)}
                style={{
                  width: "100%",
                  padding: "18px 0",
                  marginBottom: 16,
                  borderRadius: 14,
                  border: selected === idx ? "none" : "2px solid #081F2D",
                  background: selected === idx ? "#081F2D" : "#fff",
                  color: selected === idx ? "#fff" : "#081F2D",
                  fontWeight: 700,
                  fontSize: 18,
                  cursor: submitted ? "default" : "pointer",
                  transition: "all 0.2s",
                  outline: "none",
                }}
                disabled={submitted}
              >
                {opt}
              </button>
            ))}
          </div>
          <button
            style={{
              width: "100%",
              padding: "16px 0",
              background: selected !== null ? "#1693f6" : "#b3d8f7",
              color: "#fff",
              border: "none",
              borderRadius: 12,
              fontSize: 18,
              fontWeight: 700,
              cursor: selected !== null ? "pointer" : "not-allowed",
              marginTop: 8,
            }}
            onClick={handleSubmit}
            disabled={selected === null}
          >
            SUBMIT
          </button>
        </>
      )}
    </div>
  );
};

export default MarathonQuizGame;
