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
  "YES! Wait— did you just— YOU DID!",
  "WHOA WHOA WHOA. That's right! How did you know?!",
  "Okay okay okay I'm not gonna freak out but... THAT WAS PERFECT!",
  "Hold on. Hold ON. You just nailed it! Are you a wizard?!",
  "That's it! I KNEW you'd get it! I believed in you the whole time!",
  "High five! ...okay I can't high five I'm in an app but STILL!",
  "Oh wow you got it! I didn't even help! ...okay I helped a little.",
  "YESSS! You should do a victory dance right now. I'll wait.",
  "You are seriously SO good at this! Like, suspiciously good!",
  "Wait WHAT?! That was perfect! Are you secretly a math teacher?!",
];

const WRONG_RESPONSES = [
  "Ooh! Not quite — but don't worry, these are sneaky! Try again!",
  "Hmm, almost! That one's tricky. Give it one more shot!",
  "Oh that's a tricky one! Look real carefully and try again.",
  "Not that one — but I LOVE that you tried! Go again go again!",
  "Close! Take another look at the pieces. Count them!",
  "Oopsie! No worries, even I get confused sometimes! Try again!",
  "Tricky tricky! These fractions are being sneaky! You'll get it!",
  "Hmm, nope! But hey — wrong answers are how we learn! Try another!",
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
  "You can do it! Take your time, I'll wait right here!",
  "I'm right here with you! Give it a try — what's the worst that can happen?",
  "You're doing SO great! What do you think?",
  "Go for it! There's no wrong way to explore! ...well okay there ARE wrong answers but that's fine!",
  "Hmm, what do you notice about the pieces? Look real carefully!",
  "Let's figure this out together! I'll be your sidekick!",
  "Take a look — what do you see? I see something interesting...",
  "Hey hey hey! You've got this! I believe in you!",
];

const MATCH_FOUND = [
  "WHOA! Wait wait wait— {left} and {right} are the SAME?! You found it!",
  "Hold on— {left} and {right} are SECRET TWINS?! That's wild! You discovered it!",
  "Mind. Blown. {left} equals {right}! They look different but they're the same amount! WHAT!",
  "YES! {left} and {right} — different pieces, same amount! It's like magic but it's MATH!",
  "You cracked the code! {left} = {right}! You're basically a fraction detective!",
  "Okay I'm not gonna lie, {left} and {right} being the same still blows MY mind!",
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
  "Oh hi! Today we're gonna explore fractions! ...wait, don't leave, I promise it's actually really fun!",
  "HEY! You're here! Okay okay okay — today we're gonna discover something WILD about fractions!",
  "Welcome welcome welcome! Ready to play with fractions? Trust me, it's way cooler than it sounds!",
  "Oh hi everybody! ...I mean, oh hi YOU! Let's do some fraction stuff — it's gonna be awesome!",
];

const CELEBRATION_MESSAGES = [
  "You did it! You're officially a fraction expert! I can't believe— actually yes I can, you're amazing!",
  "WOW! Look how much you learned today! I'm actually getting emotional! ...okay I'm fine. But STILL!",
  "You crushed it! Fractions have NO secrets from you now! None! Zero! ...which is also a number!",
  "Okay that was SO good! You should feel really proud! I'm proud and I'm just an app character!",
  "That's all the time we have today but WOW what a session! Come back soon, okay?!",
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
        return pick(["RIGHT?! This is so fun! I'm having the best time!", "I KNOW! You're doing amazing! Keep going keep going!", "Wooo! I love your energy! Let's keep going!"]);
      }
      if (lower.includes("?")) {
        return pick(["Ooh good question! Look at the pieces carefully — what do you notice?", "Hmm, let's figure it out together! What do you see?", "I love that you're asking that! Try it and see what happens!"]);
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
