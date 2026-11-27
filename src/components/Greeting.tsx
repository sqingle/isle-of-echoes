"use client";

import { Archivist } from "@/components/Archivist";
import { STORY } from "@/lib/narration";
import { useCanSpeak, useNarrate } from "@/lib/useNarrate";

/** The title screen cannot speak on its own (browsers need a tap first), so the Archivist waits to be called. */
export function Greeting() {
  const can = useCanSpeak();
  const { speaking, replay } = useNarrate(STORY, false, "story");
  if (!can) return null;
  return (
    <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
      <Archivist speaking={speaking} onReplay={replay} size={72} />
      <button className="btn btn-stone bg-abyss/60 backdrop-blur" onClick={replay}>
        {speaking ? "The Archivist is speaking…" : "Hear the Archivist"}
      </button>
    </div>
  );
}
