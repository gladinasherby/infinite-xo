import React, { useEffect, useState, useRef } from "react";
import { useGame } from "../context/GameContext";
import "./HomePage.css";

// ─── Mini ghost game logic ────────────────────────────────────────────────────
const WIN_LINES = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];

function checkWinner(board) {
  for (const [a, b, c] of WIN_LINES) {
    if (board[a] && board[a] === board[b] && board[a] === board[c])
      return [a, b, c];
  }
  return null;
}

function getRandomMove(board) {
  const empty = board.map((v, i) => (v ? null : i)).filter((v) => v !== null);
  return empty.length ? empty[Math.floor(Math.random() * empty.length)] : null;
}

// ─── Ghost Board SVG ──────────────────────────────────────────────────────────
function GhostBoard({ board, winLine, size }) {
  const cell = size / 3;
  const pad = 5;

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      overflow="visible"
    >
      {[1, 2].map((i) => (
        <React.Fragment key={i}>
          <line
            x1={cell * i}
            y1={pad}
            x2={cell * i}
            y2={size - pad}
            stroke="currentColor"
            strokeWidth={0.9}
            strokeLinecap="round"
          />
          <line
            x1={pad}
            y1={cell * i}
            x2={size - pad}
            y2={cell * i}
            stroke="currentColor"
            strokeWidth={0.9}
            strokeLinecap="round"
          />
        </React.Fragment>
      ))}
      {board.map((mark, idx) => {
        if (!mark) return null;
        const col = idx % 3,
          row = Math.floor(idx / 3);
        const cx = col * cell + cell / 2;
        const cy = row * cell + cell / 2;
        const r = cell * 0.27;
        const isWin = winLine?.includes(idx);
        if (mark === "X")
          return (
            <g
              key={idx}
              stroke={isWin ? "#c0392b" : "currentColor"}
              strokeWidth={isWin ? 1.6 : 0.9}
              strokeLinecap="round"
            >
              <line x1={cx - r} y1={cy - r} x2={cx + r} y2={cy + r} />
              <line x1={cx + r} y1={cy - r} x2={cx - r} y2={cy + r} />
            </g>
          );
        return (
          <circle
            key={idx}
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke={isWin ? "#c0392b" : "currentColor"}
            strokeWidth={isWin ? 1.6 : 0.9}
          />
        );
      })}
      {winLine &&
        (() => {
          const [a, , c] = winLine;
          return (
            <line
              x1={(a % 3) * cell + cell / 2}
              y1={Math.floor(a / 3) * cell + cell / 2}
              x2={(c % 3) * cell + cell / 2}
              y2={Math.floor(c / 3) * cell + cell / 2}
              stroke="#c0392b"
              strokeWidth={1.2}
              strokeLinecap="round"
              opacity={0.55}
            />
          );
        })()}
    </svg>
  );
}

// ─── Ghost games engine ────────────────────────────────────────────────────────
function useGhostGames(count) {
  // eslint-disable-next-line no-param-reassign
  count = Math.max(count, 120); // always enough for any screen
  const [games, setGames] = useState(() =>
    Array.from({ length: count }, (_, id) => ({
      id,
      board: Array(9).fill(null),
      current: id % 2 === 0 ? "X" : "O",
      winLine: null,
      done: false,
      pauseUntil: 0,
      tickMs: 300 + Math.floor(Math.random() * 350),
    })),
  );

  useEffect(() => {
    const cleanups = Array.from({ length: count }, (_, id) => {
      let timeout;
      function tick() {
        setGames((prev) => {
          const next = [...prev];
          const gm = { ...next[id] };
          const now = Date.now();

          if (gm.done) {
            if (now < gm.pauseUntil) {
              next[id] = gm;
              return next;
            }
            gm.board = Array(9).fill(null);
            gm.current = Math.random() > 0.5 ? "X" : "O";
            gm.winLine = null;
            gm.done = false;
            gm.pauseUntil = 0;
            next[id] = gm;
            return next;
          }

          const move = getRandomMove(gm.board);
          if (move === null) {
            gm.done = true;
            gm.pauseUntil = now + 1200;
            next[id] = gm;
            return next;
          }

          const nb = [...gm.board];
          nb[move] = gm.current;
          const wl = checkWinner(nb);
          if (wl) {
            gm.board = nb;
            gm.winLine = wl;
            gm.done = true;
            gm.pauseUntil = now + 1800;
          } else {
            gm.board = nb;
            gm.current = gm.current === "X" ? "O" : "X";
          }
          next[id] = gm;
          return next;
        });
        timeout = setTimeout(tick, games[id]?.tickMs ?? 400);
      }
      timeout = setTimeout(tick, id * 90); // stagger starts
      return () => clearTimeout(timeout);
    });
    return () => cleanups.forEach((fn) => fn());
  }, []); // eslint-disable-line

  return games;
}

// ─── Dynamic grid that covers the whole viewport ──────────────────────────────
const BOARD_PX = 110;
const GAP_PX = 4;
const STEP = BOARD_PX + GAP_PX;

export default function HomePage({ onPlay }) {
  const { soundEnabled, setSoundEnabled, mode, setMode } = useGame();

  // Calculate how many boards we need to fill the screen
  const [grid, setGrid] = useState({ cols: 8, rows: 6 });
  useEffect(() => {
    function recalc() {
      const cols = Math.ceil(window.innerWidth / STEP) + 2;
      const rows = Math.ceil(window.innerHeight / STEP) + 2;
      setGrid({ cols, rows });
    }
    recalc();
    window.addEventListener("resize", recalc);
    return () => window.removeEventListener("resize", recalc);
  }, []);

  const count = grid.cols * grid.rows;
  const games = useGhostGames(count);

  return (
    <div className="home-root">
      {/* Full-bleed ghost background */}
      <div className="ghost-bg" aria-hidden="true">
        {Array.from({ length: count }, (_, i) => {
          const col = i % grid.cols;
          const row = Math.floor(i / grid.cols);
          const gm = games[i] ?? { board: Array(9).fill(null), winLine: null };
          return (
            <div
              key={i}
              className="ghost-cell"
              style={{
                left: col * STEP,
                top: row * STEP,
                width: BOARD_PX,
                height: BOARD_PX,
              }}
            >
              <GhostBoard
                board={gm.board}
                winLine={gm.winLine}
                size={BOARD_PX}
              />
            </div>
          );
        })}
      </div>

      {/* Centered overlay UI */}
      <div className="home-ui">
        {/* <h1 className="home-title">
          TIC
          <br />
          TAC
          <br />
          TOE
        </h1> */}
        <p className="home-tagline">Infinite XO</p>

        <div className="home-buttons">
          <button
            className="sketchy-btn"
            onClick={() => setSoundEnabled((p) => !p)}
          >
            {soundEnabled ? "♪ SOUND ON" : "♪ SOUND OFF"}
          </button>

          <button
            className="sketchy-btn"
            onClick={() => setMode((p) => (p === "vs-ai" ? "draw" : "vs-ai"))}
          >
            {mode === "vs-ai" ? "⊞ Draw Mode: OFF" : "✏  DRAW MODE"}
          </button>
          <button className="sketchy-btn play-btn" onClick={onPlay}>
            ▶ &nbsp; PLAY
          </button>
        </div>
      </div>
    </div>
  );
}
