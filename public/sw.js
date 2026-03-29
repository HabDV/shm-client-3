const CACHE_NAME = 'shm-client-v1';

const STATIC_ASSETS = [
  './',
  './index.html',
  './config.js',
  './manifest.json',
  './favicon.jpg',
];

// Install: cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

// Activate: remove old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch strategy:
// - /shm/v1/* → network-first (API calls, never cache)
// - everything else → network-first with cache fallback
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Skip non-GET and API requests — always go to network
  if (event.request.method !== 'GET' || url.pathname.includes('/shm/v1/')) {
    return;
  }

  // Skip chrome-extension and non-http
  if (!url.protocol.startsWith('http')) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Cache successful responses for static assets
        if (response.ok && response.type === 'basic') {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() => {
        // Offline fallback: serve from cache
        return caches.match(event.request).then((cached) => {
          if (cached) return cached;
          // For navigation requests, return index.html
          if (event.request.mode === 'navigate') {
            return caches.match('./index.html');
          }
          return new Response('Offline', { status: 503 });
        });
      })
  );
});
