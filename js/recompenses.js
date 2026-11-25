/* Fluxe Suivi — Semaines d'affilée et récompenses (v3.6.0).
   - Une semaine va du lundi au dimanche. Elle compte dès qu'il y a au moins 1 séance.
     La semaine en cours ne casse pas la série tant qu'elle n'est pas finie.
   - 24 récompenses réalistes, calculées à partir de l'historique (les séances déjà faites comptent dès le départ).
     Les premières viennent vite, les dernières demandent des mois ou des années. */
import {mieux, ok, vol} from './outils.js';
import {progression} from './progression.js';

const JOUR = 864e5;
/* lundi 0 h de la semaine d'un moment */
function lundi(t) {
  const d = new Date(t);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return d.getTime();
}
/* n° de semaine en partant de celle-ci (0), arrondi pour ignorer les changements d'heure */
const numSemaine = (t, now) => Math.round((lundi(now) - lundi(t)) / (7 * JOUR));

/**
 * Semaines d'affilée avec au moins une séance (lundi → dimanche).
 * @param {import('./donnees.js').Seance[]} sessions
 * @param {number} [now]
 * @returns {{n: number, affiche: number, record: number, barres: number[], cetteSemaine: number}}
 *   n = vraie série (récompenses) ; affiche = chiffre du bouton : 0 tant qu'il n'y a pas de séance cette semaine (v3.14.1) ;
 *   barres = séances des 5 dernières semaines
 */
export function semaines(sessions, now = Date.now()) {
  const par = new Map();
  for (const s of sessions) {
    const k = numSemaine(s.date, now);
    if (k >= 0) par.set(k, (par.get(k) || 0) + 1);
  }
  let n = 0;
  const debut = par.has(0) ? 0 : 1;
  while (par.has(debut + n)) n++;
  let record = 0,
    suite = 0;
  const ks = [...par.keys()].sort((a, b) => a - b);
  ks.forEach((k, i) => {
    suite = i && k === ks[i - 1] + 1 ? suite + 1 : 1;
    record = Math.max(record, suite);
  });
  const barres = [4, 3, 2, 1, 0].map(k => par.get(k) || 0); /* 5 dernières semaines */
  return {n, affiche: par.has(0) ? n : 0, record: Math.max(record, n), barres, cetteSemaine: par.get(0) || 0};
}

/* nombre de records battus : chaque série qui dépasse le meilleur poids précédent de l'exercice */
function nbRecords(sessions) {
  const best = new Map();
  let n = 0;
  for (const s of [...sessions].sort((a, b) => a.date - b.date))
    for (const e of s.exercises || []) {
      if (e.cardio) continue;
      for (const x of (e.sets || []).filter(ok)) {
        const b = best.get(e.name);
        if (!b) best.set(e.name, x);
        else if (mieux(x, b)) {
          best.set(e.name, x);
          n++;
        }
      }
    }
  return n;
}

/* id, famille, titre, cible, icône (pictos), et quelle valeur mesurer */
const R = (id, famille, titre, cible, icone, mesure) => ({id, famille, titre, cible, icone, mesure});
export const RECOMPENSES = [
  R('serie4', 'Régularité', '4 semaines', 4, 'flamme', 'serie'),
  R('serie8', 'Régularité', '8 semaines', 8, 'flamme', 'serie'),
  R('serie12', 'Régularité', '12 semaines', 12, 'flamme', 'serie'),
  R('serie26', 'Régularité', '6 mois', 26, 'flamme', 'serie'),
  R('serie52', 'Régularité', '1 an', 52, 'flamme', 'serie'),
  R('seance1', 'Séances', '1re séance', 1, 'salle', 'seances'),
  R('seance10', 'Séances', '10 séances', 10, 'salle', 'seances'),
  R('seance50', 'Séances', '50 séances', 50, 'salle', 'seances'),
  R('seance100', 'Séances', '100 séances', 100, 'salle', 'seances'),
  R('seance250', 'Séances', '250 séances', 250, 'salle', 'seances'),
  R('record1', 'Force', '1er record', 1, 'trophee', 'records'),
  R('record10', 'Force', '10 records', 10, 'trophee', 'records'),
  R('record50', 'Force', '50 records', 50, 'trophee', 'records'),
  R('record100', 'Force', '100 records', 100, 'trophee', 'records'),
  R('tonnes10', 'Volume', '10 tonnes', 10, 'volume', 'tonnes'),
  R('tonnes100', 'Volume', '100 tonnes', 100, 'volume', 'tonnes'),
  R('tonnes500', 'Volume', '500 tonnes', 500, 'volume', 'tonnes'),
  R('tonnes1000', 'Volume', '1 000 tonnes', 1000, 'volume', 'tonnes'),
  R('pesee1', 'Mon corps', '1re pesée', 1, 'poids', 'pesees'),
  R('mesures1', 'Mon corps', 'Mensurations', 1, 'regle', 'mesures'),
  R('pesee10', 'Mon corps', '10 pesées', 10, 'poids', 'pesees'),
  R('inter', 'Mannequin', 'Intermédiaire', 20, 'corps', 'niveau'),
  R('avance', 'Mannequin', 'Avancé', 50, 'corps', 'niveau'),
  R('elite', 'Mannequin', 'Élite', 80, 'etoile', 'niveau'),
];
export const FAMILLES = ['Régularité', 'Séances', 'Force', 'Volume', 'Mon corps', 'Mannequin'];

/**
 * Chaque récompense avec sa valeur actuelle et si elle est obtenue.
 * @param {{sessions: import('./donnees.js').Seance[], corps?: import('./donnees.js').Mesure[], mu?: Object<string, string>}} d
 * @param {number} [now]
 * @returns {Array<{id: string, famille: string, titre: string, cible: number, icone: string, mesure: string, valeur: number, ok: boolean}>}
 */
export function tableau(d, now = Date.now()) {
  const l = d.sessions || [],
    corps = d.corps || [];
  const v = {
    serie: semaines(l, now).record,
    seances: l.length,
    records: nbRecords(l),
    tonnes: l.reduce((a, s) => a + vol(s), 0) / 1000,
    pesees: corps.filter(x => x.kg > 0).length,
    mesures: corps.filter(x => ['taille', 'poitrine', 'bras', 'cuisse', 'hanches'].some(k => x[k] > 0)).length,
    niveau: l.length ? Math.round(progression(l, d.mu || {}, now).global * 100) : 0,
  };
  return RECOMPENSES.map(r => ({...r, valeur: v[r.mesure], ok: v[r.mesure] >= r.cible}));
}
/* celles obtenues qui n'ont pas encore été annoncées */
export const nouvelles = (t, vues) => t.filter(x => x.ok && !(vues || []).includes(x.id));
