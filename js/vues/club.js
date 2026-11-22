/* Fluxe Suivi — Catalogue partagé par club (v3.8.0) : encart, ligne de machine et panneaux.
   - Encart « Ta salle est-elle juste ? » (salle reliée) ou « Relie ta salle à ton club » (pas encore reliée).
   - Panneaux : choisir / créer son club, signaler une machine, ajouter une machine vue dans sa salle.
   Tout texte venant du serveur ou de l'utilisateur passe par esc(). */
import {M} from '../catalogue.js';
import {pk} from '../etat.js';
import {esc, norm} from '../outils.js';
import {chainOf, gymCur} from '../salle.js';
import {bilanClub} from '../club.js';
import {avisConnus} from '../club-reseau.js';
import {pic} from '../pictos.js';

const PTS =
  '<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true"><circle cx="5" cy="12" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="19" cy="12" r="1.6"/></svg>';
const GROUPE =
  '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="9" cy="8" r="3"/><path d="M3 20a6 6 0 0 1 12 0"/><circle cx="17" cy="9" r="2.5"/><path d="M16 14.5a5 5 0 0 1 5 5.5"/></svg>';

/* bilan du club de la salle active (avis déjà connus), ou null */
export function bilanSalle() {
  const g = gymCur();
  return g && g.club ? bilanClub(avisConnus(g.club)) : null;
}

/* encart sous la carte de la salle ; « Plus tard » le cache jusqu'au prochain lancement */
const caches = new Set();
export const cacherEncart = id => caches.add(id);
export function encartClub() {
  const g = gymCur();
  if (!g || caches.has(g.id)) return '';
  const [titre, texte, bouton] = g.club
    ? [
        'Ta salle est-elle juste ?',
        'Cette liste est probable. Aide les membres de ton club : signale une machine absente ou ajoute celle que tu as vue.',
        `<button class="cb-p" data-act="cajout">${pic('signet', 16)}Ajouter une machine</button>`,
      ]
    : [
        'Relie ta salle à ton club',
        'Profite des corrections des autres membres de ton club (machines absentes, machines en plus).',
        `<button class="cb-p" data-act="clien">${pic('salle', 16)}Relier à mon club</button>`,
      ];
  return `<div class="cband"><div class="ic">${GROUPE}</div><div><b>${titre}</b><span>${texte}</span><div class="bt">${bouton}<button class="cb-s" data-act="cplustard">Plus tard</button></div></div></div>`;
}

/* ce qu'une ligne de machine ajoute : badge « vérifiée » et bouton « … » */
export const badgeVerifiee = () => `<span class="verif">${pic('coche', 11)}vérifiée</span>`;
export const boutonSignaler = n =>
  `<button class="csig" data-act="csig" data-n="${esc(n)}" aria-label="Signaler ou confirmer : ${esc(n)}">${PTS}</button>`;

/* Liste des clubs de l'enseigne (redessinée seule quand elle arrive du réseau : les champs tapés restent) */
export function listeClubs() {
  const g = gymCur(),
    ch = chainOf(g),
    l = pk && pk.club ? pk.club.liste : null;
  if (l === null) return '<p class="empty">Chargement des clubs…</p>';
  if (!l.length)
    return `<p class="empty">Aucun club ${esc(ch ? ch.name : '')} pour l’instant : crée le tien ci-dessous.</p>`;
  return l
    .map(
      c =>
        `<button class="copt${g && g.club === c.id ? ' on' : ''}" data-act="cchoix" data-id="${esc(c.id)}" data-n="${esc(c.n)}"><b>${esc(c.n)}</b>${c.v ? `<span>${esc(c.v)}</span>` : ''}</button>`
    )
    .join('');
}
/* Panneau « Mon club » : liste des clubs de l'enseigne + création */
export function panneauClub() {
  const g = gymCur();
  return `<div class="cpan"><p class="sb">Choisis ton club : tu profites des corrections des autres membres.</p><div id="clist">${listeClubs()}</div>
<h2>Créer mon club</h2>
<label class="cf" for="cl-n">Nom du club</label><input class="note" id="cl-n" maxlength="60" value="${esc(g ? g.name : '')}">
<label class="cf" for="cl-v">Ville</label><input class="note" id="cl-v" maxlength="40" placeholder="ex. Lyon">
<p class="cnote">${pic('info', 16)}<span>Il faut un compte vérifié (Sauvegarde en ligne) pour créer un club. Les autres membres pourront ensuite le choisir.</span></p>
<button class="btn" data-act="ccree">Créer et relier ma salle</button></div>`;
}

/* Panneau « Signaler » d'une machine */
const CHOIX = [
  ['absent', 'Cette machine n’est pas dans ma salle'],
  ['present', 'Elle est bien là (je confirme)'],
  ['marque', 'Elle existe, mais d’une autre marque'],
  ['nom', 'Le nom ou le muscle est faux'],
];
export function panneauSignaler() {
  const g = gymCur(),
    s = pk.sig;
  const info =
    s.k === 'absent'
      ? 'Elle disparaît de <b>ta</b> liste tout de suite. Pour les autres membres, elle sera retirée quand <b>3 personnes</b> l’auront signalée.'
      : s.k === 'present'
        ? 'Elle est cochée dans <b>ta</b> salle. Avec <b>2 confirmations</b>, elle reçoit le badge « vérifiée ».'
        : 'Ton signalement aide à corriger le catalogue.';
  return `<div class="cpan"><h3>${esc(s.n)}</h3><p class="sb">${esc(g ? g.clubNom || g.name : '')} · qu’est-ce qui ne va pas ?</p>
${CHOIX.map(([k, t]) => `<button class="copt radio${s.k === k ? ' on' : ''}" data-act="csel" data-k="${k}" aria-pressed="${s.k === k}"><i></i>${t}</button>`).join('')}
<p class="cnote">${pic('info', 16)}<span>${info}</span></p>
<button class="btn" data-act="cenv">Envoyer</button></div>`;
}

/* Panneau « Ajouter une machine » */
export function panneauAjout() {
  const g = gymCur();
  return `<div class="cpan"><p class="sb">Vue à ${esc(g ? g.clubNom || g.name : 'ma salle')}</p>
<label class="cf" for="am-n">Nom de la machine</label><input class="note" id="am-n" maxlength="60" placeholder="ex. Presse à cuisses inclinée">
<div class="crow"><div><label class="cf" for="am-b">Marque (si tu la vois)</label><input class="note" id="am-b" maxlength="30" placeholder="ex. Matrix"></div>
<div><label class="cf" for="am-g">Muscle</label><select class="note" id="am-g">${M.filter(m => m !== 'Cardio')
    .map(m => `<option>${esc(m)}</option>`)
    .join('')}</select></div></div>
<p class="cnote">${pic('info', 16)}<span>Elle apparaît tout de suite dans <b>ta</b> salle. Les autres membres la verront quand <b>2 autres personnes</b> l’auront confirmée.</span></p>
<button class="btn" data-act="cajm">Ajouter à ma salle</button></div>`;
}

/* une machine ajoutée (par moi ou par le club) a-t-elle déjà ce nom ? */
export const memeNom = (a, b) => norm(a) === norm(b);
