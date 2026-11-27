/* Fluxe Suivi — Gestes : Historique (v3.17) : menu « ··· » d'une séance, « + n autres exercices ».
   Modifier, Créer une routine et Supprimer gardent leurs gestes d'avant (fin-seance.js, routines.js). */
import {S, done} from '../etat.js';
import {render} from '../rendu.js';
import {resume} from '../resume-seance.js';
import {partagerSeance} from '../partage.js';
import {basculerMenu, deplier, fermerMenu, menuOuvert} from '../vues/historique.js';

/* Toucher ailleurs que sur le bouton « ··· » ferme le menu (avant que le geste touché ne s'exécute) */
document.addEventListener(
  'click',
  ev => {
    if (menuOuvert() === null || ev.target.closest('[data-act=hmenu]')) return;
    const dansMenu = ev.target.closest('.hx-menu');
    fermerMenu();
    if (dansMenu) dansMenu.remove(); /* le geste du menu fait son travail ; le menu disparaît tout de suite */
    else render();
  },
  true
);

export const gestes = {
  hmenu: ({b}) => {
    basculerMenu(b.dataset.id);
    render();
  },
  hpart: ({b}) => {
    const l = done(),
      s = l.find(x => x.id === b.dataset.id);
    if (s) partagerSeance(resume(s, l, S.mu), s.date);
  },
  hplus: ({b}) => {
    deplier(b.dataset.id);
    render();
  },
};
