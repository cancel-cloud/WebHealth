const STANDALONE_AGENCY_PATHS = new Set([
  "/",
  "/de",
  "/en",
  "/de/seo-reporting-tool-agenturen",
  "/en/seo-reporting-software-agencies",
]);

export function shouldUseStandaloneAgencyChrome(pathname: string | null) {
  if (!pathname) return false;

  const normalizedPathname =
    pathname.length > 1 && pathname.endsWith("/")
      ? pathname.slice(0, -1)
      : pathname;

  return STANDALONE_AGENCY_PATHS.has(normalizedPathname);
}
