# Security Model

Controls that must be in place before we accept a single real user. Nothing here is optional.

## 0. Threat model summary

| Threat | Likelihood | Impact | Primary control |
|---|---|---|---|
| Privilege escalation to paid tier | High (was live as of audit) | Revenue loss | RevenueCat webhook as sole tier writer; client cannot PATCH tier |
| Token theft via MITM | Low (HTTPS everywhere) | Account takeover | TLS + HSTS + cert pinning on mobile |
| Token theft via device malware | Medium | Account takeover | Firebase tokens are 1h; refresh in-memory only; never in MMKV |
| Rate-limit evasion via anon IPs | Medium | Cost, DoS | Per-user + per-IP throttles + Cloudflare WAF |
| IDOR (accessing another user's collection) | High if unchecked | Data leak | Every queryset filters by `user=request.user` |
| SQL injection | Low | Catastrophic | Django ORM only; no raw SQL on user input |
| XSS in article content | Medium | Mobile doesn't render HTML; if added later, sanitize server-side | Keep content markdown-only; render via hardened RN markdown lib |
| CSRF | N/A for Bearer API | — | No cookies used for the mobile API |
| Dependency compromise | Medium | Variable | `pip-audit`, `npm audit`, Dependabot, pinned versions |
| Log data leak (PII/tokens) | Medium | Compliance | Log scrubber middleware, Sentry `send_default_pii=false` |
| Webhook spoofing (RevenueCat) | High without check | Free premium | Shared secret in header; reject on mismatch |
| Account deletion abuse | Medium | Data loss / harassment | `reauth_required` — recent (<5min) auth token required |
| Malicious mobile client | Always | Server must never trust client | All authorization server-side; idempotency to blunt replay |

## 1. Authentication

- **Firebase Auth** is the identity provider. Mobile sends `Authorization: Bearer <ID token>`.
- Backend verifies via `firebase-admin` SDK on **every request** (no caching of verification result beyond Firebase's own).
- Token max age: 1h. `getIdToken()` auto-refreshes. Backend checks `exp`, `aud`, `iss`.
- `claims.email_verified` — we do **not** require it for v1 but log unverified sign-ins. If abuse arises, flip the requirement.
- On sign-out: client calls `firebase.signOut()` + `POST /devices/{id}` DELETE to unregister push token. We do **not** call Firebase Admin `revokeRefreshTokens` on normal sign-out; only on account deletion.

## 2. Authorization

**Every user-owned queryset** goes through `request.user` at the query level:

```python
# Correct
UserCollection.objects.get(user=request.user, id=collection_id)

# WRONG — never fetch-then-check
collection = UserCollection.objects.get(id=collection_id)
if collection.user != request.user: ...
```

CI lints for this pattern: a simple `grep` for `.objects.get(id=` in views.py that isn't followed by `user=` should be zero hits. Add to pre-commit.

**Staff-only:** `qa-override` and admin endpoints check `request.user.is_staff`. No custom role system in v1; staff is the only elevated role.

## 3. Entitlements (critical — this was Phase 1's target)

**Rule:** the Django `UserEntitlement.tier` column is writable by exactly two code paths:
1. The RevenueCat webhook handler (`POST /api/webhooks/revenuecat`).
2. The staff-only QA override endpoint.

Nothing else. A mobile client cannot change its tier by any means.

**RevenueCat webhook verification:**
```python
def verify_revenuecat_signature(request):
    header = request.headers.get("Authorization", "")
    expected = f"Bearer {settings.REVENUECAT_WEBHOOK_SECRET}"
    if not hmac.compare_digest(header, expected):
        raise exceptions.AuthenticationFailed("bad signature")
```

Use `hmac.compare_digest` (constant-time). Secret in env, never in code.

**Event idempotency:** RC sends `event.id`. We upsert on it to dedupe retries.

**Source of truth for gating:** `effectiveTier` from the server. UI never gates off any local value.

## 4. Rate limiting

Two layers. Both required.

**Layer 1 — Cloudflare WAF** (edge):
- Bot fight mode on.
- Rule: >100 req/10s per IP to `/api/*` → challenge.
- Rule: >20 req/min per IP to `/api/mobile/auth/session` → block for 10 min.
- Enable "API Shield" if upgrading paid later.

**Layer 2 — DRF throttles** (app):

```python
# settings.py
REST_FRAMEWORK = {
    "DEFAULT_THROTTLE_CLASSES": ["users.throttling.ScopedUserThrottle"],
    "DEFAULT_THROTTLE_RATES": {
        "reads": "300/minute",
        "writes": "60/minute",
        "reading_events": "600/hour",
        "auth_session": "20/minute",
        "sensitive": "5/minute",
        "search": "30/minute",
        "feedback": "5/hour",
    },
}
```

`ScopedUserThrottle` uses `request.user.id` when authenticated, `ipware.get_client_ip(request)` otherwise. Storage backend: Redis (Upstash).

Each view declares its class:
```python
class ArticleListView(views.APIView):
    throttle_scope = "reads"
```

Write classes declared on POST/PATCH/DELETE.

## 5. Input validation

- **DRF serializers** are the only place bodies are parsed. Views never call `request.data[...]` directly.
- **Size limits** via `DATA_UPLOAD_MAX_MEMORY_SIZE = 128 * 1024` in settings.
- **Allowed fields:** serializers never use `fields = "__all__"`; explicit lists only.
- **String fields:** `max_length` on every CharField. No unbounded text fields except `content` (admin-only) and `feedback.message` (4000 char cap).
- **Enum fields:** `ChoiceField` with explicit choices.
- **UUIDs:** `UUIDField`; serializer rejects malformed.
- **URLs:** `URLField` (Django validates scheme + format). Store as `TextField(validators=[URLValidator()])` if we want length control.
- **HTML/Markdown:** article content is markdown in DB; mobile renders with `react-native-markdown-display` configured to **disable** HTML passthrough. No `<script>` ever reaches a WebView.

## 6. Secrets management

- `.env` is `.gitignore`d. CI checks for accidentally committed `.env` via pre-commit hook (`detect-secrets`).
- Production secrets live in **Fly secrets** (`fly secrets set ...`), not in a file.
- Firebase service account JSON is stored as a single env var (`FIREBASE_CREDENTIALS_JSON`), loaded via `json.loads`.
- No secret ever logged. `logging_scrubber` middleware replaces `Authorization`, `password`, `email`, `token` fields in request bodies before structured log emit.

## 7. TLS, HSTS, certificate pinning

- Cloudflare terminates TLS; Full (strict) mode to Fly (Fly provides cert for `*.fly.dev` and for `api.curator.app` via custom domain).
- `SECURE_HSTS_SECONDS = 31536000`, `SECURE_HSTS_INCLUDE_SUBDOMAINS = true`, `SECURE_HSTS_PRELOAD = true`. Submit to preload list after 90 days of uptime.
- `SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")` ONLY when `TRUST_PROXY=true` env var is set (i.e. in prod behind Cloudflare). Off locally.
- **Certificate pinning** on mobile (Phase 9): bundle Cloudflare's SHA-256 public key hash; reject connections whose leaf doesn't chain to it. Implementation: `react-native-ssl-pinning` on iOS + Android. Pin two keys (primary + backup) to allow rotation without a forced app update.

## 8. Image sourcing + copyright

User chose news-outlet photography. That is legally fraught. Rules:

- **Allowed sources (editorial):** only URLs on hosts in `ALLOWED_IMAGE_HOSTS` (Cloudflare Worker env). Initial list: outlets we have licensing agreements with OR wire services (Reuters/AP/Bloomberg) under a paid license OR Creative Commons.
- **Attribution:** every Article row has `image_attribution` (text) and `image_source_url`. Both must be non-empty before an article is marked `is_active=true` (DB check constraint).
- **Scraping og:image from random outlets is OUT.** Copyright liability, rate-limited hotlinking, and those outlets may revoke the image URL without notice.
- **The image proxy Worker** enforces the allowlist at request time: unknown host → 403, logged.
- **Takedown workflow:** `scripts/takedown.py <article_id>` sets `is_active=false`, clears `image_url`, purges CDN cache. Documented in [OPERATIONS.md](./OPERATIONS.md).

For v1 with limited licensing budget, the pragmatic path is:
1. Start with editorial-uploaded images to **R2** under our control (licensed stock, CC, or public domain).
2. `ALLOWED_IMAGE_HOSTS` = `["curator-assets.r2.cloudflarestorage.com", "images.unsplash.com"]`.
3. Add outlet hosts only when licensing is actually signed.

This is safer than the initial spec; document as a §Decision Change in [PLAN.md](./PLAN.md) if you take it.

## 9. PII, data retention, deletion

- PII collected: email, display name, Firebase UID, Expo push token, reading events (article IDs + timestamps + durations).
- **Not collected:** location beyond `regionCode` preference, contact list, device identifiers beyond what Firebase/Expo need.
- **Reading events** retained 2 years; daily beat job purges beyond that.
- **Account deletion** cascades; no soft-delete. Firebase user is also removed via Admin SDK. Expo push tokens deleted. Reading events deleted. Collections, saves, feedback deleted. Sentry events for the user are scrubbed via a delete job (Sentry lets you delete events per user id).
- **Data export** (GDPR / DPDP Act for India): `POST /privacy/export` returns JSON of all user rows + public metadata of saved articles. Emailed signed R2 URL, 24h TTL.

Document retention in a user-facing **Privacy Policy** linked from `(app)/privacy`. (Stub exists; fill in.)

## 10. Logging & observability security

- Structured JSON logs. Fields whitelisted, not blacklisted:
  `ts, level, msg, request_id, user_id, method, path, status, duration_ms, ua_family`.
- Bodies are **not** logged by default. On 4xx/5xx, the handler logs `validated_errors` (never raw body) + request ID.
- Sentry: `send_default_pii=False`; we set `user.id` only (UUID). Breadcrumbs strip Authorization header.
- Request ID propagated: Cloudflare `cf-ray` → Django middleware reuses or generates → response `X-Request-ID`.

## 11. Dependency supply chain

- **Backend:** `pip-tools` to pin, `pip-audit` in CI fails on High/Critical. Review Dependabot weekly.
- **Mobile:** `npm ci` in CI, `npm audit --omit=dev --audit-level=high` fails build. `patch-package` to freeze any transitive fixes.
- **Renovate bot** (or Dependabot) opens PRs monthly; require CI green + manual review.
- No `curl | sh` installs. No unverified postinstall scripts.
- SBOM: `pip-audit --format cyclonedx-json` + `@cyclonedx/cyclonedx-npm` artifacts published on each release.

## 12. App-store compliance

- **iOS ATT:** we don't track across apps; no IDFA collection. Info.plist has `NSUserTrackingUsageDescription` omitted by design.
- **App Privacy (App Store Connect):** declare email, user ID, product interaction, diagnostics. All "linked to user" = yes, "used for tracking" = no.
- **Play Data Safety:** same declarations mirrored.
- **Deletion:** "Delete my Account" must be reachable from first-party UI without navigating through a web page (Google Play policy, effective May 2024). Currently implemented in `(app)/account` — keep it there.

## 13. Incident response

Runbook in [OPERATIONS.md](./OPERATIONS.md#runbooks). Summary:
- **Suspected token compromise:** rotate `FIREBASE_CREDENTIALS_JSON`, revoke via Admin SDK, force sign-out via Firestore flag the app reads.
- **Webhook secret leak:** rotate `REVENUECAT_WEBHOOK_SECRET` in RC dashboard + Fly secrets; redeploy.
- **Database breach:** rotate `DATABASE_URL`, restore from latest Neon PITR, notify users within 72h if PII accessed (DPDP Act).

## 14. Security verification (pre-launch)

All must be green in [CHECKLIST.md §Phase 9](./CHECKLIST.md#phase-9--launch) before store submission.

- [ ] `EntitlementView.patch` removed from client API; only `/qa-override` remains, staff-gated
- [ ] RevenueCat webhook verifies `Authorization` secret constant-time
- [ ] All user-owned views filter by `request.user` (audit script clean)
- [ ] DRF throttles applied to every write view
- [ ] Logging scrubber middleware active; manual log inspection shows no `Bearer` tokens
- [ ] `pip-audit` and `npm audit` clean
- [ ] HSTS + HTTPS redirect verified on prod
- [ ] Cert pinning enabled in production EAS profile
- [ ] Account deletion requires `auth_time < 5min`
- [ ] `MOCK_BACKEND` impossible in production builds (build-time assertion)
- [ ] Privacy policy page published
- [ ] App store privacy declarations filed
