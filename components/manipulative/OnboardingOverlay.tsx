"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const STEPS = [
  {
    title: "Drag to Compare",
    description:
      "Pick up any fraction block and drop it into the left or right comparison zone to see if two fractions are equal!",
    emoji: "👆",
    hint: "Try 1/2 on the left and 2/4 on the right",
    visual: "⚖️",
  },
  {
    title: "Tap to Split",
    description:
      "See a fraction like 2/4 or 3/6? Tap it to smash it into smaller equal pieces and see what it's made of!",
    emoji: "💥",
    hint: "Tap any block with a 💥 badge",
    visual: "2/4 → 1/4 + 1/4",
  },
  {
    title: "Drag to Merge",
    description:
      "Drag one fraction block onto another to combine them — works even with different denominators like 1/2 and 1/4!",
    emoji: "🧲",
    hint: "Or use the green + button",
    visual: "1/4 + 1/4 = 2/4",
  },
  {
    title: "Try Other Activities",
    description:
      "Switch tabs below the blocks to try Pizza Party, Fraction Battle, Tower Builder, and more!",
    emoji: "🎮",
    hint: "Each one teaches fractions in a fun way",
    visual: "🍕 ⚔️ 🏗️ 🍳",
  },
];

interface OnboardingOverlayProps {
  onComplete: () => void;
}

export default function OnboardingOverlay({ onComplete }: OnboardingOverlayProps) {
  const [step, setStep] = useState(0);

  const handleNext = () => {
    if (step < STEPS.length - 1) {
      setStep(step + 1);
    } else {
      onComplete();
    }
  };

  const handleSkip = () => {
    onComplete();
  };

  const current = STEPS[step];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center"
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      {/* Card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: -20 }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
          className="relative bg-white rounded-3xl shadow-2xl p-8 max-w-sm mx-4 text-center z-10"
        >
          {/* Animated emoji */}
          <motion.div
            animate={{ y: [0, -8, 0] }}
            transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
            className="text-5xl mb-3"
          >
            {current.emoji}
          </motion.div>

          <h2 className="text-xl font-bold text-gray-800 mb-2">
            {current.title}
          </h2>
          <p className="text-sm text-gray-500 mb-3 leading-relaxed">
            {current.description}
          </p>

          {/* Visual example */}
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-3 py-2.5 px-4 bg-indigo-50 rounded-xl border border-indigo-100"
          >
            <span className="text-lg font-bold text-indigo-500 tracking-wide">
              {current.visual}
            </span>
          </motion.div>

          {/* Hint text */}
          <p className="text-xs text-gray-400 italic mb-5">
            {current.hint}
          </p>

          {/* Step dots */}
          <div className="flex justify-center gap-2 mb-5">
            {STEPS.map((_, i) => (
              <motion.div
                key={i}
                animate={{
                  scale: i === step ? 1.3 : 1,
                  backgroundColor: i === step ? "#6366f1" : i < step ? "#a5b4fc" : "#e5e7eb",
                }}
                transition={{ type: "spring", stiffness: 400, damping: 20 }}
                className="w-2.5 h-2.5 rounded-full"
              />
            ))}
          </div>

          {/* Buttons */}
          <div className="flex gap-3">
            <button
              onClick={handleSkip}
              className="flex-1 px-4 py-3 min-h-[44px] text-sm text-gray-400 hover:text-gray-600 active:text-gray-700 transition-colors rounded-xl"
            >
              Skip
            </button>
            <motion.button
              onClick={handleNext}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="flex-1 px-4 py-3 min-h-[44px] bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-sm font-semibold rounded-xl shadow-md shadow-indigo-200/50"
            >
              {step < STEPS.length - 1 ? "Next →" : "Let's go! 🚀"}
            </motion.button>
          </div>
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
}
