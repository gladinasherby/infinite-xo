// Synthesizes pencil/marker scratch sounds using Web Audio API

let ctx = null;

function getCtx() {
  if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
  return ctx;
}

// Shared scratch noise generator
function makeScratch(audioCtx, duration, gainVal = 0.18, rate = 1.0) {
  const bufferSize = audioCtx.sampleRate * duration;
  const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
  const data = buffer.getChannelData(0);

  // Band-limited noise that sounds like pencil paper friction
  for (let i = 0; i < bufferSize; i++) {
    // Pink-ish noise: mix white noise with some low-freq content
    data[i] = (Math.random() * 2 - 1) * 0.9 + (Math.random() * 2 - 1) * 0.1;
  }

  const source = audioCtx.createBufferSource();
  source.buffer = buffer;
  source.playbackRate.value = rate;

  // Band-pass: pencil scratch lives ~800–4000 Hz
  const bpf = audioCtx.createBiquadFilter();
  bpf.type = "bandpass";
  bpf.frequency.value = 2200;
  bpf.Q.value = 0.6;

  // High shelf boost for papery hiss
  const shelf = audioCtx.createBiquadFilter();
  shelf.type = "highshelf";
  shelf.frequency.value = 3500;
  shelf.gain.value = 8;

  const gain = audioCtx.createGain();
  gain.gain.setValueAtTime(0, audioCtx.currentTime);
  gain.gain.linearRampToValueAtTime(gainVal, audioCtx.currentTime + 0.02);
  gain.gain.linearRampToValueAtTime(
    gainVal,
    audioCtx.currentTime + duration - 0.04,
  );
  gain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + duration);

  source.connect(bpf);
  bpf.connect(shelf);
  shelf.connect(gain);
  gain.connect(audioCtx.destination);

  return { source, gain, bpf };
}

/**
 * Play a pencil-drawing scratch for the duration of an X or O being drawn.
 * Returns a stop function.
 */
export function playDrawSound(duration = 0.55, isX = true) {
  try {
    const audioCtx = getCtx();
    if (audioCtx.state === "suspended") audioCtx.resume();

    // X sounds slightly scratchier/faster than O (which is smoother)
    const { source } = makeScratch(
      audioCtx,
      duration + 0.1,
      isX ? 0.22 : 0.16,
      isX ? 1.15 : 0.88,
    );

    // For O: add a subtle low-freq hum (the circular motion)
    if (!isX) {
      const osc = audioCtx.createOscillator();
      const oscGain = audioCtx.createGain();
      osc.frequency.value = 180;
      osc.type = "sine";
      oscGain.gain.setValueAtTime(0, audioCtx.currentTime);
      oscGain.gain.linearRampToValueAtTime(0.04, audioCtx.currentTime + 0.05);
      oscGain.gain.linearRampToValueAtTime(
        0.04,
        audioCtx.currentTime + duration - 0.05,
      );
      oscGain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + duration);
      osc.connect(oscGain);
      oscGain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + duration);
    }

    source.start();
    source.stop(audioCtx.currentTime + duration + 0.1);
  } catch (e) {
    // Silently fail — sound is enhancement only
  }
}

/**
 * Play a longer, slightly more pressured scratch for the win strike-line.
 */
export function playStrikeSound(duration = 0.6) {
  try {
    const audioCtx = getCtx();
    if (audioCtx.state === "suspended") audioCtx.resume();

    // Two overlapping scratch layers for a fuller strike feel
    const { source: s1 } = makeScratch(audioCtx, duration, 0.28, 0.95);
    const { source: s2 } = makeScratch(audioCtx, duration, 0.12, 1.3);

    s1.start();
    s1.stop(audioCtx.currentTime + duration);
    s2.start(audioCtx.currentTime + 0.02);
    s2.stop(audioCtx.currentTime + duration);
  } catch (e) {
    // Silently fail
  }
}
