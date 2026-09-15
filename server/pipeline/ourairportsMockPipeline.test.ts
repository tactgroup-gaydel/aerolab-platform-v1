import { describe, expect, it } from "vitest";
import {
  fetchMock,
  toRawRecords,
  validate,
  normalize,
  runOurAirportsMockPipeline,
  MOCK_OURAIRPORTS_ROWS,
} from "./ourairportsMockPipeline";

/**
 * ⚠️ NON EXÉCUTÉ dans cet environnement (pas d'accès réseau pour installer
 * vitest/drizzle-orm et al.). Écrit pour être lancé avec `pnpm test` dans un
 * environnement avec les dépendances installées. Ne pas considérer ces tests
 * comme "passés" tant que `pnpm test` n'a pas réellement tourné.
 */
describe("OurAirports mock pipeline (Phase 4 — preuve de bout en bout)", () => {
  it("fetches the fixed number of mock rows without any network call", async () => {
    const result = await fetchMock();
    expect(result.rows.length).toBe(MOCK_OURAIRPORTS_ROWS.length);
    expect(result.endpoint.startsWith("mock://")).toBe(true);
  });

  it("wraps every row into a raw record with a stable hash", async () => {
    const result = await fetchMock();
    const raw = toRawRecords(result);
    expect(raw).toHaveLength(3);
    expect(raw[0].payloadHash).toEqual(expect.any(String));
    expect(raw[0].sourceId).toBe("ourairports");
  });

  it("rejects the deliberately invalid fixture row instead of inventing data", async () => {
    const result = await fetchMock();
    const raw = toRawRecords(result);
    const invalid = raw.find((r) => r.externalId === "mock-3-invalid")!;
    const outcome = validate(invalid);
    expect(outcome.valid).toBe(false);
    expect(outcome.reason).toBeTruthy();
  });

  it("normalizes a valid row into the AeroLab Airport model", async () => {
    const result = await fetchMock();
    const raw = toRawRecords(result);
    const dss = raw.find((r) => r.externalId === "mock-1")!;
    const airport = normalize(dss);
    expect(airport.iata).toBe("DSS");
    expect(airport.icao).toBe("GOBD");
    expect(airport.sourceId).toBe("ourairports");
  });

  it("runs the full pipeline and produces exactly the number of valid observations", async () => {
    const run = await runOurAirportsMockPipeline([]);
    expect(run.totalFetched).toBe(3);
    expect(run.validated).toBe(2);
    expect(run.rejected).toHaveLength(1);
    expect(run.rejected[0].externalId).toBe("mock-3-invalid");
  });

  it("attempts entity resolution for each observation without crashing on empty candidates", async () => {
    const run = await runOurAirportsMockPipeline([]);
    for (const observation of run.observations) {
      expect(observation.entityResolution.method).toBe("unresolved");
      expect(observation.entityResolution.confidence).toBe(0);
    }
  });

  it("resolves an entity when a matching candidate exists", async () => {
    const run = await runOurAirportsMockPipeline([
      { id: "entity-dss", name: "Blaise Diagne International Airport (fixture)", identifiers: ["GOBD", "DSS"] },
    ]);
    const dssObservation = run.observations.find((o) => o.airportRow.iata === "DSS");
    expect(dssObservation?.entityResolution.resolvedId).toBe("entity-dss");
    expect(dssObservation?.entityResolution.method).toBe("exact_id");
  });
});
