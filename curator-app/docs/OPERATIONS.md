# Operations

How the system runs in production, how we deploy, how we know it's broken, how we fix it.

## 1. Environments

| Env | Purpose | URL | Data | Who can push |
|---|---|---|---|---|
| `local` | developer laptops | `http://127.0.0.1:8000`, `http://localhost:8081` | seeded | anyone |
| `staging` | pre-prod validation | `https://api-staging.curator.app` | anonymized copy of prod | main branch auto-deploy |
| `production` | live users | `https://api.curator.app` | real | tagged releases only |

**Rule:** every change goes `local → PR → staging → prod`. No hotfixes that skip staging except documented P0 incidents.

## 2. Infra topology

### Backend — Fly.io
- **App `curator-api`:** 1× `shared-cpu-1x`, 512 MB. Gunicorn 3 workers × 2 threads. Auto-stop when idle.
- **App `curator-worker`:** 1× `shared-cpu-1x`, 256 MB. Celery worker consuming from Redis.
- **App `curator-beat`:** 1× `shared-cpu-1x`, 256 MB. Celery beat scheduler (single instance, never scale).
- Region: `bom` (Mumbai) primary, `sin` secondary. Proximity to IN users.
- Health check: `GET /health/` every 30s; restart on 3 consecutive failures.

### Database — Neon
- Project `curator-prod`, branch `main`, size `0.25 CU`. Autoscale to `1 CU` under load.
- Point-in-time recovery enabled (7 days on free tier).
- Connection pooling via Neon's pooler; `DATABASE_URL` uses `?sslmode=require&pgbouncer=true`.
- Read replica: none in v1. Add when read QPS > 100.

### Redis — Upstash
- Database `curator-cache`, `rediss://` TLS mandatory.
- Used for: DRF throttle counters, Celery broker/backend, Django cache (template fragments, `/categories`).
- Data retention: eviction policy `allkeys-lru`, max memory default.

### Cloudflare
- DNS for `curator.app`, `api.curator.app`, `cdn.curator.app`.
- WAF free plan: bot fight, managed rules.
- **Worker `image-proxy`** on `cdn.curator.app/img`.
- **R2 bucket `curator-assets`** for editorial uploads + data exports.
- TLS: Full (strict) with Fly cert.

### Firebase
- Project `curator-prod`. Auth only in v1 (no Firestore, no Storage, no Functions).
- Email/Password + Google + Apple sign-in providers.
- Authorized domains: `curator.app`, `localhost` (dev only).

### RevenueCat
- Project `curator`. Offerings: `default` → `curator_basic_monthly`, `curator_premium_monthly`, `curator_premium_annual`, `curator_lifetime`.
- Webhook URL: `https://api.curator.app/api/webhooks/revenuecat`.
- App User ID: set to Firebase UID from mobile on `Purchases.logIn(uid)`.

### Sentry
- Org `curator`, projects `curator-django` + `curator-mobile`. Alerts to email (Slack/Discord optional later).

### Monitoring
- **UptimeRobot** free: HTTPS monitor on `https://api.curator.app/health/` every 5 min; SMS alert on 2 consecutive fails.
- **Neon**: built-in metrics dashboard.
- **Fly**: built-in metrics dashboard + `fly logs`.

## 3. Configuration files to add

### `api/fly.toml`
```toml
app = "curator-api"
primary_region = "bom"

[build]
  dockerfile = "Dockerfile"

[env]
  PORT = "8000"
  DJANGO_SETTINGS_MODULE = "config.settings"
  TRUST_PROXY = "true"

[http_service]
  internal_port = 8000
  force_https = true
  auto_stop_machines = true
  auto_start_machines = true
  min_machines_running = 1

[[vm]]
  size = "shared-cpu-1x"
  memory = "512mb"

[[statics]]
  guest_path = "/app/staticfiles"
  url_prefix = "/static/"

[[http_service.checks]]
  interval = "30s"
  timeout = "5s"
  grace_period = "10s"
  method = "GET"
  path = "/health/"
```

### `api/Dockerfile`
```Dockerfile
FROM python:3.13-slim AS base
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1 PIP_NO_CACHE_DIR=1
RUN apt-get update && apt-get install -y --no-install-recommends build-essential libpq-dev \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt gunicorn

COPY . .
RUN python manage.py collectstatic --noinput

EXPOSE 8000
CMD ["gunicorn", "config.wsgi:application", "--bind", "0.0.0.0:8000", \
     "--workers", "3", "--threads", "2", "--timeout", "30", \
     "--access-logfile", "-", "--error-logfile", "-"]
```

### `api/fly.worker.toml` + `api/fly.beat.toml`
Separate Fly apps, same Dockerfile, different `CMD` overrides:
- Worker: `celery -A config worker -l info --concurrency=2`
- Beat: `celery -A config beat -l info`

### `workers/image-proxy/` (Cloudflare Worker)
```
workers/image-proxy/
  wrangler.toml
  src/index.ts          — fetch handler, allowlist, resize, cache
  package.json
```

### `.github/workflows/ci.yml`
```yaml
name: CI
on: [push, pull_request]
jobs:
  backend:
    runs-on: ubuntu-latest
    services:
      postgres: { image: postgres:16, env: { POSTGRES_PASSWORD: postgres }, ports: ["5432:5432"] }
      redis: { image: redis:7, ports: ["6379:6379"] }
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with: { python-version: "3.13" }
      - run: pip install -r api/requirements.txt
      - run: cd api && python manage.py migrate --noinput
      - run: cd api && python manage.py test
      - run: cd api && pip-audit --strict
  mobile:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: "20" }
      - run: cd mobile && npm ci
      - run: cd mobile && npm run typecheck
      - run: cd mobile && npm run lint
      - run: cd mobile && npm audit --omit=dev --audit-level=high
```

### `.github/workflows/deploy-staging.yml` + `deploy-production.yml`
Staging auto-deploys on `main` push. Production deploys on `v*` tag.

## 4. Deploy flow

### Staging (auto on `main`)
```
git push origin main
  → GitHub Actions CI
  → CI green → flyctl deploy --app curator-api-staging --config api/fly.staging.toml
  → post-deploy smoke: curl https://api-staging.curator.app/health/
  → Slack/email on failure
```

### Production (tagged release)
```
git tag v1.0.0
git push origin v1.0.0
  → GitHub Actions deploy-production job
  → flyctl deploy --app curator-api
  → wait for health check green
  → run smoke suite (10 curl calls against public + authed endpoints)
  → mark Sentry release
  → expo eas submit for store builds (manual approval)
```

### Mobile
- `eas build --profile preview` on every main push (TestFlight + Play Internal).
- `eas build --profile production` on tagged release; OTA for JS-only changes via `eas update`.

## 5. Database migrations (zero-downtime rules)

1. **Adding a column:** must be nullable or have DB default. Two deploys for required columns:
   - Deploy A: add nullable column + backfill job.
   - Deploy B: flip to NOT NULL once backfill done.
2. **Removing a column:** three deploys:
   - A: stop writing to it (code change).
   - B: drop NOT NULL if present.
   - C: drop column (only after confident no references remain).
3. **Renaming:** never. Add new, backfill, read from both during transition, drop old.
4. **Dropping a table:** migration executes only after a code release that stopped referencing it.
5. **Data migrations:** only for one-off backfills. Keep them small; large backfills go into a management command executed once, tracked in Django's migration history for reproducibility.
6. **Before every deploy:** `python manage.py migrate --plan` on staging; review output in PR description.

## 6. Backups + disaster recovery

- **Postgres:** Neon PITR 7 days free. Tested monthly: `scripts/pitr_drill.sh` creates a branch at T-1h, runs smoke queries, deletes branch.
- **R2:** versioning on `curator-assets`. Editorial uploads survive accidental deletes for 30 days.
- **Config:** `fly secrets list` output exported weekly (names only, not values) to ops repo.
- **RTO:** 4 h (time to restore from Neon PITR + redeploy).
- **RPO:** 1 h (Neon WAL lag is sub-minute; we round up).

## 7. Monitoring & SLOs

### SLOs
| SLO | Target | Budget |
|---|---|---|
| Availability (`/api/mobile/v1/*` 2xx+4xx ratio excl. 429) | 99.5% / 30 days | 3h 36m downtime/month |
| p95 read latency | < 400 ms | — |
| p95 write latency | < 600 ms | — |
| 5xx rate | < 0.5% | — |
| Webhook delivery success (RevenueCat) | 100% of valid events processed | — |

### Dashboards
- **Fly metrics:** RAM, CPU, request count, response status — built-in.
- **Neon:** connection count, query duration p95, storage — built-in.
- **Sentry:** error rate, transactions (if enabling perf; free tier limits).
- **Synthetic:** UptimeRobot public status page — link in app footer.

### Alerts
| Alert | Channel | Action |
|---|---|---|
| Health check fails 2× in a row | UptimeRobot → email/SMS | Page oncall |
| Sentry new issue > 10 events / 5 min | Email | Investigate |
| 5xx rate > 1% over 5 min | Sentry alert | Page oncall |
| Fly machine OOM | Fly alerts → email | Scale memory or investigate leak |
| Neon storage > 80% | Neon email | Upgrade tier |
| RevenueCat webhook failures > 3 in 1h | Sentry (webhook handler logs) | Investigate secret/connectivity |

Oncall in v1 = the maintainer. Document escalation later.

## 8. Runbooks

### R1. Postgres unreachable
**Symptom:** `/health/` reports `database: fail`; 503 responses; Sentry error spike.
1. Check [Neon status](https://neonstatus.com/).
2. `fly logs -a curator-api | grep -i psycopg` — look for connection refusal vs timeout.
3. If Neon down → nothing to do; wait + update status page.
4. If Neon up but we can't connect → verify `DATABASE_URL` unchanged (`fly secrets list`), rotate if Neon pooler token changed.
5. If connection count exhausted → lower Gunicorn workers temporarily, scale Fly machine up after.

### R2. Redis unreachable
**Symptom:** `/health/` reports `redis: fail`; throttles 500 instead of 429; Celery stalls.
1. Upstash dashboard → check connection count and command rate.
2. If hit limit (free tier 10k/day) → upgrade or reduce throttle read frequency.
3. Fallback: setting `CACHES["default"]["BACKEND"]` to locmem is possible but loses throttle correctness across workers; avoid unless outage > 30 min.

### R3. Firebase Auth outage
**Symptom:** 401 surge; token verification fails.
1. Check [Firebase status](https://status.firebase.google.com/).
2. Users already signed in keep working if their token hasn't expired (1h). New sign-ins block.
3. No graceful fallback. Wait; post status.

### R4. RevenueCat webhook failing
**Symptom:** Sentry errors in `RevenueCatWebhookView`; users report "purchased but no premium".
1. `fly logs -a curator-api | grep revenuecat` — 401 means secret mismatch; 500 means handler bug.
2. Secret mismatch: verify `REVENUECAT_WEBHOOK_SECRET` matches RC dashboard value. Rotate if leaked.
3. Handler bug: RC retries failed webhooks for 3 days with exponential backoff — roll fix, events replay automatically.
4. Manual backfill: RC dashboard → replay events to a specific customer if needed.

### R5. Deploy broke production
**Symptom:** CI passed, prod is broken post-deploy.
1. `fly releases list -a curator-api` → find previous green release.
2. `fly releases rollback <version> -a curator-api`. Takes <2 min.
3. Create incident issue; do the actual fix on a branch.
4. If migrations were applied by the broken deploy and are unsafe to keep: write a forward migration that reverts the schema, deploy that.

### R6. Data breach / suspected token leak
1. Immediately rotate `FIREBASE_CREDENTIALS_JSON` in Firebase console + `fly secrets set`.
2. Admin SDK: `auth.revoke_refresh_tokens(uid)` for affected users.
3. Force sign-out everywhere: set a server flag (cache key `force-signout:{uid}` with TTL 24h); middleware returns 401 on presence; mobile catches and signs out.
4. Rotate every secret (`REVENUECAT_WEBHOOK_SECRET`, `SENTRY_DSN`, `SENDGRID_API_KEY`, `DATABASE_URL` if exposed).
5. Notify users within 72 h if PII was accessed (DPDP Act / India users).

### R7. Account deletion request (manual)
Automated path: user hits `(app)/account → Delete`. If that fails:
1. `python manage.py shell` on prod → `User.objects.get(email=...)`.
2. Verify identity out-of-band.
3. `user.delete()` — cascades handle everything except Sentry/external systems.
4. Purge Sentry events for user ID via API.
5. Delete Firebase user: `auth.delete_user(uid)`.
6. Confirm to user.

### R8. Takedown of a published article (copyright/legal)
1. `scripts/takedown.py <article_id>` → sets `is_active=false`, nulls `image_url`, invalidates CDN cache via Cloudflare API.
2. Verify via `GET /api/mobile/v1/articles/{id}` returns 404.
3. File record in `ops/takedowns/<date>-<reason>.md`.

## 9. Cost ceiling (v1)

| Service | Free tier | Expected v1 bill |
|---|---|---|
| Fly.io | 3 shared VMs, 3 GB volume | $0–5/mo (all idle-stopping hobby) |
| Neon | 1 project, 0.5 GB storage | $0 |
| Upstash | 10k cmds/day | $0 |
| Cloudflare | DNS + Workers 100k req/day | $0 |
| Firebase | Auth up to 50k MAU | $0 |
| RevenueCat | up to $10k MTR | $0 |
| Sentry | 5k errors/mo | $0 |
| Expo Push | unlimited | $0 |
| UptimeRobot | 50 monitors 5-min | $0 |
| Resend/SendGrid | 3k emails/mo | $0 |
| **Total** | | **≤ $5/mo** |

Cross thresholds, revisit this doc.

## 10. Scale triggers (when to upgrade)

| Trigger | Action |
|---|---|
| MAU > 5000 or DB > 450 MB | Neon → paid tier ($19/mo) for 10 GB + 14d PITR |
| p95 latency regressing | Add read replica on Neon |
| Image Worker > 80k/day | Add paid plan or move to Cloudflare Images |
| Sentry events > 4500/mo | Paid Team tier ($26/mo) |
| Push sent > 10M/mo | Consider FCM direct (Expo Push free forever but unverified SLAs at scale) |
| Fly idle-stop cold starts noticeable | Remove `auto_stop_machines`, budget ~$8/mo for always-on |

## 11. Rollback drill

Run monthly, first Monday, during working hours:
1. Deploy a feature-flagged release to production.
2. Trigger the flag to "broken" (e.g. return 500 for a known endpoint).
3. Rollback: `fly releases rollback`.
4. Measure: time from decision to green = rollback time. Target < 5 min.
5. File the metric in `ops/drills/<date>.md`.

## 12. What I still need from you

- [ ] Fly.io account + `flyctl auth login` on your laptop
- [ ] Neon account + project created; share the `DATABASE_URL` into Fly secrets
- [ ] Upstash account + Redis DB; `REDIS_URL` into Fly secrets
- [ ] Cloudflare account + domain `curator.app` (or whatever you pick) on their DNS
- [ ] Firebase project with service account JSON downloaded
- [ ] RevenueCat project with products + webhook secret
- [ ] Sentry org + two projects (django + mobile) with DSNs
- [ ] Expo access token
- [ ] Resend or SendGrid API key (Phase 8)
- [ ] Apple Developer + Google Play Console accounts (Phase 9)

See [PLAN.md §9](./PLAN.md#9-configs-required-from-you) for the complete env var list. Paste values into `api/.env` locally and into Fly secrets for prod.
