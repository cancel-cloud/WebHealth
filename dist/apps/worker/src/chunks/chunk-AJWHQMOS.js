import {
  db
} from "./chunk-JRPUP4TA.js";

// packages/shared/src/lib/properties/reportable-properties.ts
function isGscProperty(property) {
  return property.type === "gsc" || property.id.startsWith("gsc_");
}
function isGa4Property(property) {
  return property.type === "ga4" || property.id.startsWith("ga4_");
}
function ga4DbIdFromNumericId(ga4PropertyId) {
  return `ga4_${ga4PropertyId}`;
}
function ga4NumericIdFromDbId(id) {
  return id.replace(/^ga4_/, "");
}
function gscCandidateRank(property) {
  let score = 0;
  if (property.url.startsWith("sc-domain:")) score += 100;
  if (property.ga4PropertyId) score += 20;
  if (property.url.startsWith("https://")) score += 5;
  if (property.url.startsWith("http://")) score += 1;
  return score;
}
function preferGscCandidate(next, current) {
  const nextRank = gscCandidateRank(next);
  const currentRank = gscCandidateRank(current);
  if (nextRank !== currentRank) return nextRank > currentRank;
  return next.id < current.id;
}
function resolveReportSourcesFromProperties(allProperties, selectedPropertyId) {
  const selectedProperty = allProperties.find((p) => p.id === selectedPropertyId);
  if (!selectedProperty) {
    throw new Error("Property not found");
  }
  const sameTeam = allProperties.filter((p) => p.teamId === selectedProperty.teamId);
  const ga4ById = new Map(sameTeam.filter(isGa4Property).map((p) => [p.id, p]));
  const gscRows = sameTeam.filter(isGscProperty);
  if (isGscProperty(selectedProperty)) {
    const linkedGa4Property = selectedProperty.ga4PropertyId ? ga4ById.get(ga4DbIdFromNumericId(selectedProperty.ga4PropertyId)) ?? null : null;
    return {
      selectedProperty,
      canonicalGscProperty: selectedProperty,
      linkedGa4Property,
      canonicalReportPropertyId: selectedProperty.id,
      selectedWasGa4: false
    };
  }
  if (isGa4Property(selectedProperty)) {
    const ga4NumericId = ga4NumericIdFromDbId(selectedProperty.id);
    const linkedGscCandidates = gscRows.filter((p) => p.ga4PropertyId === ga4NumericId);
    if (linkedGscCandidates.length === 0) {
      throw new Error(
        `Selected GA4 property ${selectedProperty.id} is not linked to a Google Search Console property`
      );
    }
    const canonicalGscProperty = linkedGscCandidates.reduce(
      (best, next) => preferGscCandidate(next, best) ? next : best
    );
    return {
      selectedProperty,
      canonicalGscProperty,
      linkedGa4Property: selectedProperty,
      canonicalReportPropertyId: canonicalGscProperty.id,
      selectedWasGa4: true
    };
  }
  throw new Error(`Unsupported property type for reports: ${selectedProperty.type}`);
}

// packages/shared/src/lib/properties/reportable-properties-db.ts
async function listTeamProperties(teamId) {
  return db.query.properties.findMany({
    where: (p, { eq }) => eq(p.teamId, teamId)
  });
}
async function resolveTeamReportSources(teamId, selectedPropertyId) {
  const teamProperties = await listTeamProperties(teamId);
  if (!teamProperties.some((p) => p.id === selectedPropertyId)) {
    throw new Error("Property not found or unauthorized");
  }
  return resolveReportSourcesFromProperties(teamProperties, selectedPropertyId);
}
async function resolveReportSourcesForExistingReport(report) {
  return resolveTeamReportSources(report.teamId, report.propertyId);
}

export {
  resolveTeamReportSources,
  resolveReportSourcesForExistingReport
};
