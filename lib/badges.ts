import { scopedKey } from "./active-student-id";

const BASE_KEY = "earned-badges";

export interface Badge {
  id: string;
  name: string;
  emoji: string;
  description: string;
}

export const BADGE_DEFINITIONS: Badge[] = [
  { id: "first-match", name: "First Match", emoji: "🎯", description: "Find your first equivalent pair" },
  { id: "smash-master", name: "Smash Master", emoji: "💥", description: "Smash 5 fractions" },
  { id: "collector", name: "Collector", emoji: "🏆", description: "Discover 5 unique pairs" },
  { id: "hot-streak", name: "Hot Streak", emoji: "🔥", description: "3 correct matches in a row" },
  { id: "explorer", name: "Explorer", emoji: "🧪", description: "Use smash 3 times and merge 3 times" },
];

export interface StudentStats {
  matches: number;
  smashes: number;
  merges: number;
  streak: number;
  uniquePairs: number;
}

export function loadEarnedBadges(): string[] {
  try {
    const raw = localStorage.getItem(scopedKey(BASE_KEY));
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function saveEarnedBadges(ids: string[]) {
  try {
    localStorage.setItem(scopedKey(BASE_KEY), JSON.stringify(ids));
  } catch {
    // ignore
  }
}

export function checkNewBadges(stats: StudentStats, earned: string[]): string[] {
  const newBadges: string[] = [];

  if (!earned.includes("first-match") && stats.matches >= 1) {
    newBadges.push("first-match");
  }
  if (!earned.includes("smash-master") && stats.smashes >= 5) {
    newBadges.push("smash-master");
  }
  if (!earned.includes("collector") && stats.uniquePairs >= 5) {
    newBadges.push("collector");
  }
  if (!earned.includes("hot-streak") && stats.streak >= 3) {
    newBadges.push("hot-streak");
  }
  if (!earned.includes("explorer") && stats.smashes >= 3 && stats.merges >= 3) {
    newBadges.push("explorer");
  }

  if (newBadges.length > 0) {
    saveEarnedBadges([...earned, ...newBadges]);
  }

  return newBadges;
}
