# AeroLab V1 — Phase 3
## Validation réelle du repository

**Statut global : PARTIAL**

La validation réelle du repository existant a été exécutée sans reconception UX ni nouveau connecteur LIVE. L’installation est terminée, le contrôle TypeScript est terminé avec succès, la suite de tests est terminée avec 12 tests réussis, et le build de production est terminé avec succès. La base réellement disponible est une base compatible MySQL/TiDB serverless. PostgreSQL/PostGIS n’est pas disponible dans l’environnement vérifié. World Monitor reste non LIVE faute de credential ; OurAirports n’a pas été démarré.

## 1. Environnement

| Élément | Résultat | Preuve exécutée |
|---|---|---|
| Node.js | DONE | `node --version` → `v22.13.0` |
| npm | DONE | `npm --version` → `10.9.2` |
| pnpm | DONE | `pnpm --version` → `10.4.1` |
| Repository | DONE | `/home/ubuntu/aerolab-platform-v1` |

## 2. Installation

**Statut : DONE.**

La commande `pnpm install` a été exécutée sur le repository existant. Le lockfile était à jour et pnpm a indiqué que les dépendances étaient déjà installées. Deux avertissements non bloquants ont été observés : la configuration `pnpm` embarquée dans `package.json` n’est plus lue par la version utilisée, et certains scripts de build de dépendances ont été ignorés par la politique pnpm locale.

## 3. `pnpm check`

**Statut : DONE.**

La commande `pnpm check` s’est terminée avec `CHECK_EXIT=0`. Le contrôle TypeScript n’a rapporté aucune erreur.

## 4. `pnpm test`

**Statut : DONE.**

La commande `pnpm test` s’est terminée avec `TEST_EXIT=0`.

| Mesure | Résultat |
|---|---:|
| Fichiers de test réussis | 2 |
| Tests réussis | 12 |
| Tests en échec | 0 |
| Tests ignorés | 0 |

Les tests couvrent les procédures publiques AeroLab, la recherche, ACT, le registre Data Engine, l’absence de credential World Monitor, la normalisation, les payloads malformés, les timeouts, le fallback, la résolution d’entités et l’authentification de déconnexion.

## 5. `pnpm build`

**Statut : DONE.**

La commande `pnpm build` a été relancée séparément après une première exécution combinée dont le shell est resté bloqué après la sortie Vite. La relance indépendante s’est terminée avec `BUILD_EXIT=0`. Vite a généré le frontend et esbuild a généré `dist/index.js`.

Un avertissement de taille de bundle est présent : certains chunks dépassent 500 kB après minification. Il ne bloque pas le build et ne justifie pas une refonte dans cette phase.

## 6. Base de données réellement disponible

**Statut : DONE.**

L’environnement contient `DATABASE_URL` et utilise le schéma `mysql`. La vérification SQL en lecture seule a retourné :

| Vérification | Résultat |
|---|---|
| Moteur retourné | `TiDB v8.5.3 serverless`, compatible MySQL |
| Base active | `KZdeWKYefdQAv9BdQyd5Sh` |
| Tables Data Engine | `connectorRuns`, `dataSources`, `mobilityObservations`, `sourceObservations` |
| Lignes `connectorRuns` observées | 54 |

La présence de ces tables et de ces lignes est vérifiée par SQL. Aucune donnée n’a été insérée pendant cette validation.

## 7. PostgreSQL / PostGIS

**Statut : BLOCKED.**

`psql` et `pg_isready` ne sont pas installés dans l’environnement vérifié. `DATABASE_URL_POSTGRES` est absent. Aucune instance PostgreSQL/PostGIS n’a donc été déclarée opérationnelle. La cible d’architecture reste PostgreSQL + PostGIS, mais son exécution réelle est bloquée par l’absence d’URL et d’instance vérifiables.

## 8. World Monitor

**Statut : BLOCKED.**

`WORLDMONITOR_API_KEY` et `WORLDMONITOR_API_BASE_URL` sont absents. World Monitor n’est donc **pas LIVE**. Le connecteur existe dans le repository, ses tests fonctionnent avec des réponses contrôlées, et le fallback ne bloque pas l’application ; cependant la classification factuelle de l’environnement courant est : **NOT LIVE / CREDENTIAL REQUIRED**.

Aucun payload upstream réel n’a été présenté comme une donnée disponible dans l’application.

## 9. OurAirports

**Statut : NOT STARTED.**

OurAirports reste au stade de contrat et de stub préparé. Aucun accès LIVE, aucune ingestion raw, aucune normalisation de données externes et aucune persistance OurAirports n’ont été exécutés pendant cette phase. La chaîne prévue est conservée : connector → raw ingestion → validation → normalisation → entity resolution → provenance → AeroLab Database.

Aucune donnée OurAirports n’a été inventée.

## 10. Fichiers modifiés ou ajoutés pour cette validation

| Fichier | Rôle |
|---|---|
| `todo.md` | Checklist Phase 3 et traçabilité des validations |
| `PHASE3_REPOSITORY_VALIDATION_REPORT.md` | Rapport factuel de validation |

Les fichiers d’implémentation Data Engine et les migrations associés à la Phase 2 restent ceux du checkpoint précédent ; cette Phase 3 n’a pas reconçu le produit.

## 11. Problèmes restants

Le repository comporte encore un avertissement de configuration pnpm lié à un champ déprécié dans `package.json`, ainsi qu’un avertissement de taille de bundle. Ces deux points n’empêchent pas les commandes obligatoires de réussir.

La limite principale est l’absence de PostgreSQL/PostGIS et de credentials World Monitor. OurAirports ne doit pas passer en LIVE tant que le socle et les conditions d’accès ne sont pas vérifiés. Les données de démonstration déjà présentes dans l’interface restent explicitement identifiées comme telles par le produit ; elles ne constituent pas des observations upstream LIVE.

## 12. Prochaine étape

La prochaine étape autorisée est de fournir une configuration PostgreSQL/PostGIS vérifiable et, séparément, de décider si World Monitor doit être activé avec une clé valide. Après cela seulement, OurAirports pourra être implémenté au statut **MOCK** ou **LIVE** selon l’accès réel. En l’absence d’accès, son statut doit rester **BLOCKED** ou **NOT STARTED**, jamais DONE.
