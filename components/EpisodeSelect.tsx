"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { CURRICULUM, Episode } from "@/lib/curriculum";
import { isEpisodeUnlocked, loadMastery } from "@/lib/mastery";

interface EpisodeSelectProps {
  onSelect: (episode: Episode) => void;
  onBack?: () => void;
}

export default function EpisodeSelect({ onSelect, onBack }: EpisodeSelectProps) {
  const [completedEpisodes, setCompletedEpisodes] = useState<number[]>([]);
  const [currentEpisode, setCurrentEpisode] = useState(1);

  useEffect(() => {
    const mastery = loadMastery();
    setCompletedEpisodes(mastery.completedEpisodes);
    setCurrentEpisode(mastery.currentEpisode);
  }, []);

  const completedCount = completedEpisodes.length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F13EA1]/10 via-white to-[#844CA4]/10 px-4 py-6 pb-24">
      {/* Back button */}
      {onBack && (
        <button
          onClick={onBack}
          className="mb-3 px-3 py-2 text-sm text-pink-500 font-bold active:text-pink-700"
        >
          ← Back
        </button>
      )}

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-6"
      >
        <h1 className="text-3xl font-extrabold bg-gradient-to-r from-[#F13EA1] to-[#844CA4] bg-clip-text text-transparent">
          Choose Your Adventure!
        </h1>
        <p className="text-sm text-gray-500 mt-1">DorFrac Fraction Quest</p>
      </motion.div>

      {/* Progress bar */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
        className="max-w-md mx-auto mb-8"
      >
        <div className="flex items-center justify-between text-sm font-medium text-gray-600 mb-1.5">
          <span>{completedCount} / {CURRICULUM.length} episodes completed</span>
          <span>{Math.round((completedCount / CURRICULUM.length) * 100)}%</span>
        </div>
        <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${(completedCount / CURRICULUM.length) * 100}%` }}
            transition={{ delay: 0.3, duration: 0.6, ease: "easeOut" }}
            className="h-full rounded-full bg-gradient-to-r from-[#F13EA1] to-[#844CA4]"
          />
        </div>
      </motion.div>

      {/* Episode grid */}
      <div className="max-w-2xl mx-auto grid grid-cols-1 sm:grid-cols-2 gap-4">
        {CURRICULUM.map((episode, index) => {
          const unlocked = isEpisodeUnlocked(episode.id);
          const completed = completedEpisodes.includes(episode.id);
          const isCurrent = episode.id === currentEpisode && !completed;

          return (
            <motion.button
              key={episode.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 * index, duration: 0.3 }}
              disabled={!unlocked}
              onClick={() => unlocked && onSelect(episode)}
              className={`
                relative text-left rounded-2xl p-4 min-h-[120px]
                transition-shadow duration-200
                ${unlocked ? "cursor-pointer active:scale-[0.97]" : "cursor-not-allowed opacity-50"}
                ${isCurrent
                  ? "bg-white ring-2 ring-[#F13EA1] shadow-lg shadow-[#F13EA1]/20"
                  : completed
                    ? "bg-white/80 ring-1 ring-emerald-300"
                    : "bg-white/60 ring-1 ring-gray-200"
                }
              `}
              style={{ minHeight: 44 }}
            >
              {/* Status badge */}
              {completed && (
                <span className="absolute top-3 right-3 w-6 h-6 flex items-center justify-center bg-emerald-500 text-white rounded-full text-xs">
                  ✓
                </span>
              )}
              {!unlocked && (
                <span className="absolute top-3 right-3 w-6 h-6 flex items-center justify-center bg-gray-400 text-white rounded-full text-xs">
                  🔒
                </span>
              )}
              {isCurrent && (
                <span className="absolute top-3 right-3 px-2 py-0.5 bg-[#F13EA1] text-white rounded-full text-[10px] font-bold uppercase tracking-wide">
                  Next
                </span>
              )}

              {/* Episode number + emoji */}
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-2xl">{episode.emoji}</span>
                <span className="text-xs font-semibold text-gray-400">
                  Ep {episode.id}
                </span>
              </div>

              {/* Title & subtitle */}
              <h3 className="text-sm font-bold text-gray-800 leading-tight">
                {episode.title}
              </h3>
              <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">
                {episode.subtitle}
              </p>

              {/* Skill tags + grade */}
              <div className="flex flex-wrap items-center gap-1 mt-2">
                {episode.skills.slice(0, 3).map((skill) => (
                  <span
                    key={skill}
                    className="px-1.5 py-0.5 text-[10px] font-medium rounded-full bg-[#844CA4]/10 text-[#844CA4]"
                  >
                    {skill.replace(/-/g, " ")}
                  </span>
                ))}
                <span className="ml-auto text-[10px] text-gray-400 font-medium">
                  {episode.gradeLevel}
                </span>
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
