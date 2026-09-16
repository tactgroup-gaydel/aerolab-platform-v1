import { sourceRegistry } from "./registry";
import { worldMonitorConnector } from "./worldmonitor";
import { aftsConnector } from "./stubs/afts";
import { mobilityDataConnector } from "./stubs/mobilitydata";
import { openMeteoConnector } from "./stubs/openmeteo";
import { openSkyConnector } from "./stubs/opensky";
import { openStreetMapConnector } from "./stubs/openstreetmap";
import { ourAirportsConnector } from "./stubs/ourairports";
import { portWatchConnector } from "./stubs/portwatch";
import { unctadstatConnector } from "./stubs/unctadstat";
import { worldBankConnector } from "./stubs/worldbank";

export interface PreparedConnector {
  id: string;
  status: "prepared" | "disabled";
  reason: string;
}

export const connectorCatalog = sourceRegistry.map((source) => ({
  id: source.id,
  name: source.name,
  status: source.status,
  domains: source.domains,
  license: source.license,
}));

export const preparedConnectorImplementations = {
  afts: aftsConnector,
  mobilitydata: mobilityDataConnector,
  openmeteo: openMeteoConnector,
  opensky: openSkyConnector,
  openstreetmap: openStreetMapConnector,
  ourairports: ourAirportsConnector,
  portwatch: portWatchConnector,
  unctadstat: unctadstatConnector,
  worldbank: worldBankConnector,
};

export const preparedConnectors: PreparedConnector[] = Object.values(preparedConnectorImplementations)
  .filter((connector) => {
    const registryEntry = sourceRegistry.find((source) => source.id === connector.id);
    // A source that has graduated to "active" belongs in connectorCatalog/active,
    // not in this list — otherwise the same source would appear as both
    // "active" and "prepared" simultaneously, which is the exact inconsistency
    // this list exists to avoid.
    return registryEntry?.status !== "active";
  })
  .map((connector) => ({
    id: connector.id,
    status: "prepared" as const,
    reason: "Interface and license boundary prepared; production ingestion is not active in this phase.",
  }));

export function getConnector(id: string) {
  if (id === "worldmonitor") return worldMonitorConnector;
  return undefined;
}
