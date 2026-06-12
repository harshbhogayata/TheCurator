# Curator — Backend↔Mobile Integration Plan

**Status:** Source of truth. All routing, security, and architecture decisions live here or in the linked documents. Edit this file when a decision changes.

**Companion docs**
- [API_CONTRACT.md](./API_CONTRACT.md) — every endpoint, request/response shape, auth, cache, rate limit
- [MOBILE_ARCHITECTURE.md](./MOBILE_ARCHITECTURE.md) — client-side cache, offline, optimistic UI, image pipeline
- [SECURITY.md](./SECURITY.md) — threat model and controls
- [OPERATIONS.md](./OPERATIONS.md) — deploy topology, CI/CD, monitoring, runbooks
- [CHECKLIST.md](./CHECKLIST.md) — phase-by-phase verification the user can run

---

## 1. North star

A mobile-first long-form news app where every interaction feels instant, survives flaky networks, and never leaks user data or lets unpaid users steal paid features. The backend is the authority for content and entitlement; the client is the authority for *presentation* and *intent*. Every screen works offline, syncs in the background, and shows truth within 2 seconds of reconnect.

## 2. Non-negotiable principles

| # | Principle | Consequence |
|---|-----------|-------------|
| 1 | **Server is authority for entitlement.** | Client never sets its own subscription tier. RevenueCat → webhook → Django writes `UserEntitlement`. Mobile reads only. |
| 2 | **Every write is idempotent or carries an idempotency key.** | Retry-on-network-failure never double-charges, double-saves, or duplicates reading events. |
| 3 | **Every read is cacheable and cancellable.** | ETag + `stale-while-revalidate`; React Query cancels on unmount. |
| 4 | **Every mutation is optimistic with server reconciliation.** | UI responds in <16ms; rollback on rejection. |
| 5 | **Every user-owned resource checks ownership server-side.** | `UserCollection.objects.get(user=request.user, id=...)` always — never trust the ID alone. |
| 6 | **Every endpoint is rate-limited per user AND per IP.** | DRF throttles + Cloudflare WAF. |
| 7 | **No PII in logs. No secrets in code. No tokens in URLs.** | Structured logging with scrubbing; `.env` only; always in `Authorization` header. |
| 8 | **Migrations are zero-downtime.** | Add-nullable → backfill → enforce, in separate deploys. Never drop in the same deploy as code that references it. |
| 9 | **Every error is observed.** | Sentry for unhandled; structured log for handled; SLO alerts on spikes. |
| 10 | **Offline-first where it makes sense.** | Feed, article detail, saves readable offline. Writes queued until reconnect. |

## 3. Resolved decisions

| Area | Decision | Notes |
|------|----------|-------|
| IAP / Entitlements | **RevenueCat** | Single SDK on mobile, single webhook into Django. No direct receipt verification by us. |
| Image source | **Editorial-resolved `image_url`** pointing to news-outlet photography, with `image_source_url` + `image_attribution` for compliance. Proxied through a **Cloudflare Worker** for on-the-fly resize/cache. | Editorial responsibility to pick legally usable URL (licensed wire service, outlet's own, or Creative Commons). See [SECURITY.md §8](./SECURITY.md#8-image-sourcing--copyright). |
| Deploy | **Fly.io Hobby** (Django app) + **Neon** (Postgres, serverless free tier) + **Upstash Redis** (serverless) + **Cloudflare** (DNS, image Worker, R2 for static/exports) | All free-tier or <$5/mo at v1 traffic. Portable Dockerfile means we can move later. |
| Push | **Expo Push → FCM** | Single `POST /devices` registration; backend holds Expo tokens; brief drops + breaking news. |
| Auth | **Firebase Auth** (existing) | ID token in `Authorization: Bearer`. Server verifies + provisions `users.User`. |
| Error tracking | **Sentry** | Free tier 5k errors/mo; DSN in env. Mandatory before first real user. |
| Analytics | **PostHog self-hosted later / deferred** | Do not ship analytics before Sentry + SLOs. |

## 4. System topology

```
┌────────────────────┐        ┌────────────────────────────┐
│  Expo mobile app   │        │     Cloudflare edge        │
│  (iOS / Android)   │        │  ┌──────────────────────┐  │
│                    │ HTTPS  │  │ Image resize Worker  │◄─┼── <img src="cdn.curator.app/img?u=..." />
│  React Query +     ├────────┼─►│ (cache, resize, WEBP)│  │
│  MMKV cache        │        │  └──────────────────────┘  │
│  Expo Push token   │        │                            │
└─────────┬──────────┘        │  DNS, WAF, rate limiting   │
          │                   └──────────────┬─────────────┘
          │ api.curator.app                  │
          ▼                                  │
┌────────────────────┐                       │
│    Fly.io VM       │                       │
│  Django + Gunicorn │                       │
│  Celery worker     ├──────────┐            │
│  Celery beat       │          │            │
└─────┬──────────┬───┘          │            │
      │          │              │            │
      ▼          ▼              ▼            │
┌──────────┐ ┌─────────┐  ┌──────────────┐   │
│  Neon    │ │ Upstash │  │ RevenueCat   │   │
│ Postgres │ │  Redis  │  │ webhook─────►│   │
└──────────┘ └─────────┘  └──────────────┘   │
                                             │
┌────────────────────┐                       │
│  Firebase Auth     │◄──── verify ID token ─┘
└────────────────────┘
```

## 5. Feature → capability → endpoint matrix

Exhaustive. Every mobile screen maps to backend capabilities here. If a row is missing, the feature is out of scope; add it explicitly.

| Mobile feature | Screen(s) | Backend capability | Endpoint(s) | Cache key | Offline readable? | Writable offline? |
|---|---|---|---|---|---|---|
| Sign up / sign in | `app/(auth)/*` | Firebase verify, provision user | `POST /api/mobile/auth/session` | `session` | — | — |
| Account detail/edit | `(app)/account` | Read, patch display name | `GET/PATCH /api/mobile/account` | `session` | yes | no |
| Delete account | `(app)/account` | Cascade delete | `DELETE /api/mobile/account` | — | no | no |
| Connected identities | `(app)/connected-accounts` | List, sync providers | `GET /api/mobile/account/identities`, `POST /api/mobile/account/identities/sync` | `identities` | yes | no |
| Onboarding steps | `(onboarding)/*` | Patch each step | existing `/api/mobile/onboarding/*` | `session` | no | no |
| Feed (briefs) | `(tabs)/index` | List briefs | `GET /api/mobile/v1/briefs` | `briefs:list` | yes | n/a |
| Explore / article list | `(tabs)/explore` | Paginated articles | `GET /api/mobile/v1/articles?cursor=&category=` | `articles:list:{filters}` | yes (first page) | n/a |
| Search | `(tabs)/search` | Full-text, categories | `GET /api/mobile/v1/articles?q=&cursor=` | `articles:list:{q}` | no | n/a |
| Categories list | filter chips | Static or dynamic | `GET /api/mobile/v1/categories` | `categories` | yes | n/a |
| Article detail | `(app)/article/[id]` | Full body, related | `GET /api/mobile/v1/articles/{id}` | `article:{id}` | yes (if previously viewed) | n/a |
| Related articles | article detail | Derived from list | — (reuse list cache) | `articles:list:{category}` | yes | n/a |
| Save / unsave | article detail, saved tab | Toggle + list | `GET/POST/DELETE /api/mobile/v1/saves[/{id}]` | `saves` | yes | **yes — queued** |
| Clear all saves | saved tab | Wipe | `DELETE /api/mobile/v1/saves` | `saves` | no | no |
| Saved tab list | `(tabs)/saved` | Intersection of saves + articles | Client-computed from caches | `saves`, `articles:*` | yes | n/a |
| Collections list | `(app)/collections` | List user collections | `GET /api/mobile/v1/collections` | `collections` | yes | n/a |
| Create / edit / delete collection | collections screens | CRUD | `POST/PATCH/DELETE /api/mobile/v1/collections[/{id}]` | `collections` | yes | **yes — queued** |
| Add / remove article in collection | article sheet, collection detail | Item CRUD | `POST/DELETE /api/mobile/v1/collections/{id}/articles[/{articleId}]` | `collections` | yes | **yes — queued** |
| Collection detail | `(app)/collection/[id]` | Join with articles | Client-computed | `collections`, `articles:*` | yes | n/a |
| Reading session tracking | article detail unmount | Log event | `POST /api/mobile/v1/reading/events` | `reading:stats` | — | **yes — queued** |
| Reading stats | `(app)/reading-stats`, profile | Aggregate | `GET /api/mobile/v1/reading/stats` | `reading:stats` | yes | n/a |
| Reading preferences | article reader, `(app)/settings` | Patch prefs | `GET/PATCH /api/mobile/v1/preferences` | `preferences` | yes | **yes — queued** |
| Audio playback | briefs, article detail | Stream URL (signed if premium) | `GET /api/mobile/v1/articles/{id}/audio` | — | cached audio only | — |
| Subscription tier read | paywall, settings | Current entitlement | `GET /api/mobile/v1/entitlements` | `entitlements` | yes | — |
| Purchase flow | paywall | RevenueCat SDK → webhook → backend | `POST /api/webhooks/revenuecat` (server-to-server) | — | — | no |
| QA tier override | hidden dev menu | Staff-only | `PATCH /api/mobile/v1/entitlements/qa-override` | `entitlements` | no | no |
| Push token register | app boot post-login | Upsert device | `POST /api/mobile/v1/devices` | — | no | retry on reconnect |
| Push preferences | `(app)/settings` | On/off per channel | `GET/PATCH /api/mobile/v1/preferences` | `preferences` | yes | queued |
| Feedback | `(app)/help` | Submit report | `POST /api/mobile/v1/feedback` | — | no | queued |
| Language/region | `(app)/language-region` | Patch prefs | `PATCH /api/mobile/v1/preferences` | `preferences` | yes | queued |
| Privacy / data export | `(app)/privacy` | Request export | `POST /api/mobile/v1/privacy/export` → email signed R2 URL | — | no | no |
| Health check | — | Liveness | `GET /health/` | — | — | — |

## 6. Data model (authoritative)

Only the shape; indexes and constraints in migrations.

```
User (existing)
  ├─ saved_articles → UserSavedArticle(article)       [unique(user, article)]
  ├─ mobile_collections → UserCollection
  │     └─ collection_items → UserCollectionArticle   [unique(collection, article)]
  ├─ reading_events → UserReadingEvent(article, read_time_ms, event_date)
  ├─ entitlement → UserEntitlement(tier, revenuecat_customer_id, product_id, expires_at, qa_override_*)
  ├─ devices → UserDevice(expo_push_token, platform, last_seen)   [NEW]
  ├─ preferences → UserPreference(theme, font_size, auto_save, push_daily_brief, push_breaking, ...)   [NEW]
  ├─ feedback_reports → FeedbackReport(category, message, app_version, os_version)   [NEW]
  └─ data_exports → DataExportRequest(status, r2_key, expires_at)   [NEW]

Article (existing)
  + image_url           (direct editorial URL)            [NEW, replaces image_query as primary]
  + image_source_url    (link for attribution)            [NEW]
  + image_attribution   ("Reuters / Alamy / ...")         [NEW]
  + search_vector       (tsvector, GIN)                   [NEW for FTS]
  + slug                (unique, for future deep links)   [NEW]

Brief (existing)
  + image_url (keep), + image_attribution (NEW)

Category                                                   [NEW — replaces bare string]
  id, slug, name, color, icon, rank, is_active

IdempotencyKey                                             [NEW]
  key, user_id, request_fingerprint, response_status, response_body, created_at, expires_at
  [unique(user, key)]
```

## 7. Build phases

Each phase is independently deployable and independently verifiable. Do not start phase N+1 until phase N's checklist in [CHECKLIST.md](./CHECKLIST.md) is green.

### Phase 0 — Foundations (blocks everything)
- Docker Desktop running; `docker compose up -d postgres redis` succeeds.
- `.env` populated with Firebase service account (see §9).
- Django `migrate` + `seed_mobile_content` run clean against Postgres.
- Mobile `.env` populated with `EXPO_PUBLIC_API_URL`, Firebase client keys, `EXPO_PUBLIC_MOCK_BACKEND=false`.
- Mobile connects, feed renders from backend (remove the `dailyBriefs` fallback; empty state instead).
- **Verify:** [CHECKLIST.md §Phase 0](./CHECKLIST.md#phase-0--foundations).

### Phase 1 — Security hardening of what already exists (CRITICAL)
- Patch `EntitlementView` — remove client-writable `tier`; keep only a staff-gated `qa-override` endpoint.
- Add DRF throttles: per-user `300/min` default, `20/min` on writes, `5/min` on account deletion and export.
- Add request-ID middleware; scrub `Authorization`, `password`, `email` from logs.
- Pin `SECURE_PROXY_SSL_HEADER` behind `TRUST_PROXY=true` env var; default off locally.
- Add `django-cors-headers` explicit origin list from env; no wildcards.
- Add Sentry with `send_default_pii=false`.
- Run `pip-audit` and `npm audit --production` in CI; fail on high severity.
- **Verify:** [CHECKLIST.md §Phase 1](./CHECKLIST.md#phase-1--security-hardening).

### Phase 2 — API contract completeness
Implement or finalize every endpoint in [API_CONTRACT.md](./API_CONTRACT.md).
- New: `Category` model + `/categories`, `UserPreference` + `/preferences`, `UserDevice` + `/devices`, `FeedbackReport` + `/feedback`, `DataExportRequest` + `/privacy/export`, `IdempotencyKey`.
- Swap `ArticleListView` plain-list for **cursor pagination** (`?cursor=`, response has `next` cursor).
- Add `ETag` + `Last-Modified` on all GET endpoints; honor `If-None-Match` with 304.
- Add `Idempotency-Key` header support on all POST/DELETE writes.
- Full-text search: `search_vector` tsvector + GIN index; `/articles?q=` uses `SearchRank`.
- **Verify:** [CHECKLIST.md §Phase 2](./CHECKLIST.md#phase-2--api-contract-completeness).

### Phase 3 — Mobile client overhaul
- React Query persistent cache via MMKV (`@tanstack/query-async-storage-persister`). TTL 24h.
- Offline mutation queue: MMKV-backed; replayed on `NetInfo.isConnected`; conflict resolution: server wins.
- Optimistic UI everywhere (saves, collections, preferences, reading events).
- Image pipeline: swap all `<Image source={{ uri }} />` to go through `cdn.curator.app/img?u=...&w=...` for on-the-fly resize; Expo Image for on-device cache.
- Remove all `MOCK_BACKEND` fallbacks in production builds (`app.config.ts` guards them).
- Prefetch on idle: article detail + images for top 5 feed items.
- Background refresh via `expo-background-fetch`: briefs + saves once per 6h.
- **Verify:** [CHECKLIST.md §Phase 3](./CHECKLIST.md#phase-3--mobile-client-overhaul).

### Phase 4 — Entitlements via RevenueCat
- Install `react-native-purchases`; configure offerings in RevenueCat dashboard.
- Backend webhook `POST /api/webhooks/revenuecat` verifies HMAC (shared secret), upserts `UserEntitlement.tier`, `product_id`, `expires_at`, `revenuecat_customer_id`.
- Mobile: `useSubscription` reads from `/entitlements` (server truth); `setTier` removed from client API; purchase flow is `Purchases.purchasePackage(...)` → refetch entitlements.
- QA override: `PATCH /entitlements/qa-override` guarded by `request.user.is_staff`.
- Paywall flow: show RevenueCat offerings; success → invalidate `entitlements` query.
- **Verify:** [CHECKLIST.md §Phase 4](./CHECKLIST.md#phase-4--entitlements).

### Phase 5 — Push notifications
- Mobile: `expo-notifications` to request permission + get Expo push token.
- `POST /api/mobile/v1/devices` with `{ expoPushToken, platform, appVersion }`.
- Celery task `send_daily_brief_notifications`: beat-scheduled 7am user-local (store tz on user or use preference), fans out via Expo Push HTTP/2 API in batches of 100.
- Breaking-news: admin command / signal on Brief create with `is_breaking=true`.
- Push preferences: `UserPreference.push_daily_brief`, `push_breaking` toggles honored in the fanout query.
- **Verify:** [CHECKLIST.md §Phase 5](./CHECKLIST.md#phase-5--push-notifications).

### Phase 6 — Images via Cloudflare Worker
- Deploy `image-proxy` Worker: `cdn.curator.app/img?u={url}&w={width}&q={quality}&f=webp`.
- Worker validates `u` is in allowlist of news outlet hostnames (`.reuters.com`, `.ap.org`, etc.); fetches; resizes with Cloudflare Images API or `wasm-vips`; returns with long `Cache-Control`.
- Mobile reads `article.imageUrl` which is already the proxied URL (server produces it).
- Editorial docs for allowed image sources: see [SECURITY.md §8](./SECURITY.md#8-image-sourcing--copyright).
- **Verify:** [CHECKLIST.md §Phase 6](./CHECKLIST.md#phase-6--images).

### Phase 7 — Observability + SLOs
- Sentry for backend + mobile (already set in Phase 1 for backend).
- Structured JSON logs → Fly log drains → optional Logtail/Axiom free tier.
- Request-ID propagated from Cloudflare `cf-ray` → Django `X-Request-ID` → mobile surfaces in Sentry crumbs.
- SLOs:
  - Availability: 99.5% monthly on `/api/mobile/v1/*`.
  - Latency: p95 `GET /articles` < 400ms, p95 writes < 600ms.
  - Error rate: 5xx < 0.5%.
- Alerting: Sentry issue alerts for error spikes; UptimeRobot pinging `/health/` every 5 min (free tier).
- **Verify:** [CHECKLIST.md §Phase 7](./CHECKLIST.md#phase-7--observability).

### Phase 8 — Data lifecycle + privacy
- `DELETE /account` cascades (already works) + enqueues Celery `purge_user_media` for R2 exports.
- `POST /privacy/export` → Celery exports user's rows + saves + collections to JSON → uploads to R2 → emails signed URL (24h TTL) via Firebase Auth email or SendGrid free tier.
- Data retention: reading events > 2y auto-purged by a Celery beat job.
- **Verify:** [CHECKLIST.md §Phase 8](./CHECKLIST.md#phase-8--data-lifecycle).

### Phase 9 — Launch hygiene
- E2E test pass with Detox on a real device (iPhone + Pixel).
- Load test backend: k6 script 100 RPS for 10 min on `/articles`, confirm SLOs hold.
- Security review pass: run the [SECURITY.md](./SECURITY.md) checklist.
- Rollback drill: deploy a broken build, `fly releases rollback`, confirm green in < 2 min.
- TestFlight + Play Internal Testing build.
- **Verify:** [CHECKLIST.md §Phase 9](./CHECKLIST.md#phase-9--launch).

## 8. Out of scope for v1 (explicit)

- Real-time comments / social features.
- Multi-device sync conflicts beyond "last write wins".
- Offline article *search* (index ships, search executes online only).
- In-app messaging or chat.
- Analytics dashboards for users ("your year in review" etc.).
- Multiple languages (copy is English only; i18n infra stays but no translations shipped).

If you want any of these, they become Phase 10+ and this doc is updated first.

## 9. Configs required from you

All secrets go in `api/.env` (backend) or `mobile/.env` (client; public-safe only). Never commit either.

### Backend — `api/.env`
```
# Django
DJANGO_SECRET_KEY=<generate with `python -c "import secrets; print(secrets.token_urlsafe(64))"`>
DJANGO_DEBUG=false                          # true only locally
DJANGO_ALLOWED_HOSTS=api.curator.app
TRUST_PROXY=true                            # only in prod behind Cloudflare/Fly
DATABASE_URL=postgres://...neon.tech/...
REDIS_URL=rediss://default:...@....upstash.io:6379

# Firebase (service account for ID token verification)
FIREBASE_PROJECT_ID=curator-xxxxx
FIREBASE_CREDENTIALS_JSON=<paste entire service-account JSON, base64 optional>

# RevenueCat
REVENUECAT_WEBHOOK_SECRET=<create in RC dashboard → Integrations → Webhooks>
REVENUECAT_API_KEY=<secret key from RC dashboard>

# Expo Push
EXPO_ACCESS_TOKEN=<expo.dev → access tokens>

# Sentry
SENTRY_DSN=<project DSN from sentry.io>

# CORS / CSRF — explicit origins only
CORS_ALLOWED_ORIGINS=https://curator.app,https://app.curator.app
CSRF_TRUSTED_ORIGINS=https://curator.app

# Email (for data export delivery; optional until Phase 8)
SENDGRID_API_KEY=<or Resend free tier>
SUPPORT_EMAIL=support@curator.app
```

### Mobile — `mobile/.env`
```
EXPO_PUBLIC_API_URL=https://api.curator.app
EXPO_PUBLIC_MOCK_BACKEND=false              # never true in production builds

# Firebase (client SDK — public-safe)
EXPO_PUBLIC_FIREBASE_API_KEY=...
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=curator-xxxxx.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=curator-xxxxx
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=curator-xxxxx.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
EXPO_PUBLIC_FIREBASE_APP_ID=...
EXPO_PUBLIC_FIREBASE_IOS_BUNDLE_ID=com.curator.mobile
EXPO_PUBLIC_FIREBASE_ANDROID_PACKAGE=com.curator.mobile

# RevenueCat (public SDK keys — one per platform)
EXPO_PUBLIC_REVENUECAT_IOS_KEY=appl_...
EXPO_PUBLIC_REVENUECAT_ANDROID_KEY=goog_...

# Sentry
EXPO_PUBLIC_SENTRY_DSN=<mobile DSN from sentry.io>

# Image CDN
EXPO_PUBLIC_IMAGE_CDN_BASE=https://cdn.curator.app/img
```

### Cloudflare Worker — `workers/image-proxy/wrangler.toml` env
```
ALLOWED_IMAGE_HOSTS=reuters.com,ap.org,bloomberg.com,ft.com,nytimes.com,...
```

### Third-party accounts you need to create
| Service | Purpose | Tier | Action |
|---------|---------|------|--------|
| **Neon** | Postgres | Free 3GB | Create project, copy `DATABASE_URL` |
| **Upstash** | Redis | Free 10k cmds/day | Create DB, copy `rediss://` URL |
| **Fly.io** | Django + Celery VMs | Hobby (~$0–5/mo for 1 shared-cpu-1x + 1 worker) | `flyctl launch`, we'll generate `fly.toml` |
| **Cloudflare** | DNS, image Worker, R2 | Free | Add `curator.app` + `api.curator.app` + `cdn.curator.app` |
| **Firebase** | Auth | Spark (free) | Enable Email/Password + Google; download service account JSON |
| **RevenueCat** | Entitlements | Free to $10k MTR | Create project, configure offerings, set webhook URL |
| **Sentry** | Errors | Dev (free 5k errors/mo) | Create Django + React Native projects |
| **Expo** | Push service | Free | Create `EXPO_ACCESS_TOKEN` |
| **UptimeRobot** (or BetterStack) | Uptime pings | Free | Add `GET /health/` monitor, 5-min interval |
| **Resend** (or SendGrid) | Transactional email | Free (3k/mo Resend) | API key for data-export emails |

## 10. How to change this plan

- Any deviation from §2 principles requires a written exception here with a deadline to revert.
- Any new feature is added to §5 *before* it is built.
- Any env var is added to §9 before it is referenced in code.
- Any endpoint change updates [API_CONTRACT.md](./API_CONTRACT.md) in the same PR.
