# Fluxe Suivi

Fluxe Suivi est un carnet de musculation qui s'utilise sur le téléphone.
C'est une « application web installable » (PWA) : elle s'ouvre dans Safari, puis
s'ajoute à l'écran d'accueil comme une vraie application, et fonctionne aussi
**sans connexion** une fois installée.

## Ce que fait l'application
- **Séance** : tu choisis tes exercices, tu notes tes séries (charge, répétitions ; durée, distance et calories pour le cardio) et tu coches ce qui est fait. Un minuteur de repos se lance entre les séries.
- **Historique** : toutes tes séances passées.
- **Stats** : tes chiffres et tes records.
- **Guide des machines** (bouton `?`) : ta salle, ses machines et tes notes de réglage.
- **Sauvegarde** : un fichier de sauvegarde à garder en lieu sûr, et une corbeille de 30 jours.

Tes données restent **sur ton téléphone** (stockage du navigateur). Rien n'est envoyé sur Internet.

## Installer sur iPhone
1. Ouvre l'adresse de l'application dans **Safari** (pas dans un autre navigateur).
2. Touche le bouton **Partager** (le carré avec une flèche vers le haut).
3. Choisis **Sur l'écran d'accueil**, puis **Ajouter**.
4. Lance Fluxe Suivi depuis sa nouvelle icône. Ouvre-la une fois avec du réseau : elle se garde alors en mémoire pour marcher hors ligne.

## Lancer les tests
Les tests automatiques vérifient que tout fonctionne avant qu'une mise à jour arrive sur le téléphone.
```
npm ci
npx playwright install chromium
npm test
```
Résultat attendu : tous les tests passent (`fail 0`). GitHub les relance tout seul à chaque proposition de modification.
Le détail est expliqué dans `tests/README.md`.

## Publier une nouvelle version
Le numéro de version doit être changé à **3 endroits** (les tests vérifient qu'ils correspondent) :

1. `js/config.js` : la valeur `VER='…'`.
2. `index.html` : la balise `app-version`, le lien `css/app.css?v=…` et le lien `js/main.js?v=…`.
3. `sw.js` : le nom du cache `VERSION` (par exemple `'v18'` devient `'v19'`) et les deux liens `css/app.css?v=…` et `js/main.js?v=…` de la liste `FICHIERS`.

Ensuite : `npm test` doit être au vert, puis on fusionne dans `main`.

## Où trouver quoi
| Fichier ou dossier | Rôle |
|---|---|
| `index.html` | La page de l'application |
| `css/app.css` | Les styles (thème clair uniquement) |
| `js/` | Le code, découpé en petits fichiers (voir `js/README.md`) |
| `sw.js` | Le « service worker » : garde une copie de l'app pour le hors ligne |
| `manifest.json` | Nom, couleurs et icônes de l'application installée |
| `icons/` | Les icônes et l'image de démarrage |
| `app.js` | Ancien fichier gardé pour réparer les vieilles pages déjà installées |
| `tests/` | Les tests automatiques |
| `screenshots/` | Captures d'écran (données de démonstration) montrées à l'installation |
| `docs/TEST-APPAREILS.md` | Liste à cocher pour tester une version sur le téléphone |
| `docs/STOCKAGE.md` | Tout ce que l'app range dans le téléphone (clés, base de secours, caches) |
