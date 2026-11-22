/* Fluxe Suivi — Mon corps (v3.6.0) : poids, courbe et mensurations, dans les Stats sous le mannequin.
   « + Pesée » : poids et masse grasse (facultative). « + Mensurations » : tours de taille, poitrine, bras, cuisse, hanches. */
import {S} from '../etat.js';
import {esc, fmtN} from '../outils.js';
import {ico} from '../pictos.js';

export const MESURES_CORPS = {
  taille: 'Tour de taille',
  poitrine: 'Poitrine',
  bras: 'Bras',
  cuisse: 'Cuisse',
  hanches: 'Hanches',
  mg: 'Masse grasse',
};
const unite = k => (k === 'mg' ? ' %' : ' cm');
const signe = v => (v > 0 ? '+' : '−') + fmtN(Math.abs(Math.round(v * 10) / 10));
const jourC = t => new Date(t).toLocaleDateString('fr-FR', {day: 'numeric', month: 'short'}).replace('.', '');

function courbe(l) {
  if (l.length < 2) return '';
  const W = 320,
    H = 90,
    vs = l.map(x => x.kg),
    mn = Math.min(...vs) - 0.3,
    mx = Math.max(...vs) + 0.3;
  const xy = l.map((x, i) => [10 + (i * (W - 20)) / (l.length - 1), 8 + (1 - (x.kg - mn) / (mx - mn)) * (H - 20)]);
  const d = 'M' + xy.map(([a, b]) => a.toFixed(1) + ' ' + b.toFixed(1)).join(' L');
  const [lx, ly] = xy[xy.length - 1];
  return `<svg class="mini" viewBox="0 0 ${W} ${H}" role="img" aria-label="Courbe du poids"><defs><linearGradient id="cpg" x1="0" x2="1"><stop offset="0" stop-color="#0d9488"/><stop offset=".55" stop-color="#4f46e5"/><stop offset="1" stop-color="#9333ea"/></linearGradient></defs><path d="${d} L${lx.toFixed(1)} ${H} L10 ${H} Z" fill="#818cf8" fill-opacity=".14"/><path d="${d}" fill="none" stroke="url(#cpg)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/><circle cx="${lx.toFixed(1)}" cy="${ly.toFixed(1)}" r="5" fill="#4f46e5"/></svg>`;
}

/* une mesure : « 78,6 kg » ou « Taille 82 cm · Bras 37 cm » */
const COURT = {taille: 'Taille', poitrine: 'Poitrine', bras: 'Bras', cuisse: 'Cuisse', hanches: 'Hanches'};
function resumeMesure(x) {
  const l = [];
  if (x.kg) l.push(fmtN(x.kg) + ' kg');
  if (x.mg) l.push('MG ' + fmtN(x.mg) + ' %');
  for (const [k, n] of Object.entries(COURT)) if (x[k]) l.push(n + ' ' + fmtN(x[k]) + ' cm');
  return l.join(' · ');
}
/* ligne glissable : glisser vers la gauche montre « Modifier » et « Supprimer » */
const ligne = (x, k) =>
  `<div class="gl" data-k="${k}"><div class="gl-act"><button class="glm" data-act="cmod" data-k="${k}" aria-label="Modifier">${ico('crayon')}</button><button class="gls" data-act="csup" data-k="${k}" aria-label="Supprimer">${ico('corbeille')}</button></div><div class="gl-c lrow"><span>${jourC(x.t)}</span><b>${esc(resumeMesure(x))}</b></div></div>`;
const lignes = (l, n) =>
  l
    .map((x, k) => [x, k])
    .reverse()
    .slice(0, n)
    .map(([x, k]) => ligne(x, k))
    .join('');
export function toutesMesures() {
  const l = S.corps || [];
  return l.length
    ? `<p class="mu" style="margin-left:4px">Glisse une ligne vers la gauche pour la modifier ou la supprimer.</p><div class="card"><div class="lm">${lignes(l, l.length)}</div></div>`
    : '<p class="empty">Aucune mesure pour l’instant.</p>';
}
export function carteCorps() {
  const l = S.corps || [],
    p = l.filter(x => x.kg > 0);
  let haut =
    '<p class="mu" style="margin:8px 0">Note ton poids et tes mensurations pour suivre l’évolution de ton corps.</p>';
  if (p.length) {
    const der = p[p.length - 1],
      ref = p.find(x => x.t >= der.t - 90 * 864e5 && x !== der) || (p.length > 1 ? p[0] : null);
    const evo = ref
      ? `<span class="evo ${der.kg <= ref.kg ? 'bas' : 'haut'}">${signe(der.kg - ref.kg)} kg depuis le ${jourC(ref.t)}</span>`
      : '';
    haut = `<div class="top"><b>${fmtN(der.kg)} <small>kg</small></b>${evo}</div>${courbe(p.slice(-30))}`;
  }
  const mes = Object.entries(MESURES_CORPS)
    .map(([k, nom]) => {
      const v = l.filter(x => x[k] > 0);
      if (!v.length) return '';
      const a = v[v.length - 1][k],
        b = v.length > 1 ? v[v.length - 2][k] : null;
      return `<div>${esc(nom)}<b>${fmtN(a)}${unite(k)}${b !== null && a !== b ? `<em>${signe(a - b)}</em>` : ''}</b></div>`;
    })
    .join('');
  const der = l.length
    ? `<div class="mu" style="margin:6px 0 6px">Dernières mesures · glisse vers la gauche pour modifier ou supprimer</div><div class="lm">${lignes(l, 3)}</div>${l.length > 3 ? `<button class="tout" data-act="ctout">Tout voir (${l.length})</button>` : ''}`
    : '';
  return `<div class="card corpsC" id="corps"><div class="hist-date">Mon corps</div><div class="mu">poids et mensurations</div>${haut}${mes ? `<div class="mes">${mes}</div>` : ''}${der}<div class="btn2"><button class="btn" data-act="cpes">+ Pesée</button><button class="sec" data-act="cmes">+ Mensurations</button></div></div>`;
}

export function formulaireCorps(type, x) {
  const champ = (k, nom, aide) =>
    `<label class="cf"><span>${esc(nom)}${aide ? ` <small>${esc(aide)}</small>` : ''}</span><input id="cf-${k}" type="text" inputmode="decimal" autocomplete="off" maxlength="6" value="${x && x[k] ? fmtN(x[k]) : ''}"></label>`;
  const champs =
    type === 'pesee'
      ? champ('kg', 'Poids (kg)') + champ('mg', 'Masse grasse (%)', 'facultatif')
      : ['taille', 'poitrine', 'bras', 'cuisse', 'hanches'].map(k => champ(k, MESURES_CORPS[k] + ' (cm)')).join('');
  return `<div class="card">${type === 'pesee' ? '<p class="mu" style="margin-top:0">Le matin à jeun, c’est plus fiable.</p>' : '<p class="mu" style="margin-top:0">Remplis seulement ce que tu as mesuré, au mètre ruban.</p>'}${champs}
<button class="btn" data-act="csave" style="margin-top:14px">Enregistrer</button></div>`;
}
