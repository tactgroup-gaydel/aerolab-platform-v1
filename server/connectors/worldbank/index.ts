/**
 * AEROLAB — CONNECTEUR WORLD BANK RÉEL (indicateurs structurels)
 * ==============================================================
 *
 * Source vérifiée (recherche web, pas d'endpoint inventé) :
 *   - API officielle World Bank Open Data v2 :
 *     https://api.worldbank.org/v2/country/all/indicator/{code}?format=json
 *   - Indicateur de départ : LP.LPI.OVRL.XQ — Logistics Performance Index,
 *     score global (échelle 1 = faible … 5 = élevé).
 *   - Réponse : tableau [métadonnées, données[]]. Chaque enregistrement porte
 *     indicator.{id,value}, country.{id,value} (id = code 2 lettres, ex. "SN"),
 *     countryiso3code (3 lettres), date (année), value (score).
 *   - Licence : World Bank Open Data, CC BY 4.0 — attribution requise, usage
 *     commercial et redistribution autorisés avec attribution. À CONFIRMER
 *     indicateur par indicateur avant passage en `active` (décision humaine).
 *   - Aucune clé API requise.
 *
 * Ce module NE PASSE PAS le connecteur à `active` dans le registre : c'est une
 * décision humaine explicite (voir Charte §B5). Il ne fait que :
 * fetch → validation → normalisation. La persistance réelle vit dans
 * persistLive.ts (script manuel), jamais dans `pnpm test`.
 *
 * `mrnev=1` (most recent non-empty value) : une seule valeur par pays, la plus
 * récente disponible — les années varient donc d'un pays à l'autre, ce qui est
 * conservé tel quel (le champ `year` porte l'année réelle de la mesure).
 */

export const WORLD_BANK_API_BASE =
  process.env.WORLDBANK_API_BASE_URL?.trim() || "https://api.worldbank.org/v2";

/** Indicateur par défaut : LPI global. */
export const WORLD_BANK_LPI_OVERALL = "LP.LPI.OVRL.XQ";

export interface WorldBankFetchResult {
  endpoint: string;
  retrievedAt: string;
  raw: unknown;
}

/** Vrai appel réseau vers l'API World Bank pour un indicateur donné. */
export async function fetchWorldBankIndicator(
  indicatorCode: string = WORLD_BANK_LPI_OVERALL,
): Promise<WorldBankFetchResult> {
  const endpoint = `${WORLD_BANK_API_BASE}/country/all/indicator/${encodeURIComponent(
    indicatorCode,
  )}?format=json&mrnev=1&per_page=400`;
  const response = await fetch(endpoint, { headers: { Accept: "application/json" } });
  if (!response.ok) {
    throw new Error(`World Bank fetch failed: HTTP ${response.status} ${response.statusText}`);
  }
  const raw = (await response.json()) as unknown;
  return { endpoint, retrievedAt: new Date().toISOString(), raw };
}

// ---------------------------------------------------------------------------
// Parsing — la réponse est [métadonnées, données[]]
// ---------------------------------------------------------------------------

export interface WorldBankRecord {
  indicatorCode: string;
  indicatorName?: string;
  countryCode: string; // country.id (2 lettres, ex. "SN")
  countryIso3?: string; // countryiso3code (3 lettres)
  countryName?: string;
  value: number;
  year?: string;
}

function textOrUndefined(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

/**
 * Extrait les enregistrements exploitables. Conserve uniquement les lignes à
 * valeur numérique réelle. Les agrégats régionaux World Bank (ex. "ZG") sont
 * laissés tels quels : ils ne correspondront à aucun countryCode d'aéroport et
 * seront donc simplement ignorés côté produit, sans qu'aucun code soit inventé.
 */
export function parseWorldBankResponse(raw: unknown): WorldBankRecord[] {
  if (!Array.isArray(raw) || raw.length < 2 || !Array.isArray(raw[1])) return [];
  const rows = raw[1] as Record<string, unknown>[];
  const records: WorldBankRecord[] = [];
  for (const row of rows) {
    const rawValue = row.value;
    // World Bank renvoie value:null pour une donnée absente. On rejette
    // explicitement null/undefined/"" AVANT Number() — car Number(null) === 0
    // et Number("") === 0 fabriqueraient un faux score de 0.
    if (rawValue === null || rawValue === undefined || rawValue === "") continue;
    const value = typeof rawValue === "number" ? rawValue : Number(rawValue);
    if (!Number.isFinite(value)) continue; // rejette plutôt que d'inventer
    const indicator = (row.indicator ?? {}) as Record<string, unknown>;
    const country = (row.country ?? {}) as Record<string, unknown>;
    const countryCode = textOrUndefined(country.id);
    if (!countryCode) continue;
    records.push({
      indicatorCode: textOrUndefined(indicator.id) ?? "unknown",
      indicatorName: textOrUndefined(indicator.value),
      countryCode: countryCode.toUpperCase(),
      countryIso3: textOrUndefined(row.countryiso3code),
      countryName: textOrUndefined(country.value),
      value,
      year: textOrUndefined(row.date),
    });
  }
  return records;
}

export interface WorldBankIngestionResult {
  endpoint: string;
  retrievedAt: string;
  indicatorCode: string;
  totalRecords: number;
  records: WorldBankRecord[];
}

/** Chaîne complète sans persistance : fetch réel → parse → validation. */
export async function runWorldBankIngestion(
  indicatorCode: string = WORLD_BANK_LPI_OVERALL,
): Promise<WorldBankIngestionResult> {
  const fetchResult = await fetchWorldBankIndicator(indicatorCode);
  const records = parseWorldBankResponse(fetchResult.raw);
  return {
    endpoint: fetchResult.endpoint,
    retrievedAt: fetchResult.retrievedAt,
    indicatorCode,
    totalRecords: records.length,
    records,
  };
}
