// Tracking parameters to strip from URLs
const TRACKING_PARAMS = new Set([
  "utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content",
  "utm_id", "utm_source_platform", "utm_creative_format", "utm_marketing_tactic",
  "gclid", "gclsrc", "dclid", "fbclid", "msclkid", "twclid", "li_fat_id",
  "_ga", "_gl", "mc_cid", "mc_eid",
]);

export type UrlNormalizerConfig = {
  /** How to handle trailing slashes */
  trailingSlashPolicy: "strip" | "add" | "preserve";
  /** Whether www.example.com === example.com */
  hostMode: "exact" | "strip-www";
};

export const DEFAULT_URL_CONFIG: UrlNormalizerConfig = {
  trailingSlashPolicy: "strip",
  hostMode: "strip-www",
};

export type UrlTokens = {
  url_raw: string;
  url_normalized: string;
  url_canonical: string;
  join_key: string;
  unjoinableReason?: "params-only" | "wrong-host" | "encoding-mismatch" | "fragment-only" | "external";
};

function applyTrailingSlash(path: string, policy: UrlNormalizerConfig["trailingSlashPolicy"]): string {
  if (path === "" || path === "/") return "/";
  if (policy === "strip") return path.endsWith("/") ? path.slice(0, -1) : path;
  if (policy === "add") return path.endsWith("/") ? path : path + "/";
  return path;
}

function stripTrackingParams(searchParams: URLSearchParams): URLSearchParams {
  const result = new URLSearchParams();
  for (const [key, value] of searchParams.entries()) {
    if (!TRACKING_PARAMS.has(key.toLowerCase())) {
      result.append(key, value);
    }
  }
  return result;
}

function normalizeHost(host: string, hostMode: UrlNormalizerConfig["hostMode"]): string {
  const lower = host.toLowerCase();
  if (hostMode === "strip-www" && lower.startsWith("www.")) {
    return lower.slice(4);
  }
  return lower;
}

/**
 * Normalize a raw URL string from GA4, GSC, or crawl data into canonical tokens.
 *
 * @param raw - The raw URL string (may be a full URL or just a path like "/blog/post/")
 * @param siteHost - The canonical host for this property (e.g. "example.com")
 * @param config - Normalization config
 */
export function normalizeUrl(
  raw: string,
  siteHost: string,
  config: UrlNormalizerConfig = DEFAULT_URL_CONFIG
): UrlTokens {
  // Handle path-only inputs (common from GA4 landingPage dimension)
  let inputUrl: URL;
  const normalizedSiteHost = normalizeHost(siteHost, config.hostMode);

  // Attempt to parse as full URL; if it fails treat as path
  try {
    inputUrl = new URL(raw.startsWith("http") ? raw : `https://${normalizedSiteHost}${raw.startsWith("/") ? raw : "/" + raw}`);
  } catch {
    return {
      url_raw: raw,
      url_normalized: raw,
      url_canonical: raw,
      join_key: raw,
      unjoinableReason: "encoding-mismatch",
    };
  }

  // Detect external URLs (wrong host)
  const parsedHost = normalizeHost(inputUrl.hostname, config.hostMode);
  if (parsedHost !== normalizedSiteHost && parsedHost !== "") {
    // Could be external
    // Only mark as external if the input was a full URL (not path-only)
    if (raw.startsWith("http")) {
      return {
        url_raw: raw,
        url_normalized: raw,
        url_canonical: raw,
        join_key: raw,
        unjoinableReason: "external",
      };
    }
  }

  // Strip fragment
  inputUrl.hash = "";

  // Strip tracking params, keep non-tracking query params
  const cleanedParams = stripTrackingParams(inputUrl.searchParams);

  // Normalize path encoding: decode then re-encode
  let normalizedPath: string;
  try {
    normalizedPath = encodeURI(decodeURIComponent(inputUrl.pathname));
  } catch {
    normalizedPath = inputUrl.pathname;
  }

  // Apply trailing slash policy
  normalizedPath = applyTrailingSlash(normalizedPath, config.trailingSlashPolicy);

  // Build normalized URL
  const normalizedSearchString = cleanedParams.toString();
  const url_normalized =
    `https://${parsedHost}${normalizedPath}` +
    (normalizedSearchString ? `?${normalizedSearchString}` : "");

  // join_key = path + non-tracking query (no scheme/host)
  const join_key = normalizedPath + (normalizedSearchString ? `?${normalizedSearchString}` : "");

  // Detect unjoinable reasons
  let unjoinableReason: UrlTokens["unjoinableReason"] | undefined;
  if (normalizedPath === "/" && normalizedSearchString === "") {
    // Root path is joinable — no issue
  } else if (normalizedPath === "" || (normalizedPath === "/" && normalizedSearchString !== "")) {
    // Params-only (no real distinct path)
    const hasNonTrackingParams = normalizedSearchString !== "";
    const hasRealPath = normalizedPath !== "/" && normalizedPath !== "";
    if (hasNonTrackingParams && !hasRealPath) {
      unjoinableReason = "params-only";
    }
  }

  // url_canonical = same as url_normalized unless we later get it from URL Inspection API
  const url_canonical = url_normalized;

  return {
    url_raw: raw,
    url_normalized,
    url_canonical,
    join_key,
    unjoinableReason,
  };
}

/**
 * Build a URL join quality report from cross-source data.
 */
export type UrlJoinReport = {
  totalGsc: number;
  totalGa4: number;
  totalCrawl: number;
  joinedGscGa4: number;
  joinedGscCrawl: number;
  joinRateGscGa4: number;
  topUnjoinableUrls: Array<{ url: string; reason: UrlTokens["unjoinableReason"] }>;
};

export function buildUrlJoinReport(params: {
  gscUrls: UrlTokens[];
  ga4Urls: UrlTokens[];
  crawlUrls: UrlTokens[];
}): UrlJoinReport {
  const ga4Keys = new Set(params.ga4Urls.map((u) => u.join_key));
  const crawlKeys = new Set(params.crawlUrls.map((u) => u.join_key));

  let joinedGscGa4 = 0;
  let joinedGscCrawl = 0;
  const unjoinableUrls: Array<{ url: string; reason: UrlTokens["unjoinableReason"] }> = [];

  for (const gscUrl of params.gscUrls) {
    if (gscUrl.unjoinableReason) {
      unjoinableUrls.push({ url: gscUrl.url_raw, reason: gscUrl.unjoinableReason });
      continue;
    }
    if (ga4Keys.has(gscUrl.join_key)) joinedGscGa4++;
    if (crawlKeys.has(gscUrl.join_key)) joinedGscCrawl++;
  }

  const totalGsc = params.gscUrls.length;

  return {
    totalGsc,
    totalGa4: params.ga4Urls.length,
    totalCrawl: params.crawlUrls.length,
    joinedGscGa4,
    joinedGscCrawl,
    joinRateGscGa4: totalGsc > 0 ? joinedGscGa4 / totalGsc : 0,
    topUnjoinableUrls: unjoinableUrls.slice(0, 10),
  };
}
