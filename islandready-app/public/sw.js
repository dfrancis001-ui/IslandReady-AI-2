/* IslandReady AI service worker (Phase 9) — static shell only.
 * Caches: app shell pages (/offline), same-origin static assets (/_next/static).
 * NEVER caches: POST/PUT/DELETE, /api/auth/*, household API responses,
 * credentials, or any authenticated payload. Those rules are asserted by
 * tests/test_phase9_offline.py via static analysis of this file. Bump CACHE
 * when shipping shell changes so clients pick up the new shell. */
const CACHE = "islandready-shell-v1";
const SHELL = ["/offline", "/login", "/manifest.webmanifest"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(SHELL)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

function isCacheable(request) {
  if (request.method !== "GET") return false;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return false;
  if (url.pathname.startsWith("/api/")) return false; // never cache API responses
  return true;
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.mode === "navigate") {
    // App shell offline: try network, fall back to cached shell/offline page.
    event.respondWith(
      fetch(request).catch(() =>
        caches.match(request).then((hit) => hit || caches.match("/offline"))
      )
    );
    return;
  }
  if (!isCacheable(request)) return; // let through, never store
  event.respondWith(
    caches.match(request).then(
      (hit) =>
        hit ||
        fetch(request).then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((cache) => cache.put(request, copy));
          return res;
        })
    )
  );
});
