# Fluxe Suivi — ressources de marque

Ce dossier contient les ressources graphiques de Fluxe Suivi et une configuration Expo de référence.

## Contenu
- `assets/icons/icon.png` : icône principale pour un projet Expo.
- `assets/icons/icon-1024.png` : master PNG 1024 × 1024.
- `assets/icons/favicon.png` : favicon web 64 × 64.
- `assets/android/adaptive-icon.png` : image de premier plan Android 432 × 432.
- `assets/splash/splash.png` : visuel de démarrage 1242 × 2688.
- `assets/logo/fluxe-suivi-logo-*.png` : déclinaisons PNG.
- `assets/logo/fluxe-suivi-logo.svg` : conteneur SVG avec PNG intégré.

## Installation dans un projet Expo existant
1. Copier le dossier `assets/` à la racine du projet.
2. Fusionner les réglages utiles de `app.json` dans le `app.json` existant (ne pas écraser les autres paramètres du projet).
3. Vérifier les chemins des fichiers.
4. Reconstruire l'application pour appliquer les icônes natives.

## Important — format vectoriel
Le fichier SVG inclus encapsule l'image PNG. Il est compatible avec les outils qui acceptent un SVG, mais **ce n'est pas un tracé vectoriel éditable** : le symbole multicolore est toujours une image raster. Pour un véritable SVG vectoriel, il faut redessiner/tracer les rubans du logo en chemins SVG ou les reprendre depuis le fichier source vectoriel original, s'il existe.

## À vérifier avant publication
- Tester l'icône à petite taille sur un appareil réel.
- Vérifier les marges de sécurité et le rendu iOS/Android.
- Pour une publication App Store, contrôler les exigences actuelles d'Apple et générer une build native de test.
