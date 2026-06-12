# Mobile Architecture

How the Expo app stays fast, offline-tolerant, and honest about server truth.

## 1. Layers (top → bottom)

```
┌────────────────────────────────────────────────────────┐
│ Screens (app/**)                                        │
│   - Read state via hooks/providers only                 │
│   - Never fetch directly                                │
├────────────────────────────────────────────────────────┤
│ Providers (src/providers/**)                            │
│   - Cross-screen state (auth, subscription, theme)      │
│   - Wrap React Query for mutation convenience           │
├────────────────────────────────────────────────────────┤
│ Hooks (src/hooks/**)                                    │
│   - useQuery / useMutation wrappers per resource        │
│   - Own the query keys (src/lib/query-keys.ts)          │
├────────────────────────────────────────────────────────┤
│ Services (src/services/**)                              │
│   - Pure async functions returning typed payloads       │
│   - api-client.ts handles token, base URL, errors       │
│   - mobile-api.ts one function per endpoint             │
├────────────────────────────────────────────────────────┤
│ Infra (src/lib/**, src/storage/**)                      │
│   - MMKV, NetInfo, query-persister, offline queue       │
└────────────────────────────────────────────────────────┘
```

**Rule:** screens → providers/hooks → services. A screen importing `fetch` is a bug.

## 2. React Query configuration

Defined in `src/providers/app-providers.tsx`:

```ts
new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,          // 5 min
      gcTime: 24 * 60 * 60 * 1000,       // 24 h in-cache after unmount
      retry: (failureCount, error) => {
        if (error instanceof ApiError && [400, 401, 403, 404].includes(error.status)) return false;
        return failureCount < 2;
      },
      retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 10_000),
      refetchOnWindowFocus: false,       // RN: "window focus" means app foreground
      refetchOnReconnect: "always",      // always refetch when back online
    },
    mutations: {
      retry: (failureCount, error) => {
        if (error instanceof ApiError && [400, 401, 403, 404, 409].includes(error.status)) return false;
        return failureCount < 3;
      },
      retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 15_000),
    },
  },
});
```

Per-query tuning where defaults don't fit:
| Query | staleTime | gcTime | Notes |
|---|---|---|---|
| `articles:list` | 5 min | 24 h | Core content; stale-while-revalidate |
| `article:{id}` | 15 min | 7 days | Rarely changes |
| `briefs:list` | 10 min | 24 h | Refresh on pull-to-refresh |
| `categories` | 1 h | 7 days | Near-static |
| `saves` | 0 (always revalidate) | 24 h | User-owned; network truth wins |
| `collections` | 0 | 24 h | Same |
| `reading:stats` | 30 s | 1 h | Changes on every read event |
| `entitlements` | 10 min | 10 min | Invalidated on app foreground + RevenueCat events |
| `preferences` | 0 | 7 days | Server truth |
| `session` | 0 | immediately on sign-out | |

## 3. Persistent cache (MMKV)

`react-native-mmkv` + `@tanstack/query-async-storage-persister` adapted with a sync MMKV wrapper.

```
src/storage/mmkv.ts            — single MMKV instance, id="curator-cache"
src/storage/query-persister.ts — createSyncStoragePersister over MMKV
```

In `app-providers.tsx`:
```ts
<PersistQueryClientProvider
  client={queryClient}
  persistOptions={{
    persister: queryPersister,
    maxAge: 24 * 60 * 60 * 1000,
    buster: APP_VERSION,                 // bump to wipe cache on breaking releases
    dehydrateOptions: {
      shouldDehydrateQuery: (q) => !q.queryKey.some(k => k === "audio"),  // don't persist signed URLs
    },
  }}
>
```

**Why not AsyncStorage?** MMKV is ~30× faster, synchronous, and doesn't block JS thread on large payloads.

**Partition per user:** when auth state changes, `queryClient.clear()` + `mmkv.clearAll()`. No cross-user leaks.

## 4. Offline mutation queue

`src/storage/offline-queue.ts`:

```
type QueuedMutation = {
  id: string                          // uuid for idempotency
  mutationKey: string                 // e.g. "saves.save"
  variables: unknown
  attempts: number
  nextRetryAt: number                 // epoch ms
  createdAt: number
}
```

Stored in MMKV under `offline-queue:v1`. Single writer process.

**Flow:**
1. `useMutation` hooks wrap `services/mobile-api` calls. On network error (`ApiError.status === 0` or `fetch` throws), push to queue, resolve with optimistic result.
2. `NetInfo` event handler drains queue when `isConnected && isInternetReachable`.
3. Each drain attempt re-invokes the service function with `Idempotency-Key: mutation.id`. On 2xx → remove; on 4xx (except 429) → log + drop with toast; on 5xx/network → exponential backoff up to 15 min.
4. On app foreground, drain runs immediately.

**Conflict resolution:** server response is authoritative. For list-shape replies (saves, collection), the returned list replaces the optimistic cache via `queryClient.setQueryData`.

**Writes that can be queued:** saves (add/remove/clear), collections (all CRUD + items), reading events, preferences patch, device register, feedback.
**Writes that cannot:** auth/session, account delete, privacy export, purchase. These require a live connection.

## 5. Optimistic UI pattern

Every queueable mutation uses this exact shape. Example for save:

```ts
export function useSaveArticle() {
  const qc = useQueryClient();
  return useMutation({
    mutationKey: ["saves", "save"],
    mutationFn: (articleId: string) =>
      saveArticleById(articleId, { idempotencyKey: nanoid() }),
    onMutate: async (articleId) => {
      await qc.cancelQueries({ queryKey: queryKeys.saves.all });
      const previous = qc.getQueryData<string[]>(queryKeys.saves.all);
      qc.setQueryData<string[]>(queryKeys.saves.all, (old = []) =>
        old.includes(articleId) ? old : [articleId, ...old],
      );
      return { previous };
    },
    onError: (_err, _articleId, context) => {
      if (context?.previous) qc.setQueryData(queryKeys.saves.all, context.previous);
    },
    onSuccess: (serverList) => {
      qc.setQueryData(queryKeys.saves.all, serverList);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: queryKeys.savesDependentStats }),
  });
}
```

Providers (saved-articles-provider, collections-provider) are refactored to consume these hooks. The provider's job becomes:
- Exposing a typed API (`saveArticle`, `unsaveArticle`, ...).
- Subscribing to cache (`useQuery`) for reads.
- Forwarding calls to mutation hooks.

**No more setState+fetch.then patterns.** Delete the custom optimistic rollback code inside providers.

## 6. Query keys (single source)

`src/lib/query-keys.ts` is the **only** place keys are constructed. Hierarchical for targeted invalidation:

```ts
export const queryKeys = {
  session: ["session"] as const,
  articles: {
    all: ["articles"] as const,
    list: (filters?: Record<string, unknown>) => ["articles", "list", filters ?? {}] as const,
    detail: (id: string) => ["articles", "detail", id] as const,
  },
  briefs: {
    all: ["briefs"] as const,
    list: () => ["briefs", "list"] as const,
  },
  categories: ["categories"] as const,
  saves: { all: ["saves"] } as const,
  collections: {
    all: ["collections"] as const,
    detail: (id: string) => ["collections", "detail", id] as const,
  },
  reading: {
    stats: ["reading", "stats"] as const,
  },
  preferences: ["preferences"] as const,
  entitlements: ["entitlements"] as const,
  // helper for invalidation
  savesDependentStats: ["reading", "stats"] as const,
} as const;
```

## 7. Image pipeline

```
Article.imageUrl (server-produced)
  = https://cdn.curator.app/img?u=<encoded outlet URL>&w=1200&q=75
       │
       ▼
Cloudflare Worker (Phase 6)
  - validates u.host ∈ ALLOWED_IMAGE_HOSTS
  - fetches upstream
  - resizes with Cloudflare Images / wasm-vips
  - re-encodes to WEBP/AVIF
  - responds with Cache-Control: public, max-age=31536000, immutable
  - edge-cached across requests
       │
       ▼
Mobile <Image />  (expo-image)
  - on-device disk cache (LRU 256 MB)
  - contentFit, priority, cachePolicy="memory-disk"
```

Mobile never constructs CDN URLs manually. The server decides what image goes with an article, including query params. The mobile only appends `&w=<pixelWidth>` when it knows its layout size (`useImageSize` helper).

## 8. Prefetch strategy

- **On feed render:** for the first 5 items, prefetch `article:{id}` 1 second after list becomes visible (`InteractionManager.runAfterInteractions` + `setTimeout`).
- **On feed idle (no scroll for 2s):** prefetch next page of `articles:list`.
- **On app foreground:** invalidate `entitlements`, `saves`, `reading.stats` (quick source-of-truth refresh).
- **On sign-in:** fire `session` + `preferences` + `categories` in parallel; gate nav on `session`.

Implemented via a `useIdlePrefetch` hook wired in `(tabs)/_layout.tsx`.

## 9. Background refresh (expo-background-fetch)

Registered at `src/background/tasks.ts`:

```ts
TaskManager.defineTask("curator.background-refresh", async () => {
  try {
    await Promise.all([
      queryClient.prefetchQuery({ queryKey: queryKeys.briefs.list(), queryFn: fetchBriefs }),
      queryClient.prefetchQuery({ queryKey: queryKeys.saves.all, queryFn: listSavedArticleIds }),
    ]);
    return BackgroundFetch.BackgroundFetchResult.NewData;
  } catch {
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});
```

Interval: **6 h minimum** (iOS honors at its discretion). Guarded behind user preference `backgroundRefreshEnabled` (default true).

## 10. Error boundaries + toast

- Top-level `ErrorBoundary` in `app/_layout.tsx` catches render errors, logs to Sentry, shows a minimal retry screen.
- Per-screen: `useQuery().error` → if `isError`, render the `<ErrorState reason={error} onRetry={...} />` component. Never blank.
- Mutations: on final failure (after retries), `toast.error(error.detail)`. Include request ID in a "Details" expander.

## 11. Auth lifecycle

```
app boot
  │
  ├─ Firebase SDK restores user (native persistence)
  │
  ├─ onIdTokenChanged fires with user or null
  │    │
  │    ├─ if null → clear queries, clear MMKV "user-scoped" partition, navigate to auth stack
  │    │
  │    └─ if user
  │         ├─ POST /auth/session with fresh ID token
  │         ├─ applySession() writes to queryClient
  │         ├─ register device: POST /devices
  │         └─ navigate to (app)/(tabs)
  │
  └─ Firebase auto-refreshes ID token every ~55 min
       └─ api-client interceptor: on 401, force-refresh token, retry once
```

Token is fetched *per request* (`user.getIdToken()` is cached by Firebase for 1h). Never stored in MMKV.

## 12. Telemetry

- **Sentry** initialized before first render; wraps root with `Sentry.ErrorBoundary`.
- **Breadcrumbs:**
  - Every `ApiError` (status + url + requestId).
  - Every navigation (`expo-router` route change).
  - Every mutation start / success / failure.
- **User context:** `Sentry.setUser({ id: user.id })` on sign-in; cleared on sign-out. No email, no displayName.
- **Release tracking:** `expo-updates` runtimeVersion → Sentry release.

## 13. What's deleted in Phase 3

| File | Action |
|---|---|
| `src/providers/saved-articles-provider.tsx` | Rewrite: read from `useQuery(queryKeys.saves.all)`, expose mutations |
| `src/providers/collections-provider.tsx` | Same pattern |
| `src/providers/reading-stats-provider.tsx` | Same pattern; drop client-side streak math (server is authoritative) |
| `src/providers/subscription-provider.tsx` | Drop `setTier`; keep read-only surface over `useQuery(queryKeys.entitlements)` |
| `src/hooks/use-articles.ts`, `use-briefs.ts` | Remove `MOCK_BACKEND` branch; mock data only available in `__DEV__` explicit dev menu |
| All `AsyncStorage.*` calls in providers | Removed — MMKV + React Query persister replaces them |
| `dailyBriefs` default fallback in `(tabs)/index.tsx` | Replaced by `<EmptyState />` |

## 14. New files

```
src/storage/mmkv.ts
src/storage/query-persister.ts
src/storage/offline-queue.ts
src/hooks/mutations/use-save-article.ts
src/hooks/mutations/use-unsave-article.ts
src/hooks/mutations/use-clear-saves.ts
src/hooks/mutations/use-create-collection.ts
src/hooks/mutations/use-update-collection.ts
src/hooks/mutations/use-delete-collection.ts
src/hooks/mutations/use-add-to-collection.ts
src/hooks/mutations/use-remove-from-collection.ts
src/hooks/mutations/use-record-reading-event.ts
src/hooks/mutations/use-update-preferences.ts
src/hooks/mutations/use-register-device.ts
src/hooks/mutations/use-submit-feedback.ts
src/hooks/queries/use-entitlements.ts
src/hooks/queries/use-preferences.ts
src/hooks/queries/use-categories.ts
src/background/tasks.ts
src/lib/idempotency.ts                   — generate + attach Idempotency-Key
src/lib/errors.ts                        — ApiError + user-facing message map
src/ui/error-state.tsx
src/ui/empty-state.tsx
```

## 15. Build-time safety

`app.config.ts` asserts at build time:
```ts
if (!process.env.EXPO_PUBLIC_API_URL) throw new Error("EXPO_PUBLIC_API_URL required");
if (APP_ENV === "production" && process.env.EXPO_PUBLIC_MOCK_BACKEND === "true") {
  throw new Error("Refusing to ship production build with MOCK_BACKEND=true");
}
```

EAS build profiles:
- `development` — mock allowed, Sentry off, dev menu on
- `preview` (TestFlight / Play Internal) — mock forbidden, Sentry on, dev menu off
- `production` — same as preview plus runtime asserts

## 16. Performance budget

| Metric | Target | How we measure |
|---|---|---|
| TTI (cold start → feed visible) | < 2.5 s on iPhone 12 | React Native performance monitor + manual |
| Feed scroll | 60 FPS, no dropped frames | Flipper / RN perf monitor |
| Image render (above fold) | < 500 ms after tile visible | Expo Image onLoad timing |
| Mutation perceived latency | 0 ms (optimistic) | — |
| Cold offline → feed visible | < 1 s with cache | E2E measurement |

Any PR that regresses TTI > 10% is rejected at review.
