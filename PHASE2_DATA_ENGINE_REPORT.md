# AeroLab Platform V1 — Phase 2 Data Engine

## Objet et périmètre

Cette phase transforme la plateforme AeroLab en une **couche Data Engine multi-sources**. L’objectif n’est pas de reproduire World Monitor, mais d’en interroger certaines surfaces vérifiées, de conserver la provenance et la qualité, puis d’exposer des **observations normalisées AeroLab** à Map, Mobility Hub, Data et Intelligence.

Le périmètre livré conserve l’interface publique existante, le mobile-first, le bilingue FR/EN, la navigation HOME / ACTU / HUB / PLUS et l’identité éditoriale AeroLab. Aucune référence de projet client n’a été ajoutée.

## État des sources

| Source | Identifiant | État dans AeroLab | Domaines | Limite actuelle |
|---|---|---:|---|---|
| World Monitor | `worldmonitor` | Préparé / connecteur implémenté | Aviation, maritime, logistique | Activation réelle conditionnée à `WORLDMONITOR_API_KEY` |
| OurAirports | `ourairports` | Préparé / stub contractuel | Aviation | Revue de licence et ingestion master-data à effectuer |
| OpenStreetMap | `openstreetmap` | Préparé / stub contractuel | Aviation, maritime, rail, route, logistique | Extraits de production et attribution ODbL à cadrer |
| African Transport Systems Database | `afts` | Préparé / stub contractuel | Aviation, maritime, rail, route, logistique | Conditions d’accès et redistribution à vérifier |
| PortWatch | `portwatch` | Préparé / stub contractuel | Maritime, logistique | Conditions d’utilisation et cadence à vérifier |
| UNCTADstat | `unctadstat` | Préparé / stub contractuel | Maritime, logistique | Revue dataset par dataset |
| World Bank | `worldbank` | Préparé / stub contractuel | Rail, route, logistique | Méthodologie et licence de chaque indicateur à documenter |
| OpenSky | `opensky` | Préparé / stub contractuel | Aviation | Identifiants, quotas et licence à confirmer |
| MobilityData | `mobilitydata` | Préparé / stub contractuel | Route, rail | Feed par feed, licence et rafraîchissement à cadrer |
| Open-Meteo | `openmeteo` | Préparé / stub contractuel | Contexte opérationnel | Usage opérationnel et attribution à revoir |

Dans cette version, **aucune source préparée n’est présentée comme active**. Le registre distingue explicitement `active`, `prepared` et `disabled`.

## World Monitor : contrat et endpoints

Le connecteur serveur `WorldMonitorConnector` est limité à des appels REST côté serveur, avec timeout, hash léger du payload, normalisation et statut de santé. Les surfaces vérifiées utilisées par le connecteur sont les suivantes :

| Surface AeroLab | Endpoint upstream vérifié | Sortie AeroLab |
|---|---|---|
| Aviation status | `/api/aviation/v1/list-airport-delays` | `AirportStatus[]` |
| Airspace / aircraft | `/api/aviation/v1/aircraft` | `AircraftObservation[]` |
| Maritime activity | `/api/maritime/v1/activity` | `MaritimeActivity[]` |
| Chokepoints | `/api/maritime/v1/chokepoints` | Surface préparée, non agrégée dans le snapshot public |
| Flight search | `/api/aviation/v1/flight-prices` | Surface préparée pour une phase ultérieure |

La référence officielle de l’API World Monitor est consultable dans la [documentation API World Monitor][1]. Les détails de licence et les conditions de redistribution doivent être revérifiés au moment de l’activation production à partir des sources officielles du projet [2].

## Architecture et flux

```text
World Monitor / sources candidates
              |
              v
      Connector contract
              |
              v
      Raw response + hash
              |
              v
   Normalisation AeroLab + provenance
              |
              v
  Entity resolution déterministe
              |
              v
     Quality: VALID / STALE / INVALID / ERROR
              |
              v
 Map / Hub / Data / Intelligence / Actu editorial review
```

Le contrat partagé `MobilityConnector` impose un identifiant, un état, des domaines, une vérification de santé et des méthodes normalisées pour l’aviation et le maritime. Les sources candidates possèdent désormais des modules stub réels qui satisfont ce contrat, mais leurs retours restent volontairement inactifs tant que la licence, les credentials et l’ingestion ne sont pas validés.

## Modèle de données

Le schéma conserve les entités AeroLab déjà présentes et ajoute les tables suivantes :

| Table | Usage |
|---|---|
| `dataSources` | Registre persistant des sources et de leur statut |
| `sourceObservations` | Réponses brutes référencées par source, endpoint, hash et date de récupération |
| `mobilityObservations` | Observations normalisées AeroLab, qualité, coordonnées et clés d’entités |
| `connectorRuns` | Santé, statut, fraîcheur, erreurs, nombre de lignes et latence d’exécution |

Le champ `connectorRuns.latencyMs` a été ajouté par migration additive. Aucune table existante n’a été supprimée ou remplacée.

Les types normalisés couvrent désormais `Airport`, `Port`, `Chokepoint`, `RailInfrastructure`, `RoadInfrastructure`, `LogisticsInfrastructure`, `City`, `Corridor`, `Indicator` et `MobilityObservation`. La résolution d’entités applique une séquence déterministe : identifiant exact, code externe, puis couple nom-pays. Les objets non résolus conservent leur provenance et un niveau de confiance nul au lieu d’être silencieusement rattachés.

## Provenance, qualité et fallback

Chaque observation normalisée conserve au minimum la source, l’endpoint, la date de récupération, le hash du payload brut et l’état de qualité. Le moteur distingue `VALID`, `STALE`, `INVALID` et `ERROR`.

Lorsque World Monitor n’est pas configuré, renvoie une erreur, dépasse le timeout ou retourne un payload mal formé, AeroLab n’expose pas le payload brut. Le moteur retourne un snapshot AeroLab vide ou, si un cache validé existe, un snapshot marqué `validated-cache` avec les observations dégradées en `STALE`. Les exécutions sont enregistrées dans `connectorRuns` en production avec statut, fraîcheur, erreur, cardinalité et latence.

L’interface signale explicitement l’état « En attente de source » lorsque les credentials ne sont pas présents. Ce comportement est intentionnel : il évite d’afficher une donnée externe non vérifiée comme si elle était disponible.

## Intégration produit

| Surface | Intégration livrée |
|---|---|
| Map | Consomme `dataEngine.mapEntities`, qui fournit les pays, infrastructures et observations normalisées via l’API AeroLab. Les marqueurs de données n’utilisent pas de payload World Monitor côté client. |
| Mobility Hub | Les fiches pays exposent le contexte Data Engine, le nombre d’observations et le mode upstream / cache / indisponible. |
| Data | Le bandeau Data Engine affiche le mode de source, le nombre d’observations normalisées et l’état des connecteurs. |
| Intelligence | Le rail éditorial affiche le contexte Data Engine sans transformer automatiquement un signal en contenu publié. |
| Mobility Actu | Aucun article n’est généré automatiquement. La validation éditoriale AeroLab reste une étape distincte. |

## Tests et vérifications

La suite Vitest couvre les procédures publiques existantes, la recherche globale, l’ACT, le registre multi-sources, l’absence de credentials, la normalisation d’un retour aviation contrôlé, les payloads malformés, les timeouts, le fallback sans données upstream et la résolution d’entités.

| Vérification | Résultat |
|---|---:|
| TypeScript `pnpm check` | Réussi |
| Vitest | 12 tests réussis |
| Build production `pnpm build` | Réussi |
| Vérification visuelle desktop | Réussie sur Data, Map, Hub pays et Intelligence |
| Migration SQL Phase 2 | Appliquée sans opération destructive |

## Limites et prochaines étapes

La clé `WORLDMONITOR_API_KEY` reste nécessaire pour activer des appels upstream réels. Les sources candidates sont contractuellement préparées mais ne sont pas connectées. La prochaine étape recommandée est d’activer OurAirports ou OpenStreetMap après validation juridique et de brancher une file d’ingestion persistante avec backoff, quotas et alertes. Une migration PostgreSQL/PostGIS pourra ensuite remplacer progressivement les coordonnées et géométries simplifiées lorsque le besoin de requêtes spatiales avancées sera confirmé.

> **Décision de sécurité produit :** aucune observation upstream ne devient automatiquement un article, une analyse publiée ou une référence de projet. Les données externes restent des signaux à valider dans le référentiel AeroLab.

## Références

[1]: https://www.worldmonitor.app/docs/api-reference "World Monitor — API Reference"
[2]: https://github.com/koala73/worldmonitor/blob/main/LICENSE "World Monitor — repository license"
