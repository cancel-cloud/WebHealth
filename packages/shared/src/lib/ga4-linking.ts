export type Ga4LinkConfidence = "high" | "medium" | "low";
export type Ga4LinkSource = "manual" | "auto_display_name";

export type Ga4LinkEstimate = {
  matched: boolean;
  confidence: Ga4LinkConfidence;
  source: Ga4LinkSource;
};

export function normalizeGooglePropertyHost(value: string) {
  return value
    .replace(/^sc-domain:/, "")
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .replace(/\/$/, "")
    .toLowerCase()
    .trim();
}

export function estimateGa4DisplayNameLink(gscUrl: string, ga4DisplayName: string): Ga4LinkEstimate {
  const domain = normalizeGooglePropertyHost(gscUrl);
  const displayName = normalizeGooglePropertyHost(ga4DisplayName);

  if (!domain || !displayName) {
    return { matched: false, confidence: "low", source: "auto_display_name" };
  }

  if (displayName === domain) {
    return { matched: true, confidence: "high", source: "auto_display_name" };
  }

  if (displayName.includes(domain) || domain.includes(displayName)) {
    return { matched: true, confidence: "medium", source: "auto_display_name" };
  }

  return { matched: false, confidence: "low", source: "auto_display_name" };
}
