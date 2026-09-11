import type { ConnectorHealth, ConnectorResult, MobilityObservation } from "@shared/dataEngine";

export interface ConnectorContext {
  connectorId: string;
  requestedAt: string;
}

export interface MobilityConnector {
  readonly id: string;
  readonly status: "active" | "prepared" | "disabled";
  readonly domains: string[];
  health(): Promise<ConnectorHealth>;
  aviationStatus(context?: ConnectorContext): Promise<ConnectorResult<MobilityObservation>>;
  maritimeActivity(context?: ConnectorContext): Promise<ConnectorResult<MobilityObservation>>;
}

export class InactiveConnector implements MobilityConnector {
  readonly status = "prepared" as const;
  constructor(
    readonly id: string,
    readonly domains: string[],
    private readonly reason: string,
  ) {}

  async health(): Promise<ConnectorHealth> {
    return {
      connectorId: this.id,
      status: "disabled",
      freshness: "ERROR",
      errorState: this.reason,
    };
  }

  async aviationStatus(): Promise<ConnectorResult<MobilityObservation>> {
    return { data: [], health: await this.health(), endpoint: "not-configured" };
  }

  async maritimeActivity(): Promise<ConnectorResult<MobilityObservation>> {
    return { data: [], health: await this.health(), endpoint: "not-configured" };
  }
}
