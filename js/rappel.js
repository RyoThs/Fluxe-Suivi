/* Fluxe Suivi — Rappel de sauvegarde : séances pas encore dans un fichier. */
import {S, done} from './etat.js';
import {pic} from './pictos.js';
import {connecte, enAttente} from './nuage.js';
/* Avec un compte « Sauvegarde en ligne » à jour, les séances sont déjà à l'abri : plus de rappel de fichier. */
const enLigneAJour = () => connecte() && enAttente() === 0;
/* ===== Rappel de sauvegarde =====
   Le rappel apparaît quand le dernier fichier est trop ancien (délai réglable)
   OU quand 5 séances ou plus ne sont dans aucun fichier. « Plus tard » le cache 2 jours.
   Jamais pour une personne connectée dont tout est envoyé en ligne (le fichier reste possible, mais facultatif). */
function unsaved() {
  const t = S.lastBackup || 0;
  return done().filter(x => (x.mod || x.date) > t).length;
}
function bkDue() {
  const n = Date.now(),
    u = unsaved();
  if (!u) return false;
  return !S.lastBackup || n - S.lastBackup >= (S.bkEvery || 7) * 864e5 || u >= 5;
}
/* point orange du bouton « Sauvegarde » (Historique) : des séances ne sont encore ni dans un fichier ni en ligne */
export const aSauvegarder = () => unsaved() > 0 && !enLigneAJour();
export function bkLine() {
  const u = unsaved();
  if (!done().length) return '';
  if (enLigneAJour()) return '<span class="bk ok">✓ Tout est sauvegardé en ligne</span>';
  return u
    ? `<span class="bk warn">${u} séance${u > 1 ? 's' : ''} pas encore dans un fichier</span>`
    : '<span class="bk ok">✓ Tout est sauvegardé</span>';
}
/* Rappel sur une ligne (v3.18) : point orange, nombre de séances, « Sauvegarder », ✕ = plus tard (2 jours) */
export function backupCard() {
  if (!bkDue() || Date.now() - (S.snooze || 0) < 1728e5 || enLigneAJour()) return '';
  const u = unsaved();
  return `<div class="card bkc" role="status"><span class="d" aria-hidden="true"></span><span class="t"><b>Pense à sauvegarder</b> · ${u > 1 ? u + ' séances seulement' : '1 séance seulement'} sur ce téléphone</span><button class="bkb" data-act="file">Sauvegarder</button><button class="bkx" data-act="snz" aria-label="Plus tard (dans 2 jours)">${pic('croix', 16)}</button></div>`;
}
