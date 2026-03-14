"use client";

import { motion, AnimatePresence } from "framer-motion";

interface StreakCounterProps {
  streak: number;
}

export default function StreakCounter({ streak }: StreakCounterProps) {
  if (streak < 1) return null;

  const isMilestone = streak === 3 || streak === 5 || streak >= 7;

  return (
    <AnimatePresence>
      <motion.div
        key={streak}
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{
          scale: isMilestone ? [1, 1.4, 1] : [1, 1.2, 1],
          opacity: 1,
        }}
        transition={{ type: "spring", stiffness: 500, damping: 15 }}
        className="flex items-center gap-1 px-2 py-1 bg-orange-50 rounded-lg border border-orange-200"
      >
        <span className={`${isMilestone ? "text-lg" : "text-sm"}`}>🔥</span>
        <span className={`font-bold text-orange-600 ${isMilestone ? "text-base" : "text-sm"}`}>
          {streak}
        </span>
      </motion.div>
    </AnimatePresence>
  );
}
