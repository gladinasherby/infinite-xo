import React, { useRef, useEffect, useState, useCallback } from "react";
import "./DrawCanvas.css";

/**
 * Recognizes if drawn strokes look like an X.
 * Two-stroke: checks they go in crossing diagonal directions.
 * One-stroke: checks bounding box is squarish and direction reverses midway.
 */
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

/**
 * Renders committed strokes as an SVG that stays on the cell permanently.
 */
export function DrawnInkX({ strokes, size }) {
  if (!strokes || strokes.length === 0) return null;
  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      style={{ position: "absolute", inset: 0, pointerEvents: "none" }}
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

/**
 * Transparent drawing overlay placed directly on the cell.
 * User draws; strokes appear as real ink. On lift, auto-validates as X.
 * If not an X after 2 strokes or a timeout, flashes red and clears.
 */
export default function DrawCanvas({ onConfirm, onCancel, cellSize }) {
  const canvasRef = useRef(null);
  const [strokes, setStrokes] = useState([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [feedback, setFeedback] = useState(null); // null | "bad"
  const currentStroke = useRef([]);
  const validateTimer = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = cellSize;
    canvas.height = cellSize;
  }, [cellSize]);

  const redraw = useCallback((allStrokes, currentPts) => {
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
    if (currentPts.length) drawPts(currentPts);
  }, []);

  const tryValidate = useCallback(
    (newStrokes) => {
      clearTimeout(validateTimer.current);
      // Auto-validate after the pen lifts with a short pause
      validateTimer.current = setTimeout(() => {
        if (looksLikeX(newStrokes)) {
          // Pass strokes up so parent can render them permanently
          onConfirm(newStrokes);
        } else if (newStrokes.length >= 2) {
          // Two strokes and still not an X — reject
          setFeedback("bad");
          setTimeout(() => {
            setStrokes([]);
            setFeedback(null);
            const canvas = canvasRef.current;
            if (canvas)
              canvas
                .getContext("2d")
                .clearRect(0, 0, canvas.width, canvas.height);
          }, 700);
        }
        // If only 1 stroke and not valid yet, wait for the second stroke
      }, 400);
    },
    [onConfirm],
  );

  const getPos = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const src = e.touches ? e.touches[0] : e;
    return { x: src.clientX - rect.left, y: src.clientY - rect.top };
  };

  const onPointerDown = (e) => {
    e.preventDefault();
    e.stopPropagation();
    canvasRef.current.setPointerCapture(e.pointerId);
    clearTimeout(validateTimer.current);
    setIsDrawing(true);
    setFeedback(null);
    currentStroke.current = [getPos(e)];
    redraw(strokes, currentStroke.current);
  };

  const onPointerMove = (e) => {
    if (!isDrawing) return;
    e.preventDefault();
    currentStroke.current.push(getPos(e));
    redraw(strokes, currentStroke.current);
  };

  const onPointerUp = (e) => {
    if (!isDrawing) return;
    e.preventDefault();
    setIsDrawing(false);
    const newStrokes = [...strokes, [...currentStroke.current]];
    currentStroke.current = [];
    setStrokes(newStrokes);
    redraw(newStrokes, []);
    tryValidate(newStrokes);
  };

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
