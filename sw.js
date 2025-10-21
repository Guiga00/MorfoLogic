// // Service Worker básico
// const CACHE_NAME = 'morfologic-v1';

// self.addEventListener('install', (event) => {
//   console.log('✅ Service Worker instalado');
//   event.waitUntil(
//     caches.open(CACHE_NAME).then((cache) => {
//       return cache.addAll(['/', '/index.html']);
//     })
//   );
// });

// self.addEventListener('fetch', (event) => {
//   event.respondWith(
//     caches.match(event.request).then((response) => {
//       return response || fetch(event.request);
//     })
//   );
// });
