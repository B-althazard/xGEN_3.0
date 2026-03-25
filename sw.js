const CACHE_NAME = 'xgen-v4-cache';
const PRECACHE = [
  './',
  './index.html',
  './css/style.css',
  './js/app.js',
  './js/store.js',
  './js/storageManager.js',
  './js/bridgeManager.js',
  './data/xgen_schema-identity.json',
  './data/xgen_schema-physique.json',
  './data/xgen_schema-bust.json',
  './data/xgen_schema-lower_body.json',
  './data/xgen_schema-face.json',
  './data/xgen_schema-hair.json',
  './data/xgen_schema-makeup.json',
  './data/xgen_schema-clothing.json',
  './data/xgen_schema-location.json',
  './data/xgen_schema-lighting.json',
  './data/xgen_schema-camera.json',
  './data/xgen_schema-posing.json',
  './data/xgen_schema-actions.json',
  './data/xgen_schema-quality.json',
  './data/xgen_schema-multi_dummy.json',
  './data/xgen_schema-xXx.json',
  './data/xgen_dummies.json',
  './data/prompt_rules.json',
  './manifest.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE)));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request).then((response) => {
      const copy = response.clone();
      caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
      return response;
    }).catch(() => cached))
  );
});
