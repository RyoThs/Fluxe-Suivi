/* Fluxe Suivi — Résumé d'une séance pour l'Historique et l'image partagée (v3.17).
   Calculs seulement : aucun accès à l'écran, au stockage ni au réseau (testé directement par tests/32-historique.test.js). */
import {groupeDe} from './muscles.js';
import {dn, fmt, fmtN, mieux, ok, top} from './outils.js';

const sansAccent = t => t.normalize('NFD').replace(/[̀-ͯ]/g, '');
/* repère court du muscle : Pectoraux → PEC, Épaules → EPA, Cardio → CAR */
const code = g => sansAccent(g).slice(0, 3).toUpperCase();
const majuscule = t => t.charAt(0).toUpperCase() + t.slice(1);
const pluriel = (n, mot) => n + ' ' + mot + (n > 1 ? 's' : '');

/** Volume lisible : « 850 kg » ou, à partir d'une tonne, « 2,3 t ». */
export const volumeLisible = v => (v >= 1000 ? fmtN(Math.round(v / 100) / 10) + ' t' : fmt(v) + ' kg');

const volumeDe = s =>
  s.exercises.reduce((a, e) => (e.cardio ? a : a + e.sets.reduce((b, x) => b + (ok(x) ? +x.kg * +x.reps : 0), 0)), 0);

function ligneCardio(e) {
  const l = e.sets.filter(dn);
  const somme = k => l.reduce((a, x) => a + (parseFloat(String(x[k]).replace(',', '.')) || 0), 0);
  const p = [];
  if (somme('min')) p.push(fmtN(somme('min')) + ' min');
  if (somme('km')) p.push(fmtN(somme('km')) + ' km');
  if (somme('kcal')) p.push(Math.round(somme('kcal')) + ' kcal');
  return p.join(' · ') || pluriel(l.length, 'bloc');
}

/* meilleure série de chaque exercice dans les séances faites AVANT la date t */
function meilleuresAvant(toutes, t) {
  const m = Object.create(null);
  for (const s of toutes) {
    if (!(s.date < t)) continue;
    for (const e of s.exercises) {
      if (e.cardio) continue;
      const b = top(e.sets.filter(ok));
      if (b && mieux(b, m[e.name])) m[e.name] = b;
    }
  }
  return m;
}

/**
 * Ce qu'affiche la carte d'une séance.
 * @param {import('./donnees.js').Seance} s
 * @param {import('./donnees.js').Seance[]} toutes séances terminées (pour les records)
 * @param {Object<string, string>} [mu] groupes choisis pour les exercices perso
 */
export function resume(s, toutes, mu) {
  const avant = meilleuresAvant(toutes, s.date),
    series = Object.create(null),
    exercices = [];
  let cardio = false,
    records = 0;
  for (const e of s.exercises) {
    if (e.cardio) {
      if (!e.sets.some(dn)) continue;
      cardio = true;
      exercices.push({nom: e.name, code: 'CAR', cardio: true, record: false, ligne: ligneCardio(e)});
      continue;
    }
    const l = e.sets.filter(ok);
    if (!l.length) continue;
    const g = groupeDe(e.name, mu),
      b = top(l),
      record = !!avant[e.name] && mieux(b, avant[e.name]);
    series[g] = (series[g] || 0) + l.length;
    if (record) records++;
    exercices.push({
      nom: e.name,
      code: code(g),
      cardio: false,
      record,
      ligne: pluriel(l.length, 'série') + ' · ' + fmtN(+b.kg || 0) + ' kg × ' + b.reps,
    });
  }
  const groupes = Object.entries(series)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2)
    .map(([g]) => g);
  if (cardio) groupes.push('Cardio');
  const jour = majuscule(new Date(s.date).toLocaleDateString('fr-FR', {weekday: 'long', day: 'numeric', month: 'short'}));
  return {
    id: s.id,
    titre: groupes.join(' · ') || 'Séance',
    date: jour + (s.gn ? ' · ' + s.gn : ''),
    duree: s.dur ? s.dur + ' min' : '—',
    volume: volumeLisible(volumeDe(s)),
    records,
    exercices,
  };
}

const lundiDe = t => {
  const d = new Date(t);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return d.getTime();
};

/**
 * Les séances rangées par semaine, de la plus récente à la plus ancienne.
 * @param {import('./donnees.js').Seance[]} l
 * @param {number} [maintenant]
 * @returns {{titre: string, info: string, seances: import('./donnees.js').Seance[]}[]}
 */
export function semaines(l, maintenant = Date.now()) {
  const cette = lundiDe(maintenant),
    groupes = new Map();
  for (const s of [...l].sort((a, b) => b.date - a.date)) {
    const k = lundiDe(s.date);
    if (!groupes.has(k)) groupes.set(k, []);
    groupes.get(k).push(s);
  }
  return [...groupes].map(([k, ss]) => ({
    titre:
      k === cette
        ? 'Cette semaine'
        : 'Semaine du ' + new Date(k).toLocaleDateString('fr-FR', {day: 'numeric', month: 'short'}),
    info: pluriel(ss.length, 'séance') + ' · ' + volumeLisible(ss.reduce((a, s) => a + volumeDe(s), 0)),
    seances: ss,
  }));
}

/* nombre de séances depuis lundi (sous-titre « 3 cette semaine ») */
export const dansLaSemaine = (l, maintenant = Date.now()) => l.filter(s => s.date >= lundiDe(maintenant)).length;
