/**
 * PERSISTANCE RÉELLE — WORLD BANK → MYSQL
 * =========================================
 *
 * Vrai appel réseau vers l'API World Bank ET vraie écriture dans MySQL
 * (via DATABASE_URL). Ce n'est PAS un test automatique.
 *
 * Lancer manuellement (sur une machine qui atteint TiDB, ex. macOS) :
 *   pnpm tsx server/connectors/worldbank/persistLive.ts
 *   pnpm tsx server/connectors/worldbank/persistLive.ts --indicator=LP.LPI.OVRL.XQ
 *
 * Comportement :
 *  1. Vérifie/crée la ligne `dataSources` pour "worldbank" (depuis le registre).
 *  2. Crée la table `countryIndicators` si elle n'existe pas (ajout pur).
 *  3. Fetch réel + validation + normalisation (réutilise index.ts).
 *  4. Upsert sur (sourceId, indicatorCode, countryCode) — pas de doublon.
 *  5. Provenance via recordConnectorRun.
 */

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
  if (!def) throw new Error("Source 'worldbank' introuvable dans server/connectors/registry.ts.");

  const inserted = await db.insert(dataSources).values({
    sourceKey: def.id,
    name: def.name,
    priority: def.priority,
    status: def.status,
    licenseStatus: def.license.licenseStatus,
    commercialUse: def.license.commercialUse,
    redistributionAllowed: def.license.redistributionAllowed,
    attributionRequired: def.license.attributionRequired ? "yes" : "no",
    notes: def.license.notes,
  });
  return Number(inserted[0].insertId);
}

async function ensureTable(): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Connexion base de données perdue.");
  // Ajout pur : crée la table seulement si absente, sans toucher à l'existant.
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

function parseArgs() {
  const arg = process.argv.slice(2).find((a) => a.startsWith("--indicator="));
  return { indicator: arg ? arg.split("=")[1] : WORLD_BANK_LPI_OVERALL };
}

async function main() {
  const { indicator } = parseArgs();
  console.log("=== AeroLab — Persistance réelle World Bank → MySQL ===");
  console.log(`Indicateur : ${indicator}`);

  const dbSourceId = await ensureDataSourceRow();
  console.log(`Ligne dataSources 'worldbank' → id=${dbSourceId}`);
  await ensureTable();

  const started = Date.now();
  const ingestion = await runWorldBankIngestion(indicator);

  const db = await getDb();
  if (!db) throw new Error("Connexion base de données perdue après vérification.");

  let upserted = 0;
  const batch = ingestion.records.map((r) => ({
    sourceId: dbSourceId,
    indicatorCode: r.indicatorCode,
    indicatorName: r.indicatorName ?? null,
    countryCode: r.countryCode,
    countryIso3: r.countryIso3 ?? null,
    countryName: r.countryName ?? null,
    value: String(r.value),
    year: r.year ?? null,
    unit: "LPI (1-5)",
    retrievedAt: new Date(ingestion.retrievedAt),
  }));

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
    connectorId: "worldbank",
    endpoint: ingestion.endpoint || WORLD_BANK_API_BASE,
    status: "SUCCESS",
    recordCount: upserted,
    latencyMs: durationMs,
    freshnessStatus: "VALID",
  });

  console.log(`\nTerminé en ${durationMs} ms`);
  console.log("Enregistrements insérés/mis à jour :", upserted);
  console.log("Relancez avec la même commande pour vérifier l'absence de doublon (même total).");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Échec de la persistance World Bank :", error);
    process.exit(1);
  });
