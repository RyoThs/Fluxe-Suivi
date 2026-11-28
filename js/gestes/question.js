/* Fluxe Suivi — Gestes : question à un toucher après une séance (v3.21). Oui / Non partent au club comme un avis
   (« elle est là » / « absente ») et corrigent ma liste tout de suite ; ✕ ferme sans rien envoyer. */
import {render} from '../rendu.js';
import {gymCur} from '../salle.js';
import {norm} from '../outils.js';
import {connecte, monUid, verifie} from '../nuage.js';
import {avisConnus, lireAvis} from '../club-reseau.js';
import {choisirMachine, effacer, fermer, pauseActive, poser, questionEnCours, repondu} from '../question.js';
import {partager} from './club.js';

/* appelé quand une séance vient d'être enregistrée : choisit (peut-être) une machine à demander */
export function proposerQuestion(s) {
  const g = gymCur();
  if (!g || !g.club || !connecte() || !verifie() || pauseActive()) return;
  const club = g.club,
    choisir = avis => {
      const m = choisirMachine(s, g.eq, avis, monUid());
      if (!m) return;
      poser(m);
      render();
    };
  lireAvis(club).then(choisir, () => choisir(avisConnus(club)));
}

function repondre(k) {
  const q = questionEnCours(),
    g = gymCur();
  if (!q || q.merci || !g) return;
  if (k === 'absent') g.eq = g.eq.filter(x => norm(x) !== norm(q.machine));
  if (k === 'present' && !g.eq.some(x => norm(x) === norm(q.machine))) g.eq.push(q.machine);
  partager(g, {m: q.machine, k}, '');
  repondu();
  setTimeout(() => {
    effacer();
    render();
  }, 2000);
  return true;
}

export const gestes = {
  qoui: () => repondre('present'),
  qnon: () => repondre('absent'),
  qx: () => {
    fermer();
    render();
  },
};
