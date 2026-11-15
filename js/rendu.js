/* Fluxe Suivi — Affiche l'onglet actif. */
import {S, cur, tab} from './etat.js';
import {$} from './outils.js';
import {viewSeance} from './vues/seance.js';
import {viewHisto} from './vues/historique.js';
import {viewStats} from './vues/stats.js';
import {viewGuide} from './vues/guide.js';
import {veille} from './veille.js';
import {noter} from './erreurs.js';
const NOMS = {seance: 'l’accueil', histo: 'l’Historique', stats: 'les Stats', aide: 'le Guide'};
export function render() {
  if (S.current && !cur()) S.current = null;
  if (!S.current) S.editBak = null;
  S.sessions.forEach(x => {
    if (x.edit && x.id !== S.current) delete x.edit;
  });
  document.querySelectorAll('nav button').forEach(b => b.setAttribute('aria-current', b.dataset.tab === tab));
  /* si un écran plante : l'erreur est notée et un message remplace l'écran (les autres onglets restent utilisables) */
  try {
    $('#app').innerHTML =
      tab === 'seance' ? viewSeance() : tab === 'histo' ? viewHisto() : tab === 'stats' ? viewStats() : viewGuide();
  } catch (e) {
    noter(e, 'Impossible d’afficher ' + (NOMS[tab] || 'cet écran'));
    $('#app').innerHTML =
      '<div class="card" style="margin-top:20px"><div class="hist-date">Cet écran n’a pas pu s’afficher</div><p class="mu">Tes séances ne sont pas touchées. L’erreur a été notée dans Historique → Mes données → Rapport d’erreurs. Essaie un autre onglet ou rouvre l’app.</p></div>';
  }
  veille();
}
