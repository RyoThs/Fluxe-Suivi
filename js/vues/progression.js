/* Fluxe Suivi — Carte « Ma progression » (écran Stats, v3.4.0) : le mannequin de face et de dos.
   Chaque muscle prend la couleur de son niveau (voir progression.js), avec un relief façon 3D :
   lumière en haut à gauche, sillons sombres entre les muscles, fibres dans le sens du muscle.
   Toucher un muscle l'entoure et affiche son niveau, sa régularité et sa force. */
import {S, done} from '../etat.js';
import {esc, fmtN} from '../outils.js';
import {MUSCLES} from '../muscles.js';
import {MUSCLES_GLOBAL, couleur, progression} from '../progression.js';
import {BASE, CONTOUR, TRACES} from '../mannequin.js';

let sel = null; /* muscle touché (code de muscles.js) */
export function setSel(m) {
  sel = MUSCLES[m] ? (sel === m ? null : m) : null;
}
const CODE = Object.fromEntries(Object.entries(MUSCLES).map(([c, m]) => [m.dessin, c]));
/* sens des fibres, côté gauche de l'écran (le côté droit est en miroir) */
const ANGLE = {
  chest: 22,
  lats: 58,
  traps: -32,
  glutes: -42,
  obliques: 50,
  frontDelts: 80,
  sideDelts: 86,
  rearDelts: 96,
  rotatorCuffs: 14,
  adductors: -68,
  abductors: 78,
  neck: 72,
  forearms: 82,
  quads: 86,
};
const x0 = d => parseFloat(d.slice(1));
const pct = n => Math.round(n * 100) + ' %';

function corps(cote, P) {
  const c = cote,
    centre = c === 'face' ? 262 : 763,
    angles = new Set();
  const muscles = Object.entries(TRACES[c])
    .map(([dessin, l]) => {
      const code = CODE[dessin],
        f = couleur(P.muscles[code].niveau);
      const parts = l
        .map(d => {
          let a = ANGLE[dessin] ?? 90;
          if (x0(d) >= centre) a = 180 - a;
          angles.add(a);
          return `<path d="${d}" fill="${f}" class="m"/><path d="${d}" fill="url(#f${c}${a})" class="fx"/><path d="${d}" fill="url(#v${c})" class="fx"/>`;
        })
        .join('');
      return `<g data-act="mus" data-m="${code}"${sel === code ? ' class="sel"' : ''} role="button" aria-label="${esc(MUSCLES[code].nom)} : ${pct(P.muscles[code].niveau)}">${parts}</g>`;
    })
    .join('');
  const motifs = [...angles]
    .map(
      a =>
        `<pattern id="f${c}${a}" width="3.4" height="3.4" patternUnits="userSpaceOnUse" patternTransform="rotate(${a})"><path d="M0 1.7h3.4" stroke="#0b1022" stroke-opacity=".16" stroke-width=".9"/></pattern>`
    )
    .join('');
  const contour =
    c === 'face' ? `<path d="${CONTOUR.face}"/>` : `<path d="${CONTOUR.dos}" transform="translate(501 1)"/>`;
  return `<svg class="corps" viewBox="${c === 'face' ? '0 0 512 1024' : '512 0 512 1024'}" role="img" aria-label="Mannequin, ${c === 'face' ? 'de face' : 'de dos'}">
<defs>${motifs}<radialGradient id="v${c}" cx="38%" cy="30%" r="80%"><stop offset="0" stop-color="#fff" stop-opacity=".55"/><stop offset=".45" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#0b1022" stop-opacity=".38"/></radialGradient>
<filter id="r${c}" x="-5%" y="-5%" width="110%" height="110%"><feGaussianBlur in="SourceAlpha" stdDeviation="2.6" result="b"/><feSpecularLighting in="b" surfaceScale="4.5" specularConstant=".7" specularExponent="22" lighting-color="#fff" result="sp"><feDistantLight azimuth="235" elevation="45"/></feSpecularLighting><feComposite in="sp" in2="SourceAlpha" operator="in" result="s"/><feMerge><feMergeNode in="SourceGraphic"/><feMergeNode in="s"/></feMerge></filter>
<filter id="o${c}"><feDropShadow dx="2" dy="8" stdDeviation="7" flood-color="#0b1022" flood-opacity=".18"/></filter>
<linearGradient id="p${c}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#eef0f5"/><stop offset="1" stop-color="#d3d8e3"/></linearGradient></defs>
<g filter="url(#o${c})" fill="url(#p${c})">${contour}</g><g fill="#5d6580" fill-opacity=".55">${BASE[c].map(d => `<path d="${d}"/>`).join('')}</g>
<g filter="url(#r${c})">${muscles}</g></svg>`;
}

function detail(P) {
  if (!sel) {
    const faible = MUSCLES_GLOBAL.filter(m => P.muscles[m].series > 0).sort(
      (a, b) => P.muscles[a].niveau - P.muscles[b].niveau
    )[0];
    return `<div class="mpd vide">Touche un muscle pour voir sa régularité et sa force.${faible && P.global > 0.02 ? `<div class="mpf">Point faible : <b>${esc(MUSCLES[faible].nom)}</b> (${pct(P.muscles[faible].niveau)})</div>` : ''}</div>`;
  }
  const m = P.muscles[sel],
    barre = (t, v, txt) =>
      `<div class="mpl"><span>${t}</span><span class="mpj"><i style="width:${Math.round(v * 100)}%"></i></span><b>${pct(v)}</b></div><div class="mps">${txt}</div>`;
  const reg = m.series
    ? `${fmtN(Math.round(m.series * 10) / 10)} séries au total · environ ${fmtN(Math.round(m.parSemaine * 10) / 10)} par semaine (3 derniers mois)`
    : 'Aucune série pour ce muscle pour l’instant.';
  const frc = m.exo
    ? `${esc(m.exo.nom)} : ${fmtN(Math.round(m.exo.debut * 10) / 10)} → ${fmtN(Math.round(m.exo.actuel * 10) / 10)} kg (1RM estimé), +${Math.round(m.exo.gain * 100)} %`
    : 'Pas encore mesurée : il faut au moins 2 séances avec des charges sur un exercice de ce muscle.';
  return `<div class="mpd"><div class="mph"><b>${esc(MUSCLES[sel].nom)}</b><span>${pct(m.niveau)}</span></div>${barre('Régularité', m.regularite, reg)}${barre('Force', m.force, frc)}<p class="mpn">Le niveau = moitié régularité, moitié force.</p></div>`;
}

export function carteProgression() {
  const l = done(),
    P = progression(l, S.mu);
  const debut = l.length ? Math.min(...l.map(s => s.date)) : 0;
  return `<div class="card" id="mp"><div class="mpt"><span class="hist-date">Ma progression</span>${debut ? `<span class="mu">depuis le ${new Date(debut).toLocaleDateString('fr-FR', {day: 'numeric', month: 'long', year: 'numeric'})}</span>` : ''}</div>
<div class="mpg"><b class="gt">${pct(P.global)}</b><span>niveau global · ${P.palier}</span></div>
<div class="mpc">${corps('face', P)}${corps('dos', P)}</div>
<div class="mpb"></div><div class="mpe"><span>Débutant</span><span>Intermédiaire</span><span>Avancé</span><span>Élite</span></div>
${detail(P)}</div>`;
}
