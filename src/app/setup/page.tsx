"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useSyncExternalStore } from "react";
import { SceneBackdrop } from "@/components/SceneBackdrop";
import { useSession } from "@/components/SessionProvider";
import { TIERS, type Tier } from "@/lib/game";
import { canSpeak } from "@/lib/speech";

function Toggle({ checked, onChange, label, hint }: { checked: boolean; onChange: (v: boolean) => void; label: string; hint: string }) {
  return (
    <label className="flex cursor-pointer items-start gap-4 rounded border border-white/10 bg-black/20 p-4 hover:border-brass/50">
      <span className="relative mt-1 inline-block h-6 w-11 shrink-0">
        <input type="checkbox" className="peer sr-only" checked={checked} onChange={(e) => onChange(e.target.checked)} />
        <span className="absolute inset-0 rounded-full bg-slate transition peer-checked:bg-brass peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-gold" />
        <span className="absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-bone shadow transition peer-checked:translate-x-5" />
      </span>
      <span>
        <span className="block font-display text-sm tracking-[0.14em] text-bone uppercase">{label}</span>
        <span className="block text-base text-stone">{hint}</span>
      </span>
    </label>
  );
}

export default function Setup() {
  const router = useRouter();
  const { settings, configure } = useSession();
  const [tier, setTier] = useState<Tier>(settings.tier);
  const [n, setN] = useState(settings.itemsPerRealm);
  const [showKey, setShowKey] = useState(settings.showKey);
  const [voice, setVoice] = useState(settings.voice);
  const [traveler, setTraveler] = useState(settings.traveler);
  const voiceOk = useSyncExternalStore(
    () => () => {},
    canSpeak,
    () => false,
  );

  return (
    <main className="relative min-h-dvh px-5 py-10 md:py-16">
      <SceneBackdrop scene="elision" dim={0.45} />
      <div className="mx-auto max-w-3xl">
        <Link href="/" className="eyebrow hover:text-gold">
          ← The shore
        </Link>
        <div className="plaque rise mt-4 p-6 md:p-10">
          <p className="eyebrow">The Keeper’s ledger</p>
          <h1 className="engraved mt-2 text-3xl text-bone md:text-4xl">Prepare the crossing</h1>
          <p className="mt-3 text-lg text-parchment/80">
            Choose where the traveler begins. Each realm opens at this tier; the island will step back a tier on its own if the first three
            echoes are missed.
          </p>

          <fieldset className="mt-8">
            <legend className="eyebrow mb-3">Tier by age or grade</legend>
            <div className="grid gap-3 sm:grid-cols-2">
              {TIERS.map((t) => (
                <label
                  key={t.id}
                  className={`cursor-pointer rounded border p-4 transition has-[:checked]:border-gold has-[:checked]:bg-brass/15 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-gold ${
                    tier === t.id ? "border-gold" : "border-white/10 hover:border-brass/60"
                  }`}
                >
                  <input type="radio" name="tier" value={t.id} className="sr-only" checked={tier === t.id} onChange={() => setTier(t.id)} />
                  <span className="font-display text-xs tracking-[0.28em] text-brass uppercase">Tier {t.id}</span>
                  <span className="mt-1 block text-2xl text-bone">Ages {t.ages}</span>
                  <span className="block text-base text-stone">{t.grade}</span>
                </label>
              ))}
            </div>
            {tier === 0 && (
              <p className="mt-3 text-base text-sandstone italic">
                At ages 4–6, give the two practice items in each realm first, keep the sitting to about 20 minutes, and start Rapid Naming
                with colors and shapes.
              </p>
            )}
          </fieldset>

          <div className="mt-8">
            <label htmlFor="n" className="eyebrow mb-3 block">
              Echoes per realm
            </label>
            <div className="flex items-center gap-4">
              <input
                id="n"
                type="range"
                min={4}
                max={16}
                step={1}
                value={n}
                onChange={(e) => setN(Number(e.target.value))}
                className="h-2 w-full max-w-sm cursor-pointer accent-[#c9a24a]"
              />
              <output htmlFor="n" className="w-10 font-mono text-2xl text-gold">
                {n}
              </output>
            </div>
            <p className="mt-1 text-base text-stone">
              Items are drawn at random without repeats from the 100-item pool for each tier, then ordered by difficulty.
            </p>
          </div>

          <div className="mt-8 grid gap-3">
            <Toggle
              checked={showKey}
              onChange={setShowKey}
              label="Show target answers"
              hint="Turn off for blind scoring. The Keeper then judges from their own ear."
            />
            <Toggle
              checked={voice && voiceOk}
              onChange={setVoice}
              label="Offer the island’s voice"
              hint={
                voiceOk
                  ? "Adds a “Hear it” button for real words, digit strings and nonwords. Your device’s voice may blur nonwords, so the Keeper’s own voice is always best."
                  : "Speech is not available in this browser. The Keeper reads every item aloud."
              }
            />
          </div>

          <div className="mt-8">
            <label htmlFor="who" className="eyebrow mb-2 block">
              Traveler’s name or initials <span className="text-stone normal-case tracking-normal">(optional, appears on the ledger only)</span>
            </label>
            <input
              id="who"
              value={traveler}
              maxLength={40}
              onChange={(e) => setTraveler(e.target.value)}
              autoComplete="off"
              className="w-full max-w-sm rounded border border-white/15 bg-black/30 px-4 py-3 text-xl text-bone placeholder:text-stone/60 focus:border-gold focus:outline-none"
              placeholder="e.g. A.R."
            />
          </div>

          <div className="mt-10 flex flex-wrap items-center gap-4">
            <button
              className="btn btn-brass"
              onClick={() => {
                configure({ tier, itemsPerRealm: n, showKey, voice: voice && voiceOk, traveler: traveler.trim() });
                router.push("/island");
              }}
            >
              Begin the crossing
            </button>
            <p className="text-base text-stone">Nothing is stored. Closing the tab ends the journey.</p>
          </div>
        </div>
      </div>
    </main>
  );
}
