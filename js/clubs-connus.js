/* Fluxe Suivi — Clubs connus d'avance (v3.9.0) : les salles d'une enseigne sont déjà dans l'app.
   On cherche sa salle (nom, ville ou code postal) au lieu de la créer : pas de doublons, même hors ligne.
   Ces clubs n'existent pas sur le serveur : seuls les avis des membres y sont écrits (clubs/{id}/avis), les règles le permettent.
   Un identifiant ne doit JAMAIS changer (les salles reliées et les avis en dépendent) : on ajoute, on ne renomme pas.
   On Air : 137 clubs en France, DOM-TOM compris (liste publique du site officiel, lue le 2026-11-23 ; 11 clubs à l'étranger écartés).
   Une liste par enseigne dans js/clubs/ (On Air v3.9.0, Basic-Fit v3.10.0 : 903 clubs, Fitness Park v3.11.0 : 379 clubs, L’Orange Bleue v3.12.0 : 389 clubs, Neoness v3.13.0 : 32 clubs, Keepcool v3.14.0 : 244 clubs). */

import ONAIR from './clubs/on-air.js';
import BASICFIT from './clubs/basic-fit.js';
import FITNESSPARK from './clubs/fitness-park.js';
import ORANGEBLEUE from './clubs/orange-bleue.js';
import NEONESS from './clubs/neoness.js';
import KEEPCOOL from './clubs/keepcool.js';

const PAR_ENSEIGNE = {
  'on-air': {prefixe: 'onair-', marque: 'On Air', liste: ONAIR},
  'basic-fit': {prefixe: 'bf-', marque: 'Basic-Fit', liste: BASICFIT},
  'fitness-park': {prefixe: 'fp-', marque: 'Fitness Park', liste: FITNESSPARK},
  'orange-bleue': {prefixe: 'ob-', marque: 'L’Orange Bleue', liste: ORANGEBLEUE},
  neoness: {prefixe: 'neo-', marque: 'Neoness', liste: NEONESS},
  keepcool: {prefixe: 'kc-', marque: 'Keepcool', liste: KEEPCOOL},
};

/**
 * Les clubs connus d'une enseigne : {id, n: nom, e: enseigne, v: ville, cp: code postal, b?: true si pré-ouverture}.
 * @param {string} enseigne identifiant de l'enseigne (catalogue.js)
 * @returns {Array<{id: string, n: string, e: string, v: string, cp: string, b?: true}>}
 */
export function clubsConnus(enseigne) {
  const x = Object.prototype.hasOwnProperty.call(PAR_ENSEIGNE, enseigne) ? PAR_ENSEIGNE[enseigne] : null;
  if (!x) return [];
  return x.liste.map(([id, n, v, cp, b]) => {
    const c = {id: x.prefixe + id, n: x.marque + ' ' + n, e: enseigne, v, cp};
    if (b) c.b = true;
    return c;
  });
}
