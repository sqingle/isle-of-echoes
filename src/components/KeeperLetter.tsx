"use client";

import { useMemo, useState } from "react";
import { useSession } from "@/components/SessionProvider";
import { letterRequest, type Letter } from "@/lib/letter";

type State = { status: "idle" } | { status: "writing" } | { status: "error"; message: string } | { status: "done"; letter: Letter; for: string };

const card = "rounded border border-white/15 bg-black/20 p-5";
const cardTitle = "font-display text-[0.75rem] font-semibold tracking-[0.18em] text-brass uppercase";

/**
 * Sends only scores, tiers and the age band to /api/letter; the traveler's name never leaves the
 * page and is added back here when the letter is shown.
 */
export function KeeperLetter() {
  const { settings, subtests, rapid } = useSession();
  const [state, setState] = useState<State>({ status: "idle" });
  const payload = useMemo(() => JSON.stringify(letterRequest(settings.tier, subtests, rapid)), [settings.tier, subtests, rapid]);
  const traveler = settings.traveler.trim();
  // a letter written for older scores is not shown once more realms are played
  const letter = state.status === "done" && state.for === payload ? state.letter : null;

  const write = async () => {
    setState({ status: "writing" });
    try {
      const res = await fetch("/api/letter", { method: "POST", headers: { "content-type": "application/json" }, body: payload });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "The Keeper’s quill slipped. Please try again.");
      setState({ status: "done", letter: data as Letter, for: payload });
    } catch (err) {
      setState({ status: "error", message: err instanceof Error ? err.message : "The Keeper’s quill slipped. Please try again." });
    }
  };

  if (!letter)
    return (
      <section className="no-print mt-10 border-t border-white/10 pt-6">
        <h2 className="engraved text-xl text-bone">The Keeper’s Letter</h2>
        <p className="mt-2 text-lg text-parchment/85">
          A plain-language reading of these tables, with a few games to try at home this week. Only the scores, tiers and age band are
          sent to write it; {traveler ? `${traveler}’s` : "the traveler’s"} name stays on this device.
        </p>
        <button className="btn btn-brass mt-4" onClick={write} disabled={state.status === "writing"}>
          {state.status === "writing" ? "The Keeper is writing…" : "Write the Keeper’s Letter"}
        </button>
        {state.status === "writing" && <p className="mt-3 text-base text-stone italic animate-flicker">Dipping the quill. This takes a few moments.</p>}
        {state.status === "error" && <p className="mt-3 text-base text-wrong">{state.message}</p>}
      </section>
    );

  return (
    <section className="rise mt-10 border-t border-white/10 pt-6">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h2 className="engraved text-xl text-bone">The Keeper’s Letter{traveler ? ` about ${traveler}` : ""}</h2>
        <button className="no-print eyebrow hover:text-gold" onClick={write}>
          Write it again
        </button>
      </div>

      <div className="mt-4 grid gap-4">
        <div className={card}>
          <h3 className={cardTitle}>What we noticed</h3>
          {letter.summary.map((s) => (
            <div key={s.battery} className="mt-3">
              <p className="engraved text-base text-bone">{s.battery}</p>
              <p className="mt-1 text-lg text-parchment/90">{s.text}</p>
            </div>
          ))}
        </div>

        <div className={card}>
          <h3 className={cardTitle}>Strengths</h3>
          <p className="mt-3 text-lg text-parchment/90">{letter.strengths}</p>
        </div>

        <div className={card}>
          <h3 className={cardTitle}>Try at home this week</h3>
          <ol className="mt-3 space-y-3">
            {letter.activities.map((a, i) => (
              <li key={i} className="text-lg text-parchment/90">
                <strong className="text-bone">{a.title}</strong>
                {a.subtest && <span className="text-sm text-stone"> · {a.subtest}</span>}
                <span className="block">{a.how}</span>
              </li>
            ))}
          </ol>
        </div>

        <div className={`${card} border-brass/40`}>
          <h3 className={cardTitle}>When to talk to a professional</h3>
          <p className="mt-3 text-lg text-parchment/90">{letter.nextSteps}</p>
          <p className="mt-3 text-base text-parchment/80">
            This letter does not say whether your traveler has, or does not have, any reading difficulty. If you are worried, share these
            results with the child’s teacher or a reading specialist, who can decide whether a full evaluation by a licensed professional
            is worthwhile.
          </p>
          <p className="mt-3 text-base text-gold">
            <strong>Illustrative, non-normed material.</strong> Written by an AI from informal observations in one session. Not a
            diagnosis.
          </p>
        </div>
      </div>
    </section>
  );
}
