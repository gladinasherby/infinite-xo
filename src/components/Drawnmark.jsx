import React, { useEffect } from "react";

const drawSound =
  typeof Audio !== "undefined" ? new Audio("/sounds/pencil-draw.mp3") : null;

const PENCIL_FILTER = (uid) => (
  <defs>
    <filter id={`pencil-${uid}`} x="-10%" y="-10%" width="120%" height="120%">
      <feTurbulence
        type="fractalNoise"
        baseFrequency="0.065"
        numOctaves="3"
        seed={uid}
        result="noise"
      />
      <feDisplacementMap
        in="SourceGraphic"
        in2="noise"
        scale="1.4"
        xChannelSelector="R"
        yChannelSelector="G"
      />
    </filter>
  </defs>
);

export function DrawnX({ uid, shady, soundEnabled = true }) {
  useEffect(() => {
    if (soundEnabled && !shady && drawSound) {
      // Reset to start in case it's still playing from a previous move
      drawSound.currentTime = 0;
      drawSound.volume = 0.4;

      const playPromise = drawSound.play();

      if (playPromise !== undefined) {
        playPromise.catch((error) => {
          console.error("Playback failed:", error);
        });
      }
    }
  }, [shady, soundEnabled]);

  return (
    <svg
      viewBox="0 0 64 64"
      xmlns="http://www.w3.org/2000/svg"
      style={{
        width: 64,
        height: 64,
        overflow: "visible",
        position: "absolute",
      }}
    >
      {PENCIL_FILTER(uid)}
      <g style={{ opacity: shady ? 0.28 : 1 }}>
        <path
          d="M10,10 L54,54 M54,10 L10,54"
          fill="none"
          stroke="#b91c1c"
          strokeWidth="5"
          strokeLinecap="round"
          filter={`url(#pencil-${uid})`}
          style={{
            strokeDasharray: 130,
            strokeDashoffset: 130,
            animation: "draw-on 0.5s ease-in-out forwards",
          }}
        />
      </g>
    </svg>
  );
}

export function DrawnO({ uid, shady, soundEnabled = true }) {
  useEffect(() => {
    if (soundEnabled && !shady) {
      const audio = new Audio("/sounds/pencil-draw.mp3");
      audio.volume = 0.4;
      audio.play().catch(() => {});
    }
  }, [shady, soundEnabled]);

  return (
    <svg
      viewBox="0 0 64 64"
      xmlns="http://www.w3.org/2000/svg"
      style={{
        width: 64,
        height: 64,
        overflow: "visible",
        position: "absolute",
      }}
    >
      {PENCIL_FILTER(uid)}
      <g style={{ opacity: shady ? 0.28 : 1 }}>
        <path
          d="M32,9 C50,8 57,20 56,32 C55,46 44,56 32,56 C18,57 8,46 8,32 C8,17 18,8 32,9 Z"
          fill="none"
          stroke="#1d4ed8"
          strokeWidth="4.5"
          strokeLinecap="round"
          filter={`url(#pencil-${uid})`}
          style={{
            strokeDasharray: 172,
            strokeDashoffset: 172,
            animation: "draw-on 0.55s ease-out forwards",
          }}
        />
      </g>
    </svg>
  );
}
