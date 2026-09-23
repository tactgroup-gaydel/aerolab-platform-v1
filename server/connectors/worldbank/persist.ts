import { eq, sql } from "drizzle-orm";
import { getDb, recordConnectorRun } from "../../db";
import { countryIndicators, dataSources } from "../../../drizzle/schema";
import { sourceRegistry } from "../registry";
import { runWorldBankIngestion, WORLD_BANK_LPI_OVERALL, WORLD_BANK_API_BASE } from "./index";

async function ensureDataSourceRow(): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Aucune connexion base de données (DATABASE_URL manquante ou invalide).");
  const existing = await db.select().from(dataSources).where(eq(dataSources.sourceKey, "worldbank")).limit(1);
  if (existing.length > 0) return existing[0].id;
  const def = sourceRegistry.find((s) => s.id === "worldbank");
  if (!def) throw new Error("Source 'worldbank' introuvable dans le registre.");
  const inserted = await db.insert(dataSources).values({
    sourceKey: def.id, name: def.name, priority: def.priority, status: def.status,
    licenseStatus: def.license.licenseStatus, commercialUse: def.license.commercialUse,
    redistributionAllowed: def.license.redistributionAllowed,
    attributionRequired: def.license.attributionRequired ? "yes" : "no", notes: def.license.notes,
  });
  return Number(inserted[0].insertId);
}

async function ensureTable(): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Connexion base de données perdue.");
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS countryIndicators (
      id INT AUTO_INCREMENT PRIMARY KEY,
      sourceId INT NOT NULL,
      indicatorCode VARCHAR(64) NOT NULL,
      indicatorName VARCHAR(240),
      countryCode VARCHAR(4) NOT NULL,
      countryIso3 VARCHAR(8),
      countryName VARCHAR(200),
      value VARCHAR(64),
      year VARCHAR(8),
      unit VARCHAR(80),
      retrievedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY country_indicators_source_indicator_country_idx (sourceId, indicatorCode, countryCode)
    )
  `);
}

export interface WorldBankPersistResult {
  indicator: string;
  total: number;
  upserted: number;
  durationMs: number;
}

/** Réutilisable : utilisé par le script CLI (persistLive.ts) et la route dev d'amorçage. */
export async function persistWorldBankIndicator(
  indicatorCode: string = WORLD_BANK_LPI_OVERALL,
): Promise<WorldBankPersistResult> {
  const started = Date.now();
  const dbSourceId = await ensureDataSourceRow();
  await ensureTable();
  const ingestion = await runWorldBankIngestion(indicatorCode);
  const db = await getDb();
  if (!db) throw new Error("Connexion base de données perdue après vérification.");
  const batch = ingestion.records.map((r) => ({
    sourceId: dbSourceId, indicatorCode: r.indicatorCode, indicatorName: r.indicatorName ?? null,
    countryCode: r.countryCode, countryIso3: r.countryIso3 ?? null, countryName: r.countryName ?? null,
    value: String(r.value), year: r.year ?? null, unit: "LPI (1-5)", retrievedAt: new Date(ingestion.retrievedAt),
  }));
  let upserted = 0;
  if (batch.length > 0) {
    await db.insert(countryIndicators).values(batch).onDuplicateKeyUpdate({
      set: {
        indicatorName: sql`VALUES(${countryIndicators.indicatorName})`,
        countryIso3: sql`VALUES(${countryIndicators.countryIso3})`,
        countryName: sql`VALUES(${countryIndicators.countryName})`,
        value: sql`VALUES(${countryIndicators.value})`,
        year: sql`VALUES(${countryIndicators.year})`,
        unit: sql`VALUES(${countryIndicators.unit})`,
        retrievedAt: sql`VALUES(${countryIndicators.retrievedAt})`,
      },
    });
    upserted = batch.length;
  }
  const durationMs = Date.now() - started;
  await recordConnectorRun({
    connectorId: "worldbank", endpoint: ingestion.endpoint || WORLD_BANK_API_BASE,
    status: "SUCCESS", recordCount: upserted, latencyMs: durationMs, freshnessStatus: "VALID",
  });
  return { indicator: indicatorCode, total: ingestion.totalRecords, upserted, durationMs };
}
