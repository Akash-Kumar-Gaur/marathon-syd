import React, { useState, useEffect } from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import puzzleImage from "../assets/images/puzzle.png";

const GRID_SIZE = 3;
const PIECE_SIZE = 80; // px, adjust as needed

// Helper to get background position for a piece
function getBgPosition(index) {
  const row = Math.floor(index / GRID_SIZE);
  const col = index % GRID_SIZE;
  return `${-col * PIECE_SIZE}px ${-row * PIECE_SIZE}px`;
}

// Initial tray: shuffled 0-8
function shuffle(array) {
  const arr = array.slice();
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

const initialTray = shuffle([...Array(9).keys()]);
const initialGrid = Array(9).fill(null);

const JigsawTrayPuzzle = () => {
  const [tray, setTray] = useState(initialTray);
  const [grid, setGrid] = useState(initialGrid);
  const [isDragging, setIsDragging] = useState(false);
  const [solved, setSolved] = useState(false);
  const [hasMoved, setHasMoved] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);

  useEffect(() => {
    if (isDragging) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isDragging]);

  const onDragStart = () => setIsDragging(true);

  const onDragEnd = (result) => {
    setIsDragging(false);
    if (!result.destination) return;
    setHasMoved(true);
    const { source, destination, draggableId } = result;
    const pieceIndex = parseInt(draggableId, 10);

    // From tray to grid
    if (
      source.droppableId === "tray" &&
      destination.droppableId.startsWith("grid-")
    ) {
      const gridIdx = parseInt(destination.droppableId.split("-")[1], 10);
      if (grid[gridIdx] !== null) return; // already filled
      const newTray = tray.filter((n) => n !== pieceIndex);
      const newGrid = [...grid];
      newGrid[gridIdx] = pieceIndex;
      setTray(newTray);
      setGrid(newGrid);
      // Check solved
      if (newGrid.every((val, idx) => val === idx)) {
        setSolved(true);
      }
    }
    // From grid back to tray
    else if (
      source.droppableId.startsWith("grid-") &&
      destination.droppableId === "tray"
    ) {
      const gridIdx = parseInt(source.droppableId.split("-")[1], 10);
      if (grid[gridIdx] === null) return;
      const newTray = [...tray, grid[gridIdx]];
      const newGrid = [...grid];
      newGrid[gridIdx] = null;
      setTray(newTray);
      setGrid(newGrid);
    }
    // Move/swap within grid
    else if (
      source.droppableId.startsWith("grid-") &&
      destination.droppableId.startsWith("grid-")
    ) {
      const fromIdx = parseInt(source.droppableId.split("-")[1], 10);
      const toIdx = parseInt(destination.droppableId.split("-")[1], 10);
      if (fromIdx === toIdx) return;
      const newGrid = [...grid];
      // Swap pieces
      const temp = newGrid[toIdx];
      newGrid[toIdx] = newGrid[fromIdx];
      newGrid[fromIdx] = temp;
      setGrid(newGrid);
      // Check solved
      if (newGrid.every((val, idx) => val === idx)) {
        setSolved(true);
      }
    }
  };

  const handleSubmit = () => {
    const correct = grid.filter((val, idx) => val === idx).length;
    setCorrectCount(correct);
    setSubmitted(true);
  };

  return (
    <div
      style={{
        width: GRID_SIZE * PIECE_SIZE,
        margin: "0 auto",
        position: "relative",
      }}
    >
      {/* Faint original answer as background */}
      <img
        src={puzzleImage}
        alt="original"
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: GRID_SIZE * PIECE_SIZE,
          height: GRID_SIZE * PIECE_SIZE,
          opacity: 0.2,
          zIndex: 0,
          pointerEvents: "none",
          userSelect: "none",
        }}
        draggable={false}
      />
      <div style={{ position: "relative", zIndex: 1 }}>
        <DragDropContext onDragEnd={onDragEnd} onDragStart={onDragStart}>
          {/* Grid */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: `repeat(${GRID_SIZE}, ${PIECE_SIZE}px)`,
              marginBottom: 24,
            }}
          >
            {grid.map((piece, idx) => (
              <Droppable
                droppableId={`grid-${idx}`}
                key={idx}
                isDropDisabled={grid[idx] !== null}
              >
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    style={{
                      width: PIECE_SIZE,
                      height: PIECE_SIZE,
                      border: solved ? "none" : "1px solid #ccc",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      padding: 0,
                      margin: 0,
                    }}
                  >
                    {piece !== null && (
                      <Draggable
                        draggableId={piece.toString()}
                        index={0}
                        key={piece}
                      >
                        {(provided) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            style={{
                              width: PIECE_SIZE,
                              height: PIECE_SIZE,
                              minWidth: PIECE_SIZE,
                              minHeight: PIECE_SIZE,
                              backgroundImage: `url(${puzzleImage})`,
                              backgroundSize: `${GRID_SIZE * PIECE_SIZE}px ${
                                GRID_SIZE * PIECE_SIZE
                              }px`,
                              backgroundPosition: getBgPosition(piece),
                              boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                              ...provided.draggableProps.style,
                            }}
                          />
                        )}
                      </Draggable>
                    )}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            ))}
          </div>
          {/* Tray, Submit, or Solved! */}
          {solved ? (
            <div
              style={{
                width: GRID_SIZE * PIECE_SIZE,
                height: PIECE_SIZE + 16,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 32,
                fontWeight: 700,
                color: "#1693f6",
                animation: "bounce 0.7s",
                background: "rgba(255,255,255,0.85)",
                borderRadius: 16,
                margin: "0 auto",
              }}
            >
              Solved!
              <style>{`
                @keyframes bounce {
                  0% { transform: scale(1); }
                  30% { transform: scale(1.2); }
                  50% { transform: scale(0.95); }
                  70% { transform: scale(1.05); }
                  100% { transform: scale(1); }
                }
              `}</style>
            </div>
          ) : submitted ? (
            <div
              style={{
                width: GRID_SIZE * PIECE_SIZE,
                height: PIECE_SIZE + 16,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 24,
                fontWeight: 600,
                color: "#1693f6",
                background: "rgba(255,255,255,0.85)",
                borderRadius: 16,
                margin: "0 auto",
              }}
            >
              {correctCount} out of 9 correct!
            </div>
          ) : (
            <>
              <Droppable droppableId="tray" direction="horizontal">
                {(provided) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    style={{
                      display: "flex",
                      overflowX: "auto",
                      gap: 8,
                      paddingBottom: 8,
                      background: "#eaf7fc",
                      // borderRadius: 8,
                      minHeight: PIECE_SIZE + 8,
                      marginBottom: 8,
                      alignItems: "center",
                    }}
                  >
                    {tray.map((piece, idx) => (
                      <Draggable
                        draggableId={piece.toString()}
                        index={idx}
                        key={piece}
                      >
                        {(provided) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            style={{
                              width: PIECE_SIZE,
                              height: PIECE_SIZE,
                              minWidth: PIECE_SIZE,
                              minHeight: PIECE_SIZE,
                              backgroundImage: `url(${puzzleImage})`,
                              backgroundSize: `${GRID_SIZE * PIECE_SIZE}px ${
                                GRID_SIZE * PIECE_SIZE
                              }px`,
                              backgroundPosition: getBgPosition(piece),
                              boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                              ...provided.draggableProps.style,
                            }}
                          />
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
              {hasMoved && (
                <button
                  style={{
                    width: GRID_SIZE * PIECE_SIZE,
                    margin: "16px auto 0 auto",
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
                  Submit Puzzle
                </button>
              )}
            </>
          )}
        </DragDropContext>
      </div>
    </div>
  );
};

export default JigsawTrayPuzzle;
