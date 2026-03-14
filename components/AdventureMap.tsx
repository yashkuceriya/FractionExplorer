"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import TutorAvatar from "@/components/chat/TutorAvatar";
import { loadMastery } from "@/lib/mastery";

export interface AdventureStop {
  id: string;
  name: string;
  emoji: string;
  description: string;
  skill: string;
  x: number;
  y: number;
  scenery: string[];
  fractions: string[];
  /** What the map says when you're at this stop */
  speech: string;
  /** Which workspace mode to open (compare, battle, tower, recipe, pizza, rain) */
  workspaceMode?: string;
  /** Goal to display in the workspace */
  goal?: string;
}

const ADVENTURE_STOPS: AdventureStop[] = [
  {
    id: "basecamp",
    name: "Base Camp",
    emoji: "🏕️",
    description: "Where every explorer begins!",
    skill: "Meet your fraction friends",
    x: 10,
    y: 82,
    scenery: ["🌻", "🦗", "🌾"],
    fractions: ["1/2", "1/4"],
    speech:
      "Welcome, explorer! See those colorful blocks? Those are FRACTIONS! Drag them around, tap them — they're your new best friends!",
    goal: "Drag a fraction block to a comparison zone!",
  },
  {
    id: "forest",
    name: "Fraction Forest",
    emoji: "🌴",
    description: "Explore and discover!",
    skill: "Drag, split, and discover",
    x: 28,
    y: 62,
    scenery: ["🌿", "🦋", "🍄", "🐸"],
    fractions: ["1/3", "2/3", "3/4"],
    speech:
      "Welcome to Fraction Forest! Try the SPLIT button — it breaks fractions into tiny pieces! BOOM! Can you split 2/4 into two 1/4s?",
    goal: "Split a fraction into unit pieces!",
  },
  {
    id: "cave",
    name: "Discovery Cave",
    emoji: "🔍",
    description: "Find fraction TWINS!",
    skill: "Find equivalent fractions",
    x: 48,
    y: 42,
    scenery: ["💎", "🦇", "🕯️"],
    fractions: ["2/4 = 1/2", "2/6 = 1/3"],
    speech:
      "Shhh... inside this cave are SECRET TWINS! Fractions that LOOK different but are the SAME size! Drag 1/2 and 2/4 to compare — are they twins?",
    goal: "Find 2 pairs of equivalent fractions!",
  },
  {
    id: "river",
    name: "Merge River",
    emoji: "🏞️",
    description: "Merge fractions together!",
    skill: "Merge & combine",
    x: 65,
    y: 28,
    scenery: ["🐟", "🌊", "🦆"],
    fractions: ["1/4 + 1/4", "1/3 + 2/3"],
    speech:
      "This river flows with fractions! Drag one fraction ON TOP of another to MERGE them together! Can you make 1/4 + 1/4 = 2/4?",
    goal: "Merge fractions to make a new one!",
  },
  {
    id: "mountain",
    name: "Battle Mountain",
    emoji: "⛰️",
    description: "Which fraction is BIGGER?",
    skill: "Compare fractions",
    x: 80,
    y: 18,
    scenery: ["🦅", "🌈", "⚡"],
    fractions: ["3/4 vs 2/3"],
    speech:
      "We're climbing Battle Mountain! Time for a FRACTION FIGHT! Which fraction is bigger — 3/4 or 2/3? Drop them in the battle zone to find out!",
    workspaceMode: "battle",
    goal: "Win 3 fraction battles!",
  },
  {
    id: "castle",
    name: "Fraction Castle",
    emoji: "🏰",
    description: "The FINAL challenge!",
    skill: "Master all fraction skills",
    x: 92,
    y: 6,
    scenery: ["👑", "🎆", "🏳️"],
    fractions: ["1/2=2/4", "1/3=2/6", "3/4"],
    speech:
      "The Castle gates are OPEN! Show everything you learned — split, merge, compare, and find ALL the fraction twins! YOU GOT THIS!",
    goal: "Find 3 equivalent pairs to unlock the castle!",
  },
];

// Trail fractions scattered between stops
const TRAIL_FRACTIONS = [
  { text: "½", x: 16, y: 74, delay: 0.3 },
  { text: "¼", x: 22, y: 68, delay: 0.5 },
  { text: "⅓", x: 36, y: 54, delay: 0.7 },
  { text: "2/4", x: 42, y: 48, delay: 0.4 },
  { text: "¾", x: 55, y: 36, delay: 0.9 },
  { text: "⅔", x: 58, y: 32, delay: 0.6 },
  { text: "3/6", x: 72, y: 22, delay: 0.8 },
  { text: "4/8", x: 85, y: 12, delay: 1.0 },
];

interface AdventureMapProps {
  currentPhase: string;
  completedChallenges: number;
  characterId?: string;
  onSelectStop: (stop: AdventureStop) => void;
}

const PHASE_TO_STOP: Record<string, number> = {
  intro: 0,
  exploration: 1,
  discovery: 2,
  practice: 3,
  assessment: 4,
  celebration: 5,
};

export default function AdventureMap({
  currentPhase,
  completedChallenges,
  characterId,
  onSelectStop,
}: AdventureMapProps) {
  const activeIdx = PHASE_TO_STOP[currentPhase] ?? Math.min(completedChallenges, ADVENTURE_STOPS.length - 1);

  return (
    <div className="relative w-full h-full rounded-2xl overflow-hidden border-2 border-pink-200/60 shadow-inner">
      {/* Sky gradient background */}
      <div className="absolute inset-0 bg-gradient-to-b from-sky-300 via-sky-200 via-55% to-emerald-400" />

      {/* Ground texture */}
      <div className="absolute bottom-0 left-0 right-0 h-[20%] bg-gradient-to-t from-emerald-600/30 to-transparent" />

      {/* Clouds */}
      <motion.div
        animate={{ x: [0, 25, 0] }}
        transition={{ repeat: Infinity, duration: 9, ease: "easeInOut" }}
        className="absolute top-[6%] left-[12%] text-4xl opacity-35 pointer-events-none select-none"
      >
        ☁️
      </motion.div>
      <motion.div
        animate={{ x: [0, -20, 0] }}
        transition={{ repeat: Infinity, duration: 11, ease: "easeInOut" }}
        className="absolute top-[3%] right-[18%] text-3xl opacity-25 pointer-events-none select-none"
      >
        ☁️
      </motion.div>

      {/* Sun */}
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 25, ease: "linear" }}
        className="absolute top-[2%] right-[5%] text-4xl pointer-events-none select-none"
      >
        ☀️
      </motion.div>

      {/* Trail fractions */}
      {TRAIL_FRACTIONS.map((frac, i) => {
        const collected = i < activeIdx * 2;
        return (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0 }}
            animate={{
              opacity: 1,
              scale: 1,
              y: collected ? 0 : [0, -4, 0],
            }}
            transition={{
              opacity: { delay: frac.delay, duration: 0.3 },
              scale: { delay: frac.delay, type: "spring" },
              y: { repeat: Infinity, duration: 2 + i * 0.2, ease: "easeInOut" },
            }}
            className="absolute pointer-events-none select-none"
            style={{ left: `${frac.x}%`, top: `${frac.y}%` }}
          >
            <div
              className={`text-xs font-black px-1.5 py-0.5 rounded-lg shadow-md border-2 ${
                collected
                  ? "bg-pink-400/90 text-white border-pink-300 shadow-pink-400/20"
                  : "bg-white/90 text-purple-800 border-pink-200/60"
              }`}
            >
              {collected && <span className="text-[8px] mr-0.5">⭐</span>}
              {frac.text}
            </div>
          </motion.div>
        );
      })}

      {/* Trail path SVG */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        preserveAspectRatio="none"
      >
        {ADVENTURE_STOPS.slice(0, -1).map((stop, i) => {
          const next = ADVENTURE_STOPS[i + 1];
          const isPast = i < activeIdx;
          const isActive = i === activeIdx;
          // Curved path using quadratic bezier
          const midX = (stop.x + next.x) / 2;
          const midY = (stop.y + next.y) / 2 - 8;
          return (
            <path
              key={stop.id}
              d={`M ${stop.x}% ${stop.y}% Q ${midX}% ${midY}% ${next.x}% ${next.y}%`}
              fill="none"
              stroke={isPast ? "#F13EA1" : isActive ? "#c084fc" : "#d1d5db"}
              strokeWidth={isPast ? 4 : 3}
              strokeDasharray={isPast ? "none" : "8 6"}
              strokeLinecap="round"
              opacity={isPast ? 0.9 : 0.5}
            />
          );
        })}
      </svg>

      {/* Location markers — tappable! */}
      {ADVENTURE_STOPS.map((stop, i) => {
        const isPast = i < activeIdx;
        const isActive = i === activeIdx;
        const isFuture = i > activeIdx;
        const isUnlocked = i <= activeIdx;

        return (
          <div
            key={stop.id}
            className="absolute"
            style={{
              left: `${stop.x}%`,
              top: `${stop.y}%`,
              transform: "translate(-50%, -50%)",
            }}
          >
            {/* Scenery */}
            {stop.scenery.map((s, si) => (
              <span
                key={si}
                className="absolute text-base pointer-events-none opacity-50 select-none"
                style={{
                  left: `${(si - 1) * 30}px`,
                  top: `${si % 2 === 0 ? -24 : 24}px`,
                }}
              >
                {s}
              </span>
            ))}

            {/* Tappable location circle */}
            <motion.button
              onClick={() => isUnlocked && onSelectStop(stop)}
              disabled={!isUnlocked}
              animate={
                isActive
                  ? { scale: [1, 1.12, 1], boxShadow: ["0 0 0 0 rgba(241,62,161,0)", "0 0 0 12px rgba(241,62,161,0.3)", "0 0 0 0 rgba(241,62,161,0)"] }
                  : {}
              }
              transition={isActive ? { repeat: Infinity, duration: 1.8 } : {}}
              className={`relative w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center text-2xl sm:text-3xl shadow-lg border-3 transition-all ${
                isPast
                  ? "bg-gradient-to-br from-pink-300 to-pink-500 border-pink-200 cursor-pointer active:scale-95"
                  : isActive
                  ? "bg-gradient-to-br from-pink-400 to-purple-600 border-pink-200 ring-4 ring-pink-300/50 cursor-pointer active:scale-95"
                  : "bg-gray-200/80 border-gray-300 opacity-50 cursor-not-allowed"
              }`}
            >
              {isPast ? "⭐" : stop.emoji}
              {isPast && (
                <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center text-[10px] text-white font-bold border-2 border-white">
                  ✓
                </div>
              )}
              {isFuture && (
                <div className="absolute -top-1 -right-1 w-5 h-5 bg-gray-400 rounded-full flex items-center justify-center text-[10px] text-white border-2 border-white">
                  🔒
                </div>
              )}
            </motion.button>

            {/* Character on active stop */}
            {isActive && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1, y: [-4, -14, -4] }}
                transition={{
                  scale: { type: "spring", delay: 0.2 },
                  y: { repeat: Infinity, duration: 2, ease: "easeInOut" },
                }}
                className="absolute -top-10 left-1/2 -translate-x-1/2"
              >
                <TutorAvatar size={28} animate characterId={characterId} />
              </motion.div>
            )}

            {/* Fraction chips */}
            <div
              className={`absolute ${
                i % 2 === 0 ? "-right-14 sm:-right-18 top-0" : "-left-14 sm:-left-18 top-0"
              } flex flex-col gap-0.5 ${isFuture ? "opacity-25" : ""}`}
            >
              {stop.fractions.slice(0, 2).map((f, fi) => (
                <motion.div
                  key={fi}
                  initial={{ opacity: 0, x: i % 2 === 0 ? -8 : 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + fi * 0.1 }}
                  className={`text-[9px] sm:text-[10px] font-black px-1.5 py-0.5 rounded-md whitespace-nowrap ${
                    isPast
                      ? "bg-pink-400 text-white"
                      : isActive
                      ? "bg-purple-100 text-purple-700 border border-purple-300"
                      : "bg-gray-100 text-gray-400"
                  }`}
                >
                  {f}
                </motion.div>
              ))}
            </div>

            {/* Location name */}
            <div
              className={`absolute top-full mt-1 left-1/2 -translate-x-1/2 whitespace-nowrap text-center ${
                isFuture ? "opacity-35" : ""
              }`}
            >
              <p
                className={`text-[9px] sm:text-[10px] font-black ${
                  isActive ? "text-purple-800" : isPast ? "text-pink-700" : "text-gray-500"
                }`}
              >
                {stop.name}
              </p>
            </div>
          </div>
        );
      })}

      {/* Title banner */}
      <div className="absolute top-2.5 left-1/2 -translate-x-1/2 z-10">
        <div className="bg-gradient-to-r from-pink-500 to-purple-600 px-5 py-1.5 rounded-full shadow-lg border-2 border-pink-300/60">
          <h2 className="text-xs sm:text-sm font-black text-white tracking-wide">
            🗺️ FRACTION MAP!
          </h2>
        </div>
      </div>

      {/* Speech bubble from current stop */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="absolute bottom-2.5 left-2.5 right-2.5 z-10"
      >
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl px-3 py-2.5 shadow-lg border-2 border-pink-200/60">
          <div className="flex items-start gap-2">
            <span className="text-lg shrink-0">
              {ADVENTURE_STOPS[activeIdx]?.emoji ?? "🗺️"}
            </span>
            <div className="min-w-0">
              <p className="text-[10px] font-black text-pink-600 mb-0.5">
                {ADVENTURE_STOPS[activeIdx]?.name?.toUpperCase() ?? "THE MAP SAYS"}:
              </p>
              <p className="text-xs sm:text-sm font-bold text-gray-700 leading-snug">
                {ADVENTURE_STOPS[activeIdx]?.speech ?? "Tap a location to start exploring!"}
              </p>
              {ADVENTURE_STOPS[activeIdx] && (
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => onSelectStop(ADVENTURE_STOPS[activeIdx])}
                  className="mt-1.5 px-4 py-1.5 bg-gradient-to-r from-pink-500 to-purple-500 text-white text-xs font-black rounded-full shadow-md"
                >
                  LET&apos;S GO! →
                </motion.button>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
