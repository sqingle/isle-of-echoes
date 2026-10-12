import itemBankJson from "@/data/itemBank.json";
import rapidJson from "@/data/rapidNaming.json";

/* ------------------------------------------------------------------ */
/* Static definitions                                                  */
/* ------------------------------------------------------------------ */

export type Tier = 0 | 1 | 2 | 3;

export const TIERS: { id: Tier; ages: string; grade: string }[] = [
  { id: 0, ages: "4–6", grade: "Pre-K – Grade 1" },
  { id: 1, ages: "7–8", grade: "Grades 2–3" },
  { id: 2, ages: "9–11", grade: "Grades 4–6" },
  { id: 3, ages: "12–14", grade: "Grades 7–9" },
];

export type SubtestId =
  | "elision"
  | "blending"
  | "segmentation"
  | "isolation"
  | "nonwordEB"
  | "digits"
  | "nonwordRep";

export type RapidId = "digit" | "letter" | "color" | "shape";
export type LocationId = SubtestId | "rapid";
export type Battery = "Phonological Awareness" | "Phonological Memory" | "Rapid Naming";

export interface Location {
  id: LocationId;
  name: string;
  subtest: string;
  battery: Battery;
  blurb: string;
  /** consecutive failures that end the subtest (guide: 5 for PA / RN, 2 for memory) */
  ceiling: number;
  /** anchor on the island map (1200 × 720 viewBox) */
  anchor: { x: number; y: number };
  labelSide?: "left" | "right";
}

export const LOCATIONS: Location[] = [
  {
    id: "elision",
    name: "The Whispering Colonnade",
    subtest: "Elision",
    battery: "Phonological Awareness",
    blurb: "Speak a word, then let one sound slip away between the columns.",
    ceiling: 5,
    anchor: { x: 420, y: 372 },
  },
  {
    id: "blending",
    name: "Weaver’s Landing",
    subtest: "Blending",
    battery: "Phonological Awareness",
    blurb: "Gather scattered sounds at the dock and weave them into a word.",
    ceiling: 5,
    anchor: { x: 700, y: 596 },
  },
  {
    id: "segmentation",
    name: "The Cogworks",
    subtest: "Segmentation",
    battery: "Phonological Awareness",
    blurb: "Turn a word over, gear by gear, until every sound is its own cog.",
    ceiling: 5,
    anchor: { x: 972, y: 392 },
    labelSide: "left",
  },
  {
    id: "isolation",
    name: "The Dome Observatory",
    subtest: "Phoneme Isolation",
    battery: "Phonological Awareness",
    blurb: "Look through the lens and find the first, last or hidden sound.",
    ceiling: 5,
    anchor: { x: 706, y: 388 },
  },
  {
    id: "nonwordEB",
    name: "The Star Skiff",
    subtest: "Nonword Elision / Blending",
    battery: "Phonological Awareness",
    blurb: "Strange words from distant shores, with no meaning to lean on.",
    ceiling: 5,
    anchor: { x: 664, y: 214 },
  },
  {
    id: "digits",
    name: "The Numbered Library",
    subtest: "Memory for Digits",
    battery: "Phonological Memory",
    blurb: "Hold a string of numbers in the mind and give it back in order.",
    ceiling: 2,
    anchor: { x: 598, y: 322 },
    labelSide: "left",
  },
  {
    id: "nonwordRep",
    name: "Echo Peak",
    subtest: "Nonword Repetition",
    battery: "Phonological Memory",
    blurb: "Call a made-up word into the canyon and hear it return unchanged.",
    ceiling: 2,
    anchor: { x: 870, y: 214 },
  },
  {
    id: "rapid",
    name: "The Tilted Tower",
    subtest: "Rapid Naming",
    battery: "Rapid Naming",
    blurb: "Name every glyph on the wall, quickly, without losing your place.",
    ceiling: 5,
    anchor: { x: 128, y: 560 },
    labelSide: "right",
  },
];

export const LOCATION_BY_ID = Object.fromEntries(LOCATIONS.map((l) => [l.id, l])) as Record<
  LocationId,
  Location
>;

export function isLocationId(id: string): id is LocationId {
  return id in LOCATION_BY_ID;
}

export const RAPID_TASKS: { id: RapidId; label: string; noun: string }[] = [
  { id: "digit", label: "Digit Naming", noun: "digit" },
  { id: "letter", label: "Letter Naming", noun: "letter" },
  { id: "color", label: "Color Naming", noun: "color" },
  { id: "shape", label: "Shape Naming", noun: "shape" },
];

/* ------------------------------------------------------------------ */
/* Raw data types                                                      */
/* ------------------------------------------------------------------ */

interface RawRow {
  tier: number;
  item: number;
  stimulus: string;
  target: string;
  instruction?: string;
  taskType?: "Elision" | "Blend";
  count?: number;
  span?: number;
  syllables?: number;
}
type RawBank = Record<SubtestId, { label: string; task: string; rows: RawRow[] }>;
type RawRapid = Record<RapidId, { label: string; tiers: Record<string, { form: string; rows: string[] }[]> }>;

const bank = itemBankJson as unknown as RawBank;
const rapid = rapidJson as unknown as RawRapid;

/* ------------------------------------------------------------------ */
/* Trial items                                                         */
/* ------------------------------------------------------------------ */

export interface TrialItem {
  key: string;
  item: number;
  tier: Tier;
  kind: SubtestId;
  /** small label above the script, e.g. “Blend”, “initial sound” */
  tag?: string;
  /** what the Keeper reads aloud */
  lines: string[];
  /** target answer from the item bank */
  answer: string;
  /** segmentation: the sounds / parts the child should produce */
  parts?: string[];
  /** text that browser speech can render reliably (real words, digits, nonwords) */
  speak?: string;
  /** digits: spoken one per second */
  digits?: string[];
}

const stripParen = (s: string) => s.replace(/\s*\(([^)]*)\)\s*$/, "");
const parenOf = (s: string) => s.match(/\(([^)]*)\)\s*$/)?.[1];

function elisionLines(stimulus: string, instruction: string): { lines: string[]; tag?: string } {
  const m = instruction.match(/without (.*?)(?: \(([^)]*)\))?$/);
  const what = m?.[1] ?? "";
  return {
    lines: [`Say “${stimulus}.”`, `Now say “${stimulus}” without ${what}.`],
    tag: m?.[2],
  };
}

function blendLines(stimulus: string): { lines: string[]; tag?: string } {
  const tag = parenOf(stimulus);
  const body = stripParen(stimulus).replace(/ \+ -?/g, " … ").replace(/-/g, " … ").replace(/\//g, "");
  return { lines: [body, "What word is that?"], tag };
}

function parseParts(target: string): string[] {
  if (target.includes("/")) {
    return [...target.matchAll(/\/([^/]+)\//g)].map((m) => m[1]);
  }
  return stripParen(target)
    .split("·")
    .map((p) => p.trim())
    .filter(Boolean);
}

function prepare(kind: SubtestId, row: RawRow): TrialItem {
  const base = {
    key: `${kind}-${row.tier}-${row.item}`,
    item: row.item,
    tier: row.tier as Tier,
    kind,
    answer: row.target,
  };
  switch (kind) {
    case "elision": {
      const e = elisionLines(row.stimulus, row.instruction ?? "");
      return { ...base, ...e, speak: row.stimulus };
    }
    case "blending": {
      return { ...base, ...blendLines(row.stimulus) };
    }
    case "segmentation": {
      const parts = parseParts(row.target);
      const wordParts = !row.target.includes("/");
      return {
        ...base,
        lines: [
          `Say “${row.stimulus}.”`,
          wordParts
            ? `Now say “${row.stimulus}” in its parts.`
            : `Now say every sound in “${row.stimulus},” one at a time.`,
        ],
        tag: wordParts ? parenOf(row.target) : undefined,
        parts,
        speak: row.stimulus,
      };
    }
    case "isolation": {
      return {
        ...base,
        lines: [row.instruction ?? ""],
        speak: (row.instruction ?? "").replace(/[“”]/g, ""),
      };
    }
    case "nonwordEB": {
      if (row.taskType === "Elision") {
        const e = elisionLines(row.stimulus.match(/“(.*?)”/)?.[1] ?? "", row.stimulus.replace(/^Say “.*?” /, ""));
        return { ...base, ...e, tag: `Elision · ${e.tag ?? ""}`.replace(/ · $/, "") };
      }
      const b = blendLines(row.stimulus);
      return { ...base, ...b, tag: `Blend${b.tag ? ` · ${b.tag}` : ""}` };
    }
    case "digits": {
      const digits = row.stimulus.split("-");
      return {
        ...base,
        lines: [`Read steadily, one digit per second:`, digits.join("   ")],
        digits,
        answer: digits.join(" – "),
        tag: `span ${row.span}`,
      };
    }
    case "nonwordRep": {
      return {
        ...base,
        lines: ["Say it once, clearly:", row.stimulus],
        speak: row.stimulus,
        answer: row.stimulus,
        tag: `${row.syllables} syllable${row.syllables === 1 ? "" : "s"}`,
      };
    }
  }
}

/** Random, non-repeating sample for one subtest, kept in item order (item order tracks difficulty). */
export function drawItems(kind: SubtestId, tier: Tier, n: number): TrialItem[] {
  const rows = bank[kind].rows.filter((r) => r.tier === tier);
  const pool = [...rows];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool
    .slice(0, Math.min(n, pool.length))
    .sort((a, b) => a.item - b.item)
    .map((r) => prepare(kind, r));
}

/* ------------------------------------------------------------------ */
/* Rapid naming                                                        */
/* ------------------------------------------------------------------ */

export const RAPID_FORMS = ["A", "B", "C", "D", "E"] as const;

export function rapidGrid(id: RapidId, tier: Tier, form: string): string[][] {
  const forms = rapid[id].tiers[String(tier)];
  const f = forms.find((x) => x.form === form) ?? forms[0];
  return f.rows.map((r) => r.split(" "));
}

export function rapidSymbols(id: RapidId, tier: Tier): string[] {
  const set = new Set<string>();
  rapid[id].tiers[String(tier)].forEach((f) => f.rows.forEach((r) => r.split(" ").forEach((c) => set.add(c))));
  return [...set];
}

export const COLOR_NAMES: Record<string, { name: string; hex: string }> = {
  B: { name: "blue", hex: "#1565c0" },
  Y: { name: "yellow", hex: "#f9a825" },
  R: { name: "red", hex: "#d32f2f" },
  G: { name: "green", hex: "#2e7d32" },
  K: { name: "black", hex: "#212121" },
  P: { name: "purple", hex: "#7b1fa2" },
};

export const SHAPE_NAMES: Record<string, string> = {
  T: "triangle",
  S: "square",
  O: "circle",
  D: "diamond",
  X: "star",
  H: "heart",
};

/* ------------------------------------------------------------------ */
/* Results                                                             */
/* ------------------------------------------------------------------ */

export interface Response {
  key: string;
  item: number;
  /** 0–1: whole items score 0 or 1, segmentation scores the proportion of parts correct */
  score: number;
}

export interface SubtestResult {
  id: SubtestId;
  tier: Tier;
  startedTier: Tier;
  planned: number;
  responses: Response[];
  discontinued: boolean;
  belowFloor: boolean;
}

export interface RapidResult {
  id: RapidId;
  tier: Tier;
  form: string;
  seconds: number | null;
  errors: number;
  selfCorrected: number;
  notGiven: boolean;
}

export const rawScore = (r: SubtestResult) => r.responses.reduce((s, x) => s + x.score, 0);

export function trailingFailures(responses: Response[]): number {
  let n = 0;
  for (let i = responses.length - 1; i >= 0; i--) {
    if (responses[i].score === 0) n++;
    else break;
  }
  return n;
}

export const fmtScore = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(2).replace(/0$/, ""));

export const fmtSeconds = (s: number) => {
  const m = Math.floor(s / 60);
  const rest = (s - m * 60).toFixed(1).padStart(4, "0");
  return m > 0 ? `${m}:${rest}` : `${rest}s`;
};

export function randomForm(): string {
  return RAPID_FORMS[Math.floor(Math.random() * RAPID_FORMS.length)];
}

/** A short practice row of symbols from the grid’s own set. */
export function practiceRow(id: RapidId, tier: Tier, n = 6): string[] {
  const syms = rapidSymbols(id, tier);
  return Array.from({ length: n }, () => syms[Math.floor(Math.random() * syms.length)]);
}
