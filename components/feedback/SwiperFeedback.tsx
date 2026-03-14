"use client";

import { motion, AnimatePresence } from "framer-motion";

interface SwiperFeedbackProps {
  show: boolean;
  onComplete: () => void;
}

// Warm, genuine — like a friend gently nudging, not a script
const SWIPER_PHRASES = [
  { text: "Hmm, those are different sizes!", emoji: "🤔" },
  { text: "Ooh, sneaky! Those aren't twins.", emoji: "🔍" },
  { text: "Not quite — but you're close!", emoji: "💪" },
  { text: "Those LOOK the same but aren't!", emoji: "😮" },
  { text: "Interesting... try a different one?", emoji: "🌟" },
  { text: "Nope! But I like your thinking.", emoji: "🧠" },
  { text: "Tricky! Wanna try again?", emoji: "🎯" },
  { text: "So close! Keep going!", emoji: "✨" },
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
              You've totally got this!
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
