"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { IslandMap } from "@/components/IslandMap";
import { SceneBackdrop } from "@/components/SceneBackdrop";
import { useSession } from "@/components/SessionProvider";
import { Archivist } from "@/components/Archivist";
import { ISLAND, selectLine } from "@/lib/narration";
import { useCanSpeak, useNarrate } from "@/lib/useNarrate";
import { LOCATIONS, LOCATION_BY_ID, RAPID_TASKS, TIERS, type LocationId } from "@/lib/game";

export default function Island() {
  const router = useRouter();
  const { configured, settings, subtests, rapid } = useSession();
  const [selected, setSelected] = useState<LocationId | null>(null);

  useEffect(() => {
    if (!configured) router.replace("/setup");
  }, [configured, router]);

  const done: Partial<Record<LocationId, boolean>> = {
    ...Object.fromEntries(Object.keys(subtests).map((k) => [k, true])),
    rapid: Object.keys(rapid).length > 0,
  };
  const visited = LOCATIONS.filter((l) => done[l.id]).length;
  const sel = selected ? LOCATION_BY_ID[selected] : null;
  const tier = TIERS[settings.tier];
  const canSpeakNow = useCanSpeak();
  const voiceOn = settings.voice && canSpeakNow && configured;
  const { speaking, replay } = useNarrate(
    sel ? selectLine(sel.name, sel.blurb) : ISLAND,
    voiceOn,
    sel?.id ?? "island",
  );

  return (
    <main className="relative min-h-dvh px-4 pt-5 pb-10 md:px-8">
      <SceneBackdrop scene="haze" dim={0.5} />

      <header className="mx-auto flex max-w-[1400px] flex-wrap items-end justify-between gap-4">
        <div>
          <Link href="/" className="eyebrow hover:text-gold">
            The Isle of Echoes
          </Link>
          <h1 className="engraved mt-1 text-2xl text-bone md:text-3xl">Choose a realm</h1>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <span className="plaque px-4 py-2 font-mono text-sm text-parchment">
            Tier {tier.id} · ages {tier.ages}
            {settings.traveler ? ` · ${settings.traveler}` : ""}
          </span>
          <span className="plaque px-4 py-2 font-mono text-sm text-gold">
            {visited} / {LOCATIONS.length} realms
          </span>
          <Link href="/setup" className="btn btn-stone !min-h-10 !px-4 !py-2">
            Settings
          </Link>
          <Link href="/ledger" className={`btn ${visited ? "btn-brass" : "btn-stone"} !min-h-10 !px-4 !py-2`}>
            Open the ledger
          </Link>
        </div>
      </header>

      <div className="mx-auto mt-4 max-w-[1400px]">
        <div className="plaque overflow-hidden !p-0">
          <div className="grain relative aspect-[1200/720] w-full">
            <IslandMap selected={selected} done={done} onSelect={setSelected} />
            <div className="vignette pointer-events-none absolute inset-0" />
          </div>
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
          <section className="plaque flex min-h-[10.5rem] items-center gap-5 p-6" aria-live="polite">
            <Archivist speaking={speaking} onReplay={voiceOn ? replay : undefined} />
            <div className="min-w-0 flex-1">
            {sel ? (
              <div className="rise" key={sel.id}>
                <p className="eyebrow">
                  {sel.battery} · {sel.subtest}
                </p>
                <h2 className="engraved mt-1 text-2xl text-bone">{sel.name}</h2>
                <p className="mt-2 text-lg text-parchment/85 italic">{sel.blurb}</p>
                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <Link href={`/play/${sel.id}`} className="btn btn-brass">
                    {done[sel.id] ? "Return to the realm" : "Enter the realm"}
                  </Link>
                  {sel.id === "rapid" && (
                    <span className="text-base text-stone">{RAPID_TASKS.map((t) => t.label).join(" · ")}</span>
                  )}
                </div>
              </div>
            ) : (
              <div>
                <p className="eyebrow">The island waits</p>
                <p className="mt-2 text-lg text-parchment/85 italic">
                  Touch a glowing lantern on the map, or pick a realm from the list. Realms can be visited in any order, and the Keeper may
                  split the journey across two sittings.
                </p>
              </div>
            )}
            </div>
          </section>

          <nav aria-label="Realms" className="plaque p-4">
            <ul className="grid gap-2 sm:grid-cols-2">
              {LOCATIONS.map((l) => (
                <li key={l.id}>
                  <button
                    onClick={() => setSelected(l.id)}
                    aria-pressed={selected === l.id}
                    className={`flex w-full cursor-pointer items-center gap-3 rounded border px-3 py-2 text-left transition ${
                      selected === l.id ? "border-gold bg-brass/15" : "border-white/10 hover:border-brass/60"
                    }`}
                  >
                    <span
                      className={`grid h-6 w-6 shrink-0 place-items-center rounded-full text-xs ${
                        done[l.id] ? "bg-moss text-black" : "bg-gold/90 text-[#5b3d08]"
                      }`}
                      aria-hidden
                    >
                      {done[l.id] ? "✓" : "•"}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate font-display text-[0.8rem] tracking-[0.1em] text-bone uppercase">{l.name}</span>
                      <span className="block truncate text-sm text-stone">{l.subtest}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </div>
    </main>
  );
}
