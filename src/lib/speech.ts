/** Thin wrapper over the browser’s speech synthesis. Every call is a no-op when unsupported. */

export function canSpeak(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

export function stopSpeech() {
  if (canSpeak()) window.speechSynthesis.cancel();
}

function pickVoice(): SpeechSynthesisVoice | undefined {
  const voices = window.speechSynthesis.getVoices();
  return (
    voices.find((v) => v.lang === "en-US" && /samantha|google us|aria|jenny|natural/i.test(v.name)) ??
    voices.find((v) => v.lang.startsWith("en-US")) ??
    voices.find((v) => v.lang.startsWith("en"))
  );
}

export function speak(text: string, rate = 0.82): Promise<void> {
  if (!canSpeak()) return Promise.resolve();
  return new Promise((resolve) => {
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "en-US";
    u.rate = rate;
    u.pitch = 1;
    const v = pickVoice();
    if (v) u.voice = v;
    u.onend = () => resolve();
    u.onerror = () => resolve();
    window.speechSynthesis.speak(u);
  });
}

/** Digits are read at a steady one-per-second pace, flat tone, as the guide requires. */
export async function speakDigits(digits: string[], onDigit?: (i: number) => void): Promise<void> {
  if (!canSpeak()) return;
  stopSpeech();
  let cancelled = false;
  const stop = () => {
    cancelled = true;
  };
  window.addEventListener("pagehide", stop, { once: true });
  for (let i = 0; i < digits.length; i++) {
    if (cancelled) return;
    onDigit?.(i);
    const started = performance.now();
    await speak(digits[i], 0.9);
    const wait = 1000 - (performance.now() - started);
    if (wait > 0) await new Promise((r) => setTimeout(r, wait));
  }
  onDigit?.(-1);
}
