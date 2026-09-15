/**
 * AEROLAB — CONNECTEUR OURAIRPORTS RÉEL (LIVE)
 * ==============================================
 *
 * Source vérifiée avant écriture de ce fichier (recherche web, pas
 * d'invention d'endpoint) :
 *   - Page officielle : https://ourairports.com/data/
 *   - Fichier utilisé ici : https://davidmegginson.github.io/ourairports-data/airports.csv
 *     (miroir GitHub maintenu par David Megginson, créateur d'OurAirports,
 *     régénéré quotidiennement à partir des mêmes données que le site officiel)
 *   - Licence : Domaine public (déclaration officielle OurAirports :
 *     "All data is released to the Public Domain") ; le miroir GitHub est
 *     sous licence Unlicense. Usage commercial et redistribution autorisés,
 *     aucune attribution légalement requise (mais restée present dans nos
 *     notes de registre par courtoisie).
 *   - Aucune clé API requise, aucune authentification.
 *
 * Ce module NE modifie PAS le statut `prepared` du connecteur dans
 * `server/connectors/registry.ts`. Le passage à `active` reste une décision
 * humaine explicite, après confirmation qu'une ingestion réelle a
 * fonctionné (voir liveCheck.ts).
 *
 * Ce module N'ÉCRIT DANS AUCUNE BASE DE DONNÉES. Il fait uniquement :
 * fetch → parse CSV → validation → normalisation → résolution d'entité.
 * La persistance réelle (quelle table, quelle migration) reste une décision
 * à prendre séparément — voir le commentaire en bas de fichier.
 *
 * Le parseur CSV lit la ligne d'en-tête réelle du fichier et mappe les
 * colonnes PAR NOM, plutôt que de supposer un ordre de colonnes fixe —
 * pour ne jamais présumer d'une structure non vérifiée.
 */

import type { Airport } from "@shared/dataEngine";
import { resolveEntity, type EntityCandidate } from "../../entityResolution";

export const OURAIRPORTS_SOURCE_URL =
  process.env.OURAIRPORTS_DATA_URL?.trim() || "https://davidmegginson.github.io/ourairports-data/airports.csv";

// ---------------------------------------------------------------------------
// 1. FETCH — vrai appel réseau
// ---------------------------------------------------------------------------

export interface OurAirportsFetchResult {
  endpoint: string;
  retrievedAt: string;
  rawCsv: string;
}

export async function fetchOurAirportsLive(): Promise<OurAirportsFetchResult> {
  const response = await fetch(OURAIRPORTS_SOURCE_URL);
  if (!response.ok) {
    throw new Error(`OurAirports fetch failed: HTTP ${response.status} ${response.statusText}`);
  }
  const rawCsv = await response.text();
  return {
    endpoint: OURAIRPORTS_SOURCE_URL,
    retrievedAt: new Date().toISOString(),
    rawCsv,
  };
}

// ---------------------------------------------------------------------------
// 2. PARSE CSV — par nom de colonne, jamais par position supposée
// ---------------------------------------------------------------------------

/** Découpe une ligne CSV en respectant les champs entre guillemets (avec "" comme guillemet échappé). */
export function parseCsvLine(line: string): string[] {
  const fields: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (inQuotes) {
      if (char === '"') {
        if (line[i + 1] === '"') {
          current += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        current += char;
      }
    } else if (char === '"') {
      inQuotes = true;
    } else if (char === ",") {
      fields.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  fields.push(current);
  return fields;
}

export type OurAirportsRow = Record<string, string>;

export function parseOurAirportsCsv(rawCsv: string): OurAirportsRow[] {
  const lines = rawCsv.split(/\r?\n/).filter((line) => line.length > 0);
  if (lines.length === 0) return [];
  const headers = parseCsvLine(lines[0]).map((h) => h.trim());
  const rows: OurAirportsRow[] = [];
  for (let i = 1; i < lines.length; i += 1) {
    const values = parseCsvLine(lines[i]);
    const row: OurAirportsRow = {};
    headers.forEach((header, index) => {
      row[header] = (values[index] ?? "").trim();
    });
    rows.push(row);
  }
  return rows;
}

// ---------------------------------------------------------------------------
// 3. RAW RECORD — conserve la ligne brute + un hash, avant transformation
// ---------------------------------------------------------------------------

export interface OurAirportsRawRecord {
  sourceId: "ourairports";
  endpoint: string;
  externalId: string;
  payload: OurAirportsRow;
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

export function toRawRecords(fetchResult: OurAirportsFetchResult): OurAirportsRawRecord[] {
  const rows = parseOurAirportsCsv(fetchResult.rawCsv);
  return rows.map((row) => ({
    sourceId: "ourairports" as const,
    endpoint: fetchResult.endpoint,
    externalId: row.id || row.ident || "unknown",
    payload: row,
    payloadHash: hashPayload(row),
    retrievedAt: fetchResult.retrievedAt,
  }));
}

// ---------------------------------------------------------------------------
// 4. VALIDATION — rejette plutôt que d'inventer
// ---------------------------------------------------------------------------

export interface ValidationOutcome {
  raw: OurAirportsRawRecord;
  valid: boolean;
  reason?: string;
}

export function validate(raw: OurAirportsRawRecord): ValidationOutcome {
  const row = raw.payload;
  const name = row.name?.trim();
  if (!name) {
    return { raw, valid: false, reason: "missing name" };
  }
  // Un identifiant exploitable : iata_code, icao_code (si présent dans le
  // fichier), gps_code (souvent égal à l'ICAO), ou à défaut l'ident interne.
  const hasIdentifier = Boolean(row.iata_code || row.icao_code || row.gps_code || row.ident);
  if (!hasIdentifier) {
    return { raw, valid: false, reason: "no usable identifier (iata_code/icao_code/gps_code/ident)" };
  }
  return { raw, valid: true };
}

// ---------------------------------------------------------------------------
// 5. NORMALIZATION — modèle fournisseur (colonnes réelles) → modèle AeroLab
// ---------------------------------------------------------------------------

export function normalize(raw: OurAirportsRawRecord): Airport {
  const row = raw.payload;
  const latitude = row.latitude_deg ? Number(row.latitude_deg) : undefined;
  const longitude = row.longitude_deg ? Number(row.longitude_deg) : undefined;
  return {
    id: `ourairports-${raw.externalId}`,
    iata: row.iata_code || undefined,
    icao: row.icao_code || row.gps_code || row.ident || undefined,
    name: row.name,
    countryId: row.iso_country || undefined,
    latitude: Number.isFinite(latitude) ? latitude : undefined,
    longitude: Number.isFinite(longitude) ? longitude : undefined,
    sourceId: "ourairports",
  };
}

// ---------------------------------------------------------------------------
// 6. ENTITY RESOLUTION — réutilise server/entityResolution.ts existant
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
// 7. PIPELINE COMPLET (sans persistance) — fetch réel → observations normalisées
// ---------------------------------------------------------------------------

export interface LiveIngestionResult {
  endpoint: string;
  retrievedAt: string;
  totalRows: number;
  validCount: number;
  rejectedCount: number;
  rejectedSamples: { externalId: string; reason: string }[];
  airports: Airport[];
}

/**
 * Exécute fetch → parse → validation → normalisation sur les données réelles.
 * N'écrit rien en base. `limit` restreint le nombre de lignes VALIDÉES
 * retournées dans `airports` (le fichier complet fait ~80 000 lignes) —
 * les compteurs (totalRows, validCount, rejectedCount) portent eux sur
 * l'intégralité du fichier, pas seulement l'échantillon retourné.
 */
export async function runOurAirportsLiveIngestion(limit = 20): Promise<LiveIngestionResult> {
  const fetchResult = await fetchOurAirportsLive();
  const rawRecords = toRawRecords(fetchResult);

  let validCount = 0;
  let rejectedCount = 0;
  const rejectedSamples: { externalId: string; reason: string }[] = [];
  const airports: Airport[] = [];

  for (const raw of rawRecords) {
    const outcome = validate(raw);
    if (!outcome.valid) {
      rejectedCount += 1;
      if (rejectedSamples.length < 5) {
        rejectedSamples.push({ externalId: raw.externalId, reason: outcome.reason ?? "unknown" });
      }
      continue;
    }
    validCount += 1;
    if (airports.length < limit) {
      airports.push(normalize(raw));
    }
  }

  return {
    endpoint: fetchResult.endpoint,
    retrievedAt: fetchResult.retrievedAt,
    totalRows: rawRecords.length,
    validCount,
    rejectedCount,
    rejectedSamples,
    airports,
  };
}

/**
 * PERSISTANCE — décision non prise dans ce fichier.
 *
 * La base MySQL réelle n'a actuellement AUCUNE table dédiée aux aéroports
 * (vérifié dans drizzle/schema.ts : countries, sectors, markets,
 * infrastructures, sources, indicators, articles, analyses, projects,
 * actRequests, dataSources, sourceObservations, mobilityObservations,
 * connectorRuns — pas de table `airports`). Deux options existent :
 *   (a) créer une nouvelle table `airports` + migration Drizzle dédiée ;
 *   (b) réutiliser `mobilityObservations`/`sourceObservations` en générique.
 * Ce choix a un impact réel sur la base de production — il n'est pas pris
 * ici et doit être validé explicitement avant toute migration.
 */
