# Project TODO

- [x] Public AeroLab shell with HOME / ACTU / HUB / PLUS navigation
- [x] Mobile-first responsive layout with premium AeroLab visual system
- [x] FR/EN language switch with bilingual labels and content model
- [x] Global search across available content and data
- [x] Home entry point with current signal and module overview
- [x] Mobility Actu listing with sector filters
- [x] Mobility Actu article detail with fact, context, signal, implications, and related content
- [x] Mobility Hub exploration for countries, sectors, markets, infrastructures, indicators, articles, analyses, and projects
- [x] Country detail with connected knowledge links
- [x] Data listing with sourced indicators and provenance metadata
- [x] Indicator detail with value, unit, period, source, update date, and methodology
- [x] Interactive Map experience for countries and infrastructures with filters and selection
- [x] AeroLab Intelligence listing and detail organized by six analysis sections
- [x] Projects listing and detail with conditional context, intervention, and deliverables only when available
- [x] AeroLab ACT request form with contact, country, sector, and need fields
- [x] ACT validation and confirmation screen
- [x] Server-side content procedures and ACT request procedure
- [x] Database schema for AeroLab entities and status workflows
- [x] SEO metadata and maintainable content structure
- [x] Vitest coverage for core content, search, and ACT request flows
- [x] Browser and responsive visual verification
- [x] Build and type-check verification

- [x] Implement real Mobility Hub exploration for sectors, markets, and infrastructures, with linked detail views
- [x] Extend Map with infrastructure markers, filters, and linked infrastructure cards
- [x] Add server-side content directory and search procedures and wire global search to the server
- [x] Add route-aware metadata titles and descriptions for public detail pages
- [x] Expand Vitest coverage for server search, Hub counts, and ACT success response without test persistence
- [x] Save final project checkpoint for delivery

# Phase 2 — World Monitor Data Layer

- [x] Inspect the complete Phase 2 package and record its requirements
- [x] Verify World Monitor mobility surfaces and use only confirmed endpoints or service interfaces
- [x] Document World Monitor licensing and integration boundary without copying AGPL source code
- [x] Map the current AeroLab data architecture and identify a progressive PostgreSQL/PostGIS path
- [x] Build a WorldMonitorConnector abstraction with timeout, error, and provenance handling
- [x] Build normalized AeroLab mobility signal types independent from upstream responses
- [x] Add raw/provenance/validation/normalization/entity-resolution data structures
- [x] Add resilient fallback behavior with last validated data marked stale and failure recorded
- [x] Preserve existing AeroLab routes, bilingual UX, mobile-first layout, and design system
- [x] Expose verified mobility signals in Map, Mobility Hub, Data, and Intelligence without cloning World Monitor
- [x] Add Phase 2 tests for connector behavior, normalization, provenance, and fallback
- [x] Run final type-check, tests, build, and visual verification
- [x] Save Phase 2 checkpoint and report endpoints, database state, entities, provenance, fallback, tests, issues, and remaining work

# Phase 2 — AeroLab Mobility Data Engine expansion

- [x] Add a source registry with priority, license status, commercial-use, redistribution, attribution, and review notes
- [x] Define a connector interface that supports World Monitor and future OpenSky, OurAirports, OSM, AFTS, PortWatch, UNCTAD, World Bank, MobilityData, and Weather connectors
- [x] Create inactive connector stubs for candidate sources without claiming they are connected
- [x] Extend normalized entities with Airport, Port, Chokepoint, rail, road, logistics, city, corridor, and indicator types
- [x] Prioritize OurAirports master-data connector design without activating unverified ingestion
- [x] Prepare OSM geospatial connector boundary with attribution and production-extract notes
- [x] Prepare AFTS, PortWatch, UNCTAD, and World Bank connector boundaries with licensing review flags
- [x] Add data quality states VALID, STALE, INVALID, and ERROR
- [x] Add cache/raw/provenance metadata and observability fields for connector operations
- [x] Preserve AeroLab-owned editorial validation before any signal can become Actu content
- [x] Ensure Map consumes only AeroLab API normalized data, never external payloads
- [x] Add Phase 2 Data Engine delivery report with source registry, integration state, licensing boundary, and remaining work

# Phase 3 — Real Repository Validation

- [x] Record node, npm, and pnpm versions
- [x] Run pnpm install against the existing AeroLab repository
- [x] Run pnpm check and record the real result
- [x] Run pnpm test and record PASS/FAIL counts from execution
- [x] Run pnpm build and record the real result
- [x] Verify the actual database engine and DATABASE_URL configuration
- [x] Verify PostgreSQL/PostGIS availability without claiming readiness if absent
- [x] Classify World Monitor as DISABLED, MOCK, LIVE, or NOT LIVE / CREDENTIAL REQUIRED
- [x] Classify OurAirports as MOCK, BLOCKED, or NOT STARTED based on real access
- [x] Do not activate new connectors before the existing validation baseline is complete
- [x] Write the factual Phase 3 validation report inside the project
- [x] Save the Phase 3 checkpoint for delivery

# Phases 4-8 — Data Engine réel : OurAirports de bout en bout (2026-09-13 → 2026-09-19)

⚠️ Cette section a été ajoutée le 2026-09-19/21 après avoir constaté qu'elle manquait du dépôt réel malgré le travail effectué — voir HANDOFF.md pour le contexte de cet écart. Chaque ligne ci-dessous est sourcée par une preuve d'exécution réelle (sortie de terminal, requête SQL, réponse API), pas par une intention ou un code non testé.

## Bug bloquant corrigé (préalable)
- `server/connectors/stubs/factory.ts` était référencé par les 9 stubs de connecteurs mais absent du dépôt — confirmé absent aussi dans l'archive originale. Restauré (enveloppe autour de `InactiveConnector` existant, aucun nouveau comportement).
- `server/connectors/registry.ts` enrichi : `coverage`/`accessMethod`/`updateFrequency` ajoutés aux 10 sources.
- Validé réellement par l'utilisateur (node v26.3.0, pnpm 10.4.1) : `pnpm install` (750 paquets), `pnpm check` (0 erreur), `pnpm test` **12/12**, `pnpm build` OK.

## Pipeline OurAirports MOCK
- `server/pipeline/ourairportsMockPipeline.ts` + test (7 tests) : Raw → Validation → Normalisation → Entity Resolution sur fixtures explicitement labellisées, pas de vraie donnée.
- Validé réellement : `pnpm test` → **19/19**.

## OurAirports LIVE (vraie source, vrai réseau)
- Source vérifiée par recherche web avant tout code : https://ourairports.com/data/ (domaine public) et son miroir https://davidmegginson.github.io/ourairports-data/airports.csv (licence Unlicense), aucune clé requise.
- `server/connectors/ourairports/index.ts` : fetch réel + parseur CSV par nom de colonne + validation + normalisation. `server/connectors/ourairports/liveCheck.ts` : script manuel de vérification (lecture seule, vrai réseau, jamais dans les tests automatiques).
- Validé réellement : `pnpm test` → **29/29**. Puis `pnpm tsx server/connectors/ourairports/liveCheck.ts` exécuté avec un vrai accès réseau → **86 076 lignes réelles récupérées**, 0 rejet.

## Persistance réelle en base
- Base de test créée (l'originale, sur Manus, n'a jamais été retrouvée) : cluster **TiDB Serverless gratuit "cire"**, région Frankfurt, base `test`, compte `tactgroup-gaydel`.
- `drizzle/schema.ts` : table `airports` ajoutée (additive uniquement), clé unique `(sourceId, externalId)` pour upsert idempotent.
- `server/connectors/ourairports/persistLive.ts` : script de persistance réelle, upsert par lots (`ON DUPLICATE KEY UPDATE`), enregistre la provenance via `recordConnectorRun`.
- Migration générée et **relue avant application** (`pnpm drizzle-kit generate` puis `push`, un seul `CREATE TABLE airports`, rien d'autre touché) — appliquée avec succès : **[✓] Changes applied**.
- Idempotence prouvée deux fois en SQL réel : deux exécutions de `persistLive.ts` (limite 25) → `SELECT COUNT(*) FROM airports` = **25** les deux fois, jamais 50.
- Import complet exécuté : `persistLive.ts --all` → **86 080 aéroports réels traités et insérés en 46 secondes**, 0 rejet. Confirmé en SQL réel : `SELECT COUNT(*) FROM airports` = **86080**.
- Commit `47c94e4` poussé sur `origin/main` (pipeline mock + connecteur OurAirports + table airports).

## Statut `ourairports` → `active`
- `server/connectors/registry.ts` : statut passé de `prepared` à `active`, licence mise à jour avec la source vérifiée ci-dessus (au lieu de "unknown/review required").
- Incohérence trouvée et corrigée dans `server/connectors/index.ts` : `preparedConnectors` gardait `ourairports` dans la liste "prepared" malgré son nouveau statut — corrigé en le filtrant de cette liste.
- Un vrai échec de test a détecté cette incohérence avant correction (28/29, pas un faux positif) — corrigé, confirmé réellement à **29/29**.
- Commits `69f5c2a` (correction) poussés sur `origin/main`.

## Exposition API (`dataEngine.airports`)
- `server/db.ts` : `getAirports`/`getAirportsCount` (vrai `COUNT(*)` SQL, pas un `.length` après chargement complet — la table fait 86k+ lignes).
- `server/routers.ts` : procédure tRPC `dataEngine.airports`, paginée, validée par zod.
- Validé réellement à **30/30** tests.
- Preuve finale obtenue en interrogeant le vrai serveur (`pnpm dev`, `http://localhost:3000/api/trpc/dataEngine.airports`) : réponse réelle avec `total: 86080`, correspondant exactement à la base.
- Commit `56eff2a` poussé sur `origin/main`.

## Audit Step 7 (Data Engine)
- Audit complet réalisé (fichier `AEROLAB_STEP7_DATA_ENGINE_AUDIT.md`, non commité dans le dépôt à ce jour — seulement partagé en conversation). Verdict : **B — FOUNDATION READY WITH P1 FIXES**.
- Constats principaux : le pipeline OurAirports contourne les tables génériques `sourceObservations`/`mobilityObservations` (héritées de la Phase 2, jamais utilisées) ; la résolution d'entité (`entityResolution.ts`) existe mais n'est jamais appelée dans `persistLive.ts`, et aucune table `entities` n'existe — donc aucune correspondance inter-sources possible aujourd'hui ; le frontend ne consomme pas encore `dataEngine.airports`.

## Step 8 — Contrat `DataConnector` (formalisation, additif)
- `server/connectors/datasetContract.ts` : `DatasetConnector<TRawRow,TNormalized>` (nouveau), `RealtimeConnector` = alias de `MobilityConnector` existant (World Monitor non touché).
- `server/connectors/ourairports/asDatasetConnector.ts` : enveloppe les fonctions existantes de `index.ts` sans les dupliquer, pour vérifier que le contrat colle au cas réel.
- 2 tests écrits, vérifiés statiquement (0 erreur), **mais pas encore testés réellement par l'utilisateur ni commités**.

## Step 8b — Pipeline d'ingestion générique (interrompu, non livré)
Préparé mais **jamais livré ni testé** avant l'interruption de session (transfert de compte + réinitialisation de l'environnement de travail Claude) :
- Table `datasets` ajoutée à `drizzle/schema.ts` (additive, schéma seulement — **jamais appliquée en base**, décision explicitement laissée en attente).
- `server/db.ts` : `upsertAirports()` (extrait de la logique déjà présente dans `persistLive.ts`) et `recordSourceObservation()` (écrit dans `sourceObservations`, jugé adapté pour la couche RAW — contrairement à `mobilityObservations`, jugé inadapté sémantiquement pour des aéroports et donc volontairement non utilisé).
- `server/ingestionPipeline.ts` : orchestrateur générique (`runDatasetIngestion`) — fetch → parse → validate → normalize → resolveEntity → persist (persistance injectée par l'appelant, jamais codée en dur dans le pipeline).
- **`persistLive.ts` n'a PAS encore été adapté pour utiliser ce pipeline** — c'était la prochaine étape au moment de l'interruption.
- **Aucun test écrit pour ce pipeline. Aucune vérification statique faite. Rien commité. Rien poussé.**

## État réel au 2026-09-21 (dernier commit confirmé)
`8a2ec60` — "Add HANDOFF.md for account transfer", poussé sur `origin/main`. Tout ce qui précède ce commit (Steps 4 à 7, statut `ourairports: active`) est réellement testé et en production sur le dépôt. **Le Step 8 (contrat) et le Step 8b (pipeline générique) existent uniquement sous forme de code préparé en session, jamais livré, jamais testé, jamais commité — à reprendre depuis zéro ou à redemander si une session précédente en a une copie.**
