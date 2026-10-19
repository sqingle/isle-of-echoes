import "server-only";
import { DEFAULT_MODEL } from "./config";
import { getAnthropic } from "./client";
import { BATTERIES, attemptedBatteries, describeScores, type Letter, type LetterRequest } from "@/lib/letter";

const SYSTEM = `You are the Keeper of the Isle of Echoes, writing a short letter to a parent or teacher (the "Keeper" of a child traveler) after the child played an informal phonological screening game. The adult is not a specialist. Your job is to make the score sheet understandable and useful at home.

Hard rules. Break none of them:
- Never use the words "dyslexia", "dyslexic", "diagnosis", "diagnose", "disorder", "disability" or "at risk", and never imply the child has or does not have any condition. These are informal, illustrative, non-normed observations, not test results.
- Treat the three batteries (Phonological Awareness, Phonological Memory, Rapid Naming) separately. Never add them together, average them, rank them against each other into one overall verdict, or give an overall score.
- Never compare the child to norms, percentiles, grade-level "expectations" or other children. Describe only what happened in this session.
- Write one summary entry for each battery that was attempted, and none for a battery marked "Not attempted".
- Write at about a 6th-grade reading level: short sentences, everyday words, no jargon. If you must name a skill, explain it in plain words (for example, "blending: hearing separate sounds and joining them into a word").
- Refer to the child only as "your traveler". You do not know their name, age beyond the band, or gender.
- Be warm and honest. Do not catastrophize and do not falsely reassure.
- Activities: 3 to 5 short, playful, screen-free things to try at home this week, each tied to a subtest the child found harder (or, if nothing was hard, to keep strengths growing). Each takes 5 minutes or less and needs no special materials.
- next_steps: one or two sentences on when it would be worth talking to the child's teacher, a reading specialist or a licensed evaluator, phrased as an option, not an alarm. The page adds its own fixed disclaimer, so do not repeat one.

Deliver the letter by calling the save_letter tool exactly once. Do not write anything outside the tool call.`;

const SAVE_LETTER = {
  name: "save_letter",
  description: "Save the finished Keeper's Letter so the ledger page can show it as cards.",
  strict: true,
  input_schema: {
    type: "object" as const,
    additionalProperties: false,
    properties: {
      summary: {
        type: "array",
        description: "What we noticed: one plain-language entry per attempted battery, never combined.",
        items: {
          type: "object",
          additionalProperties: false,
          properties: {
            battery: { type: "string", enum: BATTERIES },
            text: { type: "string", description: "Two to four short sentences." },
          },
          required: ["battery", "text"],
        },
      },
      strengths: { type: "string", description: "Two or three sentences on what went well." },
      activities: {
        type: "array",
        description: "Three to five short, game-like activities for this week.",
        items: {
          type: "object",
          additionalProperties: false,
          properties: {
            title: { type: "string", description: "A playful name, at most six words." },
            how: { type: "string", description: "How to play it, two or three sentences." },
            subtest: { type: "string", description: "The subtest it practises, e.g. Blending." },
          },
          required: ["title", "how", "subtest"],
        },
      },
      next_steps: { type: "string" },
    },
    required: ["summary", "strengths", "activities", "next_steps"],
  },
};

// Belt and braces: the prompt forbids these, and a letter that slips is regenerated.
const FORBIDDEN = /dyslexi|diagnos|disorder|disabilit|at[- ]risk|percentile/i;

function validate(data: unknown, req: LetterRequest): Letter {
  const d = data as { summary?: unknown; strengths?: unknown; activities?: unknown; next_steps?: unknown };
  if (!d || !Array.isArray(d.summary) || typeof d.strengths !== "string" || !Array.isArray(d.activities) || typeof d.next_steps !== "string") {
    throw new Error("Malformed letter");
  }
  const entries = d.summary as { battery?: unknown; text?: unknown }[];
  // keep one entry per attempted battery, in the ledger's order
  const summary = attemptedBatteries(req).flatMap((battery) => {
    const s = entries.find((e) => e?.battery === battery && typeof e.text === "string");
    return s ? [{ battery, text: s.text as string }] : [];
  });
  const activities = (d.activities as { title?: unknown; how?: unknown; subtest?: unknown }[])
    .filter((a) => a && typeof a.title === "string" && typeof a.how === "string")
    .slice(0, 5)
    .map((a) => ({ title: String(a.title), how: String(a.how), subtest: String(a.subtest ?? "") }));
  if (!summary.length || activities.length < 3) throw new Error("Malformed letter: too short");
  const letter: Letter = { summary, strengths: d.strengths, activities, nextSteps: d.next_steps };
  if (FORBIDDEN.test(JSON.stringify(letter))) throw new Error("Malformed letter: forbidden wording");
  return letter;
}

async function writeLetterOnce(req: LetterRequest): Promise<Letter> {
  const response = await getAnthropic().beta.messages.create({
    model: DEFAULT_MODEL,
    max_tokens: 16000,
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    output_config: { effort: "medium" },
    system: SYSTEM,
    tools: [SAVE_LETTER],
    messages: [
      {
        role: "user",
        content: `Here is this session's score sheet. Write the Keeper's Letter with save_letter.\n\n${describeScores(req)}`,
      },
    ],
  });
  if (response.stop_reason === "refusal") throw new Error("The Keeper declined to write this letter.");
  const block = response.content.find((b) => b.type === "tool_use");
  if (!block || block.type !== "tool_use") throw new Error("Malformed letter: no tool call");
  try {
    return validate(block.input, req);
  } catch (err) {
    console.error("Bad letter", response.stop_reason, JSON.stringify(block.input).slice(0, 600));
    throw err;
  }
}

// A malformed or off-rules letter is rare; a fresh attempt usually fixes it.
export async function writeLetter(req: LetterRequest): Promise<Letter> {
  for (let attempt = 1; ; attempt++) {
    try {
      return await writeLetterOnce(req);
    } catch (err) {
      const malformed = err instanceof Error && err.message.startsWith("Malformed");
      if (!malformed || attempt >= 3) throw err;
    }
  }
}
