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

## Notes on the voice

The “Hear it” button uses the browser’s speech synthesis for real words, digit strings (one per second) and nonword
repetition. Devices vary and may blur nonwords, and phoneme strings (for example `/s/-/i/-/t/`) cannot be voiced reliably,
so the Keeper’s own voice is the standard and the button is only an aid. It can be turned off in setup.
