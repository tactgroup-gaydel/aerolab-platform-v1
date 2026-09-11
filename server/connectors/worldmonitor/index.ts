import type { MobilityConnector } from "../contracts";
import {
  WORLD_MONITOR_ENDPOINTS,
  type AirportStatus,
  type AircraftObservation,
  type ConnectorHealth,
  type ConnectorResult,
  type MaritimeActivity,
  type WorldMonitorConnectorConfig,
} from "@shared/dataEngine";

const DEFAULT_BASE_URL = "https://api.worldmonitor.app";
const DEFAULT_TIMEOUT_MS = 8_000;

function nowIso() {
  return new Date().toISOString();
}

function hashPayload(payload: unknown) {
  const text = JSON.stringify(payload);
  let hash = 2166136261;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16);
}

function getArray(payload: unknown): Record<string, unknown>[] {
  if (Array.isArray(payload)) return payload.filter((item): item is Record<string, unknown> => Boolean(item && typeof item === "object"));
  if (!payload || typeof payload !== "object") return [];
  const record = payload as Record<string, unknown>;
  for (const key of ["data", "items", "results", "airports", "aircraft", "vessels"]) {
    if (Array.isArray(record[key])) return getArray(record[key]);
  }
  return [];
}

function numberValue(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function textValue(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

export class WorldMonitorConnector implements MobilityConnector {
  readonly id = "worldmonitor";
  readonly status = "prepared" as const;
  readonly domains = ["aviation", "maritime", "logistics"];
  private readonly config: WorldMonitorConnectorConfig;

  constructor(config: Partial<WorldMonitorConnectorConfig> = {}) {
    this.config = {
      baseUrl: config.baseUrl ?? process.env.WORLDMONITOR_API_BASE_URL ?? DEFAULT_BASE_URL,
      apiKey: config.apiKey ?? process.env.WORLDMONITOR_API_KEY,
      timeoutMs: config.timeoutMs ?? DEFAULT_TIMEOUT_MS,
    };
  }

  private async request(endpoint: string, params?: Record<string, string | number | undefined>) {
    if (!this.config.apiKey) {
      throw new Error("WORLDMONITOR_API_KEY is not configured");
    }

    const url = new URL(endpoint, this.config.baseUrl);
    Object.entries(params ?? {}).forEach(([key, value]) => {
      if (value !== undefined) url.searchParams.set(key, String(value));
    });

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.config.timeoutMs);
    try {
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          Accept: "application/json",
          "X-WorldMonitor-Key": this.config.apiKey,
        },
      });
      if (!response.ok) throw new Error(`World Monitor responded with HTTP ${response.status}`);
      return await response.json() as unknown;
    } finally {
      clearTimeout(timeout);
    }
  }

  private buildHealth(endpoint: string, errorState?: string): ConnectorHealth {
    const attempted = nowIso();
    return {
      connectorId: this.id,
      status: errorState ? "degraded" : "ok",
      lastAttemptAt: attempted,
      lastSuccessAt: errorState ? undefined : attempted,
      freshness: errorState ? "ERROR" : "VALID",
      errorState,
    };
  }

  async health(): Promise<ConnectorHealth> {
    return this.buildHealth("connector");
  }

  async aviationStatus(): Promise<ConnectorResult<AirportStatus>> {
    const endpoint = WORLD_MONITOR_ENDPOINTS.airportDelays;
    try {
      const payload = await this.request(endpoint);
      const retrievedAt = nowIso();
      const data = getArray(payload).map((item, index) => ({
        id: `wm-airport-${textValue(item.id) ?? index}`,
        domain: "aviation" as const,
        type: "airport_status" as const,
        status: textValue(item.status) ?? textValue(item.delay_status) ?? "unknown",
        severity: "medium" as const,
        iata: textValue(item.iata) ?? textValue(item.iata_code),
        icao: textValue(item.icao) ?? textValue(item.icao_code),
        delayStatus: textValue(item.delay_status),
        disruptionStatus: textValue(item.disruption_status),
        retrievedAt,
        provenance: {
          sourceId: this.id,
          sourceName: "World Monitor",
          sourceEndpoint: endpoint,
          retrievedAt,
          externalId: textValue(item.id) ?? textValue(item.iata) ?? undefined,
          rawPayloadHash: hashPayload(item),
          quality: "VALID" as const,
        },
      } satisfies AirportStatus));
      return { data, health: data.length > 0 ? this.buildHealth(endpoint) : this.buildHealth(endpoint, "Malformed or empty upstream response"), endpoint };
    } catch (error) {
      return { data: [], health: this.buildHealth(endpoint, error instanceof Error ? error.message : "Unknown connector error"), endpoint };
    }
  }

  async airspace(): Promise<ConnectorResult<AircraftObservation>> {
    const endpoint = WORLD_MONITOR_ENDPOINTS.aircraft;
    try {
      const payload = await this.request(endpoint);
      const retrievedAt = nowIso();
      const data = getArray(payload).flatMap((item, index) => {
        const externalId = textValue(item.external_id) ?? textValue(item.id) ?? `aircraft-${index}`;
        const latitude = numberValue(item.latitude) ?? numberValue(item.lat);
        const longitude = numberValue(item.longitude) ?? numberValue(item.lon);
        return [{
          id: `wm-${externalId}`,
          domain: "aviation" as const,
          type: "aircraft" as const,
          status: "observed",
          externalId,
          callsign: textValue(item.callsign),
          aircraftType: textValue(item.aircraft_type),
          altitude: numberValue(item.altitude),
          heading: numberValue(item.heading),
          latitude,
          longitude,
          retrievedAt,
          provenance: {
            sourceId: this.id,
            sourceName: "World Monitor",
            sourceEndpoint: endpoint,
            retrievedAt,
            externalId,
            rawPayloadHash: hashPayload(item),
            quality: "VALID" as const,
          },
        } satisfies AircraftObservation];
      });
      return { data, health: data.length > 0 ? this.buildHealth(endpoint) : this.buildHealth(endpoint, "Malformed or empty upstream response"), endpoint };
    } catch (error) {
      return { data: [], health: this.buildHealth(endpoint, error instanceof Error ? error.message : "Unknown connector error"), endpoint };
    }
  }

  async maritimeActivity(): Promise<ConnectorResult<MaritimeActivity>> {
    const endpoint = WORLD_MONITOR_ENDPOINTS.vessels;
    try {
      const payload = await this.request(endpoint);
      const retrievedAt = nowIso();
      const data = getArray(payload).map((item, index) => ({
        id: `wm-maritime-${textValue(item.id) ?? index}`,
        domain: "maritime" as const,
        type: "maritime_activity" as const,
        status: textValue(item.status) ?? "observed",
        countryOrZone: textValue(item.country) ?? textValue(item.zone),
        density: numberValue(item.density),
        intensity: numberValue(item.intensity),
        vesselCount: numberValue(item.vessel_count),
        chokepoint: textValue(item.chokepoint),
        disruption: textValue(item.disruption),
        latitude: numberValue(item.latitude) ?? numberValue(item.lat),
        longitude: numberValue(item.longitude) ?? numberValue(item.lon),
        retrievedAt,
        provenance: {
          sourceId: this.id,
          sourceName: "World Monitor",
          sourceEndpoint: endpoint,
          retrievedAt,
          externalId: textValue(item.id),
          rawPayloadHash: hashPayload(item),
          quality: "VALID" as const,
        },
      } satisfies MaritimeActivity));
      return { data, health: data.length > 0 ? this.buildHealth(endpoint) : this.buildHealth(endpoint, "Malformed or empty upstream response"), endpoint };
    } catch (error) {
      return { data: [], health: this.buildHealth(endpoint, error instanceof Error ? error.message : "Unknown connector error"), endpoint };
    }
  }

  async chokepointStatus() {
    const endpoint = WORLD_MONITOR_ENDPOINTS.chokepointStatus;
    try {
      const payload = await this.request(endpoint);
      return { payload, health: this.buildHealth(endpoint), endpoint };
    } catch (error) {
      return { payload: null, health: this.buildHealth(endpoint, error instanceof Error ? error.message : "Unknown connector error"), endpoint };
    }
  }

  async flightSearch(params: { origin: string; destination: string; date?: string }) {
    const endpoint = WORLD_MONITOR_ENDPOINTS.flightPrices;
    try {
      const payload = await this.request(endpoint, params);
      return { payload, health: this.buildHealth(endpoint), endpoint };
    } catch (error) {
      return { payload: null, health: this.buildHealth(endpoint, error instanceof Error ? error.message : "Unknown connector error"), endpoint };
    }
  }
}

export const worldMonitorConnector = new WorldMonitorConnector();
