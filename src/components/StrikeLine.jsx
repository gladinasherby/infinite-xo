import React from "react";

export function StrikeLine({ indices }) {
  if (!indices || indices.length < 3) return null;

  // We map the grid index (0-8) to percentage coordinates (x, y)
  // These points are the centers of each cell
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

  const start = points[indices[0]];
  const end = points[indices[2]];

  return (
    <svg
      className="strike-line-svg"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
    >
      <defs>
        <filter id="pencil-strike">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.05"
            numOctaves="3"
            seed="13"
          />
          <feDisplacementMap in="SourceGraphic" scale="2.5" />
        </filter>
      </defs>
      <line
        x1={`${start.x}%`}
        y1={`${start.y}%`}
        x2={`${end.x}%`}
        y2={`${end.y}%`}
        stroke="#2b2b2b"
        strokeWidth="2"
        strokeLinecap="round"
        filter="url(#pencil-strike)"
        className="strike-path"
      />
    </svg>
  );
}
