
const CACHE_VERSION = "frame-v1";
const CACHE_NAME = `frame-cache-${CACHE_VERSION}`;

const FILES_TO_CACHE = [
    "./",
    "./index.html"
];

// Install the new cache
self.addEventListener("install", (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(FILES_TO_CACHE);
        })
    );

    self.skipWaiting();
});

// Remove old caches
self.addEventListener("activate", (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames
                    .filter((name) =>
                        name.startsWith("frame-cache-") &&
                        name !== CACHE_NAME
                    )
                    .map((name) => caches.delete(name))
            );
        })
    );

    self.clients.claim();
});

// Serve cached files when offline
self.addEventListener("fetch", (event) => {
    if (event.request.method !== "GET") return;

    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            if (cachedResponse) {
                return cachedResponse;
            }

            return fetch(event.request).then((response) => {
                if (
                    response &&
                    response.status === 200 &&
                    response.type === "basic"
                ) {
                    const responseCopy = response.clone();

                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, responseCopy);
                    });
                }

                return response;
            });
        })
    );
});
