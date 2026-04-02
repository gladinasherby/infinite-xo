export function StrikeLine({ indices }) {
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

  // --- THE EXTENSION MATH ---
  const overshoot = 8; // Increase this number to make the line longer

  // Calculate the angle of the line
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  const length = Math.sqrt(dx * dx + dy * dy);

  // Normalized direction vectors
  const ux = dx / length;
  const uy = dy / length;

  // New start and end points pushed outward
  const start = {
    x: p1.x - ux * overshoot,
    y: p1.y - uy * overshoot,
  };
  const end = {
    x: p2.x + ux * overshoot,
    y: p2.y + uy * overshoot,
  };

  // Slight random "wobble" for the mid-point to keep it looking hand-drawn
  const mid = {
    x: (start.x + end.x) / 2 + (Math.random() - 0.5) * 2,
    y: (start.y + end.y) / 2 + (Math.random() - 0.5) * 2,
  };

  const pathData = `M ${start.x} ${start.y} Q ${mid.x} ${mid.y} ${end.x} ${end.y}`;

  return (
    <svg
      viewBox="0 0 100 100"
      style={{
        position: "absolute",
        inset: -10, // Added some bleed area
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
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="1.5" />
        </filter>
      </defs>

      <path
        d={pathData}
        fill="none"
        stroke="#000000"
        strokeWidth="8"
        strokeLinecap="round"
        filter="url(#pencil)"
        style={{
          strokeDasharray: 300, // Increased to accommodate longer line
          strokeDashoffset: 300,
          animation: "draw-strike 0.5s ease-out forwards",
        }}
      />
    </svg>
  );
}
