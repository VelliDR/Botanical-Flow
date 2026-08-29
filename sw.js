const CACHE_NAME = 'botanical-flow-v2';
const ASSETS_TO_CACHE = [
    './',
    './index.html',
    './css/theme.css',
    './css/hud.css',
    './js/app.js',
    './js/accrual.js',
    './js/badges.js',
    './js/hardware.js',
    './js/storage.js',
    './js/store.js',
    './kiwi.png',
    './strawberry.png',
    './manifest.json'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(ASSETS_TO_CACHE);
        })
    );
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((name) => {
                    if (name !== CACHE_NAME) {
                        return caches.delete(name);
                    }
                })
            );
        })
    );
    self.clients.claim();
});

// Sıfır internet önbellekleme (Offline-first)
self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request).then((response) => {
            return response || fetch(event.request).then(fetchRes => {
                return caches.open(CACHE_NAME).then(cache => {
                    cache.put(event.request, fetchRes.clone());
                    return fetchRes;
                });
            });
        })
    );
});
