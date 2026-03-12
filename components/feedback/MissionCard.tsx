"use client";

import { motion, AnimatePresence } from "framer-motion";
import type { Challenge } from "@/lib/challenges";

interface MissionCardProps {
  challenge: Challenge | null;
  onSkip?: () => void;
  solved?: boolean;
}

export default function MissionCard({
  challenge,
  onSkip,
  solved,
}: MissionCardProps) {
  if (!challenge) return null;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={challenge.id}
        initial={{ opacity: 0, y: -10, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 10, scale: 0.95 }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
        className={`relative flex items-center gap-3 px-4 py-3 rounded-2xl border-2 transition-colors ${
          solved
            ? "bg-emerald-50 border-emerald-300"
            : "bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 border-indigo-200"
        }`}
      >
        {/* Emoji badge */}
        <motion.span
          className="text-2xl shrink-0"
          animate={
            solved
              ? { scale: [1, 1.4, 1], rotate: [0, -15, 15, 0] }
              : { y: [0, -3, 0] }
          }
          transition={
            solved
              ? { type: "tween", duration: 0.5 }
              : { type: "tween", repeat: Infinity, duration: 1.5, ease: "easeInOut" }
          }
        >
          {solved ? "\u2705" : challenge.emoji}
        </motion.span>

        {/* Prompt text (short!) */}
        <div className="flex-1 min-w-0">
          <p
            className={`text-sm font-bold leading-tight ${
              solved ? "text-emerald-700" : "text-gray-800"
            }`}
          >
            {solved ? "Nice job!" : challenge.prompt}
          </p>
          {challenge.type === "share-puzzle" && !solved && (
            <p className="text-[10px] text-gray-400 mt-0.5">
              Drag the right fraction to the left zone
            </p>
          )}
          {solved && (
            <p className="text-[10px] text-emerald-500 font-semibold">
              +{challenge.xpReward} XP
            </p>
          )}
        </div>

        {/* Skip button */}
        {!solved && onSkip && (
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={onSkip}
            className="text-[10px] text-gray-400 hover:text-gray-600 font-medium px-2 py-1 rounded-lg hover:bg-white/60 shrink-0"
          >
            Skip
          </motion.button>
        )}

        {/* +XP reward badge */}
        {!solved && (
          <span className="text-[10px] text-indigo-400 font-bold shrink-0">
            +{challenge.xpReward} XP
          </span>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
