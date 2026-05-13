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
  const { 
    soundEnabled, setSoundEnabled, 
    opponentType, setOpponentType, 
    drawMode, setDrawMode, 
    setRoomData 
  } = useGame();

  const [grid, setGrid] = useState({ cols: 8, rows: 6 });
  const [onlineState, setOnlineState] = useState('idle'); // 'idle', 'choose', 'hosting', 'joining'
  const [joinCode, setJoinCode] = useState("");
  const [localRoomCode, setLocalRoomCode] = useState("");
  const socketRef = useRef(null);

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

  // Cleanup socket if we unmount while not playing
  useEffect(() => {
    return () => {
      if (socketRef.current && onlineState !== 'playing') {
        socketRef.current.disconnect();
      }
    };
  }, [onlineState]);

  const count = grid.cols * grid.rows;
  const games = useGhostGames(count);

  const handlePlayClick = () => {
    if (opponentType === 'online') {
      setOnlineState('choose');
    } else {
      setRoomData(null);
      onPlay();
    }
  };

  const handleHost = async () => {
    setOnlineState('hosting');
    // Using dynamic import so it doesn't break if socket.io-client is missing or SSR
    const { io } = await import('socket.io-client');
    const socket = io("http://localhost:3001");
    socketRef.current = socket;

    socket.emit('create_room');
    socket.on('room_created', (code) => {
      setLocalRoomCode(code);
    });

    socket.on('game_start', (data) => {
      setOnlineState('playing');
      setRoomData({ code: data.code, role: 'X', socket });
      onPlay();
    });
  };

  const handleJoin = () => {
    setOnlineState('joining');
  };

  const submitJoin = async () => {
    if (joinCode.length !== 6) return;
    const { io } = await import('socket.io-client');
    const socket = io("http://localhost:3001");
    socketRef.current = socket;

    socket.emit('join_room', joinCode);

    socket.on('join_error', (msg) => {
      alert(msg);
      socket.disconnect();
      setOnlineState('choose');
    });

    socket.on('game_start', (data) => {
      setOnlineState('playing');
      setRoomData({ code: data.code, role: 'O', socket });
      onPlay();
    });
  };

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
        <p className="home-tagline">Infinite XO</p>

        {onlineState === 'idle' && (
          <div className="home-buttons">
            <button
              className="sketchy-btn"
              onClick={() => setSoundEnabled((p) => !p)}
            >
              {soundEnabled ? "♪ SOUND ON" : "♪ SOUND OFF"}
            </button>

            <button
              className="sketchy-btn"
              onClick={() => {
                setOpponentType(p => p === 'ai' ? 'local' : p === 'local' ? 'online' : 'ai');
              }}
            >
              {opponentType === 'ai' ? "👤 VS AI" : opponentType === 'local' ? "👥 2 PLAYERS" : "🌐 PLAY ONLINE"}
            </button>

            <button
              className="sketchy-btn"
              onClick={() => setDrawMode((p) => !p)}
            >
              {drawMode ? "✏ DRAW : ON" : "⊞ DRAW : OFF"}
            </button>

            <button className="sketchy-btn play-btn" onClick={handlePlayClick}>
              ▶ &nbsp; PLAY
            </button>
          </div>
        )}

        {onlineState === 'choose' && (
          <div className="home-buttons">
            <p style={{marginBottom: "10px", fontWeight: "bold"}}>Play Online</p>
            <button className="sketchy-btn" onClick={handleHost}>
              CREATE GAME
            </button>
            <button className="sketchy-btn" onClick={handleJoin}>
              JOIN GAME
            </button>
            <button className="sketchy-btn" onClick={() => setOnlineState('idle')} style={{marginTop: "20px"}}>
              ← BACK
            </button>
          </div>
        )}

        {onlineState === 'hosting' && (
          <div className="home-buttons">
            <p style={{marginBottom: "10px", fontWeight: "bold"}}>Waiting for opponent...</p>
            <p style={{fontSize: "2rem", letterSpacing: "5px", background: "#f0f0f0", padding: "10px", borderRadius: "5px"}}>{localRoomCode || "..."}</p>
            <p style={{fontSize: "0.8rem", color: "#666", marginTop: "5px"}}>Code expires in 5 minutes</p>
            <button className="sketchy-btn" onClick={() => {
              if (socketRef.current) socketRef.current.disconnect();
              setOnlineState('choose');
            }} style={{marginTop: "20px"}}>
              CANCEL
            </button>
          </div>
        )}

        {onlineState === 'joining' && (
          <div className="home-buttons">
            <p style={{marginBottom: "10px", fontWeight: "bold"}}>Enter 6-digit code</p>
            <input 
              type="text" 
              maxLength={6}
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.replace(/[^0-9]/g, ''))}
              style={{fontSize: "1.5rem", textAlign: "center", width: "150px", padding: "10px", marginBottom: "10px", letterSpacing: "5px"}}
            />
            <button className="sketchy-btn" onClick={submitJoin}>
              JOIN
            </button>
            <button className="sketchy-btn" onClick={() => {
              if (socketRef.current) socketRef.current.disconnect();
              setOnlineState('choose');
            }} style={{marginTop: "20px"}}>
              ← BACK
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
