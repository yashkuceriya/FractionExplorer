/**
 * Scripted tutor fallback — works without any API keys.
 * Returns warm, short responses based on workspace state.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

export function getScriptedResponse(
  messages: { role: string; content: string }[],
  workspaceState: any
): string {
  const ws = workspaceState || {};
  const lastUserMsg =
    [...messages].reverse().find((m) => m.role === "user")?.content || "";

  // --- Episode mode ---
  if (ws.episodeMode) {
    if (lastUserMsg.includes("[Student completed")) {
      return "Amazing job! You're getting so good at this!";
    }
    if (lastUserMsg.includes("[Student got it wrong")) {
      return "Hmm, not quite! Let's try again — you've got this!";
    }
    if (/hint/i.test(lastUserMsg)) {
      return "Here's a hint: look at how many pieces there are and how many are colored!";
    }
    return "You can do it! Take your time and try!";
  }

  // --- Free play mode ---
  const phase = ws.lessonPhase || "intro";

  switch (phase) {
    case "intro":
      return "Welcome! Let's explore fractions together. Try dragging a block into one of the comparison boxes!";

    case "exploration": {
      const left = ws.comparisonLeft;
      const right = ws.comparisonRight;
      if (left && right) {
        const leftVal =
          typeof left === "object" ? left.numerator / left.denominator : null;
        const rightVal =
          typeof right === "object"
            ? right.numerator / right.denominator
            : null;
        if (leftVal != null && rightVal != null && leftVal === rightVal) {
          const lbl = `${left.numerator}/${left.denominator}`;
          const rbl = `${right.numerator}/${right.denominator}`;
          return `Wow, you found a match! ${lbl} and ${rbl} are the same amount!`;
        }
        return "Hmm, those are different sizes. Try another pair!";
      }
      return "Drag a fraction block into a box to start comparing!";
    }

    case "discovery":
      return "You're discovering so much! Try splitting a block to find more matches.";

    case "practice":
      return "Great practice! Can you find another pair that matches?";

    case "assessment":
      return "Let's check what you've learned! Find one more matching pair.";

    case "celebration":
      return "You did it! You've mastered fraction equivalence!";

    default:
      return "Let's keep exploring fractions together!";
  }
}
