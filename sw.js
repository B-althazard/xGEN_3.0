const CACHE_NAME = 'xgen-v6-cache';
const PRECACHE = [
  './',
  './index.html',
  './css/style.css',
  './manifest.json',
  './userscript/xgen-venice-bridge.user.js',
  './assets/icons/apple-touch-icon.png',
  './assets/icons/icon-48.png',
  './assets/icons/icon-72.png',
  './assets/icons/icon-96.png',
  './assets/icons/icon-128.png',
  './assets/icons/icon-144.png',
  './assets/icons/icon-192.png',
  './assets/icons/icon-512.png',
  './assets/icons/maskable-192.png',
  './assets/icons/maskable-512.png',
  // Core
  './js/app.js',
  './js/store.js',
  './js/storageManager.js',
  './js/bridgeManager.js',
  './js/icons.js',
  './js/constants/categories.js',
  './js/utils/dom.js',
  // Pages
  './js/pages/home.js',
  './js/pages/creationKit.js',
  './js/pages/xgen.js',
  './js/pages/gallery.js',
  './js/pages/galleryGrouping.js',
  // Components
  './js/components/formRenderer.js',
  './js/components/bridgeInstall.js',
  './js/components/colorSwatch.js',
  './js/components/accordion.js',
  './js/components/wordCounter.js',
  './js/components/topBar.js',
  './js/components/ageGate.js',
  './js/components/onboarding.js',
  './js/components/modal.js',
  './js/components/imageCard.js',
  './js/components/characterTypeToggle.js',
  './js/components/dummyTabs.js',
  './js/components/fab.js',
  // Modules
  './js/modules/presets.js',
  './js/modules/terminal.js',
  // Prompt Engine
  './js/promptEngine/index.js',
  './js/promptEngine/extract.js',
  './js/promptEngine/normalize.js',
  './js/promptEngine/resolve.js',
  './js/promptEngine/blocks.js',
  './js/promptEngine/format.js',
  './js/promptEngine/negative.js',
  './js/promptEngine/diagnostics.js',
  './js/promptEngine/templates.js',
  // Data
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
      const requestUrl = new URL(event.request.url);
      if (response.ok && requestUrl.origin === self.location.origin) {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
      }
      return response;
    }).catch(() => cached))
  );
});
