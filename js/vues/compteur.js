/* Fluxe Suivi — Écran « Compteur » (v3.15.0) : visible SEULEMENT avec le compte du créateur.
   Le compte du créateur a une fiche admins/{son uid} dans la base (créée à la main dans la console Firebase) ;
   les règles de la base refusent la lecture du compteur à tous les autres comptes.
   Montre : personnes avec au moins 1 séance cette semaine, iPhone / Android, 8 dernières semaines, objectif 300. */
import {esc} from '../outils.js';
import {avecCompte, compte, connecte} from '../nuage.js';
import {dernieresSemaines, nettoyerTotal} from '../compteur.js';

const OBJECTIF = 300; /* étape 2 du plan : environ 300 personnes par semaine */
let admin = {pour: '', oui: false, demande: false}; /* réponse mémorisée pour le compte connecté */
let donnees = null; /* null = en cours, 'erreur', ou la liste des 8 semaines */

/** Le compte connecté est-il celui du créateur ? Première fois : demande au serveur, puis redessine. */
function estAdmin(redessiner) {
  if (!connecte()) return false;
  const c = compte();
  if (admin.pour !== c) admin = {pour: c, oui: false, demande: false};
  if (!admin.demande) {
    admin.demande = true;
    avecCompte((api, uid) => api.estAdmin(uid))
      .then(oui => {
        if (oui && admin.pour === c) {
          admin.oui = true;
          redessiner();
        }
      })
      .catch(() => {
        admin.demande = false; /* sans réseau : on redemandera au prochain affichage */
      });
  }
  return admin.oui;
}

/** Bouton en bas du Guide : rien du tout pour les autres comptes. */
export function boutonCompteur(redessiner) {
  return estAdmin(redessiner)
    ? `<p style="text-align:center;margin-top:18px"><button class="sec" data-act="compteur">Compteur</button></p>`
    : '';
}

/** Relit les 8 dernières semaines, puis redessine le panneau. */
export function chargerCompteur(redessiner) {
  donnees = null;
  avecCompte(api => api.lireCompteur(dernieresSemaines(8)))
    .then(l => (donnees = Array.isArray(l) ? l.map(nettoyerTotal) : 'erreur'))
    .catch(() => (donnees = 'erreur'))
    .finally(redessiner);
}

const total = w => w.ios + w.android + w.autre;
export function panneauCompteur() {
  if (donnees === null) return `<div id="cpt"><p class="sub">Lecture du compteur…</p></div>`;
  if (donnees === 'erreur')
    return `<div id="cpt"><p class="sub">Impossible de lire le compteur pour l’instant (pas de réseau ?). Réessaie plus tard.</p></div>`;
  const w = donnees[donnees.length - 1] || nettoyerTotal(null),
    n = total(w),
    max = Math.max(1, ...donnees.map(total)),
    pc = Math.min(100, Math.round((n / OBJECTIF) * 100));
  const barres = donnees
    .map(
      (x, i) =>
        `<i style="height:${Math.max(4, Math.round((total(x) / max) * 100))}%" class="${i === donnees.length - 1 ? 'on' : ''}" title="${esc(x.semaine)} : ${total(x)}"></i>`
    )
    .join('');
  const autre = w.autre ? ` · Autre ${w.autre}` : '';
  return `<div id="cpt">
<div class="card" style="text-align:center"><div class="hist-date" style="justify-content:center">Cette semaine</div><div class="big">${n}</div>
<div class="mu">personnes avec au moins 1 séance</div><div class="mu">iPhone ${w.ios} · Android ${w.android}${autre}</div></div>
<div class="card"><div class="hist-date">8 dernières semaines</div><div class="bars">${barres}</div></div>
<div class="card"><div class="hist-date">Objectif étape 2 : ${OBJECTIF}</div><div class="jauge"><b style="width:${pc}%"></b></div>
<div class="mu">${n} / ${OBJECTIF} · ${pc} %</div></div>
<p class="note">Total anonyme : un « +1 » par téléphone à sa première séance de la semaine. Une personne avec 2 téléphones compte 2 fois.</p></div>`;
}
