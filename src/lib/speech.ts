/** Browser speech synthesis, wrapped so that a whole script (words, pauses, digit cadence) plays as one cancellable unit. */

import manifestJson from "@/data/narrationManifest.json";

/** pre-rendered fixed lines, keyed "rate|text" → file in /narration */
const MANIFEST = manifestJson as Record<string, string>;
const staticKey = (text: string, rate?: number) => `${rate ?? ""}|${text}`;

export interface Segment {
  /** words to speak */
  text?: string;
  /** silence after the words, in ms */
  pause?: number;
  rate?: number;
  /** reported through onMark when this segment starts (used to light up digits) */
  mark?: number;
  /** pad this segment (speech plus pause) to at least this many ms */
  minMs?: number;
}

export function canSpeak(): boolean {
  return typeof window !== "undefined" && ("speechSynthesis" in window || "Audio" in window);
}

let current = 0;
let audio: HTMLAudioElement | null = null;

export function stopSpeech() {
  current++;
  if (audio) {
    audio.pause();
    audio = null;
  }
  if (typeof window !== "undefined" && "speechSynthesis" in window) window.speechSynthesis.cancel();
}

/** null = not yet known, false = server has no voice key (use the device voice) */
let neural: boolean | null = null;
export const usingNaturalVoice = () => neural !== false;

let probe: Promise<void> | null = null;
/** asks the server once whether a natural voice is configured, so clips are never requested in vain */
function probeVoice(): Promise<void> {
  probe ??= fetch("/api/narrate/status")
    .then((r) => r.json())
    .then((j: { provider: string | null }) => {
      neural = !!j.provider;
    })
    .catch(() => {
      probe = null;
    });
  return probe;
}

const clips = new Map<string, Promise<string | null>>();

function clip(text: string, rate?: number): Promise<string | null> {
  const key = `${rate ?? ""}|${text}`;
  let c = clips.get(key);
  if (!c) {
    const file = MANIFEST[staticKey(text, rate)];
    if (file) {
      c = fetch(`/narration/${file}`)
        .then(async (r) => (r.ok ? URL.createObjectURL(await r.blob()) : null))
        .catch(() => null);
      clips.set(key, c);
      void c.then((u) => {
        if (!u) clips.delete(key);
      });
      return c;
    }
    const q = new URLSearchParams({ t: text });
    if (rate) q.set("r", String(Math.round(rate * 10) / 10));
    c = fetch(`/api/narrate?${q}`)
      .then(async (r) => {
        if (r.status === 501) neural = false;
        if (!r.ok) return null;
        neural = true;
        return URL.createObjectURL(await r.blob());
      })
      .catch(() => null);
    clips.set(key, c);
    void c.then((u) => {
      if (!u) clips.delete(key);
    });
  }
  return c;
}

/** warm the cache for a script that is about to be needed */
export function preloadSegments(segments: Segment[]) {
  if (typeof window === "undefined") return;
  for (const s of segments) if (s.text && (neural === true || MANIFEST[staticKey(s.text, s.rate)])) void clip(s.text, s.rate);
}

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

function pickVoice(): SpeechSynthesisVoice | undefined {
  const voices = window.speechSynthesis.getVoices();
  return (
    voices.find((v) => v.lang === "en-US" && /samantha|google us|aria|jenny|natural/i.test(v.name)) ??
    voices.find((v) => v.lang.startsWith("en-US")) ??
    voices.find((v) => v.lang.startsWith("en"))
  );
}

function playClip(url: string): Promise<void> {
  return new Promise((resolve) => {
    const a = new Audio(url);
    audio = a;
    a.onended = () => resolve();
    a.onerror = () => resolve();
    a.play().catch(() => resolve());
  });
}

function say(text: string, rate: number): Promise<void> {
  return new Promise((resolve) => {
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "en-US";
    u.rate = rate;
    const v = pickVoice();
    if (v) u.voice = v;
    u.onend = () => resolve();
    u.onerror = () => resolve();
    window.speechSynthesis.speak(u);
  });
}

interface Callbacks {
  onStart?: () => void;
  onMark?: (n: number) => void;
  onEnd?: () => void;
}

/** Plays a script. Starting a new one cancels whatever is speaking. Returns a canceller. */
export function playSegments(segments: Segment[], cb: Callbacks = {}, baseRate = 0.85): () => void {
  if (!canSpeak()) {
    cb.onEnd?.();
    return () => {};
  }
  stopSpeech();
  const id = current;
  void (async () => {
    await sleep(80); // Chrome drops a speak() issued straight after cancel()
    if (id !== current) return;
    cb.onStart?.();

    // natural voice: fetch every clip first so playback has no gaps; any miss falls back to the device voice
    let urls: (string | null)[] | null = null;
    if (neural === null && segments.some((s) => s.text && !MANIFEST[staticKey(s.text, s.rate)])) await probeVoice();
    if (id !== current) return;
    // a script plays in the natural voice only if every line has a clip (pre-rendered, or from the voice server)
    const available = (s: Segment) => !s.text || !!MANIFEST[staticKey(s.text, s.rate)] || neural === true;
    if (segments.every(available)) {
      const got = await Promise.all(segments.map((s) => (s.text ? clip(s.text, s.rate) : Promise.resolve(""))));
      if (id !== current) return;
      if (got.every((u) => u !== null)) urls = got;
    }

    for (let i = 0; i < segments.length; i++) {
      const s = segments[i];
      if (id !== current) return;
      if (s.mark !== undefined) cb.onMark?.(s.mark);
      const t0 = performance.now();
      if (s.text) {
        if (urls?.[i]) await playClip(urls[i]!);
        else if ("speechSynthesis" in window) await say(s.text, s.rate ?? baseRate);
      }
      if (id !== current) return;
      const wait = (s.pause ?? 0) + (s.minMs ? Math.max(0, s.minMs - (performance.now() - t0) - (s.pause ?? 0)) : 0);
      if (wait > 0) await sleep(wait);
    }
    if (id === current) {
      cb.onMark?.(-1);
      cb.onEnd?.();
    }
  })();
  return () => {
    if (id === current) {
      stopSpeech();
      cb.onMark?.(-1);
      cb.onEnd?.();
    }
  };
}
