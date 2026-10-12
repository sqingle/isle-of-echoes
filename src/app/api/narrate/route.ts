import { provider, synthesize } from "@/lib/tts";

const MAX_CHARS = 320;
const hits = new Map<string, number[]>();

/** crude per-instance limiter: 90 uncached clips a minute per client */
function limited(ip: string): boolean {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < 60_000);
  recent.push(now);
  hits.set(ip, recent);
  if (hits.size > 5000) hits.clear();
  return recent.length > 90;
}

export async function GET(request: Request) {
  if (!provider()) return new Response("Narration voice is not configured", { status: 501 });

  // only our own pages may spend the voice budget
  const site = request.headers.get("sec-fetch-site");
  if (site && site !== "same-origin") return new Response("Forbidden", { status: 403 });

  const url = new URL(request.url);
  const text = (url.searchParams.get("t") ?? "").trim();
  const rate = Number(url.searchParams.get("r")) || null;
  if (!text || text.length > MAX_CHARS) return new Response("Bad request", { status: 400 });

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  if (limited(ip)) return new Response("Slow down", { status: 429 });

  const upstream = await synthesize(text, rate);
  if (!upstream.ok || !upstream.body) return new Response("Voice provider error", { status: 502 });

  return new Response(upstream.body, {
    headers: {
      "content-type": "audio/mpeg",
      // each phrase is generated once, then served from the CDN
      "cache-control": "public, max-age=31536000, s-maxage=31536000, immutable",
    },
  });
}
