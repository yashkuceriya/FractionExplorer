"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  VOICE_CHARACTERS,
  type VoiceCharacter,
  saveSelectedCharacter,
} from "@/lib/voice-characters";

interface VoiceCharacterPickerProps {
  selected: VoiceCharacter;
  onSelect: (character: VoiceCharacter) => void;
  compact?: boolean;
}

export default function VoiceCharacterPicker({
  selected,
  onSelect,
  compact,
}: VoiceCharacterPickerProps) {
  const [open, setOpen] = useState(false);

  function handleSelect(char: VoiceCharacter) {
    onSelect(char);
    saveSelectedCharacter(char.id);
    setOpen(false);
  }

  // Preview: speak a sample line in the character's voice
  function preview(char: VoiceCharacter) {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const lines = [
      `Hi! I'm ${char.name}!`,
      `Let's do fractions!`,
      `Ready to learn?`,
    ];
    const line = lines[Math.floor(Math.random() * lines.length)];
    const u = new SpeechSynthesisUtterance(line);
    u.pitch = char.pitch;
    u.rate = char.rate;
    u.volume = 0.9;
    const voices = window.speechSynthesis.getVoices();
    const preferred = voices.find((v) =>
      char.voiceHints.some((h) => v.name.includes(h))
    );
    if (preferred) u.voice = preferred;
    window.speechSynthesis.speak(u);
  }

  // Compact mode: small button in top bar, tap to expand dropdown
  if (compact) {
    return (
      <div className="relative">
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => setOpen(!open)}
          className="text-base px-1.5 py-0.5 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
          title={`Voice: ${selected.name}`}
        >
          {selected.emoji}
        </motion.button>

        <AnimatePresence>
          {open && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setOpen(false)}
                className="fixed inset-0 z-30"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: -5 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: -5 }}
                className="absolute top-full right-0 mt-1 z-40 bg-white rounded-2xl shadow-xl border border-gray-100 p-2 flex gap-1"
              >
                {VOICE_CHARACTERS.map((char) => (
                  <motion.button
                    key={char.id}
                    whileTap={{ scale: 0.85 }}
                    onClick={() => {
                      preview(char);
                      handleSelect(char);
                    }}
                    className={`flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-xl transition-colors min-w-[52px] ${
                      selected.id === char.id
                        ? "bg-indigo-100 ring-2 ring-indigo-400"
                        : "hover:bg-gray-50 active:bg-gray-100"
                    }`}
                  >
                    <span className="text-xl">{char.emoji}</span>
                    <span className="text-[8px] font-semibold text-gray-500">
                      {char.name}
                    </span>
                  </motion.button>
                ))}
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // Full picker (for welcome page)
  return (
    <div className="flex flex-col items-center gap-3">
      <p className="text-xs font-semibold text-gray-500">
        Choose your narrator
      </p>
      <div className="flex gap-2 flex-wrap justify-center">
        {VOICE_CHARACTERS.map((char) => (
          <motion.button
            key={char.id}
            whileHover={{ scale: 1.06 }}
            whileTap={{ scale: 0.92 }}
            onClick={() => {
              preview(char);
              handleSelect(char);
            }}
            className={`flex flex-col items-center gap-1 px-4 py-3 rounded-2xl transition-all ${
              selected.id === char.id
                ? "bg-indigo-100 ring-2 ring-indigo-400 shadow-md"
                : "bg-white border border-gray-200 hover:border-indigo-200"
            }`}
          >
            <motion.span
              className="text-3xl"
              animate={
                selected.id === char.id ? { scale: [1, 1.15, 1] } : {}
              }
              transition={{ repeat: Infinity, duration: 1.5 }}
            >
              {char.emoji}
            </motion.span>
            <span className="text-xs font-bold text-gray-700">
              {char.name}
            </span>
            <span className="text-[9px] text-gray-400">
              {char.description}
            </span>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
