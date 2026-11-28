# Vidéo de présentation de Fluxe Suivi

32 secondes, verticale 1080 × 1920 (TikTok, Reels, Shorts), faite à partir de la **vraie appli** et de données de démo **fictives**.

```
node outils/video/fabriquer.mjs
```

Il faut `ffmpeg` et `python3` avec `numpy`. Résultat : `docs/PUBLICATION/04-VIDEO/fluxe-suivi-presentation.mp4` (environ 4 minutes de fabrication).

| Temps | Scène |
|---|---|
| 0–3 s | accroche « Tu notes encore ta muscu sur un carnet ? » (le mot barré) |
| 3–5 s | flash et logo |
| 5–13 s | séance : un doigt coche 2 séries, le chrono démarre, la caméra s'approche |
| 13–18 s | Stats : mannequin des muscles, Mon corps |
| 18–22 s | historique et pastille « 3 records » |
| 22–27 s | Ma salle et compteur jusqu'à 2 084 clubs |
| 27–32 s | « Gratuit. Sans compte. Même hors ligne. » puis logo |

Fichiers :
- `fabriquer.mjs` : filme l'appli, dessine les 960 images, ajoute la musique, assemble avec ffmpeg ;
- `montage.html` : la mise en scène (`window.render(t)` dessine l'image à l'instant `t`) ;
- `musique.py` : musique **originale** synthétisée (aucun morceau d'un autre, pas de droits à payer).

Règles (vérifiées par `tests/39-video.test.js`) : aucune adresse de site dans la vidéo (choix de Yoann : le lien va dans le texte de la publication), aucun nom d'enseigne ni de concurrent.
Les dossiers `cap/` et `images/` sont des fichiers de travail, non enregistrés dans Git.
