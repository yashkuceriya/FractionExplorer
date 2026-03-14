"use client";

import { motion } from "framer-motion";
import { BADGE_DEFINITIONS, type Badge } from "@/lib/badges";

interface CompletionScreenProps {
  show: boolean;
  challengesCompleted: number;
  trophyCount: number;
  earnedBadges: string[];
  onRestart: () => void;
  onHome: () => void;
  onNextEpisode?: () => void;
  episodeTitle?: string;
}

export default function CompletionScreen({
  show,
  challengesCompleted,
  trophyCount,
  earnedBadges,
  onRestart,
  onHome,
  onNextEpisode,
  episodeTitle,
}: CompletionScreenProps) {
  if (!show) return null;

  const stars = Math.min(3, challengesCompleted);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-40 bg-gradient-to-br from-indigo-50 via-white to-emerald-50 flex items-center justify-center p-6"
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.2, type: "spring" }}
        className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 text-center"
      >
        {/* Stars */}
        <div className="flex justify-center gap-2 mb-4">
          {[1, 2, 3].map((i) => (
            <motion.span
              key={i}
              initial={{ scale: 0, rotate: -180 }}
              animate={{
                scale: i <= stars ? 1 : 0.5,
                rotate: 0,
                opacity: i <= stars ? 1 : 0.3,
              }}
              transition={{ delay: 0.4 + i * 0.2, type: "spring" }}
              className="text-5xl"
            >
              ⭐
            </motion.span>
          ))}
        </div>

        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="text-2xl font-bold text-gray-800 mb-2"
        >
          {episodeTitle ? `${episodeTitle} Complete!` : "Lesson Complete!"}
        </motion.h2>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="text-gray-500 mb-2"
        >
          You&apos;re a fraction equivalence expert!
        </motion.p>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="bg-indigo-50 rounded-2xl p-4 mb-4"
        >
          <p className="text-sm text-gray-600">
            <span className="font-semibold text-tutor">{challengesCompleted}</span>{" "}
            equivalent fraction{challengesCompleted !== 1 ? "s" : ""} discovered
          </p>
          {trophyCount > 0 && (
            <p className="text-sm text-gray-500 mt-1">
              🏆 {trophyCount} total trophies collected
            </p>
          )}
        </motion.div>

        {/* Badge grid — with names visible */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.3 }}
          className="flex flex-wrap justify-center gap-2 mb-6"
        >
          {BADGE_DEFINITIONS.map((badge: Badge) => {
            const isEarned = earnedBadges.includes(badge.id);
            return (
              <div
                key={badge.id}
                className={`flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-xl border ${
                  isEarned
                    ? "bg-amber-50 border-amber-200"
                    : "bg-gray-50 border-gray-200 opacity-30"
                }`}
              >
                <span className="text-lg">{badge.emoji}</span>
                <span className={`text-[8px] font-bold leading-tight text-center ${isEarned ? "text-amber-700" : "text-gray-400"}`}>
                  {badge.name}
                </span>
              </div>
            );
          })}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.4 }}
          className="flex gap-3"
        >
          <button
            onClick={onRestart}
            className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 font-semibold rounded-xl active:opacity-80"
          >
            Play Again
          </button>
          {onNextEpisode && (
            <button
              onClick={onNextEpisode}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-emerald-400 to-teal-500 text-white font-bold rounded-xl active:opacity-80 min-h-[44px]"
            >
              Next Episode →
            </button>
          )}
          <button
            onClick={onHome}
            className="flex-1 px-4 py-3 bg-gradient-to-r from-tutor to-tutor-dark text-white font-semibold rounded-xl active:opacity-80"
          >
            Home
          </button>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
