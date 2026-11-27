/* Fluxe Suivi — Gestes : Historique (v3.17) : menu « ··· » d'une séance, « + n autres exercices ».
   Modifier, Créer une routine et Supprimer gardent leurs gestes d'avant (fin-seance.js, routines.js). */
import {S, done} from '../etat.js';
import {gymCur} from '../salle.js';
import {render} from '../rendu.js';
import {gestes as seance} from './seance.js';
import {gestes as repos} from './repos.js';
import {resume} from '../resume-seance.js';
import {partagerSeance} from '../partage.js';
import {basculerMenu, deplier, fermerMenu, menuOuvert} from '../vues/historique.js';

/* menus « ··· » des exercices (séance en cours, v3.19) : dans la page mais cachés ; un seul ouvert à la fois */
const fermerMenusEx = sauf =>
  document.querySelectorAll('.sx-menu:not([hidden])').forEach(m => {
    if (m === sauf) return;
    m.hidden = true;
    const b = m.previousElementSibling;
    if (b) b.setAttribute('aria-expanded', 'false');
  });
/* Toucher ailleurs que sur le bouton « ··· » ferme le menu (avant que le geste touché ne s'exécute) */
document.addEventListener(
  'click',
  ev => {
    if (!ev.target.closest('[data-act=emenu]')) fermerMenusEx(null);
    if (menuOuvert() === null || ev.target.closest('[data-act=hmenu]')) return;
    const dansMenu = ev.target.closest('.hx-menu');
    fermerMenu();
    if (dansMenu) dansMenu.remove(); /* le geste du menu fait son travail ; le menu disparaît tout de suite */
    else render();
  },
  true
);

/* les boutons du menu « ··· » d'un exercice ont leur propre nom (pas de doublon avec le glisser et la pastille Repos)
   mais font exactement la même chose */
export const gestes = {
  emrem: x => seance.exrem(x),
  emrex: x => repos.rex(x),
  emenu: ({b}) => {
    const m = b.nextElementSibling;
    if (!m || !m.classList.contains('sx-menu')) return;
    fermerMenusEx(m);
    m.hidden = !m.hidden;
    b.setAttribute('aria-expanded', String(!m.hidden));
  },
  hmenu: ({b}) => {
    basculerMenu(b.dataset.id);
    render();
  },
  hpart: ({b}) => {
    const l = done(),
      s = l.find(x => x.id === b.dataset.id);
    if (s) partagerSeance(resume(s, l, S.mu), s.date);
  },
  /* menu « ··· » d'une routine (page Entraînement, v3.18) */
  rmenu: ({b}) => {
    basculerMenu('r:' + b.dataset.k);
    render();
  },
  /* menu « ··· » de la salle (écran Ma salle, v3.20) */
  gmenu: () => {
    const g = gymCur();
    if (!g) return;
    basculerMenu('g:' + g.id);
    render();
  },
  hplus: ({b}) => {
    deplier(b.dataset.id);
    render();
  },
};
