/* Fluxe Suivi — Écran Stats. */
import {S, done} from '../etat.js';
import {esc, fmt, fmtN, mieux, ok, vol} from '../outils.js';
import {csum} from '../calculs.js';
import {groupeDe} from '../muscles.js';
import {carteProgression} from './progression.js';
import {titreSerie} from './serie.js';
import {carteCorps} from './corps.js';
import {ico} from '../pictos.js';
import {MESURES_G, PERIODES, TOUTES, dessin, points, resume} from '../courbe.js';
/* Rubriques repliables (v3.16) : repliées par défaut ; ce qu'on a ouvert est retenu par le téléphone */
const PLIS = ['prog', 'cardio', 'rec']; /* mémorisé sous la clé fx-stats-ouvert */
let ouverts = new Set();
try {
  const l = JSON.parse(localStorage.getItem('fx-stats-ouvert') || '[]');
  if (Array.isArray(l)) ouverts = new Set(l.filter(v => PLIS.includes(v)));
} catch (e) {}
export function basculer(v) {
  if (!PLIS.includes(v)) return;
  if (ouverts.has(v)) ouverts.delete(v);
  else ouverts.add(v);
  try {
    localStorage.setItem('fx-stats-ouvert', JSON.stringify([...ouverts]));
  } catch (e) {}
}
/* Carte repliable : son titre est un bouton ; repliée, elle montre une ligne de résumé */
function pli(v, titre, resumeTxt, contenu, cls = '') {
  const o = ouverts.has(v);
  return `<div class="card pli${o ? ' ouvert' : ''}${cls ? ' ' + cls : ''}"><button class="pli-t" data-act="pli" data-v="${v}" aria-expanded="${o}"><span><span class="hist-date">${titre}</span>${o ? '' : `<span class="mu">${resumeTxt}</span>`}</span><span class="fl">${ico('bas')}</span></button>${o ? contenu : ''}</div>`;
}
function wk(t) {
  const d = new Date(t);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return d.getTime();
}
/* Courbe de progression (toujours globale depuis la v3.16) : mesure, période, point touché */
let cm = 'vol',
  cp = 'm3',
  csel = -1;
export function setCm(v) {
  if (MESURES_G[v]) {
    cm = v;
    csel = -1;
  }
}
export function setCp(v) {
  if (PERIODES[v]) {
    cp = v;
    csel = -1;
  }
}
export function setCsel(v) {
  csel = Number.isInteger(v) ? v : -1;
}
const SOUS_G = {
  vol: 'Tous les exercices additionnés, à chaque séance',
  ser: 'Séries de travail validées (hors échauffement), à chaque séance',
  dur: 'Durée de chaque séance',
};
function progression(l) {
  if (!l.length) return '<p class="empty" style="margin:12px">Termine une séance pour voir ta progression.</p>';
  const pts = points(l, TOUTES, cm, cp);
  const seg = (liste, cour, act, cls) =>
    `<div class="seg ${cls}" role="group">${liste.map(([v, t]) => `<button class="${cour === v ? 'on' : ''}" data-act="${act}" data-v="${v}" aria-pressed="${cour === v}">${t}</button>`).join('')}</div>`;
  return `${seg(Object.entries(MESURES_G), cm, 'cm', 'cm-seg')}<div class="mu">${SOUS_G[cm]}</div>
<div class="chead">${resume(pts, cm)}${seg(
    Object.entries(PERIODES).map(([v, [t]]) => [v, t]),
    cp,
    'cp',
    'cp-seg'
  )}</div>
${dessin(pts, cm, csel)}`;
}
export function viewStats() {
  const l = done(),
    now = Date.now(),
    w0 = wk(now),
    W = 7 * 864e5;
  /* Total du jour : repart à zéro chaque nuit, séance en cours comprise */
  const d0 = new Date().setHours(0, 0, 0, 0),
    today = S.sessions.filter(x => x.date >= d0).reduce((a, x) => a + vol(x), 0);
  const weeks = [...Array(8)].map((_, k) => {
    const t = w0 - (7 - k) * W;
    const v = l.filter(s => wk(s.date) === t).reduce((a, s) => a + vol(s), 0);
    return {t, v};
  });
  const mx = Math.max(1, ...weeks.map(x => x.v));
  const gv = {};
  l.filter(s => now - s.date < 30 * 864e5).forEach(s =>
    s.exercises.forEach(e => {
      if (e.cardio) return;
      const g = groupeDe(e.name, S.mu);
      gv[g] = (gv[g] || 0) + e.sets.filter(ok).reduce((a, x) => a + (+x.kg || 0) * (+x.reps || 0), 0);
    })
  );
  const cs = l.filter(x => now - x.date < W).flatMap(x => x.exercises.filter(e => e.cardio));
  const cmin = fmtN(cs.reduce((a, e) => a + csum(e, 'min'), 0)),
    ckm = fmtN(cs.reduce((a, e) => a + csum(e, 'km'), 0));
  const cardio7 = cs.length
    ? pli(
        'cardio',
        'Cardio',
        `${cmin} min · ${ckm} km ces 7 derniers jours`,
        `<div class="mu">7 derniers jours</div><div class="stats" style="box-shadow:none;margin:10px 0 0"><div><b>${cmin}</b><span>minutes</span></div><div><b>${ckm}</b><span>km</span></div><div><b>${Math.round(cs.reduce((a, e) => a + csum(e, 'kcal'), 0))}</b><span>kcal</span></div></div>`
      )
    : '';
  const der = l.length ? l.reduce((a, x) => (x.date > a.date ? x : a)) : null;
  const gt = Object.values(gv).reduce((a, b) => a + b, 0) || 1;
  return `${titreSerie('Stats')}<p class="sub">Ta progression</p>
${carteProgression()}${carteCorps()}
<div class="stats"><div><b>${l.length}</b><span>séances</span></div><div><b>${l.filter(s => now - s.date < W).length}</b><span>7 derniers jours</span></div><div><b>${fmt(today)}</b><span>kg aujourd’hui</span></div></div>
<div class="card"><div class="hist-date">Volume par semaine</div><div class="mu">en kg, 8 dernières semaines</div><div class="chart" role="img" aria-label="Volume hebdomadaire">${weeks.map(x => `<div><i style="height:${Math.round((x.v / mx) * 100)}px"></i>${new Date(x.t).getDate()}/${new Date(x.t).getMonth() + 1}</div>`).join('')}</div></div>
${pli('prog', 'Progression globale', der ? 'Dernière séance : ' + fmt(vol(der)) + ' kg soulevés' : 'Pas encore de séance', progression(l), 'prog')}
<div class="card"><div class="hist-date">Répartition par groupe</div><div class="mu">volume des 30 derniers jours</div>${
    Object.entries(gv)
      .sort((a, b) => b[1] - a[1])
      .map(
        ([g, v]) =>
          `<div class="mg"><span>${esc(g)}</span><div><i style="width:${Math.round((v / gt) * 100)}%"></i></div><b>${Math.round((v / gt) * 100)}%</b></div>`
      )
      .join('') || '<p class="empty" style="margin:12px">Pas encore de données.</p>'
  }</div>
${cardio7}${records(l)}`;
}
/* Records : 3 onglets
   - max   : charge la plus lourde soulevée (hors échauffement)
   - serie : meilleure série = poids × répétitions sur une seule série
   - vol   : volume sur une séance = poids × répétitions, additionné sur toutes les séries de l'exercice */
let rx = 'max';
export function setRx(v) {
  rx = ['max', 'serie', 'vol'].includes(v) ? v : 'max';
}
const jour = t => new Date(t).toLocaleDateString('fr-FR', {day: 'numeric', month: 'short'});
function records(l) {
  const bs = Object.create(null);
  l.forEach(s =>
    s.exercises
      .filter(e => !e.cardio)
      .forEach(e => {
        const k = e.name,
          ss = e.sets.filter(ok);
        if (!ss.length) return;
        if (rx === 'vol') {
          const v = ss.reduce((a, x) => a + (+x.kg || 0) * (+x.reps || 0), 0);
          if (v > 0 && (!bs[k] || v > bs[k].v))
            bs[k] = {v, d: ss.length + ' série' + (ss.length > 1 ? 's' : ''), t: s.date};
          return;
        }
        ss.forEach(x => {
          if (rx === 'serie') {
            const v = (+x.kg || 0) * (+x.reps || 0);
            if (v > 0 && (!bs[k] || v > bs[k].v)) bs[k] = {v, d: fmtN(+x.kg || 0) + ' kg × ' + x.reps, t: s.date};
          } else if (!bs[k] || mieux(x, bs[k].x))
            bs[k] = {x, v: +x.kg || 0, d: x.reps + ' répétition' + (+x.reps > 1 ? 's' : ''), t: s.date};
        });
      })
  );
  const rec = Object.entries(bs)
    .sort((a, b) => (rx === 'max' ? (mieux(b[1].x, a[1].x) ? 1 : -1) : b[1].v - a[1].v))
    .slice(0, 8);
  const sous = {
    max: 'Charge la plus lourde soulevée (hors échauffement)',
    serie: 'Poids × répétitions sur une seule série',
    vol: 'Poids × répétitions × séries, sur une séance',
  }[rx];
  const seg = `<div class="seg rec-seg" role="group" aria-label="Type de record">${[
    ['max', 'Poids max'],
    ['serie', 'Meilleure série'],
    ['vol', 'Volume'],
  ]
    .map(
      ([v, t]) =>
        `<button class="${rx === v ? 'on' : ''}" data-act="rx" data-v="${v}" aria-pressed="${rx === v}">${t}</button>`
    )
    .join('')}</div>`;
  /* résumé quand la rubrique est repliée : les 2 charges les plus lourdes */
  const top = {};
  l.forEach(s =>
    s.exercises.forEach(e => {
      if (e.cardio) return;
      e.sets.filter(ok).forEach(x => {
        if ((+x.kg || 0) > (top[e.name] || 0)) top[e.name] = +x.kg;
      });
    })
  );
  const res =
    Object.entries(top)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 2)
      .map(([n, v]) => esc(n) + ' ' + fmtN(v) + ' kg')
      .join(' · ') || 'Pas encore de records';
  return pli(
    'rec',
    'Records',
    res,
    `${seg}<div class="mu">${sous}</div>${rec.map(([n, r]) => `<div class="rec"><div>${esc(n)}<br><span>${esc(r.d)} · ${jour(r.t)}</span></div><b>${rx === 'max' ? fmtN(r.v) : fmt(r.v)} kg</b></div>`).join('') || '<p class="empty" style="margin:12px">Pas encore de records.</p>'}`
  );
}
