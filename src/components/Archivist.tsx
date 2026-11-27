"use client";

import Image from "next/image";

/** The Archivist: a hooded silver fox with a lantern. Glows while speaking; tap to hear the line again. */
export function Archivist({ speaking, onReplay, disabled, size = 88 }: { speaking: boolean; onReplay?: () => void; disabled?: boolean; size?: number }) {
  // the cloak runs off the bottom of the painting, so fade it out rather than leave a hard edge
  const art = (
    <Image
      src="/art/archivist-fox.png"
      alt=""
      width={Math.round(size * 2.6)}
      height={Math.round((size * 2.6 * 396) / 600)}
      loading="eager"
      className="relative h-auto max-w-[55vw] [mask-image:linear-gradient(to_bottom,black_80%,transparent)]"
    />
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
          {speaking && <span className="animate-flicker absolute inset-[15%] rounded-full bg-gold/35 blur-2xl" />}
          {art}
        </button>
      ) : (
        art
      )}
      <span className="font-display text-[0.62rem] tracking-[0.3em] text-brass uppercase">{speaking ? "The Archivist speaks" : "The Archivist"}</span>
    </div>
  );
}
