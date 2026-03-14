/**
 * Scripted tutor fallback — works without any API keys.
 * Randomized, warm, context-aware responses so kids don't hear the same thing twice.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

/** Pick a random item from an array */
function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// ─── Response pools ─────────────────────────────────────────────────

const CORRECT_RESPONSES = [
  "YES! You nailed it!",
  "Boom! That's exactly right!",
  "Look at you go! Perfect!",
  "Woohoo! You're on fire!",
  "That's it! You're SO smart!",
  "High five! You crushed it!",
  "Oh wow, you got it! I knew you would!",
  "YESSS! Do a happy dance!",
  "You're a fraction superstar!",
  "Incredible! That was perfect!",
];

const WRONG_RESPONSES = [
  "Ooh, not quite — but you're SO close! Try again!",
  "Hmm, almost! Give it one more shot!",
  "That's tricky! Look carefully and try again.",
  "Not that one — but I love that you tried! Go again!",
  "Close! Take another look at the pieces.",
  "Oopsie! No worries, try a different one!",
  "Tricky tricky! You'll get it — try again!",
];

const HINT_RESPONSES_SHADE = [
  "Count the pieces, then tap to color just the right number!",
  "Look at the number on top — that's how many to color!",
  "The bottom number is total pieces, the top is how many YOU get!",
];

const HINT_RESPONSES_PARTITION = [
  "How many equal pieces do we need? Use the buttons to split!",
  "Try tapping the + button until you have the right number of slices!",
  "Equal means every piece is the SAME size!",
];

const HINT_RESPONSES_IDENTIFY = [
  "Look at each choice carefully — count the pieces!",
  "Which one matches what we're looking for? Count and compare!",
  "Take your time! Look at how many pieces each one has.",
];

const HINT_RESPONSES_GENERIC = [
  "Here's a clue: look at the pieces really carefully!",
  "Take a deep breath and look again — you've got this!",
  "Try a different answer — I believe in you!",
];

const ENCOURAGE_RESPONSES = [
  "You can do it! Take your time!",
  "I'm right here with you — give it a try!",
  "You're doing great! What do you think?",
  "Go for it! There's no wrong way to explore!",
  "Hmm, what do you notice about the pieces?",
  "Let's figure this out together!",
  "Take a look — what do you see?",
];

const MATCH_FOUND = [
  "WHOA! You found a secret twin! {left} and {right} are the same!",
  "Wait — {left} and {right} are TWINS?! You discovered it!",
  "Mind. Blown. {left} equals {right}! You're a detective!",
  "YES! {left} and {right} — same amount, different pieces! So cool!",
  "You cracked the code! {left} = {right}!",
];

const NO_MATCH = [
  "Hmm, those two are different sizes. Try swapping one out!",
  "Not a match yet — but keep hunting! You'll find twins!",
  "Those aren't twins. Try a different pair!",
  "Ooh, close but different! What else could you try?",
  "Nope, not the same amount. Keep exploring!",
];

const EXPLORATION_PROMPTS = [
  "Try dragging a block into a comparison box! What happens?",
  "Pick two blocks and see — are they secretly the same?",
  "What if you put 1/2 and 2/4 in the boxes? Try it!",
  "Grab a block and drop it in a box! Let's compare!",
];

const DISCOVERY_PROMPTS = [
  "You're finding patterns! Try splitting a big block into smaller pieces!",
  "What happens if you smash a block? Try the split tool!",
  "Can you find MORE twins? There are secrets hiding everywhere!",
  "You're a fraction detective! Keep searching for matches!",
];

const PRACTICE_PROMPTS = [
  "Nice! Can you find one more matching pair?",
  "You're getting so good! Find another set of twins!",
  "Challenge: can you find a match nobody else would notice?",
];

const WELCOME_MESSAGES = [
  "Hey there! Ready to explore fractions? Let's go!",
  "Welcome! Today we're going to discover something really cool about fractions!",
  "Hi! Let's play with fractions together — it's going to be fun!",
];

const CELEBRATION_MESSAGES = [
  "You did it! You're officially a fraction expert!",
  "WOW! Look how much you learned today! I'm so proud!",
  "You crushed it! Fractions have no secrets from you now!",
  "Amazing work today! You should feel really proud!",
];

// ─── Mission-aware hint selection ───────────────────────────────────

function getHintForMission(missionPrompt: string): string {
  const lower = missionPrompt.toLowerCase();
  if (lower.includes("color") || lower.includes("shade") || lower.includes("tap")) {
    return pick(HINT_RESPONSES_SHADE);
  }
  if (lower.includes("split") || lower.includes("cut") || lower.includes("slice")) {
    return pick(HINT_RESPONSES_PARTITION);
  }
  if (lower.includes("which") || lower.includes("pick") || lower.includes("count")) {
    return pick(HINT_RESPONSES_IDENTIFY);
  }
  return pick(HINT_RESPONSES_GENERIC);
}

// ─── Main entry point ───────────────────────────────────────────────

export function getScriptedResponse(
  messages: { role: string; content: string }[],
  workspaceState: any,
): string {
  const ws = workspaceState || {};
  const lastUserMsg =
    [...messages].reverse().find((m) => m.role === "user")?.content || "";

  // --- Episode mode ---
  if (ws.episodeMode) {
    // Correct answer
    if (lastUserMsg.includes("[Student completed")) {
      return pick(CORRECT_RESPONSES);
    }
    // Wrong answer — with attempt count awareness
    if (lastUserMsg.includes("[Student got it wrong")) {
      if (lastUserMsg.includes("attempt 3") || lastUserMsg.includes("attempt 4")) {
        return pick(HINT_RESPONSES_GENERIC) + " You're almost there!";
      }
      return pick(WRONG_RESPONSES);
    }
    // Hint request — context-aware
    if (lastUserMsg.includes("[Student asked for hint")) {
      const mission = ws.currentMissionPrompt || "";
      return getHintForMission(mission);
    }
    // Student said something in chat
    if (!lastUserMsg.startsWith("[")) {
      // Real student message — respond warmly
      const lower = lastUserMsg.toLowerCase();
      if (lower.includes("help") || lower.includes("don't know") || lower.includes("stuck")) {
        return pick(["I'm here to help! " + getHintForMission(ws.currentMissionPrompt || ""), "No worries! Let me help — " + getHintForMission(ws.currentMissionPrompt || "")]);
      }
      if (lower.includes("yay") || lower.includes("yes") || lower.includes("cool") || lower.includes("!")) {
        return pick(["Right?! This is so fun!", "I know, right?! You're doing amazing!", "Wooo! Let's keep going!"]);
      }
      if (lower.includes("?")) {
        return pick(["Great question! Look at the pieces carefully — what do you notice?", "Hmm, let's figure it out! What do you see?", "I love that you're thinking! Try it and see what happens!"]);
      }
    }
    return pick(ENCOURAGE_RESPONSES);
  }

  // --- Free play mode ---
  const phase = ws.lessonPhase || "intro";

  switch (phase) {
    case "intro":
      return pick(WELCOME_MESSAGES);

    case "exploration": {
      const left = ws.comparisonLeft;
      const right = ws.comparisonRight;
      if (left && right) {
        const leftVal = typeof left === "object" ? left.numerator / left.denominator : null;
        const rightVal = typeof right === "object" ? right.numerator / right.denominator : null;
        if (leftVal != null && rightVal != null && leftVal === rightVal) {
          const lbl = `${left.numerator}/${left.denominator}`;
          const rbl = `${right.numerator}/${right.denominator}`;
          return pick(MATCH_FOUND).replace("{left}", lbl).replace("{right}", rbl);
        }
        return pick(NO_MATCH);
      }
      return pick(EXPLORATION_PROMPTS);
    }

    case "discovery":
      return pick(DISCOVERY_PROMPTS);

    case "practice":
      return pick(PRACTICE_PROMPTS);

    case "assessment":
      return pick(["Final challenge! Find one more match to prove you're a pro!", "Almost done! Show me one more matching pair!", "Last one! Can you find the hidden twins?"]);

    case "celebration":
      return pick(CELEBRATION_MESSAGES);

    default:
      return pick(ENCOURAGE_RESPONSES);
  }
}
