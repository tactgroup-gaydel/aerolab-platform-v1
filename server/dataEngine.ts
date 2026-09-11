import type { ConnectorHealth, DataQualityState, MobilityObservation } from "@shared/dataEngine";
import { recordConnectorRun } from "./db";
import { worldMonitorConnector } from "./connectors/worldmonitor";

export interface DataEngineSnapshot {
  observations: MobilityObservation[];
  connectorHealth: ConnectorHealth[];
  generatedAt: string;
  sourceMode: "upstream" | "validated-cache" | "unavailable";
}

let lastValidatedSnapshot: DataEngineSnapshot | null = null;

function staleHealth(health: ConnectorHealth): ConnectorHealth {
  return {
    ...health,
    status: "degraded",
    freshness: "STALE",
    errorState: health.errorState ?? "Upstream unavailable; serving last validated observations",
  };
}

function staleObservation(observation: MobilityObservation): MobilityObservation {
  return {
    ...observation,
    provenance: {
      ...observation.provenance,
      quality: "STALE" as DataQualityState,
      errorState: observation.provenance.errorState ?? "Upstream unavailable; observation retained from last validation",
    },
  };
}

export async function getMobilitySnapshot(): Promise<DataEngineSnapshot> {
  const startedAt = Date.now();
  const [aviation, aircraft, maritime] = await Promise.all([
    worldMonitorConnector.aviationStatus(),
    worldMonitorConnector.airspace(),
    worldMonitorConnector.maritimeActivity(),
  ]);
  const results = [aviation, aircraft, maritime];
  const observations: MobilityObservation[] = [
    ...aviation.data,
    ...aircraft.data,
    ...maritime.data,
  ];
  const connectorHealth = results.map((result) => result.health);
  const latencyMs = Date.now() - startedAt;
  await Promise.all(results.map((result) => recordConnectorRun({
    connectorId: result.health.connectorId,
    endpoint: result.endpoint,
    status: result.health.status === "ok" ? "SUCCESS" : result.health.status === "degraded" ? "DEGRADED" : "ERROR",
    recordCount: result.data.length,
    latencyMs,
    freshnessStatus: result.health.freshness,
    errorState: result.health.errorState,
  })));
  const hasValidData = observations.length > 0;

  if (hasValidData) {
    const snapshot: DataEngineSnapshot = {
      observations,
      connectorHealth,
      generatedAt: new Date().toISOString(),
      sourceMode: "upstream",
    };
    lastValidatedSnapshot = snapshot;
    return snapshot;
  }

  if (lastValidatedSnapshot) {
    return {
      ...lastValidatedSnapshot,
      observations: lastValidatedSnapshot.observations.map(staleObservation),
      connectorHealth: lastValidatedSnapshot.connectorHealth.map(staleHealth),
      generatedAt: new Date().toISOString(),
      sourceMode: "validated-cache",
    };
  }

  return {
    observations: [],
    connectorHealth,
    generatedAt: new Date().toISOString(),
    sourceMode: "unavailable",
  };
}

export function resetMobilitySnapshotCache() {
  lastValidatedSnapshot = null;
}
