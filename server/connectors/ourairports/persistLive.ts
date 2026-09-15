/**
 * PERSISTANCE RÉELLE — OURAIRPORTS → MYSQL
 * ===========================================
 *
 * Ce script fait un VRAI appel réseau vers OurAirports ET une VRAIE écriture
 * dans votre base MySQL (via DATABASE_URL). Ce n'est PAS un test automatique
 * (jamais exécuté par `pnpm test`).
 *
 * Lancer manuellement :
 *   pnpm tsx server/connectors/ourairports/persistLive.ts
 *   pnpm tsx server/connectors/ourairports/persistLive.ts --limit=25   (par défaut)
 *   pnpm tsx server/connectors/ourairports/persistLive.ts --all        (les 86 000+ lignes valides)
 *
 * Comportement :
 *  1. Vérifie/crée la ligne `dataSources` pour "ourairports" (à partir du
 *     registre existant, aucune donnée inventée).
 *  2. Fetch réel + validation + normalisation (réutilise index.ts tel quel).
 *  3. Insère par lots de 500 dans la table `airports`, avec
 *     ON DUPLICATE KEY UPDATE sur (sourceId, externalId) — une réingestion
 *     ne crée jamais de doublon, elle met à jour la ligne existante.
 *  4. Enregistre la provenance via `recordConnectorRun` (déjà existant).
 *
 * Par défaut, LIMITE À 25 lignes — volontairement, pour que le premier test
 * sur votre vraie base reste petit et facile à vérifier avant un import
 * complet. Passez --all pour l'import complet une fois le petit test validé.
 */

import { eq, sql } from "drizzle-orm";
import { getDb, recordConnectorRun } from "../../db";
import { airports, dataSources } from "../../../drizzle/schema";
import { sourceRegistry } from "../registry";
import { fetchOurAirportsLive, toRawRecords, validate, normalize, OURAIRPORTS_SOURCE_URL } from "./index";

const BATCH_SIZE = 500;

async function ensureDataSourceRow(): Promise<number> {
  const db = await getDb();
  if (!db) {
    throw new Error("Aucune connexion base de données disponible (DATABASE_URL manquante ou invalide).");
  }

  const existing = await db.select().from(dataSources).where(eq(dataSources.sourceKey, "ourairports")).limit(1);
  if (existing.length > 0) {
    return existing[0].id;
  }

  const definition = sourceRegistry.find((s) => s.id === "ourairports");
  if (!definition) {
    throw new Error("Source 'ourairports' introuvable dans server/connectors/registry.ts — incohérence à corriger avant de continuer.");
  }

  const inserted = await db.insert(dataSources).values({
    sourceKey: definition.id,
    name: definition.name,
    priority: definition.priority,
    status: definition.status,
    licenseStatus: definition.license.licenseStatus,
    commercialUse: definition.license.commercialUse,
    redistributionAllowed: definition.license.redistributionAllowed,
    attributionRequired: definition.license.attributionRequired ? "yes" : "no",
    notes: definition.license.notes,
  });
  return Number(inserted[0].insertId);
}

function parseArgs() {
  const args = process.argv.slice(2);
  if (args.includes("--all")) return { limit: Infinity };
  const limitArg = args.find((a) => a.startsWith("--limit="));
  const limit = limitArg ? Number(limitArg.split("=")[1]) : 25;
  return { limit: Number.isFinite(limit) && limit > 0 ? limit : 25 };
}

async function main() {
  const { limit } = parseArgs();
  console.log("=== AeroLab — Persistance réelle OurAirports → MySQL ===");
  console.log(`Limite pour ce run : ${limit === Infinity ? "AUCUNE (import complet)" : limit}`);

  const dbSourceId = await ensureDataSourceRow();
  console.log(`Ligne dataSources 'ourairports' → id=${dbSourceId}`);

  const started = Date.now();
  const fetchResult = await fetchOurAirportsLive();
  const rawRecords = toRawRecords(fetchResult);

  const db = await getDb();
  if (!db) throw new Error("Connexion base de données perdue après la première vérification.");

  let validCount = 0;
  let rejectedCount = 0;
  let insertedOrUpdated = 0;
  let batch: (typeof airports.$inferInsert)[] = [];

  async function flushBatch() {
    if (batch.length === 0) return;
    // VALUES(col) référence la valeur qui aurait été insérée pour CETTE ligne
    // précise — nécessaire ici car il s'agit d'un insert multi-lignes (contrairement
    // à upsertUser() dans server/db.ts qui insère une seule ligne à la fois).
    await db!.insert(airports).values(batch).onDuplicateKeyUpdate({
      set: {
        name: sql`VALUES(${airports.name})`,
        iata: sql`VALUES(${airports.iata})`,
        icao: sql`VALUES(${airports.icao})`,
        countryCode: sql`VALUES(${airports.countryCode})`,
        latitude: sql`VALUES(${airports.latitude})`,
        longitude: sql`VALUES(${airports.longitude})`,
        retrievedAt: sql`VALUES(${airports.retrievedAt})`,
      },
    });
    insertedOrUpdated += batch.length;
    batch = [];
  }

  for (const raw of rawRecords) {
    if (validCount >= limit) break;
    const outcome = validate(raw);
    if (!outcome.valid) {
      rejectedCount += 1;
      continue;
    }
    const airport = normalize(raw);
    validCount += 1;
    batch.push({
      sourceId: dbSourceId,
      externalId: raw.externalId,
      name: airport.name,
      iata: airport.iata ?? null,
      icao: airport.icao ?? null,
      countryCode: airport.countryId ?? null, // countryId ici = code ISO brut (voir normalize() dans index.ts)
      latitude: airport.latitude !== undefined ? String(airport.latitude) : null,
      longitude: airport.longitude !== undefined ? String(airport.longitude) : null,
      retrievedAt: new Date(fetchResult.retrievedAt),
    });
    if (batch.length >= BATCH_SIZE) {
      await flushBatch();
    }
  }
  await flushBatch();

  const durationMs = Date.now() - started;

  await recordConnectorRun({
    connectorId: "ourairports",
    endpoint: OURAIRPORTS_SOURCE_URL,
    status: "SUCCESS",
    recordCount: insertedOrUpdated,
    latencyMs: durationMs,
    validationFailureCount: rejectedCount,
    freshnessStatus: "VALID",
  });

  console.log(`\nTerminé en ${durationMs} ms`);
  console.log("Lignes valides traitées :", validCount);
  console.log("Lignes rejetées (non comptées dans la limite) :", rejectedCount);
  console.log("Lignes insérées/mises à jour dans `airports` :", insertedOrUpdated);
  console.log("\nProvenance enregistrée dans `connectorRuns` (connectorId='ourairports').");
  console.log("Relancez ce script une seconde fois avec la même limite pour vérifier qu'aucun doublon n'est créé (même nombre de lignes dans `airports`).");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Échec de la persistance OurAirports :", error);
    process.exit(1);
  });
