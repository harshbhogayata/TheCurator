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

## Step 8 — Kokoro TTS (production audio — **do this before launch**)

### Why health shows `tts.provider: "none"` today

The code **intentionally** refuses Edge TTS in production (`DEBUG=false`). Edge is free but **not licensed for a paid commercial app**. Until `KOKORO_TTS_URL` is set, hosted MP3 generation is disabled — mobile falls back to on-device narration.

This is the right guardrail. It is **not** a bug.

### Deploy Kokoro on Railway

1. Add a **second Railway service** (Docker) — recommended image: [hwdsl2/docker-kokoro](https://github.com/hwdsl2/docker-kokoro).
2. Expose internal port `8880` (or use Railway private networking).
3. On the **API** service:

```bash
TTS_PROVIDER=kokoro
KOKORO_TTS_URL=http://<kokoro-service>.railway.internal:8880/v1
KOKORO_TTS_VOICE=af_heart
```

4. Redeploy API. `/health/` should show:

```json
"tts": {
  "provider": "kokoro",
  "hosted_audio_ready": true,
  "kokoro_url_configured": true
}
```

5. Verify:

```bash
python manage.py verify_audio_storage
python manage.py generate_content_audio --all-missing
```

**Manual:** deploy Kokoro container (no API key — self-hosted). Plan ~512MB–1GB RAM for the sidecar.

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

Railway → API service → **Cron** (or separate worker):

```bash
cd api && python manage.py run_pipeline
```

Schedule: `0 * * * *` (every hour).

Without this, no new articles after seed content.

**Manual:** enable cron in Railway UI.

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

- [ ] `/health/` — database ok, redis ok
- [ ] `integrations.openai` + `pexels` ok
- [ ] `tts.provider` = `kokoro` (not `none`)
- [ ] `audio_storage` = `s3`
- [ ] Cron running `run_pipeline` hourly
- [ ] Admin review queue has drafts (or staging `PIPELINE_AUTO_PUBLISH=true`)
- [ ] `eas update --channel preview` shipped to testers

---

## What waits until later (Phase 1+)

| Item | When |
|------|------|
| Unsplash fallback | When Pexels miss rate > ~10% |
| Currents API | When India/regional coverage needed |
| Kokoro sidecar | **Before paid launch** (code ready now) |
| Pagination (#3.1) | Next mobile sprint |
| Email verify V1–V5 | Parallel track in FLOATING_PILL_MIGRATION.md |
