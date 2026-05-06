import { estimateGa4DisplayNameLink } from "@webhealth/shared/lib/ga4-linking";

export type LinkableGoogleProperty = {
  id: string;
  name: string;
  url: string;
  type: string;
  ga4PropertyId: string | null;
};

export type Ga4PropertyOption = {
  id: string;
  numericId: string;
  name: string;
};

export type OnboardingLinkRow = {
  gscId: string;
  gscName: string;
  gscUrl: string;
  linkedGa4PropertyId: string | null;
  suggestedGa4PropertyId: string | null;
  selectedGa4PropertyId: string;
};

export function isGscProperty(property: Pick<LinkableGoogleProperty, "id" | "type">) {
  return property.type === "gsc" || property.id.startsWith("gsc_");
}

export function isGa4Property(property: Pick<LinkableGoogleProperty, "id" | "type">) {
  return property.type === "ga4" || property.id.startsWith("ga4_");
}

export function ga4NumericId(property: Pick<LinkableGoogleProperty, "id">) {
  return property.id.replace(/^ga4_/, "");
}

export function getGa4PropertyOptions(properties: LinkableGoogleProperty[]): Ga4PropertyOption[] {
  return properties
    .filter(isGa4Property)
    .map((property) => ({
      id: property.id,
      numericId: ga4NumericId(property),
      name: property.name?.trim() || property.url?.trim() || property.id,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

function getBestGa4Suggestion(gsc: LinkableGoogleProperty, ga4Options: Ga4PropertyOption[]) {
  const ranked = ga4Options
    .map((ga4) => ({
      ga4,
      estimate: estimateGa4DisplayNameLink(gsc.url, ga4.name),
    }))
    .filter((candidate) => candidate.estimate.matched)
    .sort((a, b) => {
      const confidenceRank = { high: 3, medium: 2, low: 1 };
      return confidenceRank[b.estimate.confidence] - confidenceRank[a.estimate.confidence];
    });

  return ranked[0]?.ga4.numericId ?? null;
}

export function buildOnboardingLinkRows(properties: LinkableGoogleProperty[]): OnboardingLinkRow[] {
  const ga4Options = getGa4PropertyOptions(properties);
  const ga4Ids = new Set(ga4Options.map((option) => option.numericId));

  return properties
    .filter(isGscProperty)
    .map((gsc) => {
      const linkedGa4PropertyId = gsc.ga4PropertyId && ga4Ids.has(gsc.ga4PropertyId)
        ? gsc.ga4PropertyId
        : null;
      const suggestedGa4PropertyId = linkedGa4PropertyId ?? getBestGa4Suggestion(gsc, ga4Options);

      return {
        gscId: gsc.id,
        gscName: gsc.name?.trim() || gsc.url?.trim() || gsc.id,
        gscUrl: gsc.url,
        linkedGa4PropertyId,
        suggestedGa4PropertyId,
        selectedGa4PropertyId: suggestedGa4PropertyId ?? "",
      };
    })
    .sort((a, b) => a.gscName.localeCompare(b.gscName));
}
