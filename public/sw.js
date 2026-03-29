importScripts('https://storage.googleapis.com/workbox-cdn/releases/7.0.0/workbox-sw.js');

const { registerRoute, NavigationRoute, Route } = workbox.routing;
const { NetworkFirst, StaleWhileRevalidate, CacheFirst } = workbox.strategies;
const { CacheableResponsePlugin } = workbox.cacheableResponse;
const { ExpirationPlugin } = workbox.expiration;
const { precacheAndRoute, cleanupOutdatedCaches, createHandlerBoundToURL } = workbox.precaching;

cleanupOutdatedCaches();

// ── Precache shell (injected by build or listed manually) ──────────────────
precacheAndRoute([
  { url: './', revision: '1' },
  { url: './index.html', revision: '1' },
  { url: './config.js', revision: null },
  { url: './manifest.json', revision: null },
  { url: './favicon.jpg', revision: '1' },
]);

// ── API: network-only, never cache ─────────────────────────────────────────
registerRoute(
  ({ url }) => url.pathname.includes('/shm/v1/'),
  new NetworkFirst({ networkTimeoutSeconds: 10 })
);

// ── JS / CSS assets: stale-while-revalidate ────────────────────────────────
registerRoute(
  ({ request }) => request.destination === 'script' || request.destination === 'style',
  new StaleWhileRevalidate({
    cacheName: 'assets-cache',
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({ maxEntries: 60, maxAgeSeconds: 30 * 24 * 60 * 60 }),
    ],
  })
);

// ── Images: cache-first, 30 days ───────────────────────────────────────────
registerRoute(
  ({ request }) => request.destination === 'image',
  new CacheFirst({
    cacheName: 'images-cache',
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({ maxEntries: 50, maxAgeSeconds: 30 * 24 * 60 * 60 }),
    ],
  })
);

// ── Fonts: cache-first, 1 year ─────────────────────────────────────────────
registerRoute(
  ({ request }) => request.destination === 'font',
  new CacheFirst({
    cacheName: 'fonts-cache',
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({ maxEntries: 20, maxAgeSeconds: 365 * 24 * 60 * 60 }),
    ],
  })
);

// ── SPA navigation: serve index.html for all routes ───────────────────────
registerRoute(
  new NavigationRoute(createHandlerBoundToURL('./index.html'), {
    denylist: [/\/shm\/v1\//],
  })
);

// ── Skip waiting & claim clients immediately on update ────────────────────
self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});
