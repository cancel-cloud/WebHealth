import {
  clampAgencySites as clampPublicAgencySites,
  DEFAULT_AGENCY_SITE_COUNT,
  getAgencyPrice as getPublicAgencyPrice,
  MAX_AGENCY_SITES,
  MIN_AGENCY_SITES,
} from "@/lib/pricing";

export type AgencyLandingLanguage = "en" | "de";
export type AgencyLandingHeadline = "time";
export type AgencyLandingHeroVisual = "grid";
export type AgencyLandingDensity = "spacious";

export type WorkspaceSelection =
  | { view: "portfolio" }
  | { view: "client"; index: number };

export type WorkspaceAction =
  | { type: "show_portfolio" }
  | { type: "show_client"; index: number };

export const DEFAULT_AGENCY_LANGUAGE: AgencyLandingLanguage = "en";
export const DEFAULT_AGENCY_HEADLINE: AgencyLandingHeadline = "time";
export const DEFAULT_AGENCY_HERO_VISUAL: AgencyLandingHeroVisual = "grid";
export const DEFAULT_AGENCY_DENSITY: AgencyLandingDensity = "spacious";
export {
  DEFAULT_AGENCY_SITE_COUNT,
  MAX_AGENCY_SITES,
  MIN_AGENCY_SITES,
};

export function getLocalizedValue<T>(
  value: Record<AgencyLandingLanguage, T>,
  language: AgencyLandingLanguage,
) {
  return value[language];
}

export function getAgencyPrice(siteCount: number) {
  return getPublicAgencyPrice(siteCount);
}

export function clampAgencySites(siteCount: number) {
  return clampPublicAgencySites(siteCount);
}

export function getDefaultWorkspaceSelection(): WorkspaceSelection {
  return { view: "portfolio" };
}

export function getNextWorkspaceSelection(
  current: WorkspaceSelection,
  action: WorkspaceAction,
  clientCount: number,
): WorkspaceSelection {
  if (action.type === "show_portfolio") return { view: "portfolio" };
  if (clientCount <= 0) return current;

  const nextIndex = Math.min(Math.max(action.index, 0), clientCount - 1);
  return { view: "client", index: nextIndex };
}
