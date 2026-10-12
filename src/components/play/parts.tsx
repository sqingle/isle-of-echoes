import Link from "next/link";
import type { ReactNode } from "react";
import { TIERS, type Location, type Tier } from "@/lib/game";

export function RealmHeader({ location, tier, right }: { location: Location; tier: Tier; right?: ReactNode }) {
  return (
    <header className="flex flex-wrap items-start justify-between gap-3">
      <div className="rounded bg-abyss/55 px-4 py-2 backdrop-blur-sm">
        <Link href="/island" className="eyebrow hover:text-gold">
          ← The island
        </Link>
        <h1 className="engraved mt-1 text-2xl text-bone drop-shadow md:text-3xl">{location.name}</h1>
        <p className="font-display text-xs tracking-[0.24em] text-sandstone uppercase">
          {location.subtest} · Tier {tier} · ages {TIERS[tier].ages}
        </p>
      </div>
      {right}
    </header>
  );
}

export type LanternState = "pending" | "current" | "true" | "partial" | "miss";

export function Lantern({ state, label }: { state: LanternState; label: string }) {
  const lit = state === "true" || state === "partial";
  return (
    <span role="img" aria-label={label} className="relative inline-grid h-9 w-9 place-items-center">
      {lit && <span className="animate-flicker absolute inset-0 rounded-full bg-gold/40 blur-md" />}
      <svg viewBox="0 0 36 36" className="relative h-9 w-9">
        <rect x="16.5" y="0" width="3" height="6" fill="#4a4338" />
        <path d="M12 8 H24 L26 13 V25 L24 30 H12 L10 25 V13 Z" fill="#14181b" stroke={state === "current" ? "#f2cf7c" : "#8a6a24"} strokeWidth={state === "current" ? 2 : 1.4} />
        <circle
          cx="18"
          cy="19"
          r="6"
          fill={state === "true" ? "#ffe083" : state === "partial" ? "#e9b95a" : state === "miss" ? "#59372a" : "#252a2d"}
          className={state === "current" ? "animate-flicker" : ""}
        />
        {state === "miss" && <path d="M14.5 15.5 L21.5 22.5 M21.5 15.5 L14.5 22.5" stroke="#d98066" strokeWidth="1.8" strokeLinecap="round" />}
        <rect x="10" y="30" width="16" height="3.5" rx="1" fill="#4a4338" />
      </svg>
    </span>
  );
}

export function Rings({ active }: { active?: boolean }) {
  return (
    <span aria-hidden className="relative mx-auto block h-24 w-24">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="animate-ring absolute inset-0 rounded-full border border-gold/60"
          style={{ animationDelay: `${i * 1.05}s`, animationDuration: active ? "1.6s" : "3.6s" }}
        />
      ))}
      <span className="absolute inset-[38%] rounded-full bg-gold/80 shadow-[0_0_24px_6px_rgba(242,207,124,0.5)]" />
    </span>
  );
}
