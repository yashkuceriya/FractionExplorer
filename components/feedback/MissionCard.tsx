"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Challenge } from "@/lib/challenges";

interface MissionCardProps {
  challenge: Challenge | null;
  onSkip?: () => void;
  onSolve?: (challenge: Challenge) => void;
  solved?: boolean;
}

export default function MissionCard({
  challenge,
  onSkip,
  onSolve,
  solved,
}: MissionCardProps) {
  const [wrongTap, setWrongTap] = useState<number | null>(null);

  if (!challenge) return null;

  // For compare-bigger: show two fraction buttons
  const isCompare = challenge.type === "compare-bigger" && !solved;
  // For missing-number: show number choices
  const isMissing = challenge.type === "missing-number" && !solved;

  // Parse fractions from compare prompt: "Which is bigger: 2/4 or 1/2?"
  let compareFracs: { n: number; d: number }[] = [];
  if (isCompare) {
    const matches = challenge.prompt.match(/(\d+)\/(\d+)/g);
    if (matches && matches.length >= 2) {
      compareFracs = matches.map((m) => {
        const [n, d] = m.split("/").map(Number);
        return { n, d };
      });
    }
  }

  // Generate choices for missing-number (stable across re-renders)
  const missingChoices = useMemo(() => {
    if (!isMissing || !challenge?.answer) return [];
    const correct = challenge.answer.n;
    const choices = new Set<number>([correct]);
    if (correct > 1) choices.add(correct - 1);
    choices.add(correct + 1);
    if (correct > 2) choices.add(correct - 2);
    choices.add(correct + 2);
    return Array.from(choices).slice(0, 4).sort(() => Math.random() - 0.5);
  }, [isMissing, challenge?.answer?.n, challenge?.answer?.d]);

  function handleCompareTap(frac: { n: number; d: number }, index: number) {
    if (!challenge || !challenge.answer) return;
    const correct =
      frac.n * challenge.answer.d === challenge.answer.n * frac.d;
    if (correct) {
      onSolve?.(challenge);
    } else {
      setWrongTap(index);
      setTimeout(() => setWrongTap(null), 600);
    }
  }

  function handleMissingTap(num: number, index: number) {
    if (!challenge || !challenge.answer) return;
    if (num === challenge.answer.n) {
      onSolve?.(challenge);
    } else {
      setWrongTap(index);
      setTimeout(() => setWrongTap(null), 600);
    }
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={challenge.id}
        initial={{ opacity: 0, y: -10, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 10, scale: 0.95 }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
        className={`relative flex flex-col gap-1.5 px-4 py-2.5 rounded-2xl border-2 transition-colors ${
          solved
            ? "bg-emerald-50 border-emerald-300"
            : "bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 border-indigo-200"
        }`}
      >
        <div className="flex items-center gap-3">
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

          {/* Prompt text */}
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
            {challenge.type === "find-equivalent" && !solved && (
              <p className="text-[10px] text-gray-400 mt-0.5">
                Find and compare equivalent fractions below
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
        </div>

        {/* Compare-bigger: tappable fraction buttons */}
        {isCompare && compareFracs.length >= 2 && (
          <div className="flex items-center gap-2 ml-9">
            {compareFracs.map((frac, i) => (
              <motion.button
                key={i}
                whileTap={{ scale: 0.9 }}
                animate={wrongTap === i ? { x: [-4, 4, -4, 4, 0] } : {}}
                transition={wrongTap === i ? { duration: 0.3 } : {}}
                onClick={() => handleCompareTap(frac, i)}
                className={`px-4 py-2 rounded-xl text-sm font-black border-2 transition-all active:scale-95 ${
                  wrongTap === i
                    ? "bg-red-50 border-red-300 text-red-600"
                    : "bg-white border-purple-200 text-purple-800 hover:border-pink-400 hover:bg-pink-50"
                }`}
              >
                {frac.n}/{frac.d}
              </motion.button>
            ))}
          </div>
        )}

        {/* Missing-number: tappable number choices */}
        {isMissing && missingChoices.length > 0 && (
          <div className="flex items-center gap-2 ml-9">
            {missingChoices.map((num, i) => (
              <motion.button
                key={i}
                whileTap={{ scale: 0.9 }}
                animate={wrongTap === i ? { x: [-4, 4, -4, 4, 0] } : {}}
                transition={wrongTap === i ? { duration: 0.3 } : {}}
                onClick={() => handleMissingTap(num, i)}
                className={`w-12 h-12 rounded-xl text-sm font-black border-2 transition-all active:scale-95 ${
                  wrongTap === i
                    ? "bg-red-50 border-red-300 text-red-600"
                    : "bg-white border-purple-200 text-purple-800 hover:border-pink-400 hover:bg-pink-50"
                }`}
              >
                {num}
              </motion.button>
            ))}
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
