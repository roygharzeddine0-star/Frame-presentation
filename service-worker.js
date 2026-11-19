const CACHE_NAME = "frame-studio-v7";

const CORE = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./icons/frame-192.png",
  "./icons/frame-512.png"
];

const hadPreviousVersion = Boolean(self.registration.active);

self.addEventListener("install", event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);

    await cache.addAll(CORE);

    // Only mark an update if an older service worker existed.
    if (hadPreviousVersion) {
      const markerURL = new URL(
        "__frame_update_pending__",
        self.registration.scope
      ).href;

      await cache.put(markerURL, new Response("updated"));
    }

    await self.skipWaiting();
  })());
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;

  event.respondWith(
    caches.match(event.request).then(cached =>
      cached || fetch(event.request).then(response => {
        const copy = response.clone();

        if (new URL(event.request.url).origin === self.location.origin) {
          caches.open(CACHE_NAME).then(cache =>
            cache.put(event.request, copy)
          );
        }

        return response;
      }).catch(() => caches.match("./index.html"))
    )
  );
});
