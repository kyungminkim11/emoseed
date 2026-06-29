const CACHE = 'emoseed-flower-gifts-20260630';
const CORE = [
  '/', '/index.html', '/offline.html', '/assets/css/style.css', '/assets/js/app.js', '/assets/js/data.js',
  '/assets/images/favicon.svg',
  '/mbti/index.html', '/fortune/index.html', '/name-generator/index.html', '/compatibility/index.html',
  '/flowers/index.html', '/flowers/gifts.html', '/flowers/flowers.css', '/flowers/gifts.css',
  '/flowers/gifts-data.js', '/flowers/gifts.js', '/flowers/flowers-data-1.js', '/flowers/flowers-data-2.js',
  '/flowers/flowers-data-3a.js', '/flowers/flowers-data-3b1.js', '/flowers/flowers-data-3b3.js',
  '/flowers/flowers-data-3b5.js', '/flowers/flowers-origins.js', '/flowers/flowers-expanded-1.js',
  '/flowers/flowers-expanded-2.js', '/flowers/flowers-expanded-3.js', '/flowers/flowers-expanded-4.js',
  '/flowers/flowers.js'
];
self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(CORE)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  if (event.request.mode === 'navigate') {
    event.respondWith(fetch(event.request).then((response) => {
      const copy = response.clone(); caches.open(CACHE).then((cache) => cache.put(event.request, copy)); return response;
    }).catch(() => caches.match(event.request).then((cached) => cached || caches.match('/offline.html'))));
    return;
  }
  event.respondWith(caches.match(event.request).then((cached) => cached || fetch(event.request).then((response) => {
    if (response.ok && new URL(event.request.url).origin === location.origin) {
      const copy = response.clone(); caches.open(CACHE).then((cache) => cache.put(event.request, copy));
    }
    return response;
  })));
});
