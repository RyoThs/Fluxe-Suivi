/* Fluxe Suivi — Écran Historique (v3.17) : séances rangées par semaine, une carte par séance
   (titre selon les muscles, durée / volume / records, liste compacte), actions dans un menu « ··· »,
   bouton « Sauvegarde » en haut (point orange tant que des séances ne sont pas à l'abri). */
import {S, done} from '../etat.js';
import {esc} from '../outils.js';
import {bkLine, aSauvegarder} from '../rappel.js';
import {pic} from '../pictos.js';
import {dansLaSemaine, resume, semaines} from '../resume-seance.js';
import {questionEnCours} from '../question.js';
import {gymCur} from '../salle.js';

/* menu « ··· » ouvert (id de la séance) et cartes dont tous les exercices sont dépliés */
let menu = null;
const deplies = new Set();
export function basculerMenu(id) {
  menu = menu === id ? null : id;
}
export const fermerMenu = () => {
  const ouvert = menu !== null;
  menu = null;
  return ouvert;
};
export const menuOuvert = () => menu;
export function deplier(id) {
  if (deplies.has(id)) deplies.delete(id);
  else deplies.add(id);
}

const MONTRES = 3; /* exercices visibles avant « + n autres » */

function boutonSauvegarde() {
  return `<button class="hx-sv" data-act="data" aria-label="Sauvegarde, versions de secours et corbeille">${aSauvegarder() ? '<span class="pt" aria-hidden="true"></span>' : ''}${pic('bouclier', 18)}<b>Sauvegarde</b><span class="sr">${bkLine()}</span></button>`;
}

function carte(r) {
  const tous = deplies.has(r.id),
    l = tous ? r.exercices : r.exercices.slice(0, MONTRES),
    reste = r.exercices.length - MONTRES,
    id = esc(r.id),
    ouvert = menu === r.id;
  const ex = l
    .map(
      e =>
        `<div class="hx-e"><span class="ic${e.cardio ? ' c' : ''}" aria-hidden="true">${esc(e.code)}</span><div class="n"><b>${esc(e.nom)}</b><span>${esc(e.ligne)}</span></div>${e.record ? `<span class="hx-b">${pic('trophee', 13)}Record</span>` : ''}</div>`
    )
    .join('');
  const plus =
    reste > 0
      ? `<button class="hx-plus" data-act="hplus" data-id="${id}">${tous ? 'Voir moins' : '+ ' + reste + ' autre' + (reste > 1 ? 's' : '') + ' exercice' + (reste > 1 ? 's' : '')}</button>`
      : '';
  const m = ouvert
    ? `<div class="hx-menu" role="menu">${[
        ['editsess', 'crayon', 'Modifier la séance'],
        ['mkr', 'signet', 'Créer une routine'],
        ['hpart', 'partage', 'Partager (image)'],
        ['delsess', 'corbeille', 'Supprimer'],
      ]
        .map(
          ([a, i, t]) =>
            `<button role="menuitem" data-act="${a}" data-id="${id}"${a === 'delsess' ? ' class="r"' : ''}>${pic(i, 18)}${t}</button>`
        )
        .join('')}</div>`
    : '';
  return `<div class="card hx-c" data-id="${id}"><div class="hx-top"><div><div class="hx-t">${esc(r.titre)}</div><div class="hx-d">${esc(r.date)}</div></div><button class="hx-m" data-act="hmenu" data-id="${id}" aria-haspopup="menu" aria-expanded="${ouvert}" aria-label="Actions pour cette séance">${pic('points', 20)}</button></div>
<div class="hx-k"><div><b>${esc(r.duree)}</b><span>durée</span></div><div><b>${esc(r.volume)}</b><span>volume</span></div><div class="${r.records ? 'pr' : ''}"><b>${r.records}</b><span>record${r.records > 1 ? 's' : ''}</span></div></div>${ex}${plus}${m}</div>`;
}

/* question à un toucher après une séance (v3.21) : une seule petite ligne */
function carteQuestion() {
  const q = questionEnCours();
  if (!q) return '';
  if (q.merci) return `<div class="qq merci" role="status">${pic('coche', 16)}Merci ! Ton club en profite.</div>`;
  const g = gymCur();
  return `<div class="qq" role="group" aria-label="Question pour ton club"><span class="qq-ic" aria-hidden="true">${pic('salle', 16)}</span><div class="qq-t">Le <b>${esc(q.machine)}</b> est-il bien dans ta salle ?<small>Aide ton club${g ? ' · ' + esc(g.clubNom || g.name) : ''}</small></div><button class="qq-o" data-act="qoui">Oui</button><button class="qq-o" data-act="qnon">Non</button><button class="qq-x" data-act="qx" aria-label="Fermer la question">${pic('croix', 16)}</button></div>`;
}
export function viewHisto() {
  const l = done();
  if (menu && !l.some(s => s.id === menu)) menu = null;
  const tete = `<div class="hx-h"><h1>Historique</h1>${boutonSauvegarde()}</div>`;
  if (!l.length) return `${tete}<p class="empty">Tes séances terminées apparaîtront ici.</p>`;
  const n = dansLaSemaine(l);
  return `${tete}<p class="sub">${l.length} séance${l.length > 1 ? 's' : ''}${n ? ' · ' + n + ' cette semaine' : ''}</p>${carteQuestion()}
${semaines(l)
  .map(
    w =>
      `<div class="hx-sem"><b>${esc(w.titre)}</b><span>${esc(w.info)}</span></div>${w.seances.map(s => carte(resume(s, l, S.mu))).join('')}`
  )
  .join('')}`;
}
