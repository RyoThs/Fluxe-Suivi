/* Fluxe Suivi - service worker (fonctionnement hors ligne)
   Stratégie : réseau d'abord (tu vois toujours la dernière version),
   et si le téléphone est hors ligne, on utilise la copie gardée en cache.

   ATTENTION : Fluxe Suivi, Fluxe App et ATLAS sont publiés sur le même domaine
   (ryoths.github.io). Dans le navigateur, ils partagent donc le même espace de caches.
   Règle de sécurité : Fluxe Suivi ne supprime QUE ses propres caches, reconnus par
   leur préfixe. Il ne touche jamais aux caches des autres applications ni aux caches inconnus.
   (Les données de l'app sont dans le localStorage : ce fichier n'y touche jamais.) */

const PREFIXE = 'fluxe-suivi-';
const VERSION = PREFIXE + 'v18'; // change ce numéro à chaque mise à jour de l'app

// Anciens noms de cache utilisés par Fluxe Suivi avant le préfixe (relevés dans l'historique Git).
// Ils ne sont PAS supprimés : ils servent seulement de secours en lecture pendant la transition.
const ANCIENS_CACHES = ['fluxe-v10', 'fluxe-v6', 'fluxe-v5', 'muscu-v7', 'muscu-v6', 'muscu-v5', 'muscu-v4', 'muscu-v2', 'muscu-v1'];

const FICHIERS = [
  './', 'index.html', 'manifest.json', 'css/app.css?v=2.4.1', 'js/main.js?v=2.4.1',
  // les autres morceaux du code (chargés par js/main.js)
  'js/actions.js',
  'js/calculs.js',
  'js/catalogue.js',
  'js/config.js',
  'js/donnees.js',
  'js/etat.js',
  'js/icones.js',
  'js/installation.js',
  'js/minuteur.js',
  'js/outils.js',
  'js/rappel.js',
  'js/rendu.js',
  'js/salle.js',
  'js/sauvegarde.js',
  'js/veille.js',
  'js/versions.js',
  'js/vues/ecran-sauvegarde.js',
  'js/vues/guide.js',
  'js/vues/historique.js',
  'js/vues/panneaux.js',
  'js/vues/seance.js',
  'js/vues/stats.js',
  'icons/icon-192.png', 'icons/icon-512.png', 'icons/icon-maskable-512.png',
  'icons/apple-touch-icon-v2.png', 'icons/favicon.png',
  // la police Barlow Condensed, hébergée avec le reste du projet (jamais d’apostrophe droite dans cette liste : les tests la lisent)
  'fonts/barlow-condensed-500.woff2', 'fonts/barlow-condensed-600.woff2',
  'fonts/barlow-condensed-700.woff2', 'fonts/barlow-condensed-800.woff2'
];

// Un cache appartient à Fluxe Suivi uniquement s'il porte son préfixe.
const estUnCacheFluxeSuivi = nom => nom.startsWith(PREFIXE);

self.addEventListener('install', e => {
  // Tout ou rien : si un seul fichier manque, l'installation échoue et l'ancienne version
  // (complète) reste en place. Ainsi le téléphone n'a jamais une copie hors ligne à trous.
  e.waitUntil(
    caches.open(VERSION)
      .then(c => c.addAll(FICHIERS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  // Nettoyage : uniquement les anciennes versions préfixées de Fluxe Suivi.
  e.waitUntil(
    caches.keys()
      .then(noms => Promise.all(noms.filter(n => estUnCacheFluxeSuivi(n) && n !== VERSION).map(n => caches.delete(n))))
      .then(() => self.clients.claim())
  );
});

// Cherche une réponse uniquement dans les caches de Fluxe Suivi (actuel d'abord, puis anciens noms).
const chercherDansMesCaches = async requete => {
  const noms = await caches.keys();
  for (const nom of [VERSION, ...ANCIENS_CACHES]) {
    if (!noms.includes(nom)) continue;
    const trouve = await (await caches.open(nom)).match(requete);
    if (trouve) return trouve;
  }
  return undefined;
};

// Même requête, mais en demandant toujours au serveur si le fichier a changé.
const sansVieilleCopie = req => { try { return new Request(req, { cache: 'no-cache' }); } catch (x) { return req; } };

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  // Seuls les fichiers de l'app elle-même sont gérés (plus aucun site extérieur).
  if (url.origin !== location.origin) return;

  e.respondWith(
    // cache: 'no-cache' = toujours demander au serveur si le fichier a changé (évite les vieilles copies du téléphone)
    fetch(sansVieilleCopie(e.request))
      .then(rep => {
        if (rep && rep.ok) {
          const copie = rep.clone();
          caches.open(VERSION).then(c => c.put(e.request, copie));
        }
        return rep;
      })
      .catch(async () =>
        (await chercherDansMesCaches(e.request)) ||
        (e.request.mode === 'navigate' ? await chercherDansMesCaches('index.html') : undefined) ||
        Response.error()
      )
  );
});
