import type { EntityResolutionResult } from "@shared/dataEngine";

export interface EntityCandidate {
  id: string;
  name: string;
  countryId?: string;
  identifiers?: string[];
}

export function resolveEntity(
  entityType: EntityResolutionResult["entityType"],
  input: { externalId?: string; identifier?: string; name?: string; countryId?: string },
  candidates: EntityCandidate[],
): EntityResolutionResult {
  const externalId = input.externalId;
  if (externalId) {
    const exact = candidates.find((candidate) => candidate.identifiers?.includes(externalId));
    if (exact) return { entityType, externalId, resolvedId: exact.id, confidence: 1, method: "exact_id" };
  }

  if (input.identifier) {
    const identifier = input.identifier.trim().toLowerCase();
    const exact = candidates.find((candidate) => candidate.identifiers?.some((value) => value.toLowerCase() === identifier));
    if (exact) return { entityType, externalId: input.identifier, resolvedId: exact.id, confidence: 0.98, method: "identifier" };
  }

  if (input.name) {
    const name = input.name.trim().toLowerCase();
    const exact = candidates.find((candidate) => candidate.name.trim().toLowerCase() === name && (!input.countryId || candidate.countryId === input.countryId));
    if (exact) return { entityType, externalId: input.externalId, resolvedId: exact.id, confidence: 0.9, method: "name_country" };
  }

  return { entityType, externalId: input.externalId, confidence: 0, method: "unresolved" };
}
