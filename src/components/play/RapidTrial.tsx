"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { useSession } from "@/components/SessionProvider";
import {
  COLOR_NAMES,
  LOCATIONS,
  RAPID_FORMS,
  RAPID_TASKS,
  SHAPE_NAMES,
  fmtSeconds,
  rapidGrid,
  practiceRow,
  randomForm,
  type Location,
  type RapidId,
  type SubtestId,
} from "@/lib/game";
import { Archivist } from "@/components/Archivist";
import { rapidDone, rapidGo, rapidIntro } from "@/lib/narration";
import { useCanSpeak, useNarrate } from "@/lib/useNarrate";
import { RealmHeader } from "./parts";

type Phase = "choose" | "practice" | "ready" | "timing" | "mark" | "done";

const STAR = Array.from({ length: 10 })
  .map((_, i) => {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const r = i % 2 ? 8 : 18;
    return `${(20 + Math.cos(a) * r).toFixed(1)},${(21 + Math.sin(a) * r).toFixed(1)}`;
  })
  .join(" ");

function Glyph({ id, code }: { id: RapidId; code: string }) {
  if (id === "digit" || id === "letter") {
    return <span className="font-mono text-[clamp(1.1rem,3.6vw,2.2rem)] leading-none font-medium text-[#1b1813]">{code}</span>;
  }
  if (id === "color") {
    return <span className="block h-[62%] w-[62%] rounded-[2px] shadow-inner" style={{ background: COLOR_NAMES[code]?.hex }} aria-label={COLOR_NAMES[code]?.name} />;
  }
  const fill = "#1b1813";
  return (
    <svg viewBox="0 0 40 40" className="h-[64%] w-[64%]" role="img" aria-label={SHAPE_NAMES[code]}>
      {code === "T" && <polygon points="20,5 36,34 4,34" fill={fill} />}
      {code === "S" && <rect x="6" y="6" width="28" height="28" fill={fill} />}
      {code === "O" && <circle cx="20" cy="20" r="15" fill={fill} />}
      {code === "D" && <polygon points="20,3 37,20 20,37 3,20" fill={fill} />}
      {code === "X" && <polygon points={STAR} fill={fill} />}
      {code === "H" && <path d="M20 35 C6 24 3 17 3 12 C3 7 7 4 11 4 C15 4 18 6 20 10 C22 6 25 4 29 4 C33 4 37 7 37 12 C37 17 34 24 20 35Z" fill={fill} />}
    </svg>
  );
}

function Grid({ id, rows, marks, onCell }: { id: RapidId; rows: string[][]; marks?: number[]; onCell?: (i: number) => void }) {
  const cols = rows[0].length;
  return (
    <div className="grid gap-[3px] rounded bg-black/40 p-[3px]" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
      {rows.flat().map((c, i) => {
        const m = marks?.[i] ?? 0;
        const Tag = onCell ? "button" : "div";
        return (
          <Tag
            key={i}
            {...(onCell ? { type: "button" as const, onClick: () => onCell(i), "aria-label": `Cell ${i + 1}: ${m === 0 ? "no error" : m === 1 ? "error" : "self-corrected"}` } : {})}
            className={`relative grid aspect-square place-items-center bg-bone transition ${onCell ? "cursor-pointer hover:brightness-95" : ""} ${
              m === 1 ? "!bg-[#e9a090] ring-2 ring-inset ring-[#a63b27]" : m === 2 ? "!bg-[#f1dc9a] ring-2 ring-inset ring-[#a07c1c]" : ""
            }`}
          >
            <Glyph id={id} code={c} />
            {m === 2 && <span className="absolute top-0.5 right-1 font-display text-[0.55rem] text-[#6b4e0e]">SC</span>}
          </Tag>
        );
      })}
    </div>
  );
}

export function RapidTrial({ location }: { location: Location }) {
  const { settings, rapid, subtests, saveRapid } = useSession();
  const tier = settings.tier;

  const [phase, setPhase] = useState<Phase>("choose");
  const [task, setTask] = useState<RapidId>(tier === 0 ? "color" : "digit");
  const [form, setForm] = useState<string>("random");
  const [usedForm, setUsedForm] = useState("A");
  const [grid, setGrid] = useState<string[][]>([]);
  const [practice, setPractice] = useState<string[]>([]);
  const [marks, setMarks] = useState<number[]>([]);
  const [elapsed, setElapsed] = useState(0);
  const [manual, setManual] = useState("");
  const startRef = useRef(0);

  const meta = RAPID_TASKS.find((t) => t.id === task)!;
  const gated = tier === 0 && (task === "digit" || task === "letter");

  useEffect(() => {
    if (phase !== "timing") return;
    const t = setInterval(() => setElapsed((performance.now() - startRef.current) / 1000), 100);
    return () => clearInterval(t);
  }, [phase]);

  const startPractice = (id: RapidId) => {
    const pick = form === "random" ? randomForm() : form;
    setTask(id);
    setUsedForm(pick);
    setGrid(rapidGrid(id, tier, pick));
    setPractice(practiceRow(id, tier));
    setMarks([]);
    setElapsed(0);
    setManual("");
    setPhase("practice");
  };

  const startClock = () => {
    startRef.current = performance.now();
    setElapsed(0);
    setPhase("timing");
  };

  const stopClock = () => {
    const s = (performance.now() - startRef.current) / 1000;
    setElapsed(Math.round(s * 10) / 10);
    setPhase("mark");
  };

  const cycle = useCallback(
    (i: number) =>
      setMarks((m) => {
        const next = [...m];
        next[i] = ((next[i] ?? 0) + 1) % 3;
        return next;
      }),
    [],
  );

  const errors = marks.filter((m) => m === 1).length;
  const selfCorrected = marks.filter((m) => m === 2).length;

  const seal = () => {
    const typed = parseFloat(manual);
    const seconds = Number.isFinite(typed) && typed > 0 ? typed : elapsed;
    saveRapid({ id: task, tier, form: usedForm, seconds, errors: errors + selfCorrected, selfCorrected, notGiven: false });
    setElapsed(seconds);
    setPhase("done");
  };

  const notGiven = () => {
    saveRapid({ id: task, tier, form: usedForm, seconds: null, errors: 0, selfCorrected: 0, notGiven: true });
    setPhase("choose");
  };

  const isDone = (id: string) => (id === "rapid" ? Object.keys(rapid).length > 0 : !!subtests[id as SubtestId]);
  const nextRealm = LOCATIONS.find((l) => l.id !== "rapid" && !isDone(l.id));
  const order: RapidId[] = tier === 0 ? ["color", "shape", "digit", "letter"] : ["digit", "letter", "color", "shape"];

  const noun = meta.noun;
  const canSpeakNow = useCanSpeak();
  const voiceOn = settings.voice && canSpeakNow;
  const segments =
    phase === "practice"
      ? rapidIntro(noun, true)
      : phase === "ready"
        ? rapidGo
        : phase === "done"
          ? rapidDone
          : phase === "choose"
            ? [{ text: "These are the four walls of glyphs. Your Keeper will choose which one we name first." }]
            : null;
  const { speaking, replay } = useNarrate(segments, voiceOn && segments !== null, `${phase}:${task}`);
  const intro = `“Name every ${noun} on the wall, left to right, then the next row down, as fast as you can. Don’t skip any.”`;

  return (
    <div className="mx-auto flex min-h-dvh max-w-4xl flex-col px-4 py-5">
      <RealmHeader location={location} tier={tier} />

      {phase === "choose" && (
        <div className="plaque rise mt-5 p-6 md:p-9">
          <p className="eyebrow">Four glyph walls</p>
          <p className="mt-2 text-xl text-parchment/90 italic">
            Each wall is one complete grid, read in full, never sampled. Time and errors are recorded for each wall on its own.
          </p>
          {tier === 0 && (
            <p className="mt-3 rounded border border-brass/40 bg-brass/10 p-3 text-base text-gold">
              Ages 4–6: give Color and Shape first. Give Digit or Letter only if the child names every symbol in the practice row; otherwise
              mark it “not given”.
            </p>
          )}
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <label htmlFor="form" className="eyebrow">
              Grid form
            </label>
            <select
              id="form"
              value={form}
              onChange={(e) => setForm(e.target.value)}
              className="rounded border border-white/20 bg-black/40 px-3 py-2 font-mono text-bone focus:border-gold focus:outline-none"
            >
              <option value="random">Random</option>
              {RAPID_FORMS.map((f) => (
                <option key={f} value={f}>
                  Form {f}
                </option>
              ))}
            </select>
          </div>
          <ul className="mt-5 grid gap-3 sm:grid-cols-2">
            {order.map((id) => {
              const t = RAPID_TASKS.find((x) => x.id === id)!;
              const r = rapid[id];
              return (
                <li key={id}>
                  <button
                    onClick={() => startPractice(id)}
                    className="flex w-full cursor-pointer items-center justify-between gap-3 rounded border border-white/15 bg-black/25 p-4 text-left transition hover:border-gold"
                  >
                    <span>
                      <span className="engraved block text-lg text-bone">{t.label}</span>
                      <span className="block text-base text-stone">
                        {r ? (r.notGiven ? "Not given" : `${fmtSeconds(r.seconds ?? 0)} · ${r.errors} error${r.errors === 1 ? "" : "s"}`) : "Not yet attempted"}
                      </span>
                    </span>
                    <span aria-hidden className={`grid h-7 w-7 place-items-center rounded-full text-sm ${r ? "bg-moss text-black" : "bg-gold/90 text-[#5b3d08]"}`}>
                      {r ? "✓" : "•"}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link href="/island" className="btn btn-stone">
              Back to the island
            </Link>
            {Object.keys(rapid).length > 0 && (
              <Link href={nextRealm ? `/play/${nextRealm.id}` : "/ledger"} className="btn btn-brass">
                {nextRealm ? `On to ${nextRealm.name}` : "Open the ledger"}
              </Link>
            )}
          </div>
        </div>
      )}

      {phase !== "choose" && (
        <div className="mt-4 flex flex-wrap items-baseline justify-between gap-2 rounded bg-abyss/55 px-4 py-2 backdrop-blur-sm">
          <h2 className="engraved text-xl text-bone">
            {meta.label} <span className="text-sandstone">· Form {usedForm}</span>
          </h2>
          {(phase === "timing" || phase === "mark" || phase === "done") && (
            <p className="font-mono text-4xl text-gold tabular-nums" aria-live="off">
              {fmtSeconds(elapsed)}
            </p>
          )}
        </div>
      )}

      {phase === "practice" && (
        <div className="plaque rise mt-3 p-6 text-center md:p-9">
          <div className="mb-3 flex justify-center">
            <Archivist speaking={speaking} onReplay={voiceOn ? replay : undefined} />
          </div>
          <p className="eyebrow">Practice row</p>
          <p className="mx-auto mt-2 max-w-xl text-xl text-parchment/90 italic">{intro}</p>
          <div className="mx-auto mt-5 max-w-md">
            <Grid id={task} rows={[practice]} />
          </div>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            {gated ? (
              <>
                <button className="btn btn-brass" onClick={() => setPhase("ready")}>
                  Named every symbol · show the wall
                </button>
                <button className="btn btn-stone" onClick={notGiven}>
                  Not given
                </button>
              </>
            ) : (
              <button className="btn btn-brass" onClick={() => setPhase("ready")}>
                Practice done · show the wall
              </button>
            )}
            <button className="btn btn-stone" onClick={() => setPhase("choose")}>
              Choose another wall
            </button>
          </div>
        </div>
      )}

      {(phase === "ready" || phase === "timing" || phase === "mark" || phase === "done") && (
        <>
          <div className="mt-3">
            <Grid id={task} rows={grid} marks={phase === "timing" || phase === "mark" ? marks : phase === "done" ? marks : undefined} onCell={phase === "timing" || phase === "mark" ? cycle : undefined} />
          </div>
          <div className="plaque mt-3 p-5">
            {phase === "ready" && (
              <div className="flex flex-wrap items-center justify-between gap-4">
                <p className="max-w-lg text-lg text-parchment/90">Start the clock on the child’s first response.</p>
                <button className="btn btn-brass" onClick={startClock}>
                  Start the clock
                </button>
              </div>
            )}
            {phase === "timing" && (
              <div className="flex flex-wrap items-center justify-between gap-4">
                <p className="max-w-lg text-lg text-parchment/90">
                  Tap a tile to mark an error (tap again for self-corrected, again to clear). Stop the clock after the last symbol.
                </p>
                <button className="btn btn-miss" onClick={stopClock}>
                  Stop the clock
                </button>
              </div>
            )}
            {phase === "mark" && (
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                  <p className="text-lg text-parchment/90">
                    Errors <span className="font-mono text-gold">{errors + selfCorrected}</span> ({selfCorrected} self-corrected). Adjust tiles if
                    needed.
                  </p>
                  <label className="mt-2 flex items-center gap-2 text-base text-stone">
                    Use own stopwatch time (s)
                    <input
                      value={manual}
                      onChange={(e) => setManual(e.target.value)}
                      inputMode="decimal"
                      placeholder={elapsed.toFixed(1)}
                      className="w-24 rounded border border-white/20 bg-black/40 px-2 py-1 font-mono text-bone focus:border-gold focus:outline-none"
                    />
                  </label>
                </div>
                <button className="btn btn-brass" onClick={seal}>
                  Seal this wall
                </button>
              </div>
            )}
            {phase === "done" && (
              <div className="flex flex-wrap items-center justify-between gap-4">
                <p className="text-lg text-parchment/90">
                  Sealed: <span className="font-mono text-gold">{fmtSeconds(elapsed)}</span> with{" "}
                  <span className="font-mono text-gold">{errors + selfCorrected}</span> error{errors + selfCorrected === 1 ? "" : "s"} ({selfCorrected} self-corrected).
                </p>
                <div className="flex flex-wrap gap-3">
                  <button className="btn btn-stone" onClick={() => startPractice(task)}>
                    Redo this wall
                  </button>
                  <button className="btn btn-brass" onClick={() => setPhase("choose")}>
                    Next wall
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
