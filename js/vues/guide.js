/* Fluxe Suivi — Écran « Ma salle » (ancien Guide « ? », renommé en v3.20) : catalogue de machines PAR ENSEIGNE, carte de la salle
   et salle communautaire (les membres du club tiennent la liste à jour).
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
import {catCur, chainOf, gymCur, inGym, vis} from '../salle.js';
import {thumb} from '../icones.js';
import {pic} from '../pictos.js';
import {badgeVerifiee, bilanSalle, boutonSignaler, encadreCommunautaire} from './club.js';
import {menuOuvert} from './historique.js';
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
/* initiales d'une enseigne ou d'une salle : « Basic-Fit » → BF, « L’Orange Bleue » → OB, « Autre salle » → AS */
const initiales = nom =>
  String(nom)
    .replace(/^L[’']/, '')
    .split(/[\s-]+/)
    .filter(Boolean)
    .map(m => m[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

/* Cartes « Ton enseigne » : utilisées dans le Guide (sans salle) et dans le panneau « Nouvelle salle / Changer » */
export function ensCards(actuelle) {
  const carte = (id, nom, detail, nb) =>
    `<button class="${id === actuelle ? 'on' : ''}" data-act="gens" data-t="${esc(id)}"><i class="ini" aria-hidden="true">${esc(initiales(nom))}</i><b>${esc(nom)}</b><span>${esc(detail)}</span><em>${pluriel(nb, 'machine')}</em></button>`;
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

/* Carte de la salle active (v3.20) : initiales, nom, nombre de machines, menu « ··· », puis l'encadré « Salle communautaire » */
export function gymCard() {
  const g = gymCur();
  if (!g) return '';
  const nb = g.eq.length,
    ouvert = menuOuvert() === 'g:' + g.id;
  const autres =
    S.gyms.length > 1
      ? `<div class="chips">${S.gyms.map(x => `<button class="chip${x.id === S.gym ? ' on' : ''}" data-act="gsel" data-id="${esc(x.id)}">${esc(x.name)}</button>`).join('')}</div>`
      : '';
  const menu = ouvert
    ? `<div class="hx-menu" role="menu">${[
        ['gchg', 'retour', 'Changer d’enseigne'],
        ['gren', 'crayon', 'Renommer'],
        ['gnew', 'salle', '+ Nouvelle salle'],
        ['gdel', 'corbeille', 'Supprimer cette salle'],
      ]
        .map(
          ([a, i, t]) =>
            `<button role="menuitem" data-act="${a}"${a === 'gdel' ? ' class="r"' : ''}>${pic(i, 18)}${t}</button>`
        )
        .join('')}</div>`
    : '';
  return `<div class="card gym gz-c"><div class="gz-top"><span class="gz-ini" aria-hidden="true">${esc(initiales(g.name))}</span><div class="gz-n"><b>${esc(g.name)}</b><span>${pluriel(nb, 'machine')} dans ta salle${g.club ? '' : ' · liste de départ probable'}</span></div><button class="hx-m" data-act="gmenu" aria-haspopup="menu" aria-expanded="${ouvert}" aria-label="Gérer la salle ${esc(g.name)}">${pic('points', 20)}</button></div>${menu}${autres}${encadreCommunautaire()}</div>`;
}

/* Interrupteur « Catalogue <enseigne> · n | Ma salle · n » (mis à jour à chaque coche) */
export function segGuide() {
  const g = gymCur();
  if (!g) return '';
  return `<div class="seg" id="gvseg" role="group">${[
    ['cat', (chainOf(g) ? 'Catalogue' : 'Toutes les machines') + ' · ' + catCur().filter(vis).length],
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
  const recherche = `<div class="gz-srch"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="6.5"/><path d="m16 16 4.5 4.5"/></svg><input id="gq" placeholder="Rechercher une machine" value="${esc(gq)}" autocomplete="off" aria-label="Rechercher une machine"></div>`;
  /* bouton « Compteur » : seulement pour le compte du créateur (v3.15), rien pour les autres */
  const majCompteur = () => {
    const el = document.getElementById('gcpt');
    if (el) el.innerHTML = boutonCompteur(majCompteur);
  };
  const pied = `<div class="card astuces"><div class="hist-date">Astuces</div><p class="mu">Pendant une séance, touche le numéro d’une série pour la marquer comme échauffement (É) : elle ne compte pas dans tes records ni dans ton volume.</p><p class="mu">Glisse un exercice vers la gauche pour le remplacer ou le supprimer.</p></div><div id="gcpt">${boutonCompteur(majCompteur)}</div><p class="mu" style="text-align:center;margin-top:18px">Fluxe v${VER}</p>`;
  if (!g)
    return `<h1>Ta salle</h1><p class="sub">Choisis ton enseigne : Fluxe te montre ses machines.</p>${ensCards()}
<h2>Toutes les machines</h2>${recherche}${muscles}<div id="gl">${glist()}</div>${pied}`;
  /* salle reliée : relire les avis du club (au plus une fois par minute), puis redessiner la liste */
  if (g.club)
    rafraichir(g.club, () => {
      const el = document.getElementById('gl'),
        c = document.querySelector('.card.gym');
      if (el) el.innerHTML = glist();
      if (c) c.outerHTML = gymCard();
    });
  return `<h1>Ma salle</h1>${gymCard()}${segGuide()}${recherche}${muscles}<div id="gl">${glist()}</div>${pied}`;
}
