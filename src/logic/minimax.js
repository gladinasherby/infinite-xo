const WINNING_LINES = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];

export const checkWin = (board) => {
  for (let line of WINNING_LINES) {
    const [a, b, c] = line;
    if (board[a] && board[a] === board[b] && board[a] === board[c])
      return board[a];
  }
  return null;
};

export const simulateMove = (board, queues, player, moveIndex) => {
  const nextBoard = [...board];
  const nextQueues = { X: [...queues.X], O: [...queues.O] };
  nextBoard[moveIndex] = player;

  const winner = checkWin(nextBoard);
  if (!winner && nextQueues[player].length === 2) {
    const oldest = nextQueues[player].shift();
    nextBoard[oldest] = null;
  }
  nextQueues[player].push(moveIndex);
  return { nextBoard, nextQueues, winner };
};

export const minimax = (board, queues, depth, maxDepth, isMax, alpha, beta) => {
  const winner = checkWin(board);
  if (winner === "O") return 10 - depth;
  if (winner === "X") return depth - 10;
  if (depth >= maxDepth) return 0;

  const available = board
    .map((v, i) => (v === null ? i : null))
    .filter((v) => v !== null);
  let bestScore = isMax ? -Infinity : Infinity;

  for (let move of available) {
    const { nextBoard, nextQueues } = simulateMove(
      board,
      queues,
      isMax ? "O" : "X",
      move,
    );
    const score = minimax(
      nextBoard,
      nextQueues,
      depth + 1,
      maxDepth,
      !isMax,
      alpha,
      beta,
    );
    if (isMax) {
      bestScore = Math.max(score, bestScore);
      alpha = Math.max(alpha, bestScore);
    } else {
      bestScore = Math.min(score, bestScore);
      beta = Math.min(beta, bestScore);
    }
    if (beta <= alpha) break;
  }
  return bestScore || 0;
};
