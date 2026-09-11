import type { MobilityDomain } from "@shared/dataEngine";
import { InactiveConnector, type MobilityConnector } from "../contracts";

/**
 * Fabrique un connecteur "prepared" inerte pour une source candidate.
 *
 * Ce fichier était référencé par les 9 stubs (afts, mobilitydata, openmeteo,
 * opensky, openstreetmap, ourairports, portwatch, unctadstat, worldbank)
 * mais était absent du repository — sans lui, aucun de ces modules ne
 * pouvait être importé, et la chaîne server/routers.ts →
 * server/connectors/index.ts → ces 9 stubs échouait à la résolution de
 * module (TypeScript et au runtime).
 *
 * Comportement : réutilise `InactiveConnector`, déjà défini dans
 * `../contracts.ts` (santé "disabled", aucune donnée renvoyée, endpoint
 * "not-configured") — aucun nouveau comportement introduit, uniquement la
 * réexposition du fichier manquant.
 *
 * Aucun autre fichier de ce repository n'a été modifié.
 */
export function createPreparedConnector(
  id: string,
  domains: MobilityDomain[],
  reason: string,
): MobilityConnector {
  return new InactiveConnector(id, domains, reason);
}
