/* Fluxe Suivi — Rapport d'erreurs.
   L'app note toute seule chaque erreur (écran qui ne s'affiche pas, bouton qui plante…) dans un petit journal
   gardé sur le téléphone : 30 jours, 50 erreurs au plus. Une même erreur répétée est comptée, pas recopiée.
   Envoi au créateur de l'app :
   - avec un compte « Sauvegarde en ligne » et la case cochée : automatiquement, dans Firebase (dossier « erreurs »),
     20 envois par jour au plus ;
   - sans compte : rien ne part tout seul, le bouton « Envoyer par e-mail » prépare un message à relire.
   Ce qui est envoyé : le message d'erreur, l'endroit du code, la version de l'app, le type de téléphone.
   Jamais les séances, ni le mot de passe, ni l'adresse e-mail. */
import {VER} from './config.js';
import {connecte, signaler, surNuage} from './nuage.js';

const JOUR = 864e5,
  MAX = 50,
  PAR_JOUR = 20;
function lire() {
  try {
    const o = JSON.parse(localStorage.getItem('fluxe-suivi-erreurs-v1'));
    if (o && typeof o === 'object' && Array.isArray(o.liste)) return o;
  } catch (e) {}
  return {liste: [], envoi: true, envois: {}};
}
let J = lire();
function ecrire() {
  try {
    localStorage.setItem('fluxe-suivi-erreurs-v1', JSON.stringify(J));
  } catch (e) {}
}
const ecouteurs = [];
export function surErreur(f) {
  ecouteurs.push(f);
}
const prevenir = () =>
  ecouteurs.forEach(f => {
    try {
      f();
    } catch (e) {}
  });

/* Type de téléphone, en clair (sans rien d'identifiant) */
export function appareil(ua = navigator.userAgent) {
  let m;
  const inst = window.matchMedia && window.matchMedia('(display-mode: standalone)').matches ? ' · app installée' : '';
  if ((m = ua.match(/iPhone OS (\d+)[_.](\d+)/))) return 'iPhone, iOS ' + m[1] + '.' + m[2] + inst;
  if ((m = ua.match(/iPad.*OS (\d+)[_.](\d+)/))) return 'iPad, iOS ' + m[1] + '.' + m[2] + inst;
  if ((m = ua.match(/Android (\d+)/))) return 'Android ' + m[1] + inst;
  if (/Windows/.test(ua)) return 'Ordinateur Windows' + inst;
  if (/Macintosh/.test(ua)) return 'Mac' + inst;
  return 'Autre appareil' + inst;
}
/* Endroit du code : le premier fichier de l'app dans la pile (ex. js/vues/stats.js:42) */
function endroit(e) {
  const pile = String((e && e.stack) || '');
  const m = pile.match(/(?:js|lib)\/[\w/.-]+\.js(?:\?[^:\s)]*)?:\d+(?::\d+)?/);
  return m ? m[0].replace(/\?[^:]*/, '') : '';
}
const texte = (v, n) =>
  String(v == null ? '' : v)
    .replace(/[\u0000-\u001f\u007f]/g, ' ')
    .trim()
    .slice(0, n);

/* Noter une erreur. titre = ce que faisait l'app, en clair (ex. « Impossible d'afficher les Stats ») */
export function noter(e, titre) {
  try {
    if (e && e.__fxNote) return; /* déjà notée */
    if (e && typeof e === 'object') e.__fxNote = true;
    const msg = texte((e && (e.message || e.reason)) || e || 'Erreur inconnue', 300),
      ou = texte(endroit(e), 120),
      t = Date.now();
    const titreOk = texte(titre || 'Erreur dans l’app', 120);
    J.liste = J.liste.filter(x => t - x.t < 30 * JOUR);
    const meme = J.liste.find(x => x.msg === msg && x.ou === ou && x.titre === titreOk && x.ver === VER);
    if (meme) {
      meme.n = (meme.n || 1) + 1;
      meme.t = t;
    } else {
      J.liste.unshift({t, titre: titreOk, msg, ou, ver: VER, app: appareil(), n: 1});
      if (J.liste.length > MAX) J.liste.length = MAX;
    }
    ecrire();
    prevenir();
    envoyer();
  } catch (x) {
    /* le rapport d'erreurs ne doit jamais casser l'app */
  }
}

/* ===== Lecture pour la carte ===== */
export const erreurs = () => J.liste.filter(x => Date.now() - x.t < 30 * JOUR);
export const recentes = () => erreurs().filter(x => Date.now() - x.t < 7 * JOUR);
export const envoiAuto = () => J.envoi !== false;
export function setEnvoiAuto(v) {
  J.envoi = !!v;
  ecrire();
  if (v) envoyer();
}
export function effacer() {
  J.liste = [];
  ecrire();
  prevenir();
}
/* Lien « Envoyer par e-mail » (message prérempli, que la personne relit avant d'envoyer) */
export function lienMail() {
  const l = erreurs().slice(0, 10);
  const corps =
    'Bonjour,\n\nVoici le rapport d’erreurs de Fluxe Suivi :\n\n' +
    l
      .map(
        x =>
          '- ' +
          new Date(x.t).toLocaleString('fr-FR') +
          ' · ' +
          x.titre +
          (x.n > 1 ? ' (×' + x.n + ')' : '') +
          '\n  ' +
          x.msg +
          (x.ou ? ' [' + x.ou + ']' : '') +
          '\n  v' +
          x.ver +
          ' · ' +
          x.app
      )
      .join('\n') +
    '\n\n(Message préparé par l’app. Aucune séance n’est incluse.)';
  return (
    'mailto:fluxe.suivi@outlook.fr?subject=' +
    encodeURIComponent('Rapport d’erreurs Fluxe Suivi') +
    '&body=' +
    encodeURIComponent(corps.slice(0, 1800))
  );
}

/* ===== Envoi automatique (compte connecté, case cochée) ===== */
let enCours = false;
export async function envoyer() {
  if (enCours || !envoiAuto() || !connecte() || !navigator.onLine) return;
  enCours = true;
  try {
    const jour = new Date().toISOString().slice(0, 10);
    J.envois = J.envois && J.envois[jour] !== undefined ? {[jour]: J.envois[jour]} : {[jour]: 0};
    for (const x of J.liste) {
      if (x.envoye === x.n) continue;
      if (J.envois[jour] >= PAR_JOUR) break;
      const ok = await signaler({titre: x.titre, msg: x.msg, ou: x.ou, ver: x.ver, app: x.app, n: x.n, quand: x.t});
      if (!ok) break;
      x.envoye = x.n;
      J.envois[jour]++;
      ecrire();
    }
    prevenir();
  } catch (e) {
  } finally {
    enCours = false;
  }
}

/* Toute erreur non prévue de l'app */
window.addEventListener('error', ev => {
  if (ev && ev.error) noter(ev.error);
  else if (ev && ev.message) noter({message: ev.message, stack: (ev.filename || '') + ':' + (ev.lineno || 0)});
});
window.addEventListener('unhandledrejection', ev => noter(ev && ev.reason, 'Une action n’a pas abouti'));
/* dès que la sauvegarde en ligne est prête : envoyer ce qui attend */
surNuage(o => {
  if (o && o.statut === 'ok') envoyer();
});
