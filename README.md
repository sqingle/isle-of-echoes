# The Isle of Echoes

A Myst-inspired island adventure that delivers an **informal phonological screening** (ages 4–14) as a game.
A Keeper (adult) reads each item aloud and taps whether the child answered correctly; the island supplies the atmosphere,
the pacing rules and the scoring.

> **Illustrative, non-normed, non-validated material.** Not the CTOPP-2, not a diagnostic instrument. Never use it alone to
> diagnose dyslexia or to support an IEP/504 decision. Results are shown for three batteries separately and never summed.

## What is in it

| Realm (map location) | Subtest | Battery |
| --- | --- | --- |
| The Whispering Colonnade | Elision | Phonological Awareness |
| Weaver’s Landing (dock) | Blending | Phonological Awareness |
| The Cogworks | Segmentation (tap each gear = proportion correct) | Phonological Awareness |
| The Dome Observatory | Phoneme Isolation | Phonological Awareness |
| The Star Skiff (rocket) | Nonword Elision / Blending | Phonological Awareness |
| The Numbered Library | Memory for Digits (1 digit / sec voice) | Phonological Memory |
| Echo Peak | Nonword Repetition | Phonological Memory |
| The Tilted Tower | Rapid Digit / Letter / Color / Shape Naming (timer + error tiles) | Rapid Naming |

Rules taken from the Administration & Scoring Guide:

- **Tier by age** (0: 4–6, 1: 7–8, 2: 9–11, 3: 12–14). Items are drawn at random without repeats from the 100-item pool per tier,
  then ordered by item number (difficulty).
- **Basal rule:** if the first 3 items are missed (first 2 for the memory subtests, which stop after 2 misses anyway), the island offers
  to step back one tier. At Tier 0 it records a below-floor score of 0.
- **Ceiling rule:** 5 consecutive misses end a Phonological Awareness realm; 2 end a Memory realm.
- **Rapid naming:** one complete 9-column grid per wall (Forms A–E), practice row first, stopwatch, tap tiles for errors
  (once = error, twice = self-corrected). At Tier 0 Digit/Letter are gated on the practice row.
- **Ledger:** per-battery tables, print view and CSV export. No composite is computed.

All data lives in memory for the length of the tab. Nothing is stored or sent anywhere.

## Run it

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # fully static output
npm run lint
```

Requires Node 20+. Next.js 16 (App Router), React 19, Tailwind CSS 4. The pages are static, so Vercel needs no configuration:
import the GitHub repo and deploy.

## Structure

```
src/
  app/                  / (title) · /setup · /island · /play/[id] · /ledger
  components/
    art.tsx             SVG scenery (columns, gears, dome, library, rocket, tower, forest, sea, sky)
    IslandMap.tsx       the interactive island, built from the same pieces
    SceneBackdrop.tsx   a full-screen scene per realm
    play/               ItemTrial (7 subtests) · RapidTrial · shared parts
    SessionProvider.tsx in-memory session (settings + results)
  lib/
    game.ts             tiers, realms, item preparation, scoring helpers
    speech.ts           browser speech synthesis (optional "Hear it")
  data/
    itemBank.json       2,800 items (7 subtests × 4 tiers × 100)
    rapidNaming.json    grids for 4 tasks × 4 tiers × forms A–E
```

## Visual direction

Weathered sandstone columns, rusted iron gears, moss on basalt, hazy gold light over a deep sea-and-sky blue, with a
MYST-style amber-to-umber title wash (Cinzel) and Cormorant Garamond body text. Every scene is drawn in code
as SVG; no third-party artwork is included.

## The Archivist (narration)

A hooded keeper greets the traveler and guides the whole game aloud, so the child never has to read: the welcome on the
title screen, a spoken introduction and rules for every realm, a short lead-in before each item, the items themselves
(words, respelled sounds such as “sss” and “tuh”, digits at one per second, nonwords), and a closing line for each realm.
Memory items (digits, nonword repetition) are spoken once only, as the guide requires. Tap the Archivist to hear a line again.

**Natural voice.** Speech comes from a text-to-speech provider through `/api/narrate`, never from the device’s system voice,
unless no provider is configured, in which case the browser voice is used as a fallback. Set one provider (see `.env.example`):

| Variable | Purpose |
| --- | --- |
| `KOKORO_BASE_URL` (+ `KOKORO_API_KEY`, `KOKORO_VOICE`) | [Kokoro Web](https://github.com/eduardolat/kokoro-web), free and open source, self-hosted (takes priority) |
| `OPENAI_API_KEY` | OpenAI `gpt-4o-mini-tts`, with an “Archivist” voice persona (`ARCHIVIST_VOICE`, default `sage`) |
| `ELEVENLABS_API_KEY`, `ELEVENLABS_VOICE_ID` | ElevenLabs instead (used when Kokoro is not set) |

Each phrase is generated once and then served from the CDN (`Cache-Control: immutable`), so cost is small and repeat plays are
instant. Only short item text is sent to the provider; no names or scores. The endpoint accepts same-origin requests only,
caps text length and rate-limits per client, but anyone who can load the site can trigger voice generation, so keep Vercel
Deployment Protection on, or set a spend limit with your provider.

**Kokoro.** Step-by-step hosting options (Railway, a VPS, or Kokoro Web) are in [docs/hosting-kokoro.md](docs/hosting-kokoro.md). In short: run `ghcr.io/eduardolat/kokoro-web:latest` on any Docker host (it cannot run on Vercel itself), for example
`docker run -p 3000:3000 -e KW_SECRET_API_KEY=... -v ./kokoro-cache:/kokoro/cache ghcr.io/eduardolat/kokoro-web:latest`,
then set `KOKORO_BASE_URL=https://<your-host>/api/v1` and `KOKORO_API_KEY` on Vercel (`npx vercel env add ... production`) and redeploy.
Natural voices come from the 82M Kokoro model; there is no per-request cost beyond the host.

**Pre-rendered lines.** Every fixed line (greeting, realm rules, lead-ins, digits, sounds; 125 clips, 1.5 MB) is committed
as static audio in `public/narration/`, indexed by `src/data/narrationManifest.json`, so it plays instantly and works even
with no voice server. Only the item words are generated on demand. After editing any line in `src/lib/narration.ts`, or
changing the voice, regenerate with:

```bash
KOKORO_BASE_URL=https://<host>/v1 KOKORO_API_KEY=... KOKORO_MODEL=kokoro KOKORO_VOICE=bm_fable \
  npx tsx scripts/pregen-narration.ts      # add --dry to list clips only; existing files are kept
```

Delete `public/narration/` first if you change the voice, so every clip is re-rendered.

Phoneme strings (for example `/s/-/i/-/t/`) are respelled for speech and are approximate. The Keeper’s own voice remains the
gold standard for clinical use.
