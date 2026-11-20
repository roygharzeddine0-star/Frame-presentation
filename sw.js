
const CACHE_NAME = "frame-cache-v1";
const CACHE_PREFIX = "frame-cache-";

const OFFLINE_FILES = [
    "./",
    "./index.html"
];

// Install the new service worker and prepare the offline cache.
self.addEventListener("install", (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(OFFLINE_FILES);
        })
    );
});

// Activate only when the user chooses UPDATE NOW.
self.addEventListener("message", (event) => {
    const message = event.data;

    // Accept both message formats.
    if (
        message === "SKIP_WAITING" ||
        message?.type === "SKIP_WAITING"
    ) {
        self.skipWaiting();
    }
});

// Activate the new version.
self.addEventListener("activate", (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (
                        cacheName.startsWith(CACHE_PREFIX) &&
                        cacheName !== CACHE_NAME
                    ) {
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => {
            return self.clients.claim();
        })
    );
});

// Handle requests and offline support.
self.addEventListener("fetch", (event) => {
    const request = event.request;

    if (request.method !== "GET") {
        return;
    }

    // Navigation: try the network first.
    if (request.mode === "navigate") {
        event.respondWith(
            fetch(request)
                .then((response) => {
                    const copy = response.clone();

                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(request, copy);
                    });

                    return response;
                })
                .catch(async () => {
                    return (
                        await caches.match(request)
                    ) || (
                        await caches.match("./index.html")
                    );
                })
        );

        return;
    }

    // Other files: use cache first.
    event.respondWith(
        caches.match(request).then((cachedResponse) => {
            if (cachedResponse) {
                return cachedResponse;
            }

            return fetch(request).then((response) => {
                if (
                    response &&
                    response.status === 200 &&
                    response.type === "basic"
                ) {
                    const copy = response.clone();

                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(request, copy);
                    });
                }

                return response;
            });
        })
    );
});
            
