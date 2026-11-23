# Fluxe Suivi — Guide pour un développeur

Ce document résume ce qu'il faut savoir pour reprendre le projet, ou le transformer en application native (App Store / Play Store).

## En bref
- **PWA sans framework ni étape de build** : HTML + CSS + JavaScript en modules ES (`<script type="module">`). Ce qui est dans le dépôt est exactement ce qui est servi (GitHub Pages).
- **Hors ligne d'abord** : toutes les données vivent dans le téléphone (`localStorage`, clé `muscu-v1`). La sauvegarde en ligne (Firebase) est **facultative**.
- **Testée** : plus de 200 tests (`node:test` + Playwright, voir `tests/README.md`), lancés par GitHub à chaque demande de fusion. Méthode de travail : TDD (test d'abord).
- **Code en français** (noms de fonctions et commentaires), comme l'interface.

## Architecture
| Couche | Fichiers | Rôle |
|---|---|---|
| Démarrage | `js/main.js` | Vérifie la version, lance les copies de secours, la sauvegarde en ligne, puis affiche |
| État | `js/etat.js` | Les données `S`, l'onglet, le panneau ouvert ; `save()` ; une variable ne se modifie que par sa fonction `set…` |
| Données | `js/donnees.js` | **Toute donnée entrante passe par `clean()`** (téléphone, fichier importé, serveur) : seul ce qui est valide est gardé |
| Affichage | `js/rendu.js`, `js/vues/*.js` | Chaque écran est une fonction qui renvoie du HTML (chaînes). **Tout texte venant de l'utilisateur passe par `esc()`** |
| Gestes | `js/actions.js` → `js/gestes/*.js` | Un seul écouteur de clic ; chaque bouton a un `data-act` relié à une fonction. Une fonction qui renvoie `true` déclenche `save()` + `render()` |
| Calculs purs | `js/outils.js`, `js/calculs.js`, `js/courbe.js`, `js/progression.js`, `js/recompenses.js`, `js/muscles.js` | Sans effet de bord (sauf `calculs.js` qui lit l'état) : faciles à tester et à réutiliser dans une autre plateforme |
| Hors ligne | `sw.js` | Service worker : met en cache les fichiers de l'app (liste `FICHIERS`) ; ne gère jamais les requêtes d'autres sites |
| En ligne | `js/nuage.js`, `lib/nuage-firebase.js`, `lib/firebase-13.1.0/` | Synchronisation Firebase (Auth e-mail/mot de passe + Firestore) ; chargée seulement si un compte est utilisé |

Plan détaillé fichier par fichier : `js/README.md`. Stockage : `docs/STOCKAGE.md`. Historique : `docs/VERSIONS.md`.

## Modèle de données (`muscu-v1`)
```
{
  sessions: [{id, date, dur?, mod?, rt?, g?, gn?, exercises: [{name, cardio?, sets: [{kg, reps, done, w?} | {min, km, kcal, done}]}]}],
  routines: [{id?, name, exercises: [nom], sets?: [[série prévue]]}],
  current: id de la séance en cours | null,
  notes, rests: {"k:<exercice>": texte | secondes},
  gyms: [{id, name, eq: [machines], notes, chain?, club?, clubNom?}], gym?,   // club : v3.8
  mu: {<exercice perso>: <groupe>},            // v3.3
  corps: [{t, kg?, mg?, taille?, poitrine?, bras?, cuisse?, hanches?}],   // v3.6
  rv: [ids des récompenses notées], rvInit?,   // v3.6
  trash: [{at, s | r}], lastBackup?, bkEvery?, rest?, nv?
}
```
Règles : la clé `muscu-v1` ne change **jamais** ; un nouveau champ est **facultatif** et ajouté à `clean()`, à la fusion (`js/sauvegarde.js`) et à la sauvegarde en ligne (`META` dans `js/nuage.js`) ; un exemple est ajouté dans `tests/anciennes-sauvegardes/`.

## Sécurité (vérifiée en v3.7.1)
- **Règle de sécurité de la page (CSP)** dans `index.html` : scripts seulement depuis l'app, aucun script intégré, pas d'`eval`, pas de formulaire ni d'objet externe. Seules les adresses de Firebase sont autorisées en connexion.
- **Aucune injection de code** : tout texte de l'utilisateur est échappé (`esc()`). Le test `tests/25-securite.test.js` glisse un piège dans tous les champs et ouvre tous les écrans ; il a été vérifié qu'il échoue si un `esc()` est retiré.
- **Données entrantes nettoyées** par `clean()` (types, longueurs, bornes), y compris celles du serveur.
- **Firestore** (`firestore.rules`) : chacun ne lit et n'écrit que ses propres données ; tailles limitées ; tout le reste est refusé. Le rapport d'erreurs est en écriture seule.
- **Catalogue partagé (v3.8)** : `clubs/{id}` et `clubs/{id}/avis/{idAvis}` sont lisibles par tous (listes de machines, aucune donnée personnelle hormis l'identifiant anonyme du compte) ; écriture seulement avec une adresse vérifiée, un avis par machine et par compte (l'identifiant de l'avis contient le compte). Un club ne se modifie pas depuis l'app : modération dans la console Firebase. **Clubs connus d'avance (v3.9)** : `js/clubs-connus.js` réunit les listes par enseigne rangées dans `js/clubs/` (On Air : 137, Basic-Fit : 903, Fitness Park : 379, L’Orange Bleue : 389, Neoness : 32, Keepcool : 244) avec un identifiant fixe (`onair-…`) ; ils n'existent pas sur le serveur, seuls leurs avis y sont écrits (les règles ne demandent pas que le club existe). Ne jamais renommer un identifiant. Tout tient dans le forfait gratuit Spark (pas de stockage de fichiers).
- **Clé Firebase** (`js/nuage-config.js`) : publique par nature, **restreinte aux adresses du site** dans la console Google Cloud.
- **Authentification** : e-mail + mot de passe (8 caractères minimum), vérification d'adresse, mot de passe oublié. Aucun lien de connexion par e-mail ni OAuth Cordova : l'arrêt de Firebase Dynamic Links ne concerne pas l'app.
- Limite connue : GitHub Pages ne permet pas d'envoyer l'en-tête `frame-ancestors` (anti-« clickjacking ») ; à ajouter chez un hébergeur qui le permet, ou automatiquement dans une app native.

## Passer en application native
**Recommandé : Capacitor** (Ionic, open source). Il emballe la PWA telle quelle dans une app iOS/Android :
1. `npm i @capacitor/core @capacitor/cli`, `npx cap init`, dossier web = la racine du projet (ou un dossier copié).
2. `npx cap add ios` / `npx cap add android`, puis ouvrir dans Xcode / Android Studio.
3. Remplacer progressivement ce qu'une PWA ne peut pas faire par des plugins : chrono de repos sur l'écran verrouillé / Dynamic Island (Live Activities), Apple Santé / Health Connect, notifications, vibration native.
4. **Données** : `localStorage` reste disponible dans la WebView, mais pour une app publiée il est plus sûr de passer au plugin `@capacitor/preferences` ou à SQLite (le système peut vider le stockage web). Le format JSON ci-dessus peut être repris tel quel.
5. Firebase Web fonctionne dans Capacitor ; pour une intégration native complète, utiliser `@capacitor-firebase/authentication`.
6. Garder le service worker pour la version web ; le désactiver dans l'app native (les fichiers sont déjà embarqués).

Alternative : réécrire l'interface en React Native ou Flutter. Les calculs purs (`progression.js`, `recompenses.js`, `muscles.js`, `courbe.js`, `outils.js`) et le modèle de données se réutilisent ; les tests décrivent précisément le comportement attendu.

## Lancer le projet
```
npm ci
npx playwright install chromium
npm test            # tous les tests
npm run verifier    # ESLint
npm run ranger      # Prettier
python3 -m http.server   # puis http://localhost:8000
```
