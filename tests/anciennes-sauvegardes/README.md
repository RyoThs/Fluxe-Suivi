# Anciennes sauvegardes (exemples pour les tests)

Fichiers de sauvegarde au format des anciennes versions de Fluxe Suivi.
Les tests vérifient que **chaque nouvelle version sait toujours les lire**.

- `v2.0-texte-brut.json` : format avant la v2.1 (les données directement, sans « emballage »).
- `v2.1-format3.json` : format v2.1 et suivantes (`{app, format: 3, data}`), avec corbeille et salle.

Règle : on **ajoute** un exemple à chaque changement de format, on n'en supprime jamais.
Données inventées, aucune donnée personnelle.
