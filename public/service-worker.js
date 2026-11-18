const CACHE_NAME = 'afams-shell-v2';
const SHELL_URLS = ['/', '/manifest.json'];
const BUILD_ASSET = /^\/assets\/[\w.-]+-[\w-]{8,}\.(?:js|css)$/;

async function fetchPublicFile(cache, path) {
  const response = await fetch(new URL(path, self.location.origin), {
    credentials: 'omit',
    redirect: 'error',
    cache: 'no-store',
  });
  const cacheControl = (response.headers.get('cache-control') || '').toLowerCase();
  const vary = (response.headers.get('vary') || '').toLowerCase().split(',').map(value => value.trim());
  if (response.status === 200 && response.type === 'basic' && !response.redirected &&
      !cacheControl.includes('no-store') && !cacheControl.includes('private') &&
      !cacheControl.includes('no-cache') && !response.headers.has('set-cookie') &&
      !vary.some(value => ['*', 'cookie', 'authorization'].includes(value))) {
    await cache.put(path, response.clone()).catch(() => undefined);
  }
  return response;
}

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    await Promise.allSettled(SHELL_URLS.map(path => fetchPublicFile(cache, path)));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(key => key.startsWith('afams-shell-') && key !== CACHE_NAME)
      .map(key => caches.delete(key)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin || url.search) return;
  if (url.pathname === '/api' || url.pathname.startsWith('/api/') || request.headers.has('authorization')) return;

  if (request.mode === 'navigate') {
    if (url.pathname !== '/') return;
    // Live navigation may include a session cookie; only the separately fetched public shell is cached.
    event.respondWith(fetch(request).catch(async () => {
      const cache = await caches.open(CACHE_NAME);
      return (await cache.match('/')) || Response.error();
    }));
    return;
  }

  if (request.credentials === 'include' || request.headers.has('range')) return;
  const staticAsset = BUILD_ASSET.test(url.pathname) || url.pathname === '/manifest.json';
  if (!staticAsset) return;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    return (await cache.match(url.pathname)) || fetchPublicFile(cache, url.pathname);
  })());
});
