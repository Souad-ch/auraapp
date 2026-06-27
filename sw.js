/* AURA — service worker (offline support) */
const CACHE = "aura-v8";
const ASSETS = [
  "./",
  "./index.html",
  "./styles.css",
  "./config.js",
  "./i18n.js",
  "./app.js",
  "./manifest.json",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/og.png"
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// config.js and HTML must always be fresh (network-first) so config/content
// changes show up immediately; static assets stay cache-first for speed/offline.
function networkFirst(req) {
  return fetch(req).then((res) => {
    const copy = res.clone();
    caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
    return res;
  }).catch(() => caches.match(req));
}
function cacheFirst(req) {
  return caches.match(req).then((cached) =>
    cached || fetch(req).then((res) => {
      const copy = res.clone();
      caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
      return res;
    }).catch(() => cached)
  );
}

self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;
  const url = new URL(e.request.url);
  const fresh = e.request.mode === "navigate" ||
    url.pathname.endsWith("config.js") || url.pathname.endsWith(".html");
  e.respondWith(fresh ? networkFirst(e.request) : cacheFirst(e.request));
});
