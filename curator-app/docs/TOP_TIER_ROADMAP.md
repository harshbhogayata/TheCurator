# Curator — Top-Tier Product Roadmap (2026 merged)

**Goal:** Top-1% editorial news app — legally defensible, near-zero marginal cost, solo-operable, premium feel.

**Merged from:** Our engineering plan (pipeline depth, mobile product, ops) + **2026 Blueprint** (cost/legal stack, India ingest, commercial TTS, R2 economics).

**Last updated:** 2026-06-23  
**Companion docs:** `PLAN.md`, `MOBILE_ARCHITECTURE.md`, `API_CONTRACT.md`, `OPERATIONS.md`, `api/docs/R2_AUDIO_SETUP.md`, `mobile/docs/FLOATING_PILL_MIGRATION.md`

---

## Best of both worlds

| We bring (already built) | Blueprint brings (adopt) |
|--------------------------|---------------------------|
| Multi-source **cluster** → LLM draft (not just headline+snippet) | **Currents API** for India/regional gaps in RSS |
| `license_status` + attribution + admin review | Explicit **commercial TTS** path (Kokoro / Speechmatics) |
| Expo app + web + Razorpay + RevenueCat | **R2 zero-egress** economics spelled out |
| Pexels resolver wired | **Unsplash** as premium abstract fallback |
| `run_pipeline` + Celery beat schedule | Resend **100/day** cap planning |
| Continue reading, search, push deep links | Fair-use **rewrite engine** framing (we already do this in `llm.py`) |

**Rule:** Keep our architecture. Upgrade the **legal/commercial** layers the blueprint flags (especially TTS + India ingest).

---

## North star

| Pillar | Top 1% bar |
|--------|------------|
| **Editorial** | Multi-outlet synthesis in Curator voice — never verbatim RSS |
| **Legal** | Licensed/RSS-permitted sources + transformative rewrite + attributed stock art + **commercial-grade TTS** |
| **Automation** | Hourly ingest → cluster → draft → review → publish → image → audio → push |
| **Economics** | R2 audio (no egress tax); free ingest where possible; paid LLM only where it matters |
| **Mobile** | Fast, honest search, continue reading, narrated briefs, Razorpay web + RC app entitlements |
| **Ops** | One person: Railway web + worker/cron + Redis + 5-min daily checklist |

---

## System map (target state)

```
┌──────────────────┐  hourly/cron   ┌─────────────────────────────────────────┐
│ RSS (global)     │───────────────►│ Pipeline: fetch → cluster → LLM draft   │
│ Currents API (IN)│                │ → admin review → publish                │
└──────────────────┘                └────────────┬────────────────────────────┘
                                                 │
     ┌───────────────────────────────────────────┼───────────────────────────┐
     ▼                                           ▼                           ▼
┌─────────────┐                          ┌─────────────┐              ┌─────────────┐
│ Images      │                          │ Audio       │              │ Related +   │
│ RSS media   │                          │ Kokoro SVC  │              │ embeddings  │
│ → Pexels    │                          │ or Speech-  │              │ (OpenAI)    │
│ → Unsplash? │                          │ matics → R2 │              └─────────────┘
└─────────────┘                          └─────────────┘
                                                 │
                                                 ▼
                                    ┌────────────────────────────┐
                                    │ Postgres + mobile API        │
                                    └─────────────┬──────────────┘
                                                  ▼
                                    ┌────────────────────────────┐
                                    │ Expo (EAS) + web frontend    │
                                    │ Resend · Expo Push · Firebase│
                                    │ Razorpay web · RevenueCat app│
                                    └────────────────────────────┘
```

---

## 2026 production stack (merged)

| Layer | Production choice | Dev / fallback | Cost & legal |
|-------|-------------------|----------------|--------------|
| **Mobile** | React Native + Expo (EAS) | — | Free; iOS + Android one codebase |
| **Web** | React (Vite) frontend | — | Razorpay checkout avoids 30% store tax on web |
| **Backend** | Django on Railway | — | Gunicorn web service |
| **Cron / jobs** | Celery worker + beat **or** Railway Cron → `run_pipeline` | Manual `run_pipeline` | Redis broker |
| **Global news** | RSS/JSON feeds (`seed_pipeline_sources`) | — | `rss_permitted` / `licensed` only |
| **India / regional** | **Currents API** (`SourceKind.API`) | — | 1,000 free req/day; budget in fetcher |
| **Rewrite** | OpenAI `gpt-4o-mini` | — | ~$0.15/1M input; **transformative** editorial in `llm.py` |
| **Images** | RSS media → **Pexels** (wired) | — | Commercial + attribution |
| **Images+** | **Unsplash API** (optional) | — | Premium abstract heroes; apply for production access |
| **TTS prod** | **Kokoro-82M** self-hosted on Railway | Edge TTS | Open weights; unlimited gen at compute cost |
| **TTS alt** | Speechmatics or OpenAI TTS-1 | Edge TTS | ~$11–15/M chars if no self-host |
| **TTS dev** | Edge TTS (`edge-tts`) | — | **Dev/staging only** — not for paid commercial product |
| **Audio CDN** | **Cloudflare R2** (`AUDIO_STORAGE_BACKEND=s3`) | Local disk | Zero egress — critical at scale |
| **Email** | Resend | — | Free 3k/mo; **100 emails/day cap** → Pro $20/mo when needed |
| **Push** | Expo Push | — | Free; deep link `data.url` → article |
| **Auth** | Firebase email + session API | — | Free tier |
| **Pay (web)** | Razorpay | Stripe optional | ~2%; unlock entitlements via webhook |
| **Pay (app)** | RevenueCat | — | Free to $10k MTR; syncs with Razorpay web purchase |

---

## Three critical pillars (legal + premium feel)

### 1. Transformative rewrite engine (both plans agree — we’re ahead)

Facts aren’t copyrighted; expression is. **Never publish verbatim RSS body text.**

**Our implementation** (`content_pipeline/services/llm.py`):
- Senior Curator voice, multi-paragraph articles, inline outlet attribution
- Cluster **multiple sources** before rewrite (stronger than single-snippet summarize)
- Draft → human review in Django admin (or auto-publish on staging only)

**Blueprint add:** Document in admin/onboarding that every published piece is AI-rewritten synthesis, not aggregation.

### 2. Commercial audio pipeline (blueprint wins — adopt)

| Tier | Provider | When |
|------|----------|------|
| **Production** | Kokoro-82M on Railway sidecar | Default after Phase 1 |
| **Managed** | Speechmatics or OpenAI TTS-1 | If Kokoro ops too heavy |
| **Dev only** | Edge TTS | Local + staging previews |

Flow: generate MP3 → upload R2 → save public URL on `Article`/`Brief` → app streams URL (Premium gate).

**Do not** ship Premium narrated audio on Edge TTS in production.

### 3. R2 delivery (both agree — finish Phase 0)

Ephemeral Railway disk is not storage. Production path:

1. `TTS_PROVIDER=kokoro` (or `openai` / `speechmatics`)
2. `AUDIO_STORAGE_BACKEND=s3` + R2 credentials
3. `AUDIO_PUBLIC_BASE_URL` = custom domain or R2 public URL
4. Remove reliance on deploy-time `generate_content_audio --limit 50` as primary strategy

---

## Payment strategy (blueprint + our code)

| Channel | Tool | Why |
|---------|------|-----|
| **Website / in-app web checkout** | Razorpay | ~2% vs 30% App Store; already wired |
| **iOS / Android IAP** | RevenueCat | Required for store compliance; syncs tier |
| **Cross-unlock** | RevenueCat webhook + `UserEntitlement` | Web Razorpay purchase unlocks app UI |

Marketing: push annual/lifetime via web; app stores for convenience tier.

---

## What’s already shipped (2026-06-23)

### Mobile
- Continue Reading (optimistic stats, `useArticlesByIds`, focus refresh, scroll resume)
- Server-side search (`?q=` ≥ 2 chars)
- Explore Today (recent dates) + Global (`feed=for_you`)
- Push tap → article deep link
- Help FAQ aligned to ₹ tiers

### API / pipeline
- Pexels `image_resolver.py` + `PEXELS_API_KEY`
- `seed_pipeline_sources` → `license_status=rss_permitted`
- `python manage.py run_pipeline`
- Recent articles by `-updated_at`

---

## Phase 0 — Automation live (~1 day) **BLOCKER**

Without this, the app is demo-seed only.

| # | Task |
|---|------|
| 0.1 | Railway **Redis** → `CELERY_BROKER_URL` |
| 0.2 | **Worker** `celery -A config worker -l info` **or** Cron: `python manage.py run_pipeline` hourly |
| 0.3 | **Beat** `celery -A config beat -l info` (if using Celery) |
| 0.4 | `python manage.py seed_pipeline_sources` |
| 0.5 | Env: `OPENAI_API_KEY`, `PIPELINE_ENABLED=true`, `PEXELS_API_KEY` |
| 0.6 | **R2** audio storage live |
| 0.7 | Admin review workflow (or `PIPELINE_AUTO_PUBLISH=true` on staging only) |

---

## Phase 1 — Blueprint merge: legal commercial stack (week 1)

| # | Task | Source |
|---|------|--------|
| 1.1 | **Kokoro TTS service** — Railway sidecar or Docker; `TTS_PROVIDER=kokoro` + HTTP client in `audio_services.py` | Blueprint |
| 1.2 | **Demote Edge TTS** to dev/staging only; document in `.env.example` | Blueprint |
| 1.3 | **Currents API fetcher** — `SourceKind.API`, India/regional categories, 1k/day budget counter | Blueprint |
| 1.4 | **Unsplash resolver** — fallback after Pexels when `UNSPLASH_ACCESS_KEY` set | Blueprint |
| 1.5 | `PIPELINE_MIN_CLUSTER_SOURCES=2` in prod | Ours |
| 1.6 | Health check: OpenAI + Pexels + Kokoro ping | Ours |
| 1.7 | Resend: monitor daily volume; plan Pro tier before launch spike | Blueprint |
| 1.8 | Brief `source_links` with real URLs | Ours |

**Say:** `do Phase 1.1 kokoro tts` or `do Phase 1.3 currents api`

---

## Phase 2 — Content quality (week 1–2)

| # | Task |
|---|------|
| 2.1 | Pipeline integration tests (fetch → mock LLM → publish) |
| 2.2 | Breaking push on publish — verify end-to-end |
| 2.3 | Backfill `image_attribution` on editorial seed |
| 2.4 | Morning brief audio via Kokoro (not Edge) |
| 2.5 | Source transparency on cards: “N outlets · X min read” |

---

## Phase 3 — Mobile product truth (week 2–3)

From `FLOATING_PILL_MIGRATION.md` + product gaps.

| # | Task | Priority |
|---|------|----------|
| 3.1 | **Pagination** — `nextCursor` in Explore/Search | High |
| 3.2 | **Continue Reading on Home** (Brief tab) | High |
| 3.3 | **Email verify** V1–V2 | High |
| 3.4 | Share article URL (`SITE_URL` + slug) | Medium |
| 3.5 | Brief detail screen | Medium |
| 3.6 | AppState refetch (entitlements, saves, stats) | Medium |
| 3.7 | OAuth Google/Apple | Medium |
| 3.8 | Settings #S1 cleanup | Low |
| 3.9 | Remove or ship fake donate benefits (forum, newsletter) | Low |

---

## Phase 4 — Performance & solo ops (week 3–4)

| # | Task |
|---|------|
| 4.1 | Audio mini player: resolve title by ID, not full catalogs |
| 4.2 | Related articles via `relatedArticleIds` only |
| 4.3 | Sentry + Railway alerts on pipeline/TTS failures |
| 4.4 | `OPERATIONS.md` runbook: “no articles today” |
| 4.5 | Maestro: search, read, donate, push open |
| 4.6 | Premium offline downloads (real feature, not flag-only) |

---

## Phase 5 — Top-1 differentiation (month 2+)

| # | Idea |
|---|------|
| 5.1 | **Morning edition** push — 3-story digest, one tap |
| 5.2 | Listen queue (brief + saved articles) |
| 5.3 | Personalized Explore from reading events |
| 5.4 | Home screen widget — today’s brief headline |
| 5.5 | India edition rail (Currents-sourced topics) |

---

## Known gaps (honest)

| Area | Status |
|------|--------|
| Celery / cron on Railway | **Not deployed** |
| Kokoro / commercial TTS | **Planned Phase 1** — Edge still default in code |
| Currents API | **Not built** — model has `SourceKind.API` |
| Unsplash API | **Not built** — demo seed uses static Unsplash URLs only |
| Pipeline ingest | Needs Phase 0 + seeded licensed sources |
| Search browse | Capped at 50 until pagination (Phase 3.1) |
| Offline Premium | Flag only |
| OAuth | UI stub |

---

## Daily solo operator checklist (5 min)

1. Railway logs — pipeline / TTS / Currents errors?
2. Django admin — drafts waiting review?
3. `GET /health/` green?
4. R2 audio URLs resolving?
5. EAS preview channel current?
6. One device path: Brief → Article → Search → Continue Reading → Support Us

---

## Environment variables (production)

```bash
# Content pipeline
OPENAI_API_KEY=
OPENAI_CHAT_MODEL=gpt-4o-mini
PIPELINE_ENABLED=true
PIPELINE_MIN_CLUSTER_SOURCES=2
PIPELINE_MAX_DRAFTS_PER_RUN=10

# Images
PEXELS_API_KEY=              # required — free commercial
UNSPLASH_ACCESS_KEY=         # optional — premium abstracts

# India / regional ingest
CURRENTS_API_KEY=            # 1,000 req/day free tier

# Audio (production)
TTS_PROVIDER=kokoro          # kokoro | speechmatics | openai | edge (edge=dev only)
KOKORO_TTS_URL=              # e.g. http://kokoro.railway.internal:8880/v1/audio
# OR SPEECHMATICS_API_KEY= / OPENAI for managed TTS
AUDIO_STORAGE_BACKEND=s3
AUDIO_S3_* / AUDIO_PUBLIC_BASE_URL=

# Automation
CELERY_BROKER_URL=redis://...
CELERY_RESULT_BACKEND=redis://...

# Existing
DATABASE_URL, FIREBASE_*, RESEND_API_KEY, RAZORPAY_*, REVENUECAT_*
```

---

## How to say “do it”

| Say | Action |
|-----|--------|
| `do Phase 0` | Railway worker/cron + R2 + seed sources |
| `do Phase 1.1 kokoro` | Commercial TTS service + audio_services integration |
| `do Phase 1.3 currents` | Currents API fetcher + India sources |
| `do Phase 1.4 unsplash` | Second image resolver |
| `do #3.1 pagination` | Mobile cursor pagination |
| `do #V1 verify banner` | Email verification UX |
| `eas update --channel preview` | Ship mobile |

---

## Success metrics (weekly)

| Metric | Target |
|--------|--------|
| Pipeline articles / week | ↑ (not seed-only) |
| % with hero image + R2 audio | > 95% |
| TTS provider | Kokoro/Speechmatics in prod (0% Edge) |
| D1 retention | Reading event within 24h of signup |
| Search → article open | ↑ after pagination |
| Subscribe conversion | Support Us → Razorpay |
| Push open rate | ↑ after deep links |
| Email bounces | Stay under Resend free tier or upgrade |

---

## Execution order (one person, no all-day grind)

```
Week 1:  Phase 0 → Phase 1.1 (Kokoro) + 1.3 (Currents) → approve first real pipeline articles
Week 2:  Phase 2 + Phase 3.1–3.3 (pagination, continue on home, verify)
Week 3:  Phase 3 rest + Phase 4 ops
Month 2: Phase 5 differentiation
```

**Top 1% = legally clean automation + premium mobile polish + near-zero marginal cost at scale.** This doc is the single source of truth for both.
