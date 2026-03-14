"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const STEPS = [
  {
    title: "Follow Your Mission!",
    description:
      "Your tutor will give you missions — like splitting a cookie or coloring pizza slices. Just follow along!",
    emoji: "📝",
    hint: "Read the mission card at the top",
    visual: "🍪 → ✂️ → 🎉",
  },
  {
    title: "Tap & Drag",
    description:
      "Tap buttons to split things into pieces, then tap or drag to color them. The tutor will tell you what to do!",
    emoji: "👆",
    hint: "Big colorful buttons = tap me!",
    visual: "🟦🟦⬜⬜ = 2/4",
  },
  {
    title: "Discover Twins!",
    description:
      "Some fractions are secretly the same! 1/2 and 2/4 are twins. You'll discover this by playing!",
    emoji: "🔍",
    hint: "Same amount, different pieces",
    visual: "1/2 = 2/4 🤯",
  },
  {
    title: "Explore Mode",
    description:
      "After missions, switch to Explore to drag fraction blocks, smash them apart, and merge them together!",
    emoji: "🎮",
    hint: "Split, merge, compare — have fun!",
    visual: "💥 🧲 ⚖️",
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
