import type { Segment } from "./speech";

/* ------------------------------------------------------------------ */
/* Phonemes. Speech engines say "s" as "ess", so each sound is         */
/* respelled the way a teacher would voice it. Approximate by nature.  */
/* ------------------------------------------------------------------ */

export const SOUND: Record<string, string> = {
  p: "puh", b: "buh", t: "tuh", d: "duh", k: "kuh", g: "guh",
  s: "sss", z: "zzz", f: "fff", v: "vvv", m: "mmm", n: "nnn", l: "lll", r: "rrr",
  h: "huh", w: "wuh", y: "yuh", j: "juh", ch: "chuh", sh: "shh", th: "thh", ng: "ing", zh: "zhh", x: "ks", q: "kwuh",
  a: "aah", e: "eh", i: "ih", o: "ah", u: "uh",
  ee: "ee", ay: "ay", ai: "eye", oh: "oh", oo: "oo", aw: "aw", ow: "ow", oy: "oy", ar: "ar", or: "or", er: "er", ur: "er", air: "air", ear: "eer", ire: "eye er", oi: "oy", ou: "ow",
};

export const sound = (p: string): string => SOUND[p.toLowerCase()] ?? p;

/** replaces every /x/ in a sentence with its spoken sound */
export const voiceSounds = (s: string): string => s.replace(/\/([^/]+)\//g, (_m, p: string) => sound(p));

const ORDINAL: Record<string, string> = { "1st": "first", "2nd": "second", "3rd": "third", "4th": "fourth", "5th": "fifth", "6th": "sixth", "7th": "seventh", "8th": "eighth" };
const DIGIT = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine"];

const clean = (s: string) =>
  s
    .replace(/\s*\([^)]*\)\s*$/, "")
    .replace(/[“”"]/g, "")
    .replace(/\b\d(?:st|nd|rd|th)\b/g, (m) => ORDINAL[m] ?? m)
    .trim();

const GAP = 700;

/* ------------------------------------------------------------------ */
/* Item scripts                                                        */
/* ------------------------------------------------------------------ */

/** “Say X. (child repeats) Now say X without …” */
export function elisionSay(stimulus: string, without: string): Segment[] {
  return [
    { text: `Say ${stimulus}.`, pause: 2600 },
    { text: `Now say ${stimulus} ${voiceSounds(clean(without))}.` },
  ];
}

/** Splits “cow + boy”, “/d/ + -og”, “ba + by” or “/s/-/i/-/t/” into the pieces to voice. */
export function blendPieces(stimulus: string): string[] {
  const body = stimulus.replace(/\s*\([^)]*\)\s*$/, "");
  if (body.includes(" + ")) {
    return body.split(" + ").map((p) => {
      const t = p.trim();
      if (/^\/.+\/$/.test(t)) return sound(t.slice(1, -1));
      return t.replace(/^-/, "");
    });
  }
  if (body.includes("/")) return [...body.matchAll(/\/([^/]+)\//g)].map((m) => sound(m[1]));
  return body.split("-");
}

export function blendSay(stimulus: string): Segment[] {
  const pieces = blendPieces(stimulus);
  return [
    { text: "Listen.", pause: 500 },
    ...pieces.map((p) => ({ text: p, pause: GAP, rate: 0.7 })),
    { text: "What word is that?" },
  ];
}

export const isolationSay = (instruction: string): Segment[] => [{ text: clean(instruction) }];

export function segmentationSay(stimulus: string, wordParts: boolean): Segment[] {
  return [
    { text: `Say ${stimulus}.`, pause: 2600 },
    { text: wordParts ? `Now say ${stimulus} in its parts.` : `Now say every sound in ${stimulus}, one at a time.` },
  ];
}

export function digitsSay(digits: string[]): Segment[] {
  return [
    { text: "Listen. Then say the numbers back to me.", pause: 900 },
    ...digits.map((d, i) => ({ text: DIGIT[Number(d)] ?? d, mark: i, rate: 0.9, minMs: 1000 })),
  ];
}

export const nonwordRepSay = (word: string): Segment[] => [
  { text: "Say this word after me.", pause: 800 },
  { text: word, rate: 0.7 },
];

/* ------------------------------------------------------------------ */
/* The Archivist: greets, explains every game and guides between items  */
/* ------------------------------------------------------------------ */

export const STORY: Segment[] = [
  { text: "Greetings, traveler. I am the Archivist, keeper of every echo on this island.", pause: 600 },
  { text: "Eight places wait for us. In each one, we will play a listening game with sounds, words and numbers.", pause: 600 },
  { text: "You will not need to read a single thing. Just listen to me, and say what you hear. I will guide you the whole way." },
];

export const ISLAND: Segment[] = [
  { text: "Here is the island. Each glowing lantern is a place we can visit.", pause: 500 },
  { text: "Tap a lantern, and I will walk with you there." },
];

/** what the Archivist tells the child before each game */
const RULES: Record<string, string[]> = {
  elision: [
    "In this game, I will say a word. You say it back to me.",
    "Then I will ask you to say it again, with one part or one sound taken away. Like cowboy, without cow, is boy.",
  ],
  blending: [
    "In this game, I will say the pieces of a word, one at a time, slowly.",
    "Your job is to put the pieces together and tell me the whole word.",
  ],
  segmentation: [
    "In this game, I will say a word. Then you break it apart for me.",
    "Say each little sound, one at a time, like turning gears. Take your time.",
  ],
  isolation: [
    "In this game, I will ask about one sound inside a word. It might be the first sound, the last sound, or one in the middle.",
    "Tell me just that one sound.",
  ],
  nonwordEB: [
    "In this game, the words are silly, made-up words from far away. They do not mean anything.",
    "Sometimes I will ask you to take a sound away. Sometimes I will give you pieces to put together. Listen carefully each time.",
  ],
  digits: [
    "In this game, I will say some numbers. Listen carefully, and say them back in the very same order.",
    "I will only say them once, so keep your ears open.",
  ],
  nonwordRep: [
    "In this game, I will say a made-up word, just once. Say it back to me exactly the way you heard it.",
    "Do your best. There is no wrong way to try.",
  ],
};

export const realmIntro = (id: string, name: string, blurb: string, tier0: boolean): Segment[] => [
  { text: `Welcome to ${name}.`, pause: 400 },
  { text: blurb, pause: 600 },
  ...(RULES[id] ?? []).map((t) => ({ text: t, pause: 500 })),
  ...(tier0 ? [{ text: "We will try two practice ones first, just to warm up.", pause: 400 }] : []),
  { text: "When you are ready, tap the golden button, and we will begin." },
];

const LEADS = ["Here is your first echo.", "Here is the next one.", "Listen to this one.", "Ready? Here it comes.", "Another echo.", "Here we go.", "One more for you."];

/** a short spoken guide line before each item */
export const leadIn = (index: number, total: number): Segment[] => {
  if (index === total - 1 && total > 1) return [{ text: "This is the last one in this place.", pause: 500 }];
  return [{ text: LEADS[index % LEADS.length], pause: 450 }];
};

export function realmDone(raw: number, total: number): Segment[] {
  const ratio = total ? raw / total : 0;
  const line =
    ratio >= 0.8
      ? "Wonderful listening, traveler. The echoes are very happy."
      : ratio >= 0.4
        ? "Good work, traveler. You listened well."
        : "Thank you for trying. That one was hard, and you kept going. That is what matters.";
  return [{ text: line, pause: 500 }, { text: "This place is quiet now. Let's see where to go next." }];
}

export const stepBack: Segment[] = [{ text: "Let's try some gentler ones, to find the right place to start.", pause: 300 }];

export const rapidIntro = (noun: string, practice: boolean): Segment[] => [
  { text: `Now we will name things quickly. Look at the ${noun}s, and say the name of each one, as fast as you can.`, pause: 500 },
  { text: "Start at the top left, and go across. Then the next row down. Don't skip any." },
  ...(practice ? [{ text: "Here is a short row to practise on first." }] : []),
];

export const rapidGo: Segment[] = [{ text: "Here is the whole wall. Begin when you are ready.", pause: 300 }];
export const rapidDone: Segment[] = [{ text: "Well done. You named them all." }];

export const rapidChoose: Segment[] = [{ text: "These are the four walls of glyphs. Your Keeper will choose which one we name first." }];

/** spoken when a realm is picked on the island map */
export const selectLine = (name: string, blurb: string): Segment[] => [
  { text: `This is ${name}.`, pause: 300 },
  { text: blurb },
  { text: "Tap the golden button, and we will go in." },
];
