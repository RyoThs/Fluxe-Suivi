# Filet de sécurité (tests automatiques)

Ces tests vérifient tout seuls que Fluxe Suivi fonctionne **avant** qu'une mise à jour arrive sur l'iPhone.
GitHub les lance à chaque proposition de modification : ✅ = tout va bien, ❌ = ne pas fusionner.

## Ce qui est vérifié
| Fichier | Ce qu'il protège |
|---|---|
| `01-fichiers.test.js` | Mêmes numéros de version partout, clé `muscu-v1` inchangée, chaque fichier du code existe, est utilisé et disponible hors ligne, vérificateur eslint sans erreur, police locale (aucun appel à Google Fonts) |
| `02-donnees.test.js` | Les séances se chargent, se nettoient et survivent au redémarrage |
| `03-sauvegarde.test.js` | Fichier de sauvegarde, aller-retour, anciens formats, fusion, fichier invalide refusé |
| `04-corbeille-et-rappel.test.js` | Corbeille 30 jours, rappel de sauvegarde |
| `05-mise-a-jour.test.js` | Réparation automatique d'une vieille version (y compris l'ancienne page qui demande `app.js`), sans boucle |
| `07-hors-ligne.test.js` | La police Barlow Condensed se charge depuis `fonts/`, sans site extérieur ; installation hors ligne « tout ou rien » (échoue si un fichier manque) ; mode avion après une 1re visite : écran Séance, bonne police, données intactes, aucune erreur |

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
