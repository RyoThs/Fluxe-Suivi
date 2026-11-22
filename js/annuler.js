/* Fluxe Suivi — Message « … supprimé · Annuler » (v3.7.0) : au lieu d'une question, l'action est faite tout de suite
   et peut être annulée pendant 6 secondes. */
import {esc} from './outils.js';

let retour = null,
  minuterie = 0;
export function proposerAnnuler(message, f) {
  retour = f;
  let z = document.querySelector('#annuler');
  if (!z) {
    z = document.createElement('div');
    z.id = 'annuler';
    z.setAttribute('role', 'status');
    document.body.appendChild(z);
  }
  z.innerHTML = `<span>${esc(message)}</span><button data-act="undo">Annuler</button>`;
  z.classList.add('on');
  clearTimeout(minuterie);
  minuterie = setTimeout(fermerAnnuler, 6000);
}
export function fermerAnnuler() {
  retour = null;
  const z = document.querySelector('#annuler');
  if (z) z.classList.remove('on');
}
export function annulerMaintenant() {
  const f = retour;
  fermerAnnuler();
  if (f) f();
  return !!f;
}
