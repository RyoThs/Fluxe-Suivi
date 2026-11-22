/* Fluxe Suivi — Catalogue partagé par club (v3.8.0) : échanges avec le serveur.
   - Lire (clubs, avis) : SANS compte (lecture publique par la bibliothèque Firebase, chargée seulement pour une salle reliée).
   - Écrire (créer un club, donner son avis) : avec un compte vérifié (nuage.js → partager).
   Tout ce qui arrive du serveur est nettoyé (club.js) avant d'être utilisé.
   Les dernières lectures sont gardées dans le téléphone : la liste reste visible hors ligne. */
import {FIREBASE} from './nuage-config.js';
import {partager} from './nuage.js';
import {depuisServeur, idAvis, nettoyerAvis, nettoyerClub} from './club.js';

const faux = () => window.__fxNuageFaux; /* tests automatiques : faux serveur */
let memo = null; /* copie en mémoire (évite de relire le téléphone à chaque dessin) */
function cache() {
  if (memo) return memo;
  try {
    const o = JSON.parse(localStorage.getItem('fluxe-suivi-clubs-v1'));
    if (o && typeof o === 'object' && Array.isArray(o.clubs) && o.avis && typeof o.avis === 'object') return (memo = o);
  } catch (e) {}
  return (memo = {clubs: [], avis: {}});
}
function garder(o) {
  memo = o;
  try {
    localStorage.setItem('fluxe-suivi-clubs-v1', JSON.stringify(o));
  } catch (e) {}
}

/* lecture publique d'une collection (3 000 documents au plus ; 500 avec un filtre) */
async function lireTout(chemin, filtre) {
  if (!FIREBASE) return [];
  const m = await import('../lib/nuage-firebase.js');
  return depuisServeur(await m.lirePublic(FIREBASE, chemin, filtre));
}

/** Clubs d'une enseigne (les derniers connus si le réseau ne répond pas). */
export async function listerClubs(enseigne) {
  const c = cache();
  try {
    const e = enseigne || 'autre';
    const brut = faux() && faux().listerClubs ? await faux().listerClubs() : await lireTout('clubs', ['e', e]);
    /* seuls les clubs de cette enseigne sont relus : on garde ceux des autres enseignes déjà connus */
    const nouveaux = brut.map(nettoyerClub).filter(x => x && x.e === e);
    c.clubs = [...c.clubs.filter(x => x.e !== e), ...nouveaux].slice(0, 3000);
    garder(c);
  } catch (e) {}
  return c.clubs.filter(x => x.e === (enseigne || 'autre')).sort((a, b) => a.n.localeCompare(b.n, 'fr'));
}

/** Avis d'un club. Sans réseau : les derniers connus. */
export async function lireAvis(club) {
  const c = cache();
  try {
    const brut = faux() && faux().lireAvis ? await faux().lireAvis(club) : await lireTout(`clubs/${club}/avis`);
    c.avis[club] = brut.map(nettoyerAvis).filter(Boolean).slice(0, 3000);
    garder(c);
  } catch (e) {}
  return c.avis[club] || [];
}
/** Avis déjà connus (sans attendre le réseau). */
export const avisConnus = club => cache().avis[club] || [];

/** Crée un club (compte vérifié). Renvoie son identifiant. */
export const creerClub = d => partager((api, uid) => api.creerClub(uid, {n: d.n, e: d.e, v: d.v}));

/** Donne son avis sur une machine (compte vérifié). Il remplace l'éventuel avis précédent sur la même machine. */
export const donnerAvis = (club, a) => partager((api, uid) => api.ecrireAvis(uid, club, idAvis(a.m, uid), a));

/* relit les avis d'un club au plus une fois par minute, puis prévient (pour redessiner) */
const vus = Object.create(null);
export function rafraichir(club, apres) {
  if (!club || Date.now() - (vus[club] || 0) < 60000) return;
  vus[club] = Date.now();
  lireAvis(club).then(apres, () => {});
}
/* force la prochaine lecture (après un avis donné) */
export function oublier(club) {
  delete vus[club];
}
