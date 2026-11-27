/* Fluxe Suivi — Résumé d'une routine pour la page Entraînement (v3.18).
   Calculs seulement : aucun accès à l'écran, au stockage ni au réseau (testé par tests/33-entrainement.test.js). */
import {fmtN} from './outils.js';

const nombre = v => parseFloat(String(v == null ? '' : v).replace(',', '.')) || 0;
const pluriel = (n, mot) => n + ' ' + mot + (n > 1 ? 's' : '');
const joursEntre = (t, maintenant) =>
  Math.floor((new Date(maintenant).setHours(0, 0, 0, 0) - new Date(t).setHours(0, 0, 0, 0)) / 864e5);

/**
 * Ce qui est prévu pour un exercice : « 2 séries · 105 kg » (échauffement exclu), « 1 bloc · 20 min » pour le cardio.
 * @param {Array<Object>} plan séries prévues (routine, sinon la dernière fois)
 * @param {boolean} cardio
 */
export function prevu(plan, cardio) {
  const l = plan || [];
  if (cardio) {
    if (!l.length) return '';
    const min = l.reduce((a, x) => a + nombre(x.min), 0);
    return pluriel(l.length, 'bloc') + (min ? ' · ' + fmtN(min) + ' min' : '');
  }
  const t = l.filter(x => !x.w);
  if (!t.length) return '';
  const kg = Math.max(0, ...t.map(x => nombre(x.kg)));
  return pluriel(t.length, 'série') + (kg ? ' · ' + fmtN(kg) + ' kg' : '');
}

/** « faite hier », « il y a 3 jours », « pas encore faite » (ligne d'une carte de routine). */
export function quand(t, maintenant = Date.now()) {
  if (!t) return 'pas encore faite';
  const j = joursEntre(t, maintenant);
  return j <= 0 ? 'faite aujourd’hui' : j === 1 ? 'faite hier' : 'il y a ' + j + ' jours';
}

/** « Pas faite depuis 8 jours » (carte « À faire aujourd'hui »). */
export function depuis(t, maintenant = Date.now()) {
  if (!t) return 'Jamais faite';
  const j = joursEntre(t, maintenant);
  return j <= 0 ? 'Faite aujourd’hui' : j === 1 ? 'Faite hier' : 'Pas faite depuis ' + j + ' jours';
}

/**
 * La routine à proposer : celle faite il y a le plus longtemps (une routine jamais faite d'abord).
 * @param {Array<number|null>} dernieres date de la dernière séance de chaque routine
 * @returns {number} sa position, ou -1 sans routine
 */
export function suggestion(dernieres) {
  let k = -1,
    min = Infinity;
  dernieres.forEach((t, i) => {
    const v = t || -Infinity;
    if (v < min) {
      min = v;
      k = i;
    }
  });
  return k;
}
