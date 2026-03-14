"use client";

import { motion } from "framer-motion";

const PHASE_INFO: Record<string, { emoji: string; title: string; summary: string; location: string }> = {
  exploration: {
    emoji: "🌴",
    title: "Fraction Forest!",
    summary: "Let's explore the fraction blocks! Drag them, split them, see what happens!",
    location: "We made it to the forest!",
  },
  discovery: {
    emoji: "🔍",
    title: "Discovery Cave!",
    summary: "Can YOU find two fractions that are the SAME? Drag them to the compare zone!",
    location: "Look! A hidden cave!",
  },
  practice: {
    emoji: "⛰️",
    title: "Merge Mountain!",
    summary: "You found a match! Now split and merge to find MORE equivalent fractions!",
    location: "We're climbing the mountain!",
  },
  assessment: {
    emoji: "🏰",
    title: "Challenge Castle!",
    summary: "The final challenge! Can you find ALL the matching fractions?",
    location: "We made it to the castle!",
  },
  celebration: {
    emoji: "🎉",
    title: "WE DID IT!",
    summary: "What an amazing adventure! You're a fraction pro!",
    location: "Victory!",
  },
};

interface PhaseTransitionCardProps {
  phase: string;
  matchCount?: number;
  onDismiss: () => void;
}

export default function PhaseTransitionCard({
  phase,
  matchCount,
  onDismiss,
}: PhaseTransitionCardProps) {
  const info = PHASE_INFO[phase];

  // No auto-dismiss — kids own the pacing by tapping "Let's GO!"

  if (!info) return null;

  const summary =
    matchCount && matchCount > 0
      ? `You discovered ${matchCount} pair${matchCount !== 1 ? "s" : ""}! ${info.summary}`
      : info.summary;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      <div className="absolute inset-0 bg-black/30" onClick={onDismiss} />
      <motion.div
        initial={{ scale: 0.7, opacity: 0, y: 30 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.8, opacity: 0 }}
        transition={{ type: "spring", stiffness: 400, damping: 20 }}
        className="relative bg-gradient-to-br from-sky-50 via-white to-amber-50 rounded-3xl shadow-2xl p-8 max-w-sm text-center z-10 border-4 border-amber-200/80"
      >
        <motion.div
          animate={{ scale: [1, 1.2, 1], rotate: [0, 5, -5, 0] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="text-5xl mb-2"
        >
          {info.emoji}
        </motion.div>
        <p className="text-xs font-bold text-amber-500 mb-1">{info.location}</p>
        <h2 className="text-xl font-black text-amber-800 mb-2">{info.title}</h2>
        <p className="text-sm text-amber-700/70 mb-5">{summary}</p>
        <motion.button
          onClick={onDismiss}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="px-8 py-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white text-base font-black rounded-2xl shadow-lg shadow-orange-300/40 tracking-wide"
        >
          Let&apos;s GO!
        </motion.button>
      </motion.div>
    </motion.div>
  );
}
