const STANDALONE_AGENCY_PATHS = new Set([
  "/",
  "/de",
  "/en",
  "/about",
  "/de/about",
  "/en/about",
  "/demo",
  "/de/demo",
  "/en/demo",
  "/pricing",
  "/de/pricing",
  "/en/pricing",
  "/de/seo-reporting-tool-agenturen",
  "/en/seo-reporting-software-agencies",
]);

export function shouldUseStandaloneAgencyChrome(pathname: string | null) {
  if (!pathname) return false;

  const normalizedPathname =
    pathname.length > 1 && pathname.endsWith("/")
      ? pathname.slice(0, -1)
      : pathname;

  if (
    normalizedPathname === "/de/wissen" ||
    normalizedPathname.startsWith("/de/wissen/") ||
    normalizedPathname === "/en/resources" ||
    normalizedPathname.startsWith("/en/resources/")
  ) {
    return true;
  }

  return STANDALONE_AGENCY_PATHS.has(normalizedPathname);
}
