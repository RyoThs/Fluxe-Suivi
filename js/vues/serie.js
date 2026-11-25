/* Fluxe Suivi — Semaines d'affilée et récompenses (v3.6.0).
   - L'indicateur : le nombre de séances de la semaine (0, 1, 2… retour à 0 chaque lundi, v3.14.1) et le mini-graphe des 5 dernières semaines, à droite du titre (accueil et Stats).
   - En le touchant, et seulement là : un panneau qui explique tout et montre les 24 récompenses.
   - Aucune fenêtre automatique : les nouvelles récompenses sont notées en silence (la dernière brille en or). */
import {S, done, save} from '../etat.js';
import {esc} from '../outils.js';
import {pic} from '../pictos.js';
import {FAMILLES, nouvelles, semaines, tableau} from '../recompenses.js';

const etat = () => ({sessions: done(), corps: S.corps, mu: S.mu});

export function carteSerie() {
  const w = semaines(done()),
    mx = Math.max(1, ...w.barres);
  const barres = w.barres
    .map(
      (v, i) =>
        `<i class="${v ? '' : 'v'}" style="height:${v ? 8 + Math.round((v / mx) * 18) : 6}px"${i === 4 ? ' data-now="1"' : ''}></i>`
    )
    .join('');
  /* le chiffre = séances de la semaine en cours (0, 1, 2… et retour à 0 chaque lundi), demande de Yoann (v3.14.1) */
  const n = w.cetteSemaine;
  return `<button class="serie-t" id="serie" data-act="serie" aria-label="${n} séance${n > 1 ? 's' : ''} cette semaine : voir la série et les récompenses"><span class="big">${n}</span><span class="sem" aria-hidden="true">${barres}</span></button>`;
}
/* titre de page avec l'indicateur à droite */
export function titreSerie(titre) {
  return `<div class="titre-l"><h1>${titre}</h1>${done().length ? carteSerie() : ''}</div>`;
}

const medaille = (r, or) =>
  `<div class="${r.ok ? '' : 'l'}"><span class="med ${r.ok ? (or ? 'or' : 'on') : 'off'}">${pic(r.icone, 22)}</span>${esc(r.titre)}<small>${r.ok ? 'obtenue' : Math.floor(r.valeur) + '/' + r.cible + (r.mesure === 'niveau' ? ' %' : '')}</small></div>`;

export function panneauSerie() {
  const w = semaines(done()),
    t = tableau(etat()),
    nb = t.filter(r => r.ok).length,
    derniere = [...(S.rv || [])].reverse().find(id => t.some(r => r.id === id && r.ok));
  const fam = FAMILLES.map(
    f =>
      `<div class="fam">${f}</div><div class="rgrid">${t
        .filter(r => r.famille === f)
        .map(r => medaille(r, r.id === derniere))
        .join('')}</div>`
  ).join('');
  const s = n => n + ' semaine' + (n > 1 ? 's' : '');
  /* pas encore de séance cette semaine : 0 affiché, et la série qui attend est rappelée (v3.14.1) */
  const phrase =
    !w.affiche && w.n
      ? `Ta série de ${s(w.n)} t’attend : fais une séance avant dimanche soir pour la continuer.`
      : `Tu as fait au moins une séance chaque semaine depuis ${s(w.affiche)}.`;
  const c = w.cetteSemaine;
  return `<div class="card"><div class="ser2 seul"><span class="big">${c}</span> <div class="t">séance${c > 1 ? 's' : ''} cette semaine</div></div>
<p class="mu" style="margin:10px 0 0">${phrase} Une semaine va du lundi au dimanche. Ta série continue tant que tu fais au moins 1 séance par semaine ; la semaine en cours ne la casse pas tant qu’elle n’est pas finie.</p>
<div class="recap" style="justify-content:flex-start"><span>${s(w.affiche)} d’affilée</span><span>Record : ${s(w.record)}</span></div>
<p class="mu" style="margin:8px 0 0">Les barres montrent tes séances des 5 dernières semaines (plus la barre est haute, plus tu as fait de séances) ; la dernière est la semaine en cours.</p></div>
<div class="card"><div class="rtop"><span class="hist-date">Récompenses</span><b class="gt">${nb} / ${t.length}</b></div><p class="mu" style="margin:4px 0 0">En couleur : obtenues (la dernière brille en or). En gris : ta progression.</p>${fam}</div>`;
}

/* au démarrage : la 1re fois (mise à jour ou nouvel utilisateur), on note ce qui est déjà gagné, sans fenêtre */
export function initRecompenses() {
  if (S.rvInit) return;
  S.rv = [...new Set([...(S.rv || []), ...nouvelles(tableau(etat()), []).map(r => r.id)])];
  S.rvInit = true;
  save();
}
/* note en silence les récompenses nouvellement gagnées (après une séance ou une pesée) */
export function noterRecompenses() {
  const n = nouvelles(tableau(etat()), S.rv);
  if (!n.length) return;
  S.rv = [...(S.rv || []), ...n.map(r => r.id)];
  save();
}
