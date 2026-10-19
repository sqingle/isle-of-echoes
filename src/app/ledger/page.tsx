"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { KeeperLetter } from "@/components/KeeperLetter";
import { SceneBackdrop } from "@/components/SceneBackdrop";
import { useSession } from "@/components/SessionProvider";
import { LOCATIONS, RAPID_TASKS, TIERS, fmtScore, fmtSeconds, rawScore, type Battery, type SubtestId } from "@/lib/game";

const PA: SubtestId[] = ["elision", "blending", "segmentation", "isolation", "nonwordEB"];
const PM: SubtestId[] = ["digits", "nonwordRep"];
const nameOf = (id: string) => LOCATIONS.find((l) => l.id === id)!;

function csvCell(v: string | number) {
  const s = String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export default function Ledger() {
  const router = useRouter();
  const { settings, subtests, rapid, reset } = useSession();
  const tier = TIERS[settings.tier];
  const anything = Object.keys(subtests).length + Object.keys(rapid).length > 0;

  const downloadCsv = () => {
    const rows: (string | number)[][] = [["battery", "subtest", "tier", "item", "score", "note"]];
    for (const l of LOCATIONS) {
      if (l.id === "rapid") continue;
      const r = subtests[l.id as SubtestId];
      if (!r) continue;
      r.responses.forEach((x) => rows.push([l.battery, l.subtest, r.tier, x.item, fmtScore(x.score), ""]));
      rows.push([l.battery, l.subtest, r.tier, "TOTAL", fmtScore(rawScore(r)), `${r.responses.length} items${r.discontinued ? "; discontinued" : ""}${r.belowFloor ? "; below floor" : ""}${r.tier !== r.startedTier ? `; stepped back from tier ${r.startedTier}` : ""}`]);
    }
    for (const t of RAPID_TASKS) {
      const r = rapid[t.id];
      if (!r) continue;
      rows.push(["Rapid Naming", t.label, r.tier, `Form ${r.form}`, r.notGiven ? "not given" : `${r.seconds}s`, r.notGiven ? "" : `${r.errors} errors (${r.selfCorrected} self-corrected)`]);
    }
    const blob = new Blob([rows.map((r) => r.map(csvCell).join(",")).join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "isle-of-echoes-ledger.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const section = (title: Battery, children: React.ReactNode) => (
    <section className="mt-8">
      <h2 className="engraved text-xl text-bone">{title}</h2>
      <div className="mt-3 overflow-x-auto">{children}</div>
    </section>
  );

  const th = "px-3 py-2 text-left font-display text-[0.7rem] font-semibold tracking-[0.18em] text-brass uppercase";
  const td = "px-3 py-2.5 align-top border-t border-white/10";

  const subtestTable = (ids: SubtestId[]) => (
    <table className="w-full min-w-[34rem] text-lg">
      <thead>
        <tr>
          <th className={th}>Realm</th>
          <th className={th}>Tier</th>
          <th className={th}>Raw score</th>
          <th className={th}>Notes</th>
        </tr>
      </thead>
      <tbody>
        {ids.map((id) => {
          const l = nameOf(id);
          const r = subtests[id];
          if (!r)
            return (
              <tr key={id}>
                <td className={td}>
                  {l.subtest}
                  <span className="block text-sm text-stone">{l.name}</span>
                </td>
                <td className={`${td} text-stone`} colSpan={3}>
                  Not attempted
                </td>
              </tr>
            );
          const raw = rawScore(r);
          const notes: string[] = [];
          if (r.belowFloor) notes.push("Below the floor of the battery");
          else if (r.discontinued) notes.push(`Discontinued after ${l.ceiling} misses in a row`);
          if (r.tier !== r.startedTier) notes.push(`Stepped back from Tier ${r.startedTier} (basal rule)`);
          if (id === "segmentation" && r.responses.length) notes.push(`Mean proportion of sounds correct ${(raw / r.responses.length).toFixed(2)}`);
          return (
            <tr key={id}>
              <td className={td}>
                {l.subtest}
                <span className="block text-sm text-stone">{l.name}</span>
              </td>
              <td className={`${td} font-mono`}>{r.tier}</td>
              <td className={`${td} font-mono text-gold`}>
                {fmtScore(raw)} / {r.responses.length}
                <span className="block text-sm text-stone">{r.responses.length ? Math.round((raw / r.responses.length) * 100) : 0}% correct</span>
              </td>
              <td className={`${td} text-base text-parchment/80`}>{notes.join(" · ") || "—"}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );

  return (
    <main className="relative min-h-dvh px-4 py-8 md:px-8">
      <div className="no-print">
        <SceneBackdrop scene="haze" dim={0.55} />
      </div>
      <div className="mx-auto max-w-4xl">
        <div className="no-print flex flex-wrap items-center justify-between gap-3">
          <Link href="/island" className="eyebrow hover:text-gold">
            ← The island
          </Link>
          <div className="flex flex-wrap gap-3">
            <button className="btn btn-stone !min-h-10 !px-4 !py-2" onClick={() => window.print()} disabled={!anything}>
              Print
            </button>
            <button className="btn btn-stone !min-h-10 !px-4 !py-2" onClick={downloadCsv} disabled={!anything}>
              Download CSV
            </button>
            <button
              className="btn btn-miss !min-h-10 !px-4 !py-2"
              onClick={() => {
                if (window.confirm("Clear every result and begin a new journey? This cannot be undone.")) {
                  reset();
                  router.push("/setup");
                }
              }}
            >
              New journey
            </button>
          </div>
        </div>

        <article className="plaque print-sheet rise mt-4 p-6 md:p-10">
          <p className="eyebrow">The Keeper’s ledger</p>
          <h1 className="engraved mt-2 text-3xl text-bone md:text-4xl">Isle of Echoes · results</h1>
          <p className="mt-2 text-lg text-parchment/80">
            {settings.traveler ? `Traveler ${settings.traveler} · ` : ""}Started at Tier {tier.id} (ages {tier.ages}) ·{" "}
            <time suppressHydrationWarning>{new Date().toLocaleDateString(undefined, { dateStyle: "long" })}</time>
          </p>

          <p className="mt-5 rounded border border-brass/40 bg-brass/10 p-4 text-base text-gold">
            <strong>Illustrative, non-normed material.</strong> This is not the CTOPP-2 and not a validated diagnostic instrument. These
            numbers are informal observations only.
          </p>

          {!anything ? (
            <p className="mt-8 text-xl text-parchment/80 italic">No realm has been visited yet. Return to the island and begin anywhere.</p>
          ) : (
            <>
              {section("Phonological Awareness", subtestTable(PA))}
              {section("Phonological Memory", subtestTable(PM))}
              {section(
                "Rapid Naming",
                <table className="w-full min-w-[34rem] text-lg">
                  <thead>
                    <tr>
                      <th className={th}>Wall</th>
                      <th className={th}>Form</th>
                      <th className={th}>Time</th>
                      <th className={th}>Errors</th>
                    </tr>
                  </thead>
                  <tbody>
                    {RAPID_TASKS.map((t) => {
                      const r = rapid[t.id];
                      return (
                        <tr key={t.id}>
                          <td className={td}>{t.label}</td>
                          {!r ? (
                            <td className={`${td} text-stone`} colSpan={3}>
                              Not attempted
                            </td>
                          ) : r.notGiven ? (
                            <td className={`${td} text-stone`} colSpan={3}>
                              Not given
                            </td>
                          ) : (
                            <>
                              <td className={`${td} font-mono`}>{r.form}</td>
                              <td className={`${td} font-mono text-gold`}>{fmtSeconds(r.seconds ?? 0)}</td>
                              <td className={`${td} font-mono`}>
                                {r.errors}
                                <span className="text-sm text-stone"> ({r.selfCorrected} self-corrected)</span>
                              </td>
                            </>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>,
              )}
              <KeeperLetter />
            </>
          )}

          <section className="mt-10 border-t border-white/10 pt-6 text-lg text-parchment/85">
            <h2 className="engraved text-lg text-bone">How to read this page</h2>
            <ul className="mt-3 list-disc space-y-2 pl-6">
              <li>
                <strong>Report the three batteries separately.</strong> No total is computed, because without normative weighting an
                unweighted sum has no defensible interpretation.
              </li>
              <li>
                Worth noting as a <em>pattern</em>, not a single score: steady drop-off from tier to tier well below grade expectation;
                weaker nonword results than matching real-word results; slow, effortful or error-prone rapid naming for the child’s age.
              </li>
              <li>
                At ages 4–6 one low score often reflects attention or unfamiliarity with the task. Re-screen after a few months of
                instruction, and refer sooner with a family history of reading difficulty or a known speech-language delay.
              </li>
            </ul>
            <p className="mt-5 rounded border border-white/15 p-4 text-base">
              <strong>None of this is a diagnosis.</strong> The next step for a child showing a concerning profile is referral for a
              comprehensive evaluation (the CTOPP-2 or an equivalent normed instrument, an achievement battery and a cognitive measure) by a
              licensed psychologist, neuropsychologist or certified educational diagnostician.
            </p>
          </section>
        </article>
      </div>
    </main>
  );
}
