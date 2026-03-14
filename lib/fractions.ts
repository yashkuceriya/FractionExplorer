import Fraction from "fraction.js";

export interface FractionData {
  numerator: number;
  denominator: number;
  color: string;
}

export const FRACTION_COLORS: Record<number, string> = {
  1: "#e97818",  // whole - orange
  2: "#ef4444",  // halves - red
  3: "#2563eb",  // thirds - blue
  4: "#7c3aed",  // fourths - purple
  5: "#f97316",  // fifths - orange
  6: "#059669",  // sixths - green
  8: "#ec4899",  // eighths - pink
  9: "#0891b2",  // ninths - cyan
  10: "#84cc16", // tenths - lime
  12: "#f59e0b", // twelfths - amber
};

// Unique color per fraction value so visually identical values stand out
export const UNIQUE_FRACTION_COLORS: Record<string, string> = {
  // Halves family
  "1/2": "#ef4444",   // red
  "2/4": "#f43f5e",   // rose
  "3/6": "#e11d48",   // crimson
  "4/8": "#dc2626",   // dark red
  "5/10": "#fb7185",  // coral
  "6/12": "#f87171",  // light red
  // Thirds family
  "1/3": "#3b82f6",   // blue
  "2/6": "#0ea5e9",   // sky
  "3/9": "#38bdf8",   // light sky
  "4/12": "#60a5fa",  // soft blue
  // Fourths family
  "1/4": "#8b5cf6",   // purple
  "2/8": "#a855f7",   // violet
  "3/12": "#c084fc",  // light violet
  // Two-thirds family
  "2/3": "#2563eb",   // royal blue
  "4/6": "#1d4ed8",   // navy
  "6/9": "#3b82f6",   // bright blue
  "8/12": "#1e40af",  // deep navy
  // Three-fourths family
  "3/4": "#7c3aed",   // deep purple
  "6/8": "#6d28d9",   // grape
  "9/12": "#8b5cf6",  // lavender
  // Fifths families
  "1/5": "#f97316",   // orange
  "2/10": "#fb923c",  // soft orange
  "2/5": "#ea580c",   // burnt orange
  "4/10": "#f59e0b",  // amber
  "3/5": "#d946ef",   // fuchsia
  "6/10": "#c026d3",  // dark fuchsia
  "4/5": "#a21caf",   // plum
  // Sixths families
  "1/6": "#14b8a6",   // teal
  "2/12": "#0d9488",  // dark teal
  "5/6": "#0f766e",   // deep teal
  "10/12": "#115e59", // darkest teal
  // Eighths (non-equivalent)
  "1/8": "#ec4899",   // pink
  "3/8": "#f472b6",   // light pink
  "5/8": "#e879f9",   // orchid
  "7/8": "#be185d",   // magenta
  // Ninths
  "1/9": "#0891b2",   // cyan
  "2/9": "#06b6d4",   // bright cyan
  "4/9": "#0e7490",   // dark cyan
  "5/9": "#155e75",   // deep cyan
  "7/9": "#164e63",   // midnight cyan
  "8/9": "#083344",   // darkest cyan
  // Tenths
  "1/10": "#84cc16",  // lime
  "3/10": "#65a30d",  // green-lime
  "7/10": "#4d7c0f",  // olive
  "9/10": "#3f6212",  // dark olive
  // Twelfths
  "1/12": "#f59e0b",  // amber
  "5/12": "#d97706",  // dark amber
  "7/12": "#b45309",  // brown amber
  "11/12": "#92400e", // dark brown
};

export function getFractionColor(numerator: number, denominator: number): string {
  return UNIQUE_FRACTION_COLORS[`${numerator}/${denominator}`] || FRACTION_COLORS[denominator] || "#6b7280";
}

export const AVAILABLE_FRACTIONS: FractionData[] = [
  // Complementary pairs that make a whole — intuitive for kids!
  // Halves: 1/2 + 1/2 = 1
  { numerator: 1, denominator: 2, color: getFractionColor(1, 2) },
  // Thirds: 1/3 + 2/3 = 1
  { numerator: 1, denominator: 3, color: getFractionColor(1, 3) },
  { numerator: 2, denominator: 3, color: getFractionColor(2, 3) },
  // Fourths: 1/4 + 3/4 = 1
  { numerator: 1, denominator: 4, color: getFractionColor(1, 4) },
  { numerator: 3, denominator: 4, color: getFractionColor(3, 4) },
  // Equivalent pairs for discovery
  { numerator: 2, denominator: 4, color: getFractionColor(2, 4) },  // = 1/2
  { numerator: 3, denominator: 6, color: getFractionColor(3, 6) },  // = 1/2
  { numerator: 2, denominator: 6, color: getFractionColor(2, 6) },  // = 1/3
  { numerator: 4, denominator: 8, color: getFractionColor(4, 8) },  // = 1/2
  // More complements
  { numerator: 2, denominator: 8, color: getFractionColor(2, 8) },  // = 1/4
  { numerator: 1, denominator: 5, color: getFractionColor(1, 5) },
  { numerator: 4, denominator: 5, color: getFractionColor(4, 5) },  // 1/5 + 4/5 = 1
  { numerator: 1, denominator: 6, color: getFractionColor(1, 6) },
  { numerator: 5, denominator: 6, color: getFractionColor(5, 6) },  // 1/6 + 5/6 = 1
];

const DEFAULT_RANDOM_POOL: FractionData[] = [
  ...AVAILABLE_FRACTIONS,
  { numerator: 5, denominator: 10, color: getFractionColor(5, 10) },
  { numerator: 6, denominator: 12, color: getFractionColor(6, 12) },
  { numerator: 3, denominator: 9, color: getFractionColor(3, 9) },
  { numerator: 4, denominator: 12, color: getFractionColor(4, 12) },
  { numerator: 4, denominator: 6, color: getFractionColor(4, 6) },
  { numerator: 6, denominator: 8, color: getFractionColor(6, 8) },
  { numerator: 3, denominator: 8, color: getFractionColor(3, 8) },
  { numerator: 5, denominator: 6, color: getFractionColor(5, 6) },
  { numerator: 2, denominator: 5, color: getFractionColor(2, 5) },
  { numerator: 3, denominator: 5, color: getFractionColor(3, 5) },
];

/**
 * Get a random fraction not already in `existing`.
 * Pass `allowedPool` to restrict candidates to a mastery-gated set;
 * omit it to use the full default pool.
 */
export function getRandomFraction(existing: FractionData[], allowedPool?: FractionData[]): FractionData {
  const pool = allowedPool ?? DEFAULT_RANDOM_POOL;
  const notPresent = pool.filter(
    (f) => !existing.some((e) => e.numerator === f.numerator && e.denominator === f.denominator)
  );
  if (notPresent.length === 0) return pool[Math.floor(Math.random() * pool.length)];
  return notPresent[Math.floor(Math.random() * notPresent.length)];
}

// Extended fractions unlocked progressively via mastery
// Grouped by equivalence families for rich matching
export const EXTENDED_FRACTIONS: FractionData[] = [
  // 1/2 family extensions
  { numerator: 5, denominator: 10, color: getFractionColor(5, 10) },
  { numerator: 6, denominator: 12, color: getFractionColor(6, 12) },
  // 1/3 family extensions
  { numerator: 3, denominator: 9, color: getFractionColor(3, 9) },
  { numerator: 4, denominator: 12, color: getFractionColor(4, 12) },
  // 2/3 family
  { numerator: 4, denominator: 6, color: getFractionColor(4, 6) },
  { numerator: 6, denominator: 9, color: getFractionColor(6, 9) },
  { numerator: 8, denominator: 12, color: getFractionColor(8, 12) },
  // 3/4 family
  { numerator: 6, denominator: 8, color: getFractionColor(6, 8) },
  { numerator: 9, denominator: 12, color: getFractionColor(9, 12) },
  // 1/4 family
  { numerator: 3, denominator: 12, color: getFractionColor(3, 12) },
  // Fifths families
  { numerator: 2, denominator: 10, color: getFractionColor(2, 10) },
  { numerator: 4, denominator: 10, color: getFractionColor(4, 10) },
  { numerator: 6, denominator: 10, color: getFractionColor(6, 10) },
  // Sixths family
  { numerator: 2, denominator: 12, color: getFractionColor(2, 12) },
  { numerator: 10, denominator: 12, color: getFractionColor(10, 12) },
];

export function areFractionsEqual(
  a: { numerator: number; denominator: number },
  b: { numerator: number; denominator: number }
): boolean {
  const fa = new Fraction(a.numerator, a.denominator);
  const fb = new Fraction(b.numerator, b.denominator);
  return fa.equals(fb);
}

export function fractionToString(f: { numerator: number; denominator: number }): string {
  return `${f.numerator}/${f.denominator}`;
}

export function simplifyFraction(numerator: number, denominator: number): { numerator: number; denominator: number } {
  const f = new Fraction(numerator, denominator);
  return { numerator: Number(f.n), denominator: Number(f.d) };
}

// Shared math helpers — use these instead of duplicating in components
export function gcd(a: number, b: number): number {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b) { [a, b] = [b, a % b]; }
  return a;
}

export function lcm(a: number, b: number): number {
  return (a * b) / gcd(a, b);
}

export function simplifyPair(n: number, d: number): { numerator: number; denominator: number } {
  const g = gcd(n, d);
  return { numerator: n / g, denominator: d / g };
}

export function fractionsEqualRaw(
  a: { numerator: number; denominator: number },
  b: { numerator: number; denominator: number }
): boolean {
  return a.numerator * b.denominator === b.numerator * a.denominator;
}

export function addFractions(
  a: { numerator: number; denominator: number },
  b: { numerator: number; denominator: number }
): { numerator: number; denominator: number } {
  const d = lcm(a.denominator, b.denominator);
  const n = a.numerator * (d / a.denominator) + b.numerator * (d / b.denominator);
  return simplifyPair(n, d);
}
