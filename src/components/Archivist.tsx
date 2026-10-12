"use client";

/** The Archivist: a hooded keeper with a lantern. Glows while speaking; tap to hear the line again. */
export function Archivist({ speaking, onReplay, disabled, size = 88 }: { speaking: boolean; onReplay?: () => void; disabled?: boolean; size?: number }) {
  const art = (
    <svg viewBox="0 0 100 110" width={size} height={size * 1.1} aria-hidden>
      <defs>
        <radialGradient id="arch-glow" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#ffe9a0" stopOpacity="0.9" />
          <stop offset="1" stopColor="#ffd96a" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="arch-robe" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#3a4a56" />
          <stop offset="1" stopColor="#161d23" />
        </linearGradient>
      </defs>
      <circle cx="78" cy="78" r={speaking ? 30 : 22} fill="url(#arch-glow)" className="animate-flicker" style={{ transition: "r .3s" }} />
      <path d="M50 8 C28 8 20 30 20 50 C20 70 10 86 6 106 H94 C90 86 80 70 80 50 C80 30 72 8 50 8Z" fill="url(#arch-robe)" stroke="#c9a24a" strokeOpacity="0.6" strokeWidth="1.2" />
      <path d="M50 18 C36 18 31 34 31 48 C31 60 40 68 50 68 C60 68 69 60 69 48 C69 34 64 18 50 18Z" fill="#06090b" />
      <circle cx="42" cy="46" r="2.6" fill="#ffd96a" className={speaking ? "animate-flicker" : ""} />
      <circle cx="58" cy="46" r="2.6" fill="#ffd96a" className={speaking ? "animate-flicker" : ""} />
      <path d="M72 70 V86" stroke="#6b5a3a" strokeWidth="2" />
      <rect x="68" y="80" width="10" height="14" rx="2" fill="#20170a" stroke="#c9a24a" strokeWidth="1.2" />
      <circle cx="73" cy="87" r="3.4" fill="#fff0b0" />
    </svg>
  );
  return (
    <div className="inline-flex flex-col items-center gap-1 text-center">
      {onReplay ? (
        <button
          type="button"
          onClick={onReplay}
          disabled={disabled}
          aria-label="The Archivist: tap to hear again"
          title="Tap to hear the Archivist again"
          className="relative cursor-pointer rounded-full p-1 transition hover:scale-105 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {speaking && <span className="animate-ring absolute inset-0 rounded-full border border-gold/70" />}
          {art}
        </button>
      ) : (
        art
      )}
      <span className="font-display text-[0.62rem] tracking-[0.3em] text-brass uppercase">{speaking ? "The Archivist speaks" : "The Archivist"}</span>
    </div>
  );
}
