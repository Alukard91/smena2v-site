// Service Worker: офлайн-кэш статики, чат всегда с сервера
const CACHE = 'info2v-v1';
const STATIC = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png'];

self.addEventListener('install', function (e) {
    e.waitUntil(
        caches.open(CACHE).then(function (c) {
            return c.addAll(STATIC);
        })
    );
    self.skipWaiting();
});

self.addEventListener('activate', function (e) {
    e.waitUntil(
        caches.keys().then(function (keys) {
            return Promise.all(keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
        })
    );
    self.clients.claim();
});

self.addEventListener('fetch', function (e) {
    const url = e.request.url;

    // Чат и прочие динамические запросы — только сеть
    if (url.indexOf('chat.php') !== -1 || url.indexOf('chat_data') !== -1) return;

    e.respondWith(
        caches.match(e.request).then(function (cached) {
            return cached || fetch(e.request).then(function (resp) {
                if (resp && resp.status === 200 && resp.type === 'basic') {
                    const copy = resp.clone();
                    caches.open(CACHE).then(function (c) { c.put(e.request, copy); });
                }
                return resp;
            }).catch(function () {
                return caches.match('./index.html');
            });
        })
    );
});