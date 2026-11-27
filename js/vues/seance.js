/* Fluxe Suivi — Écran Séance : séance en cours, exercices, séries, cardio. */
import {MU, TG} from '../catalogue.js';
import {S, cur, done} from '../etat.js';
import {BARRE, esc, mieux, fmt, fmtN, mins, nset, parCote, vol} from '../outils.js';
import {best, cline, prevCardio, prevSets, restFor, suggest} from '../calculs.js';
import {noteOf} from '../salle.js';
import {thumb} from '../icones.js';
import {backupCard} from '../rappel.js';
import {dureeTxt} from '../minuteur.js';
import {ico, pic} from '../pictos.js';
import {derniere, estCardio} from '../routines.js';
import {depuis, prevu, quand, suggestion} from '../resume-routine.js';
import {dansLaSemaine} from '../resume-seance.js';
import {menuOuvert} from './historique.js';
import {groupeDe} from '../muscles.js';
import {titreSerie} from './serie.js';
function cardioCard(e, i) {
  const pc = prevCardio(e.name),
    nt = noteOf(e.name);
  return `<section class="card"><div class="ex-head"><div class="eh">${thumb(e.name, 'sm')}<div><div class="ex-name">${esc(e.name)}</div><div class="mu">${MU[e.name] ? 'Cardio' : `<button class="mub" data-act="pmu" data-i="${i}" aria-label="Choisir le muscle de cet exercice">Cardio ${ico('crayon')}</button>`}${TG[e.name] ? ' · ' + esc(TG[e.name]) : ''}</div></div></div>${menuEx(e, i)}</div>
${pc ? `<div class="prev">Dernière fois : ${esc(cline(pc))}</div>` : ''}
<input class="note" data-note="${i}" maxlength="200" placeholder="✎ Ajouter une note" value="${esc(nt)}" autocomplete="off" aria-label="Note pour ${esc(e.name)}">
<div class="gr gh"><span>Bloc</span><span>Durée (min)</span><span>Distance (km)</span><span>Calories</span><span></span></div>
${e.sets.map((x, j) => `<div class="gr${x.done ? ' ok' : ''}"><span class="plate">${j + 1}</span><input type="text" inputmode="decimal" data-i="${i}" data-j="${j}" data-f="min" value="${esc(x.min)}" aria-label="Durée en minutes, bloc ${j + 1}"><input type="text" inputmode="decimal" data-i="${i}" data-j="${j}" data-f="km" value="${esc(x.km)}" aria-label="Distance en km, bloc ${j + 1}"><input type="text" inputmode="numeric" data-i="${i}" data-j="${j}" data-f="kcal" value="${esc(x.kcal)}" aria-label="Calories, bloc ${j + 1}"><button class="ck" data-act="chk" data-i="${i}" data-j="${j}" aria-pressed="${!!x.done}" aria-label="Valider le bloc ${j + 1}">✓</button></div>`).join('')}
<button class="ghost" data-act="addset" data-i="${i}">+ Ajouter un bloc</button></section>`;
}
/* ===== Accueil (v3.18) : « À faire aujourd'hui », Séance libre, routines compactes avec tous leurs exercices ===== */
const sansAccent = t => t.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
const repere = n => (estCardio(n) ? 'CAR' : sansAccent(groupeDe(n, S.mu)).slice(0, 3).toUpperCase());
/* séries prévues d'un exercice : celles de la routine, sinon celles de la dernière fois */
const planDe = (r, i) => {
  const n = r.exercises[i];
  if (r.sets && r.sets[i] && r.sets[i].length) return r.sets[i];
  return (estCardio(n) ? (prevCardio(n) || {}).sets : prevSets(n)) || [];
};
const lignes = r =>
  r.exercises
    .map(
      (n, i) =>
        `<div><i class="${estCardio(n) ? 'c' : ''}" aria-hidden="true">${esc(repere(n))}</i><b>${esc(n)}</b><span>${esc(prevu(planDe(r, i), estCardio(n)))}</span></div>`
    )
    .join('');
const PLAY =
  '<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true"><path d="M8 5.5v13l11-6.5z"/></svg>';
function carteRoutine(r, k) {
  const series = r.exercises.reduce((a, n, i) => (estCardio(n) ? a : a + planDe(r, i).filter(x => !x.w).length), 0),
    id = 'r:' + k,
    ouvert = menuOuvert() === id;
  const menu = ouvert
    ? `<div class="hx-menu" role="menu"><button role="menuitem" data-act="redit" data-k="${k}">${pic('crayon', 18)}Modifier la routine</button><button role="menuitem" class="r" data-act="delr" data-k="${k}">${pic('corbeille', 18)}Supprimer</button></div>`
    : '';
  return `<div class="card en-r"><div class="en-rc"><div class="en-rt">${esc(r.name)}</div><div class="en-rm">${r.exercises.length} exercice${r.exercises.length > 1 ? 's' : ''}${series ? ' · ' + series + ' série' + (series > 1 ? 's' : '') : ''} · ${esc(quand(derniere(r)))}</div><div class="rlist">${lignes(r)}</div></div><div class="en-ra"><button class="en-play" data-act="startr" data-k="${k}" aria-label="Démarrer ${esc(r.name)}">${PLAY}</button><button class="hx-m" data-act="rmenu" data-k="${k}" aria-haspopup="menu" aria-expanded="${ouvert}" aria-label="Actions pour la routine ${esc(r.name)}">${pic('points', 20)}</button></div>${menu}</div>`;
}
function carteSuggestion() {
  const k = suggestion(S.routines.map(derniere));
  if (k < 0) return '';
  const r = S.routines[k],
    d = derniere(r),
    der = d ? done().find(s => s.rt === r.id && s.date === d) : null;
  return `<div class="card en-sug"><div class="en-sug-k">À faire aujourd’hui</div><div class="en-sug-t">${esc(r.name)}</div><div class="en-sug-m">${esc(depuis(d))}${der && der.dur ? ' · dernière fois ' + der.dur + ' min' : ''}</div><div class="en-sx">${r.exercises.map((n, i) => `<div><b>${esc(n)}</b><span>${esc(prevu(planDe(r, i), estCardio(n)))}</span></div>`).join('')}</div><button class="en-go" data-act="startr" data-k="${k}">${PLAY}<span>Démarrer ${esc(r.name)}</span></button></div>`;
}
function accueil() {
  const jour = new Date().toLocaleDateString('fr-FR', {weekday: 'long', day: 'numeric', month: 'short'}),
    n = dansLaSemaine(done());
  return `${titreSerie('Entraînement')}<p class="sub">${esc(jour.charAt(0).toUpperCase() + jour.slice(1))} · ${n ? n + ' séance' + (n > 1 ? 's' : '') + ' cette semaine' : 'aucune séance cette semaine'}</p>${backupCard()}
${carteSuggestion()}<button class="en-libre" data-act="start">+ Séance libre</button>
<div class="en-sec"><b>Mes routines</b>${S.routines.length ? `<span>${S.routines.length} routine${S.routines.length > 1 ? 's' : ''}</span>` : ''}</div>
${S.routines.map(carteRoutine).join('') || '<p class="empty">Aucune routine pour l’instant.</p>'}
<p class="mu" style="text-align:center;margin:6px 8px 14px">Nouvelle routine : Historique › « ··· » › Créer une routine</p>`;
}
export function viewSeance() {
  const s = cur();
  if (!s) return accueil();
  const ed = !!s.edit;
  /* bandeau collé en haut (v3.19) : nom de la routine, date, « Terminer », chiffres */
  const r = s.rt && S.routines.find(x => x.id === s.rt),
    titre = r ? r.name : ed ? 'Séance passée' : 'Séance libre',
    jour = new Date(s.date).toLocaleDateString('fr-FR', {weekday: 'long', day: 'numeric', month: 'short'});
  return `<div class="sx-top"><div class="sx-l"><div class="sx-n"><h1>${esc(titre)}</h1><div class="sx-d">${esc(jour.charAt(0).toUpperCase() + jour.slice(1))} · ${ed ? 'modification' : 'en cours'}</div></div><button class="sx-fin" data-act="finish">${ed ? 'Enregistrer' : 'Terminer'}</button></div>${bandeau(s, ed)}</div>
${cartes(s, ed)}
${aDesFinis(s, ed) ? '' : AJOUT}<div class="sx-bas"><button class="sec" data-act="tool">Calculateur de disques</button><button class="sec sx-rep" data-act="rest"><span>Repos par défaut</span><b>${dureeTxt(S.rest || 90)}</b></button></div>
<button class="del sx-ann" data-act="cancel">${ed ? 'Annuler les modifications' : 'Annuler la séance'}</button>`;
}
/* Ordre d'affichage (v3.5.1) : exercices en cours en haut (le nouvel ajout aussi), exercices terminés en bas,
   le dernier fini en premier. Les données gardent l'ordre réel (Historique). En modification d'une séance passée : ordre réel. */
const fini = e => e.sets.length > 0 && e.sets.every(x => x.done);
/* avec des exercices terminés, « + Ajouter un exercice » remonte juste au-dessus d'eux */
const AJOUT = '<div class="row"><button class="btn" data-act="pick">+ Ajouter un exercice</button></div>';
const aDesFinis = (s, ed) => !ed && s.exercises.some(fini);
/* carte glissable : glisser vers la gauche montre « Remplacer » et « Supprimer » (v3.7.0) */
function glissable(html, i) {
  const act = `<div class="gl-act"><button class="glm" data-act="exrem" data-i="${i}">${ico('crayon')}Remplacer</button><button class="gls" data-act="exsup" data-i="${i}">${ico('corbeille')}Supprimer</button></div>`;
  return html
    .replace('<section class="card">', `<section class="gl" data-i="${i}">${act}<div class="card gl-c">`)
    .replace(/<\/section>$/, '</div></section>');
}
function cartes(s, ed) {
  const l = s.exercises.map((e, i) => [e, i]);
  if (ed) return l.map(([e, i]) => glissable(exCard(s, e, i), i)).join('');
  const enCours = l.filter(([e]) => !fini(e)),
    finis = l.filter(([e]) => fini(e)).reverse();
  return (
    enCours.map(([e, i]) => glissable(exCard(s, e, i), i)).join('') +
    (finis.length ? `${AJOUT}<div class="sep-fini">${ico('valide')}Terminés</div>` : '') +
    finis.map(([e, i]) => glissable(exCard(s, e, i), i)).join('')
  );
}
/* Bandeau du haut : Durée, Volume, Séries faites / prévues (hors échauffement et cardio), barre de progression */
function bandeau(s, ed) {
  const prevues = s.exercises.reduce((a, e) => (e.cardio ? a : a + e.sets.filter(x => !x.w).length), 0),
    faites = nset(s),
    pc = prevues ? Math.round((faites / prevues) * 100) : 0;
  return `<div class="card live"><div class="kpi"><div><span class="lab">Durée</span><b><span id="el">${ed ? s.dur || 0 : mins(s.date)}</span> <small>min</small></b></div><div><span class="lab">Volume</span><b>${fmt(vol(s))} <small>kg</small></b></div><div><span class="lab">Séries</span><b>${faites} <small>/ ${prevues}</small></b></div></div><div class="prog" aria-hidden="true"><i style="width:${pc}%"></i></div></div>`;
}
/* « ··· » d'un exercice (v3.19) : le menu est dans la page mais caché, il s'ouvre sans redessiner l'écran */
const menuEx = (e, i) =>
  `<button class="hx-m" data-act="emenu" data-i="${i}" aria-haspopup="menu" aria-expanded="false" aria-label="Actions pour ${esc(e.name)}">${pic('points', 20)}</button><div class="hx-menu sx-menu" role="menu" hidden><button role="menuitem" data-act="emrem" data-i="${i}">${pic('crayon', 18)}Remplacer</button><button role="menuitem" data-act="emrex" data-i="${i}">${pic('chrono', 18)}Repos de cet exercice</button><button role="menuitem" class="r" data-act="delex" data-i="${i}">${pic('corbeille', 18)}Supprimer</button></div>`;
function exCard(s, e, i) {
  if (e.cardio) return cardioCard(e, i);
  const pv = prevSets(e.name) || [],
    b = best(e.name),
    sg = s.edit ? null : suggest(e.name),
    nt = noteOf(e.name);
  let wi = -1;
  /* la meilleure série record de l'exercice : c'est sous elle que s'affiche la ligne « Record » */
  const recs = b ? e.sets.filter(x => x.done && !x.w && mieux(x, b)) : [],
    top = recs.reduce((a, x) => (!a || mieux(x, a) ? x : a), null);
  const proch = e.sets.findIndex(x => !x.done),
    px = proch >= 0 ? e.sets[proch] : null,
    dq = px && BARRE.has(e.name) && +px.kg > 0 ? parCote(px.kg) : null;
  const meta = `<div class="meta"><button class="chip-m" data-act="rex" data-i="${i}" aria-label="Repos pour cet exercice : ${dureeTxt(restFor(e.name))}, toucher pour changer">${ico('chrono')}Repos <b>${dureeTxt(restFor(e.name))}</b></button>${dq ? `<span class="chip-m">${ico('salle')}Par côté <b>${dq.length ? dq.map(fmtN).join(' + ') : 'barre seule'}</b></span>` : ''}</div>`;
  return `<section class="card"><div class="ex-head"><div class="eh">${thumb(e.name, 'sm')}<div><div class="ex-name">${esc(e.name)}</div><div class="mu">${MU[e.name] ? esc(MU[e.name]) : `<button class="mub" data-act="pmu" data-i="${i}" aria-label="Choisir le muscle de cet exercice">${esc(groupeDe(e.name, S.mu))} ${ico('crayon')}</button>`}${TG[e.name] ? ' · ' + esc(TG[e.name]) : ''}</div></div></div>${menuEx(e, i)}</div>
${meta}
${sg ? `<button class="sg" data-act="sug" data-i="${i}">${ico('progres')}${esc(sg.txt)}<small>${esc(sg.why)}</small></button>` : ''}
<input class="note" data-note="${i}" maxlength="200" placeholder="✎ Ajouter une note" value="${esc(nt)}" autocomplete="off" aria-label="Note pour ${esc(e.name)}">
<div class="gr gh"><span>Série</span><span>Précédent</span><span>kg</span><span>Réps</span><span></span></div>
${e.sets
  .map((x, j) => {
    if (!x.w) wi++;
    const p = x.w ? null : pv[wi],
      pr = x.done && !x.w && b && mieux(x, b);
    return `<div class="gr${x.done ? ' ok' : ''}${j === proch ? ' cur' : ''}"><button class="plate${x.w ? ' wu' : ''}" data-act="wu" data-i="${i}" data-j="${j}" aria-label="Série ${j + 1} : ${x.w ? 'échauffement' : 'travail'}, toucher pour changer">${x.w ? 'É' : wi + 1}</button><span class="pv">${p ? esc(p.kg) + '×' + esc(p.reps) : '–'}${pr ? '<span class="pr">PR</span>' : ''}</span><input type="text" inputmode="decimal" data-i="${i}" data-j="${j}" data-f="kg" value="${esc(x.kg)}" aria-label="kg, série ${j + 1}"><input type="text" inputmode="numeric" data-i="${i}" data-j="${j}" data-f="reps" value="${esc(x.reps)}" aria-label="Répétitions, série ${j + 1}"><button class="ck" data-act="chk" data-i="${i}" data-j="${j}" aria-pressed="${!!x.done}" aria-label="Valider la série ${j + 1}">✓</button></div>${pr && x === top ? `<div class="recl">${ico('etoile')}<b>Record</b> Nouveau · ${esc(fmtN(+x.kg))} kg × ${esc(x.reps)}</div>` : ''}`;
  })
  .join('')}
<button class="ghost add" data-act="addset" data-i="${i}">+ Ajouter une série</button></section>`;
}
