/**
 * Dynamic challenge/mission generator.
 * Produces varied fraction challenges so the app never gets stale.
 */

export type ChallengeType =
  | "find-equivalent"
  | "compare-bigger"
  | "share-puzzle"
  | "missing-number";

export interface Challenge {
  id: string;
  type: ChallengeType;
  prompt: string; // Voice reads this (short!)
  emoji: string;
  targetFraction?: { n: number; d: number };
  answer: { n: number; d: number };
  xpReward: number;
  hint?: string;
}

// ── Equivalence families (denominator ≤ 12) ──

type Frac = { n: number; d: number };

const EQUIVALENCE_FAMILIES: Frac[][] = [
  // 1/2 family
  [
    { n: 1, d: 2 },
    { n: 2, d: 4 },
    { n: 3, d: 6 },
    { n: 4, d: 8 },
    { n: 5, d: 10 },
    { n: 6, d: 12 },
  ],
  // 1/3 family
  [
    { n: 1, d: 3 },
    { n: 2, d: 6 },
    { n: 3, d: 9 },
    { n: 4, d: 12 },
  ],
  // 1/4 family
  [
    { n: 1, d: 4 },
    { n: 2, d: 8 },
    { n: 3, d: 12 },
  ],
  // 2/3 family
  [
    { n: 2, d: 3 },
    { n: 4, d: 6 },
    { n: 6, d: 9 },
    { n: 8, d: 12 },
  ],
  // 3/4 family
  [
    { n: 3, d: 4 },
    { n: 6, d: 8 },
    { n: 9, d: 12 },
  ],
  // 1/5 family
  [{ n: 1, d: 5 }, { n: 2, d: 10 }],
  // 2/5 family
  [{ n: 2, d: 5 }, { n: 4, d: 10 }],
  // 3/5 family
  [{ n: 3, d: 5 }, { n: 6, d: 10 }],
  // 1/6 family
  [{ n: 1, d: 6 }, { n: 2, d: 12 }],
  // 5/6 family
  [{ n: 5, d: 6 }, { n: 10, d: 12 }],
];

// ── Share scenarios ──

const SHARE_SCENARIOS = [
  { thing: "pizza", people: 2, emoji: "\u{1F355}" },
  { thing: "cookie", people: 3, emoji: "\u{1F36A}" },
  { thing: "cake", people: 4, emoji: "\u{1F382}" },
  { thing: "chocolate bar", people: 5, emoji: "\u{1F36B}" },
  { thing: "pie", people: 6, emoji: "\u{1F967}" },
  { thing: "sandwich", people: 8, emoji: "\u{1F96A}" },
  { thing: "candy bar", people: 3, emoji: "\u{1F36C}" },
  { thing: "watermelon", people: 4, emoji: "\u{1F349}" },
  { thing: "donut", people: 2, emoji: "\u{1F369}" },
  { thing: "ice cream", people: 5, emoji: "\u{1F366}" },
];

// ── Comparison themes ──

const COMPARE_EMOJIS = [
  "\u{1F355}", // pizza
  "\u{1F36B}", // chocolate
  "\u{1F370}", // shortcake
  "\u{1F967}", // pie
  "\u{1F382}", // cake
];

// ── Helpers ──

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

let counter = 0;

// ── Generator ──

type Difficulty = "beginner" | "intermediate" | "expert";

const DIFFICULTY_MAX_DENOM: Record<Difficulty, number> = {
  beginner: 4,
  intermediate: 8,
  expert: 12,
};

function familiesForDifficulty(difficulty: Difficulty): Frac[][] {
  const maxD = DIFFICULTY_MAX_DENOM[difficulty];
  return EQUIVALENCE_FAMILIES
    .map((family) => family.filter((f) => f.d <= maxD))
    .filter((family) => family.length >= 2);
}

export function generateChallenge(playerLevel: number = 0, difficulty: Difficulty = "beginner"): Challenge {
  // Weight types by level + difficulty
  const types: ChallengeType[] = ["find-equivalent", "find-equivalent"];

  if (playerLevel >= 0) types.push("compare-bigger", "share-puzzle");
  if (playerLevel >= 1) types.push("find-equivalent", "share-puzzle");
  if (difficulty !== "beginner" || playerLevel >= 2) types.push("missing-number", "compare-bigger");
  if (difficulty === "expert" || playerLevel >= 3) types.push("missing-number", "missing-number");

  const type = pickRandom(types);
  counter++;

  const maxDenom = DIFFICULTY_MAX_DENOM[difficulty];
  const xpMultiplier = difficulty === "expert" ? 2 : difficulty === "intermediate" ? 1.5 : 1;

  switch (type) {
    case "find-equivalent": {
      const families = familiesForDifficulty(difficulty);
      const family = pickRandom(families);
      const shuffled = shuffle(family);
      const target = shuffled[0];
      const answer = shuffled[1] ?? shuffled[0]; // guard: family always ≥2, but be safe

      return {
        id: `ch-${counter}`,
        type: "find-equivalent",
        prompt: `Find a fraction equal to ${target.n}/${target.d}!`,
        emoji: "\u{1F50D}",
        targetFraction: target,
        answer,
        xpReward: Math.round(3 * xpMultiplier),
        hint: `Think about what ${target.n}/${target.d} looks like with different sized pieces...`,
      };
    }

    case "compare-bigger": {
      const allFracs = familiesForDifficulty(difficulty).flat();
      const a = pickRandom(allFracs);
      let b = pickRandom(allFracs);
      let attempts = 0;
      while (a.n * b.d === b.n * a.d && attempts < 20) {
        b = pickRandom(allFracs);
        attempts++;
      }
      // If still equal after retries, force a different fraction
      if (a.n * b.d === b.n * a.d) {
        b = a.d <= 4 ? { n: 1, d: a.d + 1 } : { n: 1, d: a.d - 1 };
      }
      const bigger = a.n / a.d > b.n / b.d ? a : b;
      const emoji = pickRandom(COMPARE_EMOJIS);

      return {
        id: `ch-${counter}`,
        type: "compare-bigger",
        prompt: `Which is bigger: ${a.n}/${a.d} or ${b.n}/${b.d}?`,
        emoji,
        targetFraction: a,
        answer: bigger,
        xpReward: Math.round(2 * xpMultiplier),
        hint: `Compare the sizes — which bar is longer?`,
      };
    }

    case "share-puzzle": {
      const validScenarios = SHARE_SCENARIOS.filter((sc) => sc.people <= maxDenom);
      const s = pickRandom(validScenarios.length > 0 ? validScenarios : SHARE_SCENARIOS.slice(0, 3));
      return {
        id: `ch-${counter}`,
        type: "share-puzzle",
        prompt: `Share 1 ${s.thing} equally among ${s.people} friends!`,
        emoji: s.emoji,
        answer: { n: 1, d: s.people },
        xpReward: Math.round(3 * xpMultiplier),
        hint: `If you split something into ${s.people} equal parts...`,
      };
    }

    case "missing-number": {
      const family = pickRandom(familiesForDifficulty(difficulty));
      const shuffled = shuffle(family);
      const a = shuffled[0];
      const b = shuffled[1] ?? shuffled[0]; // guard against single-element families
      return {
        id: `ch-${counter}`,
        type: "missing-number",
        prompt: `${a.n}/${a.d} = ?/${b.d} \u2014 Find the missing number!`,
        emoji: "\u{2753}",
        targetFraction: a,
        answer: b,
        xpReward: Math.round(3 * xpMultiplier),
        hint: `${a.n}/${a.d} is the same amount as something over ${b.d}...`,
      };
    }

    default:
      return generateChallenge(playerLevel, difficulty);
  }
}

/**
 * Generate a challenge with 30% chance of reviewing previously mastered skills.
 * This implements spaced/interleaved practice for better retention.
 */
export function generateChallengeWithReview(
  playerLevel: number = 0,
  difficulty: Difficulty = "beginner",
  masteredSkills?: string[]
): Challenge {
  // 30% chance of review if there are mastered skills
  if (masteredSkills && masteredSkills.length > 0 && Math.random() < 0.3) {
    counter++;
    const xpMultiplier = difficulty === "expert" ? 2 : difficulty === "intermediate" ? 1.5 : 1;

    // Review challenge: always a find-equivalent (the core skill)
    const families = familiesForDifficulty(difficulty);
    const family = pickRandom(families);
    const shuffled = shuffle(family);
    const target = shuffled[0];
    const answer = shuffled[1] ?? shuffled[0];

    return {
      id: `review-${counter}`,
      type: "find-equivalent",
      prompt: `Quick review! Find a fraction equal to ${target.n}/${target.d}!`,
      emoji: "\u{1F504}",
      targetFraction: target,
      answer,
      xpReward: Math.round(2 * xpMultiplier),
      hint: `Remember this one? Think about equivalent fractions...`,
    };
  }

  return generateChallenge(playerLevel, difficulty);
}

/** Check if a dropped fraction matches the challenge answer */
export function checkAnswer(
  challenge: Challenge,
  fraction: { numerator: number; denominator: number }
): boolean {
  // Cross-multiply for exact comparison
  return (
    fraction.numerator * challenge.answer.d ===
    challenge.answer.n * fraction.denominator
  );
}
