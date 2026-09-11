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
