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
        className={`flex items-center gap-1 px-2 py-1 rounded-lg border ${
          isMilestone
            ? "bg-gradient-to-r from-orange-100 to-red-100 border-orange-300 shadow-sm shadow-orange-200/50"
            : "bg-orange-50 border-orange-200"
        }`}
      >
        <motion.span
          className={`${isMilestone ? "text-lg" : "text-sm"}`}
          animate={isMilestone ? { rotate: [0, -15, 15, 0] } : {}}
          transition={isMilestone ? { repeat: Infinity, duration: 1, ease: "easeInOut" } : {}}
        >
          🔥
        </motion.span>
        <span className={`font-black text-orange-600 ${isMilestone ? "text-base" : "text-sm"}`}>
          {streak}
        </span>
      </motion.div>
    </AnimatePresence>
  );
}
