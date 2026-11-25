/* Fluxe Suivi — Compteur anonyme (v3.15.0) : envoi du « +1 » de la semaine.
   - Après chaque enregistrement, au démarrage et au retour du réseau : si une séance a été terminée cette semaine
     et que ce téléphone n'a pas encore été compté cette semaine, on ajoute 1 au total de la semaine.
   - Seule la semaine déjà comptée est gardée sur le téléphone (pour ne compter qu'une fois) : aucun numéro.
   - Sans réseau ou en cas de panne : rien ne s'affiche, on réessaiera plus tard. Jamais d'erreur pour l'utilisateur.
   - Pas de comptage pendant les essais sur l'ordinateur (adresse locale), sauf avec le faux serveur des tests. */
import {FIREBASE} from './nuage-config.js';
import {S, surSave} from './etat.js';
import {aCompter, plateforme} from './compteur.js';

const faux = () => window.__fxNuageFaux;
const local = () => /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname);
function deja() {
  try {
    return localStorage.getItem('fluxe-suivi-compteur-v1');
  } catch (e) {
    return null;
  }
}
let enCours = false;

export async function compter() {
  if (enCours || !navigator.onLine) return;
  const sem = aCompter(S.sessions || [], deja(), S.current);
  if (!sem || !(faux() || (FIREBASE && !local()))) return;
  enCours = true;
  try {
    const plat = plateforme(navigator.userAgent, navigator.maxTouchPoints || 0);
    if (faux()) await faux().compter(sem, plat);
    else await (await import('../lib/nuage-firebase.js')).compter(FIREBASE, sem, plat);
    try {
      localStorage.setItem('fluxe-suivi-compteur-v1', sem);
    } catch (e) {}
  } catch (e) {
    /* pas de réseau ou panne : on réessaiera au prochain enregistrement, démarrage ou retour du réseau */
  } finally {
    enCours = false;
  }
}

surSave(() => setTimeout(compter, 0));
window.addEventListener('online', compter);
