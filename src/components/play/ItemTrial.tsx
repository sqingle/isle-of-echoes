"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { gearPath } from "@/components/art";
import { useSession } from "@/components/SessionProvider";
import {
  LOCATIONS,
  TIERS,
  drawItems,
  fmtScore,
  rawScore,
  trailingFailures,
  type Location,
  type Response,
  type SubtestId,
  type Tier,
  type TrialItem,
} from "@/lib/game";
import { Archivist } from "@/components/Archivist";
import { leadIn, realmDone, realmIntro, stepBack } from "@/lib/narration";
import { preloadSegments, stopSpeech, type Segment } from "@/lib/speech";
import { useCanSpeak, useNarrate } from "@/lib/useNarrate";
import { Lantern, RealmHeader, type LanternState } from "./parts";

type Phase = "intro" | "play" | "basal" | "done";

const GUIDE: Record<SubtestId, { how: string; stop: string }> = {
  elision: {
    how: "Say the word and let the child repeat it. Then ask for it again with the named sound or word part removed. Judge the sounds that remain, not the spelling.",
    stop: "Five echoes missed in a row close the realm.",
  },
  blending: {
    how: "Say the parts or sounds with about a second between them, then ask “What word is that?” A different real word is incorrect, even a plausible one.",
    stop: "Five echoes missed in a row close the realm.",
  },
  segmentation: {
    how: "The child says every sound in the word, one at a time. Tap each gear the child produced correctly. The score is the proportion of sounds right.",
    stop: "Five echoes with no sounds right close the realm.",
  },
  isolation: {
    how: "Ask the question exactly as written. One point if the child gives the correct sound (the sound, not the letter).",
    stop: "Five echoes missed in a row close the realm.",
  },
  nonwordEB: {
    how: "Elision and blending with invented words. Listen closely and note the exact sounds: there is no real word to fall back on. Follow the task label on each stone.",
    stop: "Five echoes missed in a row close the realm.",
  },
  digits: {
    how: "Read at a steady pace of about one digit per second in a flat tone, without grouping. Credit only if every digit comes back in the right order.",
    stop: "Two echoes missed in a row close the realm.",
  },
  nonwordRep: {
    how: "Say each nonword once, clearly, at a natural pace. Credit exact reproduction, allowing natural articulation. Note any syllables dropped or swapped.",
    stop: "Two echoes missed in a row close the realm.",
  },
};

const BIG_LINE = (item: TrialItem): number =>
  item.kind === "blending" || item.kind === "isolation"
    ? 0
    : item.kind === "digits" || item.kind === "nonwordRep"
      ? 1
      : item.kind === "nonwordEB" && item.tag?.startsWith("Blend")
        ? 0
        : -1;

function SegGear({ label, on, onToggle, index }: { label: string; on: boolean; onToggle: () => void; index: number }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={on}
      aria-label={`Sound ${index + 1}${label ? `, ${label}` : ""}: ${on ? "produced correctly" : "not yet marked"}`}
      className="group relative grid h-24 w-24 cursor-pointer place-items-center transition-transform hover:scale-105 sm:h-28 sm:w-28"
    >
      <svg viewBox="-50 -50 100 100" className={`absolute inset-0 h-full w-full drop-shadow-lg ${on ? "animate-spin-slow" : ""}`} style={{ animationDuration: "9s" }}>
        <path d={gearPath(0, 0, 46, 14, 8)} fill={on ? "#d9b35a" : "#7a3b22"} stroke={on ? "#fbe7a8" : "#2f140a"} strokeWidth="1.6" />
        <circle r="35" fill="none" stroke="#000" strokeOpacity="0.25" />
      </svg>
      <span className={`relative font-mono text-lg font-medium ${on ? "text-[#2c1d05]" : "text-bone"}`}>{label || index + 1}</span>
    </button>
  );
}

export function ItemTrial({ location, subtest }: { location: Location; subtest: SubtestId }) {
  const { settings, subtests, rapid, saveSubtest } = useSession();
  const prior = subtests[subtest];

  const [phase, setPhase] = useState<Phase>("intro");
  const [tier, setTier] = useState<Tier>(settings.tier);
  const [items, setItems] = useState<TrialItem[]>([]);
  const [index, setIndex] = useState(0);
  const [responses, setResponses] = useState<Response[]>([]);
  const [dropped, setDropped] = useState(false);
  const [basalSeen, setBasalSeen] = useState(false);
  const [marks, setMarks] = useState<boolean[]>([]);
  const [outcome, setOutcome] = useState<{ discontinued: boolean; belowFloor: boolean }>({ discontinued: false, belowFloor: false });

  const item: TrialItem | undefined = items[index];
  const canSpeakNow = useCanSpeak();
  const voiceOn = settings.voice && canSpeakNow;
  const basalN = Math.min(3, location.ceiling);

  const rawNow = responses.reduce((a, r) => a + r.score, 0);
  const segments: Segment[] | null =
    phase === "intro"
      ? realmIntro(subtest, location.name, location.blurb, settings.tier === 0)
      : phase === "done"
        ? realmDone(rawNow, responses.length)
        : phase === "play" && item
          ? [...(dropped && index === 0 ? stepBack : []), ...leadIn(index, items.length), ...item.say]
          : null;
  const { speaking, mark, replay } = useNarrate(segments, voiceOn && segments !== null, `${phase}:${item?.key ?? ""}`, phase === "play" && item ? item.say : null);

  /* have the next item's voice ready before it is needed */
  const nextItem = items[index + 1];
  useEffect(() => {
    if (voiceOn && nextItem) preloadSegments(nextItem.say);
  }, [voiceOn, nextItem]);

  useEffect(() => () => stopSpeech(), []);

  const begin = useCallback(
    (t: Tier, wasDropped: boolean) => {
      stopSpeech();
      setTier(t);
      setItems(drawItems(subtest, t, settings.itemsPerRealm));
      setIndex(0);
      setResponses([]);
      setMarks([]);
      setBasalSeen(false);
      setDropped(wasDropped);
      setPhase("play");
    },
    [subtest, settings.itemsPerRealm],
  );

  const finish = useCallback(
    (resps: Response[], o: { discontinued: boolean; belowFloor: boolean }) => {
      stopSpeech();
      saveSubtest({
        id: subtest,
        tier,
        startedTier: settings.tier,
        planned: items.length,
        responses: resps,
        discontinued: o.discontinued,
        belowFloor: o.belowFloor,
      });
      setOutcome(o);
      setPhase("done");
    },
    [saveSubtest, subtest, tier, settings.tier, items.length],
  );

  /** continue the ladder after a response has been recorded (ceiling → end → next) */
  const advance = useCallback(
    (next: Response[]) => {
      if (trailingFailures(next) >= location.ceiling) return finish(next, { discontinued: true, belowFloor: false });
      if (index + 1 >= items.length) return finish(next, { discontinued: false, belowFloor: false });
      setIndex(index + 1);
    },
    [finish, index, items.length, location.ceiling],
  );

  const score = useCallback(
    (v: number) => {
      if (!item || phase !== "play") return;
      stopSpeech();
      const next = [...responses, { key: item.key, item: item.item, score: v }];
      setResponses(next);
      setMarks([]);
      // Basal rule: the first three misses send the child down a tier. Memory subtests stop after two
      // consecutive misses, so there the "first misses" test uses two.
      if (!basalSeen && next.length === basalN && next.every((r) => r.score === 0)) {
        setPhase("basal");
        return;
      }
      advance(next);
    },
    [item, phase, responses, basalSeen, basalN, advance],
  );

  /* keyboard: C = true echo, X = not yet, H = hear it again */
  useEffect(() => {
    if (phase !== "play" || !item || item.kind === "segmentation") return;
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const k = e.key.toLowerCase();
      if (k === "c") score(1);
      else if (k === "x") score(0);
      else if (k === "h" && !item.noReplay) replay();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phase, item, score, replay]);

  const isDone = (id: string) => (id === "rapid" ? Object.keys(rapid).length > 0 : !!subtests[id as SubtestId]);
  const nextRealm = LOCATIONS.find((l) => l.id !== subtest && !isDone(l.id));

  /* ---------------------------------------------------------------- */
  /* Intro                                                             */
  /* ---------------------------------------------------------------- */
  if (phase === "intro") {
    const g = GUIDE[subtest];
    return (
      <div className="mx-auto flex min-h-dvh max-w-3xl flex-col justify-center px-4 py-8">
        <RealmHeader location={location} tier={tier} />
        <div className="plaque rise mt-6 p-6 md:p-9">
          <div className="flex flex-wrap items-center gap-5">
            <Archivist speaking={speaking} onReplay={voiceOn ? replay : undefined} />
            <div className="min-w-0 flex-1">
              <p className="eyebrow">{location.battery}</p>
              <p className="mt-2 text-2xl text-bone italic md:text-3xl">{location.blurb}</p>
            </div>
          </div>
          <dl className="mt-6 grid gap-5 text-lg md:grid-cols-2">
            <div>
              <dt className="eyebrow">How the Keeper plays</dt>
              <dd className="mt-1 text-parchment/90">{g.how}</dd>
            </div>
            <div>
              <dt className="eyebrow">When the realm closes</dt>
              <dd className="mt-1 text-parchment/90">
                {g.stop} If the first {basalN} echoes are all missed, the island offers to step back one tier
                {settings.tier === 0 ? " (Tier 0 is the floor)" : ""}.
              </dd>
            </div>
          </dl>
          {tier === 0 && (
            <p className="mt-5 rounded border border-brass/40 bg-brass/10 p-3 text-base text-gold">
              Ages 4–6: give two practice items first, modelling the right answer if the child misses. Then give the scored echoes with no
              feedback.
            </p>
          )}
          {prior && (
            <p className="mt-5 text-base text-sandstone italic">
              This realm was already visited ({fmtScore(rawScore(prior))} of {prior.responses.length}). Playing again replaces that result.
            </p>
          )}
          <div className="mt-7 flex flex-wrap items-center gap-4">
            <button className="btn btn-brass" onClick={() => begin(settings.tier, false)}>
              Begin the {settings.itemsPerRealm} echoes
            </button>
            <Link href="/island" className="btn btn-stone">
              Back to the island
            </Link>
          </div>
        </div>
      </div>
    );
  }

  /* ---------------------------------------------------------------- */
  /* Basal                                                             */
  /* ---------------------------------------------------------------- */
  if (phase === "basal") {
    return (
      <div className="mx-auto flex min-h-dvh max-w-2xl flex-col justify-center px-4 py-8">
        <div className="plaque rise p-7 md:p-9" role="alertdialog" aria-labelledby="basal-h">
          <p className="eyebrow">The mist thickens</p>
          <h2 id="basal-h" className="engraved mt-2 text-2xl text-bone">
            The first {basalN} echoes were missed
          </h2>
          {tier > 0 ? (
            <>
              <p className="mt-3 text-lg text-parchment/90">
                By the basal rule, this realm starts over one tier lower (Tier {tier - 1}, ages {TIERS[tier - 1].ages}) with a fresh set of
                echoes.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <button className="btn btn-brass" onClick={() => begin((tier - 1) as Tier, true)}>
                  Step back to Tier {tier - 1}
                </button>
                <button
                  className="btn btn-stone"
                  onClick={() => {
                    setBasalSeen(true);
                    setPhase("play");
                    advance(responses);
                  }}
                >
                  Keep going at Tier {tier}
                </button>
              </div>
            </>
          ) : (
            <>
              <p className="mt-3 text-lg text-parchment/90">
                Tier 0 is the floor of this battery. Record a raw score of 0 and note that the child scored below the floor.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <button className="btn btn-brass" onClick={() => finish(responses, { discontinued: true, belowFloor: true })}>
                  Record below floor
                </button>
                <button
                  className="btn btn-stone"
                  onClick={() => {
                    setBasalSeen(true);
                    setPhase("play");
                    advance(responses);
                  }}
                >
                  Keep going anyway
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  /* ---------------------------------------------------------------- */
  /* Done                                                              */
  /* ---------------------------------------------------------------- */
  if (phase === "done") {
    const raw = responses.reduce((s, r) => s + r.score, 0);
    return (
      <div className="mx-auto flex min-h-dvh max-w-3xl flex-col justify-center px-4 py-8">
        <RealmHeader location={location} tier={tier} />
        <div className="plaque rise mt-6 p-7 md:p-10 text-center">
          <div className="mb-3 flex justify-center">
            <Archivist speaking={speaking} onReplay={voiceOn ? replay : undefined} />
          </div>
          <p className="eyebrow">The realm falls quiet</p>
          <p className="title-wash mt-3 text-6xl md:text-7xl">
            {fmtScore(raw)}
            <span className="text-3xl md:text-4xl"> / {responses.length}</span>
          </p>
          <p className="mt-1 font-display text-xs tracking-[0.28em] text-sandstone uppercase">raw score at Tier {tier}</p>
          <div className="mt-5 flex flex-wrap justify-center gap-1">
            {responses.map((r, i) => (
              <Lantern key={i} state={r.score === 1 ? "true" : r.score > 0 ? "partial" : "miss"} label={`Echo ${i + 1}: ${fmtScore(r.score)}`} />
            ))}
          </div>
          <ul className="mx-auto mt-5 max-w-lg space-y-1 text-base text-parchment/80">
            {outcome.belowFloor && <li>Below the floor of the battery: raw score recorded as 0.</li>}
            {outcome.discontinued && !outcome.belowFloor && <li>Stopped early after {location.ceiling} missed in a row, per the ceiling rule.</li>}
            {dropped && <li>Started at Tier {settings.tier}, then stepped back to Tier {tier} by the basal rule.</li>}
            <li className="text-stone italic">Keep this score separate. It is not combined across realms.</li>
          </ul>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            {nextRealm ? (
              <Link href={`/play/${nextRealm.id}`} className="btn btn-brass">
                On to {nextRealm.name}
              </Link>
            ) : (
              <Link href="/ledger" className="btn btn-brass">
                Open the ledger
              </Link>
            )}
            <Link href="/island" className="btn btn-stone">
              Back to the island
            </Link>
            <button className="btn btn-stone" onClick={() => begin(settings.tier, false)}>
              Replay
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ---------------------------------------------------------------- */
  /* Play                                                              */
  /* ---------------------------------------------------------------- */
  if (!item) return null;
  const big = BIG_LINE(item);
  const seg = item.kind === "segmentation" && item.parts;
  const lanterns: LanternState[] = items.map((_, i) =>
    i < responses.length ? (responses[i].score === 1 ? "true" : responses[i].score > 0 ? "partial" : "miss") : i === index ? "current" : "pending",
  );
  const segMarks = seg ? item.parts!.map((_, i) => !!marks[i]) : [];

  return (
    <div className="mx-auto flex min-h-dvh max-w-4xl flex-col px-4 py-5">
      <RealmHeader
        location={location}
        tier={tier}
        right={
          <p className="plaque px-4 py-2 font-mono text-sm text-gold" aria-live="polite">
            Echo {index + 1} / {items.length}
          </p>
        }
      />

      <div className="mt-4 flex flex-wrap justify-center gap-0.5" aria-label="Progress">
        {lanterns.map((s, i) => (
          <Lantern key={i} state={s} label={`Echo ${i + 1}: ${s}`} />
        ))}
      </div>

      <section className="plaque rise mt-3 flex-1 p-5 text-center md:p-8" key={item.key} aria-live="polite">
        <Archivist speaking={speaking} onReplay={voiceOn && !item.noReplay ? replay : undefined} />
        {item.noReplay && <p className="text-sm text-stone italic">Said once only</p>}
        {item.tag && <p className="eyebrow mt-4">{item.tag}</p>}
        <div className="mt-4 space-y-3">
          {item.lines.map((line, i) => (
            <p
              key={i}
              className={
                i === big
                  ? item.kind === "digits"
                    ? "font-mono text-4xl tracking-[0.18em] text-gold md:text-6xl"
                    : item.kind === "isolation"
                      ? "text-3xl text-gold italic md:text-5xl"
                      : "font-mono text-3xl tracking-[0.06em] text-gold md:text-5xl"
                  : "text-2xl text-bone md:text-3xl"
              }
            >
              {item.kind === "digits" && i === big
                ? item.digits!.map((d, di) => (
                    <span key={di} className={mark === di ? "text-white drop-shadow-[0_0_14px_rgba(255,224,140,0.9)]" : ""}>
                      {d}
                      {di < item.digits!.length - 1 ? " " : ""}
                    </span>
                  ))
                : line}
            </p>
          ))}
        </div>

        {seg && (
          <div className="mt-7">
            <p className="eyebrow">Tap each gear the child said correctly</p>
            <div className="mt-3 flex flex-wrap justify-center gap-3">
              {item.parts!.map((p, i) => (
                <SegGear
                  key={i}
                  index={i}
                  label={settings.showKey ? p : ""}
                  on={segMarks[i]}
                  onToggle={() => setMarks(item.parts!.map((_, j) => (j === i ? !segMarks[j] : segMarks[j])))}
                />
              ))}
            </div>
            <div className="mt-2 flex justify-center gap-3 text-sm">
              <button className="cursor-pointer text-sandstone underline underline-offset-4 hover:text-gold" onClick={() => setMarks(item.parts!.map(() => true))}>
                All correct
              </button>
              <button className="cursor-pointer text-sandstone underline underline-offset-4 hover:text-gold" onClick={() => setMarks([])}>
                Clear
              </button>
            </div>
          </div>
        )}
      </section>

      <section className="plaque sticky bottom-3 z-20 mt-3 p-5" aria-label="Keeper’s panel">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="eyebrow">Keeper’s panel</p>
            {settings.showKey && !seg ? (
              <p className="mt-1 text-xl text-parchment">
                Target: <span className="font-mono text-gold">{item.answer}</span>
              </p>
            ) : settings.showKey && seg ? (
              <p className="mt-1 text-xl text-parchment">
                Target: <span className="font-mono text-gold">{item.answer}</span>
              </p>
            ) : (
              <p className="mt-1 text-base text-stone italic">Blind scoring: answers are hidden.</p>
            )}
          </div>

          {seg ? (
            <button className="btn btn-brass" onClick={() => score(segMarks.filter(Boolean).length / item.parts!.length)}>
              Seal this echo · {segMarks.filter(Boolean).length} of {item.parts!.length}
            </button>
          ) : (
            <div className="flex flex-wrap gap-3">
              <button className="btn btn-miss" onClick={() => score(0)}>
                Not yet
                <kbd className="rounded border border-white/30 px-1.5 text-[0.7rem] tracking-normal normal-case">X</kbd>
              </button>
              <button className="btn btn-true" onClick={() => score(1)}>
                True echo
                <kbd className="rounded border border-black/30 px-1.5 text-[0.7rem] tracking-normal normal-case">C</kbd>
              </button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
