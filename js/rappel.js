/* Fluxe Suivi — Rappel de sauvegarde : séances pas encore dans un fichier. */
import {S, done} from './etat.js';
import {esc, fmtDate} from './outils.js';
import {ico} from './pictos.js';
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
export function backupCard() {
  if (!bkDue() || Date.now() - (S.snooze || 0) < 1728e5 || enLigneAJour()) return '';
  const u = unsaved();
  return `<div class="card bkc"><div class="hist-date">${ico('bouclier')}Pense à sauvegarder</div><div class="mu">${u > 1 ? u + ' séances ne sont' : '1 séance n’est'} que sur ce téléphone. ${S.lastBackup ? 'Dernier fichier : ' + esc(fmtDate(S.lastBackup)) + '.' : 'Tu n’as encore jamais fait de fichier.'} Si le téléphone est perdu, le fichier est le seul moyen de les retrouver.</div><div class="dat"><button class="btn" data-act="file">Sauvegarder</button><button class="sec" data-act="snz">Plus tard</button></div></div>`;
}
