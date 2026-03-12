"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  LEVEL_NAMES,
  LEVEL_EMOJIS,
  xpForNextLevel,
  xpForCurrentLevel,
} from "@/lib/progress";

interface XPBarProps {
  xp: number;
  level: number;
  dailyXP: number;
  dailyGoal: number;
  levelUpFlash?: boolean;
}

export default function XPBar({
  xp,
  level,
  dailyXP,
  dailyGoal,
  levelUpFlash,
}: XPBarProps) {
  const currentThreshold = xpForCurrentLevel(level);
  const nextThreshold = xpForNextLevel(level);
  const isMaxLevel = level >= LEVEL_NAMES.length - 1;
  const progressInLevel = xp - currentThreshold;
  const levelRange = nextThreshold - currentThreshold;
  const fillPct = isMaxLevel ? 100 : Math.min(100, (progressInLevel / levelRange) * 100);

  return (
    <div className="flex items-center gap-2 px-3 py-1.5">
      {/* Level badge */}
      <AnimatePresence mode="wait">
        <motion.div
          key={level}
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 1.5, opacity: 0 }}
          transition={{ type: "spring", stiffness: 400, damping: 15 }}
          className="flex items-center gap-1 shrink-0"
        >
          <span className="text-base">{LEVEL_EMOJIS[level] ?? "🌱"}</span>
          <span className="text-[10px] font-bold text-gray-600 hidden sm:inline">
            {LEVEL_NAMES[level] ?? "Beginner"}
          </span>
        </motion.div>
      </AnimatePresence>

      {/* XP bar */}
      <div className="flex-1 relative">
        <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
          <motion.div
            className={`h-full rounded-full ${
              levelUpFlash
                ? "bg-gradient-to-r from-yellow-400 via-amber-300 to-yellow-400"
                : "bg-gradient-to-r from-indigo-400 to-purple-500"
            }`}
            initial={{ width: 0 }}
            animate={{ width: `${fillPct}%` }}
            transition={{ type: "spring", stiffness: 200, damping: 25 }}
          />
        </div>
      </div>

      {/* XP text */}
      <div className="shrink-0 text-right">
        <span className="text-[10px] font-semibold text-gray-500">
          {isMaxLevel ? `${xp} XP` : `${xp}/${nextThreshold}`}
        </span>
        <span className="text-[9px] text-gray-300 ml-1.5 hidden sm:inline">
          Today: {dailyXP}/{dailyGoal}
        </span>
      </div>
    </div>
  );
}
