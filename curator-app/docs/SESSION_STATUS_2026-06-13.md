# Curator — Session status & tomorrow’s playbook

**Date:** 2026-06-13  
**Purpose:** Single handoff doc — what’s done on Railway, what’s uncommitted locally, known bugs/fixes, Phase 0 leftovers, and niche UX tracks (settings cleanup, donate copy, etc.).  
**Companion docs:** `api/docs/PHASE_0_SETUP.md`, `docs/TOP_TIER_ROADMAP.md`, `mobile/docs/FLOATING_PILL_MIGRATION.md`, `api/docs/R2_AUDIO_SETUP.md`

---

## Executive summary

| Area | Status |
|------|--------|
| Railway infra (Postgres, Redis, API, R2) | ✅ Live |
| Pipeline ingest + clustering + LLM drafts | ✅ Working (407+ raw items after license fix) |
| Hourly cron (`curator-cron` → `run_pipeline`) | ✅ Verified by you |
| Hero images in pipeline | 🟡 **Code done locally — not pushed yet** |
| Audio in pipeline (cron, no Celery) | 🟡 **Code done locally — not pushed yet** |
| OpenAI TTS (interim) | ✅ Working with R2 |
| Kokoro self-hosted TTS | ❌ OOM on ~1 GB Hobby — needs ≥1.5 GB RAM service |
| Celery worker | ⏭️ Skipped (plan limit) — cron-only architecture |
| Mobile UX fixes (Continue Reading, search, 8 categories) | ✅ Pushed (`4e23e8a`) |
| EAS preview update | ⬜ Not run yet |
| Web app on `app.thecuratorgroup.org` | ⬜ Discussed, not deployed |

**Tomorrow in one sentence:** Push the image+audio pipeline commit → Railway redeploy → run `bootstrap_phase0` on Railway → add `CURRENTS_API_KEY` + `UNSPLASH_ACCESS_KEY` on Railway → EAS update → daily admin review.

---

## Update log (2026-06-24 session)

- [x] Image + audio pipeline wired into `run_pipeline` (sync, no Celery)
- [x] `bootstrap_phase0` — migrate + seeds + Currents when key set
- [x] `pipeline_review_status` — editorial queue stats after each pipeline run
- [x] Admin draft list — review-priority sort + changelist reminder banner
- [x] `PHASE_0_STEPS_8_9_10_PLAN.md` — Kokoro / R2 harden / cron verify (plan only)
- [ ] **Commit pushed** — run `git push` after commit lands
- [ ] Railway: `python manage.py bootstrap_phase0` (or migrate + seeds separately)
- [ ] Railway: set `CURRENTS_API_KEY`, run bootstrap or `seed_currents_sources`
- [ ] Railway: optional `UNSPLASH_ACCESS_KEY`
- [ ] EAS: `npx eas-cli update --channel preview` (run locally when ready)
- [ ] Kokoro — **ignored for now** (see Steps 8–10 plan)


## What you already completed (production)

These were confirmed during the Railway session:

- [x] Postgres + Redis linked to **TheCurator** API
- [x] `/health/` — `database: ok`, `redis: ok`
- [x] `integrations.openai` + `integrations.pexels` ok
- [x] `audio_storage: s3` (Cloudflare R2)
- [x] `TTS_PROVIDER=openai` (interim; Kokoro blocked by OOM)
- [x] `PIPELINE_ENABLED=true`, `PIPELINE_MIN_CLUSTER_SOURCES=2`
- [x] `PEXELS_API_KEY`, `OPENAI_API_KEY`, R2 vars set
- [x] `python manage.py seed_pipeline_sources` — **critical** (fixes `license_status` → `rss_permitted`)
- [x] `python manage.py run_pipeline` works manually
- [x] **curator-cron** service — hourly `python manage.py run_pipeline` (env vars copied from TheCurator)
- [x] Django admin superuser; **10 drafts published** manually
- [x] **15 articles/briefs** got audio via `generate_content_audio` (manual, no worker)
- [x] **8 seed articles** got images via one-time shell backfill
- [x] Mobile pushed: Continue Reading, server search, scroll restore, push deep links, World News category

### Git on `main` (already pushed)

| Commit | What |
|--------|------|
| `83a92ee` | Pipeline ops, Kokoro/Currents ingest, Pexels image resolver, health diagnostics |
| `e210370` | Onboarding migration for World News (`news` category) |
| `4e23e8a` | Mobile UX fixes + expanded Phase 0 docs |

---

## Uncommitted local work (push tomorrow first)

**Not on Railway yet.** These files are changed/added in your working tree:

| File | Change |
|------|--------|
| `api/content_pipeline/services/post_publish.py` | **New** — sync image + audio backfill for cron-only stacks |
| `api/content_pipeline/services/image_resolver.py` | `effective_image_query()`, `resolve_content_hero_image()` |
| `api/content_pipeline/services/publish.py` | Hero image fallback at publish time |
| `api/content_pipeline/tasks.py` | `run_pipeline` → draft images → publish → `run_post_publish_maintenance()` |
| `api/content_pipeline/admin.py` | **Publish now** = sync image + audio (no Celery `.delay()`) |
| `api/content_pipeline/tests/test_image_resolver.py` | Tests for query fallbacks |
| `api/config/settings.py` | `PIPELINE_*_IMAGE_*` and `PIPELINE_*_AUDIO_*` toggles |
| `api/.env.example` | Same vars documented |
| `api/docs/PHASE_0_SETUP.md` | Cron now documents images + audio in one command |

**Also uncommitted (docs only):** `docs/TOP_TIER_ROADMAP.md` (local merged roadmap).

### What the push enables

One cron command does everything (no extra Railway service):

```bash
python manage.py run_pipeline
```

Each hourly run:

1. Fetch → cluster → LLM draft  
2. Resolve missing **draft** hero images (Pexels → Unsplash)  
3. Publish approved drafts (sync image + audio + relations)  
4. Backfill missing **live** article/brief images  
5. Generate missing narration (up to 25 each; tunable)

**Tomorrow step 1:** Commit + push → wait for Railway redeploy on TheCurator + curator-cron.

---

## Tomorrow — ordered checklist

### A. Ship code (15 min)

1. Review diff in `curator-app/api/` (especially `post_publish.py`).
2. Commit + push to `main` (triggers Railway auto-deploy).
3. Confirm both **TheCurator** and **curator-cron** redeployed (cron copies env from API — no new vars required unless you want to tune limits).

Suggested commit message:

> Wire hero images and sync audio into hourly pipeline for cron-only deploys.

### B. Backfill production content (10 min)

Railway shell on **TheCurator** or **curator-cron**:

```bash
python manage.py run_pipeline
```

This should pick up any published articles still missing `image_url` or `audio_url` (your ~8 image gaps + any new publishes).

Optional one-off (same effect for audio only):

```bash
python manage.py generate_content_audio --all-missing --limit 25
```

### C. Verify (5 min)

```bash
curl -s https://<your-api>/health/ | python -m json.tool
```

Check:

- `integrations.openai`, `integrations.pexels` → `ok`
- `audio_storage` → `s3`
- `tts.provider` → `openai` (until Kokoro)
- Admin → spot-check 2–3 articles: hero image URL + R2 audio URL

### D. Mobile EAS update (15 min)

Mobile code is already on `main` (`4e23e8a`). Ship to preview channel:

```bash
cd curator-app/mobile
npx eas-cli update --channel preview --message "Continue reading, search, World News"
```

Test on device: Brief → Article → Search → Continue Reading → Support Us.

### E. Phase 0 remaining (see full section below)

Kokoro, optional Currents/Unsplash, migrate if not run, daily admin review habit.

---

## Phase 0 — what’s still open

From `api/docs/PHASE_0_SETUP.md` checklist (updated for current state):

| # | Task | Status | Notes |
|---|------|--------|-------|
| 0.1 | Redis + `CELERY_BROKER_URL` | ✅ | Used for cache + Currents budget even without worker |
| 0.2 | Cron `run_pipeline` hourly | ✅ | **curator-cron** service — do **not** add cron to TheCurator web |
| 0.3 | Celery beat/worker | ⏭️ Skipped | Cron-only design; no plan for extra service |
| 0.4 | `seed_pipeline_sources` | ✅ | Re-run if sources reset to `review_required` |
| 0.5 | OpenAI + Pexels + pipeline env | ✅ | |
| 0.6 | R2 audio storage | ✅ | |
| 0.7 | Admin review workflow | 🟡 Ongoing | Publish 1–3 pipeline drafts per day until steady |
| 0.8 | Images in pipeline | 🟡 | **Push uncommitted code tomorrow** |
| 0.9 | Kokoro TTS | ❌ | OOM at ~1 GB; need dedicated service ≥1.5 GB RAM |
| 0.10 | `verify_audio_storage` | ⬜ | Run after any TTS/storage change |
| 0.11 | `migrate` + `seed_mobile_content` | ⬜ | If World News not in `/categories` yet |
| 0.12 | Optional `CURRENTS_API_KEY` | ⬜ | India/regional headlines |
| 0.13 | Optional `UNSPLASH_ACCESS_KEY` | ⬜ | Fallback when Pexels misses |
| 0.14 | EAS preview update | ⬜ | |

### Railway env reference (production — TheCurator + curator-cron)

**Required (you have these):**

```bash
DJANGO_DEBUG=false
DATABASE_URL=...
CELERY_BROKER_URL=redis://...
CELERY_RESULT_BACKEND=redis://...
REDIS_URL=redis://...
OPENAI_API_KEY=sk-...
OPENAI_CHAT_MODEL=gpt-4o-mini
PIPELINE_ENABLED=true
PIPELINE_AUTO_PUBLISH=false
PIPELINE_MIN_CLUSTER_SOURCES=2
PEXELS_API_KEY=...
TTS_PROVIDER=openai
AUDIO_STORAGE_BACKEND=s3
AUDIO_S3_ENDPOINT_URL=https://<account>.r2.cloudflarestorage.com
AUDIO_S3_BUCKET=curator-audio
AUDIO_S3_ACCESS_KEY_ID=...
AUDIO_S3_SECRET_ACCESS_KEY=...
AUDIO_PUBLIC_BASE_URL=https://audio.thecuratorgroup.org
API_PUBLIC_BASE_URL=https://<thecurator>.up.railway.app
```

**After tomorrow’s push (defaults — optional to set explicitly):**

```bash
PIPELINE_GENERATE_AUDIO_ON_RUN=true
PIPELINE_AUDIO_LIMIT=25
PIPELINE_RESOLVE_IMAGES_ON_RUN=true
PIPELINE_IMAGE_LIMIT=25
```

**Kokoro (when RAM available):**

```bash
TTS_PROVIDER=kokoro
KOKORO_TTS_URL=http://kokoro.railway.internal:8880/v1
KOKORO_TTS_MODEL=tts-1
KOKORO_TTS_VOICE=af_heart
```

**Delete** any env value containing literal `<kokoro-service>` — that caused DNS `%3ckokoro-service%3e` errors.

**Optional:**

```bash
UNSPLASH_ACCESS_KEY=...
CURRENTS_API_KEY=...
WEB_BILLING_PROVIDER=razorpay
RAZORPAY_KEY_ID=...
RAZORPAY_KEY_SECRET=...
```

---

## Known issues, fixes & gotchas

### 1. Sources stuck at `review_required` → zero ingest

**Symptom:** `run_pipeline` runs but no new raw items.  
**Cause:** Default migration sets `license_status=review_required`; fetcher skips non-permitted sources.  
**Fix:** `python manage.py seed_pipeline_sources` (sets `rss_permitted`). Re-run after DB reset.

### 2. Reuters feed fails from Railway

**Symptom:** One of 15 sources fails DNS (`feeds.reuters.com`).  
**Impact:** Low — 14/15 sources OK.  
**Fix options:** Ignore; replace URL in `seed_pipeline_sources`; or add Currents API for world news.

### 3. Kokoro OOM on Hobby tier

**Symptom:** Kokoro container restart loop / `integrations.kokoro: error`.  
**Cause:** Model + PyTorch needs ~1.5 GB+ RAM; 1 GB Hobby kills it.  
**Fix:** Dedicated **kokoro** Railway service with ≥1.5 GB RAM (2 GB safer); follow `PHASE_0_SETUP.md` Step 8A–8E.  
**Interim:** `TTS_PROVIDER=openai` (what you’re using now).

### 4. Admin “Publish now” used Celery before this push

**Symptom:** Publish succeeds but no audio until manual `generate_content_audio`.  
**Cause:** `.delay()` tasks need a worker you don’t have.  
**Fix:** Tomorrow’s push switches admin + auto-publish to **sync** helpers in `post_publish.py`.

### 5. Edge TTS in production

**Do not** use `TTS_PROVIDER=edge` for paid/commercial Premium narration — licensing risk. Dev/staging only. Production path: Kokoro → OpenAI/Speechmatics.

### 6. `PIPELINE_AUTO_PUBLISH=false` (correct for prod)

Cron creates drafts in `IN_REVIEW`. You must approve in admin (or set `true` on staging only).

### 7. Breaking news push without Celery

Auto-publish tries `send_breaking_news_alert.delay()` then falls back to sync call if broker unavailable. Push may still need Expo/Firebase configured.

### 8. Phase 0 doc duplicate line

`PHASE_0_SETUP.md` “Suggested order” has duplicate “Publish 1–3 drafts” bullets — cosmetic; fix when editing docs next.

---

## Architecture reminder (cron-only)

```
┌─────────────────┐     hourly      ┌──────────────────────────────────┐
│ curator-cron    │ ──────────────► │ python manage.py run_pipeline    │
│ (same env vars) │                 │  → fetch → cluster → draft       │
└─────────────────┘                 │  → draft images                  │
                                    │  → publish (sync img/audio)      │
┌─────────────────┐                 │  → backfill live images + audio  │
│ TheCurator      │ ◄── same DB ─── │                                  │
│ Gunicorn 24/7   │                 └──────────────────────────────────┘
└─────────────────┘
        │
        ▼
   Postgres + Redis + R2
```

- **Do not** enable hourly cron on the **TheCurator** web service — only **curator-cron**.
- **No Celery worker** required for Phase 0 with tomorrow’s push.

---

## Mobile — next steps (beyond Phase 0)

From `TOP_TIER_ROADMAP.md` and `FLOATING_PILL_MIGRATION.md`:

| Priority | Track | Item | How to start |
|----------|-------|------|--------------|
| High | Product | Pagination (`nextCursor`) in Explore/Search | `do #3.1 pagination` |
| High | Product | Continue Reading on Home (Brief tab) | Roadmap Phase 3.2 |
| High | Product | Email verification V1–V2 | `do #V1 verify banner` |
| Medium | Product | Share article URL (`SITE_URL` + slug) | Phase 3.4 |
| Medium | Product | Brief detail screen | Phase 3.5 |
| Medium | Product | AppState refetch (entitlements, saves) | Phase 3.6 |
| Medium | Product | OAuth Google/Apple | Phase 3.7 |
| Low | UX | **Settings cleanup #S1** | `do #S1 settings cleanup` |
| Low | UX | Floating auth/donate pills #4–#7 | One screen per EAS update |
| Low | Honesty | Remove/ships fake donate benefits | See below |

### Settings cleanup #S1 (planned, no code yet)

Doc: `mobile/docs/FLOATING_PILL_MIGRATION.md`

Remove redundant rows from `app/(app)/settings.tsx` Account section:

| ID | Remove | Why redundant |
|----|--------|----------------|
| S1a | Profile & Account | Menu → Profile; header avatar |
| S1b | Connected Accounts | Profile → Connected Accounts |
| S1c | Support The Curator | Membership card + Menu → Support Us |
| S1d | Account section heading | Empty after removals |

**When ready:** say **“do #S1 settings cleanup”** — `settings.tsx` only.

### Fake donate benefit copy

`mobile/app/(app)/donate.tsx` still lists **“Monthly newsletter”** and **“Community forum access”** for tiers — not implemented. Either remove from copy or build the features (Roadmap Phase 3.9).

---

## API / backend — post–Phase 0 backlog

| # | Item | Notes |
|---|------|-------|
| 1.1 | Kokoro sidecar | Step 8 in PHASE_0_SETUP; switch `TTS_PROVIDER` |
| 1.3 | Currents API | Code exists; needs `CURRENTS_API_KEY` + `seed_currents_sources` |
| 1.4 | Unsplash fallback | Wired in image resolver; needs key |
| 1.6 | Health: Kokoro ping | Shows `error` until service live |
| 2.1 | Pipeline integration tests | End-to-end with mock LLM |
| 2.2 | Breaking push E2E test | After publish breaking draft |
| 2.3 | `image_attribution` on seed content | Editorial polish |
| 4.3 | Sentry + Railway alerts | Pipeline/TTS failures |
| 4.4 | `OPERATIONS.md` “no articles today” runbook | Solo ops |

---

## Web frontend (separate track)

Discussed but not shipped:

| Item | Status |
|------|--------|
| Host full app at `app.thecuratorgroup.org` | Not deployed |
| `thecuratorgroup.org` | Marketing/waitlist live |
| Razorpay web checkout | API + frontend wired locally |
| Stripe fallback | Still in code via `WEB_BILLING_PROVIDER` |

---

## Store / business (unchanged)

- Samsung Galaxy Store wedge — paste support/privacy/terms/account-deletion URLs
- Google Play — after Udyam / console readiness
- RevenueCat — needs store products; web Razorpay unlocks entitlements cross-channel
- Microsoft Founders Hub — optional credits application discussed

---

## Daily 5-minute operator habit (once Phase 0 closed)

1. Railway logs — curator-cron errors? TTS failures?
2. Django admin — drafts waiting review?
3. `GET /health/` green?
4. Spot-check R2 audio + Pexels images on 1 article in app
5. One device smoke: Brief → Article → Search → Continue Reading

---

## Suggested week after tomorrow

```
Day 1 (tomorrow): Push pipeline images+audio → backfill → EAS update → admin publish 2–3 drafts
Day 2: Kokoro service with 2 GB RAM OR stay on OpenAI TTS + monitor cost
Day 3: Optional Currents key + seed India sources
Day 4: Pagination spike (#3.1) or email verify (#V1)
Day 5: Settings cleanup (#S1) + remove fake donate bullets
```

---

## Quick command reference

```bash
# Pipeline (hourly cron — same as manual)
python manage.py run_pipeline

# Re-fix source licenses
python manage.py seed_pipeline_sources

# Audio only backfill
python manage.py generate_content_audio --all-missing --limit 25

# Storage smoke test
python manage.py verify_audio_storage

# Migrations + categories
python manage.py migrate
python manage.py seed_mobile_content

# Optional India ingest
python manage.py seed_currents_sources

# Mobile preview ship
cd curator-app/mobile && npx eas-cli update --channel preview
```

---

## Files to read tomorrow

| Doc | Use |
|-----|-----|
| `api/docs/PHASE_0_SETUP.md` | Step-by-step Railway (Kokoro 8A–8E, cron, env) |
| `docs/TOP_TIER_ROADMAP.md` | Phases 1–5 master plan |
| `mobile/docs/FLOATING_PILL_MIGRATION.md` | #S1 settings, #V1 email verify, floating pills |
| `api/docs/R2_AUDIO_SETUP.md` | R2 + TTS env details |
| `api/docs/RAILWAY_PIPELINE.md` | Pipeline ops shorthand |

---

*Generated at end of pipeline/images session. Update this file after you push, deploy, and close Phase 0 checklist items.*
