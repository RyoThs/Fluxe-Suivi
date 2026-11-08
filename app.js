/* Fluxe Suivi — ANCIEN point d'entrée (jusqu'à la v2.2.1).
   Depuis la v2.3.0, le code est rangé dans le dossier js/ (point de départ : js/main.js).
   Ce petit fichier reste là pour les téléphones qui auraient gardé une vieille page index.html :
   au lieu d'une page blanche, il vide les caches de Fluxe Suivi (jamais tes données) et recharge.
   Une seule tentative par minute, pour ne jamais tourner en boucle. */
(function () {
  'use strict';
  var w = document.querySelector('#warn');
  var dire = function (m) { if (w) { w.textContent = m; w.hidden = false; } };
  var t = 0;
  try { t = +sessionStorage.getItem('fx-heal') || 0; } catch (e) {}
  if (Date.now() - t < 60000) { dire('La mise à jour n’est pas encore arrivée. Ferme complètement Fluxe, attends quelques minutes puis rouvre-la. Tes séances ne sont pas touchées.'); return; }
  try { sessionStorage.setItem('fx-heal', String(Date.now())); } catch (e) {}
  dire('Mise à jour de Fluxe en cours…');
  var fin = function () { location.reload(); };
  Promise.resolve()
    .then(function () { return navigator.serviceWorker && navigator.serviceWorker.getRegistration(); })
    .then(function (r) { return r && r.update(); })
    .catch(function () {})
    .then(function () { return window.caches ? caches.keys() : []; })
    .then(function (l) { return Promise.all(l.filter(function (k) { return k.indexOf('fluxe-suivi-') === 0; }).map(function (k) { return caches.delete(k); })); })
    .catch(function () {})
    .then(fin, fin);
})();
