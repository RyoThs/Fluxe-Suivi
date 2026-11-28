/* Textes des visuels des boutiques. Règles : la vraie appli, pas de « meilleure appli »,
   aucun nom ni logo d'enseigne de salle (vérifié par tests/38-visuels-boutique.test.js). */
export const CAPTURES = ['seance', 'stats', 'historique', 'salle', 'accueil', 'corps'];

/* Dans l'ordre des boutiques : les 3 premiers se voient dans les résultats de recherche. */
export const VISUELS = [
  {
    capture: 'seance',
    tag: 'PENDANT LA SÉANCE',
    titre: ['Note tes séries', 'en 1 touche'],
    texte: 'Charge précédente, repos, disques par côté : tout est déjà prêt.',
    fond: '#e9fbf7',
  },
  {
    capture: 'stats',
    tag: 'TA PROGRESSION',
    titre: ['Vois ton corps', 'progresser'],
    texte: 'Chaque muscle s’allume quand tu le travailles. Ton point faible saute aux yeux.',
    fond: '#eef0ff',
  },
  {
    capture: 'historique',
    tag: 'TES RECORDS',
    titre: ['Chaque record', 'est fêté'],
    texte: 'Durée, volume, records : ton historique en un coup d’œil.',
    fond: '#f6efff',
  },
  {
    capture: 'salle',
    tag: 'TA SALLE',
    titre: ['Il connaît', 'ta salle'],
    texte: '2 084 clubs en France, avec leurs machines. Les membres tiennent la liste à jour.',
    fond: '#e9fbf7',
  },
  {
    capture: 'accueil',
    tag: 'CHAQUE JOUR',
    titre: ['Ta séance du jour,', 'déjà prête'],
    texte: 'Fluxe te propose la routine à faire et les charges à viser.',
    fond: '#eef0ff',
  },
  {
    capture: 'corps',
    tag: 'GRATUIT',
    titre: ['Sans compte.', 'Même hors ligne.'],
    texte: 'Tes séances restent sur ton téléphone. Sauvegarde en ligne si tu le veux.',
    fond: '#f6efff',
  },
];

export const BANNIERE = 'Ton carnet de muscu qui connaît ta salle.|Gratuit · sans compte · hors ligne';
