/* Fluxe Suivi — Courbe de progression d'un exercice (écran Stats).
   3 mesures, calculées séance par séance (séries validées, échauffement exclu) :
   - max  : la charge la plus lourde soulevée ;
   - rm   : le « 1RM estimé » = le poids que tu pourrais soulever 1 seule fois.
            Formule d'Epley : poids × (1 + répétitions ÷ 30). Une série à 1 répétition compte pour son poids.
            Seules les séries de 1 à 12 répétitions servent : au-delà, l'estimation devient trop imprécise ;
   - vol  : le volume = poids × répétitions, additionné sur toutes les séries de l'exercice.
   Mode « Toutes » (tous les exercices ensemble) : seules les mesures qui s'additionnent ont du sens :
   - vol : volume total de la séance ; ser : nombre de séries de travail ; dur : durée de la séance (min).
   La courbe est un dessin SVG fait à la main : aucune bibliothèque à télécharger, ça marche hors ligne. */
import {esc, fmt, fmtN, nset, ok, vol} from './outils.js';

export const TOUTES = '*'; /* « exercice » spécial : tous les exercices ensemble */
export const MESURES = {max: 'Charge max', rm: '1RM estimé', vol: 'Volume'};
export const MESURES_G = {vol: 'Volume total', ser: 'Séries', dur: 'Durée'};
export const PERIODES = {m3: ['3 mois', 91], a1: ['1 an', 365], tout: ['Tout', 0]};
const JOUR = 864e5;

/* 1RM estimé d'une série (null si la série ne compte pas) */
export function rm1(x) {
  const kg = +x.kg || 0,
    r = Math.round(+x.reps || 0);
  if (kg <= 0 || r < 1 || r > 12) return null;
  return r === 1 ? kg : kg * (1 + r / 30);
}

/* La valeur d'une séance pour une mesure, avec la série qui l'explique */
function valeur(e, m) {
  const ss = e.sets.filter(ok);
  if (!ss.length) return null;
  if (m === 'vol') {
    const v = ss.reduce((a, x) => a + (+x.kg || 0) * (+x.reps || 0), 0);
    return v > 0 ? {v, d: ss.length + ' série' + (ss.length > 1 ? 's' : '')} : null;
  }
  let best = null;
  ss.forEach(x => {
    const v = m === 'rm' ? rm1(x) : +x.kg || 0;
    if (v && v > 0 && (!best || v > best.v)) best = {v, d: fmtN(+x.kg || 0) + ' kg × ' + x.reps};
  });
  return best;
}

/* Les points de la courbe : un par séance où l'exercice a été fait, du plus ancien au plus récent */
export function points(sessions, nom, m, periode) {
  const jours = (PERIODES[periode] || PERIODES.m3)[1],
    depuis = jours ? Date.now() - jours * JOUR : 0;
  const l = [];
  if (nom === TOUTES) {
    sessions
      .filter(s => s.date >= depuis)
      .sort((a, b) => a.date - b.date)
      .forEach(s => {
        const ne = s.exercises.filter(e => !e.cardio && e.sets.some(ok)).length,
          ns = nset(s),
          ex = ne + ' exercice' + (ne > 1 ? 's' : '');
        if (m === 'ser') {
          if (ns) l.push({t: s.date, v: ns, d: ex});
        } else if (m === 'dur') {
          if (+s.dur > 0) l.push({t: s.date, v: +s.dur, d: ex + ' · ' + ns + ' série' + (ns > 1 ? 's' : '')});
        } else {
          const v = vol(s);
          if (v > 0) l.push({t: s.date, v, d: ex + ' · ' + ns + ' série' + (ns > 1 ? 's' : '')});
        }
      });
    return l;
  }
  sessions
    .filter(s => s.date >= depuis)
    .sort((a, b) => a.date - b.date)
    .forEach(s => {
      let best = null;
      s.exercises.forEach(e => {
        if (e.cardio || e.name !== nom) return;
        const p = valeur(e, m);
        if (p && (!best || p.v > best.v)) best = p;
      });
      if (best) l.push({t: s.date, v: best.v, d: best.d});
    });
  return l;
}

const jourC = t => new Date(t).toLocaleDateString('fr-FR', {day: 'numeric', month: 'short'}).replace('.', '');
const unite = (v, m) =>
  m === 'ser'
    ? fmtN(Math.round(v * 10) / 10) + ' série' + (v >= 2 ? 's' : '')
    : m === 'dur'
      ? fmt(v) + ' min'
      : (m === 'vol' ? fmt(v) : fmtN(Math.round(v * 10) / 10)) + ' kg';

/* Graduations « rondes » pour l'axe vertical */
function graduations(lo, hi) {
  const brut = (hi - lo) / 3 || 1,
    p = Math.pow(10, Math.floor(Math.log10(brut))),
    pas = [1, 2, 2.5, 5, 10].map(x => x * p).find(x => x >= brut);
  const a = Math.floor(lo / pas) * pas,
    b = Math.ceil(hi / pas) * pas,
    l = [];
  for (let v = a; v <= b + pas / 2; v += pas) l.push(Math.round(v * 100) / 100);
  return l;
}

/* Le dessin. sel = index du point touché (par défaut : le dernier). */
export function dessin(pts, m, sel) {
  if (!pts.length) return '<p class="empty" style="margin:12px">Pas de séance sur cette période.</p>';
  const W = 320,
    H = 180,
    G = 38,
    D = 12,
    Hh = 14,
    B = 24; /* largeur, hauteur, marges gauche/droite/haut/bas */
  const vs = pts.map(p => p.v),
    lo0 = Math.min(...vs),
    hi0 = Math.max(...vs),
    marge = (hi0 - lo0) * 0.15 || Math.max(1, hi0 * 0.1);
  const gr = graduations(Math.max(0, lo0 - marge), hi0 + marge),
    lo = gr[0],
    hi = gr[gr.length - 1];
  const X = i => (pts.length === 1 ? (G + W - D) / 2 : G + (i * (W - G - D)) / (pts.length - 1));
  const Y = v => Hh + (1 - (v - lo) / (hi - lo || 1)) * (H - Hh - B);
  const rec = m === 'dur' ? -1 : vs.indexOf(hi0); /* une séance plus longue n'est pas un « record » */
  if (!(sel >= 0 && sel < pts.length)) sel = pts.length - 1;
  const ligne = pts.map((p, i) => (i ? 'L' : 'M') + X(i).toFixed(1) + ' ' + Y(p.v).toFixed(1)).join(' ');
  const aire = ligne + ` L${X(pts.length - 1).toFixed(1)} ${H - B} L${X(0).toFixed(1)} ${H - B} Z`;
  const axe = gr
    .map(
      v =>
        `<line x1="${G}" x2="${W - D}" y1="${Y(v).toFixed(1)}" y2="${Y(v).toFixed(1)}"/><text class="ya" x="${G - 6}" y="${(Y(v) + 3.5).toFixed(1)}">${m === 'vol' && v >= 1000 ? fmtN(v / 1000) + ' t' : fmtN(v)}</text>`
    )
    .join('');
  const idx = pts.length < 4 ? pts.map((_, i) => i) : [0, Math.round((pts.length - 1) / 2), pts.length - 1];
  const dates = idx
    .map(
      i =>
        `<text class="xa" x="${X(i).toFixed(1)}" y="${H - 6}" text-anchor="${i === 0 && pts.length > 1 ? 'start' : i === pts.length - 1 && pts.length > 1 ? 'end' : 'middle'}">${jourC(pts[i].t)}</text>`
    )
    .join('');
  const pastilles = pts
    .map(
      (p, i) =>
        `<circle class="pt${i === rec ? ' record' : ''}${i === sel ? ' sel' : ''}" cx="${X(i).toFixed(1)}" cy="${Y(p.v).toFixed(1)}" r="${i === sel ? 5.5 : i === rec ? 4.5 : 3}"/>`
    )
    .join('');
  /* zones de toucher larges (invisibles) : plus facile au doigt qu'un petit point */
  const zones = pts
    .map((p, i) => {
      const g = i ? (X(i) - X(i - 1)) / 2 : X(0) - G + 1,
        d = i < pts.length - 1 ? (X(i + 1) - X(i)) / 2 : W - D - X(i) + 1;
      return `<rect class="hit" data-act="cpt" data-x="${i}" x="${(X(i) - g).toFixed(1)}" y="0" width="${(g + d).toFixed(1)}" height="${H}"/>`;
    })
    .join('');
  const s = pts[sel];
  const repere = `<line class="vl" x1="${X(sel).toFixed(1)}" x2="${X(sel).toFixed(1)}" y1="${Hh}" y2="${H - B}"/>`;
  return `<svg class="courbe" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(MESURES[m] || MESURES_G[m])} : ${pts.length} séance${pts.length > 1 ? 's' : ''}, de ${unite(pts[0].v, m)} à ${unite(pts[pts.length - 1].v, m)}">
<defs><linearGradient id="cg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#818cf8" stop-opacity=".35"/><stop offset="1" stop-color="#818cf8" stop-opacity="0"/></linearGradient>
<linearGradient id="cl" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#0d9488"/><stop offset=".55" stop-color="#4f46e5"/><stop offset="1" stop-color="#9333ea"/></linearGradient></defs>
<g class="grille">${axe}</g>${repere}<path class="aire" d="${aire}"/><path class="ligne" d="${ligne}"/>${pastilles}${dates}${zones}</svg>
<div class="cdet" aria-live="polite"><span>${jourC(s.t)}${sel === rec ? ' · <b class="crec">Record</b>' : ''}</span><span>${esc(s.d)}</span><b>${unite(s.v, m)}</b></div>`;
}

/* Le chiffre du haut : la dernière valeur, et l'évolution depuis le début de la période */
export function resume(pts, m) {
  if (!pts.length) return '';
  const der = pts[pts.length - 1].v,
    ec = der - pts[0].v,
    pct = pts[0].v ? Math.round((ec / pts[0].v) * 100) : 0;
  const evo =
    pts.length < 2
      ? '<span class="cev">1re séance de la période</span>'
      : Math.abs(ec) < 0.05
        ? '<span class="cev">stable sur la période</span>'
        : `<span class="cev ${ec > 0 ? 'up' : 'down'}">${ec > 0 ? '▲ +' : '▼ −'}${unite(Math.abs(ec), m)}${pct ? ' (' + (ec > 0 ? '+' : '−') + Math.abs(pct) + ' %)' : ''}</span>`;
  return `<div class="cres"><b>${unite(der, m)}</b>${evo}</div>`;
}
