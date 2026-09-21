# AeroLab — Passation de projet

Ce fichier est fait pour être lu en premier par toute nouvelle session Claude qui reprend ce projet (nouveau compte, nouvel environnement, ou simplement une longue pause). Il ne remplace pas `todo.md`, qui reste la trace détaillée de chaque étape — il donne juste le contexte que Git seul ne transporte pas.

## État réel au moment de ce transfert

Une source externe (OurAirports) est prouvée de bout en bout, en conditions réelles, pas seulement en théorie :

```
OurAirports (source publique réelle)
    ↓ fetch réel
RAW (86 080 lignes)
    ↓ validation (0 rejet)
NORMALIZATION
    ↓
DATABASE (MySQL/TiDB, sans doublon — vérifié 2x en SQL réel)
    ↓
API tRPC (dataEngine.airports)
    ↓
Réponse réelle du serveur confirmée : total = 86080
```

Dernier commit poussé confirmé sur `origin/main` au moment de la rédaction : `56eff2a` ("Expose airports via dataEngine.airports API procedure"). Un travail supplémentaire (Step 8b — pipeline d'ingestion générique, contrat `DatasetConnector`) est en cours de préparation et n'a pas encore été livré/testé par l'utilisateur — voir la fin de `todo.md` pour son état exact au moment du transfert.

## Ce qui NE transfère PAS avec Git (et qu'il faut reconstituer)

1. **La mémoire de conversation de Claude** est liée au compte, pas au projet. La nouvelle session ne se souviendra de rien de cette conversation — elle doit tout retrouver via ce fichier + `todo.md` + le code lui-même.
2. **La base de données réelle utilisée pour les tests.** Ce n'est pas la base de production originale (celle-là était sur Manus, jamais retrouvée). C'est un cluster **TiDB Serverless gratuit**, nommé `cire`, région Frankfurt, base `test`. Créé sur https://tidbcloud.com avec le compte `tactgroup-gaydel`.
3. **Le fichier `.env` local**, jamais commité (exclu par `.gitignore`, volontairement — il contient `DATABASE_URL` avec un mot de passe). Il vit uniquement sur la machine où le projet a été testé (`~/Downloads/aerolab-test/.env`). Format :
   ```
   DATABASE_URL=mysql://<user>:<password>@gateway01.eu-central-1.prod.aws.tidbcloud.com:4000/test?ssl={"rejectUnauthorized":true}
   ```
   Le paramètre `?ssl=...` à la fin est obligatoire — TiDB Serverless refuse les connexions non chiffrées.
4. **Discipline de travail établie** : chaque changement de code a été vérifié par typage statique avant livraison, puis testé réellement par l'utilisateur (`pnpm check && pnpm test`), avant commit + push. Aucun statut n'a jamais été déclaré "actif"/"validé" sans preuve d'exécution réelle. À reprendre à l'identique.

## Comment reprendre concrètement

1. Cloner `github.com/tactgroup-gaydel/aerolab-platform-v1`, branche `main`.
2. Lire `todo.md` en entier (trace chronologique complète des décisions).
3. Si vous voulez retester avec une vraie base : soit récupérer l'accès au cluster TiDB `cire` existant (dashboard tidbcloud.com), soit en créer un nouveau (gratuit, ~5 min) et reconstituer `.env`.
4. `pnpm install && pnpm check && pnpm test` pour confirmer que le socle est toujours vert avant de continuer quoi que ce soit.

## Où pointer la prochaine session Claude

Ce fichier, plus `todo.md`. Rien d'autre n'est nécessaire pour comprendre où en est le projet.
