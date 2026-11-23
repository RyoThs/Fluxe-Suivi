/* Fluxe Suivi — Outils (pas chargés par l'app) : lire une page club, nettoyer une liste, comparer deux listes.
   Fonctions pures, sans réseau : testées par tests/28-outils-clubs.test.js.
   Une ligne de liste = [identifiant (sans préfixe), nom sans la marque, ville, code postal, 1 si pré-ouverture]. */
import {createHash} from 'node:crypto';

/* ===== Petits outils de texte ===== */
const NOMMES = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
  rsquo: '’',
  lsquo: '‘',
  ndash: '–',
  eacute: 'é',
  egrave: 'è',
  ecirc: 'ê',
  euml: 'ë',
  agrave: 'à',
  acirc: 'â',
  ccedil: 'ç',
  icirc: 'î',
  iuml: 'ï',
  ocirc: 'ô',
  ucirc: 'û',
  ugrave: 'ù',
  oelig: 'œ',
  Eacute: 'É',
  Egrave: 'È',
  Agrave: 'À',
  Ccedil: 'Ç',
};
/** Décode les codes HTML (&amp;, &#39;, &eacute;…). */
export const decoder = t =>
  String(t ?? '').replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, c) =>
    c[0] === '#'
      ? String.fromCodePoint(
          parseInt(c[1] === 'x' || c[1] === 'X' ? c.slice(2) : c.slice(1), c[1] === 'x' || c[1] === 'X' ? 16 : 10)
        )
      : (NOMMES[c] ?? m)
  );
/** Identifiant lisible : « Saint-Étienne » -> « saint-etienne » (lettres sans accent, chiffres, tirets). */
export const slug = t =>
  String(t ?? '')
    .normalize('NFD')
    .replace(/[^\x00-\x7f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const PETITS = new Set([
  'de',
  'du',
  'des',
  'la',
  'le',
  'les',
  'en',
  'sur',
  'sous',
  'lès',
  'lez',
  'aux',
  'au',
  'et',
  'd',
  'l',
]);
/* un mot d'au moins n lettres TOUT EN MAJUSCULES (lettres accentuées comprises) */
const MAJ = n => new RegExp('(?<![\\p{L}\\d_])([A-ZÀ-Ý]{' + n + ',})(?![\\p{L}\\d_])', 'gu');
const capitaliser = m => m[0] + m.slice(1).toLowerCase();
/** Nettoie un nom : espaces, tirets, apostrophes, mots TOUT EN MAJUSCULES. */
export function joli(v) {
  v = String(v ?? '').replace(/[​-‏⁠﻿]/g, '');
  v = v.replace(/–/g, '-').replace(/’/g, "'").replace(/\s+/g, ' ').trim();
  v = v.replace(MAJ(4), capitaliser);
  if (v && (v === v.toLowerCase() || v === v.toUpperCase())) {
    const mots = v.toLowerCase().split(/([ \-'])/);
    v = mots.map((m, i) => (i && PETITS.has(m) ? m : m.slice(0, 1).toUpperCase() + m.slice(1))).join('');
  }
  return v;
}
/** Nettoie une ville : « BRIANÇON » -> « Briançon », « Aix-En-Provence » -> « Aix-en-Provence ». */
export function ville(v) {
  v = joli(v).replace(MAJ(2), capitaliser);
  return v
    .split(/([ \-])/)
    .map((m, i) => (i && PETITS.has(m.toLowerCase()) ? m.toLowerCase() : m))
    .join('');
}

/* ===== Lire une page club (données publiques « JSON-LD » de la page) ===== */
const TYPES = new Set(['ExerciseGym', 'SportsActivityLocation', 'HealthClub', 'LocalBusiness', 'SportsClub']);
/**
 * @param {string} html la page
 * @param {string} url son adresse
 * @returns {{url: string, titre?: string, nom?: string, rue?: string, cp?: string, ville?: string, pays?: string}}
 */
export function lireGym(html, url) {
  const out = {url};
  const t = /<title>([\s\S]*?)<\/title>/.exec(html);
  if (t) out.titre = decoder(t[1]).replace(/\s+/g, ' ').trim();
  for (const m of html.matchAll(/<script[^>]*application\/ld\+json[^>]*>([\s\S]*?)<\/script>/g)) {
    let d;
    try {
      d = JSON.parse(m[1]);
    } catch {
      continue;
    }
    const file = [d];
    while (file.length) {
      const x = file.shift();
      if (Array.isArray(x)) {
        file.push(...x);
        continue;
      }
      if (!x || typeof x !== 'object') continue;
      const ty = [].concat(x['@type']);
      const a = x.address;
      if (a && typeof a === 'object' && !Array.isArray(a) && ty.some(y => TYPES.has(y))) {
        Object.assign(out, {
          nom: decoder(x.name),
          rue: decoder(a.streetAddress),
          cp: String(a.postalCode ?? ''),
          ville: decoder(a.addressLocality),
          pays: a.addressCountry == null ? null : String(a.addressCountry),
        });
        return out;
      }
      file.push(...Object.values(x).filter(v => v && typeof v === 'object'));
    }
  }
  return out;
}

/* ===== Construire une liste propre ===== */
const T = {
  971: 'Guadeloupe',
  972: 'Martinique',
  973: 'Guyane',
  974: 'La Réunion',
  976: 'Mayotte',
  975: 'Saint-Pierre-et-Miquelon',
  977: 'Saint-Barthélemy',
  978: 'Saint-Martin',
  987: 'Polynésie',
  988: 'Nouvelle-Calédonie',
};
/* codes pays de la France et des DOM-TOM (certains sites les utilisent à la place de FR) */
const FRANCE = new Set(['FR', 'FRANCE', 'GP', 'MQ', 'GF', 'RE', 'YT', 'PM', 'BL', 'MF', 'PF', 'NC', 'WF']);
/** Ajoute le territoire d'outre-mer à la ville : « Ducos » -> « Ducos (Martinique) ». */
export const avecTerritoire = (v, cp) =>
  T[cp.slice(0, 3)] && !v.includes(T[cp.slice(0, 3)]) ? v + ' (' + T[cp.slice(0, 3)] + ')' : v;

function nomCourt(x, s) {
  let n = x.nom || '';
  if (s.nomDepuisTitre) n = (x.titre || n).replace(s.nomDepuisTitre, '');
  n = n.replace(/\s*24\/7\s*/g, ' ');
  n = n.replace(new RegExp('^\\s*' + s.marque.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\s*', 'i'), '');
  n = joli(n).replace(/^[ -]+|[ -]+$/g, '');
  /* « Aix-En-Provence », « Aire Sur L'Adour » -> « en », « sur » (jamais le/la/les : « Le Mans ») */
  return n.replace(/(?<=[ -])(En|Sur|Sous|Lès|Lez|Les(?=-))(?=[ -])/g, m => m.toLowerCase());
}

/**
 * Transforme les pages lues en lignes propres, triées par nom.
 * @param {Array<object>} lus résultats de lireGym
 * @param {{marque: string, prefixe: string, nomDepuisTitre?: RegExp, exclure?: RegExp}} s la source
 * @returns {{lignes: Array<Array<string>>, ecartes: Array<{url: string, raison: string}>}}
 */
export function construire(lus, s) {
  const rows = [],
    ecartes = [],
    vus = new Map(),
    deja = new Set();
  for (const x of lus) {
    let cp = String(x.cp ?? '').replace(/\D/g, '');
    let pays = String(x.pays ?? '').toUpperCase();
    if (/bruxelles|brussel/i.test((x.url || '') + ' ' + (x.ville || ''))) pays = 'ETRANGER';
    if (cp.length === 4 && (!pays || FRANCE.has(pays))) cp = '0' + cp; /* le 0 du début perdu (ex. Briançon 05100) */
    if (cp.length !== 5 || (pays && !FRANCE.has(pays))) {
      ecartes.push({url: x.url, raison: cp.length !== 5 ? 'sans code postal' : 'hors de France'});
      continue;
    }
    const n = nomCourt(x, s);
    if (s.exclure && s.exclure.test(n)) {
      ecartes.push({url: x.url, raison: 'autre enseigne'});
      continue;
    }
    const cle = slug(n) + '|' + slug(x.rue) + '|' + cp;
    if (deja.has(cle)) {
      ecartes.push({url: x.url, raison: 'doublon exact'});
      continue;
    }
    deja.add(cle);
    const id = slug(n).slice(0, 40 - s.prefixe.length);
    if (!id) {
      ecartes.push({url: x.url, raison: 'sans nom'});
      continue;
    }
    rows.push({id, n, v: avecTerritoire(ville(x.ville), cp), cp, url: x.url, rue: joli(x.rue)});
    vus.set(id, (vus.get(id) || 0) + 1);
  }
  /* même nom : un petit code tiré de l'adresse de la page (toujours le même) et la rue pour les distinguer */
  for (const r of rows)
    if (vus.get(r.id) > 1) {
      const h = createHash('sha1').update(r.url).digest('hex').slice(0, 4);
      r.id = r.id.slice(0, 40 - s.prefixe.length - 5) + '-' + h;
      if (r.rue) r.n = (r.n + ' - ' + r.rue.replace(/^\d+\s*(bis|ter)?\s*,?\s*/i, '')).slice(0, 60);
    }
  if (new Set(rows.map(r => r.id)).size !== rows.length) throw new Error('identifiant en double');
  rows.sort((a, b) => (slug(a.n) < slug(b.n) ? -1 : slug(a.n) > slug(b.n) ? 1 : 0));
  return {lignes: rows.map(r => [r.id, r.n, r.v, r.cp]), ecartes};
}

/* ===== On Air : une seule page liste tous les clubs ===== */
/**
 * @param {string} html la page « Clubs » d'On Air
 * @returns {Array<Array<string|number>>} lignes (clubs de France et DOM-TOM ; « 1 » = pré-ouverture)
 */
export function lireOnAir(html) {
  const blancs = new Set(
    [...html.matchAll(/"style":"marker-white"[\s\S]{0,200}?"title":"((?:[^"\\]|\\.)*)"/g)].map(m =>
      JSON.parse('"' + m[1] + '"')
    )
  );
  const lignes = [];
  for (const b of html.split('class="single_club_map"').slice(1)) {
    const h = /<h3>([\s\S]*?)<\/h3>/.exec(b);
    if (!h) continue;
    const titre = decoder(h[1].replace(/<[^>]+>/g, '')).trim();
    const m = /^(.*?)\s*\((\d{2,3})\)$/.exec(titre);
    if (!m) continue; /* clubs à l'étranger : pas de numéro de département */
    const u = /href="https:\/\/onair-fitness\.fr\/club\/([^"/]+)\/" class="arx_black_button"/.exec(b);
    const a = /class="adresse">([\s\S]*?)<\/p>/.exec(b);
    const adr = decoder((a ? a[1] : '').replace(/<br\s*\/?>/g, ' | ').replace(/<[^>]+>/g, '')).replace(/\s+/g, ' ');
    const cps = [...adr.matchAll(/\b(\d{5}),?\s+([^|,]+)/g)];
    let cp = cps.length ? cps[cps.length - 1][1] : (/\b(97\d{3})\b/.exec(adr) || [])[1] || '';
    let v = cps.length ? cps[cps.length - 1][2].trim() : (/,\s*([^,]+?)\s+97\d{3}/.exec(adr) || [])[1] || '';
    v = v.replace(/\s*-\s*(Martinique|Guadeloupe)$/, '');
    const id = (u ? u[1] : slug(m[1])).replace(/-salle-de-sport$/, '');
    const nom = m[1].replace(/–/g, '-').replace(/’/g, "'");
    lignes.push([id, nom, avecTerritoire(v, cp), cp, ...(blancs.has(titre) ? [1] : [])]);
  }
  return lignes;
}

/* ===== Comparer la liste de l'app et la liste relue ===== */
/**
 * @param {Array<Array>} avant lignes de l'app (js/clubs/…)
 * @param {Array<Array>} apres lignes relues sur le site
 * @returns {{nouveaux: Array<Array>, disparus: Array<Array>, changes: Array<{avant: Array, apres: Array}>}}
 */
export function comparer(avant, apres) {
  const A = new Map(avant.map(l => [l[0], l])),
    B = new Map(apres.map(l => [l[0], l]));
  return {
    nouveaux: apres.filter(l => !A.has(l[0])),
    disparus: avant.filter(l => !B.has(l[0])),
    changes: apres.filter(l => A.has(l[0]) && A.get(l[0])[3] !== l[3]).map(l => ({avant: A.get(l[0]), apres: l})),
  };
}
