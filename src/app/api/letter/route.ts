import { NextResponse } from "next/server";
import { writeLetter } from "@/lib/ai/letter";
import { parseLetterRequest } from "@/lib/letter";

export const maxDuration = 120;

const hits = new Map<string, number[]>();

/** crude per-instance limiter: 6 letters a minute per client */
function limited(ip: string): boolean {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < 60_000);
  recent.push(now);
  hits.set(ip, recent);
  if (hits.size > 5000) hits.clear();
  return recent.length > 6;
}

export async function POST(request: Request) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: "The Keeper’s Letter is not set up on this site yet (ANTHROPIC_API_KEY is missing)." }, { status: 501 });
  }

  // only our own pages may spend the model budget
  const site = request.headers.get("sec-fetch-site");
  if (site && site !== "same-origin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  if (limited(ip)) return NextResponse.json({ error: "The Keeper needs a moment. Try again in a minute." }, { status: 429 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  const scores = parseLetterRequest(body);
  if (!scores) return NextResponse.json({ error: "Visit at least one realm before asking for a letter." }, { status: 400 });

  try {
    return NextResponse.json(await writeLetter(scores));
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "The Keeper’s quill slipped. Please try again." }, { status: 502 });
  }
}
