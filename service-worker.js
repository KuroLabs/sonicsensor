const CACHE_NAME = "cache-v11";
console.log(CACHE_NAME);
const CACHE_FILES = [
    '/',
    '/index.html',
    '/favicon.ico',
    '/assets/anime.json',
    '/assets/listen.json',
    '/assets/volume.json',
    '/assets/snapnotify.mp3',
    '/assets/thunder.png',
    '/css/AvenirNextLTPro-Bold.otf',
    '/css/AvenirNextLTPro-It.otf',
    '/css/AvenirNextLTPro-Regular.otf',
    '/css/bootstrap.min.css',
    '/css/GeorginademoRegular-gxxyE.ttf',
    '/css/MYRIADPRO-BOLD.OTF',
    '/css/Sectar-Rpq3e.otf',
    '/css/style.css',
    '/vendor/bootstrap.min.js',
    '/vendor/fontawesome-all.min.js',
    '/vendor/jquery-3.4.1.min.js',
    '/vendor/lottie-player.js',
    '/vendor/noSleep.js',
    '/vendor/p5.js',
    '/vendor/p5.sound.js',
    '/vendor/sonic.js',
    '/vendor/TimelineMax.min.js',
    '/vendor/TweenMax.min.js',
    '/vendor/jquery.pagepiling.min.js',
    '/vendor/jquery.pagepiling.min.css',
    '/dist/sonicsensor.min.js',
    '/manifest.webmanifest',
    '/assets/apple-icon-180.jpg',
    '/assets/apple-icon-167.jpg',
    '/assets/apple-icon-152.jpg',
    '/assets/apple-icon-120.jpg',
    '/assets/manifest-icon-192.png',
    '/assets/manifest-icon-512.png',
    '/assets/apple-splash-2048-2732.jpg',
    '/assets/apple-splash-2732-2048.jpg',
    '/assets/apple-splash-1668-2388.jpg',
    '/assets/apple-splash-2388-1668.jpg',
    '/assets/apple-splash-1536-2048.jpg',
    '/assets/apple-splash-2048-1536.jpg',
    '/assets/apple-splash-1668-2224.jpg',
    '/assets/apple-splash-2224-1668.jpg',
    '/assets/apple-splash-1620-2160.jpg',
    '/assets/apple-splash-2160-1620.jpg',
    '/assets/apple-splash-1242-2688.jpg',
    '/assets/apple-splash-2688-1242.jpg',
    '/assets/apple-splash-1125-2436.jpg',
    '/assets/apple-splash-2436-1125.jpg',
    '/assets/apple-splash-828-1792.jpg',
    '/assets/apple-splash-1792-828.jpg',
    '/assets/apple-splash-1080-1920.jpg',
    '/assets/apple-splash-1920-1080.jpg',
    '/assets/apple-splash-750-1334.jpg',
    '/assets/apple-splash-1334-750.jpg',
    '/assets/apple-splash-640-1136.jpg',
    '/assets/apple-splash-1136-640.jpg'
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
