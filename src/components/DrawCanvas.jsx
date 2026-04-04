import React, { useRef, useEffect, useState, useCallback } from "react";
import "./DrawCanvas.css";

function looksLikeX(strokes) {
  const pts = strokes.flat();
  if (pts.length < 6) return false;

  const dir = (seg) => {
    const dx = seg[seg.length - 1].x - seg[0].x;
    const dy = seg[seg.length - 1].y - seg[0].y;
    const len = Math.hypot(dx, dy);
    return len < 1 ? null : { x: dx / len, y: dy / len };
  };
  const dot = (a, b) => a.x * b.x + a.y * b.y;

  if (strokes.length === 1) {
    const all = strokes[0];
    const half = Math.floor(all.length / 2);
    const d1 = dir(all.slice(0, half));
    const d2 = dir(all.slice(half));
    if (!d1 || !d2) return false;
    const xs = all.map((p) => p.x);
    const ys = all.map((p) => p.y);
    const w = Math.max(...xs) - Math.min(...xs);
    const h = Math.max(...ys) - Math.min(...ys);
    const aspect = Math.min(w, h) / Math.max(w, h);
    return aspect > 0.25 && dot(d1, d2) < 0.3;
  }

  if (strokes.length >= 2) {
    const d1 = dir(strokes[0]);
    const d2 = dir(strokes[1]);
    if (!d1 || !d2) return false;
    const similarity = Math.abs(dot(d1, d2));
    const diag1 = Math.abs(d1.x) > 0.15 && Math.abs(d1.y) > 0.15;
    const diag2 = Math.abs(d2.x) > 0.15 && Math.abs(d2.y) > 0.15;
    return similarity < 0.75 && diag1 && diag2;
  }

  return false;
}

export function DrawnInkX({ strokes, size, shady }) {
  if (!strokes || strokes.length === 0) return null;
  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        opacity: shady ? 0.35 : 1,
      }}
    >
      {strokes.map((pts, si) =>
        pts.length < 2 ? null : (
          <polyline
            key={si}
            points={pts.map((p) => `${p.x},${p.y}`).join(" ")}
            fill="none"
            stroke="#1a1a1a"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ),
      )}
    </svg>
  );
}

export default function DrawCanvas({ onConfirm, cellSize }) {
  const canvasRef = useRef(null);
  const [strokes, setStrokes] = useState([]);
  const [feedback, setFeedback] = useState(null);
  const isDrawingRef = useRef(false); // ref so pointer handlers stay stable
  const currentStroke = useRef([]);
  const validateTimer = useRef(null);
  const committedRef = useRef(false); // prevent double-confirm

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = cellSize;
    canvas.height = cellSize;
  }, [cellSize]);

  const redraw = useCallback((allStrokes, livePts) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = "#1a1a1a";
    ctx.lineWidth = 3.5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    const drawPts = (pts) => {
      if (pts.length < 2) return;
      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);
      for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
      ctx.stroke();
    };
    allStrokes.forEach(drawPts);
    if (livePts.length) drawPts(livePts);
  }, []);

  const clearCanvas = useCallback(() => {
    setStrokes([]);
    setFeedback(null);
    currentStroke.current = [];
    committedRef.current = false;
    const canvas = canvasRef.current;
    if (canvas)
      canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);
  }, []);

  const tryValidate = useCallback(
    (newStrokes) => {
      clearTimeout(validateTimer.current);
      validateTimer.current = setTimeout(() => {
        if (committedRef.current) return;
        if (looksLikeX(newStrokes)) {
          committedRef.current = true;
          onConfirm(newStrokes);
        } else if (newStrokes.length >= 2) {
          setFeedback("bad");
          setTimeout(clearCanvas, 700);
        }
        // 1 stroke that isn't an X yet — wait for a second stroke
      }, 400);
    },
    [onConfirm, clearCanvas],
  );

  const getPos = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const src = e.touches ? e.touches[0] : e;
    return { x: src.clientX - rect.left, y: src.clientY - rect.top };
  };

  const onPointerDown = useCallback(
    (e) => {
      // Only respond to the primary pointer (ignore if another cell is mid-stroke)
      if (!e.isPrimary) return;
      e.preventDefault();
      e.stopPropagation();
      canvasRef.current.setPointerCapture(e.pointerId);
      clearTimeout(validateTimer.current);
      isDrawingRef.current = true;
      setFeedback(null);
      currentStroke.current = [getPos(e)];
      // Use functional update to read latest strokes without stale closure
      setStrokes((s) => {
        redraw(s, currentStroke.current);
        return s;
      });
    },
    [redraw],
  );

  const onPointerMove = useCallback(
    (e) => {
      if (!isDrawingRef.current || !e.isPrimary) return;
      e.preventDefault();
      currentStroke.current.push(getPos(e));
      setStrokes((s) => {
        redraw(s, currentStroke.current);
        return s;
      });
    },
    [redraw],
  );

  const onPointerUp = useCallback(
    (e) => {
      if (!isDrawingRef.current || !e.isPrimary) return;
      e.preventDefault();
      isDrawingRef.current = false;
      const finished = [...currentStroke.current];
      currentStroke.current = [];
      setStrokes((prev) => {
        const newStrokes = [...prev, finished];
        redraw(newStrokes, []);
        tryValidate(newStrokes);
        return newStrokes;
      });
    },
    [redraw, tryValidate],
  );

  return (
    <canvas
      ref={canvasRef}
      className={`draw-canvas-inline ${feedback === "bad" ? "draw-flash-bad" : ""}`}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      style={{ touchAction: "none", cursor: "crosshair" }}
    />
  );
}
