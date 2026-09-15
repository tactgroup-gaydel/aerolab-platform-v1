import { afterEach, describe, expect, it, vi } from "vitest";
import {
  parseCsvLine,
  parseOurAirportsCsv,
  toRawRecords,
  validate,
  normalize,
  runOurAirportsLiveIngestion,
  fetchOurAirportsLive,
} from "./index";

/**
 * Ces tests ne font AUCUN appel réseau réel — `fetch` est stubbé, comme
 * pour les tests existants de World Monitor (server/aerolab.content.test.ts).
 * Le CSV utilisé ici est synthétique (quelques lignes), écrit pour tester
 * le comportement du parseur/validateur — ce n'est pas un échantillon des
 * vraies données OurAirports, seulement une structure de colonnes réaliste
 * (mêmes noms de colonnes que le vrai fichier).
 *
 * Pour une preuve avec de VRAIES données OurAirports, voir liveCheck.ts,
 * un script séparé à exécuter manuellement (pas dans cette suite de tests).
 */

const SAMPLE_CSV = [
  "id,ident,type,name,latitude_deg,longitude_deg,elevation_ft,continent,iso_country,iso_region,municipality,scheduled_service,gps_code,iata_code,local_code,home_link,wikipedia_link,keywords",
  '1,GOBD,large_airport,"Blaise Diagne International Airport",14.67,-17.07,290,AF,SN,SN-TH,Diass,yes,GOBD,DSS,,,,',
  '2,LFPG,large_airport,"Charles de Gaulle Airport, Paris",49.01,2.55,392,EU,FR,FR-J,Paris,yes,LFPG,CDG,,,,',
  '3,XXINV,small_airport,,0,0,0,EU,FR,FR-J,,no,,,,,,', // ligne invalide : pas de nom
].join("\n");

afterEach(() => {
  vi.restoreAllMocks();
});

describe("OurAirports live connector — CSV parsing", () => {
  it("parses a simple comma-separated line", () => {
    expect(parseCsvLine("a,b,c")).toEqual(["a", "b", "c"]);
  });

  it("handles a quoted field containing a comma", () => {
    expect(parseCsvLine('1,"Paris, France",3')).toEqual(["1", "Paris, France", "3"]);
  });

  it("handles an escaped double-quote inside a quoted field", () => {
    expect(parseCsvLine('1,"Say ""hello""",3')).toEqual(["1", 'Say "hello"', "3"]);
  });

  it("maps CSV rows to objects by header name, not by column position", () => {
    const rows = parseOurAirportsCsv(SAMPLE_CSV);
    expect(rows).toHaveLength(3);
    expect(rows[0].name).toBe("Blaise Diagne International Airport");
    expect(rows[1].iata_code).toBe("CDG");
  });
});

describe("OurAirports live connector — validation & normalization", () => {
  it("wraps rows into raw records with a stable hash and a real endpoint", () => {
    const raw = toRawRecords({
      endpoint: "https://davidmegginson.github.io/ourairports-data/airports.csv",
      retrievedAt: new Date().toISOString(),
      rawCsv: SAMPLE_CSV,
    });
    expect(raw).toHaveLength(3);
    expect(raw[0].sourceId).toBe("ourairports");
    expect(raw[0].payloadHash).toEqual(expect.any(String));
  });

  it("rejects a row with no name instead of inventing one", () => {
    const raw = toRawRecords({
      endpoint: "test",
      retrievedAt: new Date().toISOString(),
      rawCsv: SAMPLE_CSV,
    });
    const invalid = raw.find((r) => r.externalId === "3")!;
    const outcome = validate(invalid);
    expect(outcome.valid).toBe(false);
    expect(outcome.reason).toContain("missing name");
  });

  it("normalizes a valid row into the AeroLab Airport model using the real column names", () => {
    const raw = toRawRecords({
      endpoint: "test",
      retrievedAt: new Date().toISOString(),
      rawCsv: SAMPLE_CSV,
    });
    const dss = raw.find((r) => r.externalId === "1")!;
    const airport = normalize(dss);
    expect(airport.iata).toBe("DSS");
    expect(airport.icao).toBe("GOBD");
    expect(airport.countryId).toBe("SN");
    expect(airport.latitude).toBeCloseTo(14.67);
    expect(airport.sourceId).toBe("ourairports");
  });

  it("correctly separates a name containing a comma from the following column", () => {
    const raw = toRawRecords({
      endpoint: "test",
      retrievedAt: new Date().toISOString(),
      rawCsv: SAMPLE_CSV,
    });
    const cdg = raw.find((r) => r.externalId === "2")!;
    const airport = normalize(cdg);
    expect(airport.name).toBe("Charles de Gaulle Airport, Paris");
    expect(airport.iata).toBe("CDG");
  });
});

describe("OurAirports live connector — fetch behavior (network mocked)", () => {
  it("throws a clear error on a non-OK HTTP response, without inventing data", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 503, statusText: "Service Unavailable" }));
    await expect(fetchOurAirportsLive()).rejects.toThrow(/503/);
  });

  it("runs the full ingestion against a mocked fetch and reports accurate counts", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: true, text: async () => SAMPLE_CSV }),
    );
    const result = await runOurAirportsLiveIngestion(10);
    expect(result.totalRows).toBe(3);
    expect(result.validCount).toBe(2);
    expect(result.rejectedCount).toBe(1);
    expect(result.airports).toHaveLength(2);
  });
});
