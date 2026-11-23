# Outils : vérifier les listes de clubs

Ces fichiers ne sont **pas chargés par l'app**. Ils servent à vérifier, tous les 3 mois, que les listes de clubs de l'app (`js/clubs/*.js`) correspondent toujours aux sites officiels des enseignes.

| Fichier | Rôle |
|---|---|
| `sources.mjs` | Où lire la liste de chaque enseigne (pages publiques), et les corrections faites à la main |
| `extraire.mjs` | Calculs sans réseau : lire une page club, nettoyer une liste, comparer deux listes (testé par `tests/28-outils-clubs.test.js`) |
| `verifier.mjs` | Lit les sites (une page à la fois, avec une pause) et écrit un rapport : clubs nouveaux, disparus, codes postaux changés |

## Lancer une vérification

Depuis le dossier du dépôt (les sites doivent être autorisés dans l'environnement cloud « Fluxe ») :

```
node --no-warnings outils/clubs/verifier.mjs --rapport rapport.md          # les 6 enseignes (environ 1 h 30)
node --no-warnings outils/clubs/verifier.mjs neoness on-air                # seulement certaines
```

L'outil **ne modifie jamais** les listes de l'app. Si un site a changé et qu'on relit moins de la moitié des clubs, il le signale au lieu d'annoncer de fausses disparitions.

## Mettre une liste à jour

Seulement avec l'accord de Yoann, dans une nouvelle version de l'app (tests d'abord, comme toujours). Règle d'or : **un identifiant de club ne change jamais**. On ajoute les nouveaux clubs ; un club disparu peut être retiré, car les salles déjà reliées gardent leur club.
