export type PropertyRecordLike = {
  id: string;
  teamId: string;
  type: string;
  name: string;
  url: string;
  ga4PropertyId: string | null;
  active?: boolean;
};

export type PropertySourceCoverage = "linked" | "gsc_only" | "ga4_only";

export type CombinedReportableProperty<T extends PropertyRecordLike = PropertyRecordLike> = {
  id: string; // canonical selection ID, GSC when available, otherwise GA4
  teamId: string;
  label: string; // prefers linked GA4 display name
  gscPropertyId: string | null;
  gscName: string | null;
  gscUrl: string | null;
  ga4PropertyId: string | null; // numeric GA4 property ID (no ga4_ prefix)
  ga4DbId: string | null; // DB row ID, e.g. ga4_123
  ga4Name: string | null;
  isLinked: boolean;
  sourceCoverage: PropertySourceCoverage;
  active: boolean;
  source: {
    gscProperty: T | null;
    ga4Property: T | null;
  };
};

export type ResolvedReportSources<T extends PropertyRecordLike = PropertyRecordLike> = {
  selectedProperty: T;
  canonicalGscProperty: T;
  linkedGa4Property: T | null;
  canonicalReportPropertyId: string;
  selectedWasGa4: boolean;
};

function isGscProperty(property: Pick<PropertyRecordLike, "id" | "type">) {
  return property.type === "gsc" || property.id.startsWith("gsc_");
}

function isGa4Property(property: Pick<PropertyRecordLike, "id" | "type">) {
  return property.type === "ga4" || property.id.startsWith("ga4_");
}

function normalizeSiteKey(raw: string) {
  const value = raw.trim();
  if (!value) return "";

  if (value.startsWith("sc-domain:")) {
    return `site:${value.slice("sc-domain:".length).toLowerCase().replace(/^www\./, "")}`;
  }

  try {
    const parsed = new URL(value);
    const host = parsed.hostname.toLowerCase().replace(/^www\./, "");
    const path = parsed.pathname.replace(/\/+$/, "") || "/";
    return path === "/" ? `site:${host}` : `site-path:${host}${path}`;
  } catch {
    return value.toLowerCase();
  }
}

function propertySiteKey(property: PropertyRecordLike) {
  return normalizeSiteKey(property.url || property.id.replace(/^gsc_/, "") || property.name || "");
}

function ga4DbIdFromNumericId(ga4PropertyId: string) {
  return `ga4_${ga4PropertyId}`;
}

function ga4NumericIdFromDbId(id: string) {
  return id.replace(/^ga4_/, "");
}

function gscCandidateRank(property: PropertyRecordLike) {
  let score = 0;
  if (property.url.startsWith("sc-domain:")) score += 100;
  if (property.ga4PropertyId) score += 20;
  if (property.url.startsWith("https://")) score += 5;
  if (property.url.startsWith("http://")) score += 1;
  return score;
}

function preferGscCandidate(next: PropertyRecordLike, current: PropertyRecordLike) {
  const nextRank = gscCandidateRank(next);
  const currentRank = gscCandidateRank(current);
  if (nextRank !== currentRank) return nextRank > currentRank;
  return next.id < current.id;
}

function displayLabel(gscProperty: PropertyRecordLike, ga4Property: PropertyRecordLike | null) {
  const ga4Name = ga4Property?.name?.trim();
  if (ga4Name) return ga4Name;

  const gscName = gscProperty.name?.trim();
  if (gscName) return gscName.replace(/^sc-domain:/, "");

  return gscProperty.url.replace(/^sc-domain:/, "") || gscProperty.id;
}

function displayGa4Label(ga4Property: PropertyRecordLike) {
  return ga4Property.name?.trim() || ga4Property.url?.trim() || ga4Property.id;
}

function isActive(property: PropertyRecordLike) {
  return property.active !== false;
}

export function buildCombinedReportableProperties<T extends PropertyRecordLike>(
  allProperties: T[],
): Array<CombinedReportableProperty<T>> {
  const activeProperties = allProperties.filter(isActive);
  const ga4ById = new Map<string, T>();
  for (const property of activeProperties) {
    if (isGa4Property(property)) ga4ById.set(property.id, property);
  }

  const grouped = new Map<string, { gscProperty: T; ga4Property: T | null }>();
  const usedGa4DbIds = new Set<string>();

  for (const property of activeProperties) {
    if (!isGscProperty(property)) continue;

    const ga4Property = property.ga4PropertyId ? ga4ById.get(ga4DbIdFromNumericId(property.ga4PropertyId)) ?? null : null;
    const key = property.ga4PropertyId
      ? `team:${property.teamId}:ga4:${property.ga4PropertyId}`
      : `team:${property.teamId}:gsc:${propertySiteKey(property)}`;
    const existing = grouped.get(key);

    if (!existing || preferGscCandidate(property, existing.gscProperty)) {
      grouped.set(key, { gscProperty: property, ga4Property });
    }
  }

  const combined: Array<CombinedReportableProperty<T>> = [...grouped.values()]
    .map(({ gscProperty, ga4Property }) => {
      if (ga4Property) usedGa4DbIds.add(ga4Property.id);
      return {
      id: gscProperty.id,
      teamId: gscProperty.teamId,
      label: displayLabel(gscProperty, ga4Property),
      gscPropertyId: gscProperty.id,
      gscName: gscProperty.name,
      gscUrl: gscProperty.url,
      ga4PropertyId: gscProperty.ga4PropertyId,
      ga4DbId: gscProperty.ga4PropertyId ? ga4DbIdFromNumericId(gscProperty.ga4PropertyId) : null,
      ga4Name: ga4Property?.name ?? null,
      isLinked: !!(gscProperty.ga4PropertyId && ga4Property),
      sourceCoverage: gscProperty.ga4PropertyId && ga4Property ? "linked" : "gsc_only",
      active: true,
      source: {
        gscProperty,
        ga4Property,
      },
      };
    });

  for (const property of activeProperties) {
    if (!isGa4Property(property) || usedGa4DbIds.has(property.id)) continue;
    combined.push({
      id: property.id,
      teamId: property.teamId,
      label: displayGa4Label(property),
      gscPropertyId: null,
      gscName: null,
      gscUrl: null,
      ga4PropertyId: ga4NumericIdFromDbId(property.id),
      ga4DbId: property.id,
      ga4Name: property.name,
      isLinked: false,
      sourceCoverage: "ga4_only",
      active: true,
      source: {
        gscProperty: null,
        ga4Property: property,
      },
    });
  }

  return combined
    .sort((a, b) => {
      if (a.teamId !== b.teamId) return a.teamId.localeCompare(b.teamId);
      return a.label.localeCompare(b.label);
    });
}

export function resolveReportSourcesFromProperties<T extends PropertyRecordLike>(
  allProperties: T[],
  selectedPropertyId: string,
  options: { includeInactive?: boolean } = {},
): ResolvedReportSources<T> {
  const properties = options.includeInactive ? allProperties : allProperties.filter(isActive);
  const selectedProperty = properties.find((p) => p.id === selectedPropertyId);
  if (!selectedProperty) {
    throw new Error("Property not found");
  }

  const sameTeam = properties.filter((p) => p.teamId === selectedProperty.teamId);
  const ga4ById = new Map(sameTeam.filter(isGa4Property).map((p) => [p.id, p] as const));
  const gscRows = sameTeam.filter(isGscProperty);

  if (isGscProperty(selectedProperty)) {
    const linkedGa4Property =
      selectedProperty.ga4PropertyId
        ? ga4ById.get(ga4DbIdFromNumericId(selectedProperty.ga4PropertyId)) ?? null
        : null;

    return {
      selectedProperty,
      canonicalGscProperty: selectedProperty,
      linkedGa4Property,
      canonicalReportPropertyId: selectedProperty.id,
      selectedWasGa4: false,
    };
  }

  if (isGa4Property(selectedProperty)) {
    const ga4NumericId = ga4NumericIdFromDbId(selectedProperty.id);
    const linkedGscCandidates = gscRows.filter((p) => p.ga4PropertyId === ga4NumericId);

    if (linkedGscCandidates.length === 0) {
      throw new Error(
        `Selected GA4 property ${selectedProperty.id} is not linked to a Google Search Console property`,
      );
    }

    const canonicalGscProperty = linkedGscCandidates.reduce((best, next) =>
      preferGscCandidate(next, best) ? next : best,
    );

    return {
      selectedProperty,
      canonicalGscProperty,
      linkedGa4Property: selectedProperty,
      canonicalReportPropertyId: canonicalGscProperty.id,
      selectedWasGa4: true,
    };
  }

  throw new Error(`Unsupported property type for reports: ${selectedProperty.type}`);
}
