import React, { useEffect } from "react";

export function StrikeLine({ indices, soundEnabled = true }) {
  useEffect(() => {
    if (soundEnabled && indices && indices.length >= 3) {
      const audio = new Audio("/sounds/pencil-strike.mp3");
      audio.volume = 0.6;
      audio.play().catch(() => {});
    }
  }, [indices, soundEnabled]);

  if (!indices || indices.length < 3) return null;

  const points = [
    { x: 16.6, y: 16.6 },
    { x: 50, y: 16.6 },
    { x: 83.3, y: 16.6 },
    { x: 16.6, y: 50 },
    { x: 50, y: 50 },
    { x: 83.3, y: 50 },
    { x: 16.6, y: 83.3 },
    { x: 50, y: 83.3 },
    { x: 83.3, y: 83.3 },
  ];

  const p1 = points[indices[0]];
  const p2 = points[indices[2]];
  const overshoot = 8;
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  const length = Math.sqrt(dx * dx + dy * dy);
  const ux = dx / length;
  const uy = dy / length;

  const start = { x: p1.x - ux * overshoot, y: p1.y - uy * overshoot };
  const end = { x: p2.x + ux * overshoot, y: p2.y + uy * overshoot };
  const mid = {
    x: (start.x + end.x) / 2 + (Math.random() - 0.5) * 2,
    y: (start.y + end.y) / 2 + (Math.random() - 0.5) * 2,
  };

  const pathData = `M ${start.x} ${start.y} Q ${mid.x} ${mid.y} ${end.x} ${end.y}`;
  const isDiagonal = dx !== 0 && dy !== 0;
  const dashLength = isDiagonal ? 450 : 300;

  return (
    <svg
      viewBox="0 0 100 100"
      style={{
        position: "absolute",
        inset: -10,
        pointerEvents: "none",
        overflow: "visible",
        width: "calc(100% + 20px)",
        height: "calc(100% + 20px)",
      }}
    >
      <defs>
        <filter id="pencil" x="-20%" y="-20%" width="140%" height="140%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.5"
            numOctaves="4"
            result="noise"
          />
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="0.8" />
        </filter>
      </defs>
      <path
        d={pathData}
        fill="none"
        stroke="#000000"
        strokeWidth="2.5"
        strokeLinecap="round"
        filter="url(#pencil)"
        vectorEffect="non-scaling-stroke"
        style={{
          strokeDasharray: dashLength,
          strokeDashoffset: dashLength,
          animation: "draw-strike 0.5s ease-out forwards",
        }}
      />
    </svg>
  );
}
