/* AURA — self-retiring service worker.
   Earlier versions cached files, which kept serving stale pages on some
   devices. This version caches nothing: on activation it deletes every cache,
   unregisters itself, and reloads open tabs so the site always loads the
   latest version fresh from the network. */
self.addEventListener("install", () => self.skipWaiting());

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    try {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
      await self.registration.unregister();
      const clients = await self.clients.matchAll({ type: "window" });
      clients.forEach((c) => { try { c.navigate(c.url); } catch (e) {} });
    } catch (e) { /* ignore */ }
  })());
});
