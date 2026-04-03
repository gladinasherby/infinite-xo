import React from "react";
import { useGame } from "../context/GameContext";

export default function HomePage({ onPlay }) {
  const { soundEnabled, setSoundEnabled, mode, setMode } = useGame();

  return (
    <div className="home-container">
      <h1 className="home-title">TIC TAC TOE</h1>

      {/* Sound Toggle */}
      <button
        className="home-btn"
        onClick={() => setSoundEnabled((prev) => !prev)}
      >
        SOUND: {soundEnabled ? "ON" : "OFF"}
      </button>

      {/* Mode Toggle */}
      <button
        className="home-btn"
        onClick={() =>
          setMode((prev) => (prev === "vs-ai" ? "vs-human" : "vs-ai"))
        }
      >
        MODE: {mode === "vs-ai" ? "VS AI" : "VS HUMAN"}
      </button>

      {/* Play */}
      <button className="home-btn play-btn" onClick={onPlay}>
        PLAY
      </button>
    </div>
  );
}
