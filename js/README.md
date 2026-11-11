# Plan du code de Fluxe Suivi

Depuis la v2.3.0, le code est rangé en petits fichiers (des « modules »).
Chaque fichier dit en haut ce qu'il fait, et la liste de ce qu'il emprunte aux autres (`import`).

## Qui fait quoi
| Fichier | Rôle |
|---|---|
| `main.js` | **Point de départ** : vérifie la version, lance les copies de secours, affiche l'app |
| `config.js` | Réglages fixes : clé de stockage `muscu-v1` (**ne jamais changer**), numéro de version |
| `donnees.js` | Lit et nettoie les données (téléphone et fichiers importés) |
| `etat.js` | Tes données `S`, l'onglet affiché, le panneau ouvert ; `save()`, messages |
| `outils.js` | Petites fonctions de calcul et de mise en forme |
| `calculs.js` | Calculs sur l'historique : séries précédentes, records, suggestion de charge |
| `catalogue.js` | Exercices, machines, enseignes (On Air et autres) |
| `salle.js` | Ma salle : salle active, machines, notes de réglage |
| `routines.js` | Routines : création depuis l’Historique, brouillon de modification (séries, poids, reps, blocs cardio), démarrage |
| `ecran.js` | Écran fixe : pas de zoom, message « Tourne ton téléphone » à l’horizontale |
| `icones.js` | Vignettes des machines : le dessin si il existe, sinon un pictogramme |
| `dessins.js` | Dessins des machines et des mouvements (v2.7) : pièces communes + un dessin par exercice |
| `rappel.js` | Rappel de sauvegarde |
| `sauvegarde.js` | Fichier de sauvegarde, import, fusion, corbeille |
| `versions.js` | Versions de secours (IndexedDB) |
| `minuteur.js`, `veille.js`, `installation.js` | Minuteur de repos, écran allumé, bouton Installer |
| `rendu.js` | Affiche l'onglet actif |
| `actions.js` | Réagit aux boutons et à la saisie |
| `vues/…` | Un fichier par écran : séance, historique, stats, guide, panneaux, écran sauvegarde |

Les styles sont dans `../css/app.css`.

## Règles
1. **Une variable appartient à son fichier.** Un autre fichier peut la lire, mais la modifie seulement par sa fonction dédiée (`setS`, `setTab`, `setPk`, `setGm`…). Le vérificateur l'impose.
2. **Nouveau fichier** : l'importer depuis un autre fichier ET l'ajouter à la liste `FICHIERS` de `sw.js` (sinon pas de hors ligne). Les tests le vérifient.
3. **Nouvelle version** : changer le numéro dans `js/config.js`, dans `index.html` (3 endroits) et dans `sw.js` (`VERSION` + 2 liens). Les tests vérifient que tout correspond.
4. Avant de fusionner : `npm test` doit être ✅ (GitHub le fait tout seul).
