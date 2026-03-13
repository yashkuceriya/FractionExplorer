"use client";

import { motion } from "framer-motion";

export interface JourneyStop {
  id: string;
  name: string;
  emoji: string;
  scene: string; // small illustration emoji cluster
}

const JOURNEY_STOPS: JourneyStop[] = [
  { id: "basecamp", name: "Base Camp", emoji: "🏕️", scene: "🌻🌿" },
  { id: "forest", name: "Forest", emoji: "🌴", scene: "🦋🍄" },
  { id: "cave", name: "Cave", emoji: "🔍", scene: "💎🦇" },
  { id: "mountain", name: "Mountain", emoji: "⛰️", scene: "🦅🌈" },
  { id: "castle", name: "Castle", emoji: "🏰", scene: "👑🏳️" },
  { id: "victory", name: "Victory!", emoji: "🏆", scene: "🎆🎉" },
];

interface JourneyStripProps {
  activeIndex: number;
  onTapStop?: (index: number) => void;
}

export default function JourneyStrip({ activeIndex, onTapStop }: JourneyStripProps) {
  return (
    <div
      className="relative flex items-center gap-0 px-2 py-1.5 overflow-x-auto scrollbar-hide rounded-xl border-2"
      style={{
        background: "linear-gradient(135deg, #f5e6c8 0%, #ecdbb4 40%, #e8d5a8 100%)",
        borderColor: "#c4a265",
        boxShadow: "inset 0 1px 3px rgba(0,0,0,0.08), 0 2px 4px rgba(0,0,0,0.1)",
      }}
    >
      {/* Parchment texture dots */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{
        backgroundImage: "radial-gradient(circle, #000 0.5px, transparent 0.5px)",
        backgroundSize: "8px 8px",
      }} />

      {/* Map character - tiny scroll with eyes */}
      <div className="shrink-0 mr-1 text-lg relative" title="The Map!">
        <span>🗺️</span>
      </div>

      {JOURNEY_STOPS.map((stop, i) => {
        const isPast = i < activeIndex;
        const isActive = i === activeIndex;
        const isUnlocked = i <= activeIndex;

        return (
          <div key={stop.id} className="flex items-center shrink-0">
            {/* Dashed trail connector */}
            {i > 0 && (
              <svg width="28" height="12" className="mx-0 shrink-0" viewBox="0 0 28 12">
                <path
                  d="M 2 6 Q 14 2 26 6"
                  fill="none"
                  stroke={isPast ? "#c4763c" : isActive ? "#d4a574" : "#ccc4b0"}
                  strokeWidth={isPast ? 2.5 : 2}
                  strokeDasharray={isPast ? "none" : "3 3"}
                  strokeLinecap="round"
                />
                {/* Footprints on completed paths */}
                {isPast && (
                  <>
                    <circle cx="8" cy="5" r="1" fill="#a0652a" opacity="0.5" />
                    <circle cx="14" cy="4" r="1" fill="#a0652a" opacity="0.4" />
                    <circle cx="20" cy="5" r="1" fill="#a0652a" opacity="0.5" />
                  </>
                )}
              </svg>
            )}

            {/* Location marker */}
            <button
              onClick={() => isUnlocked && onTapStop?.(i)}
              disabled={!isUnlocked}
              className="flex flex-col items-center gap-0 group relative"
            >
              {/* Scene decoration */}
              <span className={`absolute -top-2.5 text-[8px] pointer-events-none select-none ${
                isUnlocked ? "opacity-60" : "opacity-20"
              }`}>
                {stop.scene}
              </span>

              <motion.div
                animate={isActive ? {
                  scale: [1, 1.15, 1],
                  rotate: [0, 2, -2, 0],
                } : {}}
                transition={isActive ? { repeat: Infinity, duration: 2 } : {}}
                className={`relative w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center text-lg sm:text-xl border-2 transition-all ${
                  isPast
                    ? "bg-gradient-to-br from-amber-200 to-amber-400 border-amber-500 shadow-md shadow-amber-300/40 cursor-pointer"
                    : isActive
                    ? "bg-gradient-to-br from-amber-100 to-orange-300 border-orange-500 ring-2 ring-orange-300/60 shadow-lg shadow-orange-300/30 cursor-pointer"
                    : "bg-[#e8dcc4] border-[#ccc4b0] opacity-40 cursor-not-allowed grayscale-[0.5]"
                }`}
              >
                {isPast ? (
                  <span className="text-amber-700 text-sm">⭐</span>
                ) : (
                  stop.emoji
                )}

                {/* Completed checkmark */}
                {isPast && (
                  <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center text-[8px] text-white font-bold border border-white shadow-sm">
                    ✓
                  </div>
                )}
              </motion.div>

              <span
                className={`text-[8px] sm:text-[9px] font-black leading-tight mt-0.5 ${
                  isActive
                    ? "text-orange-800"
                    : isPast
                    ? "text-amber-700"
                    : "text-[#a89a7c]"
                }`}
              >
                {stop.name}
              </span>
            </button>
          </div>
        );
      })}
    </div>
  );
}
