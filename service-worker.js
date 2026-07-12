const CACHE = 'emoseed-free-tools-20260712-v1';
const CORE = [
  '/', '/index.html', '/offline.html', '/assets/css/style.css', '/assets/css/mobile-app.css',
  '/assets/js/app.js', '/assets/js/mobile-app.js', '/assets/js/free-tools-shell.js', '/assets/js/data.js', '/assets/images/favicon.svg',
  '/tools/', '/tools/index.html', '/tools/tools.css', '/tools/tools-data.js', '/tools/tools.js',
  '/mbti/index.html', '/fortune/index.html', '/name-generator/index.html', '/compatibility/index.html',
  '/flowers/index.html', '/flowers/gifts.html', '/flowers/flowers.css', '/flowers/gifts.css',
  '/flowers/gifts-data.js', '/flowers/gifts.js', '/flowers/gifts-plus.css', '/flowers/gifts-plus.js',
  '/flowers/flowers-data-1.js', '/flowers/flowers-data-2.js', '/flowers/flowers-data-3a.js',
  '/flowers/flowers-data-3b1.js', '/flowers/flowers-data-3b3.js', '/flowers/flowers-data-3b5.js',
  '/flowers/flowers-origins.js', '/flowers/flowers-expanded-1.js', '/flowers/flowers-expanded-2.js',
  '/flowers/flowers-expanded-3.js', '/flowers/flowers-expanded-4.js', '/flowers/flowers.js'
];

const MOBILE_STYLE = '<link rel="stylesheet" href="/assets/css/mobile-app.css" data-emoseed-mobile-app>';
const MOBILE_SCRIPT = '<script defer src="/assets/js/mobile-app.js" data-emoseed-mobile-app><\/script>';
const TOOLS_SCRIPT = '<script defer src="/assets/js/free-tools-shell.js"><\/script>';

async function enhanceHtml(response) {
  if (!response) return response;
  const type = response.headers.get('content-type') || '';
  if (!type.includes('text/html')) return response;

  let html = await response.text();
  if (!html.includes('assets/css/mobile-app.css')) html = html.replace('</head>', `${MOBILE_STYLE}\n</head>`);
  if (!html.includes('assets/js/mobile-app.js')) html = html.replace('</body>', `${MOBILE_SCRIPT}\n</body>`);
  if (!html.includes('assets/js/free-tools-shell.js')) html = html.replace('</body>', `${TOOLS_SCRIPT}\n</body>`);

  const headers = new Headers(response.headers);
  headers.delete('content-length');
  headers.delete('content-encoding');
  headers.set('content-type', 'text/html; charset=utf-8');
  return new Response(html, { status: response.status, statusText: response.statusText, headers });
}

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(CORE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key)))).then(() => self.clients.claim()));
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  if (event.request.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        const network = await fetch(event.request);
        const enhanced = await enhanceHtml(network);
        const cache = await caches.open(CACHE);
        await cache.put(event.request, enhanced.clone());
        return enhanced;
      } catch (_) {
        const cached = await caches.match(event.request) || await caches.match('/offline.html');
        return enhanceHtml(cached);
      }
    })());
    return;
  }
  event.respondWith(caches.match(event.request).then((cached) => cached || fetch(event.request).then((response) => {
    if (response.ok && new URL(event.request.url).origin === location.origin) {
      const copy = response.clone();
      caches.open(CACHE).then((cache) => cache.put(event.request, copy));
    }
    return response;
  })));
});
