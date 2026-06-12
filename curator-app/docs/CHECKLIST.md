# Verification Checklist

Tick each box only when you've personally run the command and seen the expected output. No "looks good to me" — empirical only.

Every phase has **Prereqs**, **Steps**, **Verify**. If verify fails, do not proceed.

---

## Phase 0 — Foundations

**Goal:** Postgres + Redis up, Django + mobile connected via local real backend, no mocks.

### Prereqs
- [ ] Docker Desktop installed and running
- [ ] Python 3.13 venv at `api/.venv`
- [ ] Node 20+ and `npm` available
- [ ] Firebase project created; service account JSON downloaded

### Steps
1. Populate `api/.env` from `api/.env.example`; set `FIREBASE_CREDENTIALS_JSON` to the entire service account JSON as a single-line string.
2. `npm run db:up` from `curator-app/` — starts Postgres + Redis.
3. `cd api && .venv\Scripts\activate && python manage.py migrate`
4. `python manage.py seed_mobile_content`
5. `python manage.py runserver 127.0.0.1:8000`
6. In another terminal: populate `mobile/.env` from `mobile/.env.example`; set `EXPO_PUBLIC_MOCK_BACKEND=false` and Firebase client keys.
7. `cd mobile && npm run start` → open on iOS Simulator / Android Emulator.

### Verify
- [ ] `curl http://127.0.0.1:8000/health/` returns `200` with `database: ok`, `redis: ok`
- [ ] `curl http://127.0.0.1:8000/api/mobile/v1/articles` returns `401` (not 500)
- [ ] Mobile app signs in; feed loads 8 articles + 4 briefs from server (verify by toggling a seed-data field and re-fetching)
- [ ] Mobile app with airplane mode shows cached feed, not a crash
- [ ] `api-run-stderr.log` has no `psycopg.errors.ConnectionTimeout`

---

## Phase 1 — Security hardening

**Goal:** close the entitlement-escalation hole, add throttles, logging hygiene, Sentry.

### Prereqs
- [ ] Phase 0 complete
- [ ] Sentry account + two DSNs (django + mobile)

### Steps
1. `api/mobileapi/views.py`: delete `EntitlementView.patch`. Add new `EntitlementQAOverrideView` with `if not request.user.is_staff: raise PermissionDenied`.
2. `api/config/settings.py`: add `REST_FRAMEWORK["DEFAULT_THROTTLE_CLASSES"]` and `DEFAULT_THROTTLE_RATES` per [API_CONTRACT.md §0](./API_CONTRACT.md#0-conventions). Declare `throttle_scope` on each view.
3. Add `api/common/middleware/logging_scrubber.py` that replaces sensitive fields in the stdlib `logging` record dict.
4. Add `api/common/middleware/request_id.py` — use `cf-ray` if present, else uuid4; attach to `response["X-Request-ID"]`.
5. Guard `SECURE_PROXY_SSL_HEADER` with `env.bool("TRUST_PROXY", False)`.
6. Install `sentry-sdk[django]`; init in `settings.py` with `send_default_pii=False`.
7. Install `sentry-expo` in mobile; init in `app/_layout.tsx`.
8. Add `pip-audit` and `npm audit --audit-level=high` to CI.
9. `sec-audit.py` script: greps for `objects.get(id=` without `user=` in `api/**/views.py`. Fails CI on any hit.

### Verify
- [ ] `curl -X PATCH http://127.0.0.1:8000/api/mobile/v1/entitlements -H "Authorization: Bearer <non-staff token>" -d '{"tier":"lifetime"}'` returns `404` or `405` (endpoint gone)
- [ ] Same call against `/entitlements/qa-override` returns `403 permission_denied`
- [ ] Hit `/articles` 301 times in a minute with the same token → 301st returns `429` with `Retry-After`
- [ ] Grep `fly logs` (or local stderr) — no `Bearer` strings, no `email=`, no plaintext passwords
- [ ] Force an exception in a view → appears in Sentry within 30s
- [ ] `python sec-audit.py` exits 0
- [ ] `pip-audit` and `npm audit --omit=dev --audit-level=high` exit 0

---

## Phase 2 — API contract completeness

**Goal:** every endpoint in [API_CONTRACT.md](./API_CONTRACT.md) exists and conforms.

### Prereqs
- [ ] Phase 1 complete
- [ ] Contract reviewed and agreed with you

### Steps
1. New models: `Category`, `UserPreference`, `UserDevice`, `FeedbackReport`, `DataExportRequest`, `IdempotencyKey`. Migrations zero-downtime.
2. Cursor pagination utility `api/common/pagination.py`; refactor `ArticleListView` and `BriefListView`.
3. ETag middleware: compute `W/"<sha1 of body>"` on 2xx GETs; honor `If-None-Match` → 304.
4. Idempotency middleware: on POST/PATCH/DELETE with `Idempotency-Key` header, check `IdempotencyKey` table; replay or proceed.
5. `search_vector` (`SearchVectorField`) + GIN index on Article; trigger keeps it updated; `/articles?q=` uses `SearchRank`.
6. New views: `CategoryListView`, `PreferenceView`, `DeviceView`, `FeedbackView`, `DataExportView`.
7. Remove `image_query` from Article serializer output; add `imageUrl`, `imageSourceUrl`, `imageAttribution`.
8. Write contract tests: one `api/mobileapi/tests/test_contract.py` per endpoint, asserting status + response schema. Use `jsonschema` for validation.

### Verify
- [ ] `python manage.py test mobileapi` all green
- [ ] `curl /api/mobile/v1/articles?cursor=invalid` → `400 invalid_cursor`
- [ ] `curl /api/mobile/v1/articles` → response has `items` and `nextCursor`; `ETag` header set
- [ ] Repeat with `If-None-Match: <etag>` → `304 Not Modified`
- [ ] `POST /api/mobile/v1/saves` with same `Idempotency-Key` twice → same response both times; only one row in DB
- [ ] `POST /api/mobile/v1/saves` with same key, **different** body → `409 idempotency_conflict`
- [ ] `/api/mobile/v1/categories` returns the full list with `public, max-age=3600`
- [ ] `/api/mobile/v1/articles?q=volatility` returns articles ranked by relevance (not just filter)

---

## Phase 3 — Mobile client overhaul

**Goal:** persistent cache, offline mutations, optimistic UI everywhere, no mock fallbacks in prod builds.

### Prereqs
- [ ] Phase 2 complete
- [ ] `react-native-mmkv`, `@tanstack/react-query-persist-client`, `@tanstack/query-async-storage-persister` or equivalent installed

### Steps
1. Add `src/storage/mmkv.ts`, `src/storage/query-persister.ts`, `src/storage/offline-queue.ts`.
2. Wrap `QueryClientProvider` in `PersistQueryClientProvider`.
3. Migrate every provider to the pattern in [MOBILE_ARCHITECTURE.md §5](./MOBILE_ARCHITECTURE.md#5-optimistic-ui-pattern).
4. Delete every `MOCK_BACKEND` fallback branch; add build-time assertion in `app.config.ts`.
5. Implement idempotency: `src/lib/idempotency.ts` generates a UUID per mutation call; `api-client.ts` adds `Idempotency-Key` header.
6. Image pipeline: replace `<Image source={{ uri: article.imageUrl }} />` with helper that appends width query; set `cachePolicy="memory-disk"`.
7. Background task: register `curator.background-refresh` in `src/background/tasks.ts`; call from `app/_layout.tsx`.
8. Prefetch feed detail + next page on idle.
9. Replace `dailyBriefs` fallback with `<EmptyState />`.

### Verify
- [ ] Launch app, sign in, scroll feed, kill app, relaunch in airplane mode → feed + any-previously-viewed article detail render from cache
- [ ] Kill app while a save is in flight → relaunch connected → save reaches server (inspect DB)
- [ ] Toggle airplane mode, save an article, toggle back → save appears on server within 5s
- [ ] Tap save twice rapidly → DB has exactly one `UserSavedArticle` row
- [ ] `EXPO_PUBLIC_MOCK_BACKEND=true eas build --profile production` fails at build time
- [ ] Image requests in Chrome DevTools Network tab go to `cdn.curator.app/img?...`, not direct outlet URLs
- [ ] Toggle Wi-Fi off → UI responsive; errors shown as toasts with request IDs
- [ ] `npm run typecheck` clean, `npm run lint` clean

---

## Phase 4 — Entitlements via RevenueCat

**Goal:** paid tiers granted only by verified RC webhook. Client has zero tier-write power.

### Prereqs
- [ ] Phase 3 complete
- [ ] RevenueCat project configured; webhook URL pointed at staging first
- [ ] `react-native-purchases` installed

### Steps
1. Install `react-native-purchases`; configure in `src/services/revenuecat.ts`; call `Purchases.configure({ apiKey })` at app boot.
2. On sign-in: `Purchases.logIn(firebaseUid)` — links RC customer to our user.
3. Paywall screen: fetch offerings via `Purchases.getOfferings()`; present packages; on purchase → `Purchases.purchasePackage(pkg)` → invalidate `queryKeys.entitlements`.
4. Backend: `POST /api/webhooks/revenuecat` view, signature check (§SECURITY 3), upsert `UserEntitlement` keyed on `app_user_id`. Store `event_id` → idempotency.
5. Remove client `updateEntitlementTier` + `EntitlementUpdateSerializer`.
6. QA override: `PATCH /entitlements/qa-override`, `is_staff` only, hidden dev menu in mobile.

### Verify
- [ ] Run a sandbox purchase on iOS → RC dashboard shows the event → Django `UserEntitlement.tier = premium` within 10s → `/entitlements` returns `effectiveTier: "premium"`
- [ ] Cancel subscription in sandbox → RC sends `CANCELLATION` → tier stays until `expires_at`, then `EXPIRATION` → tier goes `free`
- [ ] Fire a webhook request with wrong secret → 401, not processed
- [ ] Fire the same webhook event twice → DB has exactly one entitlement state change
- [ ] Non-staff `PATCH /entitlements/qa-override` → 403
- [ ] Staff `PATCH /entitlements/qa-override` → tier flips; `/entitlements` reflects

---

## Phase 5 — Push notifications

**Goal:** device registration, daily-brief push, breaking-news push, respecting preferences and quiet hours.

### Prereqs
- [ ] Phase 4 complete
- [ ] `expo-notifications`, `expo-device` installed
- [ ] `EXPO_ACCESS_TOKEN` in backend secrets

### Steps
1. Mobile: request notification permission post-onboarding; get Expo push token; `POST /api/mobile/v1/devices`.
2. Backend: `UserDevice` model; `POST /devices` upsert; `DELETE /devices/{id}` on sign-out.
3. Celery task `send_daily_briefs`: query users where `push_daily_brief=true`, filter by local-time 07:00 in their `regionCode`, fanout via Expo Push HTTP/2 API in batches of 100, respect quiet hours.
4. Celery beat: every 15 min window (cron `*/15 7 * * *` server time, with per-user TZ filter inside).
5. Breaking news: admin action on Brief or Article (`is_breaking=true`) enqueues `send_breaking_news` task.
6. Handle receipts (Expo returns ticket IDs → poll for delivery errors → mark `UserDevice.failed_count++`, deactivate after 3).

### Verify
- [ ] Sign in on a real device; `UserDevice` row exists in DB with `expo_push_token`
- [ ] Run `python manage.py shell` → call `send_daily_briefs.delay()` → device receives notification within a minute
- [ ] Toggle `pushDailyBrief=false` → run task → no notification
- [ ] Mark a brief breaking → admin action fires → notification arrives
- [ ] Sign out on device → `UserDevice` row deleted
- [ ] Simulate delivery failure 3× → token deactivated, no more sends

---

## Phase 6 — Image proxy (Cloudflare Worker)

**Goal:** every image on mobile served through `cdn.curator.app`, resized, cached at edge, allowlisted hosts.

### Prereqs
- [ ] Phase 3 complete (so mobile already points at CDN URLs)
- [ ] Cloudflare account with `curator.app` zone; `cdn.curator.app` CNAME to Workers route

### Steps
1. `workers/image-proxy/src/index.ts`: `fetch` handler. Parse `?u=`, validate host against `ALLOWED_IMAGE_HOSTS`, fetch upstream with 10s timeout, resize via Cloudflare Images' `cf` fetch options (`cf.image.width`, `.quality`, `.format`), return with `Cache-Control: public, max-age=31536000, immutable`.
2. `wrangler.toml` with `routes = ["cdn.curator.app/img*"]`, env vars.
3. Backend: when creating an Article, server computes `image_url = CDN_BASE + "?u=" + quote(upstream_url)` and stores that in the row. Mobile never constructs it.
4. Deploy: `wrangler deploy`.
5. Cache purge helper: `scripts/purge_image.py <article_id>` calls Cloudflare API.

### Verify
- [ ] `curl "https://cdn.curator.app/img?u=https%3A%2F%2Fimages.unsplash.com%2Fphoto-1495020689067-958852a7765e&w=800"` returns an image, `Content-Type: image/webp`, `Cache-Control: public, max-age=31536000`
- [ ] `curl "https://cdn.curator.app/img?u=https%3A%2F%2Fevil.example%2Fx.png"` returns `403`
- [ ] Mobile article list shows images; Chrome DevTools network tab shows ~100 KB per image (not 2 MB originals)
- [ ] Second load is served from edge cache (`cf-cache-status: HIT`)
- [ ] `scripts/purge_image.py <article>` — subsequent request shows `MISS` once then `HIT`

---

## Phase 7 — Observability + SLOs

**Goal:** know when things break, know how broken, know the trend.

### Prereqs
- [ ] Sentry active from Phase 1
- [ ] UptimeRobot account

### Steps
1. Add `X-Request-ID` propagation end-to-end (already in Phase 1; verify mobile includes `X-Request-ID` header when reporting via feedback endpoint).
2. JSON log formatter (`python-json-logger`), ship via Fly log drain to Logtail free tier (optional).
3. Define SLOs in code: `docs/SLOS.md` (split this file out if it grows) with burn-rate alerts in Sentry Performance (if enabled) or manual dashboards.
4. UptimeRobot: add monitor on `https://api.curator.app/health/`, 5-min interval, alert contact = your email + SMS.
5. Status page: UptimeRobot's free public status page; link from `(app)/help`.

### Verify
- [ ] Tail `fly logs -a curator-api` — each line is parseable JSON with `request_id`, `user_id`, `method`, `path`, `status`, `duration_ms`
- [ ] Hit `/api/mobile/v1/articles` → record the `X-Request-ID` response header → search that ID in logs → find exactly one matching entry
- [ ] Throw a test error from mobile via a dev button → Sentry issue appears with breadcrumbs (navigation + mutation trail)
- [ ] UptimeRobot shows the health endpoint as green for 24 h
- [ ] Induce a DB outage in staging (pause Neon compute) → UptimeRobot alert fires within 10 min

---

## Phase 8 — Data lifecycle + privacy

**Goal:** users can delete their account, export their data, and old reading events auto-purge.

### Prereqs
- [ ] Phase 7 complete
- [ ] Resend or SendGrid API key in secrets
- [ ] R2 bucket `curator-assets` with a `exports/` prefix

### Steps
1. `POST /api/mobile/v1/privacy/export` view → enqueue Celery `generate_user_export(user_id)`.
2. Celery task: collect all user-owned rows + saved-article metadata → write JSON → upload to R2 at `exports/{user_id}/{request_id}.json` with 24h TTL via presigned URL → email the URL via Resend.
3. `GET /api/mobile/v1/privacy/exports` lists past requests with status + download URL.
4. Daily beat job `purge_old_reading_events`: delete `UserReadingEvent` where `event_date < today - 2y`.
5. Account-delete enhancement: after `user.delete()`, enqueue `purge_user_media(user_id)` to tombstone any remaining R2 objects.

### Verify
- [ ] Signed-in user hits Export → email arrives within 5 min with signed URL → URL opens a JSON file
- [ ] Same URL after 24h → expired, 403
- [ ] Insert a `UserReadingEvent` with `event_date = 3y ago` → run purge task → row gone
- [ ] Delete account → email + Firebase UID + R2 objects are gone within 10 min
- [ ] Second account-delete call on the same user → idempotent (404 cleanly)

---

## Phase 9 — Launch

**Goal:** TestFlight + Play Internal build, security pass, rollback drill, cert pinning live.

### Prereqs
- [ ] Phases 0–8 complete
- [ ] Apple Developer account ($99/yr)
- [ ] Google Play Console account ($25 one-time)

### Steps
1. Detox E2E: write 10 core flows (sign up, sign in, feed, detail, save, unsave, collection create + add, purchase, delete account, sign out).
2. Load test: `k6 run scripts/load-test-articles.js` — 100 VU, 10 min, ramp pattern. Confirm p95 < 400 ms reads.
3. Security review: walk through [SECURITY.md §14](./SECURITY.md#14-security-verification-pre-launch) with nothing unchecked.
4. Cert pinning: add `react-native-ssl-pinning`; bundle Cloudflare's leaf cert SHA-256; gate behind `EXPO_PUBLIC_SSL_PINNING=true` in production profile.
5. Rollback drill (see [OPERATIONS.md §11](./OPERATIONS.md#11-rollback-drill)). Record elapsed time.
6. App store submissions:
   - Apple: `eas submit -p ios --profile production` + filled App Privacy declarations + age rating + review notes with test account creds.
   - Google: `eas submit -p android --profile production` + Play Data Safety form + closed testing track first.
7. Privacy policy + terms of service pages published at `curator.app/privacy`, `curator.app/terms`.
8. Takedown workflow documented and runbook rehearsed.

### Verify
- [ ] Detox suite 10/10 green on iOS simulator + Android emulator
- [ ] k6 report: p95 < 400 ms, error rate < 0.1%
- [ ] Every box in [SECURITY.md §14](./SECURITY.md#14-security-verification-pre-launch) checked
- [ ] Rollback drill completed in < 5 min
- [ ] TestFlight build installs on a real iPhone, full flow works
- [ ] Play Internal testing build installs on a real Android, full flow works
- [ ] Privacy policy + terms pages resolve to 200
- [ ] App Store Connect + Play Console reviewers have test credentials

---

## Ongoing (post-launch)

- [ ] Weekly: Dependabot PRs reviewed
- [ ] Weekly: Sentry issue triage (top 5 oldest unresolved)
- [ ] Weekly: SLO dashboard glanced
- [ ] Monthly: rollback drill
- [ ] Monthly: Neon PITR drill
- [ ] Monthly: review cost dashboard vs [OPERATIONS.md §9](./OPERATIONS.md#9-cost-ceiling-v1)
- [ ] Quarterly: security review (rotate secrets, revisit threat model)
- [ ] Quarterly: retention policy review (what PII are we still holding that we don't need)
