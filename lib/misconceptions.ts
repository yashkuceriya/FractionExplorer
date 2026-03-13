/**
 * Misconception detection and tagging system.
 * Based on research: whole-number bias, componential view, same-whole neglect,
 * partitioning errors, and magnitude weakness are the top fraction misconceptions.
 */

export type MisconceptionTag =
  | "E1_unequal_parts"      // Unequal parts labeled as equal fractions
  | "E2_numerator_count"    // Wrong count of shaded/selected parts
  | "E3_denominator_meaning" // Doesn't understand denominator = total equal parts
  | "E4_whole_number_bias"  // Thinks 1/8 > 1/4 because 8 > 4
  | "E5_same_whole_error"   // Compares fractions from different-sized wholes
  | "E6_magnitude_error"    // Can't place fractions on number line accurately
  | "E7_comprehension";     // Didn't understand the prompt

export interface MisconceptionProfile {
  tags: Record<MisconceptionTag, number>; // count of times detected
  lastDetected: Record<MisconceptionTag, string>; // ISO date
  resolved: MisconceptionTag[]; // previously active, now resolved
}

import { scopedKey } from "./active-student-id";

const BASE_KEY = "misconception-profile";

export function defaultProfile(): MisconceptionProfile {
  return {
    tags: {
      E1_unequal_parts: 0,
      E2_numerator_count: 0,
      E3_denominator_meaning: 0,
      E4_whole_number_bias: 0,
      E5_same_whole_error: 0,
      E6_magnitude_error: 0,
      E7_comprehension: 0,
    },
    lastDetected: {} as Record<MisconceptionTag, string>,
    resolved: [],
  };
}

export function loadProfile(): MisconceptionProfile {
  try {
    const raw = localStorage.getItem(scopedKey(BASE_KEY));
    if (!raw) return defaultProfile();
    return JSON.parse(raw);
  } catch {
    return defaultProfile();
  }
}

export function saveProfile(p: MisconceptionProfile) {
  try {
    localStorage.setItem(scopedKey(BASE_KEY), JSON.stringify(p));
  } catch {
    // ignore
  }
}

export function recordMisconception(tag: MisconceptionTag) {
  const p = loadProfile();
  p.tags[tag] = (p.tags[tag] || 0) + 1;
  p.lastDetected[tag] = new Date().toISOString();
  // Remove from resolved if it recurs
  p.resolved = p.resolved.filter((t) => t !== tag);
  saveProfile(p);
}

export function resolveMisconception(tag: MisconceptionTag) {
  const p = loadProfile();
  if (!p.resolved.includes(tag)) {
    p.resolved.push(tag);
  }
  saveProfile(p);
}

/** Get active (unresolved) misconceptions sorted by frequency */
export function getActiveMisconceptions(): MisconceptionTag[] {
  const p = loadProfile();
  return (Object.entries(p.tags) as [MisconceptionTag, number][])
    .filter(([tag, count]) => count > 0 && !p.resolved.includes(tag))
    .sort((a, b) => b[1] - a[1])
    .map(([tag]) => tag);
}

/**
 * Detect misconception from a comparison answer.
 * Returns the likely misconception tag, or null if correct.
 */
export function detectComparisonMisconception(
  studentAnswer: { n: number; d: number },
  correctAnswer: { n: number; d: number },
  questionType: string
): MisconceptionTag | null {
  if (studentAnswer.n === correctAnswer.n && studentAnswer.d === correctAnswer.d) {
    return null; // Correct
  }

  // Whole-number bias: student picks fraction with bigger denominator
  // thinking bigger number = bigger fraction
  if (
    questionType === "compare" &&
    studentAnswer.d > correctAnswer.d &&
    studentAnswer.n / studentAnswer.d < correctAnswer.n / correctAnswer.d
  ) {
    return "E4_whole_number_bias";
  }

  // Numerator count error: right denominator, wrong numerator
  if (studentAnswer.d === correctAnswer.d && studentAnswer.n !== correctAnswer.n) {
    return "E2_numerator_count";
  }

  // Denominator meaning error: right numerator, wrong denominator
  if (studentAnswer.n === correctAnswer.n && studentAnswer.d !== correctAnswer.d) {
    return "E3_denominator_meaning";
  }

  return null;
}

/**
 * Detect number line placement misconception.
 * tolerance = acceptable distance from correct position (0-1 scale)
 */
export function detectPlacementMisconception(
  placedValue: number,
  correctValue: number,
  denominator: number
): MisconceptionTag | null {
  const distance = Math.abs(placedValue - correctValue);

  if (distance < 0.01) return null; // Correct

  // Magnitude error: placed far from correct position
  if (distance > 0.15) {
    return "E6_magnitude_error";
  }

  // Off by one segment: likely counting error
  if (Math.abs(distance - 1 / denominator) < 0.02) {
    return "E2_numerator_count";
  }

  // Placed at complement (e.g., placed 1/4 where 3/4 should be)
  if (Math.abs(placedValue + correctValue - 1) < 0.05) {
    return "E3_denominator_meaning";
  }

  return "E6_magnitude_error";
}

/** Get hint text for a specific misconception */
export function getHintForMisconception(tag: MisconceptionTag): string {
  switch (tag) {
    case "E1_unequal_parts":
      return "Remember, all the parts need to be the SAME size! Equal parts means each piece is exactly the same.";
    case "E2_numerator_count":
      return "Let's count together! The top number tells us HOW MANY parts we're looking at. Count the colored pieces — one, two, three...";
    case "E3_denominator_meaning":
      return "The bottom number tells us how many EQUAL parts the whole is split into. Count ALL the pieces, colored and empty!";
    case "E4_whole_number_bias":
      return "Here's a cool trick — when we cut something into MORE pieces, each piece gets SMALLER! More slices of pizza means smaller slices!";
    case "E5_same_whole_error":
      return "Wait — we can only compare fractions when they come from the SAME sized whole. Are these wholes the same size?";
    case "E6_magnitude_error":
      return "Let's use our benchmarks! Is this fraction closer to 0, or to one-half, or to 1? That helps us find where it goes!";
    case "E7_comprehension":
      return "Let me say that a different way! Look at the colored blocks and count the pieces together with me.";
  }
}

/** Get tutor context about active misconceptions for the AI */
export function getMisconceptionContext(): string {
  const active = getActiveMisconceptions();
  if (active.length === 0) return "";

  const descriptions: Record<MisconceptionTag, string> = {
    E1_unequal_parts: "struggles with recognizing equal vs unequal parts",
    E2_numerator_count: "sometimes miscounts the numerator (shaded parts)",
    E3_denominator_meaning: "confuses what the denominator represents",
    E4_whole_number_bias: "thinks bigger denominator = bigger fraction (whole-number bias)",
    E5_same_whole_error: "compares fractions from different-sized wholes",
    E6_magnitude_error: "has trouble placing fractions on number lines accurately",
    E7_comprehension: "sometimes doesn't understand the question wording",
  };

  const issues = active
    .slice(0, 3)
    .map((tag) => descriptions[tag])
    .join("; ");

  return `[Known learning patterns: This student ${issues}. Address these gently with visual examples and extra patience.]`;
}
