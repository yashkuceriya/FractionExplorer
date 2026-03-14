// ─── FractionLab Curriculum ──────────────────────────────────────────
// Common Core aligned for ages 7-10 (grades 2-4)
// Each episode: warmup → 3-4 missions → boss → exit ticket

export type ManipulativeType = "bar" | "circle" | "numberline" | "partition";
export type SkillTag =
  | "equal-parts"
  | "unit-fractions"
  | "build-fractions"
  | "number-line"
  | "equivalence"
  | "compare-same-denom"
  | "compare-same-numer"
  | "benchmark"
  | "complements"
  | "mixed-numbers"
  | "add-same-denom"
  | "subtract-same-denom"
  | "magnitude"
  | "word-problems";

export type MissionType =
  | "partition-shape"
  | "shade-fraction"
  | "place-numberline"
  | "find-equivalent"
  | "compare"
  | "build-from-units"
  | "complement"
  | "add-fractions"
  | "identify"
  | "benchmark-sort";

export interface Mission {
  type: MissionType;
  manipulative: ManipulativeType;
  prompt: string;
  fraction: { n: number; d: number };
  answer?: { n: number; d: number };
  choices?: { n: number; d: number }[];
  xpReward: number;
  hintAfterWrong: number;
  hints: string[];
}

export interface Episode {
  id: number;
  title: string;
  subtitle: string;
  emoji: string;
  skills: SkillTag[];
  gradeLevel: string;
  warmup: Mission;
  missions: Mission[];
  boss: Mission;
  exitTicket: Mission;
}

// ─── All 18 Episodes ────────────────────────────────────────────────

export const CURRICULUM: Episode[] = [
  // ── Episode 1: Equal Shares ──────────────────────────────────────
  {
    id: 1,
    title: "Fair Shares",
    subtitle: "Split things equally!",
    emoji: "🍕",
    skills: ["equal-parts"],
    gradeLevel: "2",
    warmup: {
      type: "partition-shape",
      manipulative: "bar",
      prompt: "Let's share! Can you split this cookie bar into 2 equal pieces?",
      fraction: { n: 1, d: 2 },
      xpReward: 5,
      hintAfterWrong: 2,
      hints: [
        "Sharing means making pieces the SAME size!",
        "Tap right in the middle to split it in two!",
      ],
    },
    missions: [
      {
        type: "shade-fraction",
        manipulative: "bar",
        prompt: "We split the cookie in 2! Now color YOUR piece — that's 1 out of 2!",
        fraction: { n: 1, d: 2 },
        xpReward: 10,
        hintAfterWrong: 2,
        hints: [
          "You get 1 piece out of 2. Tap ONE piece!",
          "1 out of 2 = one half! Tap one piece to color it.",
        ],
      },
      {
        type: "partition-shape",
        manipulative: "circle",
        prompt: "Now a pizza! Split it into 4 equal slices to share with friends!",
        fraction: { n: 1, d: 4 },
        xpReward: 10,
        hintAfterWrong: 2,
        hints: [
          "4 friends = 4 equal slices!",
          "Cut it in half, then cut each half in half!",
        ],
      },
      {
        type: "shade-fraction",
        manipulative: "circle",
        prompt: "Awesome pizza! Now tap YOUR slice — you get 1 out of 4!",
        fraction: { n: 1, d: 4 },
        xpReward: 10,
        hintAfterWrong: 2,
        hints: [
          "You get 1 slice! Tap just ONE piece to color it.",
          "1 out of 4 slices is yours — tap any single slice!",
        ],
      },
    ],
    boss: {
      type: "partition-shape",
      manipulative: "circle",
      prompt: "Party time! Split this cake into 6 equal pieces so everyone gets a fair share!",
      fraction: { n: 1, d: 6 },
      xpReward: 25,
      hintAfterWrong: 2,
      hints: [
        "6 friends at the party = 6 equal slices!",
        "Try making three cuts through the center.",
      ],
    },
    exitTicket: {
      type: "shade-fraction",
      manipulative: "bar",
      prompt: "Last one! This bar has 3 pieces. Color 1 piece — that's 1 out of 3!",
      fraction: { n: 1, d: 3 },
      xpReward: 10,
      hintAfterWrong: 1,
      hints: ["Tap just ONE piece to color it. 1 out of 3!"],
    },
  },

  // ── Episode 2: Unit Fractions ────────────────────────────────────
  {
    id: 2,
    title: "One Piece at a Time",
    subtitle: "What do the numbers mean?",
    emoji: "🧩",
    skills: ["unit-fractions"],
    gradeLevel: "2",
    warmup: {
      type: "shade-fraction",
      manipulative: "bar",
      prompt: "This bar has 2 pieces. Color 1 piece — that's called ONE HALF!",
      fraction: { n: 1, d: 2 },
      xpReward: 5,
      hintAfterWrong: 2,
      hints: [
        "1 out of 2 pieces! Tap one piece to color it.",
        "The bottom number (2) = total pieces. Top number (1) = pieces you color!",
      ],
    },
    missions: [
      {
        type: "shade-fraction",
        manipulative: "circle",
        prompt: "This circle has 3 slices. Color 1 slice — that's ONE THIRD!",
        fraction: { n: 1, d: 3 },
        xpReward: 10,
        hintAfterWrong: 2,
        hints: [
          "One third means 1 out of 3 equal parts.",
          "The circle has 3 slices — shade just one!",
        ],
      },
      {
        type: "shade-fraction",
        manipulative: "bar",
        prompt: "Can you shade 1/4 of this bar?",
        fraction: { n: 1, d: 4 },
        xpReward: 10,
        hintAfterWrong: 2,
        hints: [
          "One fourth means 1 out of 4 equal parts.",
          "The bar has 4 pieces — shade just one!",
        ],
      },
      {
        type: "identify",
        manipulative: "circle",
        prompt: "Which circle shows 1/2?",
        fraction: { n: 1, d: 2 },
        choices: [
          { n: 1, d: 2 },
          { n: 1, d: 3 },
          { n: 1, d: 4 },
        ],
        xpReward: 10,
        hintAfterWrong: 1,
        hints: [
          "One half means one out of two equal parts is shaded.",
        ],
      },
    ],
    boss: {
      type: "shade-fraction",
      manipulative: "circle",
      prompt: "Boss time! Shade exactly 1/6 of this pizza!",
      fraction: { n: 1, d: 6 },
      xpReward: 25,
      hintAfterWrong: 2,
      hints: [
        "1/6 means one out of six equal slices.",
        "Count the slices: 6 total. Shade just one!",
      ],
    },
    exitTicket: {
      type: "identify",
      manipulative: "bar",
      prompt: "Pick the picture that shows 1/4!",
      fraction: { n: 1, d: 4 },
      choices: [
        { n: 1, d: 2 },
        { n: 1, d: 3 },
        { n: 1, d: 4 },
      ],
      xpReward: 10,
      hintAfterWrong: 1,
      hints: ["1/4 means 1 part shaded out of 4 equal parts."],
    },
  },

  // ── Episode 3: More Parts = Smaller Pieces ──────────────────────
  {
    id: 3,
    title: "Smaller and Smaller",
    subtitle: "More parts means smaller pieces!",
    emoji: "🔍",
    skills: ["unit-fractions", "compare-same-numer"],
    gradeLevel: "2",
    warmup: {
      type: "compare",
      manipulative: "bar",
      prompt: "Which is bigger: 1/2 or 1/4?",
      fraction: { n: 1, d: 2 },
      answer: { n: 1, d: 2 },
      choices: [
        { n: 1, d: 2 },
        { n: 1, d: 4 },
      ],
      xpReward: 5,
      hintAfterWrong: 1,
      hints: [
        "Fewer parts means each part is bigger!",
        "Half of a pizza is bigger than a quarter.",
      ],
    },
    missions: [
      {
        type: "compare",
        manipulative: "bar",
        prompt: "Which is bigger: 1/3 or 1/6?",
        fraction: { n: 1, d: 3 },
        answer: { n: 1, d: 3 },
        choices: [
          { n: 1, d: 3 },
          { n: 1, d: 6 },
        ],
        xpReward: 10,
        hintAfterWrong: 1,
        hints: [
          "More slices means each slice is smaller!",
          "1/3 has bigger pieces than 1/6.",
        ],
      },
      {
        type: "compare",
        manipulative: "circle",
        prompt: "Which is bigger: 1/2 or 1/8?",
        fraction: { n: 1, d: 2 },
        answer: { n: 1, d: 2 },
        choices: [
          { n: 1, d: 2 },
          { n: 1, d: 8 },
        ],
        xpReward: 10,
        hintAfterWrong: 1,
        hints: [
          "Think about pizza — half or one eighth?",
          "2 slices total vs 8 slices total. Which piece is bigger?",
        ],
      },
      {
        type: "compare",
        manipulative: "bar",
        prompt: "Which is bigger: 1/4 or 1/3?",
        fraction: { n: 1, d: 3 },
        answer: { n: 1, d: 3 },
        choices: [
          { n: 1, d: 4 },
          { n: 1, d: 3 },
        ],
        xpReward: 10,
        hintAfterWrong: 2,
        hints: [
          "Careful! Bigger denominator = smaller piece.",
          "3 parts makes bigger pieces than 4 parts.",
        ],
      },
    ],
    boss: {
      type: "compare",
      manipulative: "bar",
      prompt: "Tricky! Put these in order from smallest to biggest: 1/8, 1/2, 1/4!",
      fraction: { n: 1, d: 8 },
      answer: { n: 1, d: 2 },
      xpReward: 25,
      hintAfterWrong: 2,
      hints: [
        "More parts = smaller piece. Fewer parts = bigger piece.",
        "1/8 is tiny, 1/4 is medium, 1/2 is the biggest!",
      ],
    },
    exitTicket: {
      type: "compare",
      manipulative: "circle",
      prompt: "Which is smaller: 1/3 or 1/4?",
      fraction: { n: 1, d: 4 },
      answer: { n: 1, d: 4 },
      choices: [
        { n: 1, d: 3 },
        { n: 1, d: 4 },
      ],
      xpReward: 10,
      hintAfterWrong: 1,
      hints: ["4 parts means each one is smaller than 3 parts."],
    },
  },

  // ── Episode 4: Building Fractions ────────────────────────────────
  {
    id: 4,
    title: "Fraction Builders",
    subtitle: "Build fractions piece by piece!",
    emoji: "🏗️",
    skills: ["build-fractions"],
    gradeLevel: "3",
    warmup: {
      type: "build-from-units",
      manipulative: "bar",
      prompt: "Build 2/4! Put two 1/4 pieces together!",
      fraction: { n: 2, d: 4 },
      xpReward: 5,
      hintAfterWrong: 2,
      hints: [
        "2/4 means two pieces, each 1/4 big.",
        "Tap two of the four parts to shade them!",
      ],
    },
    missions: [
      {
        type: "build-from-units",
        manipulative: "bar",
        prompt: "Build 3/4! Use three 1/4 pieces!",
        fraction: { n: 3, d: 4 },
        xpReward: 10,
        hintAfterWrong: 2,
        hints: [
          "3/4 = three pieces that are each 1/4.",
          "Shade 3 out of 4 equal parts!",
        ],
      },
      {
        type: "build-from-units",
        manipulative: "circle",
        prompt: "Build 2/3 of this circle!",
        fraction: { n: 2, d: 3 },
        xpReward: 10,
        hintAfterWrong: 2,
        hints: [
          "2/3 = two pieces that are each 1/3.",
          "The circle has 3 slices — shade two!",
        ],
      },
      {
        type: "shade-fraction",
        manipulative: "bar",
        prompt: "Shade 5/6 of this bar!",
        fraction: { n: 5, d: 6 },
        xpReward: 10,
        hintAfterWrong: 2,
        hints: [
          "5/6 means 5 out of 6 parts!",
          "Almost the whole thing — leave just one part blank!",
        ],
      },
      {
        type: "identify",
        manipulative: "circle",
        prompt: "Which picture shows 3/4?",
        fraction: { n: 3, d: 4 },
        choices: [
          { n: 2, d: 4 },
          { n: 3, d: 4 },
          { n: 1, d: 4 },
        ],
        xpReward: 10,
        hintAfterWrong: 1,
        hints: ["3/4 means 3 out of 4 parts are shaded."],
      },
    ],
    boss: {
      type: "build-from-units",
      manipulative: "bar",
      prompt: "Boss challenge! Build 5/8 — that's five 1/8 pieces!",
      fraction: { n: 5, d: 8 },
      xpReward: 25,
      hintAfterWrong: 2,
      hints: [
        "5/8 means 5 pieces out of 8 total.",
        "Count carefully: shade exactly 5 parts!",
      ],
    },
    exitTicket: {
      type: "build-from-units",
      manipulative: "circle",
      prompt: "Build 3/6 of this circle!",
      fraction: { n: 3, d: 6 },
      xpReward: 10,
      hintAfterWrong: 1,
      hints: ["3/6 = three out of six equal slices!"],
    },
  },

  // ── Episode 5: Number Line 0–1 ──────────────────────────────────
  {
    id: 5,
    title: "The Fraction Line",
    subtitle: "Fractions live on a number line!",
    emoji: "📏",
    skills: ["number-line"],
    gradeLevel: "3",
    warmup: {
      type: "place-numberline",
      manipulative: "numberline",
      prompt: "Place 1/2 on the number line!",
      fraction: { n: 1, d: 2 },
      xpReward: 5,
      hintAfterWrong: 2,
      hints: [
        "1/2 is exactly in the middle between 0 and 1.",
        "Find the halfway point!",
      ],
    },
    missions: [
      {
        type: "place-numberline",
        manipulative: "numberline",
        prompt: "Place 1/4 on the number line!",
        fraction: { n: 1, d: 4 },
        xpReward: 10,
        hintAfterWrong: 2,
        hints: [
          "Split the line into 4 equal jumps.",
          "1/4 is one jump from 0!",
        ],
      },
      {
        type: "place-numberline",
        manipulative: "numberline",
        prompt: "Where does 3/4 go?",
        fraction: { n: 3, d: 4 },
        xpReward: 10,
        hintAfterWrong: 2,
        hints: [
          "Split into 4 jumps. 3/4 is three jumps from 0.",
          "3/4 is between 1/2 and 1, closer to 1!",
        ],
      },
      {
        type: "place-numberline",
        manipulative: "numberline",
        prompt: "Place 2/3 on the line!",
        fraction: { n: 2, d: 3 },
        xpReward: 10,
        hintAfterWrong: 2,
        hints: [
          "Split into 3 equal parts. Go to the second mark.",
          "2/3 is past the halfway point!",
        ],
      },
    ],
    boss: {
      type: "place-numberline",
      manipulative: "numberline",
      prompt: "Place 5/6 on the number line. That's almost 1!",
      fraction: { n: 5, d: 6 },
      xpReward: 25,
      hintAfterWrong: 2,
      hints: [
        "Split into 6 parts. Count 5 from 0.",
        "5/6 is very close to 1 — just one part away!",
      ],
    },
    exitTicket: {
      type: "place-numberline",
      manipulative: "numberline",
      prompt: "Show me where 1/3 goes!",
      fraction: { n: 1, d: 3 },
      xpReward: 10,
      hintAfterWrong: 1,
      hints: ["Split the line into 3 equal parts. 1/3 is the first mark!"],
    },
  },

  // ── Episode 6: Beyond 1 — Improper Fractions ────────────────────
  {
    id: 6,
    title: "Past the Finish Line",
    subtitle: "Fractions bigger than 1!",
    emoji: "🚀",
    skills: ["number-line", "build-fractions"],
    gradeLevel: "3",
    warmup: {
      type: "place-numberline",
      manipulative: "numberline",
      prompt: "Place 4/4 on the number line. Hmm, what number is that?",
      fraction: { n: 4, d: 4 },
      xpReward: 5,
      hintAfterWrong: 2,
      hints: [
        "4 out of 4 is the whole thing!",
        "4/4 = 1. Place it right on the 1!",
      ],
    },
    missions: [
      {
        type: "place-numberline",
        manipulative: "numberline",
        prompt: "Place 5/4 on the number line (it goes 0 to 2)!",
        fraction: { n: 5, d: 4 },
        xpReward: 10,
        hintAfterWrong: 2,
        hints: [
          "5/4 is MORE than 1 whole!",
          "It's one whole plus 1/4 more. Just past the 1!",
        ],
      },
      {
        type: "build-from-units",
        manipulative: "bar",
        prompt: "Build 5/3 using 1/3 pieces! You'll need more than one whole bar!",
        fraction: { n: 5, d: 3 },
        xpReward: 10,
        hintAfterWrong: 2,
        hints: [
          "5/3 = five pieces that are each 1/3.",
          "That's one whole bar (3/3) plus 2/3 more!",
        ],
      },
      {
        type: "place-numberline",
        manipulative: "numberline",
        prompt: "Where does 7/4 live on the number line?",
        fraction: { n: 7, d: 4 },
        xpReward: 10,
        hintAfterWrong: 2,
        hints: [
          "7/4 is past 1! It's 1 and 3/4.",
          "Count: 4/4 is 1, then 3 more fourths!",
        ],
      },
    ],
    boss: {
      type: "place-numberline",
      manipulative: "numberline",
      prompt: "Boss challenge! Place 8/3 on the number line!",
      fraction: { n: 8, d: 3 },
      xpReward: 25,
      hintAfterWrong: 2,
      hints: [
        "8/3 is way past 1! How many wholes is that?",
        "3/3 = 1, 6/3 = 2, so 8/3 is between 2 and 3!",
      ],
    },
    exitTicket: {
      type: "place-numberline",
      manipulative: "numberline",
      prompt: "Place 3/2 on the line!",
      fraction: { n: 3, d: 2 },
      xpReward: 10,
      hintAfterWrong: 1,
      hints: ["3/2 = 1 and 1/2. It's between 1 and 2!"],
    },
  },

  // ── Episode 7: Equivalent Fractions ─────────────────────────────
  {
    id: 7,
    title: "Same But Different",
    subtitle: "Different names, same amount!",
    emoji: "🪄",
    skills: ["equivalence"],
    gradeLevel: "3",
    warmup: {
      type: "find-equivalent",
      manipulative: "bar",
      prompt: "1/2 and 2/4 — are they the same amount? Let's see!",
      fraction: { n: 1, d: 2 },
      answer: { n: 2, d: 4 },
      xpReward: 5,
      hintAfterWrong: 2,
      hints: [
        "Shade 1/2 on one bar. Shade 2/4 on another. Compare!",
        "They cover the same amount — they're equivalent!",
      ],
    },
    missions: [
      {
        type: "find-equivalent",
        manipulative: "bar",
        prompt: "Find a fraction equal to 1/3! Split the bar into more parts!",
        fraction: { n: 1, d: 3 },
        answer: { n: 2, d: 6 },
        xpReward: 10,
        hintAfterWrong: 2,
        hints: [
          "What if you cut each third in half?",
          "1/3 = 2/6! Each third becomes two sixths!",
        ],
      },
      {
        type: "find-equivalent",
        manipulative: "circle",
        prompt: "2/4 is the same as... what simpler fraction?",
        fraction: { n: 2, d: 4 },
        answer: { n: 1, d: 2 },
        xpReward: 10,
        hintAfterWrong: 2,
        hints: [
          "Can you combine parts to make fewer, bigger pieces?",
          "2/4 = 1/2! Two quarters make one half!",
        ],
      },
      {
        type: "find-equivalent",
        manipulative: "bar",
        prompt: "Find a fraction equal to 3/4!",
        fraction: { n: 3, d: 4 },
        answer: { n: 6, d: 8 },
        xpReward: 10,
        hintAfterWrong: 2,
        hints: [
          "Split each fourth into two parts.",
          "3/4 = 6/8! Double the top and bottom!",
        ],
      },
    ],
    boss: {
      type: "find-equivalent",
      manipulative: "bar",
      prompt: "Boss! Find TWO fractions equal to 2/3!",
      fraction: { n: 2, d: 3 },
      answer: { n: 4, d: 6 },
      xpReward: 25,
      hintAfterWrong: 2,
      hints: [
        "Multiply top and bottom by the same number!",
        "2/3 = 4/6 = 6/9. Try splitting each third!",
      ],
    },
    exitTicket: {
      type: "find-equivalent",
      manipulative: "circle",
      prompt: "Are 2/6 and 1/3 equal?",
      fraction: { n: 2, d: 6 },
      answer: { n: 1, d: 3 },
      xpReward: 10,
      hintAfterWrong: 1,
      hints: ["Shade them both and compare!"],
    },
  },

  // ── Episode 8: Compare Same Denominator ─────────────────────────
  {
    id: 8,
    title: "Same Slices, Different Amounts",
    subtitle: "Same size pieces — who has more?",
    emoji: "⚖️",
    skills: ["compare-same-denom"],
    gradeLevel: "3",
    warmup: {
      type: "compare",
      manipulative: "bar",
      prompt: "Which is more: 2/4 or 3/4?",
      fraction: { n: 3, d: 4 },
      answer: { n: 3, d: 4 },
      choices: [
        { n: 2, d: 4 },
        { n: 3, d: 4 },
      ],
      xpReward: 5,
      hintAfterWrong: 1,
      hints: [
        "Same size pieces! Just count how many.",
        "3 pieces is more than 2 pieces!",
      ],
    },
    missions: [
      {
        type: "compare",
        manipulative: "bar",
        prompt: "Which is bigger: 1/6 or 4/6?",
        fraction: { n: 4, d: 6 },
        answer: { n: 4, d: 6 },
        choices: [
          { n: 1, d: 6 },
          { n: 4, d: 6 },
        ],
        xpReward: 10,
        hintAfterWrong: 1,
        hints: [
          "Same denominator — same size slices.",
          "4 slices beats 1 slice!",
        ],
      },
      {
        type: "compare",
        manipulative: "circle",
        prompt: "Which is bigger: 5/8 or 3/8?",
        fraction: { n: 5, d: 8 },
        answer: { n: 5, d: 8 },
        choices: [
          { n: 5, d: 8 },
          { n: 3, d: 8 },
        ],
        xpReward: 10,
        hintAfterWrong: 1,
        hints: [
          "Both are eighths! Who has more pieces?",
          "5 eighths > 3 eighths!",
        ],
      },
      {
        type: "compare",
        manipulative: "bar",
        prompt: "Which is bigger: 7/8 or 6/8?",
        fraction: { n: 7, d: 8 },
        answer: { n: 7, d: 8 },
        choices: [
          { n: 7, d: 8 },
          { n: 6, d: 8 },
        ],
        xpReward: 10,
        hintAfterWrong: 1,
        hints: [
          "Same size pieces. More pieces = bigger fraction!",
        ],
      },
    ],
    boss: {
      type: "compare",
      manipulative: "bar",
      prompt: "Order these from smallest to biggest: 1/5, 4/5, 2/5!",
      fraction: { n: 1, d: 5 },
      answer: { n: 4, d: 5 },
      xpReward: 25,
      hintAfterWrong: 2,
      hints: [
        "All fifths! Just count the pieces.",
        "1/5 < 2/5 < 4/5 — more pieces means more!",
      ],
    },
    exitTicket: {
      type: "compare",
      manipulative: "circle",
      prompt: "Which is bigger: 2/6 or 5/6?",
      fraction: { n: 5, d: 6 },
      answer: { n: 5, d: 6 },
      choices: [
        { n: 2, d: 6 },
        { n: 5, d: 6 },
      ],
      xpReward: 10,
      hintAfterWrong: 1,
      hints: ["Same denominator, more numerator wins!"],
    },
  },

  // ── Episode 9: Compare Same Numerator ───────────────────────────
  {
    id: 9,
    title: "Same Pieces, Different Sizes",
    subtitle: "Same number of pieces — but which are bigger?",
    emoji: "🎯",
    skills: ["compare-same-numer"],
    gradeLevel: "3",
    warmup: {
      type: "compare",
      manipulative: "bar",
      prompt: "Which is bigger: 2/3 or 2/6?",
      fraction: { n: 2, d: 3 },
      answer: { n: 2, d: 3 },
      choices: [
        { n: 2, d: 3 },
        { n: 2, d: 6 },
      ],
      xpReward: 5,
      hintAfterWrong: 1,
      hints: [
        "Same number of pieces, but thirds are BIGGER than sixths!",
        "Fewer total parts = bigger pieces!",
      ],
    },
    missions: [
      {
        type: "compare",
        manipulative: "bar",
        prompt: "Which is bigger: 3/4 or 3/8?",
        fraction: { n: 3, d: 4 },
        answer: { n: 3, d: 4 },
        choices: [
          { n: 3, d: 4 },
          { n: 3, d: 8 },
        ],
        xpReward: 10,
        hintAfterWrong: 1,
        hints: [
          "3 pieces each, but fourths are bigger than eighths!",
          "Smaller denominator = bigger pieces!",
        ],
      },
      {
        type: "compare",
        manipulative: "circle",
        prompt: "Which is bigger: 1/3 or 1/5?",
        fraction: { n: 1, d: 3 },
        answer: { n: 1, d: 3 },
        choices: [
          { n: 1, d: 3 },
          { n: 1, d: 5 },
        ],
        xpReward: 10,
        hintAfterWrong: 1,
        hints: [
          "One piece of each — but thirds are bigger than fifths!",
        ],
      },
      {
        type: "compare",
        manipulative: "bar",
        prompt: "Which is bigger: 4/6 or 4/8?",
        fraction: { n: 4, d: 6 },
        answer: { n: 4, d: 6 },
        choices: [
          { n: 4, d: 6 },
          { n: 4, d: 8 },
        ],
        xpReward: 10,
        hintAfterWrong: 2,
        hints: [
          "Same number of pieces! Which pieces are bigger?",
          "Sixths are bigger than eighths. So 4/6 > 4/8!",
        ],
      },
    ],
    boss: {
      type: "compare",
      manipulative: "bar",
      prompt: "Order from biggest to smallest: 2/8, 2/4, 2/3!",
      fraction: { n: 2, d: 3 },
      answer: { n: 2, d: 3 },
      xpReward: 25,
      hintAfterWrong: 2,
      hints: [
        "All have 2 pieces. Which pieces are biggest?",
        "2/3 > 2/4 > 2/8 — smaller denominator wins!",
      ],
    },
    exitTicket: {
      type: "compare",
      manipulative: "circle",
      prompt: "Which is bigger: 3/5 or 3/6?",
      fraction: { n: 3, d: 5 },
      answer: { n: 3, d: 5 },
      choices: [
        { n: 3, d: 5 },
        { n: 3, d: 6 },
      ],
      xpReward: 10,
      hintAfterWrong: 1,
      hints: ["Same number of pieces — fifths are bigger than sixths!"],
    },
  },

  // ── Episode 10: Benchmark Comparisons ───────────────────────────
  {
    id: 10,
    title: "Zero, Half, or One?",
    subtitle: "Use benchmarks to estimate fractions!",
    emoji: "🏁",
    skills: ["benchmark", "magnitude"],
    gradeLevel: "3",
    warmup: {
      type: "benchmark-sort",
      manipulative: "numberline",
      prompt: "Is 1/4 closer to 0 or 1/2?",
      fraction: { n: 1, d: 4 },
      answer: { n: 1, d: 4 },
      xpReward: 5,
      hintAfterWrong: 1,
      hints: [
        "1/4 is halfway to 1/2. It's closer to 0!",
        "Think of the number line — 1/4 is in the first half.",
      ],
    },
    missions: [
      {
        type: "benchmark-sort",
        manipulative: "numberline",
        prompt: "Is 5/8 closer to 1/2 or 1?",
        fraction: { n: 5, d: 8 },
        answer: { n: 1, d: 2 },
        xpReward: 10,
        hintAfterWrong: 2,
        hints: [
          "4/8 = 1/2. Is 5/8 much past that?",
          "5/8 is just a little past 1/2 — closer to 1/2!",
        ],
      },
      {
        type: "benchmark-sort",
        manipulative: "numberline",
        prompt: "Is 7/8 closer to 1/2 or 1?",
        fraction: { n: 7, d: 8 },
        answer: { n: 1, d: 1 },
        xpReward: 10,
        hintAfterWrong: 1,
        hints: [
          "7/8 is just one eighth away from 1. Super close to 1!",
        ],
      },
      {
        type: "benchmark-sort",
        manipulative: "numberline",
        prompt: "Is 1/6 closer to 0 or 1/2?",
        fraction: { n: 1, d: 6 },
        answer: { n: 0, d: 1 },
        xpReward: 10,
        hintAfterWrong: 1,
        hints: [
          "1/6 is tiny! It's much closer to 0.",
        ],
      },
    ],
    boss: {
      type: "benchmark-sort",
      manipulative: "numberline",
      prompt: "Sort these into groups: closer to 0, closer to 1/2, closer to 1! Fractions: 1/8, 4/6, 3/8, 7/8!",
      fraction: { n: 1, d: 8 },
      xpReward: 25,
      hintAfterWrong: 2,
      hints: [
        "Think about each one: is it near the start, middle, or end?",
        "Near 0: 1/8. Near 1/2: 3/8. Near 1: 4/6, 7/8.",
      ],
    },
    exitTicket: {
      type: "benchmark-sort",
      manipulative: "numberline",
      prompt: "Is 5/6 closer to 1/2 or 1?",
      fraction: { n: 5, d: 6 },
      answer: { n: 1, d: 1 },
      xpReward: 10,
      hintAfterWrong: 1,
      hints: ["5/6 is almost a whole — just one sixth away from 1!"],
    },
  },

  // ── Episode 11: Complements to 1 ───────────────────────────────
  {
    id: 11,
    title: "The Missing Piece",
    subtitle: "What's needed to make a whole?",
    emoji: "🧩",
    skills: ["complements"],
    gradeLevel: "3",
    warmup: {
      type: "complement",
      manipulative: "bar",
      prompt: "I have 3/4. How much more do I need to make 1 whole?",
      fraction: { n: 3, d: 4 },
      answer: { n: 1, d: 4 },
      xpReward: 5,
      hintAfterWrong: 2,
      hints: [
        "Look at the bar — how much is NOT shaded?",
        "3/4 + ?/4 = 4/4. The answer is 1/4!",
      ],
    },
    missions: [
      {
        type: "complement",
        manipulative: "bar",
        prompt: "I have 1/3. What's missing to make 1 whole?",
        fraction: { n: 1, d: 3 },
        answer: { n: 2, d: 3 },
        xpReward: 10,
        hintAfterWrong: 2,
        hints: [
          "1/3 + ?/3 = 3/3.",
          "You need 2 more thirds! 1/3 + 2/3 = 1!",
        ],
      },
      {
        type: "complement",
        manipulative: "circle",
        prompt: "I ate 5/6 of the pie. How much is left?",
        fraction: { n: 5, d: 6 },
        answer: { n: 1, d: 6 },
        xpReward: 10,
        hintAfterWrong: 2,
        hints: [
          "How many sixths are NOT eaten?",
          "5/6 + 1/6 = 6/6 = 1 whole pie!",
        ],
      },
      {
        type: "complement",
        manipulative: "bar",
        prompt: "I have 3/8. What plus 3/8 equals 1?",
        fraction: { n: 3, d: 8 },
        answer: { n: 5, d: 8 },
        xpReward: 10,
        hintAfterWrong: 2,
        hints: [
          "3/8 + ?/8 = 8/8.",
          "You need 5 more eighths!",
        ],
      },
    ],
    boss: {
      type: "complement",
      manipulative: "bar",
      prompt: "Boss! I have 7/10. Find the missing piece!",
      fraction: { n: 7, d: 10 },
      answer: { n: 3, d: 10 },
      xpReward: 25,
      hintAfterWrong: 2,
      hints: [
        "7/10 + ?/10 = 10/10.",
        "10 - 7 = 3. The answer is 3/10!",
      ],
    },
    exitTicket: {
      type: "complement",
      manipulative: "circle",
      prompt: "2/5 + ? = 1 whole. What's missing?",
      fraction: { n: 2, d: 5 },
      answer: { n: 3, d: 5 },
      xpReward: 10,
      hintAfterWrong: 1,
      hints: ["2/5 + 3/5 = 5/5 = 1!"],
    },
  },

  // ── Episode 12: Mixed Numbers ───────────────────────────────────
  {
    id: 12,
    title: "Wholes and Parts",
    subtitle: "Numbers with a whole AND a fraction!",
    emoji: "🎂",
    skills: ["mixed-numbers"],
    gradeLevel: "3",
    warmup: {
      type: "place-numberline",
      manipulative: "numberline",
      prompt: "Place 1 and 1/2 on the number line!",
      fraction: { n: 3, d: 2 },
      xpReward: 5,
      hintAfterWrong: 2,
      hints: [
        "1 and 1/2 is the same as 3/2.",
        "Go past 1, then halfway to 2!",
      ],
    },
    missions: [
      {
        type: "place-numberline",
        manipulative: "numberline",
        prompt: "Place 2 and 1/4 on the number line!",
        fraction: { n: 9, d: 4 },
        xpReward: 10,
        hintAfterWrong: 2,
        hints: [
          "Go to 2, then one fourth more!",
          "2 and 1/4 = 9/4. Just past the 2!",
        ],
      },
      {
        type: "build-from-units",
        manipulative: "bar",
        prompt: "Build 1 and 2/3 using 1/3 pieces!",
        fraction: { n: 5, d: 3 },
        xpReward: 10,
        hintAfterWrong: 2,
        hints: [
          "1 whole = 3/3. Then add 2/3 more!",
          "That's 5 third-pieces total: 5/3!",
        ],
      },
      {
        type: "identify",
        manipulative: "bar",
        prompt: "Which picture shows 1 and 3/4?",
        fraction: { n: 7, d: 4 },
        choices: [
          { n: 5, d: 4 },
          { n: 7, d: 4 },
          { n: 3, d: 4 },
        ],
        xpReward: 10,
        hintAfterWrong: 1,
        hints: ["1 and 3/4 = one full bar plus 3/4 of another!"],
      },
    ],
    boss: {
      type: "place-numberline",
      manipulative: "numberline",
      prompt: "Boss challenge! Place 2 and 3/4 on the number line!",
      fraction: { n: 11, d: 4 },
      xpReward: 25,
      hintAfterWrong: 2,
      hints: [
        "Go to 2, then 3/4 more toward 3!",
        "2 and 3/4 = 11/4. Almost at 3!",
      ],
    },
    exitTicket: {
      type: "place-numberline",
      manipulative: "numberline",
      prompt: "Place 1 and 1/3 on the line!",
      fraction: { n: 4, d: 3 },
      xpReward: 10,
      hintAfterWrong: 1,
      hints: ["1 and 1/3 = 4/3. Just past 1!"],
    },
  },

  // ── Episode 13: Story Problems — Sharing ────────────────────────
  {
    id: 13,
    title: "Share It Fair!",
    subtitle: "Solve real fraction problems!",
    emoji: "🍰",
    skills: ["word-problems", "equal-parts"],
    gradeLevel: "3",
    warmup: {
      type: "partition-shape",
      manipulative: "bar",
      prompt: "3 friends share 1 candy bar equally. How much does each friend get?",
      fraction: { n: 1, d: 3 },
      xpReward: 5,
      hintAfterWrong: 2,
      hints: [
        "Split the bar into 3 equal pieces!",
        "Each friend gets 1/3 of the bar!",
      ],
    },
    missions: [
      {
        type: "shade-fraction",
        manipulative: "circle",
        prompt: "4 kids share a pizza. Sam eats 2 slices. What fraction did Sam eat?",
        fraction: { n: 2, d: 4 },
        xpReward: 10,
        hintAfterWrong: 2,
        hints: [
          "4 kids, so 4 slices. Sam ate 2.",
          "Sam ate 2/4 of the pizza!",
        ],
      },
      {
        type: "shade-fraction",
        manipulative: "bar",
        prompt: "You have 6 strawberries. You eat 5. What fraction did you eat?",
        fraction: { n: 5, d: 6 },
        xpReward: 10,
        hintAfterWrong: 2,
        hints: [
          "6 total, 5 eaten.",
          "You ate 5/6 of the strawberries!",
        ],
      },
      {
        type: "complement",
        manipulative: "bar",
        prompt: "Mia read 2/5 of her book. How much is left to read?",
        fraction: { n: 2, d: 5 },
        answer: { n: 3, d: 5 },
        xpReward: 10,
        hintAfterWrong: 2,
        hints: [
          "The whole book is 5/5. She read 2/5.",
          "5/5 - 2/5 = 3/5 left!",
        ],
      },
    ],
    boss: {
      type: "shade-fraction",
      manipulative: "bar",
      prompt: "8 friends share 3 candy bars equally. How much does each friend get? Show it!",
      fraction: { n: 3, d: 8 },
      xpReward: 25,
      hintAfterWrong: 2,
      hints: [
        "3 bars split among 8 friends...",
        "Each friend gets 3/8 of a bar!",
      ],
    },
    exitTicket: {
      type: "partition-shape",
      manipulative: "circle",
      prompt: "5 friends share a cake. How much does each person get?",
      fraction: { n: 1, d: 5 },
      xpReward: 10,
      hintAfterWrong: 1,
      hints: ["Split into 5 equal pieces. Each person gets 1/5!"],
    },
  },

  // ── Episode 14: Measurement Problems ────────────────────────────
  {
    id: 14,
    title: "Measure Up!",
    subtitle: "Fractions are for measuring too!",
    emoji: "📐",
    skills: ["word-problems", "number-line"],
    gradeLevel: "3",
    warmup: {
      type: "place-numberline",
      manipulative: "numberline",
      prompt: "A ribbon is 3/4 of a foot long. Place it on the number line!",
      fraction: { n: 3, d: 4 },
      xpReward: 5,
      hintAfterWrong: 2,
      hints: [
        "3/4 is between 1/2 and 1.",
        "Split the line into fourths and count 3!",
      ],
    },
    missions: [
      {
        type: "place-numberline",
        manipulative: "numberline",
        prompt: "A bug walked 2/6 of a meter. Where is it?",
        fraction: { n: 2, d: 6 },
        xpReward: 10,
        hintAfterWrong: 2,
        hints: [
          "2/6 is the same as 1/3!",
          "Place it at the first third mark!",
        ],
      },
      {
        type: "compare",
        manipulative: "numberline",
        prompt: "One rope is 5/8 meter. Another is 3/8 meter. Which is longer?",
        fraction: { n: 5, d: 8 },
        answer: { n: 5, d: 8 },
        choices: [
          { n: 5, d: 8 },
          { n: 3, d: 8 },
        ],
        xpReward: 10,
        hintAfterWrong: 1,
        hints: [
          "Same denominator! More eighths = longer rope!",
        ],
      },
      {
        type: "place-numberline",
        manipulative: "numberline",
        prompt: "A plant grew 7/8 of an inch. Show how tall it is!",
        fraction: { n: 7, d: 8 },
        xpReward: 10,
        hintAfterWrong: 2,
        hints: [
          "7/8 is almost 1 whole inch!",
          "Just one eighth short of a full inch!",
        ],
      },
    ],
    boss: {
      type: "place-numberline",
      manipulative: "numberline",
      prompt: "A caterpillar walked 1 and 3/8 inches. Show where it stopped!",
      fraction: { n: 11, d: 8 },
      xpReward: 25,
      hintAfterWrong: 2,
      hints: [
        "Past 1 inch! Then 3/8 more!",
        "1 and 3/8 = 11/8. Between 1 and 2!",
      ],
    },
    exitTicket: {
      type: "place-numberline",
      manipulative: "numberline",
      prompt: "A crayon is 5/6 of an inch. Place it!",
      fraction: { n: 5, d: 6 },
      xpReward: 10,
      hintAfterWrong: 1,
      hints: ["5/6 is close to 1 — just one sixth short!"],
    },
  },

  // ── Episode 15: Add Fractions (Same Denominator) ────────────────
  {
    id: 15,
    title: "Add Them Up!",
    subtitle: "Adding fractions with same-size pieces!",
    emoji: "➕",
    skills: ["add-same-denom"],
    gradeLevel: "4",
    warmup: {
      type: "add-fractions",
      manipulative: "bar",
      prompt: "1/4 + 2/4 = ? Add the pieces!",
      fraction: { n: 1, d: 4 },
      answer: { n: 3, d: 4 },
      xpReward: 5,
      hintAfterWrong: 2,
      hints: [
        "Same size pieces! Just add the tops: 1 + 2!",
        "1/4 + 2/4 = 3/4!",
      ],
    },
    missions: [
      {
        type: "add-fractions",
        manipulative: "bar",
        prompt: "2/6 + 3/6 = ? Show it on the bar!",
        fraction: { n: 2, d: 6 },
        answer: { n: 5, d: 6 },
        xpReward: 10,
        hintAfterWrong: 2,
        hints: [
          "Same denominator! Add the numerators: 2 + 3.",
          "2/6 + 3/6 = 5/6!",
        ],
      },
      {
        type: "add-fractions",
        manipulative: "circle",
        prompt: "1/3 + 1/3 = ?",
        fraction: { n: 1, d: 3 },
        answer: { n: 2, d: 3 },
        xpReward: 10,
        hintAfterWrong: 2,
        hints: [
          "One third plus one third...",
          "1/3 + 1/3 = 2/3!",
        ],
      },
      {
        type: "add-fractions",
        manipulative: "bar",
        prompt: "3/8 + 4/8 = ?",
        fraction: { n: 3, d: 8 },
        answer: { n: 7, d: 8 },
        xpReward: 10,
        hintAfterWrong: 2,
        hints: [
          "Same denominator — keep it! Add the tops: 3 + 4.",
          "3/8 + 4/8 = 7/8!",
        ],
      },
      {
        type: "add-fractions",
        manipulative: "bar",
        prompt: "2/5 + 2/5 = ?",
        fraction: { n: 2, d: 5 },
        answer: { n: 4, d: 5 },
        xpReward: 10,
        hintAfterWrong: 2,
        hints: [
          "2 fifths plus 2 fifths...",
          "2/5 + 2/5 = 4/5!",
        ],
      },
    ],
    boss: {
      type: "add-fractions",
      manipulative: "bar",
      prompt: "Boss! 3/10 + 5/10 = ? Can you get it?",
      fraction: { n: 3, d: 10 },
      answer: { n: 8, d: 10 },
      xpReward: 25,
      hintAfterWrong: 2,
      hints: [
        "Same denominator: keep 10. Add tops: 3 + 5.",
        "3/10 + 5/10 = 8/10!",
      ],
    },
    exitTicket: {
      type: "add-fractions",
      manipulative: "circle",
      prompt: "1/4 + 1/4 = ?",
      fraction: { n: 1, d: 4 },
      answer: { n: 2, d: 4 },
      xpReward: 10,
      hintAfterWrong: 1,
      hints: ["1/4 + 1/4 = 2/4! (That's also 1/2!)"],
    },
  },

  // ── Episode 16: Subtract Fractions (Same Denominator) ───────────
  {
    id: 16,
    title: "Take It Away!",
    subtitle: "Subtracting fractions with same-size pieces!",
    emoji: "➖",
    skills: ["subtract-same-denom"],
    gradeLevel: "4",
    warmup: {
      type: "complement",
      manipulative: "bar",
      prompt: "3/4 - 1/4 = ? Take away one piece!",
      fraction: { n: 3, d: 4 },
      answer: { n: 2, d: 4 },
      xpReward: 5,
      hintAfterWrong: 2,
      hints: [
        "Start with 3 fourths. Remove 1 fourth.",
        "3/4 - 1/4 = 2/4!",
      ],
    },
    missions: [
      {
        type: "add-fractions",
        manipulative: "bar",
        prompt: "5/6 - 2/6 = ?",
        fraction: { n: 5, d: 6 },
        answer: { n: 3, d: 6 },
        xpReward: 10,
        hintAfterWrong: 2,
        hints: [
          "Same denominator — just subtract the tops!",
          "5/6 - 2/6 = 3/6!",
        ],
      },
      {
        type: "add-fractions",
        manipulative: "circle",
        prompt: "4/5 - 1/5 = ?",
        fraction: { n: 4, d: 5 },
        answer: { n: 3, d: 5 },
        xpReward: 10,
        hintAfterWrong: 2,
        hints: [
          "Take one fifth away from four fifths.",
          "4/5 - 1/5 = 3/5!",
        ],
      },
      {
        type: "add-fractions",
        manipulative: "bar",
        prompt: "7/8 - 3/8 = ?",
        fraction: { n: 7, d: 8 },
        answer: { n: 4, d: 8 },
        xpReward: 10,
        hintAfterWrong: 2,
        hints: [
          "Keep the denominator! Subtract the tops: 7 - 3.",
          "7/8 - 3/8 = 4/8 (which is 1/2)!",
        ],
      },
    ],
    boss: {
      type: "add-fractions",
      manipulative: "bar",
      prompt: "Boss! 9/10 - 4/10 = ?",
      fraction: { n: 9, d: 10 },
      answer: { n: 5, d: 10 },
      xpReward: 25,
      hintAfterWrong: 2,
      hints: [
        "Same denominator: keep 10. Subtract: 9 - 4.",
        "9/10 - 4/10 = 5/10 = 1/2!",
      ],
    },
    exitTicket: {
      type: "add-fractions",
      manipulative: "circle",
      prompt: "2/3 - 1/3 = ?",
      fraction: { n: 2, d: 3 },
      answer: { n: 1, d: 3 },
      xpReward: 10,
      hintAfterWrong: 1,
      hints: ["2/3 - 1/3 = 1/3!"],
    },
  },

  // ── Episode 17: Review Spiral ───────────────────────────────────
  {
    id: 17,
    title: "Tricky Traps!",
    subtitle: "Watch out for common mistakes!",
    emoji: "🪤",
    skills: ["equal-parts", "equivalence", "compare-same-denom", "compare-same-numer", "magnitude"],
    gradeLevel: "3",
    warmup: {
      type: "identify",
      manipulative: "bar",
      prompt: "Are these equal parts? Watch carefully!",
      fraction: { n: 1, d: 3 },
      xpReward: 5,
      hintAfterWrong: 1,
      hints: [
        "Equal means SAME SIZE, not same number of cuts!",
      ],
    },
    missions: [
      {
        type: "compare",
        manipulative: "bar",
        prompt: "Tricky! Which is bigger: 3/4 or 5/8?",
        fraction: { n: 3, d: 4 },
        answer: { n: 3, d: 4 },
        choices: [
          { n: 3, d: 4 },
          { n: 5, d: 8 },
        ],
        xpReward: 15,
        hintAfterWrong: 2,
        hints: [
          "Different denominators! Can you make them the same?",
          "3/4 = 6/8. Now compare: 6/8 vs 5/8!",
        ],
      },
      {
        type: "find-equivalent",
        manipulative: "bar",
        prompt: "A student says 2/3 = 2/6. Are they right? Prove it!",
        fraction: { n: 2, d: 3 },
        answer: { n: 4, d: 6 },
        xpReward: 15,
        hintAfterWrong: 2,
        hints: [
          "Shade 2/3 and 2/6 on bars. Do they match?",
          "2/3 ≠ 2/6! The real equivalent is 4/6!",
        ],
      },
      {
        type: "compare",
        manipulative: "circle",
        prompt: "Is 1/2 of a small pizza the same as 1/2 of a large pizza?",
        fraction: { n: 1, d: 2 },
        answer: { n: 1, d: 2 },
        xpReward: 15,
        hintAfterWrong: 1,
        hints: [
          "Same fraction, different wholes!",
          "1/2 of a small pizza is LESS — the whole matters!",
        ],
      },
    ],
    boss: {
      type: "compare",
      manipulative: "bar",
      prompt: "Final trap! Which is bigger: 2/3 or 3/5?",
      fraction: { n: 2, d: 3 },
      answer: { n: 2, d: 3 },
      choices: [
        { n: 2, d: 3 },
        { n: 3, d: 5 },
      ],
      xpReward: 30,
      hintAfterWrong: 2,
      hints: [
        "Different everything! Try using benchmarks.",
        "2/3 is more than 1/2. 3/5 is also more than 1/2 but less than 2/3!",
      ],
    },
    exitTicket: {
      type: "find-equivalent",
      manipulative: "bar",
      prompt: "Simplify 4/8. What's the simplest form?",
      fraction: { n: 4, d: 8 },
      answer: { n: 1, d: 2 },
      xpReward: 10,
      hintAfterWrong: 1,
      hints: ["4/8 = 1/2! Both halves of the bar are the same!"],
    },
  },

  // ── Episode 18: Adventure Assessment ────────────────────────────
  {
    id: 18,
    title: "The Grand Fraction Quest!",
    subtitle: "Show everything you've learned!",
    emoji: "🏆",
    skills: [
      "equal-parts", "unit-fractions", "build-fractions", "number-line",
      "equivalence", "compare-same-denom", "compare-same-numer", "benchmark",
      "complements", "add-same-denom", "subtract-same-denom",
    ],
    gradeLevel: "4",
    warmup: {
      type: "shade-fraction",
      manipulative: "circle",
      prompt: "Welcome to the Grand Quest! Start by shading 3/4!",
      fraction: { n: 3, d: 4 },
      xpReward: 5,
      hintAfterWrong: 2,
      hints: [
        "3 out of 4 equal parts!",
        "Shade three of the four slices!",
      ],
    },
    missions: [
      {
        type: "place-numberline",
        manipulative: "numberline",
        prompt: "Quest step 1: Place 5/6 on the number line!",
        fraction: { n: 5, d: 6 },
        xpReward: 15,
        hintAfterWrong: 2,
        hints: [
          "Split into 6 parts. Count 5 from 0.",
          "5/6 is very close to 1!",
        ],
      },
      {
        type: "find-equivalent",
        manipulative: "bar",
        prompt: "Quest step 2: Find a fraction equal to 3/4!",
        fraction: { n: 3, d: 4 },
        answer: { n: 6, d: 8 },
        xpReward: 15,
        hintAfterWrong: 2,
        hints: [
          "Double the top and bottom!",
          "3/4 = 6/8!",
        ],
      },
      {
        type: "add-fractions",
        manipulative: "bar",
        prompt: "Quest step 3: 2/5 + 1/5 = ?",
        fraction: { n: 2, d: 5 },
        answer: { n: 3, d: 5 },
        xpReward: 15,
        hintAfterWrong: 2,
        hints: [
          "Same denominator — add the tops!",
          "2/5 + 1/5 = 3/5!",
        ],
      },
      {
        type: "complement",
        manipulative: "circle",
        prompt: "Quest step 4: I have 5/8. What's missing to make 1?",
        fraction: { n: 5, d: 8 },
        answer: { n: 3, d: 8 },
        xpReward: 15,
        hintAfterWrong: 2,
        hints: [
          "8/8 - 5/8 = ?",
          "You need 3/8 more!",
        ],
      },
    ],
    boss: {
      type: "compare",
      manipulative: "bar",
      prompt: "Final boss! Order these: 1/4, 2/3, 1/2, 5/6. Smallest to biggest!",
      fraction: { n: 1, d: 4 },
      answer: { n: 5, d: 6 },
      xpReward: 50,
      hintAfterWrong: 2,
      hints: [
        "Use benchmarks! Which are close to 0? To 1/2? To 1?",
        "1/4 < 1/2 < 2/3 < 5/6!",
      ],
    },
    exitTicket: {
      type: "benchmark-sort",
      manipulative: "numberline",
      prompt: "Final ticket! Is 7/12 closer to 1/2 or 1?",
      fraction: { n: 7, d: 12 },
      answer: { n: 1, d: 2 },
      xpReward: 15,
      hintAfterWrong: 1,
      hints: ["6/12 = 1/2. 7/12 is just a smidge past halfway — closer to 1/2!"],
    },
  },
];

// ─── Helpers ────────────────────────────────────────────────────────

/** Find episodes that teach a specific skill */
export function getEpisodesForSkill(skill: SkillTag): Episode[] {
  return CURRICULUM.filter((ep) => ep.skills.includes(skill));
}

/** Get a single episode by ID */
export function getEpisode(id: number): Episode | undefined {
  return CURRICULUM.find((ep) => ep.id === id);
}

/** Get the total number of missions in an episode (warmup + missions + boss + exit) */
export function getEpisodeMissionCount(episode: Episode): number {
  return 1 + episode.missions.length + 1 + 1;
}

/** Get all missions in order for an episode */
export function getEpisodeMissions(episode: Episode): Mission[] {
  return [episode.warmup, ...episode.missions, episode.boss, episode.exitTicket];
}
