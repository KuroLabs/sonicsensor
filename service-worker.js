const CACHE_NAME = "cache-v3";
const CACHE_FILES = [
    '/',
    '/index.html',
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
