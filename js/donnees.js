/* Fluxe Suivi — Lecture et nettoyage des données (téléphone ET fichiers importés) : seul ce qui est valide est gardé. */
import {BKD, J30, KEY} from './config.js';
import {GROUPES_PERSO} from './muscles.js';
import {RECOMPENSES} from './recompenses.js';
/* ===== Format des données (pour un développeur : voir aussi docs/DEVELOPPEUR.md) ===== */
/**
 * Une série de musculation (valeurs gardées en texte, comme saisies) ou un bloc de cardio.
 * @typedef {{kg: string, reps: string, done: boolean, w?: true, t?: true}} Serie  w = échauffement, t = touchée à la main
 * @typedef {{min: string, km: string, kcal: string, done: boolean, t?: true}} BlocCardio
 * @typedef {{name: string, cardio?: true, sets: Array<Serie|BlocCardio>}} Exercice
 * @typedef {{id: string, date: number, dur?: number, mod?: number, rt?: string, g?: string, gn?: string,
 *   edit?: true, exercises: Exercice[]}} Seance  date et mod en millisecondes ; rt = routine de départ ; g/gn = salle
 * @typedef {{id?: string, name: string, exercises: string[], sets?: Array<Array<Object>>}} Routine
 * @typedef {{id: string, name: string, eq: string[], notes: Object<string, string>, chain?: string}} Salle
 * @typedef {{t: number, kg?: number, mg?: number, taille?: number, poitrine?: number, bras?: number,
 *   cuisse?: number, hanches?: number}} Mesure  une pesée et/ou des mensurations (cm), à la date t
 * @typedef {{sessions: Seance[], routines: Routine[], current: string|null, notes: Object<string, string>,
 *   rests: Object<string, number>, gyms: Salle[], gym?: string, mu: Object<string, string>, corps: Mesure[],
 *   rv: string[], rvInit?: true, trash: Array<{at: number, s?: Seance, r?: Routine}>, rest?: number,
 *   lastBackup?: number, snooze?: number, bkEvery?: string, nv?: true, editBak?: Seance}} Donnees
 */
/* ===== Petits outils de nettoyage (communs à toutes les données) ===== */
/** Texte sans caractères de contrôle, sans espaces autour, au plus n caractères ('' si ce n'est pas du texte). */
const str = (v, n) =>
  typeof v === 'string'
    ? v
        .replace(/[\u0000-\u001f\u007f]/g, '')
        .trim()
        .slice(0, n)
    : '';
/** Nombre fini, sinon null. */
const num = v => (typeof v === 'number' && isFinite(v) ? v : null);
/** Valeur de série saisie (kg, reps…) : texte de chiffres avec au plus 3 décimales, sinon ''. */
const val = v => {
  if (typeof v === 'number') v = String(v);
  return typeof v === 'string' && /^\d{0,5}(\.\d{0,3})?$/.test(v) ? v : '';
};
/* Nettoyage et vérification des données (stockage local ET import) : seul ce qui est valide est gardé */
function cleanSession(s) {
  if (!s || typeof s !== 'object' || !Array.isArray(s.exercises)) return null;
  const id = str(s.id, 40),
    date = num(s.date);
  if (!/^[A-Za-z0-9_-]{1,40}$/.test(id) || date === null) return null;
  const n = {id, date, exercises: []},
    dur = num(s.dur),
    mod = num(s.mod);
  if (dur !== null && dur >= 0 && dur <= 1440) n.dur = Math.round(dur);
  if (mod !== null && mod > 0) n.mod = mod; /* date de dernière modification : sert à la fusion */
  if (typeof s.rt === 'string' && /^[A-Za-z0-9_-]{1,40}$/.test(s.rt)) n.rt = s.rt; /* routine de départ */
  if (typeof s.g === 'string' && /^[A-Za-z0-9_-]{1,40}$/.test(s.g)) {
    n.g = s.g;
    const gn = str(s.gn, 40);
    if (gn) n.gn = gn;
  } /* salle de la séance */
  for (const e of s.exercises.slice(0, 60)) {
    if (!e || typeof e !== 'object' || !Array.isArray(e.sets)) continue;
    const name = str(e.name, 60);
    if (!name) continue;
    const cd = e.cardio === true,
      sets = [];
    for (const x of e.sets.slice(0, 60)) {
      if (!x || typeof x !== 'object') continue;
      const t = cd
        ? {min: val(x.min), km: val(x.km), kcal: val(x.kcal), done: x.done !== false}
        : {kg: val(x.kg), reps: val(x.reps), done: x.done !== false};
      if (!cd && x.w === true) t.w = true;
      if (x.t === true) t.t = true;
      sets.push(t);
    }
    n.exercises.push(cd ? {name, cardio: true, sets} : {name, sets});
  }
  return n;
}
/* Une routine : {id, name, exercises:[noms], sets:[[{kg,reps,w?}…] ou [{min,km,kcal}…] (cardio) par exercice]}.
   « sets » est facultatif (anciennes routines) : sans lui, la séance reprend les séries de la dernière fois. */
function cleanRoutine(r) {
  if (!r || typeof r !== 'object' || !Array.isArray(r.exercises)) return null;
  const name = str(r.name, 60),
    ex = [],
    sets = [],
    plan = Array.isArray(r.sets);
  r.exercises.slice(0, 60).forEach((x, i) => {
    const n = str(x, 60);
    if (!n) return;
    ex.push(n);
    const l =
      plan && Array.isArray(r.sets[i])
        ? r.sets[i]
            .slice(0, 30)
            .filter(y => y && typeof y === 'object')
            .map(y => {
              if ('min' in y || 'km' in y || 'kcal' in y) return {min: val(y.min), km: val(y.km), kcal: val(y.kcal)};
              const t = {kg: val(y.kg), reps: val(y.reps)};
              if (y.w === true) t.w = true;
              return t;
            })
        : [];
    sets.push(l);
  });
  if (!name || !ex.length) return null;
  const o = {name, exercises: ex};
  if (typeof r.id === 'string' && /^[A-Za-z0-9_-]{1,40}$/.test(r.id)) o.id = r.id;
  if (plan) o.sets = sets;
  return o;
}
/* bornes de chaque mesure (en dehors : valeur absurde, écartée) */
const BORNES = {
  kg: [20, 400],
  mg: [2, 70],
  taille: [10, 300],
  poitrine: [10, 300],
  bras: [10, 300],
  cuisse: [10, 300],
  hanches: [10, 300],
};
/**
 * Pesées et mensurations valides seulement (bornes réalistes), sans doublon, triées par date.
 * @param {unknown} l
 * @returns {Mesure[]}
 */
export function nettoyerCorps(l) {
  const o = [],
    vus = new Set();
  if (!Array.isArray(l)) return o;
  for (const x of l.slice(0, 3000)) {
    if (!x || typeof x !== 'object' || typeof x.t !== 'number' || !isFinite(x.t) || x.t <= 0) continue;
    const e = {t: x.t};
    for (const [k, [a, b]] of Object.entries(BORNES))
      if (typeof x[k] === 'number' && isFinite(x[k]) && x[k] >= a && x[k] <= b) e[k] = Math.round(x[k] * 10) / 10;
    const cle = JSON.stringify(e);
    if (Object.keys(e).length > 1 && !vus.has(cle)) {
      vus.add(cle);
      o.push(e);
    }
  }
  return o.sort((a, b) => a.t - b.t);
}
/**
 * Nettoie des données venues du téléphone, d'un fichier ou du serveur : seul ce qui est valide est gardé.
 * @param {unknown} d
 * @returns {Donnees|null} null si ce n'est pas une sauvegarde Fluxe
 */
export function clean(d) {
  if (!d || typeof d !== 'object' || !Array.isArray(d.sessions)) return null;
  const o = {sessions: [], routines: [], current: null, notes: {}, rests: {}},
    ids = new Set(),
    eb = cleanSession(d.editBak);
  for (const s of d.sessions.slice(0, 5000)) {
    const c = cleanSession(s);
    if (!c || ids.has(c.id)) continue;
    ids.add(c.id);
    if (s.edit === true && eb && eb.id === c.id && d.current === c.id) {
      c.edit = true;
      o.editBak = eb;
    }
    o.sessions.push(c);
  }
  if (Array.isArray(d.routines))
    for (const r of d.routines.slice(0, 200)) {
      const c = cleanRoutine(r);
      if (c) o.routines.push(c);
    }
  if (typeof d.current === 'string' && ids.has(d.current)) o.current = d.current;
  if (d.notes && typeof d.notes === 'object')
    for (const [k, v] of Object.entries(d.notes).slice(0, 1000)) {
      const t = str(v, 200);
      if (/^k:.{1,60}$/.test(k) && t) o.notes[k] = t;
    }
  if (d.rests && typeof d.rests === 'object')
    for (const [k, v] of Object.entries(d.rests).slice(0, 1000)) {
      if (/^k:.{1,60}$/.test(k) && num(v) !== null && v >= 15 && v <= 600) o.rests[k] = Math.round(v);
    }
  /* Exercices perso : le groupe de muscles choisi par l'utilisateur (v3.3.0), {nom: groupe} */
  o.mu = {};
  if (d.mu && typeof d.mu === 'object')
    for (const [k, v] of Object.entries(d.mu).slice(0, 1000)) {
      const n = str(k, 61);
      if (n && n.length <= 60 && n === k && GROUPES_PERSO.includes(v)) o.mu[n] = v;
    }
  /* Mon corps (v3.6.0) : pesées et mensurations, {t, kg?, mg?, taille?, poitrine?, bras?, cuisse?, hanches?} */
  o.corps = nettoyerCorps(d.corps);
  /* récompenses déjà annoncées (v3.6.0) */
  if (d.rvInit === true) o.rvInit = true;
  o.rv = Array.isArray(d.rv) ? [...new Set(d.rv.filter(x => RECOMPENSES.some(r => r.id === x)))] : [];
  const r = num(d.rest);
  if (r !== null && r >= 15 && r <= 600) o.rest = Math.round(r);
  for (const k of ['lastBackup', 'snooze']) {
    const v = num(d[k]);
    if (v !== null && v > 0) o[k] = v;
  }
  if (BKD.includes(d.bkEvery)) o.bkEvery = d.bkEvery;
  if (d.nv === true) o.nv = true; /* vibration de fin de repos coupée */
  /* Corbeille : séances (s) et routines (r) supprimées, gardées 30 jours */
  o.trash = [];
  if (Array.isArray(d.trash))
    for (const t of d.trash.slice(0, 500)) {
      if (!t || typeof t !== 'object') continue;
      const at = num(t.at);
      if (at === null || at <= 0) continue;
      if (t.s) {
        const c = cleanSession(t.s);
        if (c) o.trash.push({at, s: c});
      } else if (t.r) {
        const c = cleanRoutine(t.r);
        if (c) o.trash.push({at, r: c});
      }
    }
  /* Ma salle : salles de l'utilisateur, machines présentes, notes de réglage propres à chaque salle */
  o.gyms = [];
  if (Array.isArray(d.gyms))
    for (const g of d.gyms.slice(0, 20)) {
      if (!g || typeof g !== 'object') continue;
      const id = str(g.id, 40),
        name = str(g.name, 40);
      if (!/^[A-Za-z0-9_-]{1,40}$/.test(id) || !name || o.gyms.some(x => x.id === id)) continue;
      const eq = Array.isArray(g.eq)
          ? [
              ...new Set(
                g.eq
                  .slice(0, 600)
                  .map(x => str(x, 60))
                  .filter(Boolean)
              ),
            ]
          : [],
        notes = {};
      if (g.notes && typeof g.notes === 'object')
        for (const [k, v] of Object.entries(g.notes).slice(0, 1000)) {
          const t = str(v, 200);
          if (/^k:.{1,60}$/.test(k) && t) notes[k] = t;
        }
      const ch = typeof g.chain === 'string' && /^[a-z-]{1,20}$/.test(g.chain) ? g.chain : '';
      o.gyms.push(ch ? {id, name, eq, notes, chain: ch} : {id, name, eq, notes});
    }
  if (typeof d.gym === 'string' && o.gyms.some(g => g.id === d.gym)) o.gym = d.gym;
  return o;
}
/* Un fichier de sauvegarde v2.1+ est « emballé » : {app, format, exportedAt, data}. Les anciens fichiers contiennent directement les données. */
/* (déclarées avec « function » pour être utilisables dès le chargement des données, tout en haut du fichier) */
export function unwrap(p) {
  return p && typeof p === 'object' && p.app === 'fluxe-suivi' && p.data && typeof p.data === 'object' ? p.data : p;
}
export function purge(d) {
  const n = Date.now();
  d.trash = d.trash.filter(t => n - t.at < J30);
  return d;
}
export function load() {
  let raw = null;
  try {
    raw = localStorage.getItem(KEY);
  } catch (e) {}
  try {
    const p = JSON.parse(raw),
      d = clean(p);
    if (d) {
      if (p.sessions.length !== d.sessions.length)
        try {
          localStorage.setItem(KEY + '-brut', raw);
        } catch (e) {}
      return purge(d);
    }
  } catch (e) {}
  /* Données présentes mais illisibles : on en garde une copie AVANT que le premier enregistrement ne les écrase */
  if (raw) {
    load.bad = raw;
    try {
      localStorage.setItem(KEY + '-illisible', raw);
    } catch (e) {}
  }
  return {
    sessions: [],
    routines: [],
    current: null,
    notes: {},
    rests: {},
    trash: [],
    gyms: [],
    mu: {},
    corps: [],
    rv: [],
  };
}
