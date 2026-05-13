import React, { createContext, useContext, useState, useEffect } from "react"; // Added useEffect here

const GameContext = createContext();

export function GameProvider({ children }) {
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [mode, setMode] = useState("vs-ai");

  useEffect(() => {
    const resumeAudio = () => {
      // In Safari, we need to interact with the audio context to "unlock" it
      const AudioContextClass =
        window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        const context = new AudioContextClass();
        if (context.state === "suspended") {
          context.resume();
        }
      }
    };

    window.addEventListener("click", resumeAudio);
    window.addEventListener("touchstart", resumeAudio);

    return () => {
      window.removeEventListener("click", resumeAudio);
      window.removeEventListener("touchstart", resumeAudio);
    };
  }, []); // Runs once on mount

  return (
    <GameContext.Provider
      value={{ soundEnabled, setSoundEnabled, mode, setMode }}
    >
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  return useContext(GameContext);
}
