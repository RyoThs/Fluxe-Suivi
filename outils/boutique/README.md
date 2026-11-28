# Visuels des boutiques (App Store et Google Play)

Fabrique les images des fiches de l'appli à partir de la **vraie appli** et de données de démo **fictives**.

```
node outils/boutique/visuels.mjs
```

Résultat dans `docs/PUBLICATION/03-IMAGES/` :
- `app-store/` : 6 images 1320 × 2868 (iPhone 6,9 pouces) ;
- `google-play/` : 6 images 1080 × 1920 et la bannière 1024 × 500 ;
- `captures/` : les captures brutes de l'appli (390 × 844, net ×3).

Fichiers :
- `demo.mjs` : les séances de démo (8 semaines, 3 routines, 5 pesées) ;
- `textes.mjs` : titres et textes des 6 visuels et de la bannière ;
- `visuels.mjs` : prend les captures puis fabrique les images.

Règles (vérifiées par `tests/38-visuels-boutique.test.js`) : aucun nom ni logo d'enseigne de salle, aucune mention « meilleure appli ».
Relancer le programme à chaque nouvelle version, avant d'envoyer l'appli aux boutiques.
