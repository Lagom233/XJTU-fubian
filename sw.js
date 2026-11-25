const root = new URL(self.registration.scope);
const cachePrefix = 'complex-review:' + root.pathname + ':';
const cacheName = cachePrefix + '2425e4be4bf35fbf';
const home = new URL('index.html', root).href;
const assets = ['index.html', 'manifest.webmanifest', 'icons/review-192.png', 'icons/review-512.png']
  .map(path => new URL(path, root).href);

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(cacheName);
    await cache.addAll(assets.map(url => new Request(url, {cache: 'reload'})));
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys
      .filter(key => key.startsWith(cachePrefix) && key !== cacheName)
      .map(key => caches.delete(key)));
    await self.clients.claim();
  })());
});

async function navigate(request) {
  const cache = await caches.open(cacheName);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 3500);
  try {
    const response = await fetch(request, {signal: controller.signal, cache: 'no-cache'});
    if (response.ok) return response;
    return await cache.match(home) || response;
  } catch {
    return await cache.match(home) ||
      new Response('首次使用请先联网打开复变研习室。', {
        status: 503, headers: {'Content-Type': 'text/plain; charset=utf-8'},
      });
  } finally {
    clearTimeout(timeout);
  }
}

self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== root.origin) return;
  if (request.mode === 'navigate' &&
      (url.pathname === root.pathname || url.pathname === new URL(home).pathname)) {
    event.respondWith(navigate(request));
  } else if (assets.includes(url.href)) {
    event.respondWith((async () => {
      const cache = await caches.open(cacheName);
      return await cache.match(request) || fetch(request);
    })());
  }
});
