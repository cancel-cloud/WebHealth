import { lookup } from "node:dns/promises";
import http from "node:http";
import https from "node:https";
import { isIP } from "node:net";
import * as cheerio from "cheerio";

export type PageIssue = {
  url: string;
  canonicalUrl: string;
  issues: string[];
  title?: string;
  metaDescription?: string;
  h1Count: number;
  h1Texts?: string[];
  visibleTextExcerpt?: string;
  noindex?: boolean;
  nofollow?: boolean;
  imageMissingAltCount?: number;
  hasStructuredData?: boolean;
  hasViewportMeta?: boolean;
  visibleWordCount?: number;
};

export type CrawlResult = {
  pages: PageIssue[];
  brokenLinks: string[];
  summary: {
    missingTitle: number;
    missingMeta: number;
    missingH1: number;
    multipleH1: number;
    brokenLinks: number;
    noindexPages: number;
    canonicalMismatch: number;
    imageMissingAlt: number;
    missingStructuredData: number;
    missingViewportMeta: number;
    thinContent: number;
  };
};

export type CrawlScope =
  | { kind: "host"; value: string }
  | { kind: "domain"; value: string };

type LookupAddress = {
  address: string;
  family: number;
};

type CrawlDnsLookup = (hostname: string) => Promise<LookupAddress[]>;

type CrawlFetchImpl = typeof fetch;

export type CrawlSecurityOptions = {
  allowHttpLocalhost?: boolean;
  dnsLookup?: CrawlDnsLookup;
  fetchImpl?: CrawlFetchImpl;
  maxRedirects?: number;
};

const DEFAULT_MAX_PAGES = 50;
const DEFAULT_MAX_REDIRECTS = 5;
const CRAWLER_USER_AGENT = "WebAubit-Crawler/1.0";
const METADATA_IPV4 = "169.254.169.254";
const MAX_CRAWL_RESPONSE_BYTES = 2 * 1024 * 1024;

async function resolveHostAddresses(hostname: string): Promise<LookupAddress[]> {
  const results = await lookup(hostname, { all: true, verbatim: true });
  return results.map((result) => ({ address: result.address, family: result.family }));
}

function normalizeHost(hostname: string): string {
  return hostname.trim().replace(/\.$/, "").toLowerCase();
}

function isLocalDevHostname(hostname: string): boolean {
  const normalized = normalizeHost(hostname);
  return (
    normalized === "localhost" ||
    normalized.endsWith(".localhost") ||
    normalized === "127.0.0.1" ||
    normalized === "::1"
  );
}

function parseIpv4ToInt(address: string): number | null {
  const octets = address.split(".");
  if (octets.length !== 4) return null;

  let value = 0;
  for (const octet of octets) {
    const parsed = Number.parseInt(octet, 10);
    if (!Number.isInteger(parsed) || parsed < 0 || parsed > 255) {
      return null;
    }
    value = (value << 8) + parsed;
  }

  return value >>> 0;
}

function ipv4InCidr(address: string, network: string, prefixLength: number): boolean {
  const ipValue = parseIpv4ToInt(address);
  const networkValue = parseIpv4ToInt(network);
  if (ipValue === null || networkValue === null) return false;

  const mask =
    prefixLength === 0 ? 0 : ((0xffffffff << (32 - prefixLength)) >>> 0);
  return (ipValue & mask) === (networkValue & mask);
}

function expandIpv6(address: string): string[] | null {
  const normalized = address.toLowerCase();
  if (!normalized.includes(":")) return null;

  const doubleColonParts = normalized.split("::");
  if (doubleColonParts.length > 2) return null;

  const [head, tail] = doubleColonParts;
  const headParts = head ? head.split(":").filter(Boolean) : [];
  const tailParts = tail ? tail.split(":").filter(Boolean) : [];
  const expandedTail = [...tailParts];

  if (expandedTail.length > 0 && expandedTail[expandedTail.length - 1]?.includes(".")) {
    const ipv4Value = parseIpv4ToInt(expandedTail[expandedTail.length - 1]!);
    if (ipv4Value === null) return null;
    expandedTail.pop();
    expandedTail.push(((ipv4Value >>> 16) & 0xffff).toString(16));
    expandedTail.push((ipv4Value & 0xffff).toString(16));
  }

  const totalParts = headParts.length + expandedTail.length;
  if (totalParts > 8) return null;

  const filler = new Array(8 - totalParts).fill("0");
  const result = [...headParts, ...filler, ...expandedTail].map((part) => {
    const parsed = Number.parseInt(part || "0", 16);
    if (!Number.isInteger(parsed) || parsed < 0 || parsed > 0xffff) {
      return null;
    }
    return parsed.toString(16).padStart(4, "0");
  });

  return result.every(Boolean) ? (result as string[]) : null;
}

function ipv6HasPrefix(address: string, prefix: string, prefixLength: number): boolean {
  const ipParts = expandIpv6(address);
  const prefixParts = expandIpv6(prefix);
  if (!ipParts || !prefixParts) return false;

  let remainingBits = prefixLength;
  for (let index = 0; index < 8; index += 1) {
    if (remainingBits <= 0) return true;
    const bits = Math.min(remainingBits, 16);
    const mask = bits === 16 ? 0xffff : ((0xffff << (16 - bits)) & 0xffff);
    const ipValue = Number.parseInt(ipParts[index]!, 16);
    const prefixValue = Number.parseInt(prefixParts[index]!, 16);
    if ((ipValue & mask) !== (prefixValue & mask)) {
      return false;
    }
    remainingBits -= bits;
  }

  return true;
}

function extractMappedIpv4FromIpv6(address: string): string | null {
  const parts = expandIpv6(address);
  if (!parts) return null;

  const isMapped =
    parts[0] === "0000" &&
    parts[1] === "0000" &&
    parts[2] === "0000" &&
    parts[3] === "0000" &&
    parts[4] === "0000" &&
    parts[5] === "ffff";

  if (!isMapped) return null;

  const high = Number.parseInt(parts[6]!, 16);
  const low = Number.parseInt(parts[7]!, 16);
  if (!Number.isInteger(high) || !Number.isInteger(low)) return null;

  return [
    (high >>> 8) & 0xff,
    high & 0xff,
    (low >>> 8) & 0xff,
    low & 0xff,
  ].join(".");
}

export function isBlockedCrawlIpAddress(address: string): boolean {
  const normalized = address.trim().toLowerCase();
  const family = isIP(normalized);

  if (family === 4) {
    return (
      normalized === METADATA_IPV4 ||
      ipv4InCidr(normalized, "0.0.0.0", 8) ||
      ipv4InCidr(normalized, "10.0.0.0", 8) ||
      ipv4InCidr(normalized, "100.64.0.0", 10) ||
      ipv4InCidr(normalized, "127.0.0.0", 8) ||
      ipv4InCidr(normalized, "169.254.0.0", 16) ||
      ipv4InCidr(normalized, "172.16.0.0", 12) ||
      ipv4InCidr(normalized, "192.0.0.0", 24) ||
      ipv4InCidr(normalized, "192.0.2.0", 24) ||
      ipv4InCidr(normalized, "192.168.0.0", 16) ||
      ipv4InCidr(normalized, "198.18.0.0", 15) ||
      ipv4InCidr(normalized, "198.51.100.0", 24) ||
      ipv4InCidr(normalized, "203.0.113.0", 24) ||
      ipv4InCidr(normalized, "224.0.0.0", 4) ||
      ipv4InCidr(normalized, "240.0.0.0", 4)
    );
  }

  if (family === 6) {
    const mappedIpv4 = extractMappedIpv4FromIpv6(normalized);
    if (mappedIpv4) {
      return isBlockedCrawlIpAddress(mappedIpv4);
    }

    return (
      normalized === "::" ||
      normalized === "::1" ||
      ipv6HasPrefix(normalized, "fe80::", 10) ||
      ipv6HasPrefix(normalized, "fc00::", 7) ||
      ipv6HasPrefix(normalized, "ff00::", 8) ||
      ipv6HasPrefix(normalized, "2001:db8::", 32)
    );
  }

  return false;
}

function isAllowedCrawlProtocol(url: URL, options?: CrawlSecurityOptions): boolean {
  if (url.protocol === "https:") return true;
  if (url.protocol !== "http:") return false;

  return (
    process.env.NODE_ENV !== "production" &&
    options?.allowHttpLocalhost === true &&
    isLocalDevHostname(url.hostname)
  );
}

export function createCrawlScope(startUrl: string): CrawlScope {
  if (startUrl.startsWith("sc-domain:")) {
    return { kind: "domain", value: normalizeHost(startUrl.replace("sc-domain:", "")) };
  }

  const url = new URL(startUrl);
  return { kind: "host", value: normalizeHost(url.hostname) };
}

function isHostnameWithinScope(hostname: string, scope: CrawlScope): boolean {
  const normalized = normalizeHost(hostname);
  if (scope.kind === "host") {
    return normalized === scope.value;
  }

  return normalized === scope.value || normalized.endsWith(`.${scope.value}`);
}

export function normalizeCrawlUrl(
  base: string,
  href: string,
  scope: CrawlScope,
  options?: CrawlSecurityOptions
): string | null {
  try {
    const url = new URL(href, base);
    if (!isAllowedCrawlProtocol(url, options)) return null;
    if (!isHostnameWithinScope(url.hostname, scope)) return null;
    url.hash = "";
    url.search = "";
    return url.toString();
  } catch {
    return null;
  }
}

export async function assertSafeCrawlUrl(
  input: string,
  scope: CrawlScope,
  options?: CrawlSecurityOptions
): Promise<URL> {
  return (await assertSafeCrawlTarget(input, scope, options)).url;
}

async function assertSafeCrawlTarget(
  input: string,
  scope: CrawlScope,
  options?: CrawlSecurityOptions
): Promise<{ url: URL; addresses: LookupAddress[] }> {
  const url = new URL(input);

  if (!isAllowedCrawlProtocol(url, options)) {
    throw new Error(`Disallowed crawl protocol for ${url.toString()}`);
  }

  if (!isHostnameWithinScope(url.hostname, scope)) {
    throw new Error(`Crawl target escaped verified scope: ${url.hostname}`);
  }

  const hostname = normalizeHost(url.hostname);
  const addressFamily = isIP(hostname);
  const addresses =
    addressFamily > 0
      ? [{ address: hostname, family: addressFamily }]
      : await (options?.dnsLookup ?? resolveHostAddresses)(hostname);

  if (!addresses.length) {
    throw new Error(`Crawl target did not resolve: ${hostname}`);
  }

  for (const entry of addresses) {
    if (isBlockedCrawlIpAddress(entry.address)) {
      throw new Error(`Blocked crawl target address: ${entry.address}`);
    }
  }

  return { url, addresses };
}

export function createPinnedCrawlLookup(addresses: LookupAddress[]) {
  return async (_hostname: string, options: { all?: boolean } = {}) => {
    if (!addresses.length) throw new Error("No vetted crawl addresses available.");
    if (options.all) return addresses;
    return addresses[0]!;
  };
}

function headersToRecord(headers: http.IncomingHttpHeaders): Headers {
  const result = new Headers();
  for (const [name, value] of Object.entries(headers)) {
    if (Array.isArray(value)) {
      for (const item of value) result.append(name, item);
    } else if (typeof value === "string") {
      result.set(name, value);
    }
  }
  return result;
}

async function fetchPinnedCrawlTarget(target: { url: URL; addresses: LookupAddress[] }): Promise<Response> {
  const client = target.url.protocol === "https:" ? https : http;
  const lookupPinned = createPinnedCrawlLookup(target.addresses);

  return new Promise<Response>((resolve, reject) => {
    const req = client.request(
      target.url,
      {
        method: "GET",
        headers: { "User-Agent": CRAWLER_USER_AGENT },
        lookup: (hostname, options, callback) => {
          void lookupPinned(hostname, options as { all?: boolean })
            .then((result) => {
              if (Array.isArray(result)) {
                callback(null, result as never, undefined as never);
              } else {
                callback(null, result.address, result.family);
              }
            })
            .catch((error) => callback(error, "", 0));
        },
        servername: target.url.hostname,
        timeout: 8000,
      },
      (res) => {
        const chunks: Buffer[] = [];
        let size = 0;
        res.on("data", (chunk: Buffer) => {
          size += chunk.length;
          if (size > MAX_CRAWL_RESPONSE_BYTES) {
            req.destroy(new Error("Crawl response exceeded size limit."));
            return;
          }
          chunks.push(chunk);
        });
        res.on("end", () => {
          resolve(new Response(Buffer.concat(chunks), {
            status: res.statusCode ?? 0,
            headers: headersToRecord(res.headers),
          }));
        });
      },
    );
    req.on("timeout", () => req.destroy(new Error("Crawl request timed out.")));
    req.on("error", reject);
    req.end();
  });
}

async function fetchPage(
  url: string,
  scope: CrawlScope,
  options?: CrawlSecurityOptions,
  redirectsRemaining = options?.maxRedirects ?? DEFAULT_MAX_REDIRECTS
): Promise<{ html: string; status: number; url: string } | null> {
  try {
    const safeTarget = await assertSafeCrawlTarget(url, scope, options);
    const safeUrl = safeTarget.url;
    const res = options?.fetchImpl
      ? await options.fetchImpl(safeUrl, {
          headers: { "User-Agent": CRAWLER_USER_AGENT },
          signal: AbortSignal.timeout(8000),
          redirect: "manual",
        })
      : await fetchPinnedCrawlTarget(safeTarget);

    if (res.status >= 300 && res.status < 400 && redirectsRemaining > 0) {
      const location = res.headers.get("location");
      const redirectedUrl = location
        ? normalizeCrawlUrl(safeUrl.toString(), location, scope, options)
        : null;
      if (!redirectedUrl) return { html: "", status: res.status, url: safeUrl.toString() };
      return fetchPage(redirectedUrl, scope, options, redirectsRemaining - 1);
    }

    if (!res.ok) return { html: "", status: res.status, url: safeUrl.toString() };
    const html = await res.text();
    return { html, status: res.status, url: safeUrl.toString() };
  } catch {
    return null;
  }
}

function normalizeText(input: string) {
  return input.replace(/\s+/g, " ").trim();
}

function countWords(input: string): number {
  if (!input) return 0;
  return input.split(/\s+/).filter(Boolean).length;
}

export async function crawlWebsite(
  startUrl: string,
  maxPages = DEFAULT_MAX_PAGES,
  options?: CrawlSecurityOptions
): Promise<CrawlResult> {
  const scope = createCrawlScope(startUrl);

  let urlToStart = startUrl;
  if (startUrl.startsWith("sc-domain:")) {
    urlToStart = `https://${startUrl.replace("sc-domain:", "")}`;
  }

  const normalizedStartUrl = (await assertSafeCrawlUrl(urlToStart, scope, options)).toString();

  const visited = new Set<string>();
  const toVisit: string[] = [normalizedStartUrl];
  const pages: PageIssue[] = [];
  const brokenLinks: string[] = [];

  while (toVisit.length > 0 && pages.length < maxPages) {
    const url = toVisit.shift()!;
    if (visited.has(url)) continue;
    visited.add(url);

    const result = await fetchPage(url, scope, options);
    if (!result) continue;

    if (result.status >= 400) {
      brokenLinks.push(result.url);
      continue;
    }

    if (result.url !== url) {
      if (visited.has(result.url)) continue;
      visited.add(result.url);
    }

    const $ = cheerio.load(result.html);
    const issues: string[] = [];
    const pageUrl = result.url;

    const title = $("title").text().trim();
    const metaDescription = $("meta[name=\"description\"]").attr("content")?.trim() ?? "";
    const h1Tags = $("h1");
    const h1Count = h1Tags.length;
    const h1Texts = h1Tags
      .map((_, el) => normalizeText($(el).text()))
      .get()
      .filter(Boolean)
      .slice(0, 10);

    const canonicalRaw = $("link[rel=\"canonical\"]").attr("href")?.trim() ?? "";
    const canonicalUrl = normalizeCrawlUrl(pageUrl, canonicalRaw, scope, options) ?? pageUrl;

    const bodyText = normalizeText($("body").text());
    const visibleTextExcerpt = bodyText.slice(0, 4000);
    const visibleWordCount = countWords(bodyText);
    const robotsContent = [
      $("meta[name=\"robots\"]").attr("content") ?? "",
      $("meta[name=\"googlebot\"]").attr("content") ?? "",
    ]
      .join(",")
      .toLowerCase();
    const noindex = robotsContent.split(",").map((value) => value.trim()).includes("noindex");
    const nofollow = robotsContent.split(",").map((value) => value.trim()).includes("nofollow");
    const imageMissingAltCount = $("img")
      .filter((_, el) => !(($(el).attr("alt") ?? "").trim()))
      .length;
    const hasStructuredData = $("script[type=\"application/ld+json\"]").length > 0;
    const hasViewportMeta = Boolean($("meta[name=\"viewport\"]").attr("content")?.trim());

    if (!title) issues.push("Missing <title> tag");
    if (!metaDescription) issues.push("Missing meta description");
    if (h1Count === 0) issues.push("Missing <h1> tag");
    if (h1Count > 1) issues.push(`Multiple <h1> tags (${h1Count} found)`);
    if (canonicalUrl !== pageUrl) issues.push("Canonical URL points to a different URL");
    if (noindex) issues.push("Page is marked noindex");
    if (nofollow) issues.push("Page is marked nofollow");
    if (imageMissingAltCount > 0) {
      issues.push(`Images missing alt text (${imageMissingAltCount} found)`);
    }
    if (!hasViewportMeta) issues.push("Missing viewport meta tag");
    if (!hasStructuredData) issues.push("Missing structured data");
    if (visibleWordCount > 0 && visibleWordCount < 150) {
      issues.push(`Thin visible text (${visibleWordCount} words)`);
    }

    pages.push({
      url: pageUrl,
      canonicalUrl,
      issues,
      title,
      metaDescription,
      h1Count,
      h1Texts,
      visibleTextExcerpt,
      noindex,
      nofollow,
      imageMissingAltCount,
      hasStructuredData,
      hasViewportMeta,
      visibleWordCount,
    });

    $("a[href]").each((_, el) => {
      const href = $(el).attr("href") ?? "";
      const normalized = normalizeCrawlUrl(pageUrl, href, scope, options);
      if (normalized && !visited.has(normalized)) {
        toVisit.push(normalized);
      }
    });
  }

  const summary = {
    missingTitle: pages.filter((page) => page.issues.some((issue) => issue.includes("<title>"))).length,
    missingMeta: pages.filter((page) => page.issues.some((issue) => issue.includes("meta description"))).length,
    missingH1: pages.filter((page) => page.h1Count === 0).length,
    multipleH1: pages.filter((page) => page.h1Count > 1).length,
    brokenLinks: brokenLinks.length,
    noindexPages: pages.filter((page) => page.noindex).length,
    canonicalMismatch: pages.filter((page) => page.canonicalUrl !== page.url).length,
    imageMissingAlt: pages.reduce(
      (total, page) => total + (page.imageMissingAltCount ?? 0),
      0
    ),
    missingStructuredData: pages.filter((page) => !page.hasStructuredData).length,
    missingViewportMeta: pages.filter((page) => !page.hasViewportMeta).length,
    thinContent: pages.filter(
      (page) => (page.visibleWordCount ?? Number.POSITIVE_INFINITY) < 150
    ).length,
  };

  return { pages, brokenLinks, summary };
}
