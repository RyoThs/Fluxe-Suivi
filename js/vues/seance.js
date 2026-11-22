/* Fluxe Suivi — Écran Séance : séance en cours, exercices, séries, cardio. */
import {MU, TG} from '../catalogue.js';
import {S, cur} from '../etat.js';
import {BARRE, esc, mieux, fmt, fmtDate, fmtN, mins, nset, parCote, vol} from '../outils.js';
import {best, cline, prevCardio, prevSets, restFor, suggest} from '../calculs.js';
import {gymCur, noteOf} from '../salle.js';
import {DB, thumb} from '../icones.js';
import {backupCard} from '../rappel.js';
import {dureeTxt} from '../minuteur.js';
import {ico} from '../pictos.js';
import {derniere, estCardio, ilYa, nbSeries} from '../routines.js';
import {groupeDe} from '../muscles.js';
function cardioCard(e, i) {
  const pc = prevCardio(e.name),
    nt = noteOf(e.name);
  return `<section class="card"><div class="ex-head"><div class="eh">${thumb(e.name, 'sm')}<div><div class="ex-name">${esc(e.name)}</div><div class="mu">Cardio${TG[e.name] ? ' · ' + esc(TG[e.name]) : ''}</div></div></div><button class="del" data-act="delex" data-i="${i}">Retirer</button></div>
${pc ? `<div class="prev">Dernière fois : ${esc(cline(pc))}</div>` : ''}
<input class="note" data-note="${i}" maxlength="200" placeholder="Note (niveau, inclinaison, vitesse…)" value="${esc(nt)}" autocomplete="off" aria-label="Note pour ${esc(e.name)}">
<div class="gr gh"><span>Bloc</span><span>Durée (min)</span><span>Distance (km)</span><span>Calories</span><span></span></div>
${e.sets.map((x, j) => `<div class="gr${x.done ? ' ok' : ''}"><span class="plate">${j + 1}</span><input type="text" inputmode="decimal" data-i="${i}" data-j="${j}" data-f="min" value="${esc(x.min)}" aria-label="Durée en minutes, bloc ${j + 1}"><input type="text" inputmode="decimal" data-i="${i}" data-j="${j}" data-f="km" value="${esc(x.km)}" aria-label="Distance en km, bloc ${j + 1}"><input type="text" inputmode="numeric" data-i="${i}" data-j="${j}" data-f="kcal" value="${esc(x.kcal)}" aria-label="Calories, bloc ${j + 1}"><button class="ck" data-act="chk" data-i="${i}" data-j="${j}" aria-pressed="${!!x.done}" aria-label="Valider le bloc ${j + 1}">✓</button></div>`).join('')}
<button class="ghost" data-act="addset" data-i="${i}">+ Ajouter un bloc</button></section>`;
}
/* Carte d'une routine sur l'accueil : exercices et séries prévues, dernière fois, Modifier, Démarrer */
function carteRoutine(r, k) {
  const d = derniere(r);
  const li = r.exercises
    .map((n, i) => {
      const nb = nbSeries(r, i);
      return `<div><b>${esc(n)}</b>${nb ? ' · ' + nb + (estCardio(n) ? ' bloc' : ' série') + (nb > 1 ? 's' : '') : ''}</div>`;
    })
    .join('');
  return `<div class="card"><div class="ex-head"><div><div class="ex-name">${esc(r.name)}</div><div class="mu">${d ? 'Faite ' + ilYa(d) : 'Pas encore faite'}</div></div><button class="del" style="color:var(--accent)" data-act="redit" data-k="${k}">${ico('crayon')}Modifier</button></div><div class="rlist">${li}</div><button class="btn" data-act="startr" data-k="${k}">Démarrer</button></div>`;
}
export function viewSeance() {
  const s = cur();
  if (!s)
    return `<h1>Entraînement</h1><p class="sub">Lance une séance ou pars d’une routine.</p>${backupCard()}
<div class="card"><button class="btn big" data-act="start">${DB} Séance vide</button></div>
<h2>Mes routines</h2>
${S.routines.map(carteRoutine).join('') || '<p class="empty">Aucune routine pour l’instant.</p>'}
<p class="mu" style="text-align:center;margin:4px 8px 14px">Pour créer une routine : Historique, puis « Créer une routine » sous la séance de ton choix.</p>`;
  const ed = !!s.edit;
  return `<h1>${esc(fmtDate(s.date))}</h1><p class="sub">${ed ? 'Modification d’une séance passée' : 'Séance en cours'}</p>
${bandeau(s, ed)}
<div class="row"><button class="sec" data-act="rest">${ico('chrono')}Repos par défaut : ${dureeTxt(S.rest || 90)} (changer)</button></div>
<p class="mu" style="margin-left:4px">Astuce : touche le numéro d’une série pour la marquer comme échauffement (É).</p>
${cartes(s, ed)}
<div class="row"><button class="btn" data-act="pick">+ Ajouter un exercice</button><button class="sec" data-act="tool">Calculateur de disques</button><button class="sec" data-act="finish">${ed ? 'Enregistrer les modifications' : 'Terminer la séance'}</button><button class="del" data-act="cancel">${ed ? 'Annuler les modifications' : 'Annuler la séance'}</button></div>`;
}
/* Ordre d'affichage (v3.5.1) : exercices en cours en haut (le nouvel ajout aussi), exercices terminés en bas,
   le dernier fini en premier. Les données gardent l'ordre réel (Historique). En modification d'une séance passée : ordre réel. */
const fini = e => e.sets.length > 0 && e.sets.every(x => x.done);
function cartes(s, ed) {
  const l = s.exercises.map((e, i) => [e, i]);
  if (ed) return l.map(([e, i]) => exCard(s, e, i)).join('');
  const enCours = l.filter(([e]) => !fini(e)),
    finis = l.filter(([e]) => fini(e)).reverse();
  return (
    enCours.map(([e, i]) => exCard(s, e, i)).join('') +
    (finis.length ? `<div class="sep-fini">${ico('valide')}Terminés</div>` : '') +
    finis.map(([e, i]) => exCard(s, e, i)).join('')
  );
}
/* Bandeau du haut : Durée, Volume, Séries faites / prévues (hors échauffement et cardio), barre de progression */
function bandeau(s, ed) {
  const prevues = s.exercises.reduce((a, e) => (e.cardio ? a : a + e.sets.filter(x => !x.w).length), 0),
    faites = nset(s),
    pc = prevues ? Math.round((faites / prevues) * 100) : 0;
  return `<div class="card live"><div class="kpi"><div><span class="lab">Durée</span><b><span id="el">${ed ? s.dur || 0 : mins(s.date)}</span> <small>min</small></b></div><div><span class="lab">Volume</span><b>${fmt(vol(s))} <small>kg</small></b></div><div><span class="lab">Séries</span><b>${faites} <small>/ ${prevues}</small></b></div></div><div class="prog" aria-hidden="true"><i style="width:${pc}%"></i></div></div>`;
}
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
  return `<section class="card"><div class="ex-head"><div class="eh">${thumb(e.name, 'sm')}<div><div class="ex-name">${esc(e.name)}</div><div class="mu">${MU[e.name] ? esc(MU[e.name]) : `<button class="mub" data-act="pmu" data-i="${i}" aria-label="Choisir le muscle de cet exercice">${esc(groupeDe(e.name, S.mu))} ${ico('crayon')}</button>`}${TG[e.name] ? ' · ' + esc(TG[e.name]) : ''}</div></div></div><button class="del" data-act="delex" data-i="${i}">Retirer</button></div>
${meta}
${sg ? `<button class="sg" data-act="sug" data-i="${i}">${ico('progres')}${esc(sg.txt)}<small>${esc(sg.why)}</small></button>` : ''}
<input class="note" data-note="${i}" maxlength="200" placeholder="${gymCur() ? 'Réglage dans ' + esc(gymCur().name) + ' (siège, hauteur…)' : 'Note (réglage du siège, hauteur…)'}" value="${esc(nt)}" autocomplete="off" aria-label="Note pour ${esc(e.name)}">
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
