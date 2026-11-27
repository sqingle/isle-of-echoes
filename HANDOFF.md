# HANDOFF: The Isle of Echoes

Verified against the repo and `git status` on 2026-11-19. Things I could not verify are marked **UNVERIFIED**.

## START HERE (new session checklist)

1. Work **directly in this folder** (`/Users/single/Documents/Myst Game 1`). Sean does not want a worktree, copy, or extra clone. There is exactly one worktree (this folder); keep it that way.
2. Read this file, then run `git status`, `git log --oneline -3`, `npx tsc --noEmit`, `npx eslint src scripts`. All should be clean (re-verified 2026-11-19).
3. Tell Sean your understanding and flag mismatches **before changing any code**; wait for his go-ahead.
4. Pick the first item in section 7. Item 1 (voice route) is blocked on Sean's choice; item 4 (Anthropic key) is blocked on Sean creating a key.

**Updated after Sean's corrections (same day):** Sean has listened to the Archivist audio and **rejected the Kokoro voice**; he will use a different route for audio (not yet chosen). The Keeper's Letter **has run and worked**; Sean demoed it to a class. Ripley is not involved in this project (see Open questions).

## 1. Goal

A Myst-style web game (Next.js + Tailwind, deployed on Vercel) that delivers an **informal phonological screening** for ages 4-14 as eight "realms" on an island. A Keeper (adult) taps right/wrong while an on-screen narrator, **the Archivist**, speaks every instruction and item aloud in a natural voice so the child never has to read. The ledger shows three separate result profiles (Phonological Awareness, Phonological Memory, Rapid Naming) and an optional AI-written **Keeper's Letter** for parents/teachers.

"Done" for the current phase: Archivist narration uses a voice Sean approves (the Kokoro voice was rejected), the Keeper's Letter keeps working with a valid key, and nothing in the UI claims clinical validity. The item bank is **fabricated/illustrative and non-normed**; this is a screening/demo tool, never a diagnosis.

## 2. Current state

**Branch:** `main`. Local `main` is **1 commit ahead of `origin/main`** (`ac14943`): the commit that adds this `HANDOFF.md`. It is **not pushed** (Sean has not asked to push; pushing to `main` triggers a production deploy of identical code). No feature branches are in progress. **Uncommitted:** nothing except one untracked file, `AI App Assignment Project Evaluation & Plan.md` (dated Oct 18, not ours; leave it alone, do not commit it).

Local branches left over from past work: `feature/updates`, `fix/narration-garble` (both merged, safe to delete). Remote-only: `origin/loveableexp` (unknown origin, see Open questions), `origin/claude/keepers-letter-fl6uiy` (PR #3 source, merged).

**Last successful run (this session, after `npm install`):** `npx tsc --noEmit` clean, `npx eslint src scripts` clean, `npm run build` OK (routes: `/`, `/setup`, `/island`, `/ledger`, `/play/[id]` x8 static; `/api/letter`, `/api/narrate`, `/api/narrate/status` dynamic). Latest production deploy `isle-of-echoes-79e7hhtxn-sqiw-ork.vercel.app` (alias https://isle-of-echoes.vercel.app) is **Ready**; it is the newest production deployment and dates from the PR #3 merge (the exact commit was not inspected). `.vercel/` is linked in this folder (project `isle-of-echoes`) and the Vercel CLI is logged in.

Works (built and exercised in a browser unless noted):
- Title, setup, island map (clickable lanterns), 7 item subtests + rapid naming, basal/ceiling rules, ledger (print + CSV).
- Archivist narration plumbing (scripts, playback engine, UI, static-clip manifest). **The Kokoro voice itself is rejected by Sean**, so the 125 committed MP3s and the Railway Kokoro server are expected to be replaced.
- **Keeper's Letter: verified working by Sean** (ran it and demoed it to a class).
- `/api/letter` route is deployed (empty POST returns 400 "Visit at least one realm...").

Broken / unverified:
- **Keeper's Letter will fail in production right now**: the `ANTHROPIC_API_KEY` in Vercel has since expired (Sean let it lapse). Expect HTTP 502 "The Keeper's quill slipped" until a new key is set. It worked when the key was valid.
- **Audio: Sean listened and does not like the Kokoro voice.** The voice route will change; what replaces it is undecided. (Earlier garbled-intro bug was a separate, fixed problem; see Gotchas.)
- No automated tests exist.

## 3. Files that matter

Game logic / data
- `src/lib/game.ts`: tiers, `LOCATIONS` (8 realms: anchor coords, ceilings), `drawItems()` (random sample per tier, sorted by item number), `prepare()` per subtest -> `TrialItem` (`lines`, `answer`, `parts`, `say: Segment[]`, `noReplay`, `digits`), rapid-naming grid helpers, `trailingFailures`, result types. Random calls live in `drawItems/randomForm/practiceRow` on purpose (lint rule `react-hooks/purity`).
- `src/data/itemBank.json` (2,800 items, 7 subtests x 4 tiers x 100) and `src/data/rapidNaming.json` (forms A-E, 4 tasks x 4 tiers): extracted from Sean's artifact; images stripped.
- `src/components/SessionProvider.tsx`: in-memory session (settings + results). **No persistence by design**; a refresh wipes it.

Pages / components
- `src/app/page.tsx` (title, `Greeting` button), `setup/page.tsx` (tier, items per realm, answer key, Archivist voice toggle; fetches `/api/narrate/status`), `island/page.tsx`, `ledger/page.tsx`, `play/[id]/page.tsx` (server wrapper, `generateStaticParams`).
- `src/components/play/ItemTrial.tsx` (intro -> play -> basal -> done state machine; narration hook wiring; keyboard C/X/H), `RapidTrial.tsx` (practice row, stopwatch, tap tiles: error / self-corrected), `Realm.tsx`, `parts.tsx` (header, lanterns).
- `src/components/IslandMap.tsx`, `SceneBackdrop.tsx`, `art.tsx`: all art is generated SVG (no third-party images). `Archivist.tsx` (hooded portrait; tap = replay), `Greeting.tsx`, `Speaker.tsx`.
- `src/components/KeeperLetter.tsx` + `src/lib/letter.ts` (request parsing/validation, score description) + `src/lib/ai/{client,config,letter}.ts` + `src/app/api/letter/route.ts`: the Keeper's Letter (added in PR #3 by a different session). Uses `@anthropic-ai/sdk`, a `save_letter` tool call, banned-word regeneration, 6 letters/min/client limiter. Default model `claude-opus-5-5` (`ANTHROPIC_MODEL` overrides).

Narration
- `src/lib/narration.ts`: **all** Archivist scripts (`STORY`, `ISLAND`, `realmIntro`, `RULES`, `leadIn`, `realmDone`, `rapidIntro`, `selectLine`...), phoneme respelling table `SOUND` ("s" -> "sss"), per-subtest spoken scripts (`elisionSay`, `blendSay`, `digitsSay` 1 digit/sec, `nonwordRepSay`).
- `src/lib/speech.ts`: plays a `Segment[]` script: static clip from manifest -> else `/api/narrate` clip -> else browser `speechSynthesis` fallback. **Fetches voice-server clips strictly one at a time** (`inSequence`). Cache-bust param `v=2`.
- `src/lib/useNarrate.ts`: hook (`useNarrate`, `useCanSpeak`).
- `src/lib/tts.ts`: provider selection (Kokoro > ElevenLabs > OpenAI) and request building. `src/app/api/narrate/route.ts` (GET, same-origin only, 320-char cap, 90/min limiter, per-instance `serial()` queue, immutable CDN cache headers), `narrate/status/route.ts`.
- `scripts/pregen-narration.ts`: renders the 125 fixed clips -> `public/narration/*.mp3` (1.5 MB) + `src/data/narrationManifest.json` (key `"<rate>|<text>"` -> file). Sequential, length-checked, `--dry`, `--force`.
- `docs/hosting-kokoro.md`: Railway / VPS / Kokoro Web hosting guide.

Config / docs: `next.config.ts` (turbopack css rule from scaffold; **no** `cacheComponents`), `.env.example` (names only), `README.md`, `AGENTS.md` (generated by Next; says read `node_modules/next/dist/docs/` first), `.claude/launch.json` (preview server), `.gitignore` (ignores `.env*` except `.env.example`, `.vercel`).

Fragile: `src/lib/speech.ts` (async playback + cancellation via a `current` counter), `ItemTrial.tsx` (hook ordering: all hooks must stay above the early returns for intro/basal/done).

## 4. Decisions made and why

- **Game, not a form.** Sean chose "screener delivered as a game" with full Myst immersion. Keeper scores right/wrong; the child answers aloud (no speech recognition, deliberately; the vault plan treats speech scoring as a separate spike).
- **Static + on-demand audio.** Fixed lines are committed MP3s so they play instantly and survive a voice-server outage. Item words (thousands of unique words) are generated on demand and CDN-cached. Pre-rendering all item words (a few thousand clips, ~2 h on the free Railway plan, tens of MB) was **offered, not done**.
- **Neural voice via server route, not browser voices.** Sean required a natural (non-system) voice. Browser `speechSynthesis` remains only as a fallback.
- **Kokoro (now rejected).** Sean asked for Kokoro (free, open source). Deployed `Kokoro TTS Lite` (ONNX) on Railway; `MODEL_PRECISION=fp32` (int8 took 9-15 s/clip, fp32 about 4.5 s); voice `bm_fable`. After listening, Sean did not like the result and will use a different route. The provider layer (`src/lib/tts.ts`) already supports ElevenLabs and OpenAI as alternatives, and `speech.ts` only needs a URL that returns audio, so swapping voices is cheap; the pre-rendered clips must be regenerated for the new voice.
- **Phonemes are respelled, not spoken as IPA** ("sss", "tuh", "ih"). Approximate; the Keeper's own voice is the clinical standard.
- **Memory items (digits, nonword repetition) speak once only** (`noReplay`), per the Administration Guide.
- **Rule interpretations (mine, not Sean's):** basal check fires after the first `min(3, ceiling)` items (so 2 for memory subtests, whose 2-miss ceiling would otherwise fire first); a Segmentation item counts as a "miss" only at 0 sounds correct; rapid-naming `errors` = uncorrected + self-corrected, with the self-corrected count kept separately.
- **No composite score, ever.** Three batteries are shown separately (Guide rule).
- **Privacy:** results live in memory only; Keeper's Letter sends scores/tier/age band only, never the traveler's name.
- **Rejected / dead ends:** (a) in-browser Kokoro (`kokoro-js`, ~90 MB download): offered, not built; (b) Tavily CLI via system Python 3.9: failed, solved by `brew install uv` + `uv tool install tavily-cli` (`~/.local/bin/tvly`); (c) Vercel MCP connector for deploy: 403 scope error, used the Vercel CLI instead; (d) reusing the user's Myst screenshots as art: not done (copyrighted), art is generated SVG.

## 5. Gotchas

- **The Kokoro-Lite server is not safe under concurrent requests.** Parallel renders returned truncated/garbled audio. This corrupted 8 pre-rendered clips (incl. the whole intro) before the fix. Pre-render **sequentially** with the length check (healthy speech is about 0.07 s per character at 32 kbps; the script retries clips outside 0.055-0.1). Residual risk: several visitors on different Vercel instances can still hit Railway at once (each instance queues separately). Options noted, not built: shared lock (e.g. Upstash Redis), pre-render item words, or a concurrency-safe server (Kokoro-FastAPI, needs >=1.5 GB RAM / paid Railway plan).
- If you change the voice, delete `public/narration/` and re-run the pre-render script, or old clips stay.
- **Stale CSS in `next dev`:** Turbopack served an old stylesheet until `rm -rf .next` + restart. Also `body` must not have an opaque background (the fixed `SceneBackdrop` at `-z-10` sits behind it).
- **Next 16.4 / React 19.3:** `params` is a Promise; types come from `npx next typegen` (global `PageProps<'/play/[id]'>`). Lint rule `react-hooks/purity` flags `Math.random` in components; `react-hooks/set-state-in-effect` flags sync setState in effects (hence `useSyncExternalStore` in `useCanSpeak`).
- **Hydration:** never call `canSpeak()`/randomness in render; use `useCanSpeak()` and draw items in click handlers (the realm intro screen exists partly for this).
- **Browser autoplay:** speech needs a prior tap. The title screen waits for "Hear the Archivist"; later screens auto-play because the user already clicked.
- **Client-side navigation keeps the session; a full page load wipes it.** When testing in the preview browser, use clicks or `window.next.router.push(...)`, never `navigate`.
- **Vercel CLI quirks:** the folder name "Myst Game 1" is an invalid project name, so first deploy needed `--name isle-of-echoes` (project is now linked in `.vercel/`). `vercel curl <path> --deployment <url> -- <curl args>` is the way through Deployment Protection. Env values are "Hidden/Secret"; `vercel env add NAME env --force` reads the value from stdin.
- **zsh traps in test scripts:** arrays are 1-indexed, `$var` is not word-split, `$w:same` is a modifier. These produced a false "responses shifted" scare once.
- **Git/Vercel:** project is linked to GitHub (`sqingle/isle-of-echoes`); pushes to `main` deploy production, other branches get previews (alias `isle-of-echoes-git-<branch>-sqiw-ork.vercel.app`). Deployment Protection is **on**: only the logged-in Vercel owner can open it.
- **Kokoro bearer key:** a random key generated in-session protects the Railway Kokoro server (`API_KEY` on Railway, `KOKORO_API_KEY` on Vercel; the app sends it as `Authorization: Bearer`). Sean no longer remembers creating it. It appeared in session tool output and a temp scratch file, so treat it as exposed. If Kokoro is decommissioned the key becomes irrelevant (see Next steps).

## 6. How to run and verify

```bash
npm install                       # needed after pulling; PR #3 added @anthropic-ai/sdk
npm run dev                       # http://localhost:3000   (rm -rf .next if CSS looks stale)
npx tsc --noEmit && npx eslint src scripts
npm run build                     # all routes should compile; /api/* are dynamic
```

Env var **names** (values never in the repo; see `.env.example`):
- Voice (one provider; priority Kokoro > ElevenLabs > OpenAI): `KOKORO_BASE_URL`, `KOKORO_API_KEY`, `KOKORO_MODEL` (`kokoro`), `KOKORO_VOICE` (default `bm_fable`); `ELEVENLABS_API_KEY`, `ELEVENLABS_VOICE_ID`, `ELEVENLABS_MODEL`; `OPENAI_API_KEY`, `ARCHIVIST_VOICE`, `OPENAI_TTS_MODEL`.
- Keeper's Letter: `ANTHROPIC_API_KEY`, optional `ANTHROPIC_MODEL`.
- On Vercel today: `KOKORO_*` (Production + Preview); `ANTHROPIC_API_KEY` (Production, expired; also Preview for branch `claude/keepers-letter-fl6uiy`).

Pre-render fixed narration (Kokoro host must be reachable; run sequentially, takes ~10 min):
```bash
KOKORO_BASE_URL=https://<host>/v1 KOKORO_API_KEY=... KOKORO_MODEL=kokoro KOKORO_VOICE=bm_fable \
  npx tsx scripts/pregen-narration.ts            # --dry to list, --force to re-render
```
Kokoro host: Railway project `isle-of-echoes-voice` on Sean's Railway account, service "Kokoro TTS Lite" (template `kokoro-tts-lite`, `MODEL_PRECISION=fp32`, `DEFAULT_VOICE=bm_fable`, endpoints `/v1/audio/speech`, `/v1/audio/voices`, `/health`). The Railway MCP connector is no longer configured in this environment.

Verify narration without a voice server: the greeting should load 3 files from `/narration/*.mp3` (check Network tab; no `/api` calls). Verify a deployment:
```bash
npx vercel ls isle-of-echoes
npx vercel curl /api/narrate/status --deployment https://isle-of-echoes.vercel.app   # {"provider":"kokoro"}
npx vercel curl /api/letter --deployment https://isle-of-echoes.vercel.app -- -s -X POST -H 'content-type: application/json' -d '{}'   # 400 expected
npx vercel --prod                                                                    # manual production deploy
```
Rollback: tag `pre-archivist` (original game); Vercel Instant Rollback to an earlier production deployment; code revert via `git revert -m 1 <merge-commit>` (PRs were merge commits: #1 `6d33c45`, #2 `9786c95`, #3 `ac14943`).

## 7. Next steps

1. **Choose the new voice route** (*blocked on Sean*: undecided). Candidates already wired in `src/lib/tts.ts`: ElevenLabs (`ELEVENLABS_API_KEY`, `ELEVENLABS_VOICE_ID`) or OpenAI (`OPENAI_API_KEY`, `ARCHIVIST_VOICE`). Anything else needs a new branch in `synthesize()` or a different `/api/narrate` backend.
2. **After the voice is chosen:** delete `public/narration/`, set the provider env vars, re-run `npx tsx scripts/pregen-narration.ts --force` (keep it sequential if the new server is also not concurrency-safe), listen, commit, deploy. The 125 existing clips are Kokoro audio and will not match.
3. **Decommission Kokoro** once replaced: remove `KOKORO_BASE_URL`, `KOKORO_API_KEY`, `KOKORO_MODEL` from Vercel (`npx vercel env rm <NAME> production`, and `preview`), and delete/stop the Railway project `isle-of-echoes-voice` (Railway dashboard; the connector is gone). That also retires the exposed bearer key; no rotation needed. If Kokoro stays running instead, rotate `API_KEY` on Railway and `KOKORO_API_KEY` on Vercel.
4. **Replace the expired Anthropic key** if the Keeper's Letter is needed again (it works; only the key lapsed): `npx vercel env rm ANTHROPIC_API_KEY production`, `npx vercel env add ANTHROPIC_API_KEY production`, `npx vercel --prod`. *Blocked on:* Sean creating a key.
5. Concurrency/first-play latency concerns (shared lock, pre-rendering item words) only matter for the Kokoro server. Re-evaluate after choosing the new voice (hosted APIs like ElevenLabs/OpenAI handle concurrency).
6. Add tests: `trailingFailures`/basal/ceiling logic (extract from `ItemTrial.tsx`), `blendPieces`/`voiceSounds` in `narration.ts`, `parseLetterRequest`. There are none.
7. Housekeeping: delete merged branches `feature/updates`, `fix/narration-garble` (local and remote); decide about `origin/loveableexp` and `origin/claude/keepers-letter-fl6uiy`; delete or ignore the stray untracked `AI App Assignment Project Evaluation & Plan.md`; push `main` (carries only this handoff) when Sean wants it on GitHub.

## Working agreements with Sean

- Work in this folder only; no worktrees or copies. Confirm understanding before changing code at the start of a session.
- Do not push, merge, deploy, or delete things (branches, Railway/Vercel resources, env vars) without being asked. Pull requests were the merge path for PRs #1-#3.
- Never put keys or tokens in files, commits, or chat; Sean sets secret values himself (`vercel env add ...` reads from stdin).
- Web lookups: use Tavily (`~/.local/bin/tvly`), not Firecrawl.

## 8. Open questions (need Sean)

- Which voice route replaces Kokoro, and what voice character should the Archivist have?
- Should item words be pre-rendered once the voice is chosen, or generated on demand (first play is slow only on slow servers)?
- Is the Anthropic key being replaced, and should the letter use a different/cheaper model than the default `claude-opus-5-5`?
- `origin/loveableexp` points at `9786c95` (a merge of PR #2). Who created it and is it needed? **UNVERIFIED.**
- Production is behind Vercel login (Deployment Protection). Public for pilots/classes? If so, the voice and letter endpoints spend money for anyone who can load the site (same-origin check and rate limits are only a light guard).
- Obsidian vault: `~/Documents/ripley-vault/01 Projects/Myst-style dyslexia screening game.md` describes this project as "nothing built". Sean says Ripley is not involved with this project (she may run a parallel class project). Not reconciled and not to be worried about for now. Vault logging rule for agents: append to `05 Daily/YYYY-MM-DD-claude-code.md` (see `07 System/AGENTS-README.md`).
