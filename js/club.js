/* Fluxe Suivi — Catalogue partagé par club (v3.8.0) : calculs purs, sans réseau.
   Chaque membre donne au plus UN avis par machine : { m: machine, k: genre d'avis, u: son compte, t: date, g?: muscle, b?: marque }.
   Genres : 'absent' (pas dans ma salle), 'present' (je confirme), 'marque' (autre marque), 'nom' (nom ou muscle faux), 'ajout'.
   Si un membre a donné plusieurs avis sur la même machine, seul le plus récent compte. */
import {CHAINS, M} from './catalogue.js';
import {esc, norm} from './outils.js';

export const SEUIL = {retrait: 3, ajout: 3, verifiee: 2};
export const GENRES = ['absent', 'present', 'marque', 'nom', 'ajout'];

/* garde seulement les avis bien formés, puis le plus récent de chaque membre pour chaque machine */
function derniers(avis) {
  const m = new Map();
  for (const a of Array.isArray(avis) ? avis : []) {
    if (!a || typeof a !== 'object' || typeof a.m !== 'string' || !a.m.trim()) continue;
    if (!GENRES.includes(a.k) || typeof a.u !== 'string' || !a.u) continue;
    const cle = norm(a.m) + '\u0000' + a.u,
      avant = m.get(cle);
    if (!avant || (+a.t || 0) >= (+avant.t || 0)) m.set(cle, a);
  }
  return [...m.values()];
}

/**
 * Ce que le club a décidé ensemble.
 * @param {Array<{m: string, k: string, u: string, t: number, g?: string, b?: string}>} avis
 * @returns {{retirees: Set<string>, verifiees: Set<string>, ajoutees: Array<{nom: string, muscle: string, marque: string, n: number}>, membres: number, confirmations: Map<string, {n: number, t: number}>}}
 *   confirmations (v3.20) : pour chaque machine confirmée, le nombre de membres et la date de la dernière confirmation
 *   retirees / verifiees : noms en minuscules (norm) ; membres : nombre de comptes qui ont donné un avis
 */
export function bilanClub(avis) {
  const l = derniers(avis),
    par = new Map();
  for (const a of l) {
    const n = norm(a.m);
    if (!par.has(n)) par.set(n, {absent: 0, present: 0, vus: 0, ajouts: [], tp: 0});
    const x = par.get(n);
    if (a.k === 'absent') x.absent++;
    if (a.k === 'present') {
      x.present++;
      x.tp = Math.max(x.tp, +a.t || 0);
    }
    if (a.k === 'present' || a.k === 'ajout') x.vus++;
    if (a.k === 'ajout') x.ajouts.push(a);
  }
  const retirees = new Set(),
    verifiees = new Set(),
    ajoutees = [],
    confirmations = new Map();
  for (const [n, x] of par) {
    if (x.present) confirmations.set(n, {n: x.present, t: x.tp});
    if (x.absent >= SEUIL.retrait && x.absent > x.present) retirees.add(n);
    if (x.present >= SEUIL.verifiee) verifiees.add(n);
    if (x.ajouts.length && x.vus >= SEUIL.ajout) {
      const tri = [...x.ajouts].sort((a, b) => (+a.t || 0) - (+b.t || 0)),
        premier = tri[0];
      ajoutees.push({
        nom: premier.m.trim(),
        muscle: (tri.find(a => a.g) || {}).g || '',
        marque: (tri.find(a => a.b) || {}).b || '',
        n: x.vus,
      });
    }
  }
  return {retirees, verifiees, ajoutees, membres: new Set(l.map(a => a.u)).size, confirmations};
}

/* ===== Lecture sûre des réponses du serveur ===== */
const CHAMPS = ['n', 'e', 'v', 'u', 't', 'm', 'k', 'g', 'b'];
/**
 * Transforme des documents lus sur le serveur [{id, data}] en objets simples : {id, champ: texte | nombre}.
 * Tout ce qui n'est pas attendu est ignoré ; un texte fait au plus 128 caractères.
 * @param {*} docs
 * @returns {Array<Object<string, string|number>>}
 */
export function depuisServeur(docs) {
  const out = [];
  for (const d of Array.isArray(docs) ? docs : []) {
    if (!d || typeof d.id !== 'string' || !d.data || typeof d.data !== 'object') continue;
    const o = {id: d.id};
    for (const k of CHAMPS) {
      const v = d.data[k];
      if (typeof v === 'string') o[k] = v.slice(0, 128);
      else if (typeof v === 'number' && Number.isFinite(v)) o[k] = v;
    }
    out.push(o);
  }
  return out;
}

const texte = (v, n) => (typeof v === 'string' ? v.replace(/\s+/g, ' ').trim().slice(0, n) : '');
/** Un club : {id, n: nom, e: enseigne, v: ville} ou null s'il est invalide. */
export function nettoyerClub(c) {
  if (!c || typeof c !== 'object' || typeof c.id !== 'string' || !/^[A-Za-z0-9_-]{1,40}$/.test(c.id)) return null;
  const n = texte(c.n, 60);
  if (!n) return null;
  const e = CHAINS.some(x => x.id === c.e) ? c.e : 'autre';
  return {id: c.id, n, e, v: texte(c.v, 40)};
}
/** Un avis : {m, k, u, t, g?, b?} ou null s'il est invalide. */
export function nettoyerAvis(a) {
  if (!a || typeof a !== 'object' || !GENRES.includes(a.k)) return null;
  const m = texte(a.m, 60),
    u = texte(a.u, 128);
  if (!m || !u) return null;
  const o = {m, k: a.k, u, t: +a.t || 0};
  if (M.includes(a.g)) o.g = a.g;
  const b = texte(a.b, 30);
  if (b) o.b = b;
  return o;
}
/** Identifiant d'un avis : le même pour une machine et un compte (un nouvel avis remplace l'ancien). */
export function idAvis(machine, uid) {
  let h = 5381;
  for (const c of norm(machine)) h = ((h * 33) ^ c.codePointAt(0)) >>> 0;
  return h.toString(36) + '_' + uid;
}

/* ===== Chercher son club (v3.8.1) : sans accents ni majuscules, tous les mots doivent correspondre ===== */
const plier = t =>
  String(t || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
const mots = q => plier(q).split(/\s+/).filter(Boolean);
/**
 * Les clubs dont le nom, la ville ou le code postal contient tous les mots cherchés (dans l'ordre de la liste).
 * @param {Array<{n: string, v?: string, cp?: string}>} liste
 * @param {string} q
 */
export function chercherClubs(liste, q) {
  const m = mots(q);
  return (Array.isArray(liste) ? liste : []).filter(c => {
    const t = plier(c.n + ' ' + (c.v || '') + ' ' + (c.cp || ''));
    return m.every(x => t.includes(x));
  });
}
/**
 * Le texte, protégé par esc(), avec les mots cherchés entourés de <mark>.
 * @param {string} texte
 * @param {string} q
 * @returns {string} du HTML sûr
 */
export function surligner(texte, q) {
  const t = String(texte || ''),
    lettres = [...t],
    plie = lettres.map(plier);
  /* on surligne seulement si chaque lettre pliée reste une seule lettre (cas normal en français) */
  if (plie.some(x => x.length !== 1)) return esc(t);
  const p = plie.join(''),
    on = new Array(lettres.length).fill(false);
  for (const x of mots(q)) for (let i = p.indexOf(x); i >= 0; i = p.indexOf(x, i + 1)) on.fill(true, i, i + x.length);
  let out = '';
  lettres.forEach((c, i) => {
    if (on[i] && !on[i - 1]) out += '<mark>';
    out += esc(c);
    if (on[i] && !on[i + 1]) out += '</mark>';
  });
  return out;
}
