"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import TutorAvatar from "@/components/chat/TutorAvatar";
import XPBar from "@/components/feedback/XPBar";
import VoiceCharacterPicker from "@/components/voice/VoiceCharacterPicker";
import { loadProgress, LEVEL_NAMES, LEVEL_EMOJIS, xpForNextLevel, MODE_UNLOCK_LEVELS, type PlayerProgress } from "@/lib/progress";
import { loadSelectedCharacter, type VoiceCharacter } from "@/lib/voice-characters";

// Jungle scenery — floating around the edges
const JUNGLE_ITEMS = [
  { text: "🌿", x: 4, y: 8, size: "text-3xl" },
  { text: "🌺", x: 92, y: 12, size: "text-2xl" },
  { text: "🦋", x: 8, y: 85, size: "text-xl" },
  { text: "🌴", x: 88, y: 80, size: "text-3xl" },
  { text: "🦜", x: 85, y: 45, size: "text-2xl" },
  { text: "🌻", x: 12, y: 50, size: "text-xl" },
];

export default function WelcomePage() {
  const router = useRouter();
  const [progress, setProgress] = useState<PlayerProgress | null>(null);
  const [voiceChar, setVoiceChar] = useState<VoiceCharacter | null>(null);

  useEffect(() => {
    setProgress(loadProgress());
    setVoiceChar(loadSelectedCharacter());
  }, []);

  const isReturning = progress && progress.xp > 0;

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center bg-gradient-to-b from-sky-200 via-amber-50 to-emerald-100 p-4 sm:p-6 relative overflow-hidden">
      {/* Jungle scenery */}
      {JUNGLE_ITEMS.map((f, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.25, y: [0, -8, 0] }}
          transition={{
            opacity: { delay: i * 0.2, duration: 0.8 },
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
        {/* Big character — the star of the show */}
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
              className="absolute inset-0 -m-6 rounded-full bg-gradient-to-r from-amber-400/25 via-orange-300/25 to-emerald-400/25 blur-2xl"
            />
            <div className="relative">
              <TutorAvatar size={120} animate characterId={voiceChar?.id} />
            </div>
          </div>
        </motion.div>

        {/* Speech bubble — like Dora talking to camera */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, type: "spring", stiffness: 300 }}
          className="relative inline-block mb-4"
        >
          <div className="bg-white rounded-2xl px-5 py-3 shadow-lg border-2 border-amber-200 relative max-w-[300px] mx-auto">
            <p className="text-sm font-black text-amber-900 leading-snug">
              {isReturning
                ? `You're back! ${LEVEL_EMOJIS[progress.level]} Ready for more fraction adventures?`
                : `Hola! I'm ${voiceChar?.name ?? "Frax"}! Let's go on a fraction adventure together!`
              }
            </p>
            {/* Speech bubble tail */}
            <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white border-l-2 border-t-2 border-amber-200 rotate-45" />
          </div>
        </motion.div>

        {/* Title */}
        <h1 className="text-4xl sm:text-5xl font-black bg-gradient-to-r from-orange-500 via-amber-500 to-emerald-500 bg-clip-text text-transparent mb-0.5 tracking-tight">
          DorFrac
        </h1>
        <p className="text-sm font-black text-amber-600/80 mb-4 tracking-wide">Fraction Adventure!</p>

        {/* Progress for returning players */}
        {isReturning && progress ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mb-4 bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border-2 border-amber-100 p-3"
          >
            <XPBar
              xp={progress.xp}
              level={progress.level}
              dailyXP={progress.dailyXP}
              dailyGoal={progress.dailyGoal}
            />
            <div className="flex items-center justify-center gap-3 mt-2 text-xs">
              {progress.consecutiveDays > 1 && (
                <span className="text-orange-600 font-black">
                  {progress.consecutiveDays} day streak!
                </span>
              )}
              {progress.discoveredEquivalences.length > 0 && (
                <span className="font-black text-emerald-600">
                  {progress.discoveredEquivalences.length} discoveries
                </span>
              )}
            </div>
          </motion.div>
        ) : (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-base text-amber-700/60 mb-5 font-bold"
          >
            Discover fraction twins hiding in the jungle!
          </motion.p>
        )}

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

        {/* Big CTA button — Dora "Let's GO!" energy */}
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => router.push("/lesson")}
          className="px-14 py-4 bg-gradient-to-r from-orange-500 via-amber-500 to-orange-500 text-white text-xl font-black rounded-2xl shadow-xl shadow-orange-400/40 active:shadow-md transition-shadow border-2 border-orange-300/50 tracking-wide"
        >
          {isReturning ? "Vamonos!" : "Let's GO!"}
        </motion.button>

        {/* Mini feature icons */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="mt-5 flex items-center justify-center gap-2.5"
        >
          {[
            { emoji: "🗺️", label: "Map" },
            { emoji: "🎒", label: "Backpack" },
            { emoji: "⚔️", label: "Battle" },
            { emoji: "🤖", label: "AI Buddy" },
          ].map((f) => (
            <span
              key={f.label}
              className="bg-white/60 text-[10px] font-black text-amber-700 px-2 py-1 rounded-full border border-amber-200/60"
            >
              {f.emoji} {f.label}
            </span>
          ))}
        </motion.div>
      </motion.div>
    </div>
  );
}
