import "server-only";
import Anthropic from "@anthropic-ai/sdk";

// Server-only Anthropic client. Never import this from a client component:
// the API key must not reach the browser. Call it from route handlers,
// server actions, or server components.
let client: Anthropic | undefined;

export function getAnthropic(): Anthropic {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error(
      "ANTHROPIC_API_KEY is not set. Copy .env.example to .env.local and add your key.",
    );
  }
  client ??= new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  return client;
}
