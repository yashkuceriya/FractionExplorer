"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import TutorAvatar from "@/components/chat/TutorAvatar";
import XPBar from "@/components/feedback/XPBar";
import VoiceCharacterPicker from "@/components/voice/VoiceCharacterPicker";
import { loadProgress, LEVEL_NAMES, LEVEL_EMOJIS, type PlayerProgress } from "@/lib/progress";
import { loadSelectedCharacter, type VoiceCharacter } from "@/lib/voice-characters";
import { useStudent } from "@/lib/student-context";

const FLOATING_ITEMS = [
  { text: "🌿", x: 4, y: 8, size: "text-3xl" },
  { text: "🌺", x: 92, y: 12, size: "text-2xl" },
  { text: "🦋", x: 8, y: 85, size: "text-xl" },
  { text: "🌴", x: 88, y: 80, size: "text-3xl" },
  { text: "🦜", x: 85, y: 45, size: "text-2xl" },
  { text: "🌻", x: 12, y: 50, size: "text-xl" },
  { text: "🗺️", x: 50, y: 5, size: "text-2xl" },
  { text: "🎒", x: 15, y: 30, size: "text-xl" },
];

export default function WelcomePage() {
  const router = useRouter();
  const { student, isGuest } = useStudent();
  const [progress, setProgress] = useState<PlayerProgress | null>(null);
  const [voiceChar, setVoiceChar] = useState<VoiceCharacter | null>(null);

  useEffect(() => {
    setProgress(loadProgress());
    setVoiceChar(loadSelectedCharacter());
  }, []);

  const isReturning = progress && progress.xp > 0;

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center bg-gradient-to-b from-pink-100 via-purple-50 to-green-100 p-4 sm:p-6 relative overflow-hidden">
      {/* Jungle scenery */}
      {FLOATING_ITEMS.map((f, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.3, y: [0, -8, 0] }}
          transition={{
            opacity: { delay: i * 0.15, duration: 0.8 },
            y: { repeat: Infinity, duration: 3 + i * 0.5, ease: "easeInOut" },
          }}
          className={`absolute ${f.size} pointer-events-none select-none`}
          style={{ left: `${f.x}%`, top: `${f.y}%` }}
        >
          {f.text}
        </motion.span>
      ))}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center max-w-md w-full relative z-10"
      >
        {/* Big character avatar */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.15, type: "spring", stiffness: 200 }}
          className="mx-auto mb-3 relative"
        >
          <div className="relative mx-auto w-fit">
            <motion.div
              animate={{ scale: [1, 1.08, 1] }}
              transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
              className="absolute inset-0 -m-6 rounded-full bg-gradient-to-r from-pink-400/25 via-purple-300/25 to-green-400/25 blur-2xl"
            />
            <div className="relative">
              <TutorAvatar size={120} animate characterId={voiceChar?.id} />
            </div>
          </div>
        </motion.div>

        {/* Speech bubble */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, type: "spring", stiffness: 300 }}
          className="relative inline-block mb-4"
        >
          <div className="bg-white rounded-2xl px-5 py-3 shadow-lg border-2 border-pink-200 relative max-w-[300px] mx-auto">
            <p className="text-sm font-black text-purple-900 leading-snug">
              {student
                ? `Hey ${student.name}! ${LEVEL_EMOJIS[progress?.level ?? 0]} Ready to explore more fractions?`
                : isReturning
                ? `You're back! ${LEVEL_EMOJIS[progress!.level]} Ready to keep exploring?`
                : `Hey! I'm ${voiceChar?.name ?? "Frax"}! Let's explore fractions together!`
              }
            </p>
            <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white border-l-2 border-t-2 border-pink-200 rotate-45" />
          </div>
        </motion.div>

        {/* Title */}
        <h1 className="text-4xl sm:text-5xl font-black bg-gradient-to-r from-pink-500 via-purple-500 to-green-500 bg-clip-text text-transparent mb-0.5 tracking-tight">
          FractionLab
        </h1>
        <p className="text-sm font-black text-purple-500/80 mb-1 tracking-wide">Learn fractions by exploring</p>
        <p className="text-xs text-purple-400/70 mb-4 max-w-[260px] mx-auto leading-relaxed">
          An AI-powered fraction tutor for ages 5-8. Split, merge, compare — discover that 1/2 and 2/4 are the same!
        </p>

        {/* Progress for returning players */}
        {isReturning && progress ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mb-4 bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border-2 border-pink-100 p-3"
          >
            <XPBar
              xp={progress.xp}
              level={progress.level}
              dailyXP={progress.dailyXP}
              dailyGoal={progress.dailyGoal}
            />
            <div className="flex items-center justify-center gap-3 mt-2 text-xs">
              {progress.consecutiveDays > 1 && (
                <span className="text-pink-600 font-black">
                  {progress.consecutiveDays} day streak!
                </span>
              )}
              {progress.discoveredEquivalences.length > 0 && (
                <span className="font-black text-green-600">
                  {progress.discoveredEquivalences.length} discoveries
                </span>
              )}
            </div>
          </motion.div>
        ) : null}

        {/* Voice character picker */}
        {voiceChar && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mb-5"
          >
            <VoiceCharacterPicker
              selected={voiceChar}
              onSelect={setVoiceChar}
            />
          </motion.div>
        )}

        {/* Primary CTA — Start First Lesson */}
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => router.push("/lesson")}
          className="w-full max-w-[300px] px-8 py-4 bg-gradient-to-r from-pink-500 via-purple-500 to-pink-500 text-white text-xl font-black rounded-2xl shadow-xl shadow-pink-400/40 active:shadow-md transition-shadow border-2 border-pink-300/50 tracking-wide"
        >
          {isReturning ? "Continue Learning!" : "Start First Lesson"}
        </motion.button>

        {/* Secondary — Parent Setup */}
        {isGuest && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.65 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => router.push("/signup")}
            className="mt-3 w-full max-w-[300px] px-6 py-3 bg-white/80 backdrop-blur-sm text-purple-600 text-sm font-bold rounded-2xl border-2 border-purple-200 active:bg-purple-50 transition-colors"
          >
            Parent Setup &amp; Progress Tracking
          </motion.button>
        )}

        {/* Feature badges */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="mt-5 flex items-center justify-center gap-2.5 flex-wrap"
        >
          {[
            { emoji: "🗺️", label: "18 Episodes" },
            { emoji: "🏆", label: "Badges & XP" },
            { emoji: "🎤", label: "Voice Tutor" },
            { emoji: "🧩", label: "Manipulatives" },
          ].map((f) => (
            <span
              key={f.label}
              className="bg-white/60 text-[10px] font-black text-purple-700 px-2 py-1 rounded-full border border-purple-200/60"
            >
              {f.emoji} {f.label}
            </span>
          ))}
        </motion.div>

        {/* Guest play note */}
        {isGuest && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.75 }}
            className="mt-3 text-[10px] text-purple-400/60"
          >
            No account needed — guest play works instantly
          </motion.p>
        )}

        {/* Auth links */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-3 flex items-center justify-center gap-3"
        >
          {isGuest ? (
            <button
              onClick={() => router.push("/login")}
              className="text-xs font-bold text-purple-500"
            >
              Parent Login
            </button>
          ) : (
            <>
              <button
                onClick={() => router.push("/pick-student")}
                className="text-xs font-bold text-purple-500"
              >
                Switch Student
              </button>
              <span className="text-purple-300">|</span>
              <button
                onClick={() => router.push("/parent/dashboard")}
                className="text-xs font-bold text-purple-500"
              >
                Parent Dashboard
              </button>
            </>
          )}
        </motion.div>
      </motion.div>
    </div>
  );
}
