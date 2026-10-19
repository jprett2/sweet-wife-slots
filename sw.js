// Offline support for the phone edition. The deploy script stamps the build into the
// cache name, so each deploy starts a fresh cache and the old one is deleted.
const CACHE = 'sweet-wife-slots-20261018200605';

self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

const keep = (request, response) => {
  if (response.ok) {
    const copy = response.clone();
    caches.open(CACHE).then((cache) => cache.put(request, copy));
  }
  return response;
};

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET' || new URL(request.url).origin !== location.origin) return;
  if (request.mode === 'navigate') {
    // The page itself: newest when online, cached when not, so updates arrive on the next open.
    event.respondWith(
      fetch(request)
        .then((response) => keep(request, response))
        .catch(() => caches.match(request).then((hit) => hit || caches.match('./'))),
    );
    return;
  }
  // Everything else has a content hash in its name, so a cached copy is always right.
  event.respondWith(caches.match(request).then((hit) => hit || fetch(request).then((response) => keep(request, response))));
});
