# Filet de sécurité (tests automatiques)

Ces tests vérifient tout seuls que Fluxe Suivi fonctionne **avant** qu'une mise à jour arrive sur l'iPhone.
GitHub les lance à chaque proposition de modification : ✅ = tout va bien, ❌ = ne pas fusionner.

## Ce qui est vérifié
| Fichier | Ce qu'il protège |
|---|---|
| `01-fichiers.test.js` | Mêmes numéros de version partout, clé `muscu-v1` inchangée, chaque fichier du code existe, est utilisé et disponible hors ligne, vérificateur eslint sans erreur, police locale (aucun appel à Google Fonts), captures d'écran du manifeste |
| `02-donnees.test.js` | Les séances se chargent, se nettoient et survivent au redémarrage |
| `03-sauvegarde.test.js` | Fichier de sauvegarde, aller-retour, anciens formats, fusion, fichier invalide refusé |
| `04-corbeille-et-rappel.test.js` | Corbeille 30 jours, rappel de sauvegarde |
| `05-mise-a-jour.test.js` | Réparation automatique d'une vieille version (y compris l'ancienne page qui demande `app.js`), sans boucle |
| `06-bibliotheque.test.js` | Bibliothèque des machines (Guide et choix d'exercice) : vue, catalogue et muscle sont des réglages séparés |
| `07-hors-ligne.test.js` | La police Barlow Condensed se charge depuis `fonts/`, sans site extérieur ; installation hors ligne « tout ou rien » (échoue si un fichier manque) ; mode avion après une 1re visite : écran Séance, bonne police, données intactes, aucune erreur |
| `08-records.test.js` | Records : le poids réellement soulevé (pas d'estimation), échauffement exclu, demi-kilos |
| `09-fenetres.test.js` | Fenêtres de l'app (à la place des fenêtres grises du téléphone) : textes, boutons, Échap = Annuler |
| `10-stockage.test.js` | Chaque clé de stockage du code est listée dans `docs/STOCKAGE.md` et commence par `muscu-v1`, `fx-` ou `fluxe-suivi-` |
| `11-dessins.test.js` | Dessins des machines et des mouvements |
| `12-routines-repos-records.test.js` | Routines détaillées (séries, poids, reps, blocs cardio), temps de repos, chrono réglable, vibration sans son, 3 records |
| `13-ecran.test.js` | Pas de zoom, message « Tourne ton téléphone » à l'horizontale |
| `14-gestes.test.js` | Chaque bouton (`data-act`) a son geste dans `js/gestes/`, parcours complet |
| `15-courbes.test.js` | Courbes de progression : charge max, 1RM estimé, volume, vue « Toutes », périodes |
| `16-sauvegarde-en-ligne.test.js` | Sauvegarde en ligne avec un faux serveur (`nuage-faux.js`) : compte, envoi, 2e appareil, hors ligne, suppression, e-mail de vérification, sécurité |
| `17-erreurs.test.js` | Rapport d’erreurs : journal sur le téléphone, envoi automatique avec un compte, e-mail, écran de secours |
| `23-corps-recompenses.test.js` | Semaines d’affilée, 24 récompenses (calcul, panneau, fenêtre, pas de rafale à la mise à jour), Mon corps (pesée, mensurations), données gardées partout |
| `22-ordre-exercices.test.js` | Ordre pendant la séance : en cours en haut, terminés en bas ; boutons qui visent le bon exercice ; Historique dans l’ordre réel |
| `21-seance.test.js` | Écran Séance v3.5 : caractérisation (tous les boutons d’avant restent), bandeau, série en cours, ligne Record, « Par côté », Repos, chrono à anneau et +30 s |
| `20-progression.test.js` | Ma progression : calcul réaliste (régularité, force, plafond, mémoire musculaire), mannequin en haut des Stats, détail d’un muscle, anciennes sauvegardes ; les cartes existantes restent |
| `19-muscles.test.js` | Muscles précis : table des 142 exercices de muscu, choix du groupe d’un exercice perso (données, fichier, fusion, séance, Stats) |
| `18-publication.test.js` | Publication sur GitHub Pages : lien « Ouvrir l’application » en haut du README, `.nojekyll`, l’app marche dans le sous-dossier `/Fluxe-Suivi/` avec le service worker |

`outils.js` : serveur et navigateur partagés par les tests. `nuage-faux.js` : faux serveur Firebase.
`anciennes-sauvegardes/` : exemples de fichiers des anciennes versions (on en ajoute, on n'en supprime jamais).

## Lancer les tests sur un ordinateur
```
npm ci
npx playwright install chromium
npm test
```

## Règles
- Chaque nouvelle fonctionnalité arrive avec au moins un test.
- Chaque bug corrigé arrive avec un test qui l'aurait attrapé.
- On ne supprime jamais un test pour obtenir ✅ : on corrige le code.
- Un test marqué `todo` décrit une faiblesse connue pas encore corrigée (il ne bloque pas).
