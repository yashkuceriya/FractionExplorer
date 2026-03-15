import { scopedKey } from "./active-student-id";

const BASE_KEY = "voice-character";

export interface VoiceCharacter {
  id: string;
  name: string;
  emoji: string;
  description: string;
  pitch: number;
  rate: number;
  voiceHints: string[]; // preferred Web Speech API voice name fragments
  color?: string;
  elevenLabsVoiceId?: string;
}

export const VOICE_CHARACTERS: VoiceCharacter[] = [
  {
    id: "maya",
    name: "Maya",
    emoji: "👧🏽",
    description: "Your learning buddy!",
    pitch: 1.25,
    rate: 1.0,
    voiceHints: ["Samantha", "Tessa", "Google"],
    color: "#F13EA1",
    elevenLabsVoiceId: "cgSgspJ2msm6clMCkdW9", // Jessica — playful, bright, warm young female
  },
  {
    id: "kai",
    name: "Kai",
    emoji: "👦🏽",
    description: "Science explorer!",
    pitch: 1.1,
    rate: 0.95,
    voiceHints: ["Daniel", "Alex", "Google UK English Male"],
    color: "#0F73B8",
    elevenLabsVoiceId: "TX3LPaxmHKxFdv7VOQHJ", // Liam — energetic, young male
  },
  {
    id: "frax",
    name: "Frax",
    emoji: "\u{1F98A}",
    description: "Your math buddy",
    pitch: 1.15,
    rate: 0.85,
    voiceHints: ["Samantha", "Karen", "Google"],
  },
  {
    id: "luna",
    name: "Luna",
    emoji: "\u{1F9DA}",
    description: "Sparkle fairy",
    pitch: 1.45,
    rate: 0.78,
    voiceHints: ["Samantha", "Tessa", "Google"],
  },
  {
    id: "rex",
    name: "Rex",
    emoji: "\u{1F916}",
    description: "Robot helper",
    pitch: 0.6,
    rate: 0.95,
    voiceHints: ["Daniel", "Alex", "Google UK English Male"],
  },
  {
    id: "pip",
    name: "Pip",
    emoji: "\u{1F42D}",
    description: "Tiny mouse",
    pitch: 1.7,
    rate: 1.05,
    voiceHints: ["Samantha", "Karen", "Google"],
  },
  {
    id: "growl",
    name: "Growl",
    emoji: "\u{1F43B}",
    description: "Friendly bear",
    pitch: 0.4,
    rate: 0.72,
    voiceHints: ["Daniel", "Alex", "Fred"],
  },
];

export function loadSelectedCharacter(): VoiceCharacter {
  try {
    const id = localStorage.getItem(scopedKey(BASE_KEY));
    if (id) {
      const found = VOICE_CHARACTERS.find((c) => c.id === id);
      if (found) return found;
    }
  } catch {
    // ignore
  }
  return VOICE_CHARACTERS[0];
}

export function saveSelectedCharacter(id: string) {
  try {
    localStorage.setItem(scopedKey(BASE_KEY), id);
  } catch {
    // ignore
  }
}
