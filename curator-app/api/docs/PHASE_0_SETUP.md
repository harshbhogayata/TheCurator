# Phase 0 — Production foundation (step-by-step)

Do these in order. Code for Phases 1+ is already in the repo; Phase 0 is mostly **Railway + manual keys**.

---

## Step 1 — Railway project baseline

1. Open [Railway](https://railway.app) → your Curator API service.
2. Confirm the web service deploys from `curator-app/api` and `/health/live/` returns 200.
3. Set **production** env: `DJANGO_DEBUG=false`, strong `DJANGO_SECRET_KEY`, `API_PUBLIC_BASE_URL=https://<your-api>.up.railway.app`.

**Manual:** none (unless you need a new Railway project).

---

## Step 2 — Postgres

1. Railway → **Add Plugin** → **PostgreSQL** (if not already linked).
2. Railway injects `DATABASE_URL` into the API service automatically.
3. After deploy, run once (Railway shell or local against prod):

```bash
python manage.py migrate
python manage.py seed_mobile_content
python manage.py seed_pipeline_sources
```

**Manual:** none.

---

## Step 3 — Redis (cache + Celery broker + Currents budget counter)

1. Railway → **Add Plugin** → **Redis**.
2. On the API service, set:

```bash
CELERY_BROKER_URL=redis://default:<password>@<host>:<port>
CELERY_RESULT_BACKEND=redis://default:<password>@<host>:<port>
REDIS_URL=redis://default:<password>@<host>:<port>
```

(Copy the URL from the Redis plugin → **Connect** tab.)

3. Redeploy. `GET /health/` should show `"redis": "ok"`.

**Manual:** copy Redis URL from Railway dashboard.

---

## Step 4 — OpenAI (pipeline LLM — required for auto-drafts)

1. Go to [platform.openai.com](https://platform.openai.com) → **API keys** → Create key.
2. Railway env:

```bash
OPENAI_API_KEY=sk-...
OPENAI_CHAT_MODEL=gpt-4o-mini
PIPELINE_ENABLED=true
PIPELINE_AUTO_PUBLISH=false   # staging only; prod = admin review
PIPELINE_MIN_CLUSTER_SOURCES=2
```

3. `/health/` → `integrations.openai: "ok"`.

**Manual:** OpenAI billing must be active (pay-as-you-go).

---

## Step 5 — Pexels (hero images — required)

1. [pexels.com/api](https://www.pexels.com/api/) → sign up → copy API key.
2. Railway:

```bash
PEXELS_API_KEY=...
```

**Manual:** free; instant key.

---

## Step 6 — Optional: Unsplash (premium abstract heroes)

1. [unsplash.com/developers](https://unsplash.com/developers) → create app → **Access Key**.
2. Railway:

```bash
UNSPLASH_ACCESS_KEY=...
```

**Manual:** free tier 50 req/hour. Skip until Pexels miss rate hurts quality.

---

## Step 7 — Optional: Currents API (India + world headlines)

1. [currentsapi.services](https://currentsapi.services/) → register → **API key** (1,000 req/day free).
2. Railway:

```bash
CURRENTS_API_KEY=...
```

3. Run once:

```bash
python manage.py seed_currents_sources
```

4. `/health/` → `integrations.currents.budget_remaining` (starts at 1000).

**Category mapping** (already in code — `currents.py`):

| Currents API | Curator category |
|--------------|------------------|
| general, world, regional, sports | **news** |
| politics, opinion | politics |
| business, finance, economy, trading | economy |
| technology, programming, gadgets, security | technology |
| science, academia, education | science |
| health, medical | health |
| environment, energy | climate |
| culture, entertainment, art, music, movie, travel | culture |
| lifestyle, funny, crap, notsure | skipped / defaults to news |

**Manual:** sign up for Currents key. Do this when RSS alone feels too Western-centric.

---

## Step 8 — Kokoro TTS on Railway (full walkthrough)

### What you have today

| Symptom | Meaning |
|---------|---------|
| `integrations.kokoro: "error"` | Kokoro URL is set but **no running Kokoro container** (or wrong hostname). |
| `%3ckokoro-service%3e.railway.internal` in errors | You pasted the **doc placeholder** literally — delete `<` and `>`. |
| `run_pipeline` works, audio fails | Expected until Kokoro is deployed. R2 is fine; TTS host is missing. |

Kokoro needs **no API key** — it is a self-hosted Docker container. Railway internal DNS connects TheCurator → Kokoro privately.

**Requirements:** ~**1.5 GB RAM** for the Kokoro service (model ~320 MB + PyTorch). First boot downloads the model (2–5 min).

---

### 8A — Create the Kokoro service

1. Open Railway → project **keen-smile / production** (same project as Postgres, Redis, TheCurator).
2. Click **+ Create** (or **New** → **Empty Service**).
3. Click the new service box → **Settings**.
4. **Name the service** `kokoro` (lowercase, no spaces).  
   This name becomes the hostname: `kokoro.railway.internal`.
5. **Source / Deploy:**
   - If Railway offers **Docker Image**: enter  
     `hwdsl2/kokoro-server`  
     ([Docker Hub](https://hub.docker.com/r/hwdsl2/kokoro-server))
   - If you must use a Dockerfile, use the image above — do not build from scratch.
6. **Networking:**
   - Set the container port to **8880** (Kokoro listens on 8880).
   - You do **not** need a public domain for Kokoro — TheCurator talks over private networking.
   - Optional: disable public HTTP on Kokoro if Railway exposes it (private-only is safer).
7. **Resources (important):**
   - Allocate at least **1.5 GB RAM** to this service if Railway lets you set limits.
   - Hobby tier: if Kokoro OOMs, bump plan or reduce concurrent TTS jobs.
8. Click **Deploy** and wait until status is **Online**.

**First-start:** Kokoro downloads its model on boot. Open **kokoro → Deployments → View logs**. Wait until you see something like:

```text
Kokoro text-to-speech server is ready
```

That can take **3–8 minutes** on first deploy.

---

### 8B — Smoke-test Kokoro (from TheCurator shell)

Open **TheCurator → Shell** (not Kokoro shell) and run:

```bash
curl -sS -o /tmp/kokoro-test.mp3 \
  -H "Content-Type: application/json" \
  -d '{"model":"tts-1","input":"Curator audio test.","voice":"af_heart","response_format":"mp3"}' \
  http://kokoro.railway.internal:8880/v1/audio/speech

ls -la /tmp/kokoro-test.mp3
```

**Success:** file exists and is **> 1 KB**.

**If `Could not resolve host`:** service is not named `kokoro`, or Kokoro is not Online — check the exact service name on the canvas (use `http://YOUR-SERVICE-NAME.railway.internal:8880`).

**If connection refused:** Kokoro still starting — check Kokoro logs.

**If 404/502:** wrong port — confirm 8880 in Kokoro networking settings.

---

### 8C — Wire TheCurator to Kokoro

**TheCurator → Variables** — set or replace (no angle brackets):

```bash
TTS_PROVIDER=kokoro
KOKORO_TTS_URL=http://kokoro.railway.internal:8880/v1
KOKORO_TTS_MODEL=tts-1
KOKORO_TTS_VOICE=af_heart
```

| Variable | Value | Notes |
|----------|-------|-------|
| `TTS_PROVIDER` | `kokoro` | Or `auto` if URL is set |
| `KOKORO_TTS_URL` | `http://kokoro.railway.internal:8880/v1` | Replace `kokoro` if you named the service differently |
| `KOKORO_TTS_VOICE` | `af_heart` | Calm English female; see [voice list](https://github.com/hwdsl2/docker-kokoro#available-voices) |

**Delete** any old value containing `<kokoro-service>`.

Redeploy **TheCurator** (Deployments → Redeploy or push a commit).

---

### 8D — Verify end-to-end (API → Kokoro → R2)

```bash
python manage.py verify_audio_storage
python manage.py generate_content_audio --all-missing --limit 3
```

**`/health/` should show:**

```json
"integrations": { "kokoro": "ok", ... },
"tts": {
  "provider": "kokoro",
  "hosted_audio_ready": true,
  "kokoro_url_configured": true
}
```

Then open one article in the app — audio URL should point at your R2 domain (`AUDIO_PUBLIC_BASE_URL`).

---

### 8E — Kokoro troubleshooting

| Error | Fix |
|-------|-----|
| `%3ckokoro-service%3e` in hostname | Remove literal `<` `>` from `KOKORO_TTS_URL` |
| Name or service not known | Kokoro service offline or wrong `.railway.internal` name |
| Connection refused | Kokoro still booting; check logs / port 8880 |
| OOM / container restart loop | Give Kokoro ≥1.5 GB RAM |
| `verify_audio_storage` ok but slow | Normal on CPU; first request loads model |

---

## Step 9 — Cloudflare R2 (audio storage)

Follow `api/docs/R2_AUDIO_SETUP.md`. Summary:

1. Cloudflare dashboard → R2 → create bucket `curator-audio`.
2. Enable public access or custom domain `audio.thecuratorgroup.org`.
3. Create R2 API token (read/write).
4. Railway:

```bash
AUDIO_STORAGE_BACKEND=s3
AUDIO_S3_ENDPOINT_URL=https://<account_id>.r2.cloudflarestorage.com
AUDIO_S3_BUCKET=curator-audio
AUDIO_S3_ACCESS_KEY_ID=...
AUDIO_S3_SECRET_ACCESS_KEY=...
AUDIO_PUBLIC_BASE_URL=https://audio.thecuratorgroup.org
```

**Manual:** Cloudflare account + R2 token + DNS for custom domain.

---

## Step 10 — Hourly pipeline cron

Without cron, `run_pipeline` only runs when you SSH in manually.

### Railway Cron (TheCurator service)

1. Click **TheCurator** (API) → **Settings**.
2. Find **Cron Schedule** (or **Cron Jobs** tab, depending on Railway UI).
3. Add a job:
   - **Schedule:** `0 * * * *` (every hour, on the hour)
   - **Command:**

```bash
python manage.py run_pipeline
```

4. Save. Railway runs this in the same environment as the web service (same env vars, same DB).

**Note:** Root directory is already `/app` in the container — no `cd api` needed.

### After first cron hour (or run manually now)

```bash
python manage.py run_pipeline
```

### Review drafts (because `PIPELINE_AUTO_PUBLISH=false`)

1. Open `https://<your-api>/admin/`
2. Log in with superuser (create one if needed: `python manage.py createsuperuser`)
3. Go to **Content pipeline** → **Drafts** (or review queue)
4. Approve good drafts → **Publish**
5. Optionally trigger audio for new articles:

```bash
python manage.py generate_content_audio --all-missing --limit 20
```

**Staging shortcut:** set `PIPELINE_AUTO_PUBLISH=true` only on a non-prod environment to skip manual review.

---

## Step 11 — Firebase + Resend + billing (existing)

| Service | Where to get keys | Railway vars |
|---------|-------------------|--------------|
| Firebase Admin | Firebase Console → Project settings → Service account JSON | `FIREBASE_CREDENTIALS_JSON`, `FIREBASE_PROJECT_ID` |
| Firebase Web | Authentication → Project settings | `FIREBASE_WEB_API_KEY` |
| Resend | [resend.com](https://resend.com) → API Keys | `RESEND_API_KEY`, `RESEND_FROM_EMAIL` |
| RevenueCat | App → API keys | `REVENUECAT_API_KEY`, webhook secret |
| Razorpay | Dashboard → API keys | `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET` |

These are **unchanged** from current auth/billing setup.

---

## Step 12 — Deploy API + migrate news category

After pulling latest code:

```bash
python manage.py migrate   # adds World News category (0015)
python manage.py seed_mobile_content   # syncs all 8 categories to DB
```

Mobile onboarding will show **8 categories** (4×2 grid) once API `/categories` returns `news`.

---

## Phase 0 done checklist

Use this as your master list. Items marked **(you)** are already confirmed from your session.

- [x] **(you)** `/health/` — database ok, redis ok
- [x] **(you)** `integrations.openai` + `pexels` ok
- [x] **(you)** `audio_storage` = `s3`
- [x] **(you)** `run_pipeline` command works
- [ ] `integrations.kokoro` = `ok` (Step 8 — deploy Kokoro, fix URL)
- [ ] `verify_audio_storage` passes
- [ ] `generate_content_audio --limit 3` uploads MP3s to R2
- [ ] Cron running `run_pipeline` hourly (Step 10)
- [ ] Admin: at least one pipeline draft reviewed + published
- [ ] Optional: `CURRENTS_API_KEY` + `seed_currents_sources` (Step 7)
- [ ] Optional: `UNSPLASH_ACCESS_KEY` (Step 6)
- [ ] Mobile: commit + `eas update --channel preview` (Continue Reading, search, 8 categories)

### Suggested order to finish today

1. **Step 8** — Deploy Kokoro (8A→8D above)
2. **Step 10** — Enable hourly cron
3. **Admin** — Publish 1–3 pipeline drafts
4. **Audio** — `generate_content_audio --all-missing --limit 10`
5. **Step 7** (optional) — Currents key if you want India feeds
6. **Mobile** — ask to push mobile commit + EAS update

---

## What waits until later (Phase 1+)

| Item | When |
|------|------|
| Unsplash fallback | When Pexels miss rate > ~10% |
| Currents API | When India/regional coverage needed |
| Kokoro sidecar | **Before paid launch** (code ready now) |
| Pagination (#3.1) | Next mobile sprint |
| Email verify V1–V5 | Parallel track in FLOATING_PILL_MIGRATION.md |
