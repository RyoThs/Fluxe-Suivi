/* Fluxe Suivi — Sauvegarde en ligne (facultative) : compte, envoi et réception des séances.
   Principe :
   - Le téléphone reste la référence : l'app marche exactement pareil sans compte et sans réseau.
   - Chaque séance TERMINÉE est envoyée en ligne (la séance en cours, jamais). Une séance modifiée est renvoyée
     (sa date de modification « mod » augmente) ; une séance supprimée laisse une marque « supprimée » en ligne,
     pour disparaître aussi des autres appareils (elle va alors dans leur corbeille, récupérable 30 jours).
   - Routines, salles, notes, temps de repos et muscles des exercices perso voyagent ensemble (« meta ») :
     la version la plus récente gagne (muscles perso, pesées, mensurations et récompenses sont réunis, jamais effacés).
   - Sans réseau, rien n'est perdu : l'envoi part tout seul quand la connexion revient.
   Le pont vers Firebase (../lib/nuage-firebase.js) n'est téléchargé que si un compte est utilisé.
   Ce que l'app retient du compte (identifiant, ce qui a déjà été envoyé) est rangé à part, sous « fluxe-suivi-nuage-v1 » :
   ce n'est jamais dans le fichier de sauvegarde. */
import {FIREBASE} from './nuage-config.js';
import {S, save, surSave} from './etat.js';
import {norm} from './outils.js';
import {demander, pastilles} from './dialogue.js';
import {snap} from './versions.js';
import {fusionner, metaDe, modDe} from './nuage-fusion.js';
import {texteErreur} from './nuage-messages.js';
export {texteErreur};

const neuf = (u = {}) => ({
  uid: u.uid || null,
  email: u.email || '',
  verifie: u.verifie === true,
  envoye: {},
  metaMod: 0,
  metaEnvoye: 0,
  metaHash: '',
  dernier: 0,
  dernierT: 0,
});
function lireEtat() {
  try {
    const o = JSON.parse(localStorage.getItem('fluxe-suivi-nuage-v1'));
    if (o && typeof o === 'object' && o.envoye && typeof o.envoye === 'object') return Object.assign(neuf(), o);
  } catch (e) {}
  return neuf();
}
function ecrireEtat() {
  try {
    localStorage.setItem('fluxe-suivi-nuage-v1', JSON.stringify(E));
  } catch (e) {}
}
let E = lireEtat(),
  api = null;

/* ===== État affiché (carte « Sauvegarde en ligne ») ===== */
export const etat = {statut: E.uid ? 'ok' : 'off', msg: '', attente: 0, occupe: false};
const ecouteurs = [];
export function surNuage(f) {
  ecouteurs.push(f);
}
function maj(o) {
  Object.assign(etat, o);
  ecouteurs.forEach(f => {
    try {
      f(o);
    } catch (e) {}
  });
}
export const disponible = () => !!(FIREBASE || window.__fxNuageFaux);
export const connecte = () => !!E.uid;
export const compte = () => E.email || '';
export const dernierEnvoi = () => E.dernier || 0;
export const verifie = () => E.verifie === true;

async function charger() {
  if (api) return api;
  if (window.__fxNuageFaux) api = window.__fxNuageFaux; /* tests automatiques : faux serveur */
  else {
    const m = await import('../lib/nuage-firebase.js');
    api = await m.creer(FIREBASE);
  }
  return api;
}

/* ===== Ce qu'il reste à envoyer ===== */
function aEnvoyer() {
  const out = [],
    ici = new Set();
  for (const s of S.sessions) {
    ici.add(s.id);
    if (s.id === S.current || s.edit) continue;
    if (E.envoye[s.id] !== modDe(s)) out.push(s);
  }
  const suppr = Object.keys(E.envoye).filter(id => !ici.has(id));
  const mh = JSON.stringify(metaDe(S));
  if (mh !== E.metaHash) {
    E.metaHash = mh;
    E.metaMod = Date.now();
    ecrireEtat();
  }
  return {out, suppr, meta: E.metaMod > E.metaEnvoye};
}
export const enAttente = () => {
  if (!E.uid) return 0;
  const a = aEnvoyer();
  return a.out.length + a.suppr.length + (a.meta ? 1 : 0);
};

/* ===== Un tour de synchronisation : recevoir, puis envoyer ===== */
const horsLigne = e =>
  !navigator.onLine ||
  (e &&
    (e.code === 'unavailable' ||
      e.code === 'auth/network-request-failed' ||
      /network|fetch|offline/i.test(String(e.message || ''))));
let enCours = null,
  encore = false;
export function synchro() {
  if (!E.uid) return Promise.resolve();
  if (enCours) {
    encore = true;
    return enCours;
  }
  enCours = (async () => {
    try {
      do {
        encore = false;
        await tour();
      } while (encore);
    } finally {
      enCours = null;
    }
  })();
  return enCours;
}
async function tour() {
  if (!navigator.onLine) {
    maj({statut: 'horsligne', attente: enAttente()});
    return;
  }
  maj({statut: 'envoi'});
  try {
    await charger();
    const uid = E.uid,
      r = await api.lire(uid, E.dernierT);
    if (E.uid !== uid) return; /* déconnecté pendant l'envoi */
    const chg = fusionner(r, E);
    const a = aEnvoyer();
    if (a.out.length || a.suppr.length || a.meta) {
      const metaMod = E.metaMod,
        now = Date.now();
      await api.ecrire(uid, {
        sessions: a.out.map(s => ({id: s.id, mod: modDe(s), j: JSON.stringify(s)})),
        suppr: a.suppr.map(id => ({id, mod: now})),
        meta: a.meta ? {mod: metaMod, j: JSON.stringify(metaDe(S))} : null,
      });
      if (E.uid !== uid) return;
      a.out.forEach(s => {
        E.envoye[s.id] = modDe(s);
      });
      a.suppr.forEach(id => {
        delete E.envoye[id];
      });
      if (a.meta) E.metaEnvoye = metaMod;
    }
    E.dernier = Date.now();
    ecrireEtat();
    if (chg) save();
    maj({statut: 'ok', msg: '', attente: enAttente(), recu: chg});
  } catch (e) {
    if (horsLigne(e)) maj({statut: 'horsligne', attente: enAttente()});
    else maj({statut: 'erreur', msg: texteErreur(e)});
  }
}

/* ===== Compte ===== */
const verifier = (email, mdp) => {
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw {code: 'auth/invalid-email'};
  if (mdp !== undefined && String(mdp).length < 8) throw {code: 'auth/weak-password'};
};
async function occupe(f) {
  if (etat.occupe) return false;
  maj({occupe: true, msg: ''});
  try {
    return await f();
  } catch (e) {
    maj({msg: texteErreur(e)});
    return false;
  } finally {
    maj({occupe: false});
  }
}
export const inscrire = (email, mdp) =>
  occupe(async () => {
    verifier(email, mdp);
    await charger();
    return brancher(await api.inscrire(email, mdp));
  });
export const connecter = (email, mdp) =>
  occupe(async () => {
    verifier(email, mdp);
    await charger();
    return brancher(await api.connecter(email, mdp));
  });
/* adresse e-mail : renvoyer l'e-mail de vérification, ou vérifier si c'est fait */
export const renvoyer = () =>
  occupe(async () => {
    await charger();
    try {
      await api.renvoyer();
    } catch (e) {
      if (e && e.code === 'auth/too-many-requests') throw {code: 'renvoi-trop-tot'};
      throw e;
    }
    return true;
  });
export const reverifier = () =>
  occupe(async () => {
    await charger();
    const u = await api.recharger();
    if (u && u.uid === E.uid) {
      E.verifie = u.verifie;
      ecrireEtat();
    }
    maj({});
    return E.verifie;
  });
export const oublie = email =>
  occupe(async () => {
    verifier(email);
    await charger();
    await api.oublie(email);
    return true;
  });

/* Première connexion sur ce téléphone : on réunit (ou non) les séances d'ici et celles du compte */
async function brancher(u) {
  const r = await api.lire(u.uid, 0);
  const enLigne = r.sessions.filter(d => !d.del).length,
    ici = S.sessions.filter(s => s.id !== S.current).length;
  let choix = 'ok';
  if (enLigne && ici) {
    choix = await demander({
      icone: 'fichier',
      ton: 'bleu',
      titre: 'Séances ici et en ligne',
      texte: 'Tu as déjà des séances sur ce téléphone et dans ton compte.',
      corps:
        pastilles([ici + ' séance' + (ici > 1 ? 's' : '') + ' ici', enLigne + ' en ligne']) +
        '<p style="margin-top:10px">Une version de secours de ce téléphone est créée juste avant, au cas où.</p>',
      ok: 'Tout réunir (rien n’est effacé)',
      non: 'Garder seulement celles en ligne',
      lien: 'Annuler',
    });
    if (choix !== 'ok' && choix !== 'non') {
      try {
        await api.deconnecter();
      } catch (e) {}
      return false;
    }
  }
  if (ici) await snap('nuage');
  const avant = {routines: S.routines.slice(), gyms: S.gyms.slice()};
  E = neuf(u);
  if (choix === 'non') S.sessions = S.sessions.filter(s => s.id === S.current);
  fusionner(r, E);
  if (choix === 'ok') {
    /* réunir aussi les routines et les salles de ce téléphone */
    for (const x of avant.routines) if (!S.routines.some(y => norm(y.name) === norm(x.name))) S.routines.push(x);
    for (const g of avant.gyms) if (!S.gyms.some(y => y.id === g.id) && S.gyms.length < 20) S.gyms.push(g);
  }
  ecrireEtat();
  save();
  maj({statut: 'envoi', msg: '', recu: true});
  await synchro();
  return true;
}
export async function deconnecter() {
  try {
    await charger();
    await api.deconnecter();
  } catch (e) {}
  const em = E.email;
  E = neuf();
  E.email = em;
  ecrireEtat();
  maj({statut: 'off', msg: '', attente: 0});
}
export const supprimerCompte = mdp =>
  occupe(async () => {
    await charger();
    await api.supprimerCompte(mdp);
    E = neuf();
    ecrireEtat();
    maj({statut: 'off', msg: '', attente: 0});
    return true;
  });

/* ===== Rapport d'erreurs : une erreur de l'app envoyée au créateur (voir erreurs.js) ===== */
export async function signaler(doc) {
  if (!E.uid || !navigator.onLine) return false;
  try {
    await charger();
    await api.signaler(E.uid, doc);
    return true;
  } catch (e) {
    return false;
  }
}

/* ===== Catalogue partagé (v3.8) : écrire demande un compte connecté ET vérifié ===== */
export async function partager(f) {
  if (!E.uid) throw {code: 'fx/sans-compte'};
  if (!E.verifie) throw {code: 'fx/non-verifie'};
  await charger();
  return f(api, E.uid);
}

/* ===== Compteur anonyme (v3.15) : lecture réservée au compte du créateur (admins/{uid} dans la base) ===== */
export async function avecCompte(f) {
  if (!E.uid) return null;
  await charger();
  return f(api, E.uid);
}

/* ===== Quand synchroniser ===== */
let minuteur = 0,
  dernierRegard = 0;
surSave(() => {
  if (!E.uid) return;
  clearTimeout(minuteur);
  minuteur = setTimeout(() => {
    if (enAttente()) synchro();
  }, 2500);
});
window.addEventListener('online', () => {
  if (E.uid) synchro();
});
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible' && E.uid && Date.now() - dernierRegard > 30000) {
    dernierRegard = Date.now();
    synchro();
  }
});
/* au démarrage : vérifier que la connexion tient toujours, puis synchroniser */
export async function demarrerNuage() {
  if (!E.uid || !disponible()) return;
  if (!navigator.onLine) {
    maj({statut: 'horsligne', attente: enAttente()});
    return;
  }
  try {
    await charger();
    const u = await api.pret();
    if (!u || u.uid !== E.uid) {
      const em = E.email;
      E = neuf();
      E.email = em;
      ecrireEtat();
      maj({statut: 'off', msg: 'Ta connexion a expiré : reconnecte-toi.'});
      return;
    }
    if (!E.verifie) {
      try {
        const v = await api.recharger();
        if (v && v.uid === E.uid && v.verifie) {
          E.verifie = true;
          ecrireEtat();
        }
      } catch (e) {}
    }
    dernierRegard = Date.now();
    await synchro();
  } catch (e) {
    maj(horsLigne(e) ? {statut: 'horsligne', attente: enAttente()} : {statut: 'erreur', msg: texteErreur(e)});
  }
}
