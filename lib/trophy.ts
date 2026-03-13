import { simplifyFraction } from "./fractions";
import { scopedKey } from "./active-student-id";

const BASE_KEY = "trophy-wall";

export interface Trophy {
  left: string;  // e.g. "1/2"
  right: string; // e.g. "2/4"
  simplified: string; // e.g. "1/2=1/2" for dedup
}

function toKey(left: string, right: string): string {
  const [ln, ld] = left.split("/").map(Number);
  const [rn, rd] = right.split("/").map(Number);
  const sl = simplifyFraction(ln, ld);
  const sr = simplifyFraction(rn, rd);
  const a = `${sl.numerator}/${sl.denominator}`;
  const b = `${sr.numerator}/${sr.denominator}`;
  // Sort for consistent dedup
  return [a, b].sort().join("=");
}

export function loadTrophies(): Trophy[] {
  try {
    const raw = localStorage.getItem(scopedKey(BASE_KEY));
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveTrophy(left: string, right: string): Trophy[] {
  const trophies = loadTrophies();
  const key = toKey(left, right);
  if (trophies.some((t) => t.simplified === key)) return trophies;
  const updated = [...trophies, { left, right, simplified: key }];
  try {
    localStorage.setItem(scopedKey(BASE_KEY), JSON.stringify(updated));
  } catch {
    // ignore
  }
  return updated;
}
