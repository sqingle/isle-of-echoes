/** Server-side text-to-speech for the Archivist. Picks a provider from the environment. */

export type Provider = "elevenlabs" | "openai";

export function provider(): Provider | null {
  if (process.env.ELEVENLABS_API_KEY) return "elevenlabs";
  if (process.env.OPENAI_API_KEY) return "openai";
  return null;
}

const PERSONA =
  "You are the Archivist, an ageless, warm and gentle keeper of an island's memories, speaking to a young child. " +
  "Natural, unhurried and kind, like a favourite storyteller. Speak clearly and slowly. Never sound robotic or rushed. " +
  "When given a single word, a made-up word or a short sound such as 'sss' or 'tuh', say exactly that, crisply, with no extra words.";

export async function synthesize(text: string, rate: number | null): Promise<Response> {
  const p = provider();
  if (p === "elevenlabs") {
    const voice = process.env.ELEVENLABS_VOICE_ID ?? "JBFqnCBsd6RMkjVDRZzb"; // a warm, mature narrator voice
    return fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voice}?output_format=mp3_44100_128`, {
      method: "POST",
      headers: { "xi-api-key": process.env.ELEVENLABS_API_KEY!, "content-type": "application/json" },
      body: JSON.stringify({
        text,
        model_id: process.env.ELEVENLABS_MODEL ?? "eleven_turbo_v2_5",
        voice_settings: { stability: 0.55, similarity_boost: 0.8, style: 0.25, speed: rate ? Math.min(1.2, Math.max(0.7, rate + 0.1)) : 0.95 },
      }),
    });
  }
  return fetch("https://api.openai.com/v1/audio/speech", {
    method: "POST",
    headers: { authorization: `Bearer ${process.env.OPENAI_API_KEY}`, "content-type": "application/json" },
    body: JSON.stringify({
      model: process.env.OPENAI_TTS_MODEL ?? "gpt-4o-mini-tts",
      voice: process.env.ARCHIVIST_VOICE ?? "sage",
      input: text,
      instructions: PERSONA,
      response_format: "mp3",
      speed: rate ? Math.min(1.1, Math.max(0.7, rate + 0.1)) : 0.95,
    }),
  });
}
