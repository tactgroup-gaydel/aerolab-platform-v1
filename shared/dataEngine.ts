export type MobilityDomain = "aviation" | "maritime" | "rail" | "road" | "logistics";
export type DataQualityState = "VALID" | "STALE" | "INVALID" | "ERROR";
export type ConnectorStatus = "active" | "prepared" | "disabled";

export interface SourceLicenseProfile {
  licenseStatus: string;
  commercialUse: "yes" | "conditional" | "unknown" | "no";
  redistributionAllowed: "yes" | "conditional" | "unknown" | "no";
  attributionRequired: boolean;
  notes: string;
}

export interface AeroLabSourceDefinition {
  id: string;
  name: string;
  priority: "A" | "B" | "C";
  domains: MobilityDomain[];
  /** Geographic or thematic coverage of the source, e.g. "Global", "Africa", "Pan-African road/rail/air/maritime". */
  coverage: string;
  /** How AeroLab is expected to reach the source: REST_API, BULK_EXTRACT, CSV_DOWNLOAD, DATASET_FILE, SCRAPE_REVIEW_REQUIRED, etc. */
  accessMethod: string;
  /** Expected refresh cadence once activated: REALTIME, DAILY, WEEKLY, MONTHLY, ANNUAL, STATIC. */
  updateFrequency: string;
  status: ConnectorStatus;
  license: SourceLicenseProfile;
}

export interface ObservationProvenance {
  sourceId: string;
  sourceName: string;
  sourceEndpoint: string;
  retrievedAt: string;
  observedAt?: string;
  externalId?: string;
  rawPayloadHash?: string;
  quality: DataQualityState;
  lastSuccessAt?: string;
  errorState?: string;
}

export interface MobilityObservation {
  id: string;
  domain: MobilityDomain;
  type: string;
  status: string;
  severity?: "low" | "medium" | "high" | "critical";
  countryId?: string;
  infrastructureId?: string;
  latitude?: number;
  longitude?: number;
  observedAt?: string;
  retrievedAt: string;
  provenance: ObservationProvenance;
}

export interface AirportStatus extends MobilityObservation {
  domain: "aviation";
  type: "airport_status";
  iata?: string;
  icao?: string;
  delayStatus?: string;
  disruptionStatus?: string;
}

export interface AircraftObservation extends MobilityObservation {
  domain: "aviation";
  type: "aircraft";
  externalId: string;
  callsign?: string;
  aircraftType?: string;
  altitude?: number;
  heading?: number;
}

export interface MaritimeActivity extends MobilityObservation {
  domain: "maritime";
  type: "maritime_activity";
  countryOrZone?: string;
  density?: number;
  intensity?: number;
  vesselCount?: number;
  chokepoint?: string;
  disruption?: string;
}

export interface WorldMonitorConnectorConfig {
  baseUrl: string;
  apiKey?: string;
  timeoutMs: number;
}

export interface ConnectorHealth {
  connectorId: string;
  status: "ok" | "degraded" | "disabled";
  lastAttemptAt?: string;
  lastSuccessAt?: string;
  freshness: DataQualityState;
  errorState?: string;
}

export interface ConnectorResult<T> {
  data: T[];
  health: ConnectorHealth;
  endpoint: string;
}

export const WORLD_MONITOR_ENDPOINTS = {
  airportDelays: "/api/aviation/v1/list-airport-delays",
  flightStatus: "/api/aviation/v1/get-flight-status",
  aircraft: "/api/aviation/v1/track-aircraft",
  flightPrices: "/api/aviation/v1/search-flight-prices",
  vessels: "/api/maritime/v1/get-vessel-snapshot",
  chokepointStatus: "/api/supply-chain/v1/get-chokepoint-status",
} as const;

export interface Airport {
  id: string;
  iata?: string;
  icao?: string;
  name: string;
  countryId?: string;
  cityId?: string;
  latitude?: number;
  longitude?: number;
  sourceId: string;
}

export interface Port {
  id: string;
  name: string;
  countryId?: string;
  cityId?: string;
  latitude?: number;
  longitude?: number;
  sourceId: string;
}

export interface Chokepoint {
  id: string;
  name: string;
  region?: string;
  latitude?: number;
  longitude?: number;
  sourceId: string;
}

export interface RailInfrastructure {
  id: string;
  name: string;
  countryId?: string;
  cityId?: string;
  geometryRef?: string;
  sourceId: string;
}

export interface RoadInfrastructure {
  id: string;
  name: string;
  countryId?: string;
  cityId?: string;
  geometryRef?: string;
  sourceId: string;
}

export interface LogisticsInfrastructure {
  id: string;
  name: string;
  type: string;
  countryId?: string;
  cityId?: string;
  latitude?: number;
  longitude?: number;
  sourceId: string;
}

export interface City {
  id: string;
  name: string;
  countryId?: string;
  latitude?: number;
  longitude?: number;
  sourceId: string;
}

export interface Corridor {
  id: string;
  name: string;
  countryIds: string[];
  infrastructureIds: string[];
  sourceId: string;
}

export interface Indicator {
  id: string;
  name: string;
  value: number | string;
  unit?: string;
  period?: string;
  methodology?: string;
  sourceId: string;
  retrievedAt: string;
}

export interface EntityResolutionResult {
  entityType: "country" | "city" | "airport" | "port" | "infrastructure" | "corridor";
  externalId?: string;
  resolvedId?: string;
  confidence: number;
  method: "exact_id" | "identifier" | "name_country" | "unresolved";
}
