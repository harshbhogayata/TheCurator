# Curator API Contract

Authoritative spec. Every endpoint the mobile app calls is here. If it's not here, it doesn't exist.

**Base URL (prod):** `https://api.curator.app`
**Base URL (dev):** `http://127.0.0.1:8000`

## 0. Conventions

### Authentication
All `/api/mobile/*` endpoints require `Authorization: Bearer <firebase-id-token>` unless marked **PUBLIC**. Token is verified on every request; no server-side session state. Invalid/expired → **401** with `{"detail": "..."}`.

### Request format
- All bodies are JSON. `Content-Type: application/json` required on writes.
- `Accept: application/json` required on reads (enforced).
- Request size limit: **128 KB**. Feedback is **8 KB**. Data export and any multipart uploads are rejected — v1 is JSON-only.
- Timestamps ISO-8601 UTC with `Z` suffix: `2026-04-24T09:30:00Z`.
- IDs are v4 UUIDs as strings.
- Field names on the wire: **camelCase** exclusively. Backend serializers map snake_case models to camelCase.

### Response envelope
- Lists: `{ "items": [...], "nextCursor": "opaque-string-or-null" }`.
- Single resources: flat object.
- Mutations that change user-scoped collections return the **full new collection** (e.g. saves list, collection detail) so the client doesn't have to re-fetch.
- Errors: `{ "detail": "human-readable", "code": "machine-readable-slug", "fields": { "fieldName": ["error"] } }`. `fields` only on 400 validation errors.

### Standard headers
Request:
- `Authorization: Bearer <token>` (required for non-public)
- `Idempotency-Key: <uuid>` (required on POST, optional on DELETE/PATCH writes; see §0.5)
- `If-None-Match: "<etag>"` (optional on GET for conditional requests)
- `X-App-Version: 1.2.3` (optional; logged)
- `X-Platform: ios|android` (optional; logged)

Response:
- `ETag: "<hash>"` on cacheable GETs
- `Cache-Control: private, max-age=60, stale-while-revalidate=300` on content reads; `no-store` on writes
- `X-Request-ID: <uuid>` always (Cloudflare `cf-ray` or server-generated)
- `X-RateLimit-Remaining`, `X-RateLimit-Reset` on rate-limited endpoints

### Pagination
Cursor-based on all list endpoints. `?cursor=<opaque>&limit=<1-50>` (default 20). Response:
```json
{ "items": [...], "nextCursor": "eyJwdWIiOiIyMDI2LTAzLTIzIiwiaWQiOiJ1dWlkIn0=" }
```
`nextCursor: null` when no more pages. Cursors encode `(published_at, id)` tuple base64. Server ignores unknown cursor → **400** `code=invalid_cursor`.

### Idempotency
Any write accepting `Idempotency-Key`:
- First request with `(user_id, key)` runs normally; response is cached in `IdempotencyKey` table for 24h.
- Retry with same `(user_id, key, request_fingerprint)` returns cached response verbatim.
- Retry with same key but **different** body → **409** `code=idempotency_conflict`.

### Rate limits (per user)
| Class | Limit | Applies to |
|---|---|---|
| `reads` | 300 / min | All GET |
| `writes` | 60 / min | All POST/PATCH/DELETE on user-owned resources |
| `reading_events` | 600 / hour | `POST /reading/events` |
| `auth_session` | 20 / min | `POST /auth/session` |
| `sensitive` | 5 / min | `DELETE /account`, `POST /privacy/export` |
| `search` | 30 / min | `GET /articles?q=...` |
| `feedback` | 5 / hour | `POST /feedback` |

Exceeded → **429** `code=rate_limited`; `Retry-After` header seconds.

### Error codes (machine-readable)
`authentication_required`, `authentication_invalid`, `permission_denied`, `not_found`, `validation_error`, `rate_limited`, `idempotency_conflict`, `invalid_cursor`, `entitlement_required`, `server_error`, `service_unavailable`.

---

## 1. Auth & session

### `POST /api/mobile/auth/session`
Exchange Firebase ID token for the app's full session (user, preferences, onboarding state, identities). Creates the Django `User` row if first time. Rate-limited `auth_session`.

**Request:** empty body; Firebase token in header.

**200 Response:**
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "displayName": "Harsh",
    "avatarUrl": null,
    "memberSince": "2026-01-12T00:00:00Z"
  },
  "onboarding": {
    "currentStep": "complete",
    "isCompleted": true,
    "completedAt": "2026-01-12T00:05:00Z",
    "selectedCategories": ["world", "technology"]
  },
  "preferences": { "... see GET /preferences" },
  "identities": [
    { "provider": "email", "providerEmail": "user@example.com", "providerUid": null }
  ]
}
```

**Errors:** `401 authentication_invalid` on bad token.

---

## 2. Account

### `GET /api/mobile/account` → same payload as `/auth/session`
### `PATCH /api/mobile/account`
**Request:**
```json
{ "displayName": "New name" }
```
`displayName`: 1–80 chars, trimmed. Only field patchable in v1.

**200:** full session payload.
**400 validation_error:** `{ "fields": { "displayName": ["This field is required."] } }`.

### `DELETE /api/mobile/account`
Deletes user, cascades to all owned rows, enqueues R2 media purge, revokes Firebase user. Rate-limited `sensitive`. Requires recent auth — Firebase token must have been issued within 5 minutes (`claims.auth_time > now - 300`). If stale → **403** `code=reauth_required`.

**204** on success.

### `GET /api/mobile/account/identities`
List linked auth providers.
**200:** `[{ "provider": "email" | "google" | "apple", "providerEmail": "...", "providerUid": "..." }]`

### `POST /api/mobile/account/identities/sync`
Re-reads Firebase user and updates identities. Rate-limited `writes`.
**200:** full session payload.

---

## 3. Content — articles

### `GET /api/mobile/v1/articles`
Cursor-paginated. Cacheable. ETag on response.

**Query params:**
| Param | Type | Notes |
|---|---|---|
| `cursor` | string | opaque |
| `limit` | int | 1–50, default 20 |
| `category` | string slug | exact match |
| `q` | string | full-text (min 2 chars); uses `sensitive` + `search` rate class |
| `savedOnly` | bool | intersect with `UserSavedArticle` for current user |

**200:**
```json
{
  "items": [
    {
      "id": "uuid",
      "slug": "volatility-emerging-markets",
      "title": "...",
      "excerpt": "...",
      "category": "economy",
      "readTime": "6 min read",
      "readTimeMinutes": 6,
      "publishedDate": "March 23, 2026",
      "publishedAt": "2026-03-23T00:00:00Z",
      "author": "The Curator Editorial Team",
      "sources": ["NY","FT","..."],
      "imageUrl": "https://cdn.curator.app/img?u=https%3A%2F%2F...&w=1200",
      "imageSourceUrl": "https://www.reuters.com/article/...",
      "imageAttribution": "Reuters",
      "audioUrl": "https://...",
      "audioDurationSec": 372
    }
  ],
  "nextCursor": "..."
}
```

`content` is **not** in the list payload — only in detail. Saves bandwidth.

### `GET /api/mobile/v1/articles/{id}`
Returns the list item shape **plus** `content` (markdown), `relatedArticleIds` (3 UUIDs). Cacheable, ETag.

**404** if article doesn't exist or `is_active=false`.

### `GET /api/mobile/v1/articles/{id}/audio` (PREMIUM)
Returns a signed audio URL valid 1h.
**200:** `{ "audioUrl": "https://...?sig=...&exp=...", "durationSec": 372 }`
**403 entitlement_required** if user's effective tier lacks `audio`.

---

## 4. Content — briefs

### `GET /api/mobile/v1/briefs`
Paginated, same cursor convention. Briefs don't support search in v1.

**200 item shape:**
```json
{
  "id": "uuid",
  "title": "...",
  "summary": "...",
  "duration": "12 min",
  "durationMinutes": 12,
  "durationMs": 720000,
  "publishedDate": "March 23, 2026",
  "publishedAt": "2026-03-23T00:00:00Z",
  "category": "Daily Brief",
  "imageUrl": "https://cdn.curator.app/img?u=...&w=1200",
  "imageAttribution": "Reuters",
  "audioUrl": "https://...",
  "insights": 8,
  "isBreaking": false
}
```

---

## 5. Categories

### `GET /api/mobile/v1/categories` **PUBLIC-ish** (still requires auth to simplify caching policy; returns same payload for everyone)
**200:**
```json
{
  "items": [
    { "slug": "economy", "name": "Economy", "color": "#...", "icon": "trending-up", "rank": 0 }
  ]
}
```
Cache: `public, max-age=3600, stale-while-revalidate=86400`. No `nextCursor` (finite).

---

## 6. Saves

### `GET /api/mobile/v1/saves`
**200:** `{ "articleIds": ["uuid", ...] }`
Ordered newest-save first. Not paginated (cap at 5000; if user exceeds, oldest drop).

### `POST /api/mobile/v1/saves`
**Request:** `{ "articleId": "uuid" }`
Idempotent: saving twice is a no-op.
**200:** `{ "articleIds": [...] }` (full list after save).
**403 entitlement_required** if free-tier user exceeds `maxSaves` (25).

### `DELETE /api/mobile/v1/saves/{articleId}`
**200:** full list after removal.

### `DELETE /api/mobile/v1/saves`
Clear all. Rate-limited `sensitive`.
**200:** `{ "articleIds": [] }`.

---

## 7. Collections

### `GET /api/mobile/v1/collections`
**200:**
```json
{
  "items": [
    {
      "id": "uuid",
      "name": "Weekend reads",
      "description": "",
      "color": "#6366f1",
      "icon": "folder",
      "articleIds": ["uuid", ...],
      "createdAt": "2026-03-01T...",
      "updatedAt": "2026-03-15T..."
    }
  ]
}
```
Not paginated (collections are rare; cap at 100 per user → free tier 3, basic 10, premium unlimited via Phase 4 check).

### `POST /api/mobile/v1/collections`
**Request:**
```json
{ "name": "Weekend reads", "description": "", "color": "#6366f1", "icon": "folder" }
```
Validation: `name` 1–80 chars; `color` `#RRGGBB`; `icon` from allowed icon set (see lib/icons.ts).
**201:** new collection shape.
**403 entitlement_required** if collection count would exceed `maxCollections`.

### `PATCH /api/mobile/v1/collections/{id}`
Partial update. Same fields as POST.

### `DELETE /api/mobile/v1/collections/{id}`
Cascade deletes items.
**204.**

### `POST /api/mobile/v1/collections/{id}/articles`
**Request:** `{ "articleId": "uuid" }`
**200:** full collection (with updated `articleIds`).
Idempotent.

### `DELETE /api/mobile/v1/collections/{id}/articles/{articleId}`
**200:** full collection.

---

## 8. Reading

### `GET /api/mobile/v1/reading/stats`
**200:**
```json
{
  "totalArticlesRead": 42,
  "totalReadTimeMs": 3600000,
  "totalSaved": 12,
  "currentStreak": 5,
  "longestStreak": 14,
  "dailyHistory": [
    { "date": "2026-04-24", "articlesRead": 2, "readTimeMs": 900000 }
  ],
  "recentArticleIds": ["uuid", ...]
}
```
`dailyHistory` capped at 365 days. `recentArticleIds` capped at 8.

### `POST /api/mobile/v1/reading/events`
**Request:**
```json
{ "articleId": "uuid", "readTimeMs": 120000 }
```
Validation: `readTimeMs` 500–7200000 (0.5s–2h). Values outside → clamp to range, log a warning, do not reject (client clocks are unreliable).
**200:** full `reading/stats` shape (reconciliation).
Idempotent by `(user, articleId, hour-bucket)`: duplicate writes within the same hour for the same article merge into the existing event (sum `read_time_ms`). This prevents double-counting on retry.

---

## 9. Preferences

### `GET /api/mobile/v1/preferences`
**200:**
```json
{
  "themePreference": "system",
  "fontSize": "medium",
  "lineHeight": "comfortable",
  "autoSaveEnabled": false,
  "hapticsEnabled": true,
  "reduceMotion": false,
  "languageCode": "en",
  "regionCode": "IN",
  "pushDailyBrief": true,
  "pushBreaking": true,
  "pushWeeklyDigest": false,
  "quietHoursStart": "22:00",
  "quietHoursEnd": "07:00"
}
```

### `PATCH /api/mobile/v1/preferences`
Partial. Same shape. Values validated against enums.
**200:** full preferences.

---

## 10. Entitlements

### `GET /api/mobile/v1/entitlements`
**200:**
```json
{
  "tier": "free",
  "effectiveTier": "premium",
  "productId": "curator_premium_monthly",
  "expiresAt": "2026-05-24T00:00:00Z",
  "willRenew": true,
  "qaOverrideEnabled": true,
  "qaOverrideTier": "premium"
}
```
`effectiveTier` is what the UI should gate on. Includes `qa_override` resolution.

### `PATCH /api/mobile/v1/entitlements/qa-override` **STAFF ONLY**
**Request:** `{ "enabled": true, "tier": "premium" }`
**403 permission_denied** if `!request.user.is_staff`.
**200:** entitlement shape.

### ~~`PATCH /api/mobile/v1/entitlements`~~ **REMOVED**
The client cannot set its own tier. This was the Phase 1 security fix.

### `POST /api/webhooks/revenuecat` **SERVER-TO-SERVER, no Firebase auth**
Called by RevenueCat. Verifies `Authorization: Bearer <REVENUECAT_WEBHOOK_SECRET>` in header (RC sets `Authorization`, not HMAC; see their docs).

**Body:** RC event object. We handle: `INITIAL_PURCHASE`, `RENEWAL`, `CANCELLATION`, `EXPIRATION`, `PRODUCT_CHANGE`, `BILLING_ISSUE`, `NON_RENEWING_PURCHASE`, `TRANSFER`, `UNCANCELLATION`.

**Action:** upsert `UserEntitlement` by `revenuecat_customer_id` (= Firebase UID configured in RC).
**200** always on valid signature; **401** on bad signature. We log every event with a request ID but never echo PII.

---

## 11. Devices (push registration)

### `POST /api/mobile/v1/devices`
**Request:**
```json
{ "expoPushToken": "ExponentPushToken[...]", "platform": "ios", "appVersion": "1.2.3" }
```
Upsert on `(user, expoPushToken)`. Updates `lastSeen`.
**200:** `{ "deviceId": "uuid", "expoPushToken": "...", "platform": "ios", "lastSeen": "..." }`

### `DELETE /api/mobile/v1/devices/{deviceId}`
**204.** Call on sign-out.

---

## 12. Feedback

### `POST /api/mobile/v1/feedback`
**Request:**
```json
{
  "category": "bug" | "idea" | "other",
  "message": "string, 10–4000 chars",
  "appVersion": "1.2.3",
  "osVersion": "iOS 18.1",
  "attachDiagnostics": true
}
```
If `attachDiagnostics=true`, backend captures user-id + last 20 request IDs from logs tied to the user (no body content). Rate-limited `feedback`.
**201:** `{ "id": "uuid", "createdAt": "..." }`.

---

## 13. Privacy

### `POST /api/mobile/v1/privacy/export`
Enqueue a user data export. Rate-limited `sensitive`.
Idempotent by day: second call within 24h returns the in-flight or completed request.
**202:** `{ "id": "uuid", "status": "pending", "createdAt": "..." }`.
Celery job generates JSON, uploads to R2, emails a signed URL valid 24h.

### `GET /api/mobile/v1/privacy/exports`
**200:** list of past export requests with status and `downloadUrl` (null if expired or pending).

---

## 14. Health

### `GET /health/` **PUBLIC**
**200:** `{ "status": "ok", "version": "1.2.3", "database": "ok", "redis": "ok" }`
**503** with the failing component if any dependency is down.

---

## 15. Deprecated / removed

| Endpoint | Reason |
|---|---|
| `PATCH /api/mobile/v1/entitlements` (client tier set) | Privilege escalation; replaced by RevenueCat webhook |
| `image_query` field on Article | Replaced by `imageUrl` + proxy |

---

## 16. Error taxonomy (full list)

| HTTP | `code` | When |
|---|---|---|
| 400 | `validation_error` | Body shape wrong |
| 400 | `invalid_cursor` | Cursor unparseable or expired |
| 401 | `authentication_required` | No token |
| 401 | `authentication_invalid` | Token bad/expired |
| 403 | `permission_denied` | Not owner / not staff |
| 403 | `entitlement_required` | Tier-locked feature; response `{ "requiredTier": "basic" }` |
| 403 | `reauth_required` | Sensitive op, token too old |
| 404 | `not_found` | Resource missing or not owned |
| 409 | `idempotency_conflict` | Same key, different body |
| 429 | `rate_limited` | Over throttle; `Retry-After` header |
| 500 | `server_error` | Unexpected; logged to Sentry with request ID |
| 503 | `service_unavailable` | DB/Redis/downstream down |

Client handles each: show toast with `detail`, include `X-Request-ID` in support reports.
