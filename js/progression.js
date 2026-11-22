/* Fluxe Suivi — Ma progression (v3.4.0) : le niveau de chaque muscle, de 0 à 1.
   Niveau = moitié Régularité + moitié Force.
   - Régularité : chaque semaine, les séries validées (hors échauffement) font monter le muscle.
     Muscle principal = 1 série, secondaire = ½ (voir muscles.js). Au-delà du plafond (20 séries par semaine
     pour Pectoraux, Dos, Jambes ; 16 pour les autres), ça ne sert plus à rien.
     On progresse vite au début, puis de plus en plus lentement : R += 0,026 × part du plafond × (1 − R)².
     Repères avec 12 séries par semaine : 1 an ≈ 45 %, 3 ans ≈ 70 %.
     Après 3 semaines sans travailler un muscle, il perd 1 % par semaine (la mémoire musculaire existe).
   - Force : gain du 1RM estimé sur le meilleur exercice du muscle (où il est principal) :
     meilleur 1RM des 8 semaines avant sa dernière séance, comparé au tout premier. F = gain ÷ (gain + 0,75) :
     +50 % → 40 %, ×2 → 57 %, ×3 → 73 %. Si les charges baissent, la force baisse.
   Les couleurs suivent la palette B « Fluxe intense » : gris → turquoise → bleu → indigo → violet → magenta. */
import {MUSCLES, musclesDe} from './muscles.js';
import {rm1} from './courbe.js';
import {ok} from './outils.js';

const SEMAINE = 7 * 864e5,
  VITESSE = 0.026,
  OUBLI = 0.01,
  PAUSE = 3,
  FENETRE = 56 * 864e5;
const plafond = m => (['Pectoraux', 'Dos', 'Jambes'].includes(MUSCLES[m].groupe) ? 20 : 16);
/* muscles qui comptent dans le niveau global (les petits muscles rarement travaillés ne le tirent pas vers le bas) */
export const MUSCLES_GLOBAL = [
  'pec',
  'dors',
  'trap',
  'lomb',
  'dela',
  'dell',
  'delp',
  'bic',
  'tri',
  'quad',
  'isch',
  'fess',
  'mol',
  'abd',
];

export const palier = n => (n >= 0.8 ? 'Élite' : n >= 0.5 ? 'Avancé' : n >= 0.2 ? 'Intermédiaire' : 'Débutant');

const STOPS = [
  [0, [214, 219, 231]],
  [0.12, [94, 234, 212]],
  [0.4, [56, 189, 248]],
  [0.65, [99, 102, 241]],
  [0.85, [147, 51, 234]],
  [1, [219, 39, 119]],
];
export function couleur(n) {
  n = Math.max(0, Math.min(1, +n || 0));
  for (let i = 1; i < STOPS.length; i++) {
    const [a, ca] = STOPS[i - 1],
      [b, cb] = STOPS[i];
    if (n <= b) {
      const t = (n - a) / (b - a);
      return (
        '#' +
        ca
          .map((c, k) =>
            Math.round(c + (cb[k] - c) * t)
              .toString(16)
              .padStart(2, '0')
          )
          .join('')
      );
    }
  }
  return '#db2777';
}

/* sessions : séances terminées ; mu : muscles des exercices perso (S.mu) */
export function progression(sessions, mu, now = Date.now()) {
  const ids = Object.keys(MUSCLES);
  const parSemaine = new Map(); /* n° de semaine (0 = cette semaine) → {muscle: séries} */
  const exos = new Map(); /* exercice → [{t, rm}] (meilleur 1RM estimé de la séance) */
  const total = Object.fromEntries(ids.map(m => [m, 0]));
  let vieille = 0;
  for (const s of sessions) {
    const k = Math.max(0, Math.floor((now - s.date) / SEMAINE));
    for (const e of s.exercises || []) {
      if (e.cardio) continue;
      const ss = (e.sets || []).filter(ok);
      if (!ss.length) continue;
      const mus = musclesDe(e.name, mu);
      if (!Object.keys(mus).length) continue;
      vieille = Math.max(vieille, k);
      let w = parSemaine.get(k);
      if (!w) parSemaine.set(k, (w = {}));
      for (const [m, p] of Object.entries(mus)) {
        w[m] = (w[m] || 0) + p * ss.length;
        total[m] += p * ss.length;
      }
      const best = Math.max(0, ...ss.map(x => rm1(x) || 0));
      if (best > 0) {
        if (!exos.has(e.name)) exos.set(e.name, []);
        exos.get(e.name).push({t: s.date, rm: best});
      }
    }
  }
  /* Régularité, semaine après semaine, de la plus ancienne à celle-ci */
  const R = Object.fromEntries(ids.map(m => [m, 0])),
    vide = Object.fromEntries(ids.map(m => [m, 0]));
  if (parSemaine.size)
    for (let k = vieille; k >= 0; k--) {
      const w = parSemaine.get(k) || {};
      for (const m of ids) {
        if (w[m] > 0) {
          const x = Math.min(1, w[m] / plafond(m));
          R[m] += VITESSE * x * (1 - R[m]) ** 2;
          vide[m] = 0;
        } else if (R[m] > 0 && ++vide[m] > PAUSE) R[m] *= 1 - OUBLI;
      }
    }
  /* Force : meilleur exercice de chaque muscle (là où il est principal) */
  const F = Object.fromEntries(ids.map(m => [m, {force: 0, exo: null}]));
  for (const [nom, l] of exos) {
    if (l.length < 2) continue;
    l.sort((a, b) => a.t - b.t);
    const debut = l[0].rm,
      fin = l[l.length - 1].t,
      actuel = Math.max(...l.filter(x => x.t >= fin - FENETRE).map(x => x.rm)),
      gain = Math.max(0, actuel / debut - 1),
      force = gain / (gain + 0.75);
    for (const [m, p] of Object.entries(musclesDe(nom, mu)))
      if (p === 1 && force > F[m].force) F[m] = {force, exo: {nom, debut, actuel, gain}};
  }
  const muscles = {};
  for (const m of ids) {
    const rec = [...parSemaine.entries()].filter(([k]) => k < 12).reduce((a, [, w]) => a + (w[m] || 0), 0);
    muscles[m] = {
      regularite: R[m],
      force: F[m].force,
      niveau: (R[m] + F[m].force) / 2,
      exo: F[m].exo,
      series: total[m],
      parSemaine: rec / 12,
    };
  }
  const global = MUSCLES_GLOBAL.reduce((a, m) => a + muscles[m].niveau, 0) / MUSCLES_GLOBAL.length;
  return {muscles, global, palier: palier(global)};
}
