"use client";

import { motion } from "framer-motion";
import { LEVEL_NAMES, LEVEL_EMOJIS } from "@/lib/progress";

interface SessionGoalCardProps {
  xp: number;
  level: number;
  dailyXP: number;
  consecutiveDays: number;
  onKeepGoing: () => void;
  onDoneForToday: () => void;
}

export default function SessionGoalCard({
  xp,
  level,
  dailyXP,
  consecutiveDays,
  onKeepGoing,
  onDoneForToday,
}: SessionGoalCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-6"
    >
      <motion.div
        initial={{ scale: 0.7, y: 30 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.7, y: 30 }}
        transition={{ type: "spring", stiffness: 300, damping: 22 }}
        className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-6 text-center"
      >
        {/* Celebration emoji */}
        <motion.div
          animate={{ rotate: [0, -10, 10, -5, 5, 0] }}
          transition={{ type: "tween", duration: 0.6 }}
          className="text-5xl mb-3"
        >
          🎉
        </motion.div>

        <h2 className="text-xl font-bold text-gray-800 mb-1">
          Amazing Day!
        </h2>
        <p className="text-sm text-gray-500 mb-4">
          You earned <span className="font-bold text-indigo-600">{dailyXP} XP</span> today!
        </p>

        {/* Level badge */}
        <div className="flex items-center justify-center gap-2 mb-3">
          <span className="text-2xl">{LEVEL_EMOJIS[level] ?? "🌱"}</span>
          <span className="text-sm font-semibold text-gray-700">
            Level {level} — {LEVEL_NAMES[level] ?? "Beginner"}
          </span>
        </div>

        {/* Stats row */}
        <div className="flex items-center justify-center gap-4 text-xs text-gray-400 mb-6">
          <span>{xp} total XP</span>
          {consecutiveDays > 1 && (
            <span className="text-orange-500 font-semibold">
              🔥 {consecutiveDays} day streak!
            </span>
          )}
        </div>

        {/* Frax encouragement */}
        <p className="text-sm text-gray-600 mb-6 italic">
          &ldquo;You&apos;re a fraction superstar! Come back tomorrow for more adventures!&rdquo;
        </p>

        {/* Buttons */}
        <div className="flex gap-3">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={onDoneForToday}
            className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-emerald-400 to-green-500 text-white font-semibold text-sm shadow-md"
          >
            Done for Today ✅
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={onKeepGoing}
            className="flex-1 px-4 py-3 rounded-xl bg-gray-100 text-gray-600 font-semibold text-sm"
          >
            Keep Going →
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}
