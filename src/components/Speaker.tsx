"use client";

export function SpeakerButton({ onClick, speaking, label = "Hear it again", disabled }: { onClick: () => void; speaking: boolean; label?: string; disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className="group relative grid h-16 w-16 cursor-pointer place-items-center rounded-full border border-gold/60 bg-black/40 text-gold transition hover:bg-brass/20 disabled:cursor-not-allowed disabled:opacity-40"
    >
      {speaking && <span className="animate-ring absolute inset-0 rounded-full border border-gold" />}
      <svg viewBox="0 0 24 24" className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M4 9.5v5h3.5L12 19V5L7.5 9.5H4Z" fill="currentColor" fillOpacity="0.25" />
        <path d={speaking ? "M15.5 8.5a5 5 0 0 1 0 7M18 6a8.5 8.5 0 0 1 0 12" : "M15.5 9a4 4 0 0 1 0 6"} />
      </svg>
    </button>
  );
}
