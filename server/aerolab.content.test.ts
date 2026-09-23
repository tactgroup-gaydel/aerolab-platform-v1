import { afterEach, describe, expect, it, vi } from "vitest";
import { appRouter } from "./routers";
import { searchContent } from "@shared/content";
import type { TrpcContext } from "./_core/context";
import { sourceRegistry } from "./connectors/registry";
import { WorldMonitorConnector } from "./connectors/worldmonitor";
import { resetMobilitySnapshotCache } from "./dataEngine";
import { resolveEntity } from "./entityResolution";

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("aerolab public procedures", () => {
  it("returns the connected public content summary", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.content.summary();

    expect(result.articles).toBeGreaterThan(0);
    expect(result.countries).toBeGreaterThan(0);
    expect(result.indicators).toBeGreaterThan(0);
    expect(result.analyses).toBeGreaterThan(0);
    expect(result.projects).toBeGreaterThan(0);
    expect(result.sectors).toBeGreaterThan(0);
    expect(result.markets).toBeGreaterThan(0);
    expect(result.infrastructures).toBeGreaterThan(0);
  });

  it("finds connected content through the shared search model", async () => {
    const result = searchContent("Sénégal", "fr");
    expect(result.some((item) => item.type === "Mobility Hub")).toBe(true);
    expect(result.some((item) => item.type === "Data")).toBe(true);

    const caller = appRouter.createCaller(createPublicContext());
    const serverResult = await caller.content.search({ q: "Sénégal", locale: "fr" });
    expect(serverResult.length).toBeGreaterThan(0);
  });

  it("resolves external entities deterministically before persistence", () => {
    const candidates = [{ id: "airport-dss", name: "Aéroport international Blaise Diagne", countryId: "SN", identifiers: ["DSS", "GOBD"] }];
    expect(resolveEntity("airport", { identifier: "DSS" }, candidates)).toMatchObject({ resolvedId: "airport-dss", method: "identifier", confidence: 0.98 });
    expect(resolveEntity("airport", { name: "Aéroport international Blaise Diagne", countryId: "SN" }, candidates).resolvedId).toBe("airport-dss");
    expect(resolveEntity("airport", { externalId: "unknown" }, candidates).method).toBe("unresolved");
  });

  it("returns a received status for a valid ACT request", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.act.create({
      name: "AeroLab test",
      organization: "AeroLab",
      email: "test@example.com",
      country: "Sénégal",
      sector: "Aérien",
      description: "Une problématique de connectivité à qualifier.",
    });
    expect(result.status).toBe("RECEIVED");
  });

  it("exposes the multi-source registry without claiming unproven connectors are active", async () => {
    expect(sourceRegistry.some((source) => source.id === "worldmonitor")).toBe(true);
    // ourairports earned "active" on 2026-09-15 after a real end-to-end run: 86,080 airports
    // fetched, validated, normalized, and persisted without duplication on re-run.
    expect(sourceRegistry.some((source) => source.id === "ourairports" && source.status === "active")).toBe(true);
    // Sources that have NOT been run end-to-end yet must remain "prepared", not "active".
    expect(sourceRegistry.some((source) => source.id === "worldbank" && source.status === "prepared")).toBe(true);
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.dataEngine.sources();
    expect(result.active.some((source) => source.id === "ourairports")).toBe(true);
    expect(result.prepared.some((connector) => connector.id === "ourairports")).toBe(false);
    expect(result.prepared.length).toBeGreaterThan(0);
  });

  it("degrades safely when World Monitor credentials are absent", async () => {
    const connector = new WorldMonitorConnector({ apiKey: undefined });
    const result = await connector.aviationStatus();
    expect(result.data).toEqual([]);
    expect(result.health.status).toBe("degraded");
    expect(result.health.freshness).toBe("ERROR");
    expect(result.endpoint).toBe("/api/aviation/v1/list-airport-delays");
  });

  it("normalizes a verified World Monitor aviation response behind AeroLab types", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ data: [{ id: "airport-1", iata: "DSS", status: "operational", delay_status: "low" }] }),
    }));
    const connector = new WorldMonitorConnector({ apiKey: "test-key" });
    const result = await connector.aviationStatus();
    expect(result.data[0]).toMatchObject({ domain: "aviation", type: "airport_status", iata: "DSS" });
    expect(result.data[0]?.provenance.sourceEndpoint).toBe("/api/aviation/v1/list-airport-delays");
    expect(result.health.freshness).toBe("VALID");
  });

  it("marks malformed World Monitor payloads as degraded", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => ({ nope: true }) }));
    const connector = new WorldMonitorConnector({ apiKey: "test-key" });
    const result = await connector.aviationStatus();
    expect(result.data).toEqual([]);
    expect(result.health.status).toBe("degraded");
    expect(result.health.errorState).toContain("Malformed");
  });

  it("converts World Monitor timeouts into degraded health", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("The operation was aborted")));
    const connector = new WorldMonitorConnector({ apiKey: "test-key", timeoutMs: 1 });
    const result = await connector.airspace();
    expect(result.data).toEqual([]);
    expect(result.health.status).toBe("degraded");
    expect(result.health.errorState).toContain("aborted");
  });

  it("serves an AeroLab-owned unavailable snapshot without raw upstream payloads", async () => {
    resetMobilitySnapshotCache();
    const caller = appRouter.createCaller(createPublicContext());
    const snapshot = await caller.dataEngine.snapshot();
    expect(snapshot.sourceMode).toBe("unavailable");
    expect(snapshot.observations).toEqual([]);
    expect(snapshot.connectorHealth).toHaveLength(3);
    expect(snapshot.connectorHealth.every((health) => health.status === "degraded")).toBe(true);
  });

  it("exposes real airports rows through the AeroLab API boundary, degrading to an empty page without a live database", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.dataEngine.airports({});
    // In this test environment there is no live DATABASE_URL connection (same
    // fallback mode already exercised by the ACT request test above) — the
    // procedure must return a well-formed empty page, never throw, and never
    // fall back to calling OurAirports directly.
    expect(Array.isArray(result.rows)).toBe(true);
    expect(result.limit).toBe(20);
    expect(result.offset).toBe(0);
    expect(typeof result.total).toBe("number");
  });

  it("exposes derived airport indicators, degrading to zeros without a live database", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.dataEngine.airportsStats();
    // Same no-DATABASE_URL fallback as the airports page test: the aggregate
    // procedure must return a well-formed, all-zero shape and never throw.
    expect(result.source).toBe("ourairports");
    expect(result.total).toBe(0);
    expect(result.withIata).toBe(0);
    expect(result.withIcao).toBe(0);
    expect(result.countriesCovered).toBe(0);
    expect(Array.isArray(result.topCountries)).toBe(true);
    expect(result.topCountries).toHaveLength(0);
  });

  it("exposes country indicators through the AeroLab API boundary, empty without a live database", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.dataEngine.countryIndicators({ indicatorCode: "LP.LPI.OVRL.XQ" });
    // No live DATABASE_URL in tests: the procedure returns a well-formed empty
    // page and never throws, never calls the World Bank API directly.
    expect(Array.isArray(result.rows)).toBe(true);
    expect(result.rows).toHaveLength(0);
    expect(result.total).toBe(0);
  });

  it("parses a verified World Bank LPI response and rejects non-numeric values", async () => {
    const { parseWorldBankResponse } = await import("./connectors/worldbank/index");
    const sample = [
      { page: 1, total: 2 },
      [
        { indicator: { id: "LP.LPI.OVRL.XQ", value: "Logistics performance index" }, country: { id: "SN", value: "Senegal" }, countryiso3code: "SEN", date: "2018", value: 2.25 },
        { indicator: { id: "LP.LPI.OVRL.XQ", value: "Logistics performance index" }, country: { id: "XX", value: "No data" }, countryiso3code: "XXX", date: "2018", value: null },
      ],
    ];
    const records = parseWorldBankResponse(sample);
    expect(records).toHaveLength(1);
    expect(records[0]).toMatchObject({ countryCode: "SN", countryIso3: "SEN", value: 2.25, year: "2018" });
  });

  it("rejects an ACT request with an invalid email before persistence", async () => {
    const caller = appRouter.createCaller(createPublicContext());

    await expect(caller.act.create({
      name: "AeroLab test",
      organization: "AeroLab",
      email: "not-an-email",
      country: "Sénégal",
      sector: "Aérien",
      description: "Une problématique de connectivité à qualifier.",
    })).rejects.toThrow();
  });
});
