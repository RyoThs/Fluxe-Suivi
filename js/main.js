/* Fluxe Suivi — Point de départ : vérifie la version, lance les copies de secours, affiche l'app. */
import './erreurs.js'; /* en premier : note les erreurs dès le démarrage */
import {VER} from './config.js';
import {warn} from './etat.js';
import {render} from './rendu.js';
import {snapStart} from './versions.js';
import './actions.js'; /* boutons et saisie */
import './installation.js'; /* bouton Installer */
import './ecran.js'; /* pas de zoom, portrait */
import {demarrerNuage, surNuage} from './nuage.js';
import {carteNuage} from './vues/nuage.js';
import {sheet} from './vues/panneaux.js';
import {surErreur} from './erreurs.js';
import {carteErreurs} from './vues/erreurs.js';
import {initRecompenses} from './vues/serie.js';
/* Mise à jour bloquée (ancienne copie gardée par le téléphone) : l'app se répare toute seule.
   Elle force la mise à jour du service worker, vide SES caches (jamais tes données : elles sont ailleurs) et recharge.
   Une seule tentative par minute, pour ne jamais tourner en boucle. */
async function heal() {
  try {
    const r = navigator.serviceWorker && (await navigator.serviceWorker.getRegistration());
    if (r) await r.update();
  } catch (e) {}
  try {
    for (const k of await caches.keys()) if (k.startsWith('fluxe-suivi-')) await caches.delete(k);
  } catch (e) {}
  location.reload();
}
{
  const mv = document.querySelector('meta[name="app-version"]');
  if (!mv || mv.content !== VER) {
    let t = 0;
    try {
      t = +sessionStorage.getItem('fx-heal') || 0;
    } catch (e) {}
    if (Date.now() - t > 60000) {
      try {
        sessionStorage.setItem('fx-heal', String(Date.now()));
      } catch (e) {}
      warn('ver', 'Mise à jour de Fluxe en cours…');
      heal();
    } else
      warn(
        'ver',
        'La mise à jour n’est pas encore arrivée. Ferme complètement Fluxe, attends quelques minutes puis rouvre-la. Tes séances ne sont pas touchées.'
      );
  }
}
if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {});
snapStart();
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
}
initRecompenses(); /* récompenses déjà gagnées : notées sans fenêtre la 1re fois */
render();
/* Sauvegarde en ligne : seule sa carte est redessinée (jamais l'écran entier pendant une saisie) ;
   si des séances sont arrivées d'un autre appareil, l'écran est rafraîchi quand aucun champ n'est en cours de saisie. */
let statutAvant = null;
surNuage(o => {
  const c = document.querySelector('#nuage');
  if (c) c.outerHTML = carteNuage();
  const change = o.statut !== undefined && o.statut !== statutAvant;
  if (o.statut !== undefined) statutAvant = o.statut;
  const saisie = () => {
    const a = document.activeElement;
    return a && /^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName);
  };
  /* connexion, séances reçues ou état changé (ex. « À jour ») : la fenêtre « Mes données » ouverte est redessinée
     (ligne « Tout est sauvegardé en ligne »), sauf pendant une saisie */
  if ((o.recu || change) && document.querySelector('#sheet.on #nuage') && !saisie()) sheet();
  /* séances reçues, ou tout vient d'être envoyé alors que le rappel « Pense à sauvegarder » est affiché */
  if ((o.recu || (o.statut === 'ok' && document.querySelector('.card.bkc'))) && !saisie()) render();
});
demarrerNuage();
/* Rapport d'erreurs : la carte se met à jour quand une erreur est notée ou envoyée */
surErreur(() => {
  const c = document.querySelector('#erreurs');
  if (c) c.outerHTML = carteErreurs();
});
