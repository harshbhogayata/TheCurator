# Phase 0 — Steps 8, 9, 10 plan (do not implement yet)

**Status:** Planning only — Kokoro deferred; R2 and cron assumed working from your Railway session.  
**Reference:** `api/docs/PHASE_0_SETUP.md` Steps 8–10  
**Date:** 2026-06-13

---

## Context

| Step | Topic | Your current state |
|------|--------|-------------------|
| **8** | Kokoro TTS | **Deferred** — OOM on ~1 GB Hobby; using `TTS_PROVIDER=openai` interim |
| **9** | Cloudflare R2 audio | **Done** — `audio_storage: s3`, custom domain configured |
| **10** | Hourly pipeline cron | **Done** — `curator-cron` runs `python manage.py run_pipeline` |

This doc is the decision record for when you revisit Step 8 and harden 9–10.

---

## Step 8 — Kokoro TTS (plan only)

### Goal

Self-hosted commercial-grade TTS at near-zero marginal cost per MP3 (compute only).

### Prerequisites before starting

- [ ] Railway plan allows **second service** with **≥1.5 GB RAM** (2 GB recommended)
- [ ] R2 already working (Step 9 — you have this)
- [ ] Pipeline image+audio cron commit deployed (sync post-publish)

### Execution sequence (when ready)

1. **8A** — New Railway service named `kokoro`, Docker image `hwdsl2/kokoro-server`, port **8880**, RAM **≥1.5 GB**
2. **8B** — Smoke test from TheCurator shell:
   ```bash
   curl -sS -o /tmp/kokoro-test.mp3 \
     -H "Content-Type: application/json" \
     -d '{"model":"tts-1","input":"Curator audio test.","voice":"af_heart","response_format":"mp3"}' \
     http://kokoro.railway.internal:8880/v1/audio/speech
   ls -la /tmp/kokoro-test.mp3
   ```
3. **8C** — TheCurator env (no angle brackets):
   ```bash
   TTS_PROVIDER=kokoro
   KOKORO_TTS_URL=http://kokoro.railway.internal:8880/v1
   KOKORO_TTS_MODEL=tts-1
   KOKORO_TTS_VOICE=af_heart
   ```
   Remove any literal `<kokoro-service>` placeholder values.
4. **8D** — Verify:
   ```bash
   python manage.py verify_audio_storage
   python manage.py generate_content_audio --all-missing --limit 3
   ```
   `/health/` → `integrations.kokoro: ok`, `tts.provider: kokoro`
5. **8E** — Optional: volume mount at `/var/lib/kokoro` if model re-download on every deploy is slow

### Rollback

Keep OpenAI vars in Railway (do not delete). Switch back:

```bash
TTS_PROVIDER=openai
```

Redeploy TheCurator only — Kokoro service can stay stopped.

### Cost / ops tradeoff

| Option | Monthly cost | Ops burden |
|--------|--------------|------------|
| OpenAI TTS (now) | ~$0.01–0.05 per long article | Zero |
| Kokoro on Railway 2 GB | ~$10–20 service | Model boot, OOM tuning |
| Speechmatics managed | Usage-based | API key only |

**Decision gate:** Move to Kokoro when OpenAI TTS bill or volume justifies a dedicated 2 GB service.

---

## Step 9 — R2 audio storage (plan: harden, not rebuild)

### Already done

- Bucket `curator-audio`
- `AUDIO_STORAGE_BACKEND=s3`
- `AUDIO_PUBLIC_BASE_URL` (custom domain)
- Articles serving R2 MP3 URLs in app

### Hardening checklist (when you have 30 min)

| # | Task | Why |
|---|------|-----|
| 9.1 | Run `python manage.py verify_audio_storage` after every TTS provider change | Catches broken credentials early |
| 9.2 | Confirm R2 lifecycle rule: no accidental delete on bucket | Production safety |
| 9.3 | DNS: `audio.thecuratorgroup.org` SSL green | Mobile/web stream reliability |
| 9.4 | Spot-check 3 random `audio_url` values return 200 + `audio/mpeg` | End-user playback |
| 9.5 | Document R2 token rotation date in password manager | Ops hygiene |

### Do not change

- Bucket name or public URL pattern without a migration plan for existing `Article.audio_url` / `Brief.audio_url` rows
- Do not revert to `AUDIO_STORAGE_BACKEND=local` on Railway (ephemeral disk)

---

## Step 10 — Hourly cron (plan: verify + tune, not re-architect)

### Already done

- **curator-cron** service (separate from TheCurator web)
- Command: `python manage.py run_pipeline`
- Env vars copied from TheCurator

### Verification checklist (after image+audio pipeline deploy)

| # | Task | Expected |
|---|------|----------|
| 10.1 | curator-cron logs after top of hour | `Pipeline run finished` |
| 10.2 | No cron on **TheCurator** web service | Web stays Gunicorn-only |
| 10.3 | `pipeline_review_status` in logs (optional) | Queue counts printed |
| 10.4 | New drafts appear in admin within ~1 h of ingest | `IN_REVIEW` rows |
| 10.5 | Published articles gain `image_url` + `audio_url` without manual shell | Post-publish maintenance |

### Tuning knobs (set on both TheCurator + curator-cron)

```bash
PIPELINE_GENERATE_AUDIO_ON_RUN=true
PIPELINE_AUDIO_LIMIT=25
PIPELINE_RESOLVE_IMAGES_ON_RUN=true
PIPELINE_IMAGE_LIMIT=25
PIPELINE_MIN_CLUSTER_SOURCES=2
PIPELINE_AUTO_PUBLISH=false
```

### Optional cron enhancement (later)

Add to cron start command **after** pipeline is stable:

```bash
python manage.py run_pipeline && python manage.py pipeline_review_status
```

Or a daily Resend email when `in_review > 0` — not built yet.

### Do not change

- Do not add Celery worker on Hobby tier unless you upgrade plan
- Do not set `PIPELINE_AUTO_PUBLISH=true` on production

---

## Recommended order when you pick this up

```
1. Confirm Step 9 hardening (9.1–9.5)     — 30 min, no code
2. Confirm Step 10 verification (10.1–10.5) — after tonight's deploy
3. Step 8 only when OpenAI TTS cost/ops pain > Kokoro hosting cost
```

---

## Links

- Full walkthrough: `api/docs/PHASE_0_SETUP.md`
- Session handoff: `docs/SESSION_STATUS_2026-06-13.md`
- Roadmap Phases 1+: `docs/TOP_TIER_ROADMAP.md`
