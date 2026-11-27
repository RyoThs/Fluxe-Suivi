# Historique des versions de Fluxe Suivi

Une ligne par version : ce qui a changé pour l'utilisateur, et la branche GitHub qui garde **cette version exacte**.
Pour revenir à une ancienne version, il suffit de demander, par exemple : « reviens à la version 2.9.0 ».
Le retour se fait à partir de la branche `sauvegarde-v…`. Tes séances ne sont jamais touchées.

| Version | Date | Ce qui a changé | Copie gardée |
|---|---|---|---|
| **3.16.0** | 2026-11-27 | **Stats épurées** : le bandeau de chiffres tout en haut, puis Ma progression, Mon corps, Répartition par groupe et Volume par semaine toujours ouverts ; **Progression globale**, Cardio et Records repliés (on touche pour ouvrir, le téléphone s’en souvient). La courbe est toujours **globale** (Volume total, Séries, Durée) : plus de choix d’exercice ni de bouton « Toutes » (qui cachait les exercices). **Cardio perso reconnu** : « Cardio » dans les choix de muscle, et un nom comme vélo, course, rameur… devient un bloc cardio (min, km, kcal) à la place où on l’a fait. **Ouverture rapide sur réseau faible** : au-delà de 2,5 s sans réponse, l’app s’ouvre avec la copie du téléphone (avant : page blanche) | (version actuelle) |
| 3.15.0 | 2026-11-25 | **Compteur anonyme** : à la première séance de la semaine, l’app ajoute « +1 » à un total de la semaine (iPhone, Android ou autre), sans numéro ni donnée sur la personne ; l’utilisateur ne voit rien (une phrase dans la page Confidentialité). Écran « Compteur » (semaine, 8 semaines, objectif 300) visible seulement avec le compte du créateur. Nouvelles règles de la base à coller dans la console | `sauvegarde-v3.15.0` |
| 3.14.1 | 2026-11-25 | Correction : quand on rouvre l’app un autre jour, l’écran se met à jour (les **semaines d’affilée** restaient sur la semaine d’avant au lieu de repartir à zéro) ; le bouton compte maintenant **les séances de la semaine** (0, 1, 2, 3… et retour à 0 chaque lundi) ; le panneau garde les semaines d’affilée, le record et les récompenses (qui ne changent pas) | `sauvegarde-v3.14.1` |
| 3.14.0 | 2026-11-23 | **Les 244 clubs Keepcool de France sont dans l’app**, dont 13 dans les DOM-TOM (Martinique, La Réunion). Avec cette version, les 6 enseignes du catalogue ont leurs clubs : **2 084 clubs** au total | `sauvegarde-v3.14.0` |
| 3.13.0 | 2026-11-23 | **Les 32 clubs Neoness de France sont dans l’app** : dans « Mon club », on cherche sa salle (arrondissement, ville, code postal) et on la relie | `sauvegarde-v3.13.0` |
| 3.12.0 | 2026-11-23 | **Les 389 clubs L’Orange Bleue de France sont dans l’app**, dont Mamoudzou (Mayotte) et la Corse : dans « Mon club », on cherche sa salle et on la relie | `sauvegarde-v3.12.0` |
| 3.11.0 | 2026-11-23 | **Les 379 clubs Fitness Park de France sont dans l’app**, dont 18 dans les DOM-TOM (Guadeloupe, Martinique, Guyane, La Réunion) : dans « Mon club », on cherche sa salle (ville, code postal, territoire) et on la relie | `sauvegarde-v3.11.0` |
| 3.10.0 | 2026-11-23 | **Les 903 clubs Basic-Fit de France sont dans l’app** : dans « Mon club », on cherche sa salle par ville, rue ou code postal et on la relie, sans rien créer. Les listes sont rangées une par enseigne (`js/clubs/`) | `sauvegarde-v3.10.0` |
| 3.9.0 | 2026-11-23 | **Les 137 clubs On Air de France sont dans l’app** (DOM-TOM compris : Martinique, Guadeloupe, La Réunion) : dans « Mon club », on cherche sa salle par nom, ville, code postal ou territoire et on la relie, sans rien créer ; étiquette « bientôt » sur les 16 clubs en pré-ouverture ; marche hors ligne. Les autres enseignes suivront | `sauvegarde-v3.9.0` |
| 3.8.1 | 2026-11-23 | **Chercher son club** : dans « Mon club », une recherche (nom ou ville, sans tenir compte des accents) et les clubs existants en premier, mots trouvés surlignés ; « Créer le mien » devient un petit lien en bas (formulaire ouvert directement seulement si l’enseigne n’a encore aucun club), pour éviter les clubs en double | `sauvegarde-v3.8.1` |
| 3.8.0 | 2026-11-23 | **Catalogue partagé par club** : relier sa salle à son club (liste des clubs de son enseigne, ou créer le sien) ; signaler une machine (absente, autre marque, nom faux) ou confirmer qu’elle est là ; ajouter une machine vue ; le club décide ensemble (retirée après 3 signalements, ajoutée quand 3 membres l’ont vue, badge « vérifiée » après 2 confirmations). La correction s’applique tout de suite à sa propre liste ; partager demande un compte vérifié. Forfait gratuit Firebase, sans photo | `sauvegarde-v3.8.0` |
| 3.7.1 | 2026-11-22 | Rangement, rien de visible : code plus épuré (fonctions communes regroupées, sauvegarde en ligne et fin de séance découpées en petits fichiers, format des données décrit pour un développeur) ; audit de sécurité et test d’attaque | `sauvegarde-v3.7.1` |
| 3.7.0 | 2026-11-22 | **Glisser vers la gauche** : sur un exercice (Remplacer en gardant les séries, Supprimer) et sur une mesure de Mon corps (Modifier, Supprimer) ; message « Annuler » au lieu d’une question ; dernières mesures et « Tout voir » ; **transitions fluides** entre les pages | `sauvegarde-v3.7.0` |
| 3.6.0 | 2026-11-22 | **Semaines d’affilée** : le chiffre et un mini-graphe à droite du titre (accueil et Stats) ; en le touchant, l’explication et les **24 récompenses** ; **Mon corps** dans les Stats : poids, courbe, mensurations | `sauvegarde-v3.6.0` |
| 3.5.1 | 2026-11-22 | Pendant la séance, les exercices en cours restent en haut (le nouvel ajout aussi) et un exercice terminé descend en bas, sous « Terminés » ; « + Ajouter un exercice » remonte juste au-dessus ; l’Historique garde l’ordre réel | `sauvegarde-v3.5.1` |
| 3.5.0 | 2026-11-22 | **Nouveau style de l’écran Séance** : bandeau Durée / Volume / Séries (faites / prévues) avec barre de progression, prochaine série marquée, ligne « Record » sous la série, étiquettes Repos et « Par côté » (disques à mettre), chrono avec anneau, +30 s et série suivante ; ombres sur le côté pour la profondeur. Tous les boutons d’avant restent | `sauvegarde-v3.5.0` |
| 3.4.0 | 2026-11-22 | **Ma progression** : nouvelle carte en haut des Stats avec un mannequin réaliste (face et dos) qui se colore selon ta progression réelle, moitié régularité (séries sur la durée) et moitié force (charges qui montent) ; toucher un muscle montre le détail ; point faible. Rien n'est retiré | `sauvegarde-v3.4.0` |
| 3.3.0 | 2026-11-22 | **Muscles précis** : chaque exercice du catalogue connaît ses muscles (principaux et secondaires) ; un exercice perso demande son groupe de muscles (modifiable dans la séance) et apparaît dans ce groupe (liste, Stats). Préparation du mannequin « Ma progression » | `sauvegarde-v3.3.0` |
| 3.2.1 | 2026-11-15 | Avec un compte à jour, plus de rappel « Pense à sauvegarder » (le fichier reste possible) ; « Tout est sauvegardé en ligne » dans Mes données | `sauvegarde-v3.2.1` |
| 3.2.0 | 2026-11-15 | **Rapport d’erreurs** : journal sur le téléphone, envoi automatique au créateur (avec un compte) ou par e-mail ; un écran qui plante affiche un message au lieu de rester vide | `sauvegarde-v3.2.0` |
| 3.1.2 | 2026-11-15 | Rangement, rien de visible : README à jour, tests renumérotés de 01 à 16, code remis en forme, cet historique | `sauvegarde-v3.1.2` |
| 3.1.1 | 2026-11-15 | Page Confidentialité : adresse de contact `fluxe.suivi@outlook.fr` pour supprimer son compte par e-mail | `sauvegarde-v3.1.1` |
| 3.1.0 | 2026-11-15 | E-mail « Vérifie ton adresse » à la création du compte, avec les boutons Renvoyer et C'est fait | `sauvegarde-v3.1.0` |
| 3.0.0 | 2026-11-15 | **Sauvegarde en ligne** facultative (Firebase) : compte, envoi automatique, plusieurs appareils, hors ligne, suppression du compte, page Confidentialité | `sauvegarde-v3.0.0` |
| 2.9.0 | 2026-11-15 | **Courbes de progression** : Charge max, 1RM estimé, Volume ; vue « Toutes » (volume, séries, durée) ; 3 mois / 1 an / Tout | `sauvegarde-v2.9.0` |
| 2.8.2 | 2026-11-15 | Rangement : le code des boutons est réparti par thème (`js/gestes/`) | `sauvegarde-v2.8.2` |
| 2.8.1 | 2026-11-11 | Zoom bloqué, message « Tourne ton téléphone » à l'horizontale | `sauvegarde-v2.8.1` |
| 2.8.0 | 2026-11-11 | **Routines détaillées** (séries, poids, reps, cardio), chrono réglable pendant le repos, vibration discrète, 3 records | `sauvegarde-v2.8.0` |
| 2.7.0 | 2026-11-11 | Dessins de toutes les machines et de tous les exercices | `sauvegarde-v2.7.0` |
| 2.6.0 | 2026-11-11 | Fenêtres de l'app et icônes au trait (fini les fenêtres grises du téléphone) | `sauvegarde-v2.6.0` |
| 2.5.0 | 2026-11-11 | Catalogue de machines par enseigne, tout coché d'office | `sauvegarde-v2.5.0` |
| 2.4.3 | 2026-11-11 | Records : poids réellement soulevé, et non plus une estimation | `sauvegarde-v2.4.3` |
| 2.4.2 | 2026-11-09 | Hors ligne fiable : police dans l'app, mise en mémoire complète | `sauvegarde-v2.4.2` |
| 2.4.1 | 2026-11-08 | Guide : Ma salle et Catalogues | `sauvegarde-v2.4.1` |
| 2.4.0 | 2026-11-08 | Bibliothèque de machines simplifiée | `sauvegarde-v2.4.0` |
| 2.3.0 | 2026-11-08 | Code découpé en petits fichiers, styles à part | `sauvegarde-v2.3.0` |
| 2.2.1 | 2026-11-08 | Des données illisibles sont mises à l'abri avant d'être écrasées | `sauvegarde-v2.2.1` |
| 2.2.0 | 2026-11-08 | Rappel de sauvegarde amélioré | `sauvegarde-v2.2.0` |
| 2.1.1 | 2026-11-06 | La mise à jour se répare toute seule sur iPhone | `sauvegarde-v2.1.1` |
| 2.1 | 2026-11-06 | Versions de secours, corbeille, fusion de fichiers, début de « Ma salle » | — |
| 2.0 | — | Version de départ | `sauvegarde-v2.0` |

## Comment une version est publiée
1. Une copie de la version en ligne est gardée (branche `sauvegarde-v…`).
2. Le numéro change à 3 endroits (`js/config.js`, `index.html`, `sw.js`). Un test vérifie qu'ils correspondent.
3. GitHub relance tous les tests. On ne publie que s'ils sont tous verts.
4. Une ligne est ajoutée en haut de ce fichier.
