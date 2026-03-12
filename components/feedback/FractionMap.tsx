"use client";

import { motion, AnimatePresence } from "framer-motion";
import TutorAvatar from "@/components/chat/TutorAvatar";

interface MapLocation {
  id: string;
  phase: string;
  name: string;
  emoji: string;
  description: string;
  skill: string;
  x: number;
  y: number;
  scenery: string[];
  fractions: string[]; // fractions you learn at this location
}

const MAP_LOCATIONS: MapLocation[] = [
  {
    id: "base",
    phase: "intro",
    name: "Base Camp",
    emoji: "🏕️",
    description: "Where every explorer begins!",
    skill: "Learn what fractions are",
    x: 12,
    y: 78,
    scenery: ["🌻", "🦗"],
    fractions: ["½", "¼"],
  },
  {
    id: "forest",
    phase: "exploration",
    name: "Fraction Forest",
    emoji: "🌴",
    description: "Explore the fraction blocks!",
    skill: "Drag, tap, and discover",
    x: 30,
    y: 58,
    scenery: ["🌿", "🦋", "🍄"],
    fractions: ["⅓", "⅔", "¾"],
  },
  {
    id: "cave",
    phase: "discovery",
    name: "Discovery Cave",
    emoji: "🔍",
    description: "Find fractions that are equal!",
    skill: "Match equivalent fractions",
    x: 50,
    y: 38,
    scenery: ["💎", "🦇"],
    fractions: ["2/4", "3/6"],
  },
  {
    id: "mountain",
    phase: "practice",
    name: "Merge Mountain",
    emoji: "⛰️",
    description: "Split and merge to make new fractions!",
    skill: "Split & merge mastery",
    x: 70,
    y: 22,
    scenery: ["🦅", "🌈"],
    fractions: ["2/6", "4/8"],
  },
  {
    id: "castle",
    phase: "assessment",
    name: "Challenge Castle",
    emoji: "🏰",
    description: "The final fraction challenge!",
    skill: "Prove your fraction skills",
    x: 88,
    y: 10,
    scenery: ["👑"],
    fractions: ["1/3=2/6", "½=2/4"],
  },
];

// Fraction pieces scattered along the trail between stops
const TRAIL_FRACTIONS = [
  { text: "½", x: 18, y: 70, size: "text-lg", delay: 0.5 },
  { text: "¼", x: 22, y: 64, size: "text-base", delay: 0.7 },
  { text: "⅓", x: 38, y: 50, size: "text-lg", delay: 0.9 },
  { text: "2/4", x: 42, y: 44, size: "text-sm", delay: 1.1 },
  { text: "¾", x: 55, y: 34, size: "text-base", delay: 1.3 },
  { text: "⅔", x: 60, y: 28, size: "text-lg", delay: 0.6 },
  { text: "3/6", x: 65, y: 30, size: "text-sm", delay: 0.8 },
  { text: "1/5", x: 78, y: 18, size: "text-base", delay: 1.0 },
  { text: "4/8", x: 82, y: 14, size: "text-sm", delay: 1.2 },
];

const MAP_SPEECHES: Record<string, string> = {
  intro: "First, we go through Fraction Forest to find ⅓ and ⅔! Then into Discovery Cave to match 2/4 = ½! Then up Merge Mountain to the Castle!",
  exploration: "We're in Fraction Forest! Look at all these fractions — ⅓, ⅔, ¾! Next stop: Discovery Cave!",
  discovery: "We made it to Discovery Cave! Can you find which fractions are EQUAL? Like 2/4 and ½!",
  practice: "We're climbing Merge Mountain! Split 2/4 into two ¼s! Merge them back! Almost to the Castle!",
  assessment: "We're at the Castle! Show me: does ½ = 2/4? Does ⅓ = 2/6? Prove your fraction powers!",
  celebration: "WE DID IT! We found ALL the fraction matches on the whole map!",
};

interface FractionMapProps {
  show: boolean;
  currentPhase: string;
  completedChallenges: number;
  onClose: () => void;
  characterId?: string;
}

export default function FractionMap({
  show,
  currentPhase,
  completedChallenges,
  onClose,
  characterId,
}: FractionMapProps) {
  const currentIndex = MAP_LOCATIONS.findIndex((l) => l.phase === currentPhase);
  const activeIdx = currentIndex >= 0 ? currentIndex : 0;
  const speech = MAP_SPEECHES[currentPhase] || MAP_SPEECHES.intro;

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex flex-col"
        >
          <div className="absolute inset-0 bg-black/40" onClick={onClose} />

          <motion.div
            initial={{ scale: 0.3, opacity: 0, rotate: -10 }}
            animate={{ scale: 1, opacity: 1, rotate: 0 }}
            exit={{ scale: 0.3, opacity: 0, rotate: 10 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="relative m-3 sm:m-6 flex-1 rounded-3xl overflow-hidden shadow-2xl border-4 border-amber-300/80"
          >
            {/* Map background */}
            <div className="absolute inset-0 bg-gradient-to-b from-sky-300 via-sky-200 via-60% to-emerald-400" />

            {/* Clouds */}
            <motion.div
              animate={{ x: [0, 20, 0] }}
              transition={{ repeat: Infinity, duration: 8, ease: "easeInOut" }}
              className="absolute top-[8%] left-[15%] text-4xl opacity-40 pointer-events-none"
            >
              ☁️
            </motion.div>
            <motion.div
              animate={{ x: [0, -15, 0] }}
              transition={{ repeat: Infinity, duration: 10, ease: "easeInOut" }}
              className="absolute top-[5%] right-[20%] text-3xl opacity-30 pointer-events-none"
            >
              ☁️
            </motion.div>

            {/* Sun */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 20, ease: "linear" }}
              className="absolute top-[3%] right-[8%] text-4xl pointer-events-none"
            >
              ☀️
            </motion.div>

            {/* ── Fraction pieces scattered along the trail ── */}
            {TRAIL_FRACTIONS.map((frac, i) => {
              const collected = frac.y > (MAP_LOCATIONS[activeIdx]?.y ?? 100);
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{
                    opacity: 1,
                    scale: 1,
                    y: collected ? [0, 0] : [0, -5, 0],
                    rotate: collected ? 0 : [0, 5, -5, 0],
                  }}
                  transition={{
                    opacity: { delay: frac.delay, duration: 0.3 },
                    scale: { delay: frac.delay, type: "spring" },
                    y: { repeat: Infinity, duration: 2 + i * 0.3, ease: "easeInOut", delay: frac.delay },
                    rotate: { repeat: Infinity, duration: 3, ease: "easeInOut", delay: frac.delay },
                  }}
                  className="absolute pointer-events-none"
                  style={{ left: `${frac.x}%`, top: `${frac.y}%` }}
                >
                  <div className={`${
                    collected
                      ? "bg-amber-400/90 text-white shadow-amber-400/30"
                      : "bg-white/90 text-amber-800 shadow-black/10"
                  } ${frac.size} font-black px-2 py-0.5 rounded-lg shadow-md border-2 ${
                    collected ? "border-amber-300" : "border-amber-200/60"
                  }`}>
                    {collected && <span className="text-[8px] mr-0.5">⭐</span>}
                    {frac.text}
                  </div>
                </motion.div>
              );
            })}

            {/* Trail path SVG */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none" preserveAspectRatio="none">
              {MAP_LOCATIONS.slice(0, -1).map((loc, i) => {
                const next = MAP_LOCATIONS[i + 1];
                const isPast = i < activeIdx;
                const isActive = i === activeIdx;
                return (
                  <line
                    key={loc.id}
                    x1={`${loc.x}%`}
                    y1={`${loc.y}%`}
                    x2={`${next.x}%`}
                    y2={`${next.y}%`}
                    stroke={isPast ? "#f59e0b" : isActive ? "#fbbf24" : "#d1d5db"}
                    strokeWidth={isPast ? 5 : 3}
                    strokeDasharray={isPast ? "none" : "8 6"}
                    strokeLinecap="round"
                    opacity={isPast ? 1 : 0.5}
                  />
                );
              })}
            </svg>

            {/* Location markers */}
            {MAP_LOCATIONS.map((loc, i) => {
              const isPast = i < activeIdx;
              const isActive = i === activeIdx;
              const isFuture = i > activeIdx;

              return (
                <div
                  key={loc.id}
                  className="absolute"
                  style={{
                    left: `${loc.x}%`,
                    top: `${loc.y}%`,
                    transform: "translate(-50%, -50%)",
                  }}
                >
                  {/* Scenery decorations */}
                  {loc.scenery.map((s, si) => (
                    <span
                      key={si}
                      className="absolute text-lg pointer-events-none opacity-60"
                      style={{
                        left: `${(si - 1) * 35}px`,
                        top: `${si % 2 === 0 ? -28 : 28}px`,
                      }}
                    >
                      {s}
                    </span>
                  ))}

                  {/* Location circle */}
                  <motion.div
                    animate={isActive ? { scale: [1, 1.1, 1] } : {}}
                    transition={isActive ? { repeat: Infinity, duration: 1.5 } : {}}
                    className={`relative w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center text-2xl sm:text-3xl shadow-lg border-3 ${
                      isPast
                        ? "bg-gradient-to-br from-amber-300 to-amber-500 border-amber-200"
                        : isActive
                        ? "bg-gradient-to-br from-orange-400 to-red-500 border-orange-200 ring-4 ring-orange-300/50"
                        : "bg-gray-200/80 border-gray-300 opacity-60"
                    }`}
                  >
                    {isPast ? "⭐" : loc.emoji}

                    {isPast && (
                      <div className="absolute -top-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center text-[10px] text-white font-bold border-2 border-white">
                        ✓
                      </div>
                    )}
                  </motion.div>

                  {/* Fraction chips at each location — what you learn here */}
                  <div className={`absolute ${i % 2 === 0 ? "-right-16 sm:-right-20 top-0" : "-left-16 sm:-left-20 top-0"} flex flex-col gap-0.5 ${isFuture ? "opacity-30" : ""}`}>
                    {loc.fractions.map((f, fi) => (
                      <motion.div
                        key={fi}
                        initial={{ opacity: 0, x: i % 2 === 0 ? -10 : 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.6 + fi * 0.15 }}
                        className={`text-[10px] sm:text-xs font-black px-1.5 py-0.5 rounded-md whitespace-nowrap ${
                          isPast
                            ? "bg-amber-400 text-white"
                            : isActive
                            ? "bg-orange-100 text-orange-700 border border-orange-300"
                            : "bg-gray-100 text-gray-400"
                        }`}
                      >
                        {f}
                      </motion.div>
                    ))}
                  </div>

                  {/* Character avatar on active location */}
                  {isActive && (
                    <motion.div
                      initial={{ scale: 0, y: 10 }}
                      animate={{ scale: 1, y: [-5, -12, -5] }}
                      transition={{
                        scale: { delay: 0.3, type: "spring" },
                        y: { repeat: Infinity, duration: 2, ease: "easeInOut" },
                      }}
                      className="absolute -top-10 left-1/2 -translate-x-1/2"
                    >
                      <TutorAvatar size={32} animate characterId={characterId} />
                    </motion.div>
                  )}

                  {/* Location name label */}
                  <div className={`absolute top-full mt-1 left-1/2 -translate-x-1/2 whitespace-nowrap text-center ${
                    isFuture ? "opacity-40" : ""
                  }`}>
                    <p className={`text-[10px] sm:text-xs font-black ${
                      isActive ? "text-orange-800" : isPast ? "text-amber-700" : "text-gray-500"
                    }`}>
                      {loc.name}
                    </p>
                    {isActive && (
                      <p className="text-[8px] sm:text-[9px] text-orange-600 font-semibold">
                        {loc.skill}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Map title */}
            <div className="absolute top-3 left-1/2 -translate-x-1/2 z-10">
              <div className="bg-gradient-to-r from-amber-500 to-orange-500 px-5 py-1.5 rounded-full shadow-lg border-2 border-amber-300/60">
                <h2 className="text-sm sm:text-base font-black text-white tracking-wide">
                  🗺️ THE MAP
                </h2>
              </div>
            </div>

            {/* Map speech bubble */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="absolute bottom-3 left-3 right-3 z-10"
            >
              <div className="bg-white/95 backdrop-blur-sm rounded-2xl px-4 py-3 shadow-lg border-2 border-amber-200/60">
                <div className="flex items-start gap-2">
                  <span className="text-xl shrink-0">🗺️</span>
                  <div>
                    <p className="text-[10px] font-black text-amber-600 mb-0.5">THE MAP SAYS:</p>
                    <p className="text-xs sm:text-sm font-bold text-gray-700 leading-snug">
                      {speech}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Close button */}
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={onClose}
              className="absolute top-3 right-3 z-20 w-9 h-9 bg-white/90 rounded-full flex items-center justify-center shadow-md text-gray-500 font-bold text-lg border border-gray-200"
            >
              ✕
            </motion.button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
