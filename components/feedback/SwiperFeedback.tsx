"use client";

import { motion, AnimatePresence } from "framer-motion";

interface SwiperFeedbackProps {
  show: boolean;
  onComplete: () => void;
}

// Never say "wrong" — always encouraging, Dora-style warm redirects
const SWIPER_PHRASES = [
  { text: "Different sizes! Let's keep looking!", emoji: "🤔" },
  { text: "Good try! I think there's a better match!", emoji: "💪" },
  { text: "Ooh so close! Try another one!", emoji: "🔍" },
  { text: "Not quite twins! But we'll find them!", emoji: "🌟" },
  { text: "Interesting! Those are different. What else can we try?", emoji: "🧐" },
  { text: "Almost! Don't give up — explorers never give up!", emoji: "🗺️" },
];

export default function SwiperFeedback({ show, onComplete }: SwiperFeedbackProps) {
  const phrase = SWIPER_PHRASES[Math.floor(Math.random() * SWIPER_PHRASES.length)];

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, scale: 0.5, x: "-50%", y: "-50%" }}
          animate={{ opacity: 1, scale: [0.5, 1.15, 1], x: "-50%", y: "-50%" }}
          exit={{ opacity: 0, scale: 0.8, x: "-50%", y: "-50%" }}
          transition={{ duration: 0.4 }}
          onAnimationComplete={() => {
            setTimeout(onComplete, 1200);
          }}
          className="fixed top-1/2 left-1/2 z-50 pointer-events-none"
        >
          <div className="bg-white rounded-3xl px-8 py-5 shadow-2xl text-center border-4 border-amber-300/80 max-w-[280px]">
            <motion.p
              animate={{ rotate: [0, -10, 10, -5, 0] }}
              transition={{ duration: 0.5 }}
              className="text-4xl mb-2"
            >
              {phrase.emoji}
            </motion.p>
            <p className="text-base sm:text-lg font-black text-amber-800">
              {phrase.text}
            </p>
            <p className="text-xs font-bold text-amber-500 mt-1.5">
              You've got this, explorer!
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
