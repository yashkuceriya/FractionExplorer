// ─── FractionLab Mastery Progression ────────────────────────────────
// Replaces pure XP with skill mastery tracking across representations.

import type { ManipulativeType, SkillTag, Episode } from "./curriculum";
import { CURRICULUM } from "./curriculum";
import type { MisconceptionTag } from "./misconceptions";

// Re-export so existing imports from mastery.ts still work
export type { MisconceptionTag };

export const MISCONCEPTION_LABELS: Record<string, string> = {
  E1_unequal_parts: "Unequal parts",
  E2_numerator_count: "Numerator count error",
  E3_denominator_meaning: "Denominator meaning",
  E4_whole_number_bias: "Whole-number bias",
  E5_same_whole_error: "Same-whole error",
  E6_magnitude_error: "Magnitude error",
  E7_comprehension: "Comprehension",
};

// ─── Types ──────────────────────────────────────────────────────────

export interface SkillMastery {
  skill: SkillTag;
  correct: number;
  total: number;
  representations: string[]; // ManipulativeType[] stored as string[] for JSON serialization
  hintsUsed: number;
  lastAttempts: boolean[]; // Last 10 attempts (true = correct)
  misconceptions: MisconceptionTag[];
  status: "not-started" | "practicing" | "mastered";
}

export interface MasteryState {
  skills: Record<string, SkillMastery>;
  currentEpisode: number;
  completedEpisodes: number[];
  lastUpdated: string;
}

export interface MasteryReport {
  totalSkills: number;
  mastered: number;
  practicing: number;
  notStarted: number;
  overallPercent: number;
  episodesCompleted: number;
  totalEpisodes: number;
  activeMisconceptions: { tag: MisconceptionTag; label: string; skills: SkillTag[] }[];
  skillDetails: SkillMastery[];
}

// ─── Constants ──────────────────────────────────────────────────────

import { scopedKey } from "./active-student-id";

const BASE_KEY = "fractionlab-mastery";
const MAX_LAST_ATTEMPTS = 10;
const MASTERY_CORRECT_THRESHOLD = 4; // out of 5
const MASTERY_WINDOW = 5;
const MASTERY_MIN_REPRESENTATIONS = 2;
const MASTERY_MAX_HINTS_LAST_3 = 1;

const ALL_SKILLS: SkillTag[] = [
  "equal-parts",
  "unit-fractions",
  "build-fractions",
  "number-line",
  "equivalence",
  "compare-same-denom",
  "compare-same-numer",
  "benchmark",
  "complements",
  "mixed-numbers",
  "add-same-denom",
  "subtract-same-denom",
  "magnitude",
  "word-problems",
];

// ─── Default State ──────────────────────────────────────────────────

function defaultSkillMastery(skill: SkillTag): SkillMastery {
  return {
    skill,
    correct: 0,
    total: 0,
    representations: [],
    hintsUsed: 0,
    lastAttempts: [],
    misconceptions: [],
    status: "not-started",
  };
}

function defaultMasteryState(): MasteryState {
  const skills: Record<string, SkillMastery> = {};
  for (const skill of ALL_SKILLS) {
    skills[skill] = defaultSkillMastery(skill);
  }
  return {
    skills,
    currentEpisode: 1,
    completedEpisodes: [],
    lastUpdated: new Date().toISOString(),
  };
}

// ─── Persistence ────────────────────────────────────────────────────

export function loadMastery(): MasteryState {
  try {
    const raw = localStorage.getItem(scopedKey(BASE_KEY));
    if (!raw) return defaultMasteryState();
    const parsed: MasteryState = JSON.parse(raw);

    // Ensure all skills exist (handles new skills added in updates)
    for (const skill of ALL_SKILLS) {
      if (!parsed.skills[skill]) {
        parsed.skills[skill] = defaultSkillMastery(skill);
      }
    }

    return parsed;
  } catch {
    return defaultMasteryState();
  }
}

export function saveMastery(state: MasteryState): void {
  try {
    state.lastUpdated = new Date().toISOString();
    localStorage.setItem(scopedKey(BASE_KEY), JSON.stringify(state));
  } catch {
    // Storage full or unavailable — silently fail
  }
}

// ─── Core Logic ─────────────────────────────────────────────────────

/**
 * Compute mastery status from a skill's data.
 * Mastered when:
 *   - At least 4/5 correct in the last 5 attempts
 *   - Used at least 2 different representations (manipulatives)
 *   - At most 1 hint used in the last 3 items
 *   - No active misconceptions
 */
function computeStatus(sm: SkillMastery): "not-started" | "practicing" | "mastered" {
  if (sm.total === 0) return "not-started";

  const last5 = sm.lastAttempts.slice(-MASTERY_WINDOW);
  if (last5.length < MASTERY_WINDOW) return "practicing";

  const correctInWindow = last5.filter(Boolean).length;
  const uniqueReps = new Set(sm.representations).size;
  const hasMisconceptions = sm.misconceptions.length > 0;

  // Count hints in last 3 (approximation: we track total hints,
  // so we check if overall hint rate is acceptable)
  // For precise tracking we'd need per-attempt hint data,
  // but this heuristic works for the MVP
  const hintRate = sm.total > 0 ? sm.hintsUsed / sm.total : 0;
  const lowHintUsage = hintRate <= 0.33; // roughly ≤1 hint per 3 items

  if (
    correctInWindow >= MASTERY_CORRECT_THRESHOLD &&
    uniqueReps >= MASTERY_MIN_REPRESENTATIONS &&
    lowHintUsage &&
    !hasMisconceptions
  ) {
    return "mastered";
  }

  return "practicing";
}

/**
 * Record an attempt for a skill. Returns updated mastery state.
 */
export function recordAttempt(
  skill: SkillTag,
  correct: boolean,
  manipulative: ManipulativeType,
  hintUsed: boolean,
  misconception?: MisconceptionTag
): MasteryState {
  const state = loadMastery();
  const sm = state.skills[skill] ?? defaultSkillMastery(skill);

  // Update counts
  sm.total += 1;
  if (correct) sm.correct += 1;
  if (hintUsed) sm.hintsUsed += 1;

  // Track representation
  if (!sm.representations.includes(manipulative)) {
    sm.representations.push(manipulative);
  }

  // Track last attempts (rolling window of 10)
  sm.lastAttempts.push(correct);
  if (sm.lastAttempts.length > MAX_LAST_ATTEMPTS) {
    sm.lastAttempts.shift();
  }

  // Handle misconceptions
  if (misconception && !sm.misconceptions.includes(misconception)) {
    sm.misconceptions.push(misconception);
  }

  // Clear a misconception if the student gets 3 correct in a row
  // (demonstrates they've overcome it)
  if (correct && sm.misconceptions.length > 0) {
    const lastThree = sm.lastAttempts.slice(-3);
    if (lastThree.length === 3 && lastThree.every(Boolean)) {
      // Clear the oldest misconception
      sm.misconceptions.shift();
    }
  }

  // Recompute status
  sm.status = computeStatus(sm);
  state.skills[skill] = sm;

  saveMastery(state);
  return state;
}

/**
 * Get the mastery status for a specific skill.
 */
export function getSkillStatus(skill: SkillTag): "not-started" | "practicing" | "mastered" {
  const state = loadMastery();
  const sm = state.skills[skill];
  if (!sm) return "not-started";
  return sm.status;
}

/**
 * Get accuracy percentage for a skill (0-100).
 */
export function getSkillAccuracy(skill: SkillTag): number {
  const state = loadMastery();
  const sm = state.skills[skill];
  if (!sm || sm.total === 0) return 0;
  return Math.round((sm.correct / sm.total) * 100);
}

// ─── Episode Progression ────────────────────────────────────────────

/**
 * Mark an episode as completed.
 */
export function completeEpisode(episodeId: number): MasteryState {
  const state = loadMastery();
  if (!state.completedEpisodes.includes(episodeId)) {
    state.completedEpisodes.push(episodeId);
  }
  // Advance current episode if this was the current one
  if (episodeId === state.currentEpisode && state.currentEpisode < CURRICULUM.length) {
    state.currentEpisode = episodeId + 1;
  }
  saveMastery(state);
  return state;
}

/**
 * Get the next episode to play based on mastery state.
 * Strategy:
 *   1. If there's a current unfinished episode, return it
 *   2. Find the first episode whose skills are NOT all mastered
 *   3. If everything is mastered, return the final assessment (ep 18)
 */
export function getNextEpisode(state?: MasteryState): Episode {
  const mastery = state ?? loadMastery();

  // Check current episode first
  if (!mastery.completedEpisodes.includes(mastery.currentEpisode)) {
    const current = CURRICULUM.find((ep) => ep.id === mastery.currentEpisode);
    if (current) return current;
  }

  // Find first episode with unmastered skills
  for (const episode of CURRICULUM) {
    if (mastery.completedEpisodes.includes(episode.id)) continue;

    const hasUnmasteredSkill = episode.skills.some((skill) => {
      const sm = mastery.skills[skill];
      return !sm || sm.status !== "mastered";
    });

    if (hasUnmasteredSkill) return episode;
  }

  // Everything done — return the last episode (assessment) for replay
  return CURRICULUM[CURRICULUM.length - 1];
}

/**
 * Check if an episode is unlocked (all prerequisite episodes completed).
 * Episode N requires episodes 1..N-1 to be completed.
 * Exception: Episode 1 is always unlocked.
 */
export function isEpisodeUnlocked(episodeId: number): boolean {
  if (episodeId === 1) return true;
  const state = loadMastery();
  // Require the previous episode to be completed
  return state.completedEpisodes.includes(episodeId - 1);
}

// ─── Reporting ──────────────────────────────────────────────────────

/**
 * Generate a mastery report for the parent dashboard.
 */
export function getMasteryReport(): MasteryReport {
  const state = loadMastery();
  const allSkills = Object.values(state.skills);

  const mastered = allSkills.filter((s) => s.status === "mastered").length;
  const practicing = allSkills.filter((s) => s.status === "practicing").length;
  const notStarted = allSkills.filter((s) => s.status === "not-started").length;

  // Gather active misconceptions across all skills
  const misconceptionMap = new Map<MisconceptionTag, SkillTag[]>();
  for (const sm of allSkills) {
    for (const mc of sm.misconceptions) {
      const existing = misconceptionMap.get(mc) ?? [];
      existing.push(sm.skill);
      misconceptionMap.set(mc, existing);
    }
  }

  const activeMisconceptions = Array.from(misconceptionMap.entries()).map(
    ([tag, skills]) => ({
      tag,
      label: MISCONCEPTION_LABELS[tag],
      skills,
    })
  );

  return {
    totalSkills: allSkills.length,
    mastered,
    practicing,
    notStarted,
    overallPercent: allSkills.length > 0 ? Math.round((mastered / allSkills.length) * 100) : 0,
    episodesCompleted: state.completedEpisodes.length,
    totalEpisodes: CURRICULUM.length,
    activeMisconceptions,
    skillDetails: allSkills,
  };
}

/**
 * Get a short text summary of mastery for the AI tutor to reference.
 */
export function getMasterySummaryForTutor(): string {
  const report = getMasteryReport();
  const lines: string[] = [
    `Mastery: ${report.mastered}/${report.totalSkills} skills mastered (${report.overallPercent}%)`,
    `Episodes: ${report.episodesCompleted}/${report.totalEpisodes} completed`,
  ];

  if (report.activeMisconceptions.length > 0) {
    lines.push(
      `Active misconceptions: ${report.activeMisconceptions
        .map((m) => `${m.label} (${m.skills.join(", ")})`)
        .join("; ")}`
    );
  }

  const weakSkills = report.skillDetails
    .filter((s) => s.status === "practicing" && s.total >= 3)
    .sort((a, b) => (a.correct / a.total) - (b.correct / b.total))
    .slice(0, 3);

  if (weakSkills.length > 0) {
    lines.push(
      `Struggling with: ${weakSkills
        .map((s) => `${s.skill} (${Math.round((s.correct / s.total) * 100)}%)`)
        .join(", ")}`
    );
  }

  return lines.join("\n");
}

/**
 * Reset all mastery data (for testing or starting over).
 */
export function resetMastery(): void {
  try {
    localStorage.removeItem(scopedKey(BASE_KEY));
  } catch {
    // ignore
  }
}
