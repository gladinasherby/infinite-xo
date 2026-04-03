import React, { useState } from "react";
import { GameProvider } from "./context/GameContext";
import HomePage from "./pages/HomePage";
import GamePage from "./pages/GamePage";
import "./App.css";

export default function App() {
  const [page, setPage] = useState("home"); // "home" | "game"

  return (
    <GameProvider>
      {page === "home" ? (
        <HomePage onPlay={() => setPage("game")} />
      ) : (
        <GamePage onHome={() => setPage("home")} />
      )}
    </GameProvider>
  );
}
