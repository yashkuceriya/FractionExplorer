"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { playRainCatch, playRainMiss, playRainWrong, playRainPowerUp } from "@/lib/sounds";

// ── Equivalence families for zone targets ────────────────────────────
type Frac = { n: number; d: number };

const EQUIVALENCE_FAMILIES: Frac[][] = [
  [{ n: 1, d: 2 }, { n: 2, d: 4 }, { n: 3, d: 6 }, { n: 4, d: 8 }, { n: 5, d: 10 }],
  [{ n: 1, d: 3 }, { n: 2, d: 6 }, { n: 3, d: 9 }, { n: 4, d: 12 }],
  [{ n: 1, d: 4 }, { n: 2, d: 8 }, { n: 3, d: 12 }],
  [{ n: 2, d: 3 }, { n: 4, d: 6 }, { n: 6, d: 9 }],
  [{ n: 3, d: 4 }, { n: 6, d: 8 }, { n: 9, d: 12 }],
  [{ n: 1, d: 5 }, { n: 2, d: 10 }],
];

// Neon accent colors for blocks (vibrant on dark bg)
const BLOCK_STYLES = [
  { bg: "from-rose-400 to-pink-500", glow: "shadow-pink-500/40" },
  { bg: "from-amber-400 to-orange-500", glow: "shadow-orange-500/40" },
  { bg: "from-emerald-400 to-green-500", glow: "shadow-green-500/40" },
  { bg: "from-sky-400 to-blue-500", glow: "shadow-blue-500/40" },
  { bg: "from-violet-400 to-purple-600", glow: "shadow-purple-500/40" },
  { bg: "from-fuchsia-400 to-pink-600", glow: "shadow-fuchsia-500/40" },
  { bg: "from-cyan-400 to-teal-500", glow: "shadow-teal-500/40" },
];

// Zone glow colors (distinct per zone)
const ZONE_STYLES = [
  { border: "border-cyan-400", bg: "bg-cyan-950/60", glow: "shadow-cyan-400/30", text: "text-cyan-300", ring: "ring-cyan-400/40" },
  { border: "border-fuchsia-400", bg: "bg-fuchsia-950/60", glow: "shadow-fuchsia-400/30", text: "text-fuchsia-300", ring: "ring-fuchsia-400/40" },
  { border: "border-amber-400", bg: "bg-amber-950/60", glow: "shadow-amber-400/30", text: "text-amber-300", ring: "ring-amber-400/40" },
];

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

// ── Types ────────────────────────────────────────────────────────────

interface FallingBlock {
  id: number;
  fraction: Frac;
  x: number;
  styleIndex: number;
  familyIndex: number;
  speed: number;
  startTime: number;
}

interface Zone {
  label: Frac;
  familyIndex: number;
}

interface Particle {
  id: number;
  x: number;
  emoji: string;
}

interface FractionRainProps {
  onXP?: (amount: number, label: string) => void;
}

// ── Difficulty scaling ───────────────────────────────────────────────

function getDifficulty(score: number) {
  if (score < 10) return { zones: 2, speed: [6, 8], spawnRate: 2500, trickChance: 0 };
  if (score < 25) return { zones: 2, speed: [5, 7], spawnRate: 2200, trickChance: 0 };
  if (score < 40) return { zones: 3, speed: [4.5, 6.5], spawnRate: 2000, trickChance: 0.05 };
  if (score < 60) return { zones: 3, speed: [4, 6], spawnRate: 1800, trickChance: 0.1 };
  return { zones: 3, speed: [3.5, 5.5], spawnRate: 1500, trickChance: 0.15 };
}

let blockCounter = 0;

// ── Component ────────────────────────────────────────────────────────

export default function FractionRain({ onXP }: FractionRainProps) {
  const [gameState, setGameState] = useState<"menu" | "playing" | "gameover">("menu");
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [blocks, setBlocks] = useState<FallingBlock[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [selectedBlock, setSelectedBlock] = useState<number | null>(null);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [slowMo, setSlowMo] = useState(false);
  const [hintActive, setHintActive] = useState(false);
  const [slowMoCount, setSlowMoCount] = useState(1);
  const [hintCount, setHintCount] = useState(1);
  const [shake, setShake] = useState(false);
  const [combo, setCombo] = useState(0);
  const [comboToast, setComboToast] = useState<string | null>(null);
  const [flashZone, setFlashZone] = useState<number | null>(null);

  const spawnTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const animFrame = useRef<number>(0);
  const livesRef = useRef(lives);
  const scoreRef = useRef(score);
  const blocksRef = useRef(blocks);
  const zonesRef = useRef(zones);
  const slowMoRef = useRef(slowMo);
  const comboRef = useRef(combo);

  livesRef.current = lives;
  scoreRef.current = score;
  blocksRef.current = blocks;
  zonesRef.current = zones;
  slowMoRef.current = slowMo;
  comboRef.current = combo;

  const setupZones = useCallback((currentScore: number) => {
    const diff = getDifficulty(currentScore);
    const families = shuffle([...EQUIVALENCE_FAMILIES.keys()]).slice(0, diff.zones);
    setZones(families.map((fi) => ({
      label: EQUIVALENCE_FAMILIES[fi][0],
      familyIndex: fi,
    })));
  }, []);

  const spawnBlock = useCallback(() => {
    if (livesRef.current <= 0) return;

    const diff = getDifficulty(scoreRef.current);
    const currentZones = zonesRef.current;
    if (currentZones.length === 0) return;

    let fraction: Frac;
    let familyIndex: number;

    if (Math.random() < diff.trickChance) {
      const unusedFamilies = EQUIVALENCE_FAMILIES.map((_, i) => i)
        .filter((i) => !currentZones.some((z) => z.familyIndex === i));
      if (unusedFamilies.length > 0) {
        familyIndex = -1;
        const fi = pickRandom(unusedFamilies);
        fraction = pickRandom(EQUIVALENCE_FAMILIES[fi]);
      } else {
        const zone = pickRandom(currentZones);
        familyIndex = zone.familyIndex;
        fraction = pickRandom(EQUIVALENCE_FAMILIES[familyIndex]);
      }
    } else {
      const zone = pickRandom(currentZones);
      familyIndex = zone.familyIndex;
      const family = EQUIVALENCE_FAMILIES[familyIndex];
      const nonLabel = family.filter((f) => !(f.n === zone.label.n && f.d === zone.label.d));
      fraction = nonLabel.length > 0 ? pickRandom(nonLabel) : pickRandom(family);
    }

    const speedRange = diff.speed;
    const speed = speedRange[0] + Math.random() * (speedRange[1] - speedRange[0]);

    const block: FallingBlock = {
      id: ++blockCounter,
      fraction,
      x: 8 + Math.random() * 84,
      styleIndex: Math.floor(Math.random() * BLOCK_STYLES.length),
      familyIndex,
      speed: slowMoRef.current ? speed * 2 : speed,
      startTime: Date.now(),
    };

    setBlocks((prev) => [...prev, block]);
  }, []);

  const gameLoop = useCallback(() => {
    const now = Date.now();
    setBlocks((prev) => {
      const stillAlive: FallingBlock[] = [];
      let lostLife = false;

      for (const block of prev) {
        const elapsed = (now - block.startTime) / 1000;
        const progress = elapsed / block.speed;

        if (progress >= 1) {
          if (block.familyIndex !== -1) {
            lostLife = true;
          }
        } else {
          stillAlive.push(block);
        }
      }

      if (lostLife) {
        playRainMiss();
        setCombo(0);
        setLives((l) => {
          const newLives = Math.max(0, l - 1);
          if (newLives === 0) {
            setGameState("gameover");
          }
          return newLives;
        });
        setShake(true);
        setTimeout(() => setShake(false), 300);
      }

      return stillAlive;
    });

    animFrame.current = requestAnimationFrame(gameLoop);
  }, []);

  const startGame = useCallback(() => {
    setScore(0);
    setLives(3);
    setBlocks([]);
    setSelectedBlock(null);
    setSlowMo(false);
    setHintActive(false);
    setSlowMoCount(1);
    setHintCount(1);
    setCombo(0);
    setGameState("playing");
    setupZones(0);
  }, [setupZones]);

  // Spawn loop
  useEffect(() => {
    if (gameState !== "playing" || lives <= 0) return;

    function scheduleSpawn() {
      const diff = getDifficulty(scoreRef.current);
      spawnTimer.current = setTimeout(() => {
        spawnBlock();
        scheduleSpawn();
      }, diff.spawnRate);
    }

    spawnTimer.current = setTimeout(() => {
      spawnBlock();
      scheduleSpawn();
    }, 1000);

    return () => {
      if (spawnTimer.current) clearTimeout(spawnTimer.current);
    };
  }, [gameState, lives, spawnBlock]);

  // Animation loop
  useEffect(() => {
    if (gameState !== "playing") return;
    animFrame.current = requestAnimationFrame(gameLoop);
    return () => cancelAnimationFrame(animFrame.current);
  }, [gameState, gameLoop]);

  const handleBlockTap = useCallback((blockId: number) => {
    setSelectedBlock((prev) => (prev === blockId ? null : blockId));
  }, []);

  const handleZoneTap = useCallback((zoneIndex: number) => {
    if (selectedBlock === null) return;

    const block = blocksRef.current.find((b) => b.id === selectedBlock);
    if (!block) {
      setSelectedBlock(null);
      return;
    }

    const zone = zonesRef.current[zoneIndex];
    if (!zone) return;

    const isCorrect = block.familyIndex === zone.familyIndex;

    if (isCorrect) {
      playRainCatch();
      const newCombo = comboRef.current + 1;
      setCombo(newCombo);

      // Bonus XP for combos
      const points = newCombo >= 5 ? 3 : newCombo >= 3 ? 2 : 1;
      const newScore = scoreRef.current + points;
      setScore(newScore);
      onXP?.(points + 1, newCombo >= 3 ? `${newCombo}x Combo!` : "Rain catch!");

      if (newCombo >= 3) {
        setComboToast(`${newCombo}x Combo! +${points}`);
        setTimeout(() => setComboToast(null), 1200);
      }

      // Flash zone
      setFlashZone(zoneIndex);
      setTimeout(() => setFlashZone(null), 400);

      // Sparkle particles
      const emojis = ["✨", "⭐", "💫", "🌟"];
      setParticles((prev) => [
        ...prev,
        { id: block.id, x: block.x, emoji: pickRandom(emojis) },
        { id: block.id + 0.1, x: block.x - 8, emoji: pickRandom(emojis) },
        { id: block.id + 0.2, x: block.x + 8, emoji: pickRandom(emojis) },
      ]);
      setTimeout(() => setParticles((prev) => prev.filter((p) => Math.floor(p.id) !== block.id)), 800);

      setBlocks((prev) => prev.filter((b) => b.id !== block.id));

      if (newScore === 10 || newScore === 25 || newScore === 40 || newScore === 60) {
        setupZones(newScore);
      }
    } else {
      playRainWrong();
      setCombo(0);
      setShake(true);
      setTimeout(() => setShake(false), 300);
    }

    setSelectedBlock(null);
  }, [selectedBlock, onXP, setupZones]);

  const activateSlowMo = useCallback(() => {
    if (slowMoCount <= 0) return;
    setSlowMoCount((c) => c - 1);
    setSlowMo(true);
    playRainPowerUp();
    setBlocks((prev) => prev.map((b) => ({ ...b, speed: b.speed * 2, startTime: Date.now() - ((Date.now() - b.startTime) * 2) })));
    setTimeout(() => {
      setSlowMo(false);
      setBlocks((prev) => prev.map((b) => ({ ...b, speed: b.speed / 2 })));
    }, 5000);
  }, [slowMoCount]);

  const activateHint = useCallback(() => {
    if (hintCount <= 0) return;
    setHintCount((c) => c - 1);
    setHintActive(true);
    playRainPowerUp();
    setTimeout(() => setHintActive(false), 4000);
  }, [hintCount]);

  useEffect(() => {
    return () => {
      if (spawnTimer.current) clearTimeout(spawnTimer.current);
      cancelAnimationFrame(animFrame.current);
    };
  }, []);

  // ── Menu ──
  if (gameState === "menu") {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 py-4 bg-gradient-to-b from-slate-900 via-indigo-950 to-slate-900 rounded-xl">
        <motion.div
          animate={{ y: [0, -8, 0] }}
          transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
          className="text-5xl"
        >
          🌧️
        </motion.div>
        <h3 className="text-xl font-black text-white tracking-tight">Fraction Rain</h3>
        <p className="text-xs text-indigo-300/80 text-center max-w-[220px] leading-relaxed">
          Sort falling fractions into matching zones! Tap a block, then tap where it belongs.
        </p>
        <div className="flex gap-4 mt-1 text-[10px] text-indigo-400/60">
          <span>🕐 Slow-Mo</span>
          <span>💡 Hints</span>
          <span>🔥 Combos</span>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={startGame}
          className="mt-2 px-8 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold rounded-2xl shadow-lg shadow-cyan-500/30 text-sm tracking-wide"
        >
          START
        </motion.button>
      </div>
    );
  }

  // ── Game Over ──
  if (gameState === "gameover") {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 py-4 bg-gradient-to-b from-slate-900 via-indigo-950 to-slate-900 rounded-xl">
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 200 }}
          className="text-5xl"
        >
          {score >= 40 ? "🏆" : score >= 20 ? "⭐" : "💫"}
        </motion.div>
        <h3 className="text-xl font-black text-white">Game Over</h3>
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-3xl font-black bg-gradient-to-r from-cyan-400 to-fuchsia-400 bg-clip-text text-transparent"
        >
          {score}
        </motion.p>
        <p className="text-xs text-indigo-300/60">
          {score >= 40 ? "Incredible! You're a fraction master!" : score >= 20 ? "Great run! Can you beat it?" : "Nice start! Try again!"}
        </p>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={startGame}
          className="mt-2 px-8 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold rounded-2xl shadow-lg shadow-cyan-500/30 text-sm"
        >
          PLAY AGAIN
        </motion.button>
      </div>
    );
  }

  // ── Playing ──
  return (
    <motion.div
      animate={shake ? { x: [0, -4, 4, -3, 3, 0] } : {}}
      transition={{ duration: 0.3 }}
      className="relative h-full flex flex-col overflow-hidden select-none bg-gradient-to-b from-slate-900 via-indigo-950/90 to-slate-900 rounded-xl"
    >
      {/* Subtle stars background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 20 }).map((_, i) => (
          <div
            key={i}
            className="absolute w-0.5 h-0.5 bg-white/20 rounded-full"
            style={{ left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%` }}
          />
        ))}
      </div>

      {/* HUD */}
      <div className="relative z-10 flex items-center justify-between px-3 py-1.5 landscape-compact">
        <div className="flex items-center gap-1">
          {Array.from({ length: 3 }).map((_, i) => (
            <motion.span
              key={i}
              animate={i >= lives ? { scale: [1, 0.5], opacity: [1, 0.2] } : {}}
              className={`text-base ${i < lives ? "drop-shadow-[0_0_4px_rgba(239,68,68,0.6)]" : "opacity-20 grayscale"}`}
            >
              ❤️
            </motion.span>
          ))}
        </div>

        <div className="flex flex-col items-center">
          <span className="text-lg font-black text-white tabular-nums drop-shadow-[0_0_8px_rgba(99,102,241,0.5)]">
            {score}
          </span>
          {combo >= 2 && (
            <motion.span
              key={combo}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="text-[9px] font-bold text-amber-400"
            >
              {combo}x combo
            </motion.span>
          )}
        </div>

        <div className="flex gap-1.5">
          <motion.button
            whileTap={{ scale: 0.85 }}
            onClick={activateSlowMo}
            disabled={slowMoCount <= 0 || slowMo}
            className={`text-xs px-2.5 py-1.5 rounded-xl font-bold transition-all ${
              slowMoCount > 0 && !slowMo
                ? "bg-blue-500/20 text-blue-300 border border-blue-500/30 shadow-md shadow-blue-500/20"
                : "bg-slate-800/50 text-slate-600 border border-slate-700/30"
            }`}
          >
            🕐 {slowMoCount}
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.85 }}
            onClick={activateHint}
            disabled={hintCount <= 0 || hintActive}
            className={`text-xs px-2.5 py-1.5 rounded-xl font-bold transition-all ${
              hintCount > 0 && !hintActive
                ? "bg-amber-500/20 text-amber-300 border border-amber-500/30 shadow-md shadow-amber-500/20"
                : "bg-slate-800/50 text-slate-600 border border-slate-700/30"
            }`}
          >
            💡 {hintCount}
          </motion.button>
        </div>
      </div>

      {/* Slow-mo banner */}
      <AnimatePresence>
        {slowMo && (
          <motion.div
            initial={{ opacity: 0, scaleX: 0 }}
            animate={{ opacity: 1, scaleX: 1 }}
            exit={{ opacity: 0, scaleX: 0 }}
            className="absolute top-12 left-1/2 -translate-x-1/2 z-20 px-4 py-1 bg-blue-500/30 backdrop-blur-sm text-blue-200 text-[10px] font-bold rounded-full border border-blue-400/30"
          >
            🕐 SLOW MOTION
          </motion.div>
        )}
      </AnimatePresence>

      {/* Combo toast */}
      <AnimatePresence>
        {comboToast && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.5, y: -20 }}
            className="absolute top-14 left-1/2 -translate-x-1/2 z-30 px-4 py-1.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-black rounded-full shadow-lg shadow-amber-500/40"
          >
            🔥 {comboToast}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Falling area */}
      <div className="flex-1 relative min-h-[100px] z-10 rain-fall-area">
        <AnimatePresence>
          {blocks.map((block) => {
            const style = BLOCK_STYLES[block.styleIndex];
            const isSelected = selectedBlock === block.id;
            const showHint = hintActive && block.familyIndex !== -1;
            const hintZone = showHint
              ? zones.findIndex((z) => z.familyIndex === block.familyIndex)
              : -1;

            return (
              <motion.button
                key={block.id}
                initial={{ y: -40, opacity: 0, scale: 0.8 }}
                animate={{
                  y: "calc(100% - 10px)",
                  opacity: 1,
                  scale: isSelected ? 1.15 : 1,
                }}
                exit={{
                  scale: 0,
                  opacity: 0,
                  transition: { duration: 0.2, ease: "easeOut" },
                }}
                transition={{
                  y: { duration: block.speed, ease: "linear" },
                  opacity: { duration: 0.4 },
                  scale: { type: "spring", stiffness: 400, damping: 20 },
                }}
                onClick={() => handleBlockTap(block.id)}
                className={`absolute top-0 px-3.5 py-2 rounded-2xl text-white font-black text-sm cursor-pointer
                  bg-gradient-to-br ${style.bg} shadow-lg ${style.glow}
                  ${isSelected ? "ring-2 ring-white/80 shadow-xl z-10" : ""}
                  ${showHint && hintZone >= 0 ? `ring-1 ${ZONE_STYLES[hintZone]?.ring ?? "ring-white/30"}` : ""}
                `}
                style={{ left: `${block.x}%`, transform: "translateX(-50%)" }}
              >
                <span className="relative z-10 drop-shadow-[0_1px_2px_rgba(0,0,0,0.3)]">
                  {block.fraction.n}/{block.fraction.d}
                </span>
                {/* Inner glow */}
                <div className="absolute inset-0 rounded-2xl bg-white/10" />
              </motion.button>
            );
          })}
        </AnimatePresence>

        {/* Sparkle particles */}
        <AnimatePresence>
          {particles.map((p) => (
            <motion.div
              key={p.id}
              initial={{ scale: 0.5, opacity: 1, y: 0 }}
              animate={{ scale: 1.5, opacity: 0, y: -40 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.7, ease: "easeOut" }}
              className="absolute z-20 text-lg pointer-events-none"
              style={{ left: `${p.x}%`, bottom: "18%" }}
            >
              {p.emoji}
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Selected block instruction */}
        <AnimatePresence>
          {selectedBlock !== null && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="absolute bottom-1 left-1/2 -translate-x-1/2 z-20 px-3 py-1 bg-white/10 backdrop-blur-sm text-white/70 text-[10px] font-medium rounded-full"
            >
              Now tap a zone below!
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Zones at bottom — glowing baskets */}
      <div className="relative z-10 flex gap-2 px-2 pb-2 pt-1 landscape-compact">
        {zones.map((zone, i) => {
          const zs = ZONE_STYLES[i] ?? ZONE_STYLES[0];
          const isFlashing = flashZone === i;

          return (
            <motion.button
              key={`${zone.familyIndex}-${i}`}
              whileTap={{ scale: 0.93 }}
              animate={isFlashing ? { scale: [1, 1.05, 1] } : {}}
              onClick={() => handleZoneTap(i)}
              className={`flex-1 py-3 rounded-2xl border-2 text-center font-bold transition-all relative overflow-hidden
                ${zs.border} ${zs.bg} shadow-lg ${zs.glow}
                ${selectedBlock !== null ? "shadow-xl border-opacity-100" : "border-opacity-50"}
              `}
            >
              {/* Glow pulse when block selected */}
              {selectedBlock !== null && (
                <motion.div
                  animate={{ opacity: [0.1, 0.3, 0.1] }}
                  transition={{ repeat: Infinity, duration: 1.2, ease: "easeInOut" }}
                  className="absolute inset-0 bg-gradient-to-t from-white/10 to-transparent rounded-2xl"
                />
              )}
              {isFlashing && (
                <motion.div
                  initial={{ opacity: 0.6 }}
                  animate={{ opacity: 0 }}
                  transition={{ duration: 0.4 }}
                  className="absolute inset-0 bg-white/30 rounded-2xl"
                />
              )}
              <div className="relative z-10">
                <div className="text-[9px] text-white/40 mb-0.5 font-medium tracking-wider uppercase">
                  = equals
                </div>
                <span className={`text-base font-black ${zs.text} drop-shadow-[0_0_6px_rgba(255,255,255,0.2)]`}>
                  {zone.label.n}/{zone.label.d}
                </span>
              </div>
            </motion.button>
          );
        })}
      </div>
    </motion.div>
  );
}
