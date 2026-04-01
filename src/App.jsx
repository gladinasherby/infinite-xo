import React, { useState, useEffect, useCallback } from "react";
import confetti from "canvas-confetti";
import { simulateMove, getBestMove } from "./logic/gameLogic";
import "./App.css";
import { DrawnX, DrawnO } from "./components/Drawnmark";
import { StrikeLine } from "./components/StrikeLine";
export default function App() {
  const [state, setState] = useState({
    board: Array(9).fill(null), // Stores objects: { char: "X", id: 101 }
    queues: { X: [], O: [] },
    currentPlayer: "X",
    winner: null,
    winningLine: null,
    isProcessing: false,
    scores: { X: 0, O: 0 },
    moveCount: 0,
    startingPlayer: "X",
  });

  const GRID_PENCIL_FILTER = () => (
    <defs>
      <filter id="pencil-grid" x="-10%" y="-10%" width="120%" height="120%">
        <feTurbulence
          type="fractalNoise"
          baseFrequency="0.05"
          numOctaves="3"
          seed="5"
        />
        <feDisplacementMap in="SourceGraphic" scale="2" />
      </filter>
    </defs>
  );

  const resetBoard = useCallback(() => {
    setState((s) => ({
      ...s,
      board: Array(9).fill(null),
      queues: { X: [], O: [] },
      currentPlayer: s.startingPlayer,
      winner: null,
      winningLine: null, // <--- Reset this!
      isProcessing: false,
      moveCount: 0,
    }));
  }, []);

  const applyMove = useCallback((index) => {
    setState((prev) => {
      if (prev.board[index] || prev.winner) return prev;

      const logicBoard = prev.board.map((cell) => (cell ? cell.char : null));

      // Ensure your simulateMove returns { nextBoard, nextQueues, winner, winningLine }
      const { nextBoard, nextQueues, winner, winningLine } = simulateMove(
        logicBoard,
        prev.queues,
        prev.currentPlayer,
        index,
      );

      const newMoveCount = prev.moveCount + 1;
      const updatedBoard = nextBoard.map((char, i) => {
        if (!char) return null;
        if (i === index) return { char, id: newMoveCount };
        return prev.board[i];
      });

      if (winner) {
        const newScores = { ...prev.scores, [winner]: prev.scores[winner] + 1 };

        confetti({
          /* ... your config ... */
        });

        return {
          ...prev,
          board: updatedBoard,
          queues: nextQueues,
          winner,
          winningLine, // <--- Save the [a, b, c] indices here
          scores: newScores,
          moveCount: newMoveCount,
          startingPlayer: winner,
        };
      }

      return {
        ...prev,
        board: updatedBoard,
        queues: nextQueues,
        moveCount: newMoveCount,
        currentPlayer: prev.currentPlayer === "X" ? "O" : "X",
        isProcessing: false,
      };
    });
  }, []);

  // AI Turn Logic
  useEffect(() => {
    if (state.currentPlayer === "O" && !state.winner) {
      setState((s) => ({ ...s, isProcessing: true }));
      const t = setTimeout(() => {
        // Pass the simplified board to the AI logic
        const logicBoard = state.board.map((cell) => (cell ? cell.char : null));
        const move = getBestMove(logicBoard, state.queues);
        if (move !== undefined) applyMove(move);
      }, 700);
      return () => clearTimeout(t);
    }
  }, [state.currentPlayer, state.winner, state.board, state.queues, applyMove]);

  // Auto-reset on win
  useEffect(() => {
    if (state.winner) {
      const t = setTimeout(resetBoard, 2000);
      return () => clearTimeout(t);
    }
  }, [state.winner, resetBoard]);

  return (
    <div className="container">
      <div className="scoreboard">
        <span className="red">X: {state.scores.X}</span>
        <span className="divider">|</span>
        <span className="black">O: {state.scores.O}</span>
      </div>

      <p className="status">
        {state.winner
          ? `${state.winner} WINS!`
          : state.isProcessing
            ? "AI WRITING..."
            : "YOUR TURN"}
      </p>

      <div className="grid">
        {state.winner && state.winningLine && (
          <StrikeLine indices={state.winningLine} />
        )}
        {state.board.map((cell, i) => {
          // Shading logic: check if this index is at the front of the removal queue
          const isOldest =
            !state.winner &&
            ((state.queues.X.length === 3 && state.queues.X[0] === i) ||
              (state.queues.O.length === 3 && state.queues.O[0] === i));

          // Use the UNIQUE ID stored in the cell object as the key
          // This prevents re-animation of existing marks!
          const markId = cell ? cell.id : `empty-${i}`;

          return (
            <button
              key={i}
              className="cell"
              onClick={() =>
                state.currentPlayer === "X" &&
                !state.isProcessing &&
                applyMove(i)
              }
            >
              {cell?.char === "X" && (
                <DrawnX key={markId} uid={markId} shady={isOldest} />
              )}
              {cell?.char === "O" && (
                <DrawnO key={markId} uid={markId} shady={isOldest} />
              )}
            </button>
          );
        })}
      </div>

      <button
        className="reset-all"
        onClick={() => {
          setState((s) => ({
            ...s,
            scores: { X: 0, O: 0 },
            startingPlayer: "X",
          }));
          resetBoard();
        }}
      >
        CLEAR PAGE
      </button>
    </div>
  );
}
