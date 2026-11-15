/* Fluxe Suivi — Gestes : Chrono de repos : réglages pendant le repos, temps de repos par défaut ou par exercice.
   Chaque geste reçoit le bouton touché (b), la séance en cours (s) et les numéros i, j, k du bouton.
   Il renvoie true quand l'app doit enregistrer puis redessiner l'écran ; sinon il s'en occupe lui-même. */
import {S, pk, save, toast} from '../etat.js';
import {K} from '../outils.js';
import {restFor} from '../calculs.js';
import {render} from '../rendu.js';
import {closePk, openSheet, sheet} from '../vues/panneaux.js';
import {tAdd, tKeep, tSet, tStop, tToggle, dureeTxt} from '../minuteur.js';
const tempsRepos = ({a, b, s, i, j, k}) => {
  if (!pk || !pk.rs) return;
  const r = pk.rs;
  if (a === 'rsv') {
    const v = +b.dataset.s;
    if (v >= 15 && v <= 600) r.v = v;
  } else if (a === 'rsm') r.v = Math.max(15, r.v - 15);
  else if (a === 'rsp') r.v = Math.min(600, r.v + 15);
  else {
    if (r.n) {
      S.rests = S.rests || {};
      S.rests[K(r.n)] = r.v;
    } else S.rest = r.v;
    save();
    closePk();
    render();
    toast('Repos' + (r.n ? ' pour ' + r.n : ' par défaut') + ' : ' + dureeTxt(r.v));
    return;
  }
  sheet();
  return;
};
export const gestes = {
  't+': ({a, b, s, i, j, k}) => {
    tAdd(15000);
    return;
  },
  't-': ({a, b, s, i, j, k}) => {
    tAdd(-15000);
    return;
  },
  tset: ({a, b, s, i, j, k}) => {
    const v = +b.dataset.s;
    if (v >= 15 && v <= 600) tSet(v);
    return;
  },
  tcfg: ({a, b, s, i, j, k}) => {
    tToggle();
    return;
  },
  tkeep: ({a, b, s, i, j, k}) => {
    tKeep();
    render();
    return;
  },
  rsv: tempsRepos,
  rsm: tempsRepos,
  rsp: tempsRepos,
  rsok: tempsRepos,
  t0: ({a, b, s, i, j, k}) => {
    tStop();
    return;
  },
  rest: ({a, b, s, i, j, k}) => {
    openSheet({rs: {n: null, v: S.rest || 90}});
    return;
  },
  rex: ({a, b, s, i, j, k}) => {
    const n = s.exercises[i].name;
    openSheet({rs: {n, v: restFor(n)}});
    return;
  },
};
