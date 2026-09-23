import { and, count, countDistinct, eq, inArray, isNotNull, like, ne, or, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { actRequests, airports, connectorRuns, countryIndicators, dataSources, InsertUser, users } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export type ActRequestInput = {
  name: string;
  organization: string;
  email: string;
  country: string;
  sector: string;
  description: string;
};

export async function createActRequest(input: ActRequestInput) {
  const db = await getDb();
  if (!db || process.env.NODE_ENV === "test") {
    console.warn("[Database] ACT request accepted in local fallback mode");
    return { id: 0, status: "RECEIVED" as const };
  }

  const inserted = await db.insert(actRequests).values({
    ...input,
    status: "RECEIVED",
  });
  return { id: Number(inserted[0].insertId), status: "RECEIVED" as const };
}

export async function getActRequestCount() {
  const db = await getDb();
  if (!db) return 0;
  const rows = await db.select({ id: actRequests.id }).from(actRequests);
  return rows.length;
}

export async function getDataSourceRows() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(dataSources);
}

export type ConnectorRunInput = {
  connectorId: string;
  endpoint: string;
  status: "SUCCESS" | "DEGRADED" | "ERROR";
  recordCount: number;
  latencyMs?: number;
  validationFailureCount?: number;
  freshnessStatus: "VALID" | "STALE" | "INVALID" | "ERROR";
  errorState?: string;
};

export async function recordConnectorRun(input: ConnectorRunInput) {
  const db = await getDb();
  if (!db || process.env.NODE_ENV === "test") return { recorded: false } as const;
  await db.insert(connectorRuns).values({
    connectorId: input.connectorId,
    endpoint: input.endpoint,
    status: input.status,
    recordCount: input.recordCount,
    latencyMs: input.latencyMs,
    validationFailureCount: input.validationFailureCount ?? 0,
    freshnessStatus: input.freshnessStatus,
    errorState: input.errorState,
    requestFinishedAt: new Date(),
  });
  return { recorded: true } as const;
}

export type GetAirportsInput = {
  limit?: number;
  offset?: number;
  /** Free-text match against name, IATA, or ICAO code. */
  search?: string;
  /** ISO country code, e.g. "SN". */
  countryCode?: string;
};

/**
 * Reads real rows from the `airports` table (populated by
 * server/connectors/ourairports/persistLive.ts). This is the AeroLab API
 * boundary — the frontend must go through this function (via the
 * dataEngine.airports tRPC procedure), never query OurAirports directly.
 */
export async function getAirports(input: GetAirportsInput = {}) {
  const db = await getDb();
  if (!db) return [];

  const limit = Math.min(Math.max(input.limit ?? 20, 1), 100);
  const offset = Math.max(input.offset ?? 0, 0);

  const conditions = [];
  if (input.search && input.search.trim()) {
    const term = `%${input.search.trim()}%`;
    conditions.push(or(like(airports.name, term), like(airports.iata, term), like(airports.icao, term)));
  }
  if (input.countryCode && input.countryCode.trim()) {
    conditions.push(eq(airports.countryCode, input.countryCode.trim().toUpperCase()));
  }

  const query = db.select().from(airports);
  const filtered = conditions.length > 0 ? query.where(and(...conditions)) : query;
  return filtered.limit(limit).offset(offset);
}

export async function getAirportsCount(input: Pick<GetAirportsInput, "search" | "countryCode"> = {}) {
  const db = await getDb();
  if (!db) return 0;

  const conditions = [];
  if (input.search && input.search.trim()) {
    const term = `%${input.search.trim()}%`;
    conditions.push(or(like(airports.name, term), like(airports.iata, term), like(airports.icao, term)));
  }
  if (input.countryCode && input.countryCode.trim()) {
    conditions.push(eq(airports.countryCode, input.countryCode.trim().toUpperCase()));
  }

  // Real SQL COUNT(*), not a fetch-then-.length — the table has 86,000+ rows.
  const query = db.select({ total: count() }).from(airports);
  const filtered = conditions.length > 0 ? query.where(and(...conditions)) : query;
  const [row] = await filtered;
  return row?.total ?? 0;
}

export type AirportsStats = {
  total: number;
  withIata: number;
  withIcao: number;
  countriesCovered: number;
  topCountries: { countryCode: string; total: number }[];
};

const EMPTY_AIRPORTS_STATS: AirportsStats = {
  total: 0,
  withIata: 0,
  withIcao: 0,
  countriesCovered: 0,
  topCountries: [],
};

/**
 * Derived indicators computed with real SQL aggregates over the `airports`
 * table (populated by server/connectors/ourairports/persistLive.ts). Every
 * number here traces back to a single verified source (OurAirports); nothing
 * is invented. Without a live database the function degrades to zeros so the
 * UI can render a well-formed "source pending" state instead of throwing.
 */
export async function getAirportsStats(topLimit = 12): Promise<AirportsStats> {
  const db = await getDb();
  if (!db) return EMPTY_AIRPORTS_STATS;

  const hasCountry = and(isNotNull(airports.countryCode), ne(airports.countryCode, ""));
  const hasIata = and(isNotNull(airports.iata), ne(airports.iata, ""));
  const hasIcao = and(isNotNull(airports.icao), ne(airports.icao, ""));

  const [totalRow] = await db.select({ total: count() }).from(airports);
  const [iataRow] = await db.select({ total: count() }).from(airports).where(hasIata);
  const [icaoRow] = await db.select({ total: count() }).from(airports).where(hasIcao);
  const [countriesRow] = await db
    .select({ total: countDistinct(airports.countryCode) })
    .from(airports)
    .where(hasCountry);

  const topCountries = await db
    .select({ countryCode: airports.countryCode, total: count() })
    .from(airports)
    .where(hasCountry)
    .groupBy(airports.countryCode)
    .orderBy(sql`count(*) desc`)
    .limit(Math.min(Math.max(topLimit, 1), 50));

  return {
    total: totalRow?.total ?? 0,
    withIata: iataRow?.total ?? 0,
    withIcao: icaoRow?.total ?? 0,
    countriesCovered: countriesRow?.total ?? 0,
    topCountries: topCountries.map((row) => ({ countryCode: row.countryCode ?? "", total: row.total })),
  };
}

export type GetCountryIndicatorsInput = {
  /** Filtre par code indicateur, ex. "LP.LPI.OVRL.XQ". */
  indicatorCode?: string;
  /** Restreint à un ensemble de codes pays ISO2, ex. ["SN", "CI"]. */
  countryCodes?: string[];
};

/**
 * Lit les indicateurs structurels par pays (table `countryIndicators`,
 * peuplée par server/connectors/worldbank/persistLive.ts). Frontière API
 * AeroLab : le front passe par cette fonction, jamais par l'API World Bank
 * directement. Dégrade à un tableau vide sans base — ne jette jamais.
 */
export async function getCountryIndicators(input: GetCountryIndicatorsInput = {}) {
  const db = await getDb();
  if (!db) return [];

  const conditions = [];
  if (input.indicatorCode && input.indicatorCode.trim()) {
    conditions.push(eq(countryIndicators.indicatorCode, input.indicatorCode.trim()));
  }
  const codes = (input.countryCodes ?? [])
    .map((c) => c.trim().toUpperCase())
    .filter((c) => c.length >= 2 && c.length <= 3);
  if (codes.length > 0) {
    conditions.push(inArray(countryIndicators.countryCode, codes));
  }

  try {
    const query = db.select().from(countryIndicators);
    const rows = conditions.length > 0 ? await query.where(and(...conditions)) : await query;
    return rows;
  } catch {
    // Table pas encore créée (avant la première ingestion World Bank) : dégrade
    // proprement en tableau vide plutôt que de jeter/logger une erreur.
    return [];
  }
}
