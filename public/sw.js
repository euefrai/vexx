const CACHE_NAME = "vexx-v2";

// Arquivos mínimos para o PWA ser considerado "instalável"
const ASSETS = [
  "/",
  "/manifest.json",
  "/icon-192x192.png",
  "/icon-512x512.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    })
  );
  self.skipWaiting(); // Força a instalação imediata
});

self.addEventListener("activate", (event) => {
  event.waitUntil(clients.claim()); // Assume o controle da página na hora
});

// O evento fetch não pode estar vazio. Ele precisa responder algo do cache ou rede.
self.addEventListener("fetch", (event) => {
  event.respondWith(
    fetch(event.request).catch(() => {
      return caches.match(event.request);
    })
  );
});

// Escuta o comando do seu UpdatePrompt.jsx
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});