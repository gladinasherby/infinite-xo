import React, { useState, useEffect, useCallback } from "react";
import confetti from "canvas-confetti";
import { simulateMove, getBestMove } from "./logic/gameLogic";
import "./App.css";

export default function App() {
  const [state, setState] = useState({
    board: Array(9).fill(null),
    queues: { X: [], O: [] },
    currentPlayer: "X",
    winner: null,
    isProcessing: false,
    scores: { X: 0, O: 0 },
  });

  const resetBoard = useCallback(() => {
    setState((s) => ({
      ...s,
      board: Array(9).fill(null),
      queues: { X: [], O: [] },
      currentPlayer: s.startingPlayer, // Use the stored starting player
      winner: null,
      isProcessing: false,
    }));
  }, []);

  const applyMove = useCallback((index) => {
    setState((prev) => {
      if (prev.board[index] || prev.winner) return prev;

      const { nextBoard, nextQueues, winner } = simulateMove(
        prev.board,
        prev.queues,
        prev.currentPlayer,
        index,
      );

      if (winner) {
        const newScores = { ...prev.scores, [winner]: prev.scores[winner] + 1 };

        // Neon Confetti Trigger...
        confetti({
          /* ... your neon config ... */
        });

        return {
          ...prev,
          board: nextBoard,
          queues: nextQueues,
          winner,
          scores: newScores,
          startingPlayer: winner, // SET THE WINNER AS THE STARTER FOR NEXT ROUND
        };
      }

      // If no winner, just swap turns
      return {
        ...prev,
        board: nextBoard,
        queues: nextQueues,
        currentPlayer: prev.currentPlayer === "X" ? "O" : "X",
        isProcessing: false,
      };
    });
  }, []);

  // Auto-Restart
  useEffect(() => {
    if (state.winner) {
      const t = setTimeout(resetBoard, 1500);
      return () => clearTimeout(t);
    }
  }, [state.winner, resetBoard]);

  // AI Turn
  useEffect(() => {
    if (state.currentPlayer === "O" && !state.winner) {
      setState((s) => ({ ...s, isProcessing: true }));
      const t = setTimeout(() => {
        const move = getBestMove(state.board, state.queues);
        if (move !== undefined) applyMove(move);
      }, 500);
      return () => clearTimeout(t);
    }
  }, [state.currentPlayer, state.winner, state.board, state.queues, applyMove]);

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
            ? "AI THINKING..."
            : "YOUR TURN"}
      </p>

      <div className="grid">
        {state.board.map((cell, i) => {
          // Identify the oldest mark to shade it
          const isOldest =
            !state.winner &&
            ((state.queues.X.length === 2 &&
              state.queues.X[0] === i &&
              state.currentPlayer === "X") ||
              (state.queues.O.length === 2 &&
                state.queues.O[0] === i &&
                state.currentPlayer === "O"));

          return (
            <button
              key={i}
              className={`cell ${cell === "X" ? "red-text" : "black-text"}`}
              onClick={() =>
                state.currentPlayer === "X" &&
                !state.isProcessing &&
                applyMove(i)
              }
            >
              <span className={isOldest ? "shady" : ""}>{cell}</span>
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
            startingPlayer: "X", // Reset starting preference
          }));
          resetBoard();
        }}
      >
        RESET ALL
      </button>
    </div>
  );
}
