// Service Worker básico
const CACHE_NAME = 'morfologic-v1';

self.addEventListener('install', (event) => {
  console.log('✅ Service Worker instalado');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(['/', '/index.html']);
    })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});

/* PWA Fullscreen - respeita safe areas */
@supports(padding: max(0px)) {
  body {
    padding-left: max(0px, env(safe-area-inset-left));
    padding-right: max(0px, env(safe-area-inset-right));
    padding-top: max(0px, env(safe-area-inset-top));
    padding-bottom: max(0px, env(safe-area-inset-bottom));
  }
}