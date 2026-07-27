const CACHE_VERSION = 'v3';
const CACHE_NAME = `funkin-coding-${CACHE_VERSION}`;

const PRECACHE_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icons/icon-16.png',
  './icons/icon-32.png',
  './icons/icon-180.png',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

const isNavigationRequest = request =>
  request.mode === 'navigate' ||
  (request.method === 'GET' && request.headers.get('accept') && request.headers.get('accept').includes('text/html'));

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(PRECACHE_ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

async function networkFirst(request){
  const cache = await caches.open(CACHE_NAME);
  try{
    const fresh = await fetch(request);
    if(fresh && fresh.ok){
      cache.put(request, fresh.clone());
    }
    return fresh;
  } catch(err){
    const cached = await cache.match(request);
    if(cached) return cached;
    return cache.match('./index.html');
  }
}

async function cacheFirst(request){
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);
  if(cached) return cached;
  try{
    const fresh = await fetch(request);
    if(fresh && fresh.ok && request.method === 'GET'){
      cache.put(request, fresh.clone());
    }
    return fresh;
  } catch(err){
    return cached;
  }
}

self.addEventListener('fetch', event => {
  const { request } = event;
  if(request.method !== 'GET') return;

  const url = new URL(request.url);
  if(url.origin !== self.location.origin) return;

  if(isNavigationRequest(request)){
    event.respondWith(networkFirst(request));
    return;
  }

  event.respondWith(cacheFirst(request));
});

self.addEventListener('message', event => {
  if(event.data === 'skipWaiting'){
    self.skipWaiting();
  }
});
