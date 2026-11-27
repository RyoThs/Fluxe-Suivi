/* Fluxe Suivi — Question à un toucher après une séance (v3.21) : « Le … est-il bien dans ta salle ? » Oui / Non / ✕.
   Une seule question par séance, seulement avec une salle reliée à son club et un compte vérifié.
   Les calculs (choisirMachine, apresFermeture, apresReponse, enPause) sont purs et testés ;
   l'état d'affichage (question en cours, « Merci ») vit seulement en mémoire ; la pause est gardée dans fx-question. */
import {bilanClub} from './club.js';
import {norm, ok, dn} from './outils.js';

const PAUSE = 30 * 864e5,
  FERMES_MAX = 3;

/**
 * La machine à demander : utilisée pendant la séance, dans ma salle, pas encore vérifiée par le club,
 * et sur laquelle je n'ai pas déjà donné d'avis.
 * @param {{exercises: Array}} seance
 * @param {string[]} eq machines de ma salle
 * @param {Array} avis avis connus du club
 * @param {string} monUid
 * @returns {string|null}
 */
export function choisirMachine(seance, eq, avis, monUid) {
  const dans = new Set((eq || []).map(norm)),
    b = bilanClub(avis || []),
    miens = new Set((avis || []).filter(a => a && a.u === monUid && typeof a.m === 'string').map(a => norm(a.m)));
  for (const e of (seance && seance.exercises) || []) {
    if (!e || typeof e.name !== 'string') continue;
    const fait = (e.sets || []).some(x => (e.cardio ? dn(x) : ok(x)));
    const n = norm(e.name);
    if (fait && dans.has(n) && !b.verifiees.has(n) && !miens.has(n)) return e.name;
  }
  return null;
}

/** ✕ : une fermeture de plus ; à la 3e de suite, pause de 30 jours. */
export function apresFermeture(e, maintenant = Date.now()) {
  const fermes = ((e && e.fermes) || 0) + 1;
  return fermes >= FERMES_MAX ? {fermes: 0, jusqua: maintenant + PAUSE} : {...e, fermes};
}
/** Oui / Non : le compteur de fermetures repart à zéro. */
export const apresReponse = () => ({fermes: 0});
/** En pause (après 3 ✕) ? */
export const enPause = (e, maintenant = Date.now()) => !!(e && e.jusqua && maintenant < e.jusqua);

/* ===== État de l'appli (mémoire + fx-question) ===== */
const lire = () => {
  try {
    const v = JSON.parse(localStorage.getItem('fx-question') || '{}');
    return v && typeof v === 'object' ? v : {};
  } catch (e) {
    return {};
  }
};
const ecrire = v => {
  try {
    localStorage.setItem('fx-question', JSON.stringify(v));
  } catch (e) {}
};
let enCours = null; /* {machine, merci?} */
export const questionEnCours = () => enCours;
export const pauseActive = () => enPause(lire());
export function poser(machine) {
  enCours = machine ? {machine} : null;
}
export function fermer() {
  enCours = null;
  ecrire(apresFermeture(lire()));
}
export function repondu() {
  ecrire(apresReponse());
  if (enCours) enCours.merci = true;
}
export function effacer() {
  enCours = null;
}
