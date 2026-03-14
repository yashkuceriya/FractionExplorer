"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { VoiceCharacter } from "@/lib/voice-characters";
import { playCharacterIntro } from "@/lib/sounds";

interface VoiceNarratorProps {
  text: string;
  enabled: boolean;
  onToggle: () => void;
  onSpeakingChange?: (speaking: boolean) => void;
  character?: VoiceCharacter | null;
}

/** Convert fraction notation to spoken words for natural TTS */
function fractionsToWords(text: string): string {
  const fractionWords: Record<string, string> = {
    "1/2": "one half",
    "2/2": "two halves",
    "1/3": "one third",
    "2/3": "two thirds",
    "3/3": "three thirds",
    "1/4": "one quarter",
    "2/4": "two quarters",
    "3/4": "three quarters",
    "4/4": "four quarters",
    "1/5": "one fifth",
    "2/5": "two fifths",
    "3/5": "three fifths",
    "4/5": "four fifths",
    "1/6": "one sixth",
    "2/6": "two sixths",
    "3/6": "three sixths",
    "5/6": "five sixths",
    "1/8": "one eighth",
    "2/8": "two eighths",
    "3/8": "three eighths",
    "4/8": "four eighths",
    "5/8": "five eighths",
    "7/8": "seven eighths",
  };

  return text.replace(/\b(\d+)\/(\d+)\b/g, (match) => {
    return fractionWords[match] || match;
  });
}

/** Clean text for speech — remove emojis, brackets, markdown artifacts */
function cleanForSpeech(text: string): string {
  return text
    // Remove emojis
    .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{2700}-\u{27BF}]/gu, "")
    // Remove bracket notation but keep content
    .replace(/\[(\d+\/\d+)\]/g, "$1")
    // Remove markdown bold/italic
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/\*(.+?)\*/g, "$1")
    // Remove tags like [ADVANCE_PHASE] [SWITCH_MODE:xxx]
    .replace(/\[ADVANCE_PHASE\]/g, "")
    .replace(/\[SWITCH_MODE:\w+\]/g, "")
    // Convert fractions to words
    .replace(/\b(\d+)\/(\d+)\b/g, (match) => fractionsToWords(match))
    // Add slight pause after commas and dashes
    .replace(/,\s*/g, ", ... ")
    .replace(/—/g, "... ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Split text into natural speech chunks at sentence boundaries */
function splitSentences(text: string): string[] {
  const raw = text.match(/[^.!?]+[.!?]+[\s]?|[^.!?]+$/g) ?? [text];
  const chunks: string[] = [];
  let buffer = "";
  for (const seg of raw) {
    buffer += seg;
    if (buffer.length >= 50) {
      chunks.push(buffer.trim());
      buffer = "";
    }
  }
  if (buffer.trim()) chunks.push(buffer.trim());
  return chunks;
}

export default function VoiceNarrator({
  text,
  enabled,
  onToggle,
  onSpeakingChange,
  character,
}: VoiceNarratorProps) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [subtitleText, setSubtitleText] = useState("");
  const [subtitleVisible, setSubtitleVisible] = useState(false);
  const lastSpokenRef = useRef("");
  const voicesLoaded = useRef(false);
  const cachedVoice = useRef<SpeechSynthesisVoice | null>(null);
  const lastCharacterId = useRef<string | null>(null);
  const cancelledRef = useRef(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const elevenLabsAvailable = useRef<boolean | null>(null); // null = unknown, true/false = tested

  const updateSpeaking = useCallback(
    (speaking: boolean) => {
      setIsSpeaking(speaking);
      onSpeakingChange?.(speaking);
      if (!speaking) {
        // Hide subtitle after a short delay
        setTimeout(() => setSubtitleVisible(false), 1500);
      }
    },
    [onSpeakingChange]
  );

  /** Find the best matching voice for the character */
  const findVoice = useCallback((): SpeechSynthesisVoice | null => {
    if (typeof window === "undefined" || !window.speechSynthesis) return null;

    const charId = character?.id ?? "frax";
    if (cachedVoice.current && lastCharacterId.current === charId) {
      return cachedVoice.current;
    }

    const voices = window.speechSynthesis.getVoices();
    if (voices.length === 0) return null;

    const hints = character?.voiceHints ?? ["Samantha", "Karen", "Google"];

    // Try exact match first, then partial
    for (const hint of hints) {
      const exact = voices.find((v) => v.name === hint && v.lang.startsWith("en"));
      if (exact) {
        cachedVoice.current = exact;
        lastCharacterId.current = charId;
        return exact;
      }
    }
    for (const hint of hints) {
      const partial = voices.find((v) => v.name.includes(hint) && v.lang.startsWith("en"));
      if (partial) {
        cachedVoice.current = partial;
        lastCharacterId.current = charId;
        return partial;
      }
    }

    // Fallback: first English voice
    const english = voices.find((v) => v.lang.startsWith("en"));
    if (english) {
      cachedVoice.current = english;
      lastCharacterId.current = charId;
      return english;
    }

    return null;
  }, [character]);

  const stopSpeaking = useCallback(() => {
    cancelledRef.current = true;
    lastSpokenRef.current = ""; // Allow re-triggering same message
    // Stop ElevenLabs audio if playing
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
      audioRef.current = null;
    }
    // Stop Web Speech API
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    updateSpeaking(false);
  }, [updateSpeaking]);

  /** Try ElevenLabs TTS, returns true if it handled playback */
  const tryElevenLabs = useCallback(
    async (cleanMessage: string): Promise<boolean> => {
      const voiceId = character?.elevenLabsVoiceId;
      if (!voiceId) return false;
      // Skip if we already know ElevenLabs is unavailable
      if (elevenLabsAvailable.current === false) return false;
      // Cost guard: skip long texts (>300 chars) to save ElevenLabs credits
      if (cleanMessage.length > 300) return false;

      try {
        const res = await fetch("/api/tts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: cleanMessage, voiceId }),
        });

        if (res.status === 501) {
          // No ElevenLabs key configured — remember and skip in future
          elevenLabsAvailable.current = false;
          return false;
        }

        if (!res.ok) return false;

        elevenLabsAvailable.current = true;

        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const audio = new Audio(url);
        audioRef.current = audio;

        audio.onplay = () => updateSpeaking(true);
        audio.onended = () => {
          URL.revokeObjectURL(url);
          audioRef.current = null;
          updateSpeaking(false);
        };
        audio.onerror = () => {
          URL.revokeObjectURL(url);
          audioRef.current = null;
          updateSpeaking(false);
        };

        await audio.play();
        return true;
      } catch {
        return false;
      }
    },
    [character?.elevenLabsVoiceId, updateSpeaking]
  );

  /** Fall back to Web Speech API */
  const speakWebSpeech = useCallback(
    (cleanMessage: string) => {
      const chunks = splitSentences(cleanMessage);
      const voice = findVoice();

      updateSpeaking(true);
      let chunkIndex = 0;
      let keepAlive: ReturnType<typeof setInterval> | null = null;

      function speakNext() {
        if (cancelledRef.current || chunkIndex >= chunks.length) {
          updateSpeaking(false);
          if (keepAlive) clearInterval(keepAlive);
          return;
        }

        const utterance = new SpeechSynthesisUtterance(chunks[chunkIndex]);
        utterance.rate = character?.rate ?? 0.8;
        utterance.pitch = character?.pitch ?? 1.1;
        utterance.volume = 0.9;
        if (voice) utterance.voice = voice;

        utterance.onend = () => {
          chunkIndex++;
          if (cancelledRef.current) {
            updateSpeaking(false);
            if (keepAlive) clearInterval(keepAlive);
            return;
          }
          if (chunkIndex < chunks.length) {
            setTimeout(speakNext, 200);
          } else {
            updateSpeaking(false);
            if (keepAlive) clearInterval(keepAlive);
          }
        };
        utterance.onerror = () => {
          updateSpeaking(false);
          if (keepAlive) clearInterval(keepAlive);
        };

        window.speechSynthesis.speak(utterance);

        if (!keepAlive) {
          keepAlive = setInterval(() => {
            if (window.speechSynthesis.speaking) {
              window.speechSynthesis.pause();
              window.speechSynthesis.resume();
            }
          }, 5000);
        }
      }

      speakNext();
    },
    [updateSpeaking, character, findVoice]
  );

  const speak = useCallback(
    async (message: string) => {
      if (!enabled || !message) return;
      if (typeof window === "undefined") return;

      // Skip if identical to last spoken message
      if (message === lastSpokenRef.current) return;
      lastSpokenRef.current = message;

      // Stop any in-progress speech
      cancelledRef.current = true;
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
        audioRef.current = null;
      }
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }

      // Small delay to let audio system settle
      await new Promise((r) => setTimeout(r, 100));
      cancelledRef.current = false;

      const cleanMessage = cleanForSpeech(message);
      if (!cleanMessage || cancelledRef.current) return;

      // Show subtitle
      const readableText = message
        .replace(/\[(\d+\/\d+)\]/g, "$1")
        .replace(/\[ADVANCE_PHASE\]/g, "")
        .replace(/\[SWITCH_MODE:\w+\]/g, "")
        .trim();
      setSubtitleText(readableText);
      setSubtitleVisible(true);

      // Play character intro sound
      if (character?.id) {
        playCharacterIntro(character.id);
      }

      // Try ElevenLabs first, fall back to Web Speech API
      const handled = await tryElevenLabs(cleanMessage);
      if (!handled && !cancelledRef.current) {
        if (window.speechSynthesis) {
          speakWebSpeech(cleanMessage);
        } else if (process.env.NODE_ENV === "development") {
          console.warn("[VoiceNarrator] No speechSynthesis available");
        }
      }
    },
    [enabled, character, tryElevenLabs, speakWebSpeech]
  );

  // Use ref to avoid useEffect re-firing when speak is recreated
  const speakRef = useRef(speak);
  speakRef.current = speak;

  useEffect(() => {
    if (text && enabled) {
      speakRef.current(text);
    }
  }, [text, enabled]);

  // Load voices + iOS Safari warm-up
  useEffect(() => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;

    // Load voices
    window.speechSynthesis.getVoices();
    window.speechSynthesis.onvoiceschanged = () => {
      voicesLoaded.current = true;
      cachedVoice.current = null;
      window.speechSynthesis.getVoices();
    };

    // iOS Safari requires a user-gesture-triggered utterance to unlock TTS.
    // Also unlock HTMLAudioElement for ElevenLabs playback.
    let unlocked = false;
    function unlockTTS() {
      if (unlocked) return;
      unlocked = true;
      // Unlock Web Speech API
      const warmup = new SpeechSynthesisUtterance("");
      warmup.volume = 0;
      window.speechSynthesis.speak(warmup);
      // Unlock HTMLAudioElement for ElevenLabs
      const silentAudio = new Audio("data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4Ljc2LjEwMAAAAAAAAAAAAAAA//tQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWGluZwAAAA8AAAACAAABhgC7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7//////////////////////////////////////////////////////////////////8AAAAATGF2YzU4LjEzAAAAAAAAAAAAAAAAJAAAAAAAAAAAAYYoRwmHAAAAAAD/+1DEAAAGAANIAAAAACIANICAAAATEEAAEAQBAH/EARC4IA+D4f+sEAQBAEAQBgGP/BB3/8QBDv/+UdxYGf//6gTB8HwfD/lHcWBn////+D4f///KO4sDYPg+D4AAAAAA//tQxBOAAADSAAAAAAAAANIAAAAASZEJJJNBBAATT0RSSU0AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA==");
      silentAudio.volume = 0;
      silentAudio.play().catch(() => {});
      document.removeEventListener("touchstart", unlockTTS);
      document.removeEventListener("click", unlockTTS);
    }
    document.addEventListener("touchstart", unlockTTS, { once: true });
    document.addEventListener("click", unlockTTS, { once: true });

    return () => {
      document.removeEventListener("touchstart", unlockTTS);
      document.removeEventListener("click", unlockTTS);
    };
  }, []);

  // Invalidate cached voice when character changes
  useEffect(() => {
    cachedVoice.current = null;
  }, [character?.id]);

  return (
    <>
      {/* Voice toggle button */}
      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={() => {
          if (isSpeaking) {
            stopSpeaking();
          } else {
            onToggle();
          }
        }}
        className={`flex items-center gap-1.5 px-3 py-2.5 min-h-[44px] min-w-[44px] rounded-xl text-xs font-semibold transition-all ${
          enabled
            ? "bg-tutor/15 text-tutor border border-tutor/20"
            : "bg-gray-100 text-gray-400 border border-gray-200"
        }`}
        title={isSpeaking ? "Stop speaking" : enabled ? "Mute voice" : "Enable voice"}
      >
        {isSpeaking ? (
          <motion.span
            animate={{ scale: [1, 1.3, 1] }}
            transition={{ repeat: Infinity, duration: 0.5 }}
            className="text-sm"
          >
            {character?.emoji ?? "\u{1F50A}"}
          </motion.span>
        ) : enabled ? (
          <span className="text-sm">{character?.emoji ?? "\u{1F50A}"}</span>
        ) : (
          <span className="text-sm">{"\u{1F507}"}</span>
        )}
        <span className="hidden sm:inline">
          {isSpeaking ? "Stop" : enabled ? "Voice On" : "Voice Off"}
        </span>
      </motion.button>

      {/* Subtitle — persistent bottom bar, full text with wrapping */}
      <AnimatePresence>
        {subtitleVisible && subtitleText && enabled && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-2 left-1/2 -translate-x-1/2 z-40 max-w-[90vw] sm:max-w-md"
            onClick={() => setSubtitleVisible(false)}
          >
            <div className="bg-black/70 backdrop-blur-sm text-white text-sm font-medium px-4 py-2 rounded-2xl shadow-lg text-center leading-snug">
              {subtitleText}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
