"use client";

// Simple audio feedback using Web Audio API
let audioContext: AudioContext | null = null;
let muted = false;

function getAudioContext(): AudioContext {
  if (!audioContext) {
    audioContext = new AudioContext();
  }
  return audioContext;
}

function logSoundError(name: string, e: unknown) {
  if (process.env.NODE_ENV === "development") {
    console.warn(`[sound:${name}]`, e);
  }
}

export function setMuted(value: boolean) {
  muted = value;
  try {
    localStorage.setItem("sound-muted", value ? "1" : "0");
  } catch {
    // ignore
  }
}

export function isMuted(): boolean {
  return muted;
}

// Restore mute preference on load
if (typeof window !== "undefined") {
  try {
    muted = localStorage.getItem("sound-muted") === "1";
  } catch {
    // ignore
  }
}

export function playClick() {
  if (muted) return;
  try {
    const ctx = getAudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 600;
    gain.gain.value = 0.15;
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.1);
  } catch (e) {
    logSoundError("click", e);
  }
}

export function playSuccess() {
  if (muted) return;
  try {
    const ctx = getAudioContext();
    const notes = [523, 659, 784]; // C5, E5, G5
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = freq;
      gain.gain.value = 0.22;
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3 + i * 0.15);
      osc.start(ctx.currentTime + i * 0.15);
      osc.stop(ctx.currentTime + 0.3 + i * 0.15);
    });
  } catch (e) {
    logSoundError("success", e);
  }
}

export function playDrop() {
  if (muted) return;
  try {
    const ctx = getAudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 440;
    osc.frequency.exponentialRampToValueAtTime(220, ctx.currentTime + 0.15);
    gain.gain.value = 0.15;
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.15);
  } catch (e) {
    logSoundError("drop", e);
  }
}

export function playSmash() {
  if (muted) return;
  try {
    const ctx = getAudioContext();
    const t = ctx.currentTime;

    // Big impact thud
    const thud = ctx.createOscillator();
    const thudGain = ctx.createGain();
    thud.type = "sawtooth";
    thud.connect(thudGain);
    thudGain.connect(ctx.destination);
    thud.frequency.value = 180;
    thud.frequency.exponentialRampToValueAtTime(40, t + 0.18);
    thudGain.gain.value = 0.35;
    thudGain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
    thud.start(t);
    thud.stop(t + 0.18);

    // Crackle pops — more of them, wider pitch spread
    [600, 900, 1100, 1400, 1700].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "square";
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = freq;
      gain.gain.value = 0.08;
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.06 + i * 0.04);
      osc.start(t + 0.04 + i * 0.04);
      osc.stop(t + 0.1 + i * 0.04);
    });

    // Finishing shimmer
    const shimmer = ctx.createOscillator();
    const shimGain = ctx.createGain();
    shimmer.type = "sine";
    shimmer.connect(shimGain);
    shimGain.connect(ctx.destination);
    shimmer.frequency.value = 2000;
    shimmer.frequency.exponentialRampToValueAtTime(800, t + 0.35);
    shimGain.gain.value = 0.06;
    shimGain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
    shimmer.start(t + 0.15);
    shimmer.stop(t + 0.35);
  } catch (e) {
    logSoundError("smash", e);
  }
}

export function playMerge() {
  if (muted) return;
  try {
    const ctx = getAudioContext();
    const t = ctx.currentTime;

    // Magnetic whoosh — sweeping up
    const whoosh = ctx.createOscillator();
    const whooshGain = ctx.createGain();
    whoosh.type = "sine";
    whoosh.connect(whooshGain);
    whooshGain.connect(ctx.destination);
    whoosh.frequency.value = 200;
    whoosh.frequency.exponentialRampToValueAtTime(600, t + 0.12);
    whooshGain.gain.value = 0.12;
    whooshGain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
    whoosh.start(t);
    whoosh.stop(t + 0.15);

    // Sparkle chord — C5, E5, G5 together for a magical feel
    const chord = [523, 659, 784];
    chord.forEach((freq) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = freq;
      gain.gain.value = 0.1;
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.45);
      osc.start(t + 0.1);
      osc.stop(t + 0.45);
    });

    // High sparkle ping
    const ping = ctx.createOscillator();
    const pingGain = ctx.createGain();
    ping.type = "sine";
    ping.connect(pingGain);
    pingGain.connect(ctx.destination);
    ping.frequency.value = 1568; // G6
    pingGain.gain.value = 0.08;
    pingGain.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
    ping.start(t + 0.25);
    ping.stop(t + 0.5);
  } catch (e) {
    logSoundError("merge", e);
  }
}

export function playSnap() {
  if (muted) return;
  try {
    const ctx = getAudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 1200;
    gain.gain.value = 0.15;
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.03);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.03);
  } catch (e) {
    logSoundError("snap", e);
  }
}

export function playReset() {
  if (muted) return;
  try {
    const ctx = getAudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 800;
    osc.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.25);
    gain.gain.value = 0.15;
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.25);
  } catch (e) {
    logSoundError("reset", e);
  }
}

export function playError() {
  if (muted) return;
  try {
    const ctx = getAudioContext();
    // E4 → C4 descending minor, square wave
    const notes = [329, 261];
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "square";
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = freq;
      gain.gain.value = 0.1;
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15 + i * 0.12);
      osc.start(ctx.currentTime + i * 0.12);
      osc.stop(ctx.currentTime + 0.15 + i * 0.12);
    });
  } catch (e) {
    logSoundError("error", e);
  }
}

export function playPickup() {
  if (muted) return;
  try {
    const ctx = getAudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 880;
    osc.frequency.exponentialRampToValueAtTime(1100, ctx.currentTime + 0.06);
    gain.gain.value = 0.08;
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.08);
  } catch (e) {
    logSoundError("pickup", e);
  }
}

export function playVictoryFanfare() {
  if (muted) return;
  try {
    const ctx = getAudioContext();
    const t = ctx.currentTime;
    // Ascending major arpeggio: C5 → E5 → G5 → C6
    const notes = [523, 659, 784, 1047];
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = freq;
      gain.gain.value = 0.15;
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3 + i * 0.12);
      osc.start(t + i * 0.12);
      osc.stop(t + 0.35 + i * 0.12);
    });
    // Final shimmer
    const shim = ctx.createOscillator();
    const shimG = ctx.createGain();
    shim.type = "sine";
    shim.connect(shimG);
    shimG.connect(ctx.destination);
    shim.frequency.value = 2093; // C7
    shimG.gain.value = 0.06;
    shimG.gain.exponentialRampToValueAtTime(0.001, t + 0.9);
    shim.start(t + 0.5);
    shim.stop(t + 0.9);
  } catch (e) {
    logSoundError("victoryFanfare", e);
  }
}

export function playDefeat() {
  if (muted) return;
  try {
    const ctx = getAudioContext();
    const t = ctx.currentTime;
    // Descending minor: E4 → D4 → C4, triangle wave (sad trombone feel)
    const notes = [330, 294, 262];
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "triangle";
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = freq;
      gain.gain.value = 0.12;
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25 + i * 0.18);
      osc.start(t + i * 0.18);
      osc.stop(t + 0.3 + i * 0.18);
    });
  } catch (e) {
    logSoundError("defeat", e);
  }
}

export function playFloorComplete() {
  if (muted) return;
  try {
    const ctx = getAudioContext();
    const t = ctx.currentTime;
    // Quick ascending two-note chime: G5 → B5
    [784, 988].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = freq;
      gain.gain.value = 0.12;
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2 + i * 0.1);
      osc.start(t + i * 0.1);
      osc.stop(t + 0.25 + i * 0.1);
    });
  } catch (e) {
    logSoundError("floorComplete", e);
  }
}

export function playStreakMilestone() {
  if (muted) return;
  try {
    const ctx = getAudioContext();
    const t = ctx.currentTime;
    // Rapid ascending sparkle: C6 → E6 → G6 → C7 (fast, magical)
    [1047, 1319, 1568, 2093].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = freq;
      gain.gain.value = 0.1;
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12 + i * 0.06);
      osc.start(t + i * 0.06);
      osc.stop(t + 0.15 + i * 0.06);
    });
  } catch (e) {
    logSoundError("streakMilestone", e);
  }
}

export function playSlice() {
  if (muted) return;
  try {
    const ctx = getAudioContext();
    const t = ctx.currentTime;
    // Knife swoosh: white noise burst + high sweep
    const bufferSize = ctx.sampleRate * 0.08;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    const noiseGain = ctx.createGain();
    noise.connect(noiseGain);
    noiseGain.connect(ctx.destination);
    noiseGain.gain.value = 0.08;
    noise.start(t);
    // Metallic ring
    const ring = ctx.createOscillator();
    const ringGain = ctx.createGain();
    ring.type = "sine";
    ring.connect(ringGain);
    ringGain.connect(ctx.destination);
    ring.frequency.value = 1800;
    ring.frequency.exponentialRampToValueAtTime(1200, t + 0.15);
    ringGain.gain.value = 0.06;
    ringGain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
    ring.start(t);
    ring.stop(t + 0.15);
  } catch (e) {
    logSoundError("slice", e);
  }
}

export function playSlicePlaced() {
  if (muted) return;
  try {
    const ctx = getAudioContext();
    const t = ctx.currentTime;
    // Soft plop: sine sweep down
    const plop = ctx.createOscillator();
    const plopGain = ctx.createGain();
    plop.type = "sine";
    plop.connect(plopGain);
    plopGain.connect(ctx.destination);
    plop.frequency.value = 400;
    plop.frequency.exponentialRampToValueAtTime(300, t + 0.1);
    plopGain.gain.value = 0.12;
    plopGain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
    plop.start(t);
    plop.stop(t + 0.12);
    // Satisfaction ping
    const ping = ctx.createOscillator();
    const pingGain = ctx.createGain();
    ping.type = "sine";
    ping.connect(pingGain);
    pingGain.connect(ctx.destination);
    ping.frequency.value = 880;
    pingGain.gain.value = 0.08;
    pingGain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
    ping.start(t + 0.08);
    ping.stop(t + 0.22);
  } catch (e) {
    logSoundError("slicePlaced", e);
  }
}

export function playOrderComplete() {
  if (muted) return;
  try {
    const ctx = getAudioContext();
    const t = ctx.currentTime;
    // Kitchen bell: ascending triangle notes
    [659, 784, 1047].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "triangle";
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = freq;
      gain.gain.value = 0.15;
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25 + i * 0.12);
      osc.start(t + i * 0.12);
      osc.stop(t + 0.3 + i * 0.12);
    });
    // Shimmer chord
    [1047, 1319, 1568].forEach((freq) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = freq;
      gain.gain.value = 0.05;
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.7);
      osc.start(t + 0.35);
      osc.stop(t + 0.7);
    });
  } catch (e) {
    logSoundError("orderComplete", e);
  }
}

/* ------------------------------------------------------------------ */
/*  Character intro sounds                                             */
/* ------------------------------------------------------------------ */

/** Play a short intro chime specific to each character before TTS starts */
export function playCharacterIntro(characterId: string) {
  if (muted) return;
  try {
    const ctx = getAudioContext();
    const t = ctx.currentTime;

    switch (characterId) {
      case "frax": {
        // Warm two-note chime: G5 → B5
        [784, 988].forEach((freq, i) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = "sine";
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.frequency.value = freq;
          gain.gain.value = 0.1;
          gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15 + i * 0.08);
          osc.start(t + i * 0.08);
          osc.stop(t + 0.2 + i * 0.08);
        });
        break;
      }
      case "luna": {
        // Sparkly ascending tinkle: E6 → G6 → B6
        [1319, 1568, 1976].forEach((freq, i) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = "sine";
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.frequency.value = freq;
          gain.gain.value = 0.07;
          gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12 + i * 0.06);
          osc.start(t + i * 0.06);
          osc.stop(t + 0.15 + i * 0.06);
        });
        break;
      }
      case "rex": {
        // Digital beep-boop: square wave C4 → E4
        [262, 330].forEach((freq, i) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = "square";
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.frequency.value = freq;
          gain.gain.value = 0.06;
          gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08 + i * 0.1);
          osc.start(t + i * 0.1);
          osc.stop(t + 0.12 + i * 0.1);
        });
        break;
      }
      case "pip": {
        // High-pitched squeak: quick sine sweep up
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.value = 1200;
        osc.frequency.exponentialRampToValueAtTime(2400, t + 0.08);
        gain.gain.value = 0.08;
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
        osc.start(t);
        osc.stop(t + 0.1);
        break;
      }
      case "growl": {
        // Low rumble: triangle wave sweep down
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "triangle";
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.value = 200;
        osc.frequency.exponentialRampToValueAtTime(80, t + 0.2);
        gain.gain.value = 0.12;
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
        osc.start(t);
        osc.stop(t + 0.25);
        break;
      }
    }
  } catch (e) {
    logSoundError("characterIntro", e);
  }
}

/* ------------------------------------------------------------------ */
/*  Fraction Rain sounds                                               */
/* ------------------------------------------------------------------ */

export function playRainCatch() {
  if (muted) return;
  try {
    const ctx = getAudioContext();
    const t = ctx.currentTime;
    // Bright catch: ascending C5 → E5 → G5 (fast)
    [523, 659, 784].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = freq;
      gain.gain.value = 0.12;
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1 + i * 0.05);
      osc.start(t + i * 0.05);
      osc.stop(t + 0.15 + i * 0.05);
    });
  } catch (e) {
    logSoundError("rainCatch", e);
  }
}

export function playRainMiss() {
  if (muted) return;
  try {
    const ctx = getAudioContext();
    const t = ctx.currentTime;
    // Sad descending tone: E4 → C4
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "triangle";
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 330;
    osc.frequency.exponentialRampToValueAtTime(200, t + 0.2);
    gain.gain.value = 0.1;
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
    osc.start(t);
    osc.stop(t + 0.25);
  } catch (e) {
    logSoundError("rainMiss", e);
  }
}

export function playRainWrong() {
  if (muted) return;
  try {
    const ctx = getAudioContext();
    const t = ctx.currentTime;
    // Quick buzz: two dissonant square tones
    [300, 280].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "square";
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = freq;
      gain.gain.value = 0.06;
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08 + i * 0.05);
      osc.start(t + i * 0.05);
      osc.stop(t + 0.12 + i * 0.05);
    });
  } catch (e) {
    logSoundError("rainWrong", e);
  }
}

export function playRainPowerUp() {
  if (muted) return;
  try {
    const ctx = getAudioContext();
    const t = ctx.currentTime;
    // Rising shimmer: sine sweep C5 → C6
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 523;
    osc.frequency.exponentialRampToValueAtTime(1047, t + 0.3);
    gain.gain.value = 0.1;
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
    osc.start(t);
    osc.stop(t + 0.35);
    // Sparkle chord on top
    [1319, 1568].forEach((freq) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = "sine";
      o.connect(g);
      g.connect(ctx.destination);
      o.frequency.value = freq;
      g.gain.value = 0.05;
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
      o.start(t + 0.15);
      o.stop(t + 0.4);
    });
  } catch (e) {
    logSoundError("rainPowerUp", e);
  }
}

/* ------------------------------------------------------------------ */
/*  Background Music — procedural pentatonic loop via Web Audio API    */
/* ------------------------------------------------------------------ */

let musicPlaying = false;
let musicGainNode: GainNode | null = null;
let musicTimer: ReturnType<typeof setInterval> | null = null;
let musicMuted = false;

// Restore music preference on load
if (typeof window !== "undefined") {
  try {
    musicMuted = localStorage.getItem("music-muted") === "1";
  } catch {
    // ignore
  }
}

export function isMusicMuted(): boolean {
  return musicMuted;
}

export function setMusicMuted(value: boolean) {
  musicMuted = value;
  try {
    localStorage.setItem("music-muted", value ? "1" : "0");
  } catch {
    // ignore
  }
  if (musicGainNode) {
    musicGainNode.gain.value = value ? 0 : 0.04;
  }
}

// Pentatonic scale notes across two octaves (kid-friendly, no dissonance)
const PENTATONIC = [
  262, 294, 330, 392, 440,  // C4 D4 E4 G4 A4
  523, 587, 659, 784, 880,  // C5 D5 E5 G5 A5
];

function playMusicNote(ctx: AudioContext, masterGain: GainNode) {
  const freq = PENTATONIC[Math.floor(Math.random() * PENTATONIC.length)];
  const osc = ctx.createOscillator();
  const noteGain = ctx.createGain();
  osc.type = Math.random() > 0.7 ? "triangle" : "sine";
  osc.connect(noteGain);
  noteGain.connect(masterGain);
  osc.frequency.value = freq;
  const t = ctx.currentTime;
  // Soft attack, gentle decay
  noteGain.gain.setValueAtTime(0, t);
  noteGain.gain.linearRampToValueAtTime(0.6, t + 0.05);
  noteGain.gain.exponentialRampToValueAtTime(0.001, t + 0.8);
  osc.start(t);
  osc.stop(t + 0.8);
}

export function startMusic() {
  if (musicPlaying) return;
  try {
    const ctx = getAudioContext();
    musicGainNode = ctx.createGain();
    musicGainNode.gain.value = musicMuted ? 0 : 0.04; // Very quiet background
    musicGainNode.connect(ctx.destination);
    musicPlaying = true;

    // Play a random pentatonic note every 600-1200ms
    function scheduleNext() {
      if (!musicPlaying) return;
      playMusicNote(ctx, musicGainNode!);
      const delay = 600 + Math.random() * 600;
      musicTimer = setTimeout(scheduleNext, delay);
    }
    scheduleNext();
  } catch (e) {
    logSoundError("music", e);
  }
}

export function stopMusic() {
  musicPlaying = false;
  if (musicTimer) {
    clearTimeout(musicTimer);
    musicTimer = null;
  }
  musicGainNode = null;
}
