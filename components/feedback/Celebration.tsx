"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface CelebrationProps {
  show: boolean;
  onComplete?: () => void;
}

const CONFETTI_COLORS = ["#6366f1", "#ef4444", "#3b82f6", "#f59e0b", "#10b981", "#ec4899", "#8b5cf6", "#06b6d4", "#f97316"];

const CELEBRATION_PHRASES = [
  "WE DID IT! 🎉",
  "YOU FOUND IT! ⭐",
  "AMAZING! 🌟",
  "EXCELLENT! 🤩",
  "HIGH FIVE! ✋",
  "WOW WOW WOW! 🎊",
];

function ConfettiPiece({ delay, color }: { delay: number; color: string }) {
  const left = Math.random() * 100;
  const size = 6 + Math.random() * 10;
  const duration = 1.5 + Math.random() * 1.5;
  const shape = Math.random();

  return (
    <motion.div
      initial={{ y: -20, x: 0, opacity: 1, rotate: 0, scale: 0 }}
      animate={{
        y: "100vh",
        x: (Math.random() - 0.5) * 250,
        opacity: [1, 1, 0],
        rotate: Math.random() * 1080,
        scale: [0, 1.2, 1],
      }}
      transition={{ duration, delay, ease: "easeIn" }}
      style={{
        position: "absolute",
        left: `${left}%`,
        top: 0,
        width: size,
        height: shape > 0.6 ? size : size * 0.5,
        backgroundColor: color,
        borderRadius: shape > 0.3 ? "50%" : "2px",
      }}
    />
  );
}

export default function Celebration({ show, onComplete }: CelebrationProps) {
  const [pieces, setPieces] = useState<{ id: number; delay: number; color: string }[]>([]);
  const [phrase] = useState(() => CELEBRATION_PHRASES[Math.floor(Math.random() * CELEBRATION_PHRASES.length)]);

  useEffect(() => {
    if (show) {
      const count = typeof window !== "undefined" && "ontouchstart" in window ? 25 : 50;
      const newPieces = Array.from({ length: count }, (_, i) => ({
        id: i,
        delay: Math.random() * 0.5,
        color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
      }));
      setPieces(newPieces);

      const timer = setTimeout(() => {
        onComplete?.();
      }, 2500);
      return () => clearTimeout(timer);
    } else {
      setPieces([]);
    }
  }, [show, onComplete]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 pointer-events-none z-50 overflow-hidden"
        >
          {pieces.map((piece) => (
            <ConfettiPiece key={piece.id} delay={piece.delay} color={piece.color} />
          ))}
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: [0, 1.2, 1], opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 15 }}
            className="absolute inset-0 flex items-center justify-center"
          >
            <div className="bg-gradient-to-br from-amber-400 via-yellow-300 to-orange-400 rounded-3xl px-8 py-6 shadow-2xl shadow-amber-500/30 text-center border-4 border-white/60">
              {/* Dancing stars */}
              <div className="flex justify-center gap-2 mb-2">
                {["⭐", "🌟", "⭐"].map((star, i) => (
                  <motion.span
                    key={i}
                    animate={{ y: [0, -8, 0], rotate: [0, 20, -20, 0] }}
                    transition={{ repeat: Infinity, duration: 0.6, delay: i * 0.15 }}
                    className="text-2xl"
                  >
                    {star}
                  </motion.span>
                ))}
              </div>

              <motion.p
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ repeat: Infinity, duration: 0.8 }}
                className="text-2xl sm:text-3xl font-black text-white drop-shadow-md"
              >
                {phrase}
              </motion.p>

              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="text-sm font-bold text-white/80 mt-2"
              >
                Fraction match found!
              </motion.p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
