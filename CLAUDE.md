# Instructions pour Claude (Fluxe Suivi)

Yoann est débutant : réponds en français, simplement, code complet d'abord puis explications.
Mémoire longue et décisions : coffre `RyoThs/MonCerveau` (fiche `02 - Projets/FLUXE/Fluxe Suivi/Fluxe Suivi.md`). Fluxe Suivi et Fluxe App sont deux applis distinctes.

## Méthode TDD : priorité pour tout le code
Toute demande qui touche au code suit le TDD (détails : fiche `14 - TDD (tests d'abord)` du coffre MonCerveau).
1. 🔴 Écrire d'abord UN test pour UN comportement, le lancer, le voir échouer pour la bonne raison.
2. 🟢 Écrire le code le plus simple qui le fait passer, puis lancer TOUTE la suite (`npm test`).
3. 🔧 Ranger le code ; les tests restent verts.
- Un bug = d'abord un test qui le reproduit, puis la correction.
- Code existant sans test : test de caractérisation (ce qu'il fait aujourd'hui) avant de le modifier.
- Ne jamais modifier ni supprimer un test pour obtenir le vert (si un test semble faux : l'expliquer à Yoann et attendre son accord).
- Montrer à Yoann chaque cycle en une ligne et la preuve finale (commande + résultat).
- Exceptions : maquette jetable, pur style CSS (capture avant/après).

## Tests de ce projet
- Installer une fois : `npm ci` puis `npx playwright install chromium`.
- Lancer : `npm test` (tous les fichiers `tests/*.test.js`, numérotés par thème). GitHub les relance à chaque demande de fusion (`.github/workflows/tests.yml`).
- Nouveau thème = nouveau fichier numéroté (`18-….test.js`) ; sinon ajouter le test dans le fichier du thème.
- Changement de format de sauvegarde : ajouter un exemple dans `tests/anciennes-sauvegardes/` et un test qui le relit.
- Avant une fusion : `npm run verifier` (ESLint) et `npm run ranger` (Prettier).

## Règles
- **Jamais de thème sombre** (décision définitive).
- Publier une version : branche `sauvegarde-v…` d'abord, numéro de version aux 3 endroits (les tests le vérifient), ligne dans `docs/VERSIONS.md` (voir README).
- Toujours une demande de fusion ; attendre l'accord de Yoann et les tests verts avant de fusionner.
- Jamais de mot de passe ni de clé secrète dans le dépôt.
