/* Fluxe Suivi - service worker (fonctionnement hors ligne)
   Stratégie : réseau d'abord (tu vois toujours la dernière version),
   et si le téléphone est hors ligne, on utilise la copie gardée en cache. */
const VERSION = 'fluxe-v6'; // change ce numéro à chaque mise à jour de l'app
const FICHIERS = [
  './', 'index.html', 'manifest.json', 'app.js',
  'icons/icon-192.png', 'icons/icon-512.png', 'icons/icon-maskable-512.png',
  'icons/apple-touch-icon-v2.png', 'icons/favicon.png'
];

self.addEventListener('install', e => {
  // On ajoute chaque fichier séparément : si une icône manque, le reste est quand même gardé.
  e.waitUntil(
    caches.open(VERSION)
      .then(c => Promise.all(FICHIERS.map(f => c.add(f).catch(() => {}))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(noms => Promise.all(noms.filter(n => n !== VERSION).map(n => caches.delete(n))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  const garder = url.origin === location.origin ||
    url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com';
  if (!garder) return;

  e.respondWith(
    fetch(e.request)
      .then(rep => {
        if (rep && rep.ok) {
          const copie = rep.clone();
          caches.open(VERSION).then(c => c.put(e.request, copie));
        }
        return rep;
      })
      .catch(() =>
        caches.match(e.request).then(r =>
          r || (e.request.mode === 'navigate' ? caches.match('index.html') : null) || Response.error()
        )
      )
  );
});
