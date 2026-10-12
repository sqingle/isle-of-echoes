/**
 * Renders every FIXED Archivist line (greeting, realm rules, lead-ins, digits, sounds…) to static MP3s in
 * public/narration/, plus src/data/narrationManifest.json mapping "rate|text" to a file. The app plays these
 * directly, so they are instant and need no voice server. Item words are still generated on demand.
 *
 *   KOKORO_BASE_URL=https://host/v1 KOKORO_API_KEY=... KOKORO_MODEL=kokoro npx tsx scripts/pregen-narration.ts
 *   add --dry to only list what would be generated
 */
import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { LOCATIONS, RAPID_TASKS } from "../src/lib/game";
import * as N from "../src/lib/narration";
import { synthesize } from "../src/lib/tts";
import type { Segment } from "../src/lib/speech";

const OUT = "public/narration";
const MANIFEST = "src/data/narrationManifest.json";

const wanted = new Map<string, { text: string; rate?: number }>();
const key = (text: string, rate?: number) => `${rate ?? ""}|${text}`;
const add = (segs: Segment[]) => {
  for (const s of segs) if (s.text) wanted.set(key(s.text, s.rate), { text: s.text, rate: s.rate });
};

add(N.STORY);
add(N.ISLAND);
add(N.stepBack);
add(N.rapidGo);
add(N.rapidDone);
add(N.rapidChoose);
for (const ratio of [1, 0.5, 0]) add(N.realmDone(ratio * 10, 10));
for (let total = 2; total <= 16; total++) for (let i = 0; i < total; i++) add(N.leadIn(i, total));
for (const l of LOCATIONS) {
  add(N.selectLine(l.name, l.blurb));
  if (l.id !== "rapid") for (const tier0 of [true, false]) add(N.realmIntro(l.id, l.name, l.blurb, tier0));
}
for (const t of RAPID_TASKS) for (const practice of [true, false]) add(N.rapidIntro(t.noun, practice));
add(N.digitsSay(["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"]));
add(N.nonwordRepSay("x").slice(0, 1));
add(N.blendSay("/s/-/i/-/t/").filter((s) => s.text === "Listen." || s.text === "What word is that?"));
for (const v of new Set(Object.values(N.SOUND))) add([{ text: v, rate: 0.7 }]);

console.log(`${wanted.size} fixed clips`);
const manifest: Record<string, string> = {};
const queue = [...wanted.entries()];
let done = 0;

async function worker() {
  for (let entry = queue.shift(); entry; entry = queue.shift()) {
    const [k, { text, rate }] = entry;
    const file = `${createHash("sha1").update(k).digest("hex").slice(0, 12)}.mp3`;
    manifest[k] = file;
    if (!existsSync(`${OUT}/${file}`)) {
      let ok = false;
      for (let attempt = 0; attempt < 4 && !ok; attempt++) {
        const r = await synthesize(text, rate ? Math.round(rate * 10) / 10 : null).catch(() => null);
        if (r?.ok) {
          await writeFile(`${OUT}/${file}`, Buffer.from(await r.arrayBuffer()));
          ok = true;
        } else await new Promise((res) => setTimeout(res, 3000));
      }
      if (!ok) throw new Error(`failed: ${k}`);
    }
    console.log(`${++done}/${wanted.size} ${k.slice(0, 60)}`);
  }
}
async function main() {
  if (process.argv.includes("--dry")) return;
  await mkdir(OUT, { recursive: true });
  await Promise.all([worker(), worker(), worker()]);

  const sorted = Object.fromEntries(Object.entries(manifest).sort(([a], [b]) => a.localeCompare(b)));
  await writeFile(MANIFEST, JSON.stringify(sorted, null, 1) + "\n");
  console.log(`wrote ${Object.keys(sorted).length} entries to ${MANIFEST}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
