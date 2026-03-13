const SPOKEN_NUMERATORS: Record<string, string> = {
  "1": "one",
  "2": "two",
  "3": "three",
  "4": "four",
  "5": "five",
  "6": "six",
  "7": "seven",
  "8": "eight",
  "9": "nine",
  "10": "ten",
  "11": "eleven",
  "12": "twelve",
};

const SPOKEN_DENOMINATORS: Record<string, string> = {
  "2": "half",
  "3": "third",
  "4": "quarter",
  "5": "fifth",
  "6": "sixth",
  "7": "seventh",
  "8": "eighth",
  "9": "ninth",
  "10": "tenth",
  "12": "twelfth",
};

const SPOKEN_DENOMINATORS_PLURAL: Record<string, string> = {
  "2": "halves",
  "3": "thirds",
  "4": "quarters",
  "5": "fifths",
  "6": "sixths",
  "7": "sevenths",
  "8": "eighths",
  "9": "ninths",
  "10": "tenths",
  "12": "twelfths",
};

/** Convert fraction notation to spoken words for natural TTS */
export function fractionsToWords(text: string): string {
  return text.replace(/\b(\d+)\/(\d+)\b/g, (_match, num, den) => {
    const spokenNum = SPOKEN_NUMERATORS[num];
    if (!spokenNum) return `${num} over ${den}`;

    if (num === "1") {
      const spokenDen = SPOKEN_DENOMINATORS[den];
      return spokenDen ? `${spokenNum} ${spokenDen}` : `${num} over ${den}`;
    }

    const spokenDenPlural = SPOKEN_DENOMINATORS_PLURAL[den];
    return spokenDenPlural
      ? `${spokenNum} ${spokenDenPlural}`
      : `${num} over ${den}`;
  });
}

/** Clean text for speech — remove emojis, brackets, markdown, tags */
export function cleanForSpeech(text: string): string {
  return text
    .replace(
      /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{2700}-\u{27BF}]/gu,
      ""
    )
    .replace(/\[(\d+\/\d+)\]/g, "$1")
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/\*(.+?)\*/g, "$1")
    .replace(/\[ADVANCE_PHASE\]/g, "")
    .replace(/\[SWITCH_MODE:\w+\]/g, "")
    .replace(/\b(\d+)\/(\d+)\b/g, (match) => fractionsToWords(match))
    .replace(/\s+/g, " ")
    .trim();
}
