/* Fluxe Suivi — Icônes de l'interface, au trait fin (dessinées pour l'app, aucune dépendance extérieure).
   Utilisation : pic('corbeille') ou pic('chrono', 18). La couleur suit le texte (currentColor). */
const D = {
  corbeille: '<path d="M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V4h6v3"/>',
  valide: '<circle cx="12" cy="12" r="9"/><path d="M8 12.5l2.5 2.5L16 9.5"/>',
  alerte: '<path d="M12 4 2.5 20h19L12 4z"/><path d="M12 10v4M12 17.5v.01"/>',
  signet: '<path d="M6 4h12v17l-6-4-6 4z"/><path d="M12 8v6M9 11h6"/>',
  bouclier: '<path d="M12 3l8 3v6c0 4.5-3.4 8.3-8 9-4.6-.7-8-4.5-8-9V6z"/><path d="M8.5 12l2.5 2.5 4.5-5"/>',
  chrono: '<circle cx="12" cy="13" r="8"/><path d="M12 9v4l2.5 2M9 2h6"/>',
  progres: '<path d="M3 17l6-6 4 4 8-8"/><path d="M15 7h6v6"/>',
  etoile: '<path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9 6.8 19.6l1-5.8L3.5 9.7l5.9-.9z"/>',
  salle: '<path d="M6.5 6.5v11M17.5 6.5v11M3.5 9v6M20.5 9v6M6.5 12h11"/>',
  crayon: '<path d="M4 20h4L19 9l-4-4L4 16v4z"/><path d="M13.5 6.5l4 4"/>',
  retour: '<path d="M4 4v5h5"/><path d="M4.5 9A8 8 0 1 1 6 17.5"/>',
  fichier: '<path d="M14 3H6v18h12V7z"/><path d="M14 3v4h4M9 13h6M9 17h6"/>',
  nuage: '<path d="M17.5 19a4.5 4.5 0 1 0-1.4-8.8A6 6 0 0 0 4.5 12.5 3.5 3.5 0 0 0 6.5 19z"/><path d="m9 14 2 2 4-4"/>',
  attente:
    '<path d="M17.5 19a4.5 4.5 0 1 0-1.4-8.8A6 6 0 0 0 4.5 12.5 3.5 3.5 0 0 0 6.5 19z"/><path d="M12 11v5M9.5 13.5 12 16l2.5-2.5"/>',
  coche: '<path d="M20 6 9 17l-5-5"/>',
  bas: '<path d="m6 9 6 6 6-6"/>',
  croix: '<path d="M6 6l12 12M18 6 6 18"/>',
  points: '<circle cx="5" cy="12" r="1.4"/><circle cx="12" cy="12" r="1.4"/><circle cx="19" cy="12" r="1.4"/>',
  partage: '<path d="M12 15V3M7.5 7.5 12 3l4.5 4.5"/><path d="M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 7.5v.01"/>',
  flamme: '<path d="M12 3c1 3.5 5 5.5 5 10a5 5 0 0 1-10 0c0-2 .8-3.3 2-4.3.2 1.6 1 2.6 2 3 0-3.5-.6-5.6 1-8.7z"/>',
  trophee: '<path d="M8 4h8v5a4 4 0 0 1-8 0zM12 13v4M8 20h8M8 6H5a3 3 0 0 0 3 4M16 6h3a3 3 0 0 1-3 4"/>',
  volume: '<path d="M4 20V11M10 20V6M16 20v-6M22 20H2"/>',
  poids: '<path d="M5 8h14l-2 12H7z"/><path d="M9 8a3 3 0 0 1 6 0"/>',
  regle: '<path d="M3 17 17 3l4 4L7 21z"/><path d="M7 13l2 2M10 10l2 2M13 7l2 2"/>',
  corps: '<circle cx="12" cy="5" r="2"/><path d="M12 7v7M8 10h8M9 21l3-7 3 7"/>',
};
export const pic = (k, t = 24) =>
  `<svg viewBox="0 0 24 24" width="${t}" height="${t}" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${D[k] || D.info}</svg>`;
/* petite icône placée devant un texte (boutons, titres de carte) */
export const ico = k => `<span class="pic">${pic(k, 18)}</span>`;
