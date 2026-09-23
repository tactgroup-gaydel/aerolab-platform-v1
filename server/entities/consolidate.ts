/**
 * J4 — CONSOLIDATION EN GRAPHE (aéroports → entités canoniques)
 * =============================================================
 * Lit la table `airports` déjà peuplée et, pour chaque aéroport non encore
 * consolidé (entityId IS NULL) :
 *   1. résout ou crée l'ENTITÉ canonique (ordre déterministe ICAO > IATA > nom+pays) ;
 *   2. écrit ses IDENTIFIANTS (icao / iata / ourairports_id) — clé unique (scheme,value)
 *      qui permettra à d'autres sources de retrouver le même objet ;
 *   3. écrit une OBSERVATION de provenance (source, endpoint, externalId, hash payload) ;
 *   4. relie airports.entityId → l'entité.
 * Idempotent : ne traite que entityId IS NULL, et les identifiants sont en upsert no-op.
 */
import { and, eq, isNull, sql } from "drizzle-orm";
import { getDb, recordConnectorRun } from "../db";
import { airports, dataSources, entities, entityIdentifiers, sourceObservations } from "../../drizzle/schema";

function fnv1a(text: string): string {
  let hash = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16);
}

async function getOurAirportsSourceId(db: NonNullable<Awaited<ReturnType<typeof getDb>>>): Promise<number | null> {
  const rows = await db.select({ id: dataSources.id }).from(dataSources).where(eq(dataSources.sourceKey, "ourairports")).limit(1);
  return rows[0]?.id ?? null;
}

export async function ensureEntityTables(): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("DATABASE_URL manquante ou invalide.");
  await db.execute(sql`CREATE TABLE IF NOT EXISTS entities (
    id INT AUTO_INCREMENT PRIMARY KEY,
    type VARCHAR(40) NOT NULL,
    name VARCHAR(220) NOT NULL,
    countryCode VARCHAR(4),
    latitude VARCHAR(32),
    longitude VARCHAR(32),
    primarySourceId INT,
    primaryExternalId VARCHAR(220),
    createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  )`);
  await db.execute(sql`CREATE TABLE IF NOT EXISTS entityIdentifiers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    entityId INT NOT NULL,
    scheme VARCHAR(40) NOT NULL,
    value VARCHAR(220) NOT NULL,
    sourceId INT,
    createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY entity_identifiers_scheme_value_idx (scheme, value)
  )`);
  await db.execute(sql`ALTER TABLE airports ADD COLUMN IF NOT EXISTS entityId INT`);
}

async function findEntityId(
  db: NonNullable<Awaited<ReturnType<typeof getDb>>>,
  scheme: string,
  value: string | null,
): Promise<number | null> {
  if (!value) return null;
  const rows = await db
    .select({ entityId: entityIdentifiers.entityId })
    .from(entityIdentifiers)
    .where(and(eq(entityIdentifiers.scheme, scheme), eq(entityIdentifiers.value, value)))
    .limit(1);
  return rows[0]?.entityId ?? null;
}

export interface ConsolidateResult {
  scanned: number;
  entitiesCreated: number;
  identifiers: number;
  observations: number;
  linked: number;
  durationMs: number;
}

export async function consolidateAirportEntities(
  opts: { limit?: number; countryCode?: string } = {},
): Promise<ConsolidateResult> {
  const db = await getDb();
  if (!db) throw new Error("DATABASE_URL manquante ou invalide.");
  await ensureEntityTables();

  const started = Date.now();
  const sourceId = await getOurAirportsSourceId(db);
  const limit = opts.limit && opts.limit > 0 ? opts.limit : Number.POSITIVE_INFINITY;
  const country = opts.countryCode?.trim().toUpperCase() || undefined;
  const BATCH = 300;

  let scanned = 0;
  let created = 0;
  let idents = 0;
  let obs = 0;
  let linked = 0;

  while (scanned < limit) {
    const take = Math.min(BATCH, limit - scanned);
    const conds = [isNull(airports.entityId)];
    if (country) conds.push(eq(airports.countryCode, country));
    const rows = await db.select().from(airports).where(and(...conds)).limit(take);
    if (rows.length === 0) break;

    for (const row of rows) {
      scanned += 1;
      const icao = (row.icao || "").trim().toUpperCase() || null;
      const iata = (row.iata || "").trim().toUpperCase() || null;
      const cc = (row.countryCode || "").trim().toUpperCase() || null;

      let entityId = (await findEntityId(db, "icao", icao)) ?? (await findEntityId(db, "iata", iata));
      if (!entityId && cc) {
        const m = await db
          .select({ id: entities.id })
          .from(entities)
          .where(and(eq(entities.type, "airport"), eq(entities.name, row.name), eq(entities.countryCode, cc)))
          .limit(1);
        entityId = m[0]?.id ?? null;
      }
      if (!entityId) {
        const ins = await db.insert(entities).values({
          type: "airport",
          name: row.name,
          countryCode: cc,
          latitude: row.latitude ?? null,
          longitude: row.longitude ?? null,
          primarySourceId: sourceId ?? null,
          primaryExternalId: row.externalId,
        });
        entityId = Number(ins[0].insertId);
        created += 1;
      }

      const pairs: [string, string | null][] = [
        ["icao", icao],
        ["iata", iata],
        ["ourairports_id", row.externalId],
      ];
      for (const [scheme, value] of pairs) {
        if (!value) continue;
        await db
          .insert(entityIdentifiers)
          .values({ entityId, scheme, value, sourceId: sourceId ?? null })
          .onDuplicateKeyUpdate({ set: { entityId: sql`entityId` } });
        idents += 1;
      }

      await db.insert(sourceObservations).values({
        sourceId: sourceId ?? 0,
        sourceEndpoint: "ourairports:airports",
        externalId: row.externalId,
        rawPayloadHash: fnv1a(JSON.stringify(row)),
        quality: "VALID",
      });
      obs += 1;

      await db.update(airports).set({ entityId }).where(eq(airports.id, row.id));
      linked += 1;
    }
  }

  const durationMs = Date.now() - started;
  await recordConnectorRun({
    connectorId: "entities-consolidation",
    endpoint: "internal:airports",
    status: "SUCCESS",
    recordCount: linked,
    latencyMs: durationMs,
    freshnessStatus: "VALID",
  });
  return { scanned, entitiesCreated: created, identifiers: idents, observations: obs, linked, durationMs };
}
