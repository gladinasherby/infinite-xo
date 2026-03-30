import { useState, useCallback } from "react";

const WINNING_LINES = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8], // Rows
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8], // Cols
  [0, 4, 8],
  [2, 4, 6], // Diagonals
];

export const useGameLogic = () => {
  const [board, setBoard] = useState(Array(9).fill(null));
  const [queues, setQueues] = useState({ X: [], O: [] });
  const [currentPlayer, setCurrentPlayer] = useState("X");
  const [winner, setWinner] = useState(null);

  const checkWinner = (currentBoard) => {
    for (let line of WINNING_LINES) {
      const [a, b, c] = line;
      if (
        currentBoard[a] &&
        currentBoard[a] === currentBoard[b] &&
        currentBoard[a] === currentBoard[c]
      ) {
        return currentBoard[a];
      }
    }
    return null;
  };

  const makeMove = useCallback(
    (index) => {
      // Validation: Cell must be empty and game must not be over
      if (board[index] || winner) return;

      setBoard((prevBoard) => {
        const newBoard = [...prevBoard];
        const playerQueue = [...queues[currentPlayer]];

        // 1. Add new move
        newBoard[index] = currentPlayer;
        playerQueue.push(index);

        // 2. FIFO Logic: If 4th move, remove oldest
        if (playerQueue.length > 3) {
          const oldestIndex = playerQueue.shift();
          newBoard[oldestIndex] = null;
        }

        // 3. Check for winner AFTER move/removal logic
        const winResult = checkWinner(newBoard);
        if (winResult) setWinner(winResult);

        // 4. Update state for next turn
        setQueues((prev) => ({ ...prev, [currentPlayer]: playerQueue }));
        setCurrentPlayer(currentPlayer === "X" ? "O" : "X");

        return newBoard;
      });
    },
    [board, currentPlayer, queues, winner],
  );

  const resetGame = () => {
    setBoard(Array(9).fill(null));
    setQueues({ X: [], O: [] });
    setCurrentPlayer("X");
    setWinner(null);
  };

  return { board, currentPlayer, winner, makeMove, resetGame, queues };
};
