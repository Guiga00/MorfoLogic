const CACHE_VERSION = 'v1.0.0'; // Incremente isso a cada atualização
const CACHE_NAME = `pwa-cache-${CACHE_VERSION}`;

const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/main.js',
  '/styles.css',
  '/manifest.json',
  // Adicione outros arquivos necessários
];

// Instalação do Service Worker
self.addEventListener('install', (event) => {
  console.log('Service Worker instalando...');

  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        console.log('Cache aberto');
        return cache.addAll(ASSETS_TO_CACHE);
      })
      .then(() => self.skipWaiting()) // Ativa imediatamente
  );
});

// Ativação - Remove caches antigos
self.addEventListener('activate', (event) => {
  console.log('Service Worker ativando...');

  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              console.log('Deletando cache antigo:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => self.clients.claim()) // Assume controle imediato
  );
});

// Estratégia Network First - Sempre busca da rede primeiro
self.addEventListener('fetch', (event) => {
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Clona a resposta para salvar no cache
        const responseToCache = response.clone();

        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });

        return response;
      })
      .catch(() => {
        // Se falhar, tenta buscar do cache
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          // Retorna página offline se disponível
          return caches.match('/offline.html');
        });
      })
  );
});
