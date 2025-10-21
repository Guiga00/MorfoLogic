// Service Worker otimizado para DESENVOLVIMENTO
const CACHE_NAME = 'morfologic-dev-' + new Date().getTime(); // ✅ Cache único por versão
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/css/style.css',
  '/js/main.js',
  '/js/games/memoria.js',
  '/js/games/genius.js',
  '/js/games/ligar.js',
  '/js/games/tempo.js',
];

// ========== INSTALAÇÃO ==========
self.addEventListener('install', (event) => {
  console.log('🔧 Service Worker instalando...');

  // ✅ Força ativação imediata (pula espera)
  self.skipWaiting();

  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('📦 Cache criado:', CACHE_NAME);
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

// ========== ATIVAÇÃO ==========
self.addEventListener('activate', (event) => {
  console.log('✅ Service Worker ativando...');

  event.waitUntil(
    // ✅ Remove caches antigos automaticamente
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              console.log('🗑️ Removendo cache antigo:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        // ✅ Assume controle imediatamente
        return self.clients.claim();
      })
  );
});

// ========== FETCH (Estratégia: Network First com Cache Fallback) ==========
self.addEventListener('fetch', (event) => {
  event.respondWith(
    // ✅ SEMPRE busca da rede primeiro (melhor para desenvolvimento)
    fetch(event.request)
      .then((response) => {
        // Clona a resposta para salvar no cache
        const responseClone = response.clone();

        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseClone);
        });

        return response;
      })
      .catch(() => {
        // ❌ Se a rede falhar, usa cache
        return caches.match(event.request);
      })
  );
});

// ========== MENSAGENS (Comunicação com o app) ==========
self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
