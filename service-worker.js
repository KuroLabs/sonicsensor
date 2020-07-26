const CACHE_NAME = "cache-v1";
const CACHE_FILES = [
    '/',
    '/index.html',
    '/manifest.webmanifest',
    '/vendor/p5.js',
    '/vendor/p5.sound.js',
    '/dist/sonicsensor.min.js',
    '/assets/snapnotify.mp3',
];

self.addEventListener('install', function (event) {
    event.waitUntil(
        caches.open(CACHE_NAME)
        .then(function (cache) {
            console.log('[SW] Opened cache.');
            return cache.addAll(CACHE_FILES);
        })
    );
});

self.addEventListener('fetch', function (event) {
    event.respondWith(
        caches.match(event.request)
        .then(function (response) {
            if (response) {
                return response;
            }
            return fetch(event.request);
        })
        .catch((err)=>{
            console.log('[SW] Fetch error: ', err);
        })
    );
});

self.addEventListener('activate', function (event) {
    let cacheAllowlist = [CACHE_NAME];
    event.waitUntil(
        caches.keys().then(function (cacheNames) {
            return Promise.all(
                cacheNames.map(function (cacheName) {
                    if (cacheAllowlist.indexOf(cacheName) === -1) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    console.log('[SW] Prev cache cleared');
});
