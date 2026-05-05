export function buildPropertyActiveUpdate(input: {
  enabled: boolean;
  activePropertiesBefore: number;
  propertyWasActive?: boolean;
}) {
  const propertyWasActive = input.propertyWasActive ?? true;
  const delta = input.enabled === propertyWasActive ? 0 : input.enabled ? 1 : -1;

  return {
    nextActive: input.enabled,
    activePropertiesAfter: Math.max(0, input.activePropertiesBefore + delta),
  };
}

export type ActiveRouteProperty = {
  id: string;
  type: string;
  active: boolean;
  ga4PropertyId: string | null;
};

export type PropertyActiveUpdatePlan = {
  nextActive: boolean;
  activateIds: string[];
  deactivateIds: string[];
  activePropertiesAfter: number;
};

function isGscProperty(property: Pick<ActiveRouteProperty, "id" | "type">) {
  return property.type === "gsc" || property.id.startsWith("gsc_");
}

function isGa4Property(property: Pick<ActiveRouteProperty, "id" | "type">) {
  return property.type === "ga4" || property.id.startsWith("ga4_");
}

function ga4NumericId(property: Pick<ActiveRouteProperty, "id">) {
  return property.id.replace(/^ga4_/, "");
}

function matchingGa4ForGsc(property: ActiveRouteProperty, requested: ActiveRouteProperty[]) {
  if (!property.ga4PropertyId) return null;
  return requested.find((candidate) =>
    isGa4Property(candidate) && ga4NumericId(candidate) === property.ga4PropertyId,
  ) ?? null;
}

export function buildPropertyActiveGroupPlan(input: {
  enabled: boolean;
  propertyId: string;
  requestedProperties: ActiveRouteProperty[];
  allTeamProperties: ActiveRouteProperty[];
  maxActiveProperties: number | null;
}): PropertyActiveUpdatePlan {
  const canonicalGsc = input.requestedProperties.find((property) =>
    property.id === input.propertyId && isGscProperty(property),
  );
  if (!canonicalGsc) {
    throw new Error("Only linked Search Console properties can be activated.");
  }

  const linkedGa4 = matchingGa4ForGsc(canonicalGsc, input.requestedProperties);
  if (!linkedGa4) {
    throw new Error("Activation requires a linked GA4 property.");
  }

  const duplicateGscRows = input.allTeamProperties.filter((property) =>
    isGscProperty(property) &&
    property.id !== canonicalGsc.id &&
    property.ga4PropertyId === canonicalGsc.ga4PropertyId,
  );
  const cleanupIds = duplicateGscRows.map((property) => property.id);
  const activeGroupIds = new Set([canonicalGsc.id, linkedGa4.id]);
  const activeByPropertyId = new Map(input.allTeamProperties.map((property) => [property.id, property.active] as const));
  const existingActiveLinkedGscIds = new Set(input.allTeamProperties
    .filter((property) => {
      if (!property.active || !isGscProperty(property) || !property.ga4PropertyId) return false;
      const ga4 = input.allTeamProperties.find((candidate) =>
        isGa4Property(candidate) &&
        ga4NumericId(candidate) === property.ga4PropertyId &&
        candidate.active,
      );
      return Boolean(ga4);
    })
    .map((property) => property.id));

  if (
    input.enabled &&
    typeof input.maxActiveProperties === "number" &&
    input.maxActiveProperties >= 0 &&
    [...existingActiveLinkedGscIds].filter((id) => !activeGroupIds.has(id) && !cleanupIds.includes(id)).length >= input.maxActiveProperties
  ) {
    throw new Error(`This plan can activate ${input.maxActiveProperties} linked ${input.maxActiveProperties === 1 ? "property" : "properties"}.`);
  }

  for (const property of input.allTeamProperties) {
    const shouldBeActive = input.enabled
      ? activeGroupIds.has(property.id)
        ? true
        : cleanupIds.includes(property.id)
          ? false
          : property.active
      : (activeGroupIds.has(property.id) || cleanupIds.includes(property.id))
        ? false
        : property.active;
    activeByPropertyId.set(property.id, shouldBeActive);
  }
  const activeLinkedGroupKeys = new Set(input.allTeamProperties
    .filter((property) => {
      if (!activeByPropertyId.get(property.id) || !isGscProperty(property) || !property.ga4PropertyId) return false;
      const ga4 = input.allTeamProperties.find((candidate) =>
        isGa4Property(candidate) &&
        ga4NumericId(candidate) === property.ga4PropertyId &&
        activeByPropertyId.get(candidate.id),
      );
      return Boolean(ga4);
    })
    .map((property) => `${property.ga4PropertyId}`));

  return {
    nextActive: input.enabled,
    activateIds: input.enabled ? [...activeGroupIds] : [],
    deactivateIds: input.enabled ? cleanupIds : [...activeGroupIds, ...cleanupIds],
    activePropertiesAfter: activeLinkedGroupKeys.size,
  };
}
