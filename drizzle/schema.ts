import { int, mysqlEnum, mysqlTable, text, timestamp, uniqueIndex, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export const countries = mysqlTable("countries", {
  id: int("id").autoincrement().primaryKey(),
  isoCode: varchar("isoCode", { length: 3 }).notNull().unique(),
  slug: varchar("slug", { length: 120 }).notNull().unique(),
  nameFr: varchar("nameFr", { length: 160 }).notNull(),
  nameEn: varchar("nameEn", { length: 160 }).notNull(),
  descriptionFr: text("descriptionFr"),
  descriptionEn: text("descriptionEn"),
  status: mysqlEnum("status", ["DRAFT", "PUBLISHED"]).default("PUBLISHED").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const sectors = mysqlTable("sectors", {
  id: int("id").autoincrement().primaryKey(),
  slug: varchar("slug", { length: 120 }).notNull().unique(),
  nameFr: varchar("nameFr", { length: 160 }).notNull(),
  nameEn: varchar("nameEn", { length: 160 }).notNull(),
  descriptionFr: text("descriptionFr"),
  descriptionEn: text("descriptionEn"),
});

export const markets = mysqlTable("markets", {
  id: int("id").autoincrement().primaryKey(),
  slug: varchar("slug", { length: 140 }).notNull().unique(),
  nameFr: varchar("nameFr", { length: 200 }).notNull(),
  nameEn: varchar("nameEn", { length: 200 }).notNull(),
  countryId: int("countryId"),
  sectorId: int("sectorId"),
});

export const infrastructures = mysqlTable("infrastructures", {
  id: int("id").autoincrement().primaryKey(),
  slug: varchar("slug", { length: 140 }).notNull().unique(),
  name: varchar("name", { length: 220 }).notNull(),
  type: varchar("type", { length: 120 }).notNull(),
  countryId: int("countryId"),
  city: varchar("city", { length: 160 }),
  latitude: varchar("latitude", { length: 32 }),
  longitude: varchar("longitude", { length: 32 }),
});

export const sources = mysqlTable("sources", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 220 }).notNull(),
  publisher: varchar("publisher", { length: 220 }),
  url: text("url"),
  publicationDate: timestamp("publicationDate"),
  accessedAt: timestamp("accessedAt"),
  methodology: text("methodology"),
});

export const indicators = mysqlTable("indicators", {
  id: int("id").autoincrement().primaryKey(),
  slug: varchar("slug", { length: 160 }).notNull().unique(),
  nameFr: varchar("nameFr", { length: 240 }).notNull(),
  nameEn: varchar("nameEn", { length: 240 }).notNull(),
  valueNumeric: varchar("valueNumeric", { length: 80 }),
  valueText: text("valueText"),
  unit: varchar("unit", { length: 80 }),
  period: varchar("period", { length: 80 }),
  territory: varchar("territory", { length: 180 }),
  countryId: int("countryId"),
  sectorId: int("sectorId"),
  sourceId: int("sourceId"),
  methodologyFr: text("methodologyFr"),
  methodologyEn: text("methodologyEn"),
  status: mysqlEnum("status", ["INGESTED", "VALIDATED", "NORMALIZED", "PUBLISHED"]).default("INGESTED").notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const articles = mysqlTable("articles", {
  id: int("id").autoincrement().primaryKey(),
  slug: varchar("slug", { length: 180 }).notNull().unique(),
  titleFr: varchar("titleFr", { length: 260 }).notNull(),
  titleEn: varchar("titleEn", { length: 260 }).notNull(),
  excerptFr: text("excerptFr"),
  excerptEn: text("excerptEn"),
  bodyFr: text("bodyFr"),
  bodyEn: text("bodyEn"),
  category: varchar("category", { length: 100 }),
  sectorId: int("sectorId"),
  countryId: int("countryId"),
  publishedAt: timestamp("publishedAt"),
  status: mysqlEnum("status", ["DRAFT", "REVIEW", "VALIDATED", "PUBLISHED"]).default("DRAFT").notNull(),
});

export const analyses = mysqlTable("analyses", {
  id: int("id").autoincrement().primaryKey(),
  slug: varchar("slug", { length: 180 }).notNull().unique(),
  titleFr: varchar("titleFr", { length: 260 }).notNull(),
  titleEn: varchar("titleEn", { length: 260 }).notNull(),
  summaryFr: text("summaryFr"),
  summaryEn: text("summaryEn"),
  bodyFr: text("bodyFr"),
  bodyEn: text("bodyEn"),
  countryId: int("countryId"),
  sectorId: int("sectorId"),
  publishedAt: timestamp("publishedAt"),
  status: mysqlEnum("status", ["DRAFT", "REVIEW", "VALIDATED", "PUBLISHED"]).default("DRAFT").notNull(),
});

export const projects = mysqlTable("projects", {
  id: int("id").autoincrement().primaryKey(),
  slug: varchar("slug", { length: 180 }).notNull().unique(),
  titleFr: varchar("titleFr", { length: 260 }).notNull(),
  titleEn: varchar("titleEn", { length: 260 }).notNull(),
  countryId: int("countryId"),
  sectorId: int("sectorId"),
  contextFr: text("contextFr"),
  contextEn: text("contextEn"),
  interventionFr: text("interventionFr"),
  interventionEn: text("interventionEn"),
  deliverablesFr: text("deliverablesFr"),
  deliverablesEn: text("deliverablesEn"),
  status: mysqlEnum("status", ["DRAFT", "REVIEW", "VALIDATED", "PUBLISHED"]).default("DRAFT").notNull(),
});

export const actRequests = mysqlTable("actRequests", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 180 }).notNull(),
  organization: varchar("organization", { length: 220 }).notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  country: varchar("country", { length: 180 }).notNull(),
  sector: varchar("sector", { length: 160 }).notNull(),
  description: text("description").notNull(),
  status: mysqlEnum("status", ["RECEIVED", "QUALIFYING", "QUALIFIED", "CLOSED"]).default("RECEIVED").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Country = typeof countries.$inferSelect;
export type Sector = typeof sectors.$inferSelect;
export type Indicator = typeof indicators.$inferSelect;
export type Article = typeof articles.$inferSelect;
export type Analysis = typeof analyses.$inferSelect;
export type Project = typeof projects.$inferSelect;
export type ActRequest = typeof actRequests.$inferSelect;

/** Phase 2 Data Engine registry. The current project remains on its existing SQL stack while these tables preserve a PostgreSQL/PostGIS-ready vocabulary. */
export const dataSources = mysqlTable("dataSources", {
  id: int("id").autoincrement().primaryKey(),
  sourceKey: varchar("sourceKey", { length: 120 }).notNull().unique(),
  name: varchar("name", { length: 220 }).notNull(),
  priority: mysqlEnum("priority", ["A", "B", "C"]).notNull(),
  status: mysqlEnum("status", ["active", "prepared", "disabled"]).default("prepared").notNull(),
  licenseStatus: varchar("licenseStatus", { length: 180 }).notNull(),
  commercialUse: varchar("commercialUse", { length: 40 }).notNull(),
  redistributionAllowed: varchar("redistributionAllowed", { length: 40 }).notNull(),
  attributionRequired: mysqlEnum("attributionRequired", ["yes", "no"]).default("yes").notNull(),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const sourceObservations = mysqlTable("sourceObservations", {
  id: int("id").autoincrement().primaryKey(),
  sourceId: int("sourceId").notNull(),
  sourceEndpoint: varchar("sourceEndpoint", { length: 360 }).notNull(),
  externalId: varchar("externalId", { length: 220 }),
  rawPayloadHash: varchar("rawPayloadHash", { length: 80 }),
  rawPayloadRef: text("rawPayloadRef"),
  retrievedAt: timestamp("retrievedAt").defaultNow().notNull(),
  observedAt: timestamp("observedAt"),
  quality: mysqlEnum("quality", ["VALID", "STALE", "INVALID", "ERROR"]).default("VALID").notNull(),
  errorState: text("errorState"),
});

export const mobilityObservations = mysqlTable("mobilityObservations", {
  id: int("id").autoincrement().primaryKey(),
  observationKey: varchar("observationKey", { length: 220 }).notNull().unique(),
  domain: mysqlEnum("domain", ["aviation", "maritime", "rail", "road", "logistics"]).notNull(),
  type: varchar("type", { length: 120 }).notNull(),
  status: varchar("status", { length: 120 }).notNull(),
  severity: mysqlEnum("severity", ["low", "medium", "high", "critical"]),
  countryId: int("countryId"),
  infrastructureId: int("infrastructureId"),
  latitude: varchar("latitude", { length: 32 }),
  longitude: varchar("longitude", { length: 32 }),
  observedAt: timestamp("observedAt"),
  retrievedAt: timestamp("retrievedAt").defaultNow().notNull(),
  freshnessStatus: mysqlEnum("freshnessStatus", ["VALID", "STALE", "INVALID", "ERROR"]).default("VALID").notNull(),
  sourceId: int("sourceId"),
  sourceEndpoint: varchar("sourceEndpoint", { length: 360 }),
  externalId: varchar("externalId", { length: 220 }),
  rawPayloadHash: varchar("rawPayloadHash", { length: 80 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const connectorRuns = mysqlTable("connectorRuns", {
  id: int("id").autoincrement().primaryKey(),
  connectorId: varchar("connectorId", { length: 120 }).notNull(),
  endpoint: varchar("endpoint", { length: 360 }).notNull(),
  status: mysqlEnum("status", ["SUCCESS", "DEGRADED", "ERROR"]).notNull(),
  requestStartedAt: timestamp("requestStartedAt").defaultNow().notNull(),
  requestFinishedAt: timestamp("requestFinishedAt"),
  latencyMs: int("latencyMs"),
  recordCount: int("recordCount").default(0).notNull(),
  validationFailureCount: int("validationFailureCount").default(0).notNull(),
  freshnessStatus: mysqlEnum("freshnessStatus", ["VALID", "STALE", "INVALID", "ERROR"]).notNull(),
  errorState: text("errorState"),
});

export type DataSource = typeof dataSources.$inferSelect;
export type SourceObservation = typeof sourceObservations.$inferSelect;
export type MobilityObservationRow = typeof mobilityObservations.$inferSelect;
export type ConnectorRun = typeof connectorRuns.$inferSelect;

/**
 * AJOUT — Phase 4 (OurAirports LIVE), table dédiée aux enregistrements
 * d'aéroports normalisés en provenance des connecteurs de référence
 * (OurAirports en premier). Ne remplace ni ne modifie aucune table
 * existante — ajout pur.
 *
 * Clé naturelle : (sourceId, externalId) — l'externalId est l'identifiant
 * interne du fournisseur (ex: le champ "id" d'OurAirports), stable dans le
 * temps. Cette contrainte unique permet un ON DUPLICATE KEY UPDATE lors
 * d'une réingestion, pour ne jamais dupliquer un aéroport déjà connu.
 *
 * countryCode conserve le code ISO brut tel que fourni par la source
 * (ex: "SN", "US"). countryId (FK logique vers `countries.id`) reste
 * nullable et n'est PAS renseigné automatiquement — une correspondance
 * countryCode → countryId erronée serait une donnée inventée ; ce
 * rapprochement, s'il est utile, doit être fait explicitement plus tard.
 */
export const airports = mysqlTable(
  "airports",
  {
    id: int("id").autoincrement().primaryKey(),
    sourceId: int("sourceId").notNull(),
    externalId: varchar("externalId", { length: 64 }).notNull(),
    name: varchar("name", { length: 220 }).notNull(),
    iata: varchar("iata", { length: 8 }),
    icao: varchar("icao", { length: 8 }),
    countryCode: varchar("countryCode", { length: 4 }),
    countryId: int("countryId"),
    latitude: varchar("latitude", { length: 32 }),
    longitude: varchar("longitude", { length: 32 }),
    retrievedAt: timestamp("retrievedAt").defaultNow().notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    sourceExternalIdx: uniqueIndex("airports_source_external_idx").on(table.sourceId, table.externalId),
  }),
);

export type AirportRow = typeof airports.$inferSelect;
export type InsertAirportRow = typeof airports.$inferInsert;