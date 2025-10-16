// ✅ Version neutre du Service Worker — ni cache, ni bug
self.addEventListener('install', event => {
  console.log('Service Worker installé ✅');
  self.skipWaiting(); // Prend le contrôle immédiat
});

self.addEventListener('activate', event => {
  console.log('Service Worker activé 🚀');
  // Nettoyage d’anciens caches éventuels
  event.waitUntil(
    caches.keys().then(keys => Promise.all(keys.map(key => caches.delete(key))))
  );
  return self.clients.claim();
});

self.addEventListener('fetch', event => {
  // Laisse tout passer directement au réseau sans mise en cache
  return;
});
