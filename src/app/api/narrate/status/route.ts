import { provider } from "@/lib/tts";

export function GET() {
  return Response.json({ provider: provider() }, { headers: { "cache-control": "no-store" } });
}
