# Hosting a Kokoro voice for the Archivist

The app talks to any server that answers OpenAI's `POST …/audio/speech`. Kokoro-82M is free and open source (Apache 2.0),
but it needs a host that runs Docker, so it cannot run on Vercel itself. Pick one option, then do **Connect it to the app**.

| | Server | Model name | Base URL ends in | Cost | Best for |
| --- | --- | --- | --- | --- | --- |
| A | Kokoro TTS Lite on Railway | `kokoro` | `/v1` | Free plan possible | Trying it today |
| B | Kokoro-FastAPI on a small VPS | `kokoro` | `/v1` | A few dollars a month | Always-on, faster |
| C | Kokoro Web (`eduardolat/kokoro-web`) | `model_q8f16` | `/api/v1` | Your host | Using the project you asked for |

Each phrase is generated once, then cached on Vercel's CDN, so the server only has to keep up with first plays.

## A. Railway, Kokoro TTS Lite (quickest)

1. Open the template: <https://railway.com/deploy/kokoro-tts-lite-openai-compatible-voice-api-runs-on-the-free-plan--kokoro-tts-lite> and click Deploy.
2. Set variables:
   - `API_KEY` to a long random string (requires `Authorization: Bearer …` on `/v1/`).
   - `MODEL_PRECISION=int8` (default, ~375 MB RAM, fits the Free plan; about 9 s to render 11 s of audio) or `fp32` (~610 MB, about 3 s, needs a Trial or Hobby plan).
3. Generate a public domain under Settings → Networking. Your base URL is `https://<that-domain>/v1`.

On the Free plan the first play of each phrase can take several seconds. Use `fp32` or Option B if that is too slow.

## B. A VPS with Kokoro-FastAPI

Any Ubuntu 24.04 VPS with 4 vCPU and 8 GB RAM is comfortable (a RamNode guide uses this size). Steps, after installing Docker and
opening only ports 22, 80 and 443 in the firewall:

```yaml
# ~/kokoro/docker-compose.yml
services:
  kokoro:
    image: ghcr.io/remsky/kokoro-fastapi-cpu:v0.2.4
    restart: unless-stopped
    ports: ["127.0.0.1:8880:8880"]   # only nginx can reach it
    environment:
      - ONNX_NUM_THREADS=4           # = physical cores
      - ONNX_INTER_OP_THREADS=2      # = half of that
    volumes:
      - kokoro-models:/app/api/src/models
      - kokoro-voices:/app/api/src/voices
    deploy: { resources: { limits: { memory: 4G } } }
volumes: { kokoro-models: {}, kokoro-voices: {} }
```

```bash
cd ~/kokoro && docker compose up -d && docker compose logs -f   # wait for the model to load
curl -X POST http://127.0.0.1:8880/v1/audio/speech -H 'Content-Type: application/json' \
  -d '{"model":"kokoro","input":"Hello, traveler.","voice":"bm_george","response_format":"mp3"}' -o test.mp3
```

Then put nginx and a TLS certificate in front (certbot) and require a bearer key, because the server has no authentication of its
own. The RamNode guide has a complete nginx config with rate limiting and an API-key check:
<https://www.ramnode.com/guides/kokoro-tts>. Also restrict `/web`, `/docs` and `/debug` to your own IP.
Base URL: `https://tts.example.com/v1`.

## C. Kokoro Web (`eduardolat/kokoro-web`)

```bash
docker run -d --restart unless-stopped -p 3000:3000 \
  -e KW_SECRET_API_KEY=<long random string> -e KW_PUBLIC_NO_TRACK=true \
  -v ./kokoro-cache:/kokoro/cache ghcr.io/eduardolat/kokoro-web:latest
```

Put it behind TLS (any reverse proxy). Base URL: `https://<host>/api/v1`, model `model_q8f16`, API docs at `/api/v1/index.html`.

## Connect it to the app

1. Check voices, and that `bm_fable` (the Archivist's default) exists: `curl -H "Authorization: Bearer <key>" https://<host>/v1/audio/voices` (path differs for C; see its API docs). If not, pick another, for example `bm_george`.
2. Set the variables on Vercel, then redeploy:

```bash
npx vercel env add KOKORO_BASE_URL production   # e.g. https://tts.example.com/v1
npx vercel env add KOKORO_API_KEY production
npx vercel env add KOKORO_MODEL production      # kokoro  (Options A and B)   or  model_q8f16  (Option C)
npx vercel env add KOKORO_VOICE production      # optional, default bm_fable
npx vercel --prod
```

3. Open the site, go to Setup, and look at "The Archivist's voice": it no longer says the natural voice is missing.
   Locally, put the same variables in `.env.local` and run `npm run dev`.

Sources: Railway Kokoro TTS Lite template, RamNode Kokoro deployment guide, and the Kokoro Web and Kokoro-FastAPI READMEs.
Server details change; check each project's page if a command fails.
