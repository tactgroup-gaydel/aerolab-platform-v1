/**
 * AEROLAB — PIPELINE DE BOUT EN BOUT (MOCK) — OURAIRPORTS
 * ========================================================
 *
 * Objectif (Phase 4 de la spec V1.1 Phase 3) : prouver que la chaîne
 *
 *   MOCK SOURCE → CONNECTOR → RAW RECORD → VALIDATION → NORMALIZATION
 *   → ENTITY RESOLUTION → OBSERVATION
 *
 * fonctionne de bout en bout, AVANT de brancher une vraie source ou une
 * vraie base PostgreSQL/PostGIS (aucune des deux n'est disponible dans cet
 * environnement : pas d'accès réseau, pas de DATABASE_URL_POSTGRES).
 *
 * ⚠️ Les enregistrements ci-dessous sont des FIXTURES DE TEST, pas des
 * données OurAirports réelles. Ils ne doivent jamais être présentés comme
 * une intégration active. Le registre (`server/connectors/registry.ts`)
 * continue de déclarer `ourairports` en statut `prepared` — ce fichier ne
 * change pas ce statut, il teste seulement la mécanique du pipeline.
 *
 * L'étape PostgreSQL/PostGIS de la chaîne est volontairement représentée
 * par une fonction `buildPersistPreview()` qui illustre seulement la forme
 * des lignes qui seraient insérées dans une future base PostgreSQL/PostGIS
 * (ce schéma n'existe pas dans ce repository — la base live reste MySQL,
 * table par table : `raw_records`, `observations`, `entities`) — cette
 * fonction n'écrit dans aucune base réelle.
 *
 * ⚠️ NON EXÉCUTÉ à la livraison de ce fichier : écrit et vérifié par lecture
 * après le correctif de `server/connectors/stubs/factory.ts` (déjà validé
 * réellement par `pnpm test` sur cette base le 2026-09-11, 12/12 tests).
 * Ce fichier ajoute 7 tests supplémentaires, à exécuter réellement avant
 * de les considérer comme passés.
 */

import type { Airport } from "@shared/dataEngine";
import { resolveEntity, type EntityCandidate } from "../entityResolution";

// ---------------------------------------------------------------------------
// 1. MOCK SOURCE — fixtures explicitement marquées comme non réelles
// ---------------------------------------------------------------------------

export interface OurAirportsMockRawRow {
  id: string;
  ident: string | null;
  name: string | null;
  iata_code: string | null;
  icao_code: string | null;
  iso_country: string | null;
  latitude_deg: number | null;
  longitude_deg: number | null;
  elevation_ft: number | null;
  timezone: string | null;
}

/**
 * Fixture de test — valeurs approximatives illustratives, PAS un export
 * réel du dataset OurAirports. À remplacer entièrement lors de l'activation
 * du connecteur (ingestion CSV réelle, cf. .env.example: OURAIRPORTS_DATA_URL).
 */
export const MOCK_OURAIRPORTS_ROWS: OurAirportsMockRawRow[] = [
  {
    id: "mock-1",
    ident: "GOBD",
    name: "Blaise Diagne International Airport (fixture)",
    iata_code: "DSS",
    icao_code: "GOBD",
    iso_country: "SN",
    latitude_deg: 14.67,
    longitude_deg: -17.07,
    elevation_ft: 290,
    timezone: "Africa/Dakar",
  },
  {
    id: "mock-2",
    ident: "LFPG",
    name: "Charles de Gaulle Airport (fixture)",
    iata_code: "CDG",
    icao_code: "LFPG",
    iso_country: "FR",
    latitude_deg: 49.01,
    longitude_deg: 2.55,
    elevation_ft: 392,
    timezone: "Europe/Paris",
  },
  {
    // Ligne volontairement invalide pour tester le rejet en validation.
    id: "mock-3-invalid",
    ident: null,
    name: "",
    iata_code: null,
    icao_code: null,
    iso_country: null,
    latitude_deg: null,
    longitude_deg: null,
    elevation_ft: null,
    timezone: null,
  },
];

// ---------------------------------------------------------------------------
// 2. CONNECTOR.fetch() — simule l'appel réseau (aucun appel réel effectué)
// ---------------------------------------------------------------------------

export interface MockFetchResult {
  endpoint: string;
  retrievedAt: string;
  rows: OurAirportsMockRawRow[];
}

export async function fetchMock(): Promise<MockFetchResult> {
  return {
    endpoint: "mock://ourairports/airports.csv",
    retrievedAt: new Date().toISOString(),
    rows: MOCK_OURAIRPORTS_ROWS,
  };
}

// ---------------------------------------------------------------------------
// 3. RAW RECORD — conserve la ligne brute + un hash, avant toute transformation
// ---------------------------------------------------------------------------

export interface RawRecordLike {
  sourceId: "ourairports";
  endpoint: string;
  externalId: string;
  payload: OurAirportsMockRawRow;
  payloadHash: string;
  retrievedAt: string;
}

function hashPayload(payload: unknown): string {
  const text = JSON.stringify(payload);
  let hash = 2166136261;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16);
}

export function toRawRecords(fetchResult: MockFetchResult): RawRecordLike[] {
  return fetchResult.rows.map((row) => ({
    sourceId: "ourairports" as const,
    endpoint: fetchResult.endpoint,
    externalId: row.id,
    payload: row,
    payloadHash: hashPayload(row),
    retrievedAt: fetchResult.retrievedAt,
  }));
}

// ---------------------------------------------------------------------------
// 4. VALIDATION — une ligne sans identifiant/nom exploitable est rejetée,
//    jamais complétée avec une valeur inventée.
// ---------------------------------------------------------------------------

export interface ValidationOutcome {
  raw: RawRecordLike;
  valid: boolean;
  reason?: string;
}

export function validate(raw: RawRecordLike): ValidationOutcome {
  const row = raw.payload;
  if (!row.name || !row.name.trim()) {
    return { raw, valid: false, reason: "missing name" };
  }
  if (!row.iata_code && !row.icao_code && !row.ident) {
    return { raw, valid: false, reason: "no usable identifier (iata/icao/ident)" };
  }
  return { raw, valid: true };
}

// ---------------------------------------------------------------------------
// 5. NORMALIZATION — modèle fournisseur → modèle AeroLab (`Airport`)
// ---------------------------------------------------------------------------

export function normalize(raw: RawRecordLike): Airport {
  const row = raw.payload;
  return {
    id: `ourairports-${raw.externalId}`,
    iata: row.iata_code ?? undefined,
    icao: row.icao_code ?? row.ident ?? undefined,
    name: row.name ?? "unknown",
    countryId: row.iso_country ?? undefined,
    latitude: row.latitude_deg ?? undefined,
    longitude: row.longitude_deg ?? undefined,
    sourceId: "ourairports",
  };
}

// ---------------------------------------------------------------------------
// 6. ENTITY RESOLUTION — réutilise server/entityResolution.ts existant,
//    ne le redéfinit pas.
// ---------------------------------------------------------------------------

export function resolveAirportEntity(airport: Airport, knownEntities: EntityCandidate[]) {
  return resolveEntity(
    "airport",
    {
      externalId: airport.icao ?? airport.iata,
      identifier: airport.iata,
      name: airport.name,
      countryId: airport.countryId,
    },
    knownEntities,
  );
}

// ---------------------------------------------------------------------------
// 7. PERSIST (illustratif) — forme des lignes PostgreSQL/PostGIS visées,
//    n'écrit dans aucune base réelle (aucun DATABASE_URL_POSTGRES disponible).
// ---------------------------------------------------------------------------

export interface PersistPreview {
  rawRecordRow: { source_key: "ourairports"; endpoint: string; external_id: string; payload_hash: string };
  airportRow: Pick<Airport, "iata" | "icao" | "name" | "countryId" | "latitude" | "longitude">;
  entityResolution: ReturnType<typeof resolveAirportEntity>;
}

export function buildPersistPreview(raw: RawRecordLike, knownEntities: EntityCandidate[]): PersistPreview | null {
  const outcome = validate(raw);
  if (!outcome.valid) return null;
  const airport = normalize(raw);
  return {
    rawRecordRow: {
      source_key: "ourairports",
      endpoint: raw.endpoint,
      external_id: raw.externalId,
      payload_hash: raw.payloadHash,
    },
    airportRow: {
      iata: airport.iata,
      icao: airport.icao,
      name: airport.name,
      countryId: airport.countryId,
      latitude: airport.latitude,
      longitude: airport.longitude,
    },
    entityResolution: resolveAirportEntity(airport, knownEntities),
  };
}

// ---------------------------------------------------------------------------
// 8. PIPELINE COMPLET — pour test/démonstration uniquement
// ---------------------------------------------------------------------------

export interface PipelineRunResult {
  totalFetched: number;
  validated: number;
  rejected: { externalId: string; reason: string }[];
  observations: PersistPreview[];
}

export async function runOurAirportsMockPipeline(knownEntities: EntityCandidate[] = []): Promise<PipelineRunResult> {
  const fetchResult = await fetchMock();
  const rawRecords = toRawRecords(fetchResult);
  const rejected: { externalId: string; reason: string }[] = [];
  const observations: PersistPreview[] = [];

  for (const raw of rawRecords) {
    const outcome = validate(raw);
    if (!outcome.valid) {
      rejected.push({ externalId: raw.externalId, reason: outcome.reason ?? "unknown" });
      continue;
    }
    const preview = buildPersistPreview(raw, knownEntities);
    if (preview) observations.push(preview);
  }

  return {
    totalFetched: rawRecords.length,
    validated: observations.length,
    rejected,
    observations,
  };
}
