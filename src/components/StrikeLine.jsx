import React from "react";

export function StrikeLine({ indices }) {
  console.log("🎯 StrikeLine called!", indices);
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
      preserveAspectRatio="xMidYMid meet"
    >
      {/* <defs>
        <filter id="pencil-strike" x="-20%" y="-20%" width="140%" height="140%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.065"
            numOctaves="3"
            seed={13}
            result="noise"
          />
          <feDisplacementMap
            in="SourceGraphic"
            in2="noise"
            scale="0.8"
            xChannelSelector="R"
            yChannelSelector="G"
          />
        </filter>
      </defs> */}
      <line
        x1={start.x}
        y1={start.y}
        x2={end.x}
        y2={end.y}
        stroke="#b91c1c"
        strokeWidth="3"
        strokeLinecap="round"
        style={{
          strokeDasharray: 200,
          strokeDashoffset: 200,
          animation: "draw-strike 0.4s ease-out forwards",
          opacity: 0.85,
        }}
      />
    </svg>
  );
}
