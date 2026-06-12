/* The Curator - service worker: push + offline reading for saved articles. */

const CACHE_VERSION = '20260610';
const ASSET_CACHE = `curator-assets-${CACHE_VERSION}`;
const ARTICLE_CACHE = `curator-articles-${CACHE_VERSION}`;
const ARTICLE_CACHE_LIMIT = 120;
const ASSET_CACHE_LIMIT = 80;

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  const keep = new Set([ASSET_CACHE, ARTICLE_CACHE]);
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => !keep.has(key)).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

async function trimCache(cacheName, maxEntries) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  if (keys.length > maxEntries) {
    await cache.delete(keys[0]);
    return trimCache(cacheName, maxEntries);
  }
}

/** Network-first with cache fallback. Keeps saved reads available without pinning stale builds. */
async function networkFirst(request, cacheName, limit) {
  const cache = await caches.open(cacheName);
  try {
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response.clone());
      if (limit) trimCache(cacheName, limit);
    }
    return response;
  } catch (error) {
    const cached = await cache.match(request);
    if (cached) return cached;
    throw error;
  }
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  const sameOrigin = url.origin === self.location.origin;

  // Build assets: prefer fresh files after deploy; use cache only as offline fallback.
  if (sameOrigin && url.pathname.startsWith('/assets/')) {
    event.respondWith(networkFirst(request, ASSET_CACHE, ASSET_CACHE_LIMIT));
    return;
  }

  // Article/brief API reads: network-first so saved stories work offline.
  if (/\/api\/(mobile|public)\/v1\/(articles|briefs|categories)/.test(url.pathname)) {
    event.respondWith(networkFirst(request, ARTICLE_CACHE, ARTICLE_CACHE_LIMIT));
    return;
  }

  // HTML navigations must not be cached. Stale SSR shells cause broken styling after deploys.
  if (sameOrigin && request.mode === 'navigate') {
    event.respondWith(fetch(request));
    return;
  }
});

self.addEventListener('push', (event) => {
  let payload = { title: 'The Curator', body: '', url: '/' };
  try {
    payload = { ...payload, ...event.data.json() };
  } catch {
    if (event.data) payload.body = event.data.text();
  }

  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      icon: '/favicon.svg',
      badge: '/favicon.svg',
      data: { url: payload.url },
    }),
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windows) => {
      for (const client of windows) {
        if ('focus' in client) {
          client.focus();
          if ('navigate' in client) client.navigate(url);
          return;
        }
      }
      return self.clients.openWindow(url);
    }),
  );
});
