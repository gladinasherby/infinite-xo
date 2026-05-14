import React, { useState, useEffect, useCallback, useRef } from "react";
import confetti from "canvas-confetti";
import { simulateMove, getBestMove } from "../logic/gameLogic";
import { DrawnX, DrawnO } from "../components/Drawnmark";
import { StrikeLine } from "../components/StrikeLine";
import { useGame } from "../context/GameContext";
import DrawCanvas, { DrawnInkX } from "../components/DrawCanvas";

export default function GamePage({ onHome }) {
  const { soundEnabled, opponentType, drawMode, roomData } = useGame();

  const [state, setState] = useState({
    board: Array(9).fill(null),
    queues: { X: [], O: [] },
    currentPlayer: "X",
    winner: null,
    winningLine: null,
    isProcessing: false,
    scores: { X: 0, O: 0 },
    moveCount: 0,
    startingPlayer: "X",
  });

  const [cellSize, setCellSize] = useState(120);
  const [inkStrokes, setInkStrokes] = useState({});
  const gridRef = useRef(null);

  useEffect(() => {
    if (!gridRef.current) return;
    const firstCell = gridRef.current.querySelector(".cell");
    if (firstCell) {
      setCellSize(firstCell.getBoundingClientRect().width);
    }
  });

  const resetBoard = useCallback(() => {
    setInkStrokes({});
    setState((s) => ({
      ...s,
      board: Array(9).fill(null),
      queues: { X: [], O: [] },
      currentPlayer: s.startingPlayer,
      winner: null,
      winningLine: null,
      isProcessing: false,
      moveCount: 0,
    }));
  }, []);

  const applyMove = useCallback((index, forcedPlayer = null) => {
    setState((prev) => {
      if (prev.board[index] || prev.winner) return prev;

      const player = forcedPlayer || prev.currentPlayer;

      const logicBoard = prev.board.map((cell) => (cell ? cell.char : null));

      const { nextBoard, nextQueues, winner, winningLine } = simulateMove(
        logicBoard,
        prev.queues,
        player,
        index,
      );

      const newMoveCount = prev.moveCount + 1;

      const updatedBoard = nextBoard.map((char, i) => {
        if (!char) return null;

        if (i === index) {
          return {
            char,
            id: newMoveCount,
          };
        }

        return prev.board[i];
      });

      if (winner) {
        const newScores = {
          ...prev.scores,
          [winner]: prev.scores[winner] + 1,
        };

        confetti({});

        return {
          ...prev,
          board: updatedBoard,
          queues: nextQueues,
          winner,
          winningLine,
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
        currentPlayer: player === "X" ? "O" : "X",
        isProcessing: false,
      };
    });
  }, []);

  // Sync with remote server if online
  useEffect(() => {
    if (opponentType === "online" && roomData?.socket) {
      const socket = roomData.socket;
      const onRemoteMove = (data) => {
        if (data.strokes) {
          setInkStrokes((prev) => ({ ...prev, [data.move]: data.strokes }));
        }
        applyMove(data.move, data.player);
      };

      const onRemotePlayAgain = () => {
        setState((s) => ({
          ...s,
          scores: { X: 0, O: 0 },
          startingPlayer: "X",
        }));
        resetBoard();
      };

      socket.on("remote_move", onRemoteMove);
      socket.on("remote_play_again", onRemotePlayAgain);

      return () => {
        socket.off("remote_move", onRemoteMove);
        socket.off("remote_play_again", onRemotePlayAgain);
      };
    }
  }, [opponentType, roomData, applyMove, resetBoard]);

  // AI plays O in "ai" mode
  useEffect(() => {
    if (opponentType === "ai" && state.currentPlayer === "O" && !state.winner) {
      setState((s) => ({ ...s, isProcessing: true }));
      const t = setTimeout(() => {
        const logicBoard = state.board.map((cell) => (cell ? cell.char : null));
        const move = getBestMove(logicBoard, state.queues);
        if (move !== undefined) applyMove(move);
      }, 700);
      return () => clearTimeout(t);
    }
  }, [
    state.currentPlayer,
    state.winner,
    state.board,
    state.queues,
    applyMove,
    opponentType,
  ]);

  useEffect(() => {
    if (state.winner) {
      const t = setTimeout(resetBoard, 4000);
      return () => clearTimeout(t);
    }
  }, [state.winner, resetBoard]);

  const isMyTurn =
    opponentType === "online" && roomData
      ? state.currentPlayer === roomData.role
      : opponentType === "ai"
        ? state.currentPlayer === "X"
        : true;

  const isMyDrawTurn =
    drawMode && isMyTurn && !state.winner && !state.isProcessing;

  const statusText = state.winner
    ? `${state.winner} WINS!`
    : state.isProcessing
      ? "AI WRITING..."
      : isMyDrawTurn
        ? `DRAW YOUR ${state.currentPlayer}`
        : opponentType === "online" && !isMyTurn
          ? "WAITING FOR OPPONENT"
          : `${state.currentPlayer}'S TURN`;

  return (
    <div className="container">
      <button
        className="home-link"
        onClick={() => {
          if (roomData?.socket) {
            roomData.socket.disconnect();
          }
          onHome();
        }}
      >
        ← HOME
      </button>

      <div className="scoreboard">
        <span className="red">X: {state.scores.X}</span>
        <span className="divider">|</span>
        <span className="black">O: {state.scores.O}</span>
      </div>

      <p className="status">{statusText}</p>

      <div className="grid" ref={gridRef}>
        {state.winner && state.winningLine && (
          <StrikeLine
            key={`${state.scores.X}-${state.scores.O}`}
            indices={state.winningLine}
            soundEnabled={soundEnabled}
          />
        )}
        {state.board.map((cell, i) => {
          const isOldest =
            !state.winner &&
            ((state.queues.X.length === 3 && state.queues.X[0] === i) ||
              (state.queues.O.length === 3 && state.queues.O[0] === i));

          const markId = cell ? cell.id : `empty-${i}`;

          const clickable = !state.isProcessing && !state.winner && isMyTurn;

          // In draw mode, canvas is live on every empty cell if it's my turn
          const showDrawCanvas = isMyDrawTurn && !cell;

          return (
            <button
              key={i}
              className="cell"
              style={{ position: "relative" }}
              onClick={() => {
                if (!drawMode && clickable) {
                  applyMove(i);
                  if (opponentType === "online" && roomData) {
                    roomData.socket.emit("make_move", {
                      code: roomData.code,
                      move: i,
                      strokes: null,
                      player: state.currentPlayer,
                    });
                  }
                }
              }}
            >
              {drawMode && cell?.char === "X" && inkStrokes[i] ? (
                <DrawnInkX
                  strokes={inkStrokes[i]}
                  size={cellSize}
                  shady={isOldest}
                />
              ) : (
                cell?.char === "X" && (
                  <DrawnX
                    key={markId}
                    uid={markId}
                    shady={isOldest}
                    soundEnabled={soundEnabled}
                  />
                )
              )}

              {drawMode && cell?.char === "O" && inkStrokes[i] ? (
                // Use a DrawnInk for O but with O's color logic. Since DrawnInkX uses red, we could make it DrawnInkO or just use it.
                // Wait, previously DrawnInk was only for X because AI played O!
                // For online, both might draw. We need to pass color. DrawnInkX defaults to red.
                // I will add a char prop to DrawnInkX below, but for now we'll rely on it.
                <DrawnInkX
                  strokes={inkStrokes[i]}
                  size={cellSize}
                  shady={isOldest}
                  char="O"
                />
              ) : (
                cell?.char === "O" && (
                  <DrawnO
                    key={markId}
                    uid={markId}
                    shady={isOldest}
                    soundEnabled={soundEnabled}
                  />
                )
              )}

              {showDrawCanvas && (
                <DrawCanvas
                  cellSize={cellSize}
                  soundEnabled={soundEnabled}
                  onConfirm={(strokes) => {
                    setInkStrokes((prev) => ({ ...prev, [i]: strokes }));
                    applyMove(i);
                    if (opponentType === "online" && roomData) {
                      roomData.socket.emit("make_move", {
                        code: roomData.code,
                        move: i,
                        strokes,
                        player: state.currentPlayer,
                      });
                    }
                  }}
                  onCancel={() => {}}
                />
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
          if (opponentType === "online" && roomData) {
            roomData.socket.emit("play_again", { code: roomData.code });
          }
        }}
      >
        CLEAR PAGE
      </button>
    </div>
  );
}
