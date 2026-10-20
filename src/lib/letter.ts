import { LOCATIONS, RAPID_TASKS, TIERS, rawScore, type Battery, type RapidId, type RapidResult, type SubtestId, type SubtestResult, type Tier } from "./game";

/* ------------------------------------------------------------------ */
/* The Keeper's Letter: what goes to /api/letter and what comes back.  */
/* Only scores, tiers and the age band leave the device, never a name. */
/* ------------------------------------------------------------------ */

export const BATTERIES: Battery[] = ["Phonological Awareness", "Phonological Memory", "Rapid Naming"];

export interface SubtestScore {
  id: SubtestId;
  tier: Tier;
  startedTier: Tier;
  items: number;
  raw: number;
  discontinued: boolean;
  belowFloor: boolean;
}

export interface RapidScore {
  id: RapidId;
  tier: Tier;
  seconds: number | null;
  errors: number;
  selfCorrected: number;
  notGiven: boolean;
}

export interface LetterRequest {
  tier: Tier;
  subtests: SubtestScore[];
  rapid: RapidScore[];
}

export interface Letter {
  /** one entry per battery that was attempted, never combined */
  summary: { battery: Battery; text: string }[];
  strengths: string;
  activities: { title: string; how: string; subtest: string }[];
  nextSteps: string;
}

export function letterRequest(
  tier: Tier,
  subtests: Partial<Record<SubtestId, SubtestResult>>,
  rapid: Partial<Record<RapidId, RapidResult>>,
): LetterRequest {
  return {
    tier,
    subtests: Object.values(subtests).map((r) => ({
      id: r.id,
      tier: r.tier,
      startedTier: r.startedTier,
      items: r.responses.length,
      raw: Math.round(rawScore(r) * 100) / 100,
      discontinued: r.discontinued,
      belowFloor: r.belowFloor,
    })),
    rapid: Object.values(rapid).map((r) => ({
      id: r.id,
      tier: r.tier,
      seconds: r.seconds,
      errors: r.errors,
      selfCorrected: r.selfCorrected,
      notGiven: r.notGiven,
    })),
  };
}

const isTier = (v: unknown): v is Tier => v === 0 || v === 1 || v === 2 || v === 3;
const isCount = (v: unknown, max = 1000): v is number => typeof v === "number" && Number.isFinite(v) && v >= 0 && v <= max;
const SUBTEST_IDS = new Set<string>(LOCATIONS.filter((l) => l.id !== "rapid").map((l) => l.id));
const RAPID_IDS = new Set<string>(RAPID_TASKS.map((t) => t.id));

/** Rebuilds the request from known fields only, so no free text (or name) can ride along. */
export function parseLetterRequest(body: unknown): LetterRequest | null {
  const b = body as Partial<LetterRequest> | null;
  if (!b || !isTier(b.tier) || !Array.isArray(b.subtests) || !Array.isArray(b.rapid)) return null;
  if (b.subtests.length > SUBTEST_IDS.size || b.rapid.length > RAPID_IDS.size) return null;
  const subtests: SubtestScore[] = [];
  for (const s of b.subtests) {
    if (!s || !SUBTEST_IDS.has(s.id) || !isTier(s.tier) || !isTier(s.startedTier)) return null;
    if (!isCount(s.items, 200) || !isCount(s.raw, 200) || s.raw > s.items) return null;
    subtests.push({ id: s.id, tier: s.tier, startedTier: s.startedTier, items: s.items, raw: s.raw, discontinued: !!s.discontinued, belowFloor: !!s.belowFloor });
  }
  const rapid: RapidScore[] = [];
  for (const r of b.rapid) {
    if (!r || !RAPID_IDS.has(r.id) || !isTier(r.tier)) return null;
    if (!(r.seconds === null || isCount(r.seconds, 3600)) || !isCount(r.errors) || !isCount(r.selfCorrected)) return null;
    rapid.push({ id: r.id, tier: r.tier, seconds: r.seconds, errors: r.errors, selfCorrected: r.selfCorrected, notGiven: !!r.notGiven });
  }
  if (!subtests.length && !rapid.some((r) => !r.notGiven)) return null;
  return { tier: b.tier, subtests, rapid };
}

const batteryOf = (id: SubtestId) => LOCATIONS.find((l) => l.id === id)!.battery;

export function attemptedBatteries(req: LetterRequest): Battery[] {
  return BATTERIES.filter((b) => (b === "Rapid Naming" ? req.rapid.length > 0 : req.subtests.some((s) => batteryOf(s.id) === b)));
}

/** Plain-text score sheet for the model, grouped by battery and never totalled. */
export function describeScores(req: LetterRequest): string {
  const t = TIERS[req.tier];
  const lines = [`Starting tier: ${t.id} (ages ${t.ages}, ${t.grade})`];
  for (const battery of BATTERIES) {
    lines.push("", `## ${battery}`);
    if (battery === "Rapid Naming") {
      if (!req.rapid.length) lines.push("Not attempted.");
      for (const r of req.rapid) {
        const label = RAPID_TASKS.find((x) => x.id === r.id)!.label;
        lines.push(
          r.notGiven || r.seconds === null
            ? `- ${label}: not given (the practice row was not secure)`
            : `- ${label} (tier ${r.tier}): ${r.seconds.toFixed(1)} seconds for the grid, ${r.errors} errors, ${r.selfCorrected} self-corrected`,
        );
      }
      continue;
    }
    const mine = req.subtests.filter((s) => batteryOf(s.id) === battery);
    if (!mine.length) lines.push("Not attempted.");
    for (const s of mine) {
      const l = LOCATIONS.find((x) => x.id === s.id)!;
      const notes = [
        s.belowFloor && "below the floor of the battery",
        !s.belowFloor && s.discontinued && `stopped early after ${l.ceiling} misses in a row`,
        s.tier !== s.startedTier && `stepped back from tier ${s.startedTier}`,
      ].filter(Boolean);
      const pct = s.items ? Math.round((s.raw / s.items) * 100) : 0;
      lines.push(`- ${l.subtest} (tier ${s.tier}): ${s.raw} of ${s.items} items (${pct}%)${notes.length ? `; ${notes.join("; ")}` : ""}`);
    }
  }
  return lines.join("\n");
}
