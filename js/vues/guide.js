/* Fluxe Suivi — Écran Guide « ? » : catalogue de machines PAR ENSEIGNE et carte Ma salle.
   - Sans salle : on choisit son enseigne (cartes), puis toutes ses machines sont cochées d'office.
   - Avec une salle : interrupteur « Catalogue <enseigne> | Ma salle », rangée de muscles, liste rangée par muscle.
   Réglages de l'écran :
   - gv : la vue → 'cat' (tout le catalogue de l'enseigne) ou 'salle' (seulement les machines cochées)
   - gm : le muscle → 'Tous' ou un muscle (Pectoraux, Dos…)
   - gq : le texte recherché */
import {VER} from '../config.js';
import {CHAINS, LIB, M, catOf} from '../catalogue.js';
import {S} from '../etat.js';
import {esc, norm} from '../outils.js';
import {catCur, catName, chainOf, gymCur, inGym, vis} from '../salle.js';
import {thumb} from '../icones.js';
import {ico} from '../pictos.js';
import {badgeVerifiee, bilanSalle, boutonSignaler, encartClub} from './club.js';
import {rafraichir} from '../club-reseau.js';
import {boutonCompteur} from './compteur.js';

export let gq = '',
  gm = 'Tous',
  gv = 'cat';
export function setGq(v) {
  gq = v;
}
export function setGm(v) {
  gm = M.includes(v) ? v : 'Tous';
}
export function setGv(v) {
  gv = v === 'salle' ? 'salle' : 'cat';
}

const L = Object.fromEntries(LIB.map(x => [x[0], x]));
const pluriel = (n, mot) => n + ' ' + mot + (n > 1 ? 's' : '');

/* Cartes « Ton enseigne » : utilisées dans le Guide (sans salle) et dans le panneau « Nouvelle salle / Changer » */
export function ensCards(actuelle) {
  const carte = (id, nom, detail, nb) =>
    `<button class="${id === actuelle ? 'on' : ''}" data-act="gens" data-t="${esc(id)}"><b>${id === 'on-air' ? ico('etoile') : ''}${esc(nom)}</b><span>${esc(detail)}</span><em>${pluriel(nb, 'machine')}</em></button>`;
  return `<div class="ens">${CHAINS.map(c => carte(c.id, c.name, c.brands, catOf(c).length)).join('')}${carte('autre', 'Autre salle', 'Toutes les machines de la bibliothèque', catOf(null).length)}</div>
<p class="note">Listes probables, d’après ce que chaque enseigne annonce. Toutes les machines sont cochées au départ : décoche celles que ton club n’a pas.</p>`;
}

/* Une ligne : dessin, nom, muscle, étiquette de marque, et (avec une salle) le bouton ✓ / + ;
   salle reliée à un club (v3.8) : badge « vérifiée » et bouton « … » pour signaler */
let club = null; /* bilan du club de la salle active, calculé à chaque liste */
function row([n, m, tg]) {
  const g = gymCur(),
    on = g && inGym(n);
  const btn = g
    ? `<button class="tg${on ? ' on' : ''}" data-act="gtog" data-n="${esc(n)}" aria-pressed="${!!on}" aria-label="${on ? 'Retirer de' : 'Ajouter à'} ${esc(g.name)} : ${esc(n)}">${on ? '✓' : '+'}</button>`
    : '';
  const verif = club && club.verifiees.has(norm(n)) ? badgeVerifiee() : '';
  return `<div class="gi${on ? ' in' : ''}">${thumb(n, 'lg')}<div class="pt"><b>${esc(n)}${verif}</b><span>${esc(m)}${tg ? ` <em class="mk">${esc(tg)}</em>` : ''}</span></div>${btn}${g ? boutonSignaler(n) : ''}</div>`;
}

/* ligne d'une machine hors bibliothèque : ajoutée par moi (muscle dans S.mu) ou par le club */
function ligne(n) {
  if (L[n]) return L[n];
  const a = club && club.ajoutees.find(x => norm(x.nom) === norm(n)),
    m = (S.mu && S.mu[n]) || (a && a.muscle);
  return m && M.includes(m) ? [n, m, (a && a.marque) || ''] : null;
}

/* Liste rangée par muscle (titres « Pectoraux 19 », « Dos 24 »…) ; si un muscle est choisi, une seule liste */
function parMuscle(l) {
  if (gm !== 'Tous') return l.map(row).join('');
  return M.map(m => {
    const x = l.filter(r => r[1] === m);
    return x.length ? `<h2 class="cg">${m}<small>${x.length}</small></h2>${x.map(row).join('')}` : '';
  }).join('');
}

export function glist() {
  const g = gymCur(),
    q = norm(gq);
  club = g && g.club ? bilanSalle() : null;
  let noms = !g ? LIB.map(x => x[0]) : gv === 'salle' ? g.eq : catCur();
  if (club && gv !== 'salle') {
    noms = noms.filter(n => !club.retirees.has(norm(n)));
    for (const a of club.ajoutees) if (!noms.some(n => norm(n) === norm(a.nom))) noms.push(a.nom);
  }
  const l = noms.map(ligne).filter(r => r && vis(r[0]) && norm(r[0]).includes(q) && (gm === 'Tous' || r[1] === gm));
  if (l.length) return parMuscle(l);
  if (g && gv === 'salle' && !g.eq.length)
    return '<p class="empty">Aucune machine cochée. Va dans le catalogue et touche + sur les machines de ta salle.</p>';
  return '<p class="empty">Aucune machine pour ce choix.</p>';
}

/* Carte de la salle active */
export function gymCard() {
  const g = gymCur();
  if (!g) return '';
  const ch = chainOf(g),
    nb = g.eq.length;
  const autres =
    S.gyms.length > 1
      ? `<div class="chips">${S.gyms.map(x => `<button class="chip${x.id === S.gym ? ' on' : ''}" data-act="gsel" data-id="${esc(x.id)}">${esc(x.name)}</button>`).join('')}</div>`
      : '';
  const lien = g.club
    ? `<div class="mu clien">${ico('valide')}Club partagé : <b>${esc(g.clubNom || g.name)}</b>${(b => (b && b.membres ? ' · ' + pluriel(b.membres, 'membre') + ' ont aidé' : ''))(bilanSalle())}</div>`
    : '';
  return `<div class="card gym"><div class="hist-date">${ico(ch && ch.id === 'on-air' ? 'etoile' : 'salle')}${esc(g.name)}</div>
<div class="mu">${ch && ch.name !== g.name ? esc(ch.name) + ' · ' : ''}${pluriel(nb, 'machine')} cochée${nb > 1 ? 's' : ''} dans ta salle</div>${lien}${autres}
<div class="lk"><button class="del" style="color:var(--accent)" data-act="clien">${g.club ? 'Club' : 'Relier à mon club'}</button><button class="del" style="color:var(--accent)" data-act="gchg" aria-label="Changer d’enseigne">Changer</button><button class="del" style="color:var(--accent)" data-act="gren">Renommer</button><button class="del" style="color:var(--accent)" data-act="gnew">+ Salle</button><button class="del" data-act="gdel">Supprimer</button></div></div>`;
}

/* Interrupteur « Catalogue <enseigne> · n | Ma salle · n » (mis à jour à chaque coche) */
export function segGuide() {
  const g = gymCur();
  if (!g) return '';
  return `<div class="seg" id="gvseg" role="group">${[
    ['cat', catName() + ' · ' + catCur().filter(vis).length],
    ['salle', 'Ma salle · ' + g.eq.length],
  ]
    .map(
      ([v, t]) =>
        `<button class="${gv === v ? 'on' : ''}" data-act="gv" data-v="${v}" aria-pressed="${gv === v}">${esc(t)}</button>`
    )
    .join('')}</div>`;
}

export function viewGuide() {
  const g = gymCur();
  const muscles = `<div class="chips">${['Tous', ...M].map(m => `<button class="chip${gm === m ? ' on' : ''}" data-act="gm" data-m="${esc(m)}">${m === 'Tous' ? 'Tous les muscles' : esc(m)}</button>`).join('')}</div>`;
  const recherche = `<input id="gq" placeholder="Rechercher une machine" value="${esc(gq)}" autocomplete="off" aria-label="Rechercher une machine">`;
  /* bouton « Compteur » : seulement pour le compte du créateur (v3.15), rien pour les autres */
  const majCompteur = () => {
    const el = document.getElementById('gcpt');
    if (el) el.innerHTML = boutonCompteur(majCompteur);
  };
  const pied = `<div class="card astuces"><div class="hist-date">Astuces</div><p class="mu">Pendant une séance, touche le numéro d’une série pour la marquer comme échauffement (É) : elle ne compte pas dans tes records ni dans ton volume.</p><p class="mu">Glisse un exercice vers la gauche pour le remplacer ou le supprimer.</p></div><div id="gcpt">${boutonCompteur(majCompteur)}</div><p class="mu" style="text-align:center;margin-top:18px">Fluxe v${VER}</p>`;
  if (!g)
    return `<h1>Ton enseigne</h1><p class="sub">Choisis ta salle de sport : tu verras uniquement ses machines.</p>${ensCards()}
<h2>Toutes les machines</h2>${recherche}${muscles}<div id="gl">${glist()}</div>${pied}`;
  /* salle reliée : relire les avis du club (au plus une fois par minute), puis redessiner la liste */
  if (g.club)
    rafraichir(g.club, () => {
      const el = document.getElementById('gl'),
        c = document.querySelector('.card.gym');
      if (el) el.innerHTML = glist();
      if (c) c.outerHTML = gymCard();
    });
  return `<h1>Guide</h1>${gymCard()}${encartClub()}${segGuide()}${recherche}${muscles}<div id="gl">${glist()}</div>${pied}`;
}
