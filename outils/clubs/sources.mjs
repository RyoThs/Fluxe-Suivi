/* Fluxe Suivi — Outils : où lire la liste officielle des clubs de chaque enseigne (pages publiques uniquement).
   - sitemaps : plan du site (robots.txt) dont on garde les adresses qui contiennent « filtre » ;
   - pages : page qui contient des liens vers les clubs ;
   - ajouts : clubs dont la page n'a pas d'adresse lisible (complétés à la main d'après la page) ;
   - corrections : noms ou villes mal écrits sur le site (par identifiant, sans préfixe).
   Les sites doivent être autorisés dans l'environnement cloud « Fluxe ». */
export const SOURCES = {
  'on-air': {
    marque: 'On Air',
    prefixe: 'onair-',
    fichier: 'js/clubs/on-air.js',
    onair: 'https://onair-fitness.fr/club/',
    corrections: {'boulogne-sur-mer': {v: 'Saint-Léonard', cp: '62360'}, ducos: {v: 'Ducos (Martinique)', cp: '97224'}},
  },
  'basic-fit': {
    marque: 'Basic-Fit',
    prefixe: 'bf-',
    fichier: 'js/clubs/basic-fit.js',
    nomDepuisTitre: /^Salle de sport\s+/,
    sitemaps: [{url: 'https://www.basic-fit.com/sitemap-store-fr-fr-custom-sitemap.xml', filtre: '/fr-fr/clubs/'}],
  },
  'fitness-park': {
    marque: 'Fitness Park',
    prefixe: 'fp-',
    fichier: 'js/clubs/fitness-park.js',
    sitemaps: [{url: 'https://www.fitnesspark.fr/sitemaps/club-sitemap/sitemap.xml', filtre: '/club/'}],
    ajouts: [
      {
        url: 'https://www.fitnesspark.fr/club/nice-pasteur/',
        nom: 'Fitness Park Nice Pasteur',
        cp: '06200',
        ville: 'Nice',
        pays: 'FR',
        rue: '',
      },
      {
        url: 'https://www.fitnesspark.fr/club/nancy/',
        nom: 'Fitness Park Nancy',
        cp: '54000',
        ville: 'Nancy',
        pays: 'FR',
        rue: '',
      },
    ],
  },
  'orange-bleue': {
    marque: 'L’Orange Bleue',
    prefixe: 'ob-',
    fichier: 'js/clubs/orange-bleue.js',
    sitemaps: [{url: 'https://www.lorangebleue.fr/clubs-list-sitemap1.xml', filtre: '/clubs/'}],
  },
  neoness: {
    marque: 'Neoness',
    prefixe: 'neo-',
    fichier: 'js/clubs/neoness.js',
    pages: [
      {
        url: 'https://www.neoness.fr/nos-salles-de-sport',
        liens: /\/clubs\/[a-z0-9-]+/g,
        base: 'https://www.neoness.fr',
      },
    ],
    sitemaps: [{url: 'https://www.neoness.fr/sitemap.xml', filtre: '/clubs/'}],
    corrections: {
      'lyon-mairie-du-8eme': {n: 'Lyon Mairie du 8e'},
      'kremlin-villejuif': {v: 'Le Kremlin-Bicêtre'},
      'fontenay-sous-bois': {v: 'Fontenay-sous-Bois'},
    },
  },
  keepcool: {
    marque: 'Keepcool',
    prefixe: 'kc-',
    fichier: 'js/clubs/keepcool.js',
    sitemaps: [{url: 'https://www.keepcool.fr/sitemap.xml', filtre: '/clubs/'}],
    exclure: /^Neoness /,
    corrections: {
      'grenoble-saint-martin-d-heres': {n: "Grenoble Saint-Martin-d'Hères"},
      cournon: {v: "Cournon-d'Auvergne"},
      'villeneuve-d-ascq': {n: "Villeneuve-d'Ascq"},
    },
  },
};

/** Applique les corrections à la main d'une source à des lignes. */
export function corriger(lignes, s) {
  const c = s.corrections || {};
  return lignes.map(l =>
    c[l[0]] ? [l[0], c[l[0]].n ?? l[1], c[l[0]].v ?? l[2], c[l[0]].cp ?? l[3], ...l.slice(4)] : l
  );
}
