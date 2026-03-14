"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface SwiperChallengeProps {
  show: boolean;
  timeLimit?: number;
  onSuccess: () => void;
  onFail: () => void;
  onComplete: () => void;
}

const CONFETTI_COLORS = [
  "#6366f1",
  "#ef4444",
  "#3b82f6",
  "#f59e0b",
  "#10b981",
  "#ec4899",
  "#8b5cf6",
  "#06b6d4",
  "#f97316",
];

const BUTTONS = [
  { label: "Swiper!", index: 0 },
  { label: "No!", index: 1 },
  { label: "Swiping!", index: 2 },
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

type Phase = "entering" | "active" | "success" | "fail" | "exiting";

export default function SwiperChallenge({
  show,
  timeLimit = 12,
  onSuccess,
  onFail,
  onComplete,
}: SwiperChallengeProps) {
  const [phase, setPhase] = useState<Phase>("entering");
  const [activeIndex, setActiveIndex] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(timeLimit);
  const [confetti, setConfetti] = useState<
    { id: number; delay: number; color: string }[]
  >([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const hasCompletedRef = useRef(false);

  // Reset state when show changes
  useEffect(() => {
    if (show) {
      hasCompletedRef.current = false;
      setPhase("entering");
      setActiveIndex(0);
      setTimeRemaining(timeLimit);
      setConfetti([]);

      // Transition to active after entrance animation
      const enterTimer = setTimeout(() => {
        setPhase("active");
      }, 800);
      return () => clearTimeout(enterTimer);
    }
  }, [show, timeLimit]);

  // Countdown timer during active phase
  useEffect(() => {
    if (phase !== "active") return;

    const endTime = Date.now() + timeLimit * 1000;

    timerRef.current = setInterval(() => {
      const now = Date.now();
      const remaining = Math.max(0, (endTime - now) / 1000);
      setTimeRemaining(remaining);

      if (remaining <= 0) {
        if (timerRef.current) clearInterval(timerRef.current);
        setPhase("fail");
      }
    }, 50);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  // Handle outcome phases
  useEffect(() => {
    if (phase === "success") {
      onSuccess();
      const count =
        typeof window !== "undefined" && "ontouchstart" in window ? 25 : 40;
      setConfetti(
        Array.from({ length: count }, (_, i) => ({
          id: i,
          delay: Math.random() * 0.4,
          color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
        }))
      );
      const timer = setTimeout(() => setPhase("exiting"), 2000);
      return () => clearTimeout(timer);
    }
    if (phase === "fail") {
      onFail();
      const timer = setTimeout(() => setPhase("exiting"), 2000);
      return () => clearTimeout(timer);
    }
    if (phase === "exiting") {
      const timer = setTimeout(() => {
        if (!hasCompletedRef.current) {
          hasCompletedRef.current = true;
          onComplete();
        }
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [phase, onSuccess, onFail, onComplete]);

  const handleTap = useCallback(
    (index: number) => {
      if (phase !== "active") return;
      if (index !== activeIndex) return;

      const next = activeIndex + 1;
      if (next >= BUTTONS.length) {
        if (timerRef.current) clearInterval(timerRef.current);
        setActiveIndex(next);
        setPhase("success");
      } else {
        setActiveIndex(next);
      }
    },
    [phase, activeIndex]
  );

  const timerFraction = timeRemaining / timeLimit;

  return (
    <AnimatePresence>
      {show && phase !== "exiting" && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden"
          style={{ backdropFilter: "blur(4px)" }}
        >
          {/* Dark overlay */}
          <div className="absolute inset-0 bg-black/60" />

          {/* Timer bar */}
          {phase === "active" && (
            <div className="absolute top-0 left-0 right-0 h-2 z-10">
              <motion.div
                className="h-full rounded-r-full"
                style={{
                  width: `${timerFraction * 100}%`,
                  background:
                    timerFraction > 0.5
                      ? "linear-gradient(90deg, #ec4899, #f472b6)"
                      : timerFraction > 0.25
                        ? "linear-gradient(90deg, #ef4444, #ec4899)"
                        : "linear-gradient(90deg, #dc2626, #ef4444)",
                }}
                transition={{ duration: 0.05 }}
              />
            </div>
          )}

          {/* Confetti on success */}
          {confetti.map((piece) => (
            <ConfettiPiece
              key={piece.id}
              delay={piece.delay}
              color={piece.color}
            />
          ))}

          {/* Swiper fox */}
          <motion.div
            initial={{ x: "100vw", rotate: -10 }}
            animate={
              phase === "success"
                ? { x: "100vw", rotate: 20, transition: { duration: 0.6, ease: "easeIn" } }
                : phase === "fail"
                  ? { x: "-100vw", rotate: -20, transition: { duration: 0.8, ease: "easeIn" } }
                  : { x: 0, rotate: 0, transition: { type: "spring", stiffness: 200, damping: 20 } }
            }
            className="relative z-10 mb-4"
          >
            {/* Fox with blue mask */}
            <div className="relative inline-block">
              <span className="text-[80px] sm:text-[100px] leading-none select-none">
                🦊
              </span>
              {/* Blue mask strip across eyes */}
              <div
                className="absolute rounded-full"
                style={{
                  top: "28%",
                  left: "15%",
                  right: "15%",
                  height: "16%",
                  background: "linear-gradient(90deg, #3b82f6, #2563eb)",
                  opacity: 0.85,
                  borderRadius: "999px",
                }}
              />
            </div>

            {/* Outcome text */}
            <AnimatePresence>
              {phase === "success" && (
                <motion.p
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{
                    opacity: 1,
                    scale: [0, 1.3, 1],
                    rotate: [0, -8, 5, -3, 0],
                    y: [0, -6, 0],
                  }}
                  transition={{
                    duration: 0.6,
                    y: { repeat: Infinity, duration: 0.5, ease: "easeInOut" },
                  }}
                  className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap text-2xl sm:text-3xl font-black text-yellow-300 drop-shadow-lg"
                  style={{
                    fontStyle: "italic",
                    textShadow: "2px 2px 0 #000, -1px -1px 0 #000",
                    transform: "rotate(-6deg) translateX(-50%)",
                  }}
                >
                  Oh, maaaan!
                </motion.p>
              )}
              {phase === "fail" && (
                <motion.p
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: [0, 1.2, 1] }}
                  className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap text-2xl sm:text-3xl font-black text-red-400 drop-shadow-lg"
                  style={{
                    fontStyle: "italic",
                    textShadow: "2px 2px 0 #000, -1px -1px 0 #000",
                  }}
                >
                  Ha ha!
                </motion.p>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Prompt text */}
          {(phase === "entering" || phase === "active") && (
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="relative z-10 text-lg sm:text-xl font-bold text-white text-center mb-6 px-4"
              style={{ textShadow: "1px 1px 3px rgba(0,0,0,0.5)" }}
            >
              Oh no, it&apos;s Swiper! Tap to say...
            </motion.p>
          )}

          {/* Fail subtext */}
          {phase === "fail" && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="relative z-10 text-base sm:text-lg font-bold text-white/80 text-center mb-4 px-4"
            >
              Ooh, he was too fast! But don&apos;t worry — you&apos;ll get him next time!
            </motion.p>
          )}

          {/* Tap buttons */}
          {(phase === "entering" || phase === "active" || phase === "success") && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="relative z-10 flex gap-3 sm:gap-5 px-4"
            >
              {BUTTONS.map((btn) => {
                const isCompleted = btn.index < activeIndex;
                const isActive = btn.index === activeIndex && phase === "active";
                const isWaiting = btn.index > activeIndex || phase === "entering";

                return (
                  <motion.button
                    key={btn.index}
                    onClick={() => handleTap(btn.index)}
                    whileTap={isActive ? { scale: 0.9 } : {}}
                    animate={
                      isActive
                        ? {
                            scale: [1, 1.08, 1],
                            transition: { repeat: Infinity, duration: 0.7 },
                          }
                        : { scale: 1 }
                    }
                    disabled={!isActive}
                    className={`
                      min-h-[60px] px-5 sm:px-7 rounded-2xl text-lg sm:text-xl font-black
                      shadow-lg border-2 transition-colors duration-200 select-none
                      ${
                        isCompleted
                          ? "bg-gradient-to-b from-emerald-400 to-emerald-600 border-emerald-300 text-white"
                          : isActive
                            ? "bg-gradient-to-b from-pink-400 to-purple-600 border-pink-300 text-white cursor-pointer"
                            : "bg-gray-500/60 border-gray-400/40 text-gray-300 cursor-default"
                      }
                    `}
                  >
                    {isCompleted ? "\u2713" : btn.label}
                  </motion.button>
                );
              })}
            </motion.div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
