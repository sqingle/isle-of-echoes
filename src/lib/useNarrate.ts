"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { canSpeak, playSegments, type Segment } from "./speech";

export function useCanSpeak(): boolean {
  return useSyncExternalStore(
    () => () => {},
    canSpeak,
    () => false,
  );
}

/**
 * Speaks `segments` whenever `key` changes (and `enabled`), cancels on change or unmount,
 * and exposes `replay` for a speaker button. `mark` is the index of the digit being spoken.
 */
export function useNarrate(segments: Segment[] | null, enabled: boolean, key: string, replaySegments?: Segment[] | null) {
  const [speaking, setSpeaking] = useState(false);
  const [mark, setMark] = useState(-1);
  const latest = useRef<Segment[] | null>(segments);
  const again = useRef<Segment[] | null | undefined>(replaySegments);
  const cancel = useRef<() => void>(() => {});

  useEffect(() => {
    latest.current = segments;
    again.current = replaySegments;
  });

  const run = useCallback((replaying = false) => {
    const s = replaying && again.current ? again.current : latest.current;
    if (!s) return;
    cancel.current();
    cancel.current = playSegments(s, { onStart: () => setSpeaking(true), onMark: setMark, onEnd: () => setSpeaking(false) });
  }, []);

  useEffect(() => {
    if (!enabled) return;
    run(false);
    return () => cancel.current();
  }, [enabled, key, run]);

  const replay = useCallback(() => run(true), [run]);
  return { speaking, mark, replay };
}
