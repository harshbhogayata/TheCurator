# Railway pipeline operations

How to run the content pipeline on Railway without a dedicated Celery worker.

## Architecture

| Service | Role |
|---------|------|
| **Web** | Django API (`gunicorn`) |
| **Redis** | Celery broker + Django cache + Currents daily budget counter |
| **Cron** (or worker) | `python manage.py run_pipeline` on a schedule |
| **Kokoro** (optional sidecar) | Self-hosted TTS at `KOKORO_TTS_URL` |
| **R2** | Public audio MP3 storage (zero egress) |

## Minimum env (production)

```bash
PIPELINE_ENABLED=true
OPENAI_API_KEY=...
PEXELS_API_KEY=...
CURRENTS_API_KEY=...          # optional — India/regional ingest
CELERY_BROKER_URL=redis://... # required for cache + optional Celery
TTS_PROVIDER=kokoro
KOKORO_TTS_URL=http://kokoro.railway.internal:8880/v1
AUDIO_STORAGE_BACKEND=s3
AUDIO_S3_ENDPOINT_URL=...
AUDIO_S3_BUCKET=curator-audio
AUDIO_PUBLIC_BASE_URL=https://audio.thecuratorgroup.org
```

## One-time setup

```bash
python manage.py migrate
python manage.py seed_mobile_content
python manage.py seed_pipeline_sources
python manage.py seed_currents_sources   # if CURRENTS_API_KEY is set
```

## Hourly cron (recommended without Celery beat)

Create a **second Railway service** using `api/railway.cron.toml` (Settings → Config file path). Share the same env vars as the web API.

| File | Schedule | Command |
|------|----------|---------|
| `railway.cron.toml` | `5 * * * *` (hourly at :05) | `python manage.py run_pipeline` |
| `railway.worker.toml` | always on | `celery -A config worker -l info --beat` |

Or configure cron in the Railway UI:

```bash
python manage.py run_pipeline
```

Schedule: `5 * * * *` (every hour at :05, aligned with Celery beat in `config/celery.py`).

`run_pipeline` is synchronous: fetch → cluster → LLM draft → publish (when `PIPELINE_AUTO_PUBLISH=true` or drafts are approved in admin).

## With Celery (optional)

If you add a worker + beat service:

```bash
celery -A config worker -l info
celery -A config beat -l info
```

Beat schedule is defined in `config/celery.py`. Use `railway.worker.toml` for a dedicated worker service.

## Verify

```bash
curl https://your-api.up.railway.app/health/
```

Check `integrations.openai`, `integrations.pexels`, `integrations.kokoro`, `integrations.currents.budget_remaining`, and `pipeline`.

```bash
python manage.py verify_audio_storage
python manage.py generate_content_audio --all-missing
```

## Daily checklist (~5 min)

1. `/health/` — database + redis ok
2. Admin → Pipeline → Sources — no sources with high `consecutive_failures`
3. Admin → Draft review queue — approve/publish
4. Resend dashboard — under 100 emails/day on free tier
5. Currents budget — `integrations.currents.budget_remaining` in health

See also: `docs/TOP_TIER_ROADMAP.md` Phase 0, `api/docs/R2_AUDIO_SETUP.md`.
