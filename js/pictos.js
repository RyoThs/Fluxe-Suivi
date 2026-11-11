/* Fluxe Suivi — Icônes de l'interface, au trait fin (dessinées pour l'app, aucune dépendance extérieure).
   Utilisation : pic('corbeille') ou pic('chrono', 18). La couleur suit le texte (currentColor). */
const D={
  corbeille:'<path d="M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V4h6v3"/>',
  valide:'<circle cx="12" cy="12" r="9"/><path d="M8 12.5l2.5 2.5L16 9.5"/>',
  alerte:'<path d="M12 4 2.5 20h19L12 4z"/><path d="M12 10v4M12 17.5v.01"/>',
  signet:'<path d="M6 4h12v17l-6-4-6 4z"/><path d="M12 8v6M9 11h6"/>',
  bouclier:'<path d="M12 3l8 3v6c0 4.5-3.4 8.3-8 9-4.6-.7-8-4.5-8-9V6z"/><path d="M8.5 12l2.5 2.5 4.5-5"/>',
  chrono:'<circle cx="12" cy="13" r="8"/><path d="M12 9v4l2.5 2M9 2h6"/>',
  progres:'<path d="M3 17l6-6 4 4 8-8"/><path d="M15 7h6v6"/>',
  etoile:'<path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9 6.8 19.6l1-5.8L3.5 9.7l5.9-.9z"/>',
  salle:'<path d="M6.5 6.5v11M17.5 6.5v11M3.5 9v6M20.5 9v6M6.5 12h11"/>',
  crayon:'<path d="M4 20h4L19 9l-4-4L4 16v4z"/><path d="M13.5 6.5l4 4"/>',
  retour:'<path d="M4 4v5h5"/><path d="M4.5 9A8 8 0 1 1 6 17.5"/>',
  fichier:'<path d="M14 3H6v18h12V7z"/><path d="M14 3v4h4M9 13h6M9 17h6"/>',
  info:'<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 7.5v.01"/>',
};
export const pic=(k,t=24)=>`<svg viewBox="0 0 24 24" width="${t}" height="${t}" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${D[k]||D.info}</svg>`;
/* petite icône placée devant un texte (boutons, titres de carte) */
export const ico=k=>`<span class="pic">${pic(k,18)}</span>`;
