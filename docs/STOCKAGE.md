# Inventaire du stockage de Fluxe Suivi

Ce fichier liste **tout ce que Fluxe Suivi range dans le téléphone**.
Un test automatique (`tests/08-stockage.test.js`) lit le code (`js/` et `app.js`) et échoue si une clé
utilisée n'est pas listée ici, ou si elle ne commence pas par `muscu-v1`, `fx-` ou `fluxe-suivi-`.

**Règle d'or : on ne renomme jamais une clé.** Surtout pas `muscu-v1` : c'est là que sont toutes tes séances.

## localStorage (gardé même quand l'app est fermée)
| Clé | Rôle | Fichier qui l'utilise |
|---|---|---|
| `muscu-v1` | **Tes données** : séances, programmes, notes, temps de repos, salle. Ne jamais changer. | `js/config.js` (nom), `js/etat.js` (écriture), `js/donnees.js` (lecture) |
| `muscu-v1-brut` | Copie des données d'origine si le nettoyage au démarrage a retiré des séances abîmées | `js/donnees.js` (écriture), `js/versions.js` (lecture) |
| `muscu-v1-illisible` | Copie des données si elles étaient illisibles au démarrage | `js/donnees.js` |
| `muscu-v1-sauvegarde` | Ancienne copie de secours (avant la v2.1). Seulement lue une fois, pour la ranger dans les versions de secours | `js/versions.js` |
| `fx-no` | Tu as fermé le bandeau « Installer » : il ne revient plus | `js/installation.js` |
| `fx-test` | Petit essai d'écriture au démarrage (vérifie que le téléphone accepte d'enregistrer), effacé aussitôt | `js/etat.js` |
| `fx-old-done` | Les anciennes copies (`muscu-v1-sauvegarde`, `muscu-v1-brut`) ont déjà été rangées dans les versions de secours | `js/versions.js` |

## sessionStorage (effacé quand l'app est fermée)
| Clé | Rôle | Fichier qui l'utilise |
|---|---|---|
| `fx-heal` | Heure de la dernière réparation automatique d'une vieille version (une seule tentative par minute, pas de boucle) | `js/main.js`, `app.js` |

## IndexedDB (un autre coffre du navigateur, avec plus de place)
| Base | Rôle | Fichier qui l'utilise |
|---|---|---|
| `fluxe-suivi-secours` | Versions de secours de tes données (magasin `v`) : 1 copie automatique par jour (5 gardées) et une copie avant chaque import ou restauration (4 gardées) | `js/versions.js` |

## Caches du service worker (copie de l'app pour le hors ligne)
| Nom | Rôle | Fichier qui l'utilise |
|---|---|---|
| `fluxe-suivi-v…` (ex. `fluxe-suivi-v19` en v2.4.2) | Copie hors ligne de la version actuelle. Les anciennes `fluxe-suivi-…` sont supprimées à la mise à jour | `sw.js`, `js/main.js`, `app.js` |
| `fluxe-v10`, `fluxe-v6`, `fluxe-v5`, `muscu-v7`, `muscu-v6`, `muscu-v5`, `muscu-v4`, `muscu-v2`, `muscu-v1` | Anciens noms de cache des toutes premières versions. **Seulement lus** en secours, jamais supprimés ni écrits | `sw.js` (`ANCIENS_CACHES`) |

Les données de l'app ne sont **jamais** dans les caches : vider un cache ne fait rien perdre.

## Voisins sur le même domaine (ryoths.github.io)
Fluxe Suivi, Fluxe App et ATLAS sont publiés sur le même domaine : ils partagent le même localStorage,
les mêmes caches et les mêmes bases IndexedDB. Il faut donc que leurs noms ne se croisent jamais.

| Application | Ce qu'elle utilise | Collision avec Fluxe Suivi ? |
|---|---|---|
| **Fluxe App** (dépôt `RyoThs/Mon-Fluxe`, vérifié le 2026-11-09, commit `c0f045c`) | localStorage : `fluxe_user_v1`, `fluxe_backup` (avec un tiret bas). Aucun service worker, aucun cache, aucune base IndexedDB | **Non** : aucun nom commun |
| **ATLAS** | — | **Non vérifié** (code pas accessible lors de la vérification) |

À refaire à chaque fois qu'une de ces applications ajoute un stockage.
