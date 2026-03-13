import { scopedKey } from "./active-student-id";

const BASE_KEY = "player-progress";

export interface PlayerProgress {
  xp: number;
  level: number;
  masteryLevel: number;
  unlockedModes: string[];
  dailyXP: number;
  dailyGoal: number;
  lastSessionDate: string;
  consecutiveDays: number;
  lifetimeMatches: number;
  lifetimeSmashes: number;
  lifetimeMerges: number;
  discoveredEquivalences: string[];
}

// Level thresholds: index = level, value = XP needed
// Kept low so kids unlock new modes quickly and don't feel stuck
const LEVEL_THRESHOLDS = [0, 5, 15, 30, 50, 80];

export const LEVEL_NAMES = [
  "Beginner",
  "Apprentice",
  "Explorer",
  "Builder",
  "Expert",
  "Master",
];

export const LEVEL_EMOJIS = ["🌱", "🌿", "🧭", "🏗️", "⭐", "👑"];

// Modes unlock at these levels
export const MODE_UNLOCK_LEVELS: Record<string, number> = {
  compare: 0,
  battle: 1,
  tower: 2,
  recipe: 3,
  pizza: 4,
  rain: 2,
};

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

function randomDailyGoal(): number {
  return 15 + Math.floor(Math.random() * 11); // 15-25
}

function levelFromXP(xp: number): number {
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (xp >= LEVEL_THRESHOLDS[i]) return i;
  }
  return 0;
}

export function xpForNextLevel(level: number): number {
  if (level >= LEVEL_THRESHOLDS.length - 1) {
    // At max level, set next threshold above current to avoid 0/0 division
    return LEVEL_THRESHOLDS[level] + 50;
  }
  return LEVEL_THRESHOLDS[level + 1];
}

export function xpForCurrentLevel(level: number): number {
  return LEVEL_THRESHOLDS[level] ?? 0;
}

function defaultProgress(): PlayerProgress {
  return {
    xp: 0,
    level: 0,
    masteryLevel: 0,
    unlockedModes: ["compare"],
    dailyXP: 0,
    dailyGoal: randomDailyGoal(),
    lastSessionDate: todayISO(),
    consecutiveDays: 1,
    lifetimeMatches: 0,
    lifetimeSmashes: 0,
    lifetimeMerges: 0,
    discoveredEquivalences: [],
  };
}

export function loadProgress(): PlayerProgress {
  try {
    const raw = localStorage.getItem(scopedKey(BASE_KEY));
    if (!raw) return defaultProgress();
    const p: PlayerProgress = JSON.parse(raw);

    // Handle new day
    const today = todayISO();
    if (p.lastSessionDate !== today) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const wasYesterday = p.lastSessionDate === yesterday.toISOString().slice(0, 10);

      p.dailyXP = 0;
      p.dailyGoal = randomDailyGoal();
      p.lastSessionDate = today;
      p.consecutiveDays = wasYesterday ? p.consecutiveDays + 1 : 1;
    }

    return p;
  } catch {
    return defaultProgress();
  }
}

export function saveProgress(p: PlayerProgress) {
  try {
    localStorage.setItem(scopedKey(BASE_KEY), JSON.stringify(p));
  } catch {
    // ignore
  }
}

/** Compute which modes should be unlocked at a given level */
function modesForLevel(level: number): string[] {
  return Object.entries(MODE_UNLOCK_LEVELS)
    .filter(([, reqLevel]) => level >= reqLevel)
    .map(([mode]) => mode);
}

export interface XPResult {
  progress: PlayerProgress;
  leveledUp: boolean;
  previousLevel: number;
  newLevel: number;
  dailyGoalReached: boolean;
  newlyUnlockedModes: string[];
}

export function addXP(amount: number): XPResult {
  const p = loadProgress();
  const previousLevel = p.level;
  const wasBelowGoal = p.dailyXP < p.dailyGoal;

  p.xp += amount;
  p.dailyXP += amount;
  p.level = levelFromXP(p.xp);

  // Check for newly unlocked modes
  const newModes = modesForLevel(p.level);
  const newlyUnlockedModes = newModes.filter((m) => !p.unlockedModes.includes(m));
  p.unlockedModes = newModes;

  const leveledUp = p.level > previousLevel;
  const dailyGoalReached = wasBelowGoal && p.dailyXP >= p.dailyGoal;

  saveProgress(p);

  return {
    progress: p,
    leveledUp,
    previousLevel,
    newLevel: p.level,
    dailyGoalReached,
    newlyUnlockedModes,
  };
}

/** Record a discovery (equivalent fraction pair). Returns true if it was new. */
export function recordDiscovery(key: string): boolean {
  const p = loadProgress();
  if (p.discoveredEquivalences.includes(key)) return false;
  p.discoveredEquivalences.push(key);
  saveProgress(p);
  return true;
}

/** Increment a lifetime stat */
export function incrementStat(stat: "lifetimeMatches" | "lifetimeSmashes" | "lifetimeMerges") {
  const p = loadProgress();
  p[stat] += 1;
  saveProgress(p);
}

/** Persist mastery level */
export function persistMastery(level: number) {
  const p = loadProgress();
  p.masteryLevel = level;
  saveProgress(p);
}
