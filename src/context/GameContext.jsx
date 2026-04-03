import React, { createContext, useContext, useState } from "react";

const GameContext = createContext();

export function GameProvider({ children }) {
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [mode, setMode] = useState("vs-ai"); // "vs-ai" | "vs-human"

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
