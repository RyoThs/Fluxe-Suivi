/* Fluxe Suivi — Sauvegarde en ligne : réunir ce qui vient du serveur avec les données du téléphone.
   - Séances : la version la plus récente gagne ; une séance supprimée ailleurs va dans la corbeille ;
     la séance ouverte (en cours ou en modification) n'est jamais touchée.
   - Réglages (« meta ») : la version la plus récente gagne, sauf muscles perso, pesées, mensurations
     et récompenses, qui sont réunis (jamais effacés par un appareil resté sur une ancienne version).
   E = ce que l'app retient du compte (géré par nuage.js) : fusionner() y note ce qui a été reçu. */
import {S} from './etat.js';
import {clean, nettoyerCorps} from './donnees.js';
import {toTrash} from './sauvegarde.js';

/** Date de dernière modification d'une séance (sa date de création si elle n'a jamais été modifiée). */
export const modDe = s => s.mod || s.date;
export const META = ['routines', 'notes', 'rests', 'gyms', 'mu', 'corps', 'rv'],
  META_OPT = ['rest', 'gym', 'nv', 'bkEvery'];
export const metaDe = d => {
  const o = {};
  META.forEach(k => (o[k] = d[k]));
  META_OPT.forEach(k => {
    if (d[k] !== undefined) o[k] = d[k];
  });
  return o;
};

/* ===== Recevoir : ajoute ou met à jour ce qui vient des autres appareils ===== */
/**
 * Réunit ce qui vient du serveur avec les données du téléphone.
 * @param {{sessions: Array<{id: string, mod: number, del: boolean, j: string, t: number}>, meta: {mod: number, j: string}|null}} r
 * @param {Object} E état du compte (nuage.js) : ce qui a déjà été envoyé ou reçu
 * @returns {boolean} true si les données du téléphone ont changé
 */
export function fusionner(r, E) {
  let chg = false;
  const sortir = new Set();
  const pos = new Map(S.sessions.map((s, i) => [s.id, i]));
  for (const d of r.sessions) {
    if (d.t > E.dernierT) E.dernierT = d.t;
    const i = pos.get(d.id),
      l = i === undefined ? null : S.sessions[i];
    if (d.del) {
      if (l && l.id !== S.current && !l.edit && modDe(l) <= d.mod) {
        toTrash({s: l});
        sortir.add(l.id);
        chg = true;
      }
      delete E.envoye[d.id];
      continue;
    }
    let s = null;
    try {
      const c = clean({sessions: [JSON.parse(d.j)]});
      s = c && c.sessions[0];
    } catch (e) {}
    if (!s || s.id !== d.id) continue; /* donnée illisible : ignorée, rien n'est cassé ici */
    delete s.edit;
    if (!l) {
      if (E.envoye[d.id] === d.mod) continue; /* supprimée sur ce téléphone, suppression pas encore envoyée */
      S.sessions.push(s);
      pos.set(s.id, S.sessions.length - 1);
      E.envoye[d.id] = d.mod;
      chg = true;
    } else if (l.id === S.current || l.edit) continue; /* jamais toucher à la séance ouverte */
    else if (d.mod > modDe(l)) {
      S.sessions[i] = s;
      E.envoye[d.id] = d.mod;
      chg = true;
    } else if (d.mod === modDe(l)) E.envoye[d.id] = d.mod;
  }
  if (sortir.size) S.sessions = S.sessions.filter(s => !sortir.has(s.id));
  if (r.meta && r.meta.mod > E.metaMod) {
    let m = null;
    try {
      const p = JSON.parse(r.meta.j);
      m = p && typeof p === 'object' ? clean(Object.assign({}, p, {sessions: []})) : null;
    } catch (e) {}
    if (m) {
      META.forEach(k => {
        /* choix de muscles (v3.3) : réunis, pour qu'un appareil resté sur une ancienne version ne les efface pas */
        if (k === 'mu') S.mu = Object.assign({}, S.mu, m.mu);
        else if (k === 'corps') S.corps = nettoyerCorps([...(S.corps || []), ...(m.corps || [])]);
        else if (k === 'rv') S.rv = [...new Set([...(S.rv || []), ...(m.rv || [])])];
        else S[k] = m[k];
      });
      META_OPT.forEach(k => {
        if (m[k] !== undefined) S[k] = m[k];
        else delete S[k];
      });
      E.metaMod = E.metaEnvoye = r.meta.mod;
      E.metaHash = JSON.stringify(metaDe(S));
      chg = true;
    }
  }
  if (chg) S.sessions.sort((a, b) => a.date - b.date);
  return chg;
}
