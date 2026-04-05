import {
  getArtifactStore
} from "./chunk-ZNCV7UFM.js";
import {
  db
} from "./chunk-VEW7T2CC.js";
import {
  aiReportSettings,
  crawlPageSnapshots,
  ga4DailyFacts,
  ga4DailyRaw,
  gscDailyFacts,
  gscDailyRaw,
  metricsBackfillJobs,
  propertyPageRegistry,
  reportDetailAiExpansions,
  reportJobEvents,
  reportJobs,
  reports,
  systemLogs,
  teamMembers
} from "./chunk-S6A2XRFT.js";
import {
  requireDirectDatabaseUrl
} from "./chunk-6RLW34GO.js";
import "./chunk-3LHI6BO3.js";

// ../../packages/shared/src/lib/queue/report-worker.ts
import OpenAI from "openai";
import { nanoid as nanoid4 } from "nanoid";
import postgres from "postgres";
import { and as and4, eq as eq5, gte, lte, sql as sql2 } from "drizzle-orm";

// ../../packages/shared/src/lib/crawl.ts
import { lookup } from "node:dns/promises";
import { isIP } from "node:net";
import * as cheerio from "cheerio";
var DEFAULT_MAX_PAGES = 50;
var DEFAULT_MAX_REDIRECTS = 5;
var CRAWLER_USER_AGENT = "WebAubit-Crawler/1.0";
var METADATA_IPV4 = "169.254.169.254";
async function resolveHostAddresses(hostname) {
  const results = await lookup(hostname, { all: true, verbatim: true });
  return results.map((result) => ({ address: result.address, family: result.family }));
}
function normalizeHost(hostname) {
  return hostname.trim().replace(/\.$/, "").toLowerCase();
}
function isLocalDevHostname(hostname) {
  const normalized = normalizeHost(hostname);
  return normalized === "localhost" || normalized.endsWith(".localhost") || normalized === "127.0.0.1" || normalized === "::1";
}
function parseIpv4ToInt(address) {
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
function ipv4InCidr(address, network, prefixLength) {
  const ipValue = parseIpv4ToInt(address);
  const networkValue = parseIpv4ToInt(network);
  if (ipValue === null || networkValue === null) return false;
  const mask = prefixLength === 0 ? 0 : 4294967295 << 32 - prefixLength >>> 0;
  return (ipValue & mask) === (networkValue & mask);
}
function expandIpv6(address) {
  const normalized = address.toLowerCase();
  if (!normalized.includes(":")) return null;
  const doubleColonParts = normalized.split("::");
  if (doubleColonParts.length > 2) return null;
  const [head, tail] = doubleColonParts;
  const headParts = head ? head.split(":").filter(Boolean) : [];
  const tailParts = tail ? tail.split(":").filter(Boolean) : [];
  const expandedTail = [...tailParts];
  if (expandedTail.length > 0 && expandedTail[expandedTail.length - 1]?.includes(".")) {
    const ipv4Value = parseIpv4ToInt(expandedTail[expandedTail.length - 1]);
    if (ipv4Value === null) return null;
    expandedTail.pop();
    expandedTail.push((ipv4Value >>> 16 & 65535).toString(16));
    expandedTail.push((ipv4Value & 65535).toString(16));
  }
  const totalParts = headParts.length + expandedTail.length;
  if (totalParts > 8) return null;
  const filler = new Array(8 - totalParts).fill("0");
  const result = [...headParts, ...filler, ...expandedTail].map((part) => {
    const parsed = Number.parseInt(part || "0", 16);
    if (!Number.isInteger(parsed) || parsed < 0 || parsed > 65535) {
      return null;
    }
    return parsed.toString(16).padStart(4, "0");
  });
  return result.every(Boolean) ? result : null;
}
function ipv6HasPrefix(address, prefix, prefixLength) {
  const ipParts = expandIpv6(address);
  const prefixParts = expandIpv6(prefix);
  if (!ipParts || !prefixParts) return false;
  let remainingBits = prefixLength;
  for (let index = 0; index < 8; index += 1) {
    if (remainingBits <= 0) return true;
    const bits = Math.min(remainingBits, 16);
    const mask = bits === 16 ? 65535 : 65535 << 16 - bits & 65535;
    const ipValue = Number.parseInt(ipParts[index], 16);
    const prefixValue = Number.parseInt(prefixParts[index], 16);
    if ((ipValue & mask) !== (prefixValue & mask)) {
      return false;
    }
    remainingBits -= bits;
  }
  return true;
}
function extractMappedIpv4FromIpv6(address) {
  const parts = expandIpv6(address);
  if (!parts) return null;
  const isMapped = parts[0] === "0000" && parts[1] === "0000" && parts[2] === "0000" && parts[3] === "0000" && parts[4] === "0000" && parts[5] === "ffff";
  if (!isMapped) return null;
  const high = Number.parseInt(parts[6], 16);
  const low = Number.parseInt(parts[7], 16);
  if (!Number.isInteger(high) || !Number.isInteger(low)) return null;
  return [
    high >>> 8 & 255,
    high & 255,
    low >>> 8 & 255,
    low & 255
  ].join(".");
}
function isBlockedCrawlIpAddress(address) {
  const normalized = address.trim().toLowerCase();
  const family = isIP(normalized);
  if (family === 4) {
    return normalized === METADATA_IPV4 || ipv4InCidr(normalized, "0.0.0.0", 8) || ipv4InCidr(normalized, "10.0.0.0", 8) || ipv4InCidr(normalized, "100.64.0.0", 10) || ipv4InCidr(normalized, "127.0.0.0", 8) || ipv4InCidr(normalized, "169.254.0.0", 16) || ipv4InCidr(normalized, "172.16.0.0", 12) || ipv4InCidr(normalized, "192.0.0.0", 24) || ipv4InCidr(normalized, "192.0.2.0", 24) || ipv4InCidr(normalized, "192.168.0.0", 16) || ipv4InCidr(normalized, "198.18.0.0", 15) || ipv4InCidr(normalized, "198.51.100.0", 24) || ipv4InCidr(normalized, "203.0.113.0", 24) || ipv4InCidr(normalized, "224.0.0.0", 4) || ipv4InCidr(normalized, "240.0.0.0", 4);
  }
  if (family === 6) {
    const mappedIpv4 = extractMappedIpv4FromIpv6(normalized);
    if (mappedIpv4) {
      return isBlockedCrawlIpAddress(mappedIpv4);
    }
    return normalized === "::" || normalized === "::1" || ipv6HasPrefix(normalized, "fe80::", 10) || ipv6HasPrefix(normalized, "fc00::", 7) || ipv6HasPrefix(normalized, "ff00::", 8) || ipv6HasPrefix(normalized, "2001:db8::", 32);
  }
  return false;
}
function isAllowedCrawlProtocol(url, options) {
  if (url.protocol === "https:") return true;
  if (url.protocol !== "http:") return false;
  return process.env.NODE_ENV !== "production" && options?.allowHttpLocalhost === true && isLocalDevHostname(url.hostname);
}
function createCrawlScope(startUrl) {
  if (startUrl.startsWith("sc-domain:")) {
    return { kind: "domain", value: normalizeHost(startUrl.replace("sc-domain:", "")) };
  }
  const url = new URL(startUrl);
  return { kind: "host", value: normalizeHost(url.hostname) };
}
function isHostnameWithinScope(hostname, scope) {
  const normalized = normalizeHost(hostname);
  if (scope.kind === "host") {
    return normalized === scope.value;
  }
  return normalized === scope.value || normalized.endsWith(`.${scope.value}`);
}
function normalizeCrawlUrl(base, href, scope, options) {
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
async function assertSafeCrawlUrl(input, scope, options) {
  const url = new URL(input);
  if (!isAllowedCrawlProtocol(url, options)) {
    throw new Error(`Disallowed crawl protocol for ${url.toString()}`);
  }
  if (!isHostnameWithinScope(url.hostname, scope)) {
    throw new Error(`Crawl target escaped verified scope: ${url.hostname}`);
  }
  const hostname = normalizeHost(url.hostname);
  const addressFamily = isIP(hostname);
  const addresses = addressFamily > 0 ? [{ address: hostname, family: addressFamily }] : await (options?.dnsLookup ?? resolveHostAddresses)(hostname);
  if (!addresses.length) {
    throw new Error(`Crawl target did not resolve: ${hostname}`);
  }
  for (const entry of addresses) {
    if (isBlockedCrawlIpAddress(entry.address)) {
      throw new Error(`Blocked crawl target address: ${entry.address}`);
    }
  }
  return url;
}
async function fetchPage(url, scope, options, redirectsRemaining = options?.maxRedirects ?? DEFAULT_MAX_REDIRECTS) {
  try {
    const safeUrl = await assertSafeCrawlUrl(url, scope, options);
    const res = await (options?.fetchImpl ?? fetch)(safeUrl, {
      headers: { "User-Agent": CRAWLER_USER_AGENT },
      signal: AbortSignal.timeout(8e3),
      redirect: "manual"
    });
    if (res.status >= 300 && res.status < 400 && redirectsRemaining > 0) {
      const location = res.headers.get("location");
      const redirectedUrl = location ? normalizeCrawlUrl(safeUrl.toString(), location, scope, options) : null;
      if (!redirectedUrl) return { html: "", status: res.status };
      return fetchPage(redirectedUrl, scope, options, redirectsRemaining - 1);
    }
    if (!res.ok) return { html: "", status: res.status };
    const html = await res.text();
    return { html, status: res.status };
  } catch {
    return null;
  }
}
function normalizeText(input) {
  return input.replace(/\s+/g, " ").trim();
}
async function crawlWebsite(startUrl, maxPages = DEFAULT_MAX_PAGES, options) {
  const scope = createCrawlScope(startUrl);
  let urlToStart = startUrl;
  if (startUrl.startsWith("sc-domain:")) {
    urlToStart = `https://${startUrl.replace("sc-domain:", "")}`;
  }
  const normalizedStartUrl = (await assertSafeCrawlUrl(urlToStart, scope, options)).toString();
  const visited = /* @__PURE__ */ new Set();
  const toVisit = [normalizedStartUrl];
  const pages = [];
  const brokenLinks = [];
  while (toVisit.length > 0 && pages.length < maxPages) {
    const url = toVisit.shift();
    if (visited.has(url)) continue;
    visited.add(url);
    const result = await fetchPage(url, scope, options);
    if (!result) continue;
    if (result.status >= 400) {
      brokenLinks.push(url);
      continue;
    }
    const $ = cheerio.load(result.html);
    const issues = [];
    const title = $("title").text().trim();
    const metaDescription = $('meta[name="description"]').attr("content")?.trim() ?? "";
    const h1Tags = $("h1");
    const h1Count = h1Tags.length;
    const h1Texts = h1Tags.map((_, el) => normalizeText($(el).text())).get().filter(Boolean).slice(0, 10);
    const canonicalRaw = $('link[rel="canonical"]').attr("href")?.trim() ?? "";
    const canonicalUrl = normalizeCrawlUrl(url, canonicalRaw, scope, options) ?? url;
    const bodyText = normalizeText($("body").text());
    const visibleTextExcerpt = bodyText.slice(0, 4e3);
    if (!title) issues.push("Missing <title> tag");
    if (!metaDescription) issues.push("Missing meta description");
    if (h1Count === 0) issues.push("Missing <h1> tag");
    if (h1Count > 1) issues.push(`Multiple <h1> tags (${h1Count} found)`);
    pages.push({
      url,
      canonicalUrl,
      issues,
      title,
      metaDescription,
      h1Count,
      h1Texts,
      visibleTextExcerpt
    });
    $("a[href]").each((_, el) => {
      const href = $(el).attr("href") ?? "";
      const normalized = normalizeCrawlUrl(url, href, scope, options);
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
    brokenLinks: brokenLinks.length
  };
  return { pages, brokenLinks, summary };
}

// ../../packages/shared/src/lib/feature-flags.ts
async function isEnabled(flagName, userId) {
  const flag = await db.query.featureFlags.findFirst({
    where: (f, { eq: eq6 }) => eq6(f.name, flagName)
  });
  if (!flag) return true;
  const override = await db.query.userFeatureFlags.findFirst({
    where: (uff, { and: and5, eq: eq6 }) => and5(eq6(uff.flagId, flag.id), eq6(uff.userId, userId))
  });
  if (override !== void 0) return override.enabled;
  return flag.enabledGlobally;
}

// ../../packages/shared/src/lib/google/api.ts
import { google } from "googleapis";
function getGoogleAuthClient(accessToken, refreshToken, expiresAt) {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.BETTER_AUTH_URL
  );
  oauth2Client.setCredentials({
    access_token: accessToken,
    refresh_token: refreshToken,
    expiry_date: expiresAt?.getTime()
  });
  return oauth2Client;
}
async function fetchGscMetrics(authClient, siteUrl, startDate, endDate) {
  const searchConsole = google.webmasters({ version: "v3", auth: authClient });
  const summaryRes = await searchConsole.searchanalytics.query({
    siteUrl,
    requestBody: { startDate, endDate, dimensions: [], rowLimit: 1 }
  });
  const summaryRow = summaryRes.data.rows?.[0];
  const queriesRes = await searchConsole.searchanalytics.query({
    siteUrl,
    requestBody: { startDate, endDate, dimensions: ["query"], rowLimit: 25 }
  });
  const pagesRes = await searchConsole.searchanalytics.query({
    siteUrl,
    requestBody: { startDate, endDate, dimensions: ["page"], rowLimit: 25 }
  });
  return {
    clicks: summaryRow?.clicks ?? 0,
    impressions: summaryRow?.impressions ?? 0,
    ctr: summaryRow?.ctr ?? 0,
    position: summaryRow?.position ?? 0,
    topQueries: (queriesRes.data.rows ?? []).map((row) => ({
      query: row.keys[0],
      clicks: row.clicks,
      impressions: row.impressions,
      ctr: row.ctr,
      position: row.position
    })),
    topPages: (pagesRes.data.rows ?? []).map((row) => ({
      page: row.keys[0],
      clicks: row.clicks,
      impressions: row.impressions
    }))
  };
}
async function fetchGscQueryPagePairs(authClient, siteUrl, startDate, endDate, rowLimit = 2500) {
  const searchConsole = google.webmasters({ version: "v3", auth: authClient });
  const response = await searchConsole.searchanalytics.query({
    siteUrl,
    requestBody: {
      startDate,
      endDate,
      dimensions: ["query", "page"],
      rowLimit
    }
  });
  return (response.data.rows ?? []).map((row) => {
    const rowRecord = row;
    const keys = Array.isArray(rowRecord.keys) ? rowRecord.keys : [];
    return {
      query: keys[0] ?? "",
      page: keys[1] ?? "",
      clicks: typeof rowRecord.clicks === "number" ? rowRecord.clicks : 0,
      impressions: typeof rowRecord.impressions === "number" ? rowRecord.impressions : 0,
      ctr: typeof rowRecord.ctr === "number" ? rowRecord.ctr : 0,
      position: typeof rowRecord.position === "number" ? rowRecord.position : 0
    };
  });
}
async function fetchGscMetricsBatch(authClient, siteUrl, dateStart, dateEnd) {
  const searchConsole = google.webmasters({ version: "v3", auth: authClient });
  const [dailyRes, queriesRes, pagesRes, countriesRes, devicesRes] = await Promise.all([
    // 1. Daily summary
    searchConsole.searchanalytics.query({
      siteUrl,
      requestBody: { startDate: dateStart, endDate: dateEnd, dimensions: ["date"], rowLimit: 25e3 }
    }),
    // 2. Daily top queries
    searchConsole.searchanalytics.query({
      siteUrl,
      requestBody: { startDate: dateStart, endDate: dateEnd, dimensions: ["date", "query"], rowLimit: 25e3 }
    }),
    // 3. Daily top pages
    searchConsole.searchanalytics.query({
      siteUrl,
      requestBody: { startDate: dateStart, endDate: dateEnd, dimensions: ["date", "page"], rowLimit: 25e3 }
    }),
    // 4. Daily country breakdown
    searchConsole.searchanalytics.query({
      siteUrl,
      requestBody: { startDate: dateStart, endDate: dateEnd, dimensions: ["date", "country"], rowLimit: 25e3 }
    }),
    // 5. Daily device breakdown
    searchConsole.searchanalytics.query({
      siteUrl,
      requestBody: { startDate: dateStart, endDate: dateEnd, dimensions: ["date", "device"], rowLimit: 25e3 }
    })
  ]);
  const dayMap = /* @__PURE__ */ new Map();
  for (const row of dailyRes.data.rows ?? []) {
    const date = row.keys[0];
    dayMap.set(date, {
      clicks: row.clicks ?? 0,
      impressions: row.impressions ?? 0,
      ctr: row.ctr ?? 0,
      position: row.position ?? 0,
      topQueries: [],
      topPages: [],
      topCountries: [],
      topDevices: []
    });
  }
  const queriesByDay = /* @__PURE__ */ new Map();
  for (const row of queriesRes.data.rows ?? []) {
    const [date, query] = row.keys;
    if (!queriesByDay.has(date)) queriesByDay.set(date, []);
    queriesByDay.get(date).push({
      query,
      clicks: row.clicks ?? 0,
      impressions: row.impressions ?? 0,
      ctr: row.ctr ?? 0,
      position: row.position ?? 0
    });
  }
  const pagesByDay = /* @__PURE__ */ new Map();
  for (const row of pagesRes.data.rows ?? []) {
    const [date, page] = row.keys;
    if (!pagesByDay.has(date)) pagesByDay.set(date, []);
    pagesByDay.get(date).push({
      page,
      clicks: row.clicks ?? 0,
      impressions: row.impressions ?? 0
    });
  }
  const countriesByDay = /* @__PURE__ */ new Map();
  for (const row of countriesRes.data.rows ?? []) {
    const [date, country] = row.keys;
    if (!countriesByDay.has(date)) countriesByDay.set(date, []);
    countriesByDay.get(date).push({
      country,
      clicks: row.clicks ?? 0,
      impressions: row.impressions ?? 0,
      ctr: row.ctr ?? 0,
      position: row.position ?? 0
    });
  }
  const devicesByDay = /* @__PURE__ */ new Map();
  for (const row of devicesRes.data.rows ?? []) {
    const [date, device] = row.keys;
    if (!devicesByDay.has(date)) devicesByDay.set(date, []);
    devicesByDay.get(date).push({
      device,
      clicks: row.clicks ?? 0,
      impressions: row.impressions ?? 0,
      ctr: row.ctr ?? 0,
      position: row.position ?? 0
    });
  }
  for (const [date, entry] of dayMap) {
    const queries = queriesByDay.get(date) ?? [];
    entry.topQueries = queries.sort((a, b) => b.clicks - a.clicks).slice(0, 25);
    const pages = pagesByDay.get(date) ?? [];
    entry.topPages = pages.sort((a, b) => b.clicks - a.clicks).slice(0, 25);
    entry.topCountries = countriesByDay.get(date) ?? [];
    entry.topDevices = devicesByDay.get(date) ?? [];
  }
  return dayMap;
}
async function fetchGa4Metrics(authClient, propertyId, startDate, endDate) {
  const analyticsData = google.analyticsdata({ version: "v1beta", auth: authClient });
  const response = await analyticsData.properties.runReport({
    property: `properties/${propertyId}`,
    requestBody: {
      dateRanges: [{ startDate, endDate }],
      metrics: [{ name: "sessions" }, { name: "totalUsers" }, { name: "newUsers" }]
    }
  });
  const row = response.data.rows?.[0]?.metricValues;
  return {
    sessions: parseInt(row?.[0]?.value ?? "0"),
    users: parseInt(row?.[1]?.value ?? "0"),
    newUsers: parseInt(row?.[2]?.value ?? "0")
  };
}
async function fetchGa4DailySummary(authClient, propertyId, dateStart, dateEnd) {
  const analyticsData = google.analyticsdata({ version: "v1beta", auth: authClient });
  const response = await analyticsData.properties.runReport({
    property: `properties/${propertyId}`,
    requestBody: {
      dateRanges: [{ startDate: dateStart, endDate: dateEnd }],
      dimensions: [{ name: "date" }],
      metrics: [
        { name: "sessions" },
        { name: "totalUsers" },
        { name: "newUsers" }
      ]
    }
  });
  const result = /* @__PURE__ */ new Map();
  for (const row of response.data.rows ?? []) {
    const rawDate = row.dimensionValues?.[0]?.value ?? "";
    const date = rawDate.length === 8 ? `${rawDate.slice(0, 4)}-${rawDate.slice(4, 6)}-${rawDate.slice(6, 8)}` : rawDate;
    const mv = row.metricValues ?? [];
    result.set(date, {
      sessions: parseInt(mv[0]?.value ?? "0"),
      users: parseInt(mv[1]?.value ?? "0"),
      newUsers: parseInt(mv[2]?.value ?? "0")
    });
  }
  return result;
}
async function fetchGa4ProfileForPeriod(analyticsData, property, startDate, endDate) {
  const dateRanges = [{ startDate, endDate }];
  function parseRows(report, mapper) {
    return (report?.rows ?? []).map((row) => {
      const dims = (row.dimensionValues ?? []).map((d) => d.value ?? "");
      const mets = (row.metricValues ?? []).map((m) => m.value ?? "0");
      return mapper(dims, mets);
    });
  }
  const [batch1Res, batch2Res] = await Promise.all([
    analyticsData.properties.batchRunReports({
      property,
      requestBody: {
        requests: [
          {
            dateRanges,
            dimensions: [{ name: "pagePath" }],
            metrics: [{ name: "screenPageViews" }, { name: "sessions" }],
            limit: "25"
          },
          {
            dateRanges,
            dimensions: [{ name: "sessionMedium" }],
            metrics: [{ name: "sessions" }, { name: "totalUsers" }],
            limit: "25"
          },
          {
            dateRanges,
            dimensions: [{ name: "deviceCategory" }],
            metrics: [{ name: "sessions" }, { name: "totalUsers" }]
          },
          {
            dateRanges,
            dimensions: [{ name: "country" }],
            metrics: [{ name: "totalUsers" }, { name: "sessions" }],
            limit: "25"
          },
          {
            dateRanges,
            dimensions: [{ name: "eventName" }],
            metrics: [{ name: "eventCount" }, { name: "totalUsers" }],
            limit: "25"
          }
        ]
      }
    }),
    analyticsData.properties.batchRunReports({
      property,
      requestBody: {
        requests: [
          {
            dateRanges,
            dimensions: [{ name: "operatingSystem" }],
            metrics: [{ name: "sessions" }],
            limit: "10"
          },
          {
            dateRanges,
            dimensions: [{ name: "landingPage" }],
            metrics: [{ name: "sessions" }, { name: "screenPageViews" }],
            limit: "25"
          },
          {
            dateRanges,
            dimensions: [{ name: "firstUserMedium" }],
            metrics: [{ name: "totalUsers" }],
            limit: "25"
          }
        ]
      }
    })
  ]);
  const reports1 = batch1Res.data.reports ?? [];
  const reports2 = batch2Res.data.reports ?? [];
  return {
    topPages: parseRows(reports1[0], (dims, mets) => ({
      pagePath: dims[0],
      pageviews: parseInt(mets[0]),
      sessions: parseInt(mets[1])
    })),
    trafficSources: parseRows(reports1[1], (dims, mets) => ({
      medium: dims[0],
      sessions: parseInt(mets[0]),
      users: parseInt(mets[1])
    })),
    deviceBreakdown: parseRows(reports1[2], (dims, mets) => ({
      device: dims[0],
      sessions: parseInt(mets[0]),
      users: parseInt(mets[1])
    })),
    countryBreakdown: parseRows(reports1[3], (dims, mets) => ({
      country: dims[0],
      users: parseInt(mets[0]),
      sessions: parseInt(mets[1])
    })),
    events: parseRows(reports1[4], (dims, mets) => ({
      eventName: dims[0],
      eventCount: parseInt(mets[0]),
      totalUsers: parseInt(mets[1])
    })),
    osBreakdown: parseRows(reports2[0], (dims, mets) => ({
      os: dims[0],
      sessions: parseInt(mets[0])
    })),
    landingPages: parseRows(reports2[1], (dims, mets) => ({
      landingPage: dims[0],
      sessions: parseInt(mets[0]),
      pageviews: parseInt(mets[1])
    })),
    acquisitionChannels: parseRows(reports2[2], (dims, mets) => ({
      channel: dims[0],
      users: parseInt(mets[0])
    }))
  };
}
async function fetchGa4ReportProfile(authClient, propertyId, currentStart, currentEnd, compareStart, compareEnd) {
  const analyticsData = google.analyticsdata({ version: "v1beta", auth: authClient });
  const property = `properties/${propertyId}`;
  const [current, compare] = await Promise.all([
    fetchGa4ProfileForPeriod(analyticsData, property, currentStart, currentEnd),
    fetchGa4ProfileForPeriod(analyticsData, property, compareStart, compareEnd)
  ]);
  return { current, compare };
}

// ../../packages/shared/src/lib/metrics-cache.ts
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
var ZERO_TOTALS = () => ({
  gscRequestedDates: 0,
  gscFetchedDates: 0,
  gscSkippedDates: 0,
  gscRefreshedDates: 0,
  gscFailedDates: 0,
  ga4RequestedDates: 0,
  ga4FetchedDates: 0,
  ga4SkippedDates: 0,
  ga4RefreshedDates: 0,
  ga4FailedDates: 0,
  gscValidated: 0,
  ga4Validated: 0,
  gscValidationFailed: 0,
  ga4ValidationFailed: 0
});
function toDateString(d) {
  return d.toISOString().slice(0, 10);
}
function normalizeDateStr(val) {
  if (val instanceof Date) return val.toISOString().slice(0, 10);
  return String(val).slice(0, 10);
}
function eachDateInRange(start, end) {
  const out = [];
  const cursor = /* @__PURE__ */ new Date(`${start}T00:00:00.000Z`);
  const last = /* @__PURE__ */ new Date(`${end}T00:00:00.000Z`);
  while (cursor <= last) {
    out.push(toDateString(cursor));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return out;
}
function isWithinFreshWindow(sourceDate, refreshRecentDays) {
  const cutoff = /* @__PURE__ */ new Date();
  cutoff.setUTCHours(0, 0, 0, 0);
  cutoff.setUTCDate(cutoff.getUTCDate() - (refreshRecentDays - 1));
  return /* @__PURE__ */ new Date(`${sourceDate}T00:00:00.000Z`) >= cutoff;
}
function parseFactNumber(value) {
  if (!value) return 0;
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}
async function upsertGscDayData(params) {
  const now = /* @__PURE__ */ new Date();
  const { teamId, property, sourceDate, metrics, syncJobId } = params;
  const rawId = `gscr_${nanoid(12)}`;
  await db.insert(gscDailyRaw).values({
    id: rawId,
    teamId,
    propertyId: property.id,
    sourceDate,
    siteUrl: property.url,
    summaryPayload: {
      clicks: metrics.clicks,
      impressions: metrics.impressions,
      ctr: metrics.ctr,
      position: metrics.position
    },
    queriesPayload: metrics.topQueries,
    pagesPayload: metrics.topPages,
    countriesPayload: metrics.topCountries,
    devicesPayload: metrics.topDevices,
    fetchedAt: now,
    syncJobId: syncJobId ?? null
  }).onConflictDoUpdate({
    target: [gscDailyRaw.propertyId, gscDailyRaw.sourceDate],
    set: {
      siteUrl: property.url,
      summaryPayload: {
        clicks: metrics.clicks,
        impressions: metrics.impressions,
        ctr: metrics.ctr,
        position: metrics.position
      },
      queriesPayload: metrics.topQueries,
      pagesPayload: metrics.topPages,
      countriesPayload: metrics.topCountries,
      devicesPayload: metrics.topDevices,
      fetchedAt: now,
      syncJobId: syncJobId ?? null
    }
  });
  const factId = `gscf_${nanoid(12)}`;
  await db.insert(gscDailyFacts).values({
    id: factId,
    teamId,
    propertyId: property.id,
    sourceDate,
    clicks: metrics.clicks,
    impressions: metrics.impressions,
    ctr: String(metrics.ctr),
    position: String(metrics.position),
    queryCount: metrics.topQueries.length,
    pageCount: metrics.topPages.length,
    fetchedAt: now,
    updatedAt: now
  }).onConflictDoUpdate({
    target: [gscDailyFacts.propertyId, gscDailyFacts.sourceDate],
    set: {
      clicks: metrics.clicks,
      impressions: metrics.impressions,
      ctr: String(metrics.ctr),
      position: String(metrics.position),
      queryCount: metrics.topQueries.length,
      pageCount: metrics.topPages.length,
      fetchedAt: now,
      updatedAt: now
    }
  });
}
async function upsertGa4DayData(params) {
  const now = /* @__PURE__ */ new Date();
  const { teamId, gscPropertyId, ga4PropertyId, sourceDate, metrics, syncJobId } = params;
  const rawId = `ga4r_${nanoid(12)}`;
  await db.insert(ga4DailyRaw).values({
    id: rawId,
    teamId,
    gscPropertyId,
    ga4PropertyId,
    sourceDate,
    runReportPayload: metrics,
    fetchedAt: now,
    syncJobId: syncJobId ?? null
  }).onConflictDoUpdate({
    target: [ga4DailyRaw.ga4PropertyId, ga4DailyRaw.sourceDate],
    set: {
      gscPropertyId,
      runReportPayload: metrics,
      fetchedAt: now,
      syncJobId: syncJobId ?? null
    }
  });
  const factId = `ga4f_${nanoid(12)}`;
  await db.insert(ga4DailyFacts).values({
    id: factId,
    teamId,
    gscPropertyId,
    ga4PropertyId,
    sourceDate,
    sessions: metrics.sessions,
    users: metrics.users,
    newUsers: metrics.newUsers,
    fetchedAt: now,
    updatedAt: now
  }).onConflictDoUpdate({
    target: [ga4DailyFacts.ga4PropertyId, ga4DailyFacts.sourceDate],
    set: {
      gscPropertyId,
      sessions: metrics.sessions,
      users: metrics.users,
      newUsers: metrics.newUsers,
      fetchedAt: now,
      updatedAt: now
    }
  });
}
async function createMetricsBackfillJob(input) {
  const [job] = await db.insert(metricsBackfillJobs).values({
    id: `mbj_${nanoid(12)}`,
    teamId: input.teamId,
    triggeredByUserId: input.triggeredByUserId,
    targetUserId: input.targetUserId ?? null,
    targetPropertyId: input.targetPropertyId ?? null,
    includeGsc: input.includeGsc,
    includeGa4: input.includeGa4,
    timeframeMode: input.timeframeMode ?? "custom",
    dateStart: input.dateStart,
    dateEnd: input.dateEnd,
    refreshRecentDays: input.refreshRecentDays ?? 7,
    reason: input.reason,
    status: "queued"
  }).returning();
  return job;
}
async function getGscPropertiesForJob(job) {
  if (job.targetPropertyId) {
    return db.query.properties.findMany({
      where: (p, { and: and5, eq: eq6 }) => and5(eq6(p.teamId, job.teamId), eq6(p.id, job.targetPropertyId), eq6(p.type, "gsc"))
    });
  }
  return db.query.properties.findMany({
    where: (p, { and: and5, eq: eq6 }) => and5(eq6(p.teamId, job.teamId), eq6(p.type, "gsc"))
  });
}
async function existingGscDateSet(propertyId, start, end) {
  const rows = await db.query.gscDailyFacts.findMany({
    where: (t, { and: and5, eq: eq6, gte: gte2, lte: lte2 }) => and5(eq6(t.propertyId, propertyId), gte2(t.sourceDate, start), lte2(t.sourceDate, end)),
    columns: { sourceDate: true }
  });
  return new Set(rows.map((r) => normalizeDateStr(r.sourceDate)));
}
async function existingGa4DateSet(ga4PropertyId, start, end) {
  const rows = await db.query.ga4DailyFacts.findMany({
    where: (t, { and: and5, eq: eq6, gte: gte2, lte: lte2 }) => and5(eq6(t.ga4PropertyId, ga4PropertyId), gte2(t.sourceDate, start), lte2(t.sourceDate, end)),
    columns: { sourceDate: true }
  });
  return new Set(rows.map((r) => normalizeDateStr(r.sourceDate)));
}
async function processMetricsBackfillJob(args) {
  const job = await db.query.metricsBackfillJobs.findFirst({
    where: (j, { eq: eq6 }) => eq6(j.id, args.jobId)
  });
  if (!job) throw new Error("Metrics backfill job not found");
  const totals = ZERO_TOTALS();
  const gscValidatedProps = /* @__PURE__ */ new Set();
  const gscValidationFailedProps = /* @__PURE__ */ new Set();
  const ga4ValidatedProps = /* @__PURE__ */ new Set();
  const ga4ValidationFailedProps = /* @__PURE__ */ new Set();
  await db.update(metricsBackfillJobs).set({ status: "processing", startedAt: /* @__PURE__ */ new Date(), error: null }).where(eq(metricsBackfillJobs.id, job.id));
  const dateStart = String(job.dateStart);
  const dateEnd = String(job.dateEnd);
  const dates = eachDateInRange(dateStart, dateEnd);
  try {
    const gscProps = await getGscPropertiesForJob(job);
    if (job.includeGsc) {
      for (const prop of gscProps) {
        const existing = await existingGscDateSet(prop.id, dateStart, dateEnd);
        const datesToFetch = dates.filter((day) => {
          const exists = existing.has(day);
          const fresh = isWithinFreshWindow(day, job.refreshRecentDays);
          return !exists || fresh;
        });
        totals.gscRequestedDates += dates.length;
        totals.gscSkippedDates += dates.length - datesToFetch.length;
        if (datesToFetch.length === 0) {
          gscValidatedProps.add(prop.id);
          continue;
        }
        const fetchStart = datesToFetch[0];
        const fetchEnd = datesToFetch[datesToFetch.length - 1];
        try {
          const dayMap = await fetchGscMetricsBatch(args.authClient, prop.url, fetchStart, fetchEnd);
          for (const day of datesToFetch) {
            const metrics = dayMap.get(day);
            if (!metrics) {
              await upsertGscDayData({
                teamId: job.teamId,
                property: prop,
                sourceDate: day,
                metrics: {
                  clicks: 0,
                  impressions: 0,
                  ctr: 0,
                  position: 0,
                  topQueries: [],
                  topPages: [],
                  topCountries: [],
                  topDevices: []
                },
                syncJobId: job.id
              });
              totals.gscFetchedDates++;
              continue;
            }
            await upsertGscDayData({
              teamId: job.teamId,
              property: prop,
              sourceDate: day,
              metrics,
              syncJobId: job.id
            });
            totals.gscFetchedDates++;
            if (existing.has(day) && isWithinFreshWindow(day, job.refreshRecentDays)) {
              totals.gscRefreshedDates++;
            }
          }
          gscValidatedProps.add(prop.id);
        } catch {
          totals.gscFailedDates += datesToFetch.length;
          gscValidationFailedProps.add(prop.id);
        }
      }
    }
    if (job.includeGa4) {
      const linked = gscProps.filter((p) => !!p.ga4PropertyId);
      for (const prop of linked) {
        const ga4Id = prop.ga4PropertyId;
        const existing = await existingGa4DateSet(ga4Id, dateStart, dateEnd);
        const datesToFetch = dates.filter((day) => {
          const exists = existing.has(day);
          const fresh = isWithinFreshWindow(day, job.refreshRecentDays);
          return !exists || fresh;
        });
        totals.ga4RequestedDates += dates.length;
        totals.ga4SkippedDates += dates.length - datesToFetch.length;
        if (datesToFetch.length === 0) {
          ga4ValidatedProps.add(ga4Id);
          continue;
        }
        const fetchStart = datesToFetch[0];
        const fetchEnd = datesToFetch[datesToFetch.length - 1];
        try {
          const dayMap = await fetchGa4DailySummary(args.authClient, ga4Id, fetchStart, fetchEnd);
          for (const day of datesToFetch) {
            const metrics = dayMap.get(day) ?? { sessions: 0, users: 0, newUsers: 0 };
            await upsertGa4DayData({
              teamId: job.teamId,
              gscPropertyId: prop.id,
              ga4PropertyId: ga4Id,
              sourceDate: day,
              metrics,
              syncJobId: job.id
            });
            totals.ga4FetchedDates++;
            if (existing.has(day) && isWithinFreshWindow(day, job.refreshRecentDays)) {
              totals.ga4RefreshedDates++;
            }
          }
          ga4ValidatedProps.add(ga4Id);
        } catch {
          totals.ga4FailedDates += datesToFetch.length;
          ga4ValidationFailedProps.add(ga4Id);
        }
      }
    }
    totals.gscValidated = gscValidatedProps.size;
    totals.ga4Validated = ga4ValidatedProps.size;
    totals.gscValidationFailed = gscValidationFailedProps.size;
    totals.ga4ValidationFailed = ga4ValidationFailedProps.size;
    const finalStatus = totals.gscFailedDates > 0 || totals.ga4FailedDates > 0 ? "partial" : "complete";
    await db.update(metricsBackfillJobs).set({
      status: finalStatus,
      totals,
      finishedAt: /* @__PURE__ */ new Date()
    }).where(eq(metricsBackfillJobs.id, job.id));
    await db.insert(systemLogs).values({
      id: `log_${nanoid(12)}`,
      action: "metrics_sync",
      triggeredBy: job.triggeredByUserId,
      targetUserId: job.targetUserId ?? null,
      status: finalStatus === "complete" ? "success" : "failed",
      details: {
        jobId: job.id,
        reason: job.reason,
        includeGsc: job.includeGsc,
        includeGa4: job.includeGa4,
        dateStart: job.dateStart,
        dateEnd: job.dateEnd,
        totals
      }
    });
    return { jobId: job.id, status: finalStatus, totals };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Metrics backfill failed";
    await db.update(metricsBackfillJobs).set({
      status: "failed",
      error: message,
      totals,
      finishedAt: /* @__PURE__ */ new Date()
    }).where(eq(metricsBackfillJobs.id, job.id));
    throw error;
  }
}
function collectDateSet(rows) {
  return new Set(rows.map((r) => normalizeDateStr(r.sourceDate)));
}
function uniqueDateStrings(values) {
  return [...new Set(values)].sort();
}
async function getPropertyMetricsCoverage(params) {
  const refreshRecentDays = params.refreshRecentDays ?? 7;
  const requiredDates = eachDateInRange(params.dateStart, params.dateEnd);
  const [gscFactRows, gscRawRows] = await Promise.all([
    db.query.gscDailyFacts.findMany({
      where: (t, { and: and5, eq: eq6, gte: gte2, lte: lte2 }) => and5(eq6(t.propertyId, params.property.id), gte2(t.sourceDate, params.dateStart), lte2(t.sourceDate, params.dateEnd)),
      columns: { sourceDate: true }
    }),
    db.query.gscDailyRaw.findMany({
      where: (t, { and: and5, eq: eq6, gte: gte2, lte: lte2 }) => and5(eq6(t.propertyId, params.property.id), gte2(t.sourceDate, params.dateStart), lte2(t.sourceDate, params.dateEnd)),
      columns: { sourceDate: true }
    })
  ]);
  const gscFactSet = collectDateSet(gscFactRows);
  const gscRawSet = collectDateSet(gscRawRows);
  const missingGscDates = [];
  for (const d of requiredDates) {
    if (!gscFactSet.has(d) || !gscRawSet.has(d)) missingGscDates.push(d);
  }
  let missingGa4Dates = [];
  if (params.property.ga4PropertyId) {
    const [ga4FactRows, ga4RawRows] = await Promise.all([
      db.query.ga4DailyFacts.findMany({
        where: (t, { and: and5, eq: eq6, gte: gte2, lte: lte2 }) => and5(eq6(t.ga4PropertyId, params.property.ga4PropertyId), gte2(t.sourceDate, params.dateStart), lte2(t.sourceDate, params.dateEnd)),
        columns: { sourceDate: true }
      }),
      db.query.ga4DailyRaw.findMany({
        where: (t, { and: and5, eq: eq6, gte: gte2, lte: lte2 }) => and5(eq6(t.ga4PropertyId, params.property.ga4PropertyId), gte2(t.sourceDate, params.dateStart), lte2(t.sourceDate, params.dateEnd)),
        columns: { sourceDate: true }
      })
    ]);
    const ga4FactSet = collectDateSet(ga4FactRows);
    const ga4RawSet = collectDateSet(ga4RawRows);
    missingGa4Dates = requiredDates.filter((d) => !ga4FactSet.has(d) || !ga4RawSet.has(d));
  }
  const staleDates = requiredDates.filter((d) => isWithinFreshWindow(d, refreshRecentDays));
  return {
    requiredDates,
    staleDates,
    missingGscDates: uniqueDateStrings(missingGscDates),
    missingGa4Dates: uniqueDateStrings(missingGa4Dates),
    gscComplete: missingGscDates.length === 0,
    ga4Complete: params.property.ga4PropertyId ? missingGa4Dates.length === 0 : true,
    complete: missingGscDates.length === 0 && (!params.property.ga4PropertyId || missingGa4Dates.length === 0)
  };
}
function aggregateGscTopQueries(rawRows) {
  const map = /* @__PURE__ */ new Map();
  for (const row of rawRows) {
    const items = Array.isArray(row.queriesPayload) ? row.queriesPayload : [];
    for (const item of items) {
      if (!item || typeof item !== "object") continue;
      const record = item;
      const key = String(record.query ?? "");
      if (!key) continue;
      const clicks = Number(record.clicks ?? 0);
      const impressions = Number(record.impressions ?? 0);
      const position = Number(record.position ?? 0);
      const cur = map.get(key) ?? { clicks: 0, impressions: 0, positionImpr: 0 };
      cur.clicks += clicks;
      cur.impressions += impressions;
      cur.positionImpr += position * Math.max(impressions, 1);
      map.set(key, cur);
    }
  }
  return [...map.entries()].map(([query, v]) => ({
    query,
    clicks: v.clicks,
    impressions: v.impressions,
    ctr: v.impressions > 0 ? v.clicks / v.impressions : 0,
    position: v.impressions > 0 ? v.positionImpr / v.impressions : 0
  })).sort((a, b) => b.clicks - a.clicks).slice(0, 25);
}
function aggregateGscTopPages(rawRows) {
  const map = /* @__PURE__ */ new Map();
  for (const row of rawRows) {
    const items = Array.isArray(row.pagesPayload) ? row.pagesPayload : [];
    for (const item of items) {
      if (!item || typeof item !== "object") continue;
      const record = item;
      const key = String(record.page ?? "");
      if (!key) continue;
      const clicks = Number(record.clicks ?? 0);
      const impressions = Number(record.impressions ?? 0);
      const cur = map.get(key) ?? { clicks: 0, impressions: 0 };
      cur.clicks += clicks;
      cur.impressions += impressions;
      map.set(key, cur);
    }
  }
  return [...map.entries()].map(([page, v]) => ({ page, clicks: v.clicks, impressions: v.impressions })).sort((a, b) => b.clicks - a.clicks).slice(0, 25);
}
function aggregateGscTopCountries(rawRows) {
  const map = /* @__PURE__ */ new Map();
  for (const row of rawRows) {
    const items = Array.isArray(row.countriesPayload) ? row.countriesPayload : [];
    for (const item of items) {
      if (!item || typeof item !== "object") continue;
      const record = item;
      const key = String(record.country ?? "");
      if (!key) continue;
      const clicks = Number(record.clicks ?? 0);
      const impressions = Number(record.impressions ?? 0);
      const cur = map.get(key) ?? { clicks: 0, impressions: 0 };
      cur.clicks += clicks;
      cur.impressions += impressions;
      map.set(key, cur);
    }
  }
  return [...map.entries()].map(([country, v]) => ({ country, clicks: v.clicks, impressions: v.impressions })).sort((a, b) => b.clicks - a.clicks).slice(0, 25);
}
function aggregateGscTopDevices(rawRows) {
  const map = /* @__PURE__ */ new Map();
  for (const row of rawRows) {
    const items = Array.isArray(row.devicesPayload) ? row.devicesPayload : [];
    for (const item of items) {
      if (!item || typeof item !== "object") continue;
      const record = item;
      const key = String(record.device ?? "");
      if (!key) continue;
      const clicks = Number(record.clicks ?? 0);
      const impressions = Number(record.impressions ?? 0);
      const cur = map.get(key) ?? { clicks: 0, impressions: 0 };
      cur.clicks += clicks;
      cur.impressions += impressions;
      map.set(key, cur);
    }
  }
  return [...map.entries()].map(([device, v]) => ({ device, clicks: v.clicks, impressions: v.impressions })).sort((a, b) => b.clicks - a.clicks);
}
function aggregateGscSummary(factRows) {
  const clicks = factRows.reduce((sum, r) => sum + r.clicks, 0);
  const impressions = factRows.reduce((sum, r) => sum + r.impressions, 0);
  const positionWeighted = factRows.reduce(
    (sum, r) => sum + parseFactNumber(r.position) * Math.max(r.impressions, 1),
    0
  );
  return {
    clicks,
    impressions,
    ctr: impressions > 0 ? clicks / impressions : 0,
    position: impressions > 0 ? positionWeighted / impressions : 0
  };
}
function aggregateGa4Summary(factRows) {
  return {
    sessions: factRows.reduce((sum, r) => sum + r.sessions, 0),
    users: factRows.reduce((sum, r) => sum + r.users, 0),
    newUsers: factRows.reduce((sum, r) => sum + (r.newUsers ?? 0), 0)
  };
}
async function loadGscRange(propertyId, start, end) {
  const [factRows, rawRows] = await Promise.all([
    db.query.gscDailyFacts.findMany({
      where: (t, { and: and5, eq: eq6, gte: gte2, lte: lte2 }) => and5(eq6(t.propertyId, propertyId), gte2(t.sourceDate, start), lte2(t.sourceDate, end)),
      orderBy: (t, { asc }) => [asc(t.sourceDate)]
    }),
    db.query.gscDailyRaw.findMany({
      where: (t, { and: and5, eq: eq6, gte: gte2, lte: lte2 }) => and5(eq6(t.propertyId, propertyId), gte2(t.sourceDate, start), lte2(t.sourceDate, end)),
      orderBy: (t, { asc }) => [asc(t.sourceDate)]
    })
  ]);
  return { factRows, rawRows };
}
async function loadGa4Range(ga4PropertyId, start, end) {
  const factRows = await db.query.ga4DailyFacts.findMany({
    where: (t, { and: and5, eq: eq6, gte: gte2, lte: lte2 }) => and5(eq6(t.ga4PropertyId, ga4PropertyId), gte2(t.sourceDate, start), lte2(t.sourceDate, end)),
    orderBy: (t, { asc }) => [asc(t.sourceDate)]
  });
  return { factRows };
}
async function composeReportMetricsFromCache(params) {
  if (params.property.type !== "gsc" && !params.property.id.startsWith("gsc_")) {
    throw new Error(`composeReportMetricsFromCache requires a GSC property; received ${params.property.id}`);
  }
  const refreshRecentDays = params.refreshRecentDays ?? 7;
  const currentCoverage = await getPropertyMetricsCoverage({
    property: params.property,
    dateStart: params.dateRangeStart,
    dateEnd: params.dateRangeEnd,
    refreshRecentDays
  });
  const compareCoverage = await getPropertyMetricsCoverage({
    property: params.property,
    dateStart: params.compareRangeStart,
    dateEnd: params.compareRangeEnd,
    refreshRecentDays
  });
  if (!currentCoverage.complete || !compareCoverage.complete) {
    return null;
  }
  const [gscCurrent, gscCompare] = await Promise.all([
    loadGscRange(params.property.id, params.dateRangeStart, params.dateRangeEnd),
    loadGscRange(params.property.id, params.compareRangeStart, params.compareRangeEnd)
  ]);
  if (gscCurrent.factRows.length !== eachDateInRange(params.dateRangeStart, params.dateRangeEnd).length || gscCompare.factRows.length !== eachDateInRange(params.compareRangeStart, params.compareRangeEnd).length) {
    return null;
  }
  const gscCurrentSummary = aggregateGscSummary(gscCurrent.factRows);
  const gscCompareSummary = aggregateGscSummary(gscCompare.factRows);
  let ga4Current = null;
  let ga4Compare = null;
  if (params.property.ga4PropertyId) {
    const [ga4CurRows, ga4CmpRows] = await Promise.all([
      loadGa4Range(params.property.ga4PropertyId, params.dateRangeStart, params.dateRangeEnd),
      loadGa4Range(params.property.ga4PropertyId, params.compareRangeStart, params.compareRangeEnd)
    ]);
    ga4Current = aggregateGa4Summary(ga4CurRows.factRows);
    ga4Compare = aggregateGa4Summary(ga4CmpRows.factRows);
  }
  return {
    gsc: {
      current: {
        ...gscCurrentSummary,
        topQueries: aggregateGscTopQueries(gscCurrent.rawRows),
        topPages: aggregateGscTopPages(gscCurrent.rawRows),
        topCountries: aggregateGscTopCountries(gscCurrent.rawRows),
        topDevices: aggregateGscTopDevices(gscCurrent.rawRows)
      },
      compare: {
        ...gscCompareSummary,
        topQueries: aggregateGscTopQueries(gscCompare.rawRows),
        topPages: aggregateGscTopPages(gscCompare.rawRows),
        topCountries: aggregateGscTopCountries(gscCompare.rawRows),
        topDevices: aggregateGscTopDevices(gscCompare.rawRows)
      }
    },
    ga4: {
      current: ga4Current,
      compare: ga4Compare
    }
  };
}
async function ensureMetricsCoverageForReport(params) {
  if (params.property.type !== "gsc" && !params.property.id.startsWith("gsc_")) {
    throw new Error(`ensureMetricsCoverageForReport requires a GSC property; received ${params.property.id}`);
  }
  const refreshRecentDays = params.refreshRecentDays ?? 7;
  const allDates = [
    ...eachDateInRange(params.dateRangeStart, params.dateRangeEnd),
    ...eachDateInRange(params.compareRangeStart, params.compareRangeEnd)
  ].sort();
  const dateStart = allDates[0];
  const dateEnd = allDates[allDates.length - 1];
  const [currentCoverage, compareCoverage] = await Promise.all([
    getPropertyMetricsCoverage({
      property: params.property,
      dateStart: params.dateRangeStart,
      dateEnd: params.dateRangeEnd,
      refreshRecentDays
    }),
    getPropertyMetricsCoverage({
      property: params.property,
      dateStart: params.compareRangeStart,
      dateEnd: params.compareRangeEnd,
      refreshRecentDays
    })
  ]);
  if (currentCoverage.complete && compareCoverage.complete) {
    return { needed: false, jobId: null, result: null };
  }
  const job = await createMetricsBackfillJob({
    teamId: params.teamId,
    triggeredByUserId: params.triggeredByUserId,
    targetPropertyId: params.property.id,
    includeGsc: true,
    includeGa4: !!params.property.ga4PropertyId,
    dateStart,
    dateEnd,
    reason: "report_preflight",
    timeframeMode: "custom",
    refreshRecentDays
  });
  const result = await processMetricsBackfillJob({ jobId: job.id, authClient: params.authClient });
  return { needed: true, jobId: job.id, result };
}

// ../../packages/shared/src/lib/openai/cost-estimator.ts
var MODEL_PRICING = {
  "gpt-5.2": { inputPer1M: 1.75, outputPer1M: 14, cachedInputPer1M: 0.175 },
  "gpt-5-mini": { inputPer1M: 0.25, outputPer1M: 2 },
  "gpt-5": { inputPer1M: 1.75, outputPer1M: 14, cachedInputPer1M: 0.175 },
  "gpt-5.3": { inputPer1M: 1.75, outputPer1M: 14, cachedInputPer1M: 0.175 }
};
function getPricing(model) {
  if (!model) return null;
  const normalized = model.toLowerCase();
  for (const [prefix, pricing] of Object.entries(MODEL_PRICING)) {
    if (normalized.startsWith(prefix)) return pricing;
  }
  return null;
}
function estimateOpenAICostUsd(model, usage) {
  if (!usage) return null;
  const pricing = getPricing(model);
  if (!pricing) return null;
  const inputTokens = usage.inputTokens ?? 0;
  const outputTokens = usage.outputTokens ?? 0;
  const cachedInputTokens = usage.cachedInputTokens ?? 0;
  const nonCachedInputTokens = Math.max(0, inputTokens - cachedInputTokens);
  const inputCost = nonCachedInputTokens / 1e6 * pricing.inputPer1M;
  const cachedCost = pricing.cachedInputPer1M != null ? cachedInputTokens / 1e6 * pricing.cachedInputPer1M : cachedInputTokens / 1e6 * pricing.inputPer1M;
  const outputCost = outputTokens / 1e6 * pricing.outputPer1M;
  return Number((inputCost + cachedCost + outputCost).toFixed(6));
}
function normalizeOpenAIUsage(raw) {
  if (!raw || typeof raw !== "object") return null;
  const usage = raw;
  const inputTokens = typeof usage.input_tokens === "number" ? usage.input_tokens : void 0;
  const outputTokens = typeof usage.output_tokens === "number" ? usage.output_tokens : void 0;
  const totalTokens = typeof usage.total_tokens === "number" ? usage.total_tokens : void 0;
  const inputDetails = usage.input_tokens_details && typeof usage.input_tokens_details === "object" ? usage.input_tokens_details : void 0;
  const outputDetails = usage.output_tokens_details && typeof usage.output_tokens_details === "object" ? usage.output_tokens_details : void 0;
  return {
    inputTokens,
    outputTokens,
    totalTokens,
    cachedInputTokens: typeof inputDetails?.cached_tokens === "number" ? inputDetails.cached_tokens : void 0,
    reasoningTokens: typeof outputDetails?.reasoning_tokens === "number" ? outputDetails.reasoning_tokens : void 0,
    raw: usage
  };
}

// ../../packages/shared/src/lib/openai/request-tracing.ts
function makeClientRequestId(params) {
  const phase = params.phase.replace(/[^a-zA-Z0-9_-]/g, "_");
  return `report_${params.reportId}_job_${params.jobId}_${phase}`;
}
function extractOpenAIRequestId(headers) {
  if (headers instanceof Headers) {
    return headers.get("x-request-id");
  }
  const value = headers["x-request-id"];
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

// ../../packages/shared/src/lib/safe-url.ts
var LOCALHOST_HOSTS = /* @__PURE__ */ new Set(["localhost", "127.0.0.1", "::1"]);
function isLocalHostname(hostname) {
  const normalized = hostname.trim().toLowerCase();
  return LOCALHOST_HOSTS.has(normalized) || normalized.endsWith(".localhost") || normalized.endsWith(".local");
}
function shouldAllowHttpUrlForRuntime(hostname) {
  return process.env.NODE_ENV !== "production" && isLocalHostname(hostname);
}
function sanitizeHttpUrl(value, options) {
  if (!value || typeof value !== "string") return null;
  try {
    const url = options?.baseUrl ? new URL(value, options.baseUrl) : new URL(value);
    const protocol = url.protocol.toLowerCase();
    const normalizedHostname = url.hostname.trim().toLowerCase();
    if (protocol === "https:") {
      return url.toString();
    }
    const allowHttp = options?.allowHttp ?? shouldAllowHttpUrlForRuntime(normalizedHostname);
    if (protocol === "http:" && allowHttp) {
      return url.toString();
    }
    return null;
  } catch {
    return null;
  }
}
function sanitizeHttpUrls(values, options) {
  const sanitized = /* @__PURE__ */ new Set();
  for (const value of values) {
    const next = sanitizeHttpUrl(value, options);
    if (next) sanitized.add(next);
  }
  return Array.from(sanitized);
}

// ../../packages/shared/src/lib/action-detail.ts
function sanitizeActionDetailPayload(input) {
  const raw = input && typeof input === "object" ? input : {};
  const affectedUrls = Array.isArray(raw.affectedUrls) ? raw.affectedUrls.filter((value) => typeof value === "string") : [];
  const fixSteps = Array.isArray(raw.fixSteps) ? raw.fixSteps.filter((value) => typeof value === "string").map((step) => step.trim()).filter(Boolean) : [];
  const whyItMatters = typeof raw.whyItMatters === "string" ? raw.whyItMatters.trim() : "";
  return {
    affectedUrls: sanitizeHttpUrls(affectedUrls),
    fixSteps,
    whyItMatters
  };
}

// ../../packages/shared/src/lib/report-detail.ts
var rowTypeToArrayKey = {
  actionBacklog: "actionBacklogRows",
  ctrGap: "lostClickEstimateRows",
  nearWin: "nearWinKeywordRows",
  cannibalization: "cannibalizationRows",
  contentDecay: "contentDecayRows"
};
var rowTypeToIdField = {
  actionBacklog: "id",
  ctrGap: "query",
  nearWin: "keyword",
  cannibalization: "query",
  contentDecay: "page"
};
function isRowType(value) {
  return value in rowTypeToArrayKey;
}
function findRow(aiReport, rowType, rowId) {
  const arrayKey = rowTypeToArrayKey[rowType];
  const idField = rowTypeToIdField[rowType];
  const rows = aiReport[arrayKey];
  if (!rows) return null;
  return rows.find((r) => r[idField] === rowId) ?? null;
}
function patchRowActionDetail(aiReport, rowType, rowId, actionDetail) {
  const arrayKey = rowTypeToArrayKey[rowType];
  const idField = rowTypeToIdField[rowType];
  const rows = aiReport[arrayKey];
  if (!rows) return aiReport;
  const patched = rows.map(
    (r) => r[idField] === rowId ? { ...r, actionDetail } : r
  );
  return { ...aiReport, [arrayKey]: patched };
}
function shouldGenerateDetail(rowData) {
  return !(typeof rowData.actionDetail === "string" && rowData.actionDetail.length > 0);
}
function makeDetailClientRequestId(input) {
  const sanitizedKind = input.kind.replace(/[^a-zA-Z0-9_-]/g, "_");
  return `report_${input.reportId}_detail_${input.requestNumber}_${sanitizedKind}`;
}
function normalizeDetailUsage(rawUsage) {
  const normalized = normalizeOpenAIUsage(rawUsage);
  if (!rawUsage || typeof rawUsage !== "object") return normalized;
  const usage = rawUsage;
  const promptTokens = typeof usage.prompt_tokens === "number" ? usage.prompt_tokens : void 0;
  const completionTokens = typeof usage.completion_tokens === "number" ? usage.completion_tokens : void 0;
  const totalTokens = typeof usage.total_tokens === "number" ? usage.total_tokens : void 0;
  const cachedInputTokens = usage.prompt_tokens_details && typeof usage.prompt_tokens_details === "object" && typeof usage.prompt_tokens_details.cached_tokens === "number" ? usage.prompt_tokens_details.cached_tokens : void 0;
  return {
    inputTokens: normalized?.inputTokens ?? promptTokens,
    outputTokens: normalized?.outputTokens ?? completionTokens,
    totalTokens: normalized?.totalTokens ?? totalTokens,
    cachedInputTokens: normalized?.cachedInputTokens ?? cachedInputTokens,
    reasoningTokens: normalized?.reasoningTokens,
    raw: normalized?.raw ?? usage
  };
}
var detailSchema = {
  type: "object",
  properties: {
    affectedUrls: { type: "array", items: { type: "string" } },
    fixSteps: { type: "array", items: { type: "string" } },
    whyItMatters: { type: "string" }
  },
  required: ["affectedUrls", "fixSteps", "whyItMatters"],
  additionalProperties: false
};
function buildActionDetailPrompt(input) {
  return `You are an SEO expert generating a personalized action detail for a specific issue found on ${input.siteUrl}.

The report covers ${input.dateRangeStart} to ${input.dateRangeEnd}.

Issue type: ${input.rowType}
Issue data: ${JSON.stringify(input.rowData, null, 2)}

Rules:
- Use actual URLs from the issue data. Do not fabricate URLs.
- Write fix steps for a non-technical site owner. Be concrete, not generic.
- Do not give generic SEO advice. Every sentence must reference this specific site or issue.
- affectedUrls: list only URLs present in the issue data (pages, targetLandingPage, etc.)
- fixSteps: 3\u20135 numbered steps, imperative voice, \u226430 words each
- whyItMatters: 1\u20132 sentences referencing the actual metric values in the issue data`;
}
function normalizeActionDetailInput(raw) {
  if (typeof raw !== "string") return raw;
  try {
    return JSON.parse(raw);
  } catch {
    throw new Error("Invalid action detail JSON");
  }
}
function serializeActionDetail(raw) {
  return JSON.stringify(sanitizeActionDetailPayload(normalizeActionDetailInput(raw)));
}

// ../../packages/shared/src/lib/reports/ai-report-schema.ts
import { z } from "zod";
var priority = z.enum(["KRITISCH", "HOCH", "MITTEL", "NIEDRIG"]);
var metadataSchema = z.object({
  language: z.string().min(2),
  schemaVersion: z.string().min(1),
  reportTitle: z.string().min(1),
  periodLabel: z.string().min(1),
  createdAtIso: z.string().min(10),
  notes: z.array(z.string()).default([])
});
var kpiComparisonRowSchema = z.object({
  metric: z.string().min(1),
  previous: z.string(),
  current: z.string(),
  delta: z.string(),
  assessment: z.string()
});
var contentAuditRowSchema = z.object({
  page: z.string().min(1),
  currentState: z.string(),
  problem: z.string(),
  recommendation: z.string(),
  keywordPotential: z.string(),
  effort: z.string(),
  priority,
  estimatedImpact: z.number().nullable().default(null),
  actionDetail: z.string().nullable().default(null),
  refreshStrategy: z.string().nullable().default(null)
});
var keywordLandingpageRowSchema = z.object({
  keyword: z.string().min(1),
  impressions: z.string(),
  currentPosition: z.string(),
  currentLandingpage: z.string(),
  recommendedLandingpage: z.string(),
  missingContent: z.string(),
  priority
});
var faqPlanRowSchema = z.object({
  category: z.string(),
  question: z.string(),
  targetKeyword: z.string(),
  priority
});
var technicalQuickWinRowSchema = z.object({
  index: z.number().int().nonnegative(),
  measure: z.string(),
  problem: z.string(),
  solution: z.string(),
  effort: z.string(),
  impact: priority
});
var actionPlanRowSchema = z.object({
  phase: z.string(),
  week: z.string(),
  measure: z.string(),
  description: z.string(),
  owner: z.string(),
  status: z.string()
});
var clientChecklistRowSchema = z.object({
  index: z.number().int().nonnegative(),
  requiredItem: z.string(),
  description: z.string(),
  forPhase: z.string(),
  status: z.string()
});
var siteChangeEntrySchema = z.object({
  url: z.string().min(1),
  changedFields: z.array(z.string()).default([]),
  machineDiffSummary: z.string().default("")
});
var kpiTrendRowSchema = z.object({
  date: z.string().min(8),
  clicksCurrent: z.number(),
  clicksCompare: z.number(),
  impressionsCurrent: z.number(),
  impressionsCompare: z.number(),
  ctrCurrent: z.number(),
  ctrCompare: z.number(),
  positionCurrent: z.number(),
  positionCompare: z.number(),
  sessionsCurrent: z.number().optional(),
  sessionsCompare: z.number().optional(),
  usersCurrent: z.number().optional(),
  usersCompare: z.number().optional()
});
var queryOpportunitySchema = z.object({
  query: z.string(),
  clicks: z.number(),
  impressions: z.number(),
  ctr: z.number(),
  position: z.number(),
  expectedCtr: z.number(),
  lostClicksEstimate: z.number(),
  opportunityScore: z.number(),
  recommendedAction: z.string(),
  confidence: z.number().nullable().default(null),
  actionDetail: z.string().nullable().default(null)
});
var pageWinnerLoserSchema = z.object({
  page: z.string(),
  clicksCurrent: z.number(),
  clicksCompare: z.number(),
  clicksDelta: z.number(),
  impressionsCurrent: z.number(),
  impressionsCompare: z.number(),
  impressionsDelta: z.number(),
  status: z.enum(["winner", "loser", "flat"]),
  isStatisticallySignificant: z.boolean().nullable().default(null),
  zScore: z.number().nullable().default(null),
  actionDetail: z.string().nullable().default(null)
});
var nearWinKeywordSchema = z.object({
  keyword: z.string(),
  position: z.number(),
  impressions: z.number(),
  clicks: z.number(),
  ctr: z.number(),
  targetLandingPage: z.string().nullable().default(null),
  action: z.string(),
  estimatedImpact: z.number().nullable().default(null),
  actionDetail: z.string().nullable().default(null)
});
var cannibalizationSchema = z.object({
  query: z.string(),
  pages: z.array(z.string()),
  totalClicks: z.number(),
  totalImpressions: z.number(),
  recommendation: z.string(),
  actionDetail: z.string().nullable().default(null)
});
var technicalIssueSchema = z.object({
  issueType: z.string(),
  affectedPages: z.number(),
  affectedEstimatedClicks: z.number(),
  severity: priority,
  recommendation: z.string()
});
var actionBacklogSchema = z.object({
  id: z.string(),
  area: z.enum(["technical", "content", "onpage", "analytics"]),
  task: z.string(),
  ownerHint: z.enum(["developer", "seo", "content", "marketing"]),
  effort: z.enum(["S", "M", "L"]),
  impactScore: z.number(),
  why: z.string(),
  done: z.boolean(),
  actionDetail: z.string().nullable().default(null)
});
var contentDecayRowSchema = z.object({
  page: z.string(),
  peakClicks: z.number(),
  recentClicks: z.number(),
  decayRatio: z.number(),
  peakDate: z.string(),
  estimatedLostClicks: z.number(),
  severity: priority,
  actionDetail: z.string().nullable().default(null)
});
var lostClickEstimateRowSchema = z.object({
  query: z.string(),
  impressions: z.number(),
  actualCtr: z.number(),
  benchmarkCtr: z.number(),
  positionBucket: z.number(),
  estimatedLostClicks: z.number(),
  confidence: z.number().nullable().default(null),
  actionDetail: z.string().nullable().default(null)
});
var alertsAndFlagsSchema = z.object({
  contentDecayDetected: z.boolean(),
  significantLosers: z.array(z.string()).default([]),
  cannibalizationCount: z.number(),
  criticalTechnicalIssues: z.number()
});
var scoringMethodologySchema = z.object({
  ctrBenchmarkSource: z.enum(["site-specific", "global-fallback"]),
  significanceTestUsed: z.boolean(),
  decayWindowDays: z.number(),
  insightSchemaVersion: z.string()
});
var workbookGscQueryRowSchema = z.object({
  query: z.string(),
  clicks: z.number(),
  impressions: z.number(),
  ctr: z.number(),
  position: z.number()
});
var workbookGscPageRowSchema = z.object({
  page: z.string(),
  clicks: z.number(),
  impressions: z.number()
});
var workbookGaChannelRowSchema = z.object({
  medium: z.string(),
  sessions: z.number(),
  users: z.number()
});
var workbookGaLandingPageRowSchema = z.object({
  landingPage: z.string(),
  sessions: z.number(),
  pageviews: z.number()
});
var workbookSchema = z.object({
  gscQueries: z.array(workbookGscQueryRowSchema).default([]),
  gscPages: z.array(workbookGscPageRowSchema).default([]),
  gaChannels: z.array(workbookGaChannelRowSchema).default([]),
  gaLandingPages: z.array(workbookGaLandingPageRowSchema).default([])
});
var aiSeoReportSchema = z.object({
  metadata: metadataSchema,
  dashboardMarkdown: z.string().default(""),
  executiveSummary: z.object({
    headline: z.string(),
    topActionAreas: z.array(z.string()).default([])
  }),
  kpiComparisonRows: z.array(kpiComparisonRowSchema).default([]),
  contentAuditRows: z.array(contentAuditRowSchema).default([]),
  keywordLandingpageRows: z.array(keywordLandingpageRowSchema).default([]),
  faqPlanRows: z.array(faqPlanRowSchema).default([]),
  technicalQuickWinRows: z.array(technicalQuickWinRowSchema).default([]),
  actionPlanRows: z.array(actionPlanRowSchema).default([]),
  clientChecklistRows: z.array(clientChecklistRowSchema).default([]),
  siteChanges: z.object({
    newPages: z.array(siteChangeEntrySchema).default([]),
    changedPages: z.array(siteChangeEntrySchema).default([]),
    removedPages: z.array(siteChangeEntrySchema).default([])
  }).default({ newPages: [], changedPages: [], removedPages: [] }),
  kpiTrendRows: z.array(kpiTrendRowSchema).default([]),
  queryOpportunityRows: z.array(queryOpportunitySchema).default([]),
  pageWinnerLoserRows: z.array(pageWinnerLoserSchema).default([]),
  nearWinKeywordRows: z.array(nearWinKeywordSchema).default([]),
  cannibalizationRows: z.array(cannibalizationSchema).default([]),
  technicalIssueRows: z.array(technicalIssueSchema).default([]),
  actionBacklogRows: z.array(actionBacklogSchema).default([]),
  contentDecayRows: z.array(contentDecayRowSchema).nullable().default(null),
  lostClickEstimateRows: z.array(lostClickEstimateRowSchema).nullable().default(null),
  alertsAndFlags: alertsAndFlagsSchema.nullable().default(null),
  scoringMethodology: scoringMethodologySchema.nullable().default(null),
  workbookDataset: workbookSchema.default({
    gscQueries: [],
    gscPages: [],
    gaChannels: [],
    gaLandingPages: []
  })
});
var aiSeoReportJsonSchema = z.toJSONSchema(aiSeoReportSchema, {
  target: "draft-7"
});
function deepClone(value) {
  return JSON.parse(JSON.stringify(value));
}
function makeNullable(schema) {
  if (Array.isArray(schema.anyOf) && schema.anyOf.some((entry) => entry?.type === "null")) {
    return schema;
  }
  if (Array.isArray(schema.type)) {
    if (!schema.type.includes("null")) {
      return { ...schema, type: [...schema.type, "null"] };
    }
    return schema;
  }
  if (typeof schema.type === "string") {
    return { ...schema, type: [schema.type, "null"] };
  }
  return {
    anyOf: [schema, { type: "null" }],
    default: null
  };
}
function normalizeForOpenAiStrict(node) {
  if (!node || typeof node !== "object") return node;
  const schema = node;
  if (schema.type === "object" && schema.properties && typeof schema.properties === "object") {
    const rawProps = schema.properties;
    const propKeys = Object.keys(rawProps);
    const originalRequired = Array.isArray(schema.required) ? schema.required : [];
    const normalizedProps = {};
    for (const key of propKeys) {
      const normalizedChild = normalizeForOpenAiStrict(rawProps[key]);
      normalizedProps[key] = originalRequired.includes(key) ? normalizedChild : makeNullable(normalizedChild);
    }
    return {
      ...schema,
      properties: normalizedProps,
      required: propKeys,
      additionalProperties: false
    };
  }
  if (schema.type === "array" && schema.items) {
    return {
      ...schema,
      items: normalizeForOpenAiStrict(schema.items)
    };
  }
  if (Array.isArray(schema.anyOf)) {
    return {
      ...schema,
      anyOf: schema.anyOf.map((entry) => normalizeForOpenAiStrict(entry))
    };
  }
  if (Array.isArray(schema.oneOf)) {
    return {
      ...schema,
      oneOf: schema.oneOf.map((entry) => normalizeForOpenAiStrict(entry))
    };
  }
  return schema;
}
function buildOpenAiStrictJsonSchema(baseSchema) {
  return normalizeForOpenAiStrict(deepClone(baseSchema));
}
var aiSeoReportJsonSchemaForOpenAI = buildOpenAiStrictJsonSchema(aiSeoReportJsonSchema);
function parseAiSeoReport(value) {
  return aiSeoReportSchema.parse(value);
}
function safeParseAiSeoReport(value) {
  return aiSeoReportSchema.safeParse(value);
}

// ../../packages/shared/src/lib/reports/ai-output-strategy.ts
function supportsTemperature(model) {
  return !model.toLowerCase().startsWith("gpt-5");
}
var JsonSchemaResponseStrategy = class {
  name = "json_schema";
  async create(params) {
    const temperature = supportsTemperature(params.model) ? params.temperature : void 0;
    const response = await params.client.responses.create(
      {
        model: params.model,
        input: params.prompt,
        background: params.background,
        store: params.background ? true : void 0,
        temperature,
        max_output_tokens: params.maxOutputTokens,
        service_tier: params.serviceTier,
        prompt_cache_key: params.promptCacheKey,
        text: params.schema ? {
          format: {
            type: "json_schema",
            name: "ai_seo_report",
            schema: params.schema,
            strict: params.strictSchema ?? true
          }
        } : void 0
      },
      {
        headers: params.extraHeaders
      }
    );
    const raw = response;
    return {
      rawResponse: response,
      responseId: raw.id ?? null,
      status: raw.status ?? null,
      text: raw.output_text ?? null,
      usage: raw.usage ?? null,
      strategyUsed: this.name
    };
  }
};
var StrictToolCallStrategy = class {
  name = "tool_strict";
  async create(params) {
    const toolName = "emit_ai_seo_report";
    const temperature = supportsTemperature(params.model) ? params.temperature : void 0;
    const response = await params.client.responses.create(
      {
        model: params.model,
        input: params.prompt,
        background: params.background,
        store: params.background ? true : void 0,
        temperature,
        max_output_tokens: params.maxOutputTokens,
        service_tier: params.serviceTier,
        prompt_cache_key: params.promptCacheKey,
        tools: params.schema ? [
          {
            type: "function",
            name: toolName,
            strict: params.strictSchema ?? true,
            description: "Emit the SEO report payload",
            parameters: params.schema
          }
        ] : void 0,
        tool_choice: params.schema ? { type: "function", name: toolName } : void 0
      },
      { headers: params.extraHeaders }
    );
    const raw = response;
    return {
      rawResponse: response,
      responseId: raw.id ?? null,
      status: raw.status ?? null,
      text: raw.output_text ?? null,
      usage: raw.usage ?? null,
      strategyUsed: this.name
    };
  }
};
var STRATEGIES = {
  json_schema: new JsonSchemaResponseStrategy(),
  tool_strict: new StrictToolCallStrategy()
};
function getAiOutputStrategy(name) {
  return STRATEGIES[name];
}
function chooseFallbackStrategy(name) {
  return name === "json_schema" ? "tool_strict" : "json_schema";
}

// ../../packages/shared/src/lib/reports/deterministic-insights.ts
function asNumber(n) {
  if (typeof n === "number" && Number.isFinite(n)) return n;
  return 0;
}
function pct(delta, base) {
  if (!base) return "0.0%";
  return `${(delta / base * 100).toFixed(1)}%`;
}
function normalize(value, min, max) {
  if (max <= min) return 0;
  return (value - min) / (max - min);
}
function expectedCtrAtPosition(position) {
  if (position <= 1) return 0.31;
  if (position <= 2) return 0.2;
  if (position <= 3) return 0.12;
  if (position <= 5) return 0.08;
  if (position <= 8) return 0.05;
  if (position <= 12) return 0.03;
  if (position <= 20) return 0.015;
  return 8e-3;
}
function clampRows(rows, cap = 100) {
  return rows.slice(0, cap);
}
function buildKpiComparisonRows(input) {
  const rows = [
    {
      metric: "GSC Clicks",
      previous: String(input.gscCompare.clicks),
      current: String(input.gscCurrent.clicks),
      delta: String(input.gscCurrent.clicks - input.gscCompare.clicks),
      assessment: input.gscCurrent.clicks >= input.gscCompare.clicks ? "Positive" : "Decline"
    },
    {
      metric: "GSC Impressions",
      previous: String(input.gscCompare.impressions),
      current: String(input.gscCurrent.impressions),
      delta: String(input.gscCurrent.impressions - input.gscCompare.impressions),
      assessment: input.gscCurrent.impressions >= input.gscCompare.impressions ? "Positive" : "Decline"
    },
    {
      metric: "GSC CTR",
      previous: `${(input.gscCompare.ctr * 100).toFixed(2)}%`,
      current: `${(input.gscCurrent.ctr * 100).toFixed(2)}%`,
      delta: `${((input.gscCurrent.ctr - input.gscCompare.ctr) * 100).toFixed(2)}%`,
      assessment: input.gscCurrent.ctr >= input.gscCompare.ctr ? "Positive" : "Decline"
    },
    {
      metric: "GSC Avg Position",
      previous: input.gscCompare.position.toFixed(2),
      current: input.gscCurrent.position.toFixed(2),
      delta: (input.gscCurrent.position - input.gscCompare.position).toFixed(2),
      assessment: input.gscCurrent.position <= input.gscCompare.position ? "Positive" : "Decline"
    }
  ];
  if (input.ga4Current && input.ga4Compare) {
    rows.push(
      {
        metric: "GA4 Sessions",
        previous: String(input.ga4Compare.sessions),
        current: String(input.ga4Current.sessions),
        delta: String(input.ga4Current.sessions - input.ga4Compare.sessions),
        assessment: input.ga4Current.sessions >= input.ga4Compare.sessions ? "Positive" : "Decline"
      },
      {
        metric: "GA4 Users",
        previous: String(input.ga4Compare.users),
        current: String(input.ga4Current.users),
        delta: String(input.ga4Current.users - input.ga4Compare.users),
        assessment: input.ga4Current.users >= input.ga4Compare.users ? "Positive" : "Decline"
      }
    );
  }
  return rows;
}
function buildKpiTrends(input) {
  const compareByDate = new Map(input.compareSeries.map((row) => [row.date, row]));
  return clampRows(
    input.currentSeries.map((row) => {
      const cmp = compareByDate.get(row.date);
      return {
        date: row.date,
        clicksCurrent: row.clicks,
        clicksCompare: asNumber(cmp?.clicks),
        impressionsCurrent: row.impressions,
        impressionsCompare: asNumber(cmp?.impressions),
        ctrCurrent: row.ctr,
        ctrCompare: asNumber(cmp?.ctr),
        positionCurrent: row.position,
        positionCompare: asNumber(cmp?.position),
        sessionsCurrent: row.sessions,
        sessionsCompare: asNumber(cmp?.sessions),
        usersCurrent: row.users,
        usersCompare: asNumber(cmp?.users)
      };
    }),
    180
  );
}
function buildPageWinnersLosers(currentPages, comparePages) {
  const compareMap = new Map(comparePages.map((p) => [p.page, p]));
  const rows = currentPages.map((p) => {
    const prev = compareMap.get(p.page);
    const clicksCompare = prev?.clicks ?? 0;
    const impressionsCompare = prev?.impressions ?? 0;
    const clicksDelta = p.clicks - clicksCompare;
    const impressionsDelta = p.impressions - impressionsCompare;
    return {
      page: p.page,
      clicksCurrent: p.clicks,
      clicksCompare,
      clicksDelta,
      impressionsCurrent: p.impressions,
      impressionsCompare,
      impressionsDelta,
      status: clicksDelta > 0 ? "winner" : clicksDelta < 0 ? "loser" : "flat"
    };
  });
  return clampRows(
    rows.sort((a, b) => Math.abs(b.clicksDelta) - Math.abs(a.clicksDelta)),
    50
  );
}
function buildNearWinKeywords(rows, pageRows) {
  const landing = pageRows[0]?.page;
  return clampRows(
    rows.filter((q) => q.position >= 8 && q.position <= 20).sort((a, b) => b.impressions - a.impressions).map((q) => ({
      keyword: q.query,
      position: q.position,
      impressions: q.impressions,
      clicks: q.clicks,
      ctr: q.ctr,
      targetLandingPage: landing,
      action: "Improve on-page relevance and add supporting FAQ/section for this query"
    })),
    40
  );
}
function buildCannibalization(rows) {
  if (!rows || rows.length === 0) return [];
  const grouped = /* @__PURE__ */ new Map();
  for (const row of rows) {
    const key = row.query.trim().toLowerCase();
    if (!key) continue;
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key).push(row);
  }
  const result = [];
  for (const [query, entries] of grouped.entries()) {
    const distinctPages = [...new Set(entries.map((e) => e.page))];
    if (distinctPages.length < 2) continue;
    const totalClicks = entries.reduce((sum, e) => sum + e.clicks, 0);
    const totalImpressions = entries.reduce((sum, e) => sum + e.impressions, 0);
    result.push({
      query,
      pages: distinctPages.slice(0, 5),
      totalClicks,
      totalImpressions,
      recommendation: "Consolidate intent: choose primary landing page, strengthen internal linking, and de-optimize secondary pages for this exact term.",
      actionDetail: null
    });
  }
  return clampRows(result.sort((a, b) => b.totalImpressions - a.totalImpressions), 25);
}
function buildTechnicalIssueRows(crawl, topPages) {
  if (!crawl) return [];
  const pageClicks = new Map(topPages.map((p) => [p.page, p.clicks]));
  const issueBuckets = /* @__PURE__ */ new Map();
  for (const page of crawl.pages ?? []) {
    const estimatedClicks = pageClicks.get(page.url) ?? 0;
    for (const issue of page.issues ?? []) {
      const key = issue.trim();
      if (!issueBuckets.has(key)) {
        issueBuckets.set(key, { affectedPages: 0, affectedEstimatedClicks: 0 });
      }
      const bucket = issueBuckets.get(key);
      bucket.affectedPages += 1;
      bucket.affectedEstimatedClicks += estimatedClicks;
    }
  }
  const rows = [...issueBuckets.entries()].map(([issueType, bucket]) => {
    const severity = bucket.affectedPages >= 15 || bucket.affectedEstimatedClicks > 100 ? "KRITISCH" : bucket.affectedPages >= 8 || bucket.affectedEstimatedClicks > 40 ? "HOCH" : bucket.affectedPages >= 3 || bucket.affectedEstimatedClicks > 10 ? "MITTEL" : "NIEDRIG";
    return {
      issueType,
      affectedPages: bucket.affectedPages,
      affectedEstimatedClicks: bucket.affectedEstimatedClicks,
      severity,
      recommendation: "Fix templates/components first before page-by-page edits."
    };
  });
  return clampRows(rows.sort((a, b) => b.affectedEstimatedClicks - a.affectedEstimatedClicks), 40);
}
function buildActionBacklog(input) {
  const rows = [];
  for (const row of input.technicalIssues.slice(0, 6)) {
    rows.push({
      id: `tech_${rows.length + 1}`,
      area: "technical",
      task: `Fix: ${row.issueType}`,
      ownerHint: "developer",
      effort: row.affectedPages > 10 ? "L" : row.affectedPages > 4 ? "M" : "S",
      impactScore: Math.min(100, row.affectedEstimatedClicks + row.affectedPages * 2),
      why: `${row.affectedPages} pages affected, est. clicks at risk: ${row.affectedEstimatedClicks}`,
      done: false
    });
  }
  for (const row of input.queryOpportunities.slice(0, 6)) {
    rows.push({
      id: `seo_${rows.length + 1}`,
      area: "content",
      task: `Improve query opportunity: ${row.query}`,
      ownerHint: "seo",
      effort: row.position > 12 ? "M" : "S",
      impactScore: row.opportunityScore,
      why: `Lost clicks estimate: ${row.lostClicksEstimate.toFixed(1)}`,
      done: false
    });
  }
  for (const page of input.siteChanges.changedPages.slice(0, 4)) {
    rows.push({
      id: `chg_${rows.length + 1}`,
      area: "onpage",
      task: `Validate impact after page change: ${page.url}`,
      ownerHint: "seo",
      effort: "S",
      impactScore: 45,
      why: page.machineDiffSummary ?? "Page changed and needs post-release SEO validation",
      done: false
    });
  }
  return clampRows(rows.sort((a, b) => b.impactScore - a.impactScore), 20);
}
var POSITION_BUCKETS = [1, 2, 3, 4, 6, 9, 13, 21];
function positionToBucket(position) {
  const floor = Math.floor(position);
  let bucket = POSITION_BUCKETS[0];
  for (const b of POSITION_BUCKETS) {
    if (floor >= b) bucket = b;
  }
  return bucket;
}
function buildCtrBenchmarkCurve(queries) {
  const computedAt = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
  if (queries.length < 10) {
    const siteAvgCtrByPosition2 = {};
    for (const b of POSITION_BUCKETS) {
      siteAvgCtrByPosition2[String(b)] = expectedCtrAtPosition(b);
    }
    return {
      siteAvgCtrByPosition: siteAvgCtrByPosition2,
      positionBuckets: [],
      dataPoints: queries.length,
      computedAt,
      ctrBenchmarkSource: "global-fallback"
    };
  }
  const bucketData = /* @__PURE__ */ new Map();
  for (const q of queries) {
    const bucket = positionToBucket(q.position);
    if (!bucketData.has(bucket)) {
      bucketData.set(bucket, { totalImpressions: 0, weightedCtrSum: 0, count: 0 });
    }
    const entry = bucketData.get(bucket);
    entry.totalImpressions += q.impressions;
    entry.weightedCtrSum += q.ctr * q.impressions;
    entry.count += 1;
  }
  const siteAvgCtrByPosition = {};
  const positionBuckets = [];
  for (const b of POSITION_BUCKETS) {
    const entry = bucketData.get(b);
    if (entry && entry.count >= 3 && entry.totalImpressions > 0) {
      siteAvgCtrByPosition[String(b)] = Number((entry.weightedCtrSum / entry.totalImpressions).toFixed(4));
      positionBuckets.push(b);
    } else {
      siteAvgCtrByPosition[String(b)] = expectedCtrAtPosition(b);
    }
  }
  return {
    siteAvgCtrByPosition,
    positionBuckets,
    dataPoints: queries.length,
    computedAt,
    ctrBenchmarkSource: positionBuckets.length > 0 ? "site-specific" : "global-fallback"
  };
}
function buildLostClickEstimateRows(queries, benchmark) {
  const rows = [];
  for (const q of queries) {
    const bucket = positionToBucket(q.position);
    const benchmarkCtr = benchmark.siteAvgCtrByPosition[String(bucket)] ?? expectedCtrAtPosition(q.position);
    const estimatedLostClicks = q.impressions * Math.max(benchmarkCtr - q.ctr, 0);
    if (estimatedLostClicks <= 0) continue;
    rows.push({
      query: q.query,
      impressions: q.impressions,
      actualCtr: q.ctr,
      benchmarkCtr,
      positionBucket: bucket,
      estimatedLostClicks: Number(estimatedLostClicks.toFixed(2)),
      confidence: null,
      actionDetail: null
    });
  }
  return clampRows(
    rows.sort((a, b) => b.estimatedLostClicks - a.estimatedLostClicks),
    20
  );
}
function buildContentDecayRows(currentPages, comparePages, compareRangeEnd) {
  const compareMap = new Map(comparePages.map((p) => [p.page, p]));
  const rows = [];
  for (const page of currentPages) {
    const prev = compareMap.get(page.page);
    if (!prev || prev.clicks <= 50) continue;
    const decayRatio = page.clicks / prev.clicks;
    if (decayRatio >= 0.65) continue;
    const severity = decayRatio < 0.4 ? "KRITISCH" : decayRatio < 0.55 ? "HOCH" : "MITTEL";
    rows.push({
      page: page.page,
      peakClicks: prev.clicks,
      recentClicks: page.clicks,
      decayRatio: Number(decayRatio.toFixed(3)),
      peakDate: compareRangeEnd,
      estimatedLostClicks: prev.clicks - page.clicks,
      severity,
      actionDetail: null
    });
  }
  return clampRows(
    rows.sort((a, b) => b.estimatedLostClicks - a.estimatedLostClicks),
    20
  );
}
function twoProportionZTest(clicks1, impressions1, clicks2, impressions2) {
  if (impressions1 <= 0 || impressions2 <= 0) {
    return { zScore: 0, isSignificant: false, confidence: 0 };
  }
  const p1 = clicks1 / impressions1;
  const p2 = clicks2 / impressions2;
  const n1 = impressions1;
  const n2 = impressions2;
  const pPool = (clicks1 + clicks2) / (n1 + n2);
  const se = Math.sqrt(pPool * (1 - pPool) * (1 / n1 + 1 / n2));
  if (se === 0) return { zScore: 0, isSignificant: false, confidence: 0 };
  const z2 = Math.abs((p1 - p2) / se);
  return {
    zScore: Number(z2.toFixed(3)),
    isSignificant: z2 >= 1.96,
    confidence: Number(Math.min(1, z2 / 2).toFixed(3))
  };
}
function addSignificanceToWinnerLoserRows(rows) {
  return rows.map((row) => {
    if (row.impressionsCurrent <= 0 || row.impressionsCompare <= 0) {
      return { ...row, isStatisticallySignificant: null, zScore: null };
    }
    const { zScore, isSignificant } = twoProportionZTest(
      row.clicksCurrent,
      row.impressionsCurrent,
      row.clicksCompare,
      row.impressionsCompare
    );
    return {
      ...row,
      isStatisticallySignificant: isSignificant,
      zScore
    };
  });
}
function buildQueryOpportunitiesWithBenchmark(currentQueries, benchmark) {
  const enriched = currentQueries.map((q) => {
    const bucket = positionToBucket(q.position);
    const expectedCtr = benchmark.siteAvgCtrByPosition[String(bucket)] ?? expectedCtrAtPosition(q.position);
    const lostClicksEstimate = q.impressions * Math.max(expectedCtr - q.ctr, 0);
    return { ...q, expectedCtr, lostClicksEstimate };
  });
  const impressionMin = Math.min(...enriched.map((q) => q.impressions), 0);
  const impressionMax = Math.max(...enriched.map((q) => q.impressions), 1);
  const lostMin = Math.min(...enriched.map((q) => q.lostClicksEstimate), 0);
  const lostMax = Math.max(...enriched.map((q) => q.lostClicksEstimate), 1);
  return clampRows(
    enriched.map((q) => {
      const severityWeight = q.position >= 8 && q.position <= 20 ? 1 : q.position <= 7 ? 0.6 : 0.4;
      const opportunityScore = 100 * (0.4 * normalize(q.impressions, impressionMin, impressionMax) + 0.4 * normalize(q.lostClicksEstimate, lostMin, lostMax) + 0.2 * severityWeight);
      return {
        query: q.query,
        clicks: q.clicks,
        impressions: q.impressions,
        ctr: q.ctr,
        position: q.position,
        expectedCtr: q.expectedCtr,
        lostClicksEstimate: Number(q.lostClicksEstimate.toFixed(2)),
        opportunityScore: Number(opportunityScore.toFixed(2)),
        recommendedAction: q.position > 10 ? "Expand topical depth and strengthen internal links to this landing page" : "Rewrite title/meta and align snippet intent to improve CTR",
        confidence: null,
        actionDetail: null
      };
    }).sort((a, b) => b.opportunityScore - a.opportunityScore),
    50
  );
}
function buildDeterministicInsights(input) {
  const kpiComparisonRows = buildKpiComparisonRows(input);
  const kpiTrendRows = buildKpiTrends(input);
  const ctrBenchmarkSummary = buildCtrBenchmarkCurve(input.gscCurrent.topQueries ?? []);
  const queryOpportunityRows = buildQueryOpportunitiesWithBenchmark(
    input.gscCurrent.topQueries ?? [],
    ctrBenchmarkSummary
  );
  const lostClickEstimateRows = buildLostClickEstimateRows(
    input.gscCurrent.topQueries ?? [],
    ctrBenchmarkSummary
  );
  const rawPageRows = buildPageWinnersLosers(
    input.gscCurrent.topPages ?? [],
    input.gscCompare.topPages ?? []
  );
  const pageWinnerLoserRows = addSignificanceToWinnerLoserRows(rawPageRows);
  const nearWinKeywordRows = buildNearWinKeywords(input.gscCurrent.topQueries ?? [], input.gscCurrent.topPages ?? []);
  const cannibalizationRows = buildCannibalization(input.queryPagePairsCurrent);
  const technicalIssueRows = buildTechnicalIssueRows(input.crawl, input.gscCurrent.topPages ?? []);
  const actionBacklogRows = buildActionBacklog({
    queryOpportunities: queryOpportunityRows,
    technicalIssues: technicalIssueRows,
    siteChanges: input.siteChanges
  });
  const compareRangeEnd = input.compareRangeEnd ?? (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
  const contentDecayRows = buildContentDecayRows(
    input.gscCurrent.topPages ?? [],
    input.gscCompare.topPages ?? [],
    compareRangeEnd
  );
  const significantLosers = pageWinnerLoserRows.filter((r) => r.status === "loser" && r.isStatisticallySignificant === true).map((r) => r.page);
  const alertsAndFlags = {
    contentDecayDetected: contentDecayRows.length > 0,
    significantLosers,
    cannibalizationCount: cannibalizationRows.length,
    criticalTechnicalIssues: technicalIssueRows.filter((r) => r.severity === "KRITISCH").length
  };
  const scoringMethodology = {
    ctrBenchmarkSource: ctrBenchmarkSummary.ctrBenchmarkSource,
    significanceTestUsed: true,
    decayWindowDays: 28,
    insightSchemaVersion: "2.0"
  };
  const clicksDelta = input.gscCurrent.clicks - input.gscCompare.clicks;
  const sessionsDelta = (input.ga4Current?.sessions ?? 0) - (input.ga4Compare?.sessions ?? 0);
  const executiveSummary = {
    headline: `Clicks ${clicksDelta >= 0 ? "up" : "down"} ${Math.abs(clicksDelta)} (${pct(
      clicksDelta,
      input.gscCompare.clicks
    )}), sessions ${sessionsDelta >= 0 ? "up" : "down"} ${Math.abs(sessionsDelta)} (${pct(
      sessionsDelta,
      input.ga4Compare?.sessions ?? 0
    )}).`,
    topActionAreas: [
      queryOpportunityRows[0]?.query ? `Unlock CTR opportunity for query "${queryOpportunityRows[0].query}"` : null,
      technicalIssueRows[0]?.issueType ? `Resolve technical issue pattern: ${technicalIssueRows[0].issueType}` : null,
      input.siteChanges.changedPages[0]?.url ? `Review performance impact of changed page ${input.siteChanges.changedPages[0].url}` : null
    ].filter((value) => Boolean(value))
  };
  const workbookDataset = {
    gscQueries: clampRows((input.gscCurrent.topQueries ?? []).map((q) => ({ ...q })), 500),
    gscPages: clampRows((input.gscCurrent.topPages ?? []).map((p) => ({ ...p })), 500),
    gaChannels: clampRows((input.ga4Current?.trafficSources ?? []).map((row) => ({ ...row })), 500),
    gaLandingPages: clampRows((input.ga4Current?.landingPages ?? []).map((row) => ({ ...row })), 500)
  };
  return {
    kpiComparisonRows,
    kpiTrendRows,
    queryOpportunityRows,
    pageWinnerLoserRows,
    nearWinKeywordRows,
    cannibalizationRows,
    technicalIssueRows,
    actionBacklogRows,
    workbookDataset,
    executiveSummary,
    contentDecayRows,
    lostClickEstimateRows,
    ctrBenchmarkSummary,
    alertsAndFlags,
    scoringMethodology
  };
}

// ../../packages/shared/src/lib/reports/openai-orchestrator.ts
function estimateMaxCostUsd(input) {
  if (!input.maxOutputTokens || input.maxOutputTokens <= 0) return null;
  const estimatedInputTokens = Math.ceil(input.prompt.length / 4);
  return estimateOpenAICostUsd(input.model, {
    inputTokens: estimatedInputTokens,
    outputTokens: input.maxOutputTokens
  });
}
function applyCostGuardrail(input) {
  const actions = [];
  let resolvedModel = input.model;
  let resolvedMaxOutputTokens = typeof input.maxOutputTokens === "number" && input.maxOutputTokens > 0 ? input.maxOutputTokens : null;
  let estimate = estimateMaxCostUsd({
    model: resolvedModel,
    prompt: input.prompt,
    maxOutputTokens: resolvedMaxOutputTokens
  });
  if (resolvedMaxOutputTokens != null && (estimate ?? 0) > input.costCapUsd) {
    resolvedMaxOutputTokens = Math.max(1200, Math.floor(resolvedMaxOutputTokens * 0.6));
    actions.push("reduced_output_cap");
    estimate = estimateMaxCostUsd({
      model: resolvedModel,
      prompt: input.prompt,
      maxOutputTokens: resolvedMaxOutputTokens
    });
  }
  if (resolvedMaxOutputTokens != null && (estimate ?? 0) > input.costCapUsd && input.fallbackModel) {
    resolvedModel = input.fallbackModel;
    actions.push("fallback_model");
    estimate = estimateMaxCostUsd({
      model: resolvedModel,
      prompt: input.prompt,
      maxOutputTokens: resolvedMaxOutputTokens
    });
  }
  if (resolvedMaxOutputTokens != null && (estimate ?? 0) > input.costCapUsd) {
    resolvedMaxOutputTokens = Math.max(800, Math.floor(resolvedMaxOutputTokens * 0.5));
    actions.push("reduced_output_cap_again");
    estimate = estimateMaxCostUsd({
      model: resolvedModel,
      prompt: input.prompt,
      maxOutputTokens: resolvedMaxOutputTokens
    });
  }
  return {
    model: resolvedModel,
    maxOutputTokens: resolvedMaxOutputTokens,
    estimatedMaxCostUsd: estimate,
    guardrailActions: actions
  };
}
function tryParseJson(text) {
  if (!text) return null;
  const cleaned = text.replace(/```(?:json)?/g, "").replace(/```/g, "").trim();
  if (!cleaned) return null;
  try {
    return JSON.parse(cleaned);
  } catch {
    return null;
  }
}
function extractPayloadFromResponse(rawResponse) {
  if (!rawResponse || typeof rawResponse !== "object") return null;
  const raw = rawResponse;
  const fromText = tryParseJson(typeof raw.output_text === "string" ? raw.output_text : null);
  if (fromText) return fromText;
  const output = Array.isArray(raw.output) ? raw.output : [];
  for (const item of output) {
    const itemType = typeof item.type === "string" ? item.type : "";
    if (itemType === "message" && Array.isArray(item.content)) {
      for (const contentPart of item.content) {
        if (contentPart.type === "output_text" && typeof contentPart.text === "string") {
          const parsed = tryParseJson(contentPart.text);
          if (parsed) return parsed;
        }
      }
    }
    if ((itemType === "function_call" || itemType === "tool_call") && typeof item.arguments === "string") {
      const parsed = tryParseJson(item.arguments);
      if (parsed) return parsed;
    }
  }
  return null;
}
function getResponseStatus(rawResponse) {
  if (!rawResponse || typeof rawResponse !== "object") return null;
  const raw = rawResponse;
  return typeof raw.status === "string" ? raw.status : null;
}
function getResponseText(rawResponse) {
  if (!rawResponse || typeof rawResponse !== "object") return null;
  const raw = rawResponse;
  return typeof raw.output_text === "string" ? raw.output_text : null;
}
function getResponseId(rawResponse) {
  if (!rawResponse || typeof rawResponse !== "object") return null;
  const raw = rawResponse;
  return typeof raw.id === "string" ? raw.id : null;
}
function getResponseRequestId(rawResponse) {
  if (!rawResponse || typeof rawResponse !== "object") return null;
  const raw = rawResponse;
  return raw._request_id ?? null;
}
async function startOpenAiReportGeneration(params) {
  const guardrail = applyCostGuardrail({
    model: params.model,
    fallbackModel: params.fallbackModel,
    prompt: params.prompt,
    maxOutputTokens: params.maxOutputTokens,
    costCapUsd: params.costCapUsd
  });
  const xClientRequestId = makeClientRequestId({
    reportId: params.reportId,
    jobId: params.jobId,
    phase: params.phase ?? "openai_start"
  });
  const primaryStrategy = getAiOutputStrategy(params.strategy);
  const primaryResult = await primaryStrategy.create({
    client: params.client,
    model: guardrail.model,
    prompt: params.prompt,
    schema: params.schema,
    strategy: params.strategy,
    strictSchema: params.strictSchema,
    temperature: params.temperature,
    maxOutputTokens: guardrail.maxOutputTokens ?? void 0,
    background: params.background,
    promptCacheKey: params.promptCacheKey,
    serviceTier: params.serviceTier,
    extraHeaders: {
      "X-Client-Request-Id": xClientRequestId
    }
  });
  const usage = normalizeOpenAIUsage(primaryResult.usage ?? null);
  return {
    responseId: getResponseId(primaryResult.rawResponse),
    status: getResponseStatus(primaryResult.rawResponse),
    strategyUsed: primaryResult.strategyUsed,
    responseText: getResponseText(primaryResult.rawResponse),
    usage,
    xRequestId: getResponseRequestId(primaryResult.rawResponse),
    xClientRequestId,
    guardrail,
    rawResponse: primaryResult.rawResponse
  };
}
async function startOpenAiWithFallback(params) {
  const first = await startOpenAiReportGeneration(params);
  if (first.responseId || first.responseText) return first;
  const fallbackStrategy = chooseFallbackStrategy(params.strategy);
  const retry = await startOpenAiReportGeneration({
    ...params,
    strategy: fallbackStrategy,
    phase: "openai_start_fallback"
  });
  return { ...retry, strategyUsed: fallbackStrategy };
}
async function pollOpenAiResponse(params) {
  const xClientRequestId = makeClientRequestId({
    reportId: params.reportId,
    jobId: params.jobId,
    phase: params.phase ?? "openai_poll"
  });
  const response = await params.client.responses.retrieve(params.responseId, {
    headers: {
      "X-Client-Request-Id": xClientRequestId
    }
  });
  const xRequestId = extractOpenAIRequestId(response.response?.headers ?? {}) || getResponseRequestId(response);
  return {
    responseId: getResponseId(response) ?? params.responseId,
    status: getResponseStatus(response),
    usage: normalizeOpenAIUsage(response.usage ?? null),
    responseText: getResponseText(response),
    outputPayload: extractPayloadFromResponse(response),
    xRequestId,
    rawResponse: response
  };
}
function isTerminalResponseStatus(status) {
  return status === "completed" || status === "failed" || status === "cancelled" || status === "incomplete";
}
function isSuccessfulResponseStatus(status) {
  return status === "completed";
}
function extractStructuredPayload(response) {
  if (response.outputPayload) return response.outputPayload;
  const parsedText = tryParseJson(response.responseText);
  if (parsedText) return parsedText;
  return extractPayloadFromResponse(response.rawResponse);
}
function isSchemaContractError(error) {
  const status = typeof error?.status === "number" ? error.status : null;
  const message = error instanceof Error ? error.message : typeof error?.message === "string" ? error.message : "";
  if (status !== 400) return false;
  return /invalid schema|json_schema|response_format|required|additionalProperties|schema/i.test(message);
}

// ../../packages/shared/src/lib/reports/prompt-builder.ts
function stableJson(value) {
  if (Array.isArray(value)) {
    return `[${value.map(stableJson).join(",")}]`;
  }
  if (value && typeof value === "object") {
    const entries = Object.entries(value).sort(
      ([a], [b]) => a.localeCompare(b)
    );
    return `{${entries.map(([k, v]) => `${JSON.stringify(k)}:${stableJson(v)}`).join(",")}}`;
  }
  return JSON.stringify(value);
}
function buildPromptCacheKey(input) {
  return [
    "ai-report",
    input.promptVersionId ?? "default",
    input.schemaVersion,
    input.outputStrategy,
    input.language,
    (input.model ?? "unknown").split("-").slice(0, 2).join("-")
  ].join(":");
}
function buildAiReportPrompt(input) {
  const metadataJson = stableJson(input.reportMetadata ?? {});
  const payloadJson = stableJson(input.payload);
  const examples = input.examples?.trim();
  const precomputedBlock = input.precomputedContext ? [
    `
PRE-COMPUTED INSIGHTS (verified \u2014 do not recalculate)`,
    `CTR benchmark source: ${input.precomputedContext.ctrBenchmarkSource}`,
    `Content decay pages detected: ${input.precomputedContext.contentDecayCount}`,
    `Statistically significant losers (95% CI): ${input.precomputedContext.significantLosersCount}`,
    `Available payload keys with pre-computed data:`,
    `  queryOpportunityRows   \u2014 sorted by opportunityScore desc, each has lostClicksEstimate + expectedCtr`,
    `  contentDecayRows       \u2014 pages with \u2265 35% click drop, each has decayRatio + estimatedLostClicks`,
    `  pageWinnerLoserRows    \u2014 each has zScore + isStatisticallySignificant`,
    `  lostClickEstimateRows  \u2014 per-query CTR gap vs site benchmark`,
    `  cannibalizationRows    \u2014 queries splitting traffic across multiple pages`,
    `  nearWinKeywordRows     \u2014 positions 8\u201320 with high impressions`,
    `  technicalIssueRows     \u2014 crawl issues bucketed by type + estimated click impact`,
    ``,
    `YOUR TASKS:`,
    `1. dashboardMarkdown: \u2264 300 words. Name the top 3 specific pages or queries driving the period's story.`,
    `2. executiveSummary.headline: one sentence, include the largest metric movement with its value.`,
    `3. executiveSummary.topActionAreas: 3 strings, each naming a specific query or page URL.`,
    `4. queryOpportunityRows \u2014 for EACH row: write actionDetail (1\u20132 sentences). Name the exact query,`,
    `   cite its lostClicksEstimate and opportunityScore, and give a concrete on-page tactic.`,
    `   actionDetail MUST NOT be null or a generic sentence.`,
    `5. contentDecayRows \u2014 for EACH row: write actionDetail (1\u20132 sentences). Name the exact page URL,`,
    `   cite its decayRatio and estimatedLostClicks, and prescribe the specific refresh action.`,
    `   actionDetail MUST NOT be null.`,
    `6. nearWinKeywordRows \u2014 for EACH row: write actionDetail (1\u20132 sentences). Name the exact keyword,`,
    `   cite its position and impressions, and give one concrete on-page action (e.g. add FAQ section,`,
    `   internal link from high-authority page, expand heading coverage).`,
    `   actionDetail MUST NOT be null.`,
    `7. cannibalizationRows \u2014 for EACH row: write actionDetail (1\u20132 sentences). Name the cannibalizing`,
    `   query and the competing pages, then prescribe which page to consolidate to and how (canonical,`,
    `   de-optimize secondary, redirect, or internal link restructure).`,
    `   actionDetail MUST NOT be null.`,
    `8. contentAuditRows \u2014 for EACH row: set actionDetail and refreshStrategy (concrete update tactic).`,
    `9. Pass-through (return exactly as provided, do NOT modify):`,
    `   kpiComparisonRows, kpiTrendRows, pageWinnerLoserRows, lostClickEstimateRows,`,
    `   technicalIssueRows, actionBacklogRows, technicalQuickWinRows, actionPlanRows,`,
    `   siteChanges, workbookDataset.`
  ].join("\n") : "";
  const prompt = [
    `SYSTEM INSTRUCTIONS`,
    input.masterPrompt.trim(),
    ``,
    `OUTPUT CONTRACT`,
    `- Schema version: ${input.schemaVersion}`,
    `- Language: ${input.language}`,
    `- Strategy: ${input.outputStrategy}`,
    `- Return the requested structured report payload and dashboard markdown.`,
    examples ? `
EXAMPLES
${examples}` : "",
    `
REPORT METADATA
${metadataJson}`,
    precomputedBlock,
    `
VARIABLE PAYLOAD (JSON)
${payloadJson}`
  ].filter(Boolean).join("\n");
  return {
    prompt,
    promptCacheKey: buildPromptCacheKey(input),
    payloadJson
  };
}

// ../../packages/shared/src/lib/reports/report-language.ts
var DEFAULT_LANGUAGE = "de";
function normalizeLanguageTag(value) {
  if (!value) return null;
  const normalized = value.trim().toLowerCase().replace("_", "-");
  if (!normalized) return null;
  const [base] = normalized.split("-");
  return base || null;
}
function extractGoogleLocaleFromIdToken(idToken) {
  if (!idToken) return null;
  const parts = idToken.split(".");
  if (parts.length < 2) return null;
  try {
    const payload = JSON.parse(Buffer.from(parts[1], "base64url").toString("utf8"));
    return normalizeLanguageTag(payload.locale ?? payload.lang ?? null);
  } catch {
    return null;
  }
}
async function resolveReportLanguage(params) {
  const settings = await db.query.userSettings.findFirst({
    where: (s, { eq: eq6 }) => eq6(s.userId, params.userId),
    columns: { reportLanguage: true }
  });
  const userSetting = normalizeLanguageTag(settings?.reportLanguage ?? null);
  if (userSetting && userSetting !== "auto") {
    return { language: userSetting, source: "user_setting" };
  }
  const googleLocale = extractGoogleLocaleFromIdToken(params.googleIdToken);
  if (googleLocale) {
    return { language: googleLocale, source: "google_locale" };
  }
  return { language: DEFAULT_LANGUAGE, source: "default" };
}

// ../../packages/shared/src/lib/reports/site-change-tracker.ts
import { createHash } from "crypto";
import { nanoid as nanoid2 } from "nanoid";
import { and, eq as eq2, inArray } from "drizzle-orm";
function normalizeWhitespace(s) {
  return s.replace(/\s+/g, " ").trim();
}
function sha256(input) {
  return createHash("sha256").update(input).digest("hex");
}
function buildPageFingerprints(input) {
  const normalized = {
    url: normalizeWhitespace(input.url || ""),
    title: normalizeWhitespace(input.title || ""),
    metaDescription: normalizeWhitespace(input.metaDescription || ""),
    h1Texts: (input.h1Texts ?? []).map((h) => normalizeWhitespace(h)).filter(Boolean),
    text: normalizeWhitespace(input.text || "")
  };
  const extractedTextHash = sha256(normalized.text);
  const seoFingerprintHash = sha256(
    JSON.stringify({
      url: normalized.url,
      title: normalized.title,
      metaDescription: normalized.metaDescription,
      h1Texts: normalized.h1Texts,
      text: normalized.text
    })
  );
  return { normalized, extractedTextHash, seoFingerprintHash };
}
function buildMachinePageDiff(prev, next) {
  const changedFields = [];
  const prevN = buildPageFingerprints(prev).normalized;
  const nextN = buildPageFingerprints(next).normalized;
  if (prevN.title !== nextN.title) changedFields.push("title");
  if (prevN.metaDescription !== nextN.metaDescription) changedFields.push("metaDescription");
  if (JSON.stringify(prevN.h1Texts) !== JSON.stringify(nextN.h1Texts)) changedFields.push("h1Texts");
  if (prevN.text !== nextN.text) changedFields.push("content");
  const machineDiffSummary = changedFields.length === 0 ? "No detectable SEO-relevant page changes." : `Changed fields: ${changedFields.join(", ")}.`;
  return { changedFields, machineDiffSummary };
}
async function computeAndPersistSiteChanges(input) {
  const registryRows = await db.query.propertyPageRegistry.findMany({
    where: (r, { and: and5, eq: eq6 }) => and5(eq6(r.propertyId, input.propertyId), eq6(r.teamId, input.teamId))
  });
  const snapshotIds = registryRows.map((row) => row.currentSnapshotId).filter((value) => Boolean(value));
  const previousSnapshots = snapshotIds.length ? await db.query.crawlPageSnapshots.findMany({
    where: (s, { inArray: inArray3 }) => inArray3(s.id, snapshotIds)
  }) : [];
  const prevSnapshotById = new Map(previousSnapshots.map((row) => [row.id, row]));
  const registryByCanonical = new Map(registryRows.map((row) => [row.canonicalUrl, row]));
  const activeRegistryRows = registryRows.filter((row) => row.isActive);
  const seenCanonicalUrls = /* @__PURE__ */ new Set();
  const siteChanges = {
    newPages: [],
    changedPages: [],
    removedPages: []
  };
  for (const page of input.pages) {
    const canonicalUrl = (page.canonicalUrl || page.url || "").trim();
    if (!canonicalUrl) continue;
    if (seenCanonicalUrls.has(canonicalUrl)) continue;
    seenCanonicalUrls.add(canonicalUrl);
    const fingerprints = buildPageFingerprints({
      url: canonicalUrl,
      title: page.title,
      metaDescription: page.metaDescription,
      h1Texts: page.h1Texts,
      text: page.visibleTextExcerpt
    });
    const [snapshot] = await db.insert(crawlPageSnapshots).values({
      id: `cps_${nanoid2(12)}`,
      reportId: input.reportId,
      crawlId: input.crawlId ?? null,
      propertyId: input.propertyId,
      teamId: input.teamId,
      url: page.url,
      canonicalUrl,
      title: page.title ?? null,
      metaDescription: page.metaDescription ?? null,
      h1Texts: page.h1Texts ?? [],
      extractedTextHash: fingerprints.extractedTextHash,
      seoFingerprintHash: fingerprints.seoFingerprintHash
    }).returning();
    const registry = registryByCanonical.get(canonicalUrl);
    if (!registry) {
      siteChanges.newPages.push({ url: canonicalUrl });
      const [insertedRegistry] = await db.insert(propertyPageRegistry).values({
        id: `ppr_${nanoid2(12)}`,
        propertyId: input.propertyId,
        teamId: input.teamId,
        canonicalUrl,
        currentFingerprintHash: fingerprints.seoFingerprintHash,
        currentSnapshotId: snapshot.id,
        firstSeenAt: /* @__PURE__ */ new Date(),
        lastSeenAt: /* @__PURE__ */ new Date(),
        lastChangedAt: /* @__PURE__ */ new Date(),
        lastReportId: input.reportId,
        isActive: true,
        updatedAt: /* @__PURE__ */ new Date()
      }).returning();
      registryByCanonical.set(canonicalUrl, insertedRegistry);
      continue;
    }
    if (!registry.isActive) {
      siteChanges.newPages.push({ url: canonicalUrl });
    }
    const prevSnapshot = registry.currentSnapshotId ? prevSnapshotById.get(registry.currentSnapshotId) : null;
    if (registry.currentFingerprintHash !== fingerprints.seoFingerprintHash) {
      const diff = buildMachinePageDiff(
        {
          url: canonicalUrl,
          title: prevSnapshot?.title ?? "",
          metaDescription: prevSnapshot?.metaDescription ?? "",
          h1Texts: Array.isArray(prevSnapshot?.h1Texts) ? prevSnapshot?.h1Texts : [],
          text: ""
        },
        {
          url: canonicalUrl,
          title: page.title ?? "",
          metaDescription: page.metaDescription ?? "",
          h1Texts: page.h1Texts ?? [],
          text: page.visibleTextExcerpt ?? ""
        }
      );
      siteChanges.changedPages.push({
        url: canonicalUrl,
        changedFields: diff.changedFields,
        machineDiffSummary: diff.machineDiffSummary
      });
      await db.update(crawlPageSnapshots).set({ machineDiffSummary: diff.machineDiffSummary }).where(eq2(crawlPageSnapshots.id, snapshot.id));
    }
    await db.update(propertyPageRegistry).set({
      currentFingerprintHash: fingerprints.seoFingerprintHash,
      currentSnapshotId: snapshot.id,
      lastSeenAt: /* @__PURE__ */ new Date(),
      lastChangedAt: registry.currentFingerprintHash !== fingerprints.seoFingerprintHash ? /* @__PURE__ */ new Date() : registry.lastChangedAt,
      lastReportId: input.reportId,
      isActive: true,
      updatedAt: /* @__PURE__ */ new Date()
    }).where(eq2(propertyPageRegistry.id, registry.id));
  }
  const removed = activeRegistryRows.filter((row) => !seenCanonicalUrls.has(row.canonicalUrl));
  if (removed.length > 0) {
    siteChanges.removedPages = removed.map((row) => ({ url: row.canonicalUrl }));
    await db.update(propertyPageRegistry).set({ isActive: false, updatedAt: /* @__PURE__ */ new Date(), lastReportId: input.reportId }).where(
      and(
        eq2(propertyPageRegistry.propertyId, input.propertyId),
        inArray(
          propertyPageRegistry.canonicalUrl,
          removed.map((row) => row.canonicalUrl)
        )
      )
    );
  }
  return siteChanges;
}

// ../../packages/shared/src/lib/reports/snapshot-sanitizer.ts
var MAX_ARRAY_ITEMS = 20;
function sanitizeValue(value) {
  if (value == null) return value;
  if (Array.isArray(value)) {
    return value.slice(0, MAX_ARRAY_ITEMS).map(sanitizeValue);
  }
  if (typeof value !== "object") return value;
  const out = {};
  for (const [key, raw] of Object.entries(value)) {
    const lower = key.toLowerCase();
    if (lower.includes("token") || lower.includes("secret") || lower.includes("password") || lower.includes("refresh") || lower.includes("access_token") || lower.includes("id_token")) {
      continue;
    }
    out[key] = sanitizeValue(raw);
  }
  return out;
}
function buildSanitizedReportInputSnapshot(payload) {
  const sanitized = sanitizeValue(payload);
  return sanitized && typeof sanitized === "object" ? sanitized : { payload: sanitized };
}

// ../../packages/shared/src/lib/reports/xlsx-builder.ts
import ExcelJS from "exceljs";
var MAX_ROWS = 1500;
function capRows(rows, limit = MAX_ROWS) {
  return rows.slice(0, limit);
}
function safeCell(value) {
  if (value == null) return "";
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  if (typeof value === "boolean") return value ? "true" : "false";
  const text = String(value);
  return text.length > 2e3 ? `${text.slice(0, 1997)}...` : text;
}
function styleHeader(row) {
  row.font = { bold: true };
  row.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFEFEFEF" }
  };
  row.alignment = { vertical: "middle", horizontal: "left" };
}
function autoWidths(ws, width = 24) {
  ws.columns?.forEach((col) => {
    col.width = Math.min(Math.max(col.width ?? width, 14), 54);
  });
}
function addTitle(ws, title, subtitle) {
  ws.addRow([title]);
  if (subtitle) ws.addRow([subtitle]);
  ws.addRow([]);
}
function assertRequiredReportFields(report) {
  if (!report.metadata?.reportTitle) throw new Error("XLSX build failed: missing metadata.reportTitle");
  if (!report.metadata?.periodLabel) throw new Error("XLSX build failed: missing metadata.periodLabel");
  if (!Array.isArray(report.kpiComparisonRows)) throw new Error("XLSX build failed: missing kpiComparisonRows");
}
function buildExecSheet(ws, report) {
  addTitle(ws, report.metadata.reportTitle, report.metadata.periodLabel);
  ws.addRow(["Executive Headline", safeCell(report.executiveSummary?.headline ?? "")]);
  ws.addRow([]);
  const header = ws.addRow(["Metric", "Previous", "Current", "Delta", "Assessment"]);
  styleHeader(header);
  for (const row of capRows(report.kpiComparisonRows ?? [], 200)) {
    ws.addRow([
      safeCell(row.metric),
      safeCell(row.previous),
      safeCell(row.current),
      safeCell(row.delta),
      safeCell(row.assessment)
    ]);
  }
  ws.addRow([]);
  ws.addRow(["Top Action Areas"]);
  for (const area of capRows(report.executiveSummary?.topActionAreas ?? [], 25)) {
    ws.addRow([safeCell(area)]);
  }
  autoWidths(ws, 26);
}
function buildKpiTrendSheet(ws, report) {
  addTitle(ws, "KPI Trends", report.metadata.periodLabel);
  const header = ws.addRow([
    "Date",
    "Clicks(Current)",
    "Clicks(Compare)",
    "Impressions(Current)",
    "Impressions(Compare)",
    "CTR(Current)",
    "CTR(Compare)",
    "Position(Current)",
    "Position(Compare)",
    "Sessions(Current)",
    "Sessions(Compare)",
    "Users(Current)",
    "Users(Compare)"
  ]);
  styleHeader(header);
  for (const row of capRows(report.kpiTrendRows ?? [], 400)) {
    ws.addRow([
      safeCell(row.date),
      safeCell(row.clicksCurrent),
      safeCell(row.clicksCompare),
      safeCell(row.impressionsCurrent),
      safeCell(row.impressionsCompare),
      safeCell(row.ctrCurrent),
      safeCell(row.ctrCompare),
      safeCell(row.positionCurrent),
      safeCell(row.positionCompare),
      safeCell(row.sessionsCurrent),
      safeCell(row.sessionsCompare),
      safeCell(row.usersCurrent),
      safeCell(row.usersCompare)
    ]);
  }
  autoWidths(ws, 18);
}
function addQueryOpportunityRows(ws, rows) {
  const header = ws.addRow([
    "Query",
    "Clicks",
    "Impressions",
    "CTR",
    "Position",
    "Expected CTR",
    "Lost Clicks Est.",
    "Opportunity Score",
    "Recommended Action"
  ]);
  styleHeader(header);
  for (const row of capRows(rows, 300)) {
    ws.addRow([
      safeCell(row.query),
      safeCell(row.clicks),
      safeCell(row.impressions),
      safeCell(row.ctr),
      safeCell(row.position),
      safeCell(row.expectedCtr),
      safeCell(row.lostClicksEstimate),
      safeCell(row.opportunityScore),
      safeCell(row.recommendedAction)
    ]);
  }
}
function addPageWinnerLoserRows(ws, rows) {
  const header = ws.addRow([
    "Page",
    "Clicks(Current)",
    "Clicks(Compare)",
    "Clicks Delta",
    "Impressions(Current)",
    "Impressions(Compare)",
    "Impressions Delta",
    "Status"
  ]);
  styleHeader(header);
  for (const row of capRows(rows, 300)) {
    ws.addRow([
      safeCell(row.page),
      safeCell(row.clicksCurrent),
      safeCell(row.clicksCompare),
      safeCell(row.clicksDelta),
      safeCell(row.impressionsCurrent),
      safeCell(row.impressionsCompare),
      safeCell(row.impressionsDelta),
      safeCell(row.status)
    ]);
  }
}
function addNearWinRows(ws, rows) {
  const header = ws.addRow([
    "Keyword",
    "Position",
    "Impressions",
    "Clicks",
    "CTR",
    "Target Landing Page",
    "Action"
  ]);
  styleHeader(header);
  for (const row of capRows(rows, 300)) {
    ws.addRow([
      safeCell(row.keyword),
      safeCell(row.position),
      safeCell(row.impressions),
      safeCell(row.clicks),
      safeCell(row.ctr),
      safeCell(row.targetLandingPage),
      safeCell(row.action)
    ]);
  }
}
function addCannibalizationRows(ws, rows) {
  const header = ws.addRow([
    "Query",
    "Pages",
    "Total Clicks",
    "Total Impressions",
    "Recommendation"
  ]);
  styleHeader(header);
  for (const row of capRows(rows, 250)) {
    ws.addRow([
      safeCell(row.query),
      safeCell(row.pages.join(" | ")),
      safeCell(row.totalClicks),
      safeCell(row.totalImpressions),
      safeCell(row.recommendation)
    ]);
  }
}
function addTechnicalIssueRows(ws, rows) {
  const header = ws.addRow([
    "Issue Type",
    "Affected Pages",
    "Affected Estimated Clicks",
    "Severity",
    "Recommendation"
  ]);
  styleHeader(header);
  for (const row of capRows(rows, 250)) {
    ws.addRow([
      safeCell(row.issueType),
      safeCell(row.affectedPages),
      safeCell(row.affectedEstimatedClicks),
      safeCell(row.severity),
      safeCell(row.recommendation)
    ]);
  }
}
function addSiteChanges(ws, report) {
  const header = ws.addRow(["Type", "URL", "Changed Fields", "Machine Diff Summary"]);
  styleHeader(header);
  for (const row of capRows(report.siteChanges?.newPages ?? [], 200)) {
    ws.addRow(["new", safeCell(row.url), "", ""]);
  }
  for (const row of capRows(report.siteChanges?.changedPages ?? [], 300)) {
    ws.addRow([
      "changed",
      safeCell(row.url),
      safeCell((row.changedFields ?? []).join(", ")),
      safeCell(row.machineDiffSummary)
    ]);
  }
  for (const row of capRows(report.siteChanges?.removedPages ?? [], 200)) {
    ws.addRow(["removed", safeCell(row.url), "", ""]);
  }
}
function addActionBacklogRows(ws, rows) {
  const header = ws.addRow([
    "ID",
    "Area",
    "Task",
    "Owner Hint",
    "Effort",
    "Impact Score",
    "Why",
    "Done"
  ]);
  styleHeader(header);
  for (const row of capRows(rows, 300)) {
    ws.addRow([
      safeCell(row.id),
      safeCell(row.area),
      safeCell(row.task),
      safeCell(row.ownerHint),
      safeCell(row.effort),
      safeCell(row.impactScore),
      safeCell(row.why),
      row.done ? "yes" : "no"
    ]);
  }
}
function addRawRows(ws, rows) {
  const items = capRows(rows, 2e3);
  const allKeys = [...new Set(items.flatMap((row) => Object.keys(row)))];
  if (allKeys.length === 0) {
    ws.addRow(["No data"]);
    return;
  }
  const header = ws.addRow(allKeys);
  styleHeader(header);
  for (const row of items) {
    ws.addRow(allKeys.map((key) => safeCell(row[key])));
  }
}
async function buildWorkbookBufferFromAiReport(report) {
  assertRequiredReportFields(report);
  const wb = new ExcelJS.Workbook();
  wb.creator = "WebHealth";
  wb.created = /* @__PURE__ */ new Date();
  const readme = wb.addWorksheet("00_Readme");
  addTitle(readme, report.metadata.reportTitle, report.metadata.periodLabel);
  readme.addRow([
    "This workbook is generated for analysts and developers. It includes deterministic opportunity scoring plus AI-prioritized actions."
  ]);
  readme.addRow([]);
  readme.addRow(["Schema version", safeCell(report.metadata.schemaVersion)]);
  readme.addRow(["Language", safeCell(report.metadata.language)]);
  autoWidths(readme, 30);
  const exec = wb.addWorksheet("01_Exec_Summary");
  buildExecSheet(exec, report);
  const trends = wb.addWorksheet("02_KPI_Trends");
  buildKpiTrendSheet(trends, report);
  const opp = wb.addWorksheet("03_Query_Opportunities");
  addTitle(opp, "Query Opportunities");
  addQueryOpportunityRows(opp, report.queryOpportunityRows ?? []);
  autoWidths(opp, 22);
  const pages = wb.addWorksheet("04_Page_Winners_Losers");
  addTitle(pages, "Page Winners and Losers");
  addPageWinnerLoserRows(pages, report.pageWinnerLoserRows ?? []);
  autoWidths(pages, 22);
  const nearWin = wb.addWorksheet("05_Near_Win_Keywords");
  addTitle(nearWin, "Near-Win Keywords (positions 8-20)");
  addNearWinRows(nearWin, report.nearWinKeywordRows ?? []);
  autoWidths(nearWin, 22);
  const cannibal = wb.addWorksheet("06_Cannibalization");
  addTitle(cannibal, "Cannibalization Suspects");
  addCannibalizationRows(cannibal, report.cannibalizationRows ?? []);
  autoWidths(cannibal, 22);
  const tech = wb.addWorksheet("07_Tech_Issues");
  addTitle(tech, "Technical Issues (weighted by estimated impact)");
  addTechnicalIssueRows(tech, report.technicalIssueRows ?? []);
  autoWidths(tech, 24);
  const changes = wb.addWorksheet("08_Site_Changes");
  addTitle(changes, "Deterministic Site Changes");
  addSiteChanges(changes, report);
  autoWidths(changes, 24);
  const backlog = wb.addWorksheet("09_Action_Backlog");
  addTitle(backlog, "Prioritized Action Backlog");
  addActionBacklogRows(backlog, report.actionBacklogRows ?? []);
  autoWidths(backlog, 24);
  const rawQueries = wb.addWorksheet("10_Raw_GSC_Queries");
  addRawRows(rawQueries, report.workbookDataset?.gscQueries ?? []);
  autoWidths(rawQueries, 20);
  const rawPages = wb.addWorksheet("11_Raw_GSC_Pages");
  addRawRows(rawPages, report.workbookDataset?.gscPages ?? []);
  autoWidths(rawPages, 20);
  const rawGaChannels = wb.addWorksheet("12_Raw_GA4_Channels");
  addRawRows(rawGaChannels, report.workbookDataset?.gaChannels ?? []);
  autoWidths(rawGaChannels, 20);
  const rawGaLanding = wb.addWorksheet("13_Raw_GA4_Landing");
  addRawRows(rawGaLanding, report.workbookDataset?.gaLandingPages ?? []);
  autoWidths(rawGaLanding, 20);
  const buf = await wb.xlsx.writeBuffer();
  return Buffer.isBuffer(buf) ? buf : Buffer.from(buf);
}

// ../../packages/shared/src/lib/properties/reportable-properties.ts
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

// ../../packages/shared/src/lib/properties/reportable-properties-db.ts
async function listTeamProperties(teamId) {
  return db.query.properties.findMany({
    where: (p, { eq: eq6 }) => eq6(p.teamId, teamId)
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

// ../../packages/shared/src/lib/queue/report-worker-policy.ts
function planReportGenerationPass(input) {
  const siteChangesSource = input.hasStoredSiteChanges ? "stored" : "empty";
  const crawlDeferralActive = input.crawlingEnabled && !input.skipCrawlEnqueue;
  if (!crawlDeferralActive) {
    return {
      siteChangesSource,
      queueCrawlJob: false,
      shouldRunXlsxAfterThisPass: input.requestedRunXlsx
    };
  }
  return {
    siteChangesSource,
    queueCrawlJob: !input.hasPendingCrawlJob,
    shouldRunXlsxAfterThisPass: false
  };
}
function shouldSkipExistingAiReport(input) {
  return input.hasAiReport && !input.forceRegenerate;
}
function buildCrawlRefreshGeneratePayload(input) {
  return {
    forceRegenerate: true,
    runXlsx: input.runXlsx,
    skipCrawlEnqueue: true
  };
}

// ../../packages/shared/src/lib/queue/report-jobs.ts
import { nanoid as nanoid3 } from "nanoid";
import { and as and2, desc, eq as eq3, inArray as inArray2, sql } from "drizzle-orm";

// ../../packages/shared/src/lib/queue/report-job-row-shape.ts
var snakeToCamelClaimJobKeys = [
  ["report_id", "reportId"],
  ["team_id", "teamId"],
  ["available_at", "availableAt"],
  ["max_attempts", "maxAttempts"],
  ["claimed_by", "claimedBy"],
  ["claimed_at", "claimedAt"],
  ["claim_expires_at", "claimExpiresAt"],
  ["heartbeat_at", "heartbeatAt"],
  ["started_at", "startedAt"],
  ["finished_at", "finishedAt"],
  ["last_error", "lastError"],
  ["created_at", "createdAt"],
  ["updated_at", "updatedAt"]
];
function normalizeClaimedReportJobRow(row) {
  const normalized = { ...row };
  for (const [snakeKey, camelKey] of snakeToCamelClaimJobKeys) {
    if (!(camelKey in normalized) && snakeKey in normalized) {
      normalized[camelKey] = normalized[snakeKey];
    }
  }
  return normalized;
}

// ../../packages/shared/src/lib/queue/report-jobs.ts
function getQueueLeaseConfig() {
  return {
    leaseSeconds: parseInt(process.env.REPORT_WORKER_LEASE_SECONDS ?? "45", 10),
    heartbeatSeconds: parseInt(process.env.REPORT_WORKER_HEARTBEAT_SECONDS ?? "10", 10),
    maxActiveGlobal: parseInt(process.env.REPORT_WORKER_MAX_ACTIVE_GLOBAL ?? "2", 10),
    maxActivePerTeam: parseInt(process.env.REPORT_WORKER_MAX_ACTIVE_PER_TEAM ?? "1", 10),
    maxActiveDetailGlobal: parseInt(process.env.REPORT_WORKER_MAX_ACTIVE_DETAILS_GLOBAL ?? "6", 10),
    maxActiveDetailPerTeam: parseInt(process.env.REPORT_WORKER_MAX_ACTIVE_DETAILS_PER_TEAM ?? "3", 10)
  };
}
async function enqueueReportJob(input) {
  const jobId = `rj_${nanoid3(12)}`;
  const [job] = await db.insert(reportJobs).values({
    id: jobId,
    reportId: input.reportId,
    teamId: input.teamId,
    kind: input.kind,
    priority: input.priority ?? 100,
    payload: input.payload ?? {},
    phase: "queued",
    status: "queued"
  }).returning();
  await appendReportJobEvent({
    jobId,
    reportId: input.reportId,
    teamId: input.teamId,
    phase: "queued",
    level: "info",
    message: `Job enqueued (${input.kind})`
  });
  await db.execute(sql`SELECT pg_notify('job_available', '')`);
  return job;
}
async function appendReportJobEvent(input) {
  const [event] = await db.insert(reportJobEvents).values({
    id: `rje_${nanoid3(12)}`,
    jobId: input.jobId,
    reportId: input.reportId,
    teamId: input.teamId,
    phase: input.phase,
    level: input.level ?? "info",
    message: input.message,
    meta: input.meta ?? null
  }).returning();
  return event;
}
async function claimNextReportJob(workerId) {
  const cfg = getQueueLeaseConfig();
  const rows = await db.transaction(async (tx) => {
    const result = await tx.execute(sql`
      with candidate as (
        select j.id
        from report_jobs j
        where (
          (j.status = 'queued' and j.available_at <= now())
          or (j.status = 'processing' and j.claim_expires_at < now())
        )
        and case
          when j.kind = 'generate_detail' then (
            select count(*) from report_jobs g
            where g.status = 'processing'
              and g.claim_expires_at > now()
              and g.kind = 'generate_detail'
          ) < ${cfg.maxActiveDetailGlobal}
          else (
            select count(*) from report_jobs g
            where g.status = 'processing'
              and g.claim_expires_at > now()
              and g.kind <> 'generate_detail'
          ) < ${cfg.maxActiveGlobal}
        end
        and case
          when j.kind = 'generate_detail' then (
            select count(*) from report_jobs t
            where t.status = 'processing'
              and t.claim_expires_at > now()
              and t.team_id = j.team_id
              and t.kind = 'generate_detail'
          ) < ${cfg.maxActiveDetailPerTeam}
          else (
            select count(*) from report_jobs t
            where t.status = 'processing'
              and t.claim_expires_at > now()
              and t.team_id = j.team_id
              and t.kind <> 'generate_detail'
          ) < ${cfg.maxActivePerTeam}
        end
        order by j.priority asc, j.created_at asc
        for update skip locked
        limit 1
      )
      update report_jobs j
      set
        status = 'processing',
        claimed_by = ${workerId},
        claimed_at = now(),
        heartbeat_at = now(),
        claim_expires_at = now() + (${cfg.leaseSeconds} || ' seconds')::interval,
        started_at = coalesce(j.started_at, now()),
        attempts = j.attempts + 1,
        updated_at = now()
      from candidate
      where j.id = candidate.id
      returning j.*
    `);
    return result;
  });
  const rawRow = rows[0] ?? null;
  const row = rawRow ? normalizeClaimedReportJobRow(rawRow) : null;
  if (!row) return null;
  await appendReportJobEvent({
    jobId: row.id,
    reportId: row.reportId,
    teamId: row.teamId,
    phase: row.phase,
    level: "info",
    message: `Job claimed by ${workerId}`,
    meta: { leaseSeconds: cfg.leaseSeconds }
  });
  return row;
}
async function heartbeatReportJob(jobId, workerId) {
  const cfg = getQueueLeaseConfig();
  const [job] = await db.update(reportJobs).set({
    heartbeatAt: /* @__PURE__ */ new Date(),
    claimExpiresAt: sql`now() + (${cfg.leaseSeconds} || ' seconds')::interval`,
    updatedAt: /* @__PURE__ */ new Date()
  }).where(
    and2(eq3(reportJobs.id, jobId), eq3(reportJobs.status, "processing"), eq3(reportJobs.claimedBy, workerId))
  ).returning();
  return job ?? null;
}
async function updateReportJobPhase(jobId, phase, meta) {
  const [job] = await db.update(reportJobs).set({ phase, updatedAt: /* @__PURE__ */ new Date() }).where(eq3(reportJobs.id, jobId)).returning();
  if (job) {
    await appendReportJobEvent({
      jobId: job.id,
      reportId: job.reportId,
      teamId: job.teamId,
      phase,
      level: "info",
      message: `Phase -> ${phase}`,
      meta
    });
  }
  return job ?? null;
}
async function completeReportJob(jobId, phase = "done") {
  const [job] = await db.update(reportJobs).set({
    status: "complete",
    phase,
    finishedAt: /* @__PURE__ */ new Date(),
    claimExpiresAt: null,
    heartbeatAt: /* @__PURE__ */ new Date(),
    updatedAt: /* @__PURE__ */ new Date()
  }).where(eq3(reportJobs.id, jobId)).returning();
  if (job) {
    await appendReportJobEvent({
      jobId: job.id,
      reportId: job.reportId,
      teamId: job.teamId,
      phase,
      level: "info",
      message: "Job completed"
    });
  }
  return job ?? null;
}
async function requeueJobForRetry(jobId, errorMessage, delaySeconds = 30) {
  const [job] = await db.update(reportJobs).set({
    status: "queued",
    phase: "queued",
    claimedBy: null,
    claimedAt: null,
    claimExpiresAt: null,
    heartbeatAt: null,
    finishedAt: null,
    lastError: errorMessage,
    availableAt: sql`now() + (${delaySeconds} || ' seconds')::interval`,
    updatedAt: /* @__PURE__ */ new Date()
  }).where(eq3(reportJobs.id, jobId)).returning();
  if (job) {
    await appendReportJobEvent({
      jobId: job.id,
      reportId: job.reportId,
      teamId: job.teamId,
      phase: "queued",
      level: "warn",
      message: `Job re-queued for retry (attempt ${job.attempts} of ${job.maxAttempts}): ${errorMessage}`
    });
  }
  return job ?? null;
}
async function failReportJob(jobId, errorMessage, phase) {
  const [job] = await db.update(reportJobs).set({
    status: "failed",
    lastError: errorMessage,
    phase: phase ?? "done",
    finishedAt: /* @__PURE__ */ new Date(),
    claimExpiresAt: null,
    updatedAt: /* @__PURE__ */ new Date()
  }).where(eq3(reportJobs.id, jobId)).returning();
  if (job) {
    await appendReportJobEvent({
      jobId: job.id,
      reportId: job.reportId,
      teamId: job.teamId,
      phase: job.phase,
      level: "error",
      message: errorMessage
    });
  }
  return job ?? null;
}
async function findLatestJobForReport(reportId, kinds) {
  const filters = [eq3(reportJobs.reportId, reportId)];
  if (kinds?.length) filters.push(inArray2(reportJobs.kind, kinds));
  return db.query.reportJobs.findFirst({
    where: and2(...filters),
    orderBy: (j, { desc: desc2 }) => [desc2(j.createdAt)]
  });
}

// ../../packages/shared/src/lib/provider-tokens.ts
import { createCipheriv, createDecipheriv, createHash as createHash2, randomBytes } from "node:crypto";
import { and as and3, eq as eq4 } from "drizzle-orm";
var ENCRYPTION_PREFIX = "enc:v1";
function getEncryptionKey() {
  const raw = process.env.OAUTH_TOKEN_ENCRYPTION_KEY?.trim();
  if (!raw) {
    throw new Error("OAUTH_TOKEN_ENCRYPTION_KEY is required for provider token encryption");
  }
  if (/^[a-fA-F0-9]{64}$/.test(raw)) {
    return Buffer.from(raw, "hex");
  }
  const decoded = Buffer.from(raw, "base64");
  if (decoded.length === 32) return decoded;
  return createHash2("sha256").update(raw).digest();
}
function isEncryptedProviderToken(value) {
  return Boolean(value && value.startsWith(`${ENCRYPTION_PREFIX}:`));
}
function decryptProviderToken(value) {
  if (!value) return null;
  if (!isEncryptedProviderToken(value)) return value;
  const parts = value.split(":");
  if (parts.length !== 5) {
    throw new Error("Invalid encrypted provider token format");
  }
  const [, , ivPart, tagPart, dataPart] = parts;
  const decipher = createDecipheriv(
    "aes-256-gcm",
    getEncryptionKey(),
    Buffer.from(ivPart, "base64url")
  );
  decipher.setAuthTag(Buffer.from(tagPart, "base64url"));
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(dataPart, "base64url")),
    decipher.final()
  ]);
  return decrypted.toString("utf8");
}
function decryptGoogleAccountTokens(row) {
  return {
    ...row,
    accessToken: decryptProviderToken(row.accessToken),
    refreshToken: decryptProviderToken(row.refreshToken),
    idToken: decryptProviderToken(row.idToken),
    scope: row.scope ?? null
  };
}
async function getGoogleAccountTokensForUser(userId) {
  const { db: db2 } = await import("./db-KJ4GK4XL.js");
  const googleAccount = await db2.query.account.findFirst({
    where: (table, { and: and5, eq: eq6 }) => and5(eq6(table.userId, userId), eq6(table.providerId, "google"))
  });
  if (!googleAccount) return null;
  return decryptGoogleAccountTokens(googleAccount);
}

// ../../packages/shared/src/lib/queue/report-worker.ts
var configuredOpenAiOrg = process.env.OPENAI_ORG?.trim() || null;
var DETAIL_MODEL = process.env.OPENAI_MODEL ?? "gpt-4o-mini";
var MAX_DETAIL_WRITE_RETRIES = 5;
function buildOpenAiClient(opts) {
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    baseURL: process.env.OPENAI_BASE_URL ?? void 0,
    organization: opts?.omitOrganization ? void 0 : configuredOpenAiOrg ?? void 0,
    project: process.env.OPENAI_PROJECT ?? void 0
  });
}
var openaiClient = buildOpenAiClient();
var openaiClientWithoutOrg = buildOpenAiClient({ omitOrganization: true });
function isOpenAiOrganizationHeaderMismatch(error) {
  const status = typeof error?.status === "number" ? error.status : null;
  const message = error instanceof Error ? error.message : typeof error?.message === "string" ? error.message : "";
  if (status !== 401) return false;
  return /openai-organization header should match organization/i.test(message);
}
function supportsTemperature2(model) {
  return !model.toLowerCase().startsWith("gpt-5");
}
var DetailSaveConflictError = class extends Error {
};
function extractChatCompletionRequestId(response) {
  const raw = response;
  if (raw._request_id) return raw._request_id;
  if (!raw.response?.headers) return null;
  return extractOpenAIRequestId(raw.response.headers);
}
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
function readTimeoutMs(envName, fallbackMs) {
  const parsed = parseInt(process.env[envName] ?? `${fallbackMs}`, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallbackMs;
}
function getOpenAiPollPhaseTimeoutMs() {
  const configured = parseInt(process.env.REPORT_OPENAI_POLL_PHASE_TIMEOUT_MS ?? "", 10);
  if (Number.isFinite(configured) && configured > 0) {
    return configured;
  }
  return readTimeoutMs("REPORT_OPENAI_POLL_TIMEOUT_MS", 36e4) + 15e3;
}
async function withExternalPhaseTimeout(input) {
  let timeoutHandle = null;
  try {
    return await Promise.race([
      input.operation(),
      new Promise((_, reject) => {
        timeoutHandle = setTimeout(() => {
          reject(new Error(`${input.label} timed out after ${input.timeoutMs}ms`));
        }, input.timeoutMs);
      })
    ]);
  } finally {
    if (timeoutHandle) {
      clearTimeout(timeoutHandle);
    }
  }
}
function formatWorkerLogValue(value) {
  if (value === null) return "null";
  if (value === void 0) return "undefined";
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "string") {
    return /[\s=]/.test(value) ? JSON.stringify(value) : value;
  }
  if (typeof value === "number" || typeof value === "boolean" || typeof value === "bigint") {
    return String(value);
  }
  if (value instanceof Error) {
    return value.stack ?? value.message;
  }
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}
function formatWorkerLogContext(context) {
  if (!context) return "";
  const keys = Object.keys(context).sort();
  const entries = [];
  for (const key of keys) {
    const value = context[key];
    if (value === void 0) continue;
    entries.push(`${key}=${formatWorkerLogValue(value)}`);
  }
  return entries.join(" ");
}
function logWorker(level, status, message, context, error) {
  const contextText = formatWorkerLogContext(context);
  const line = `[report-worker][${level}][${status}] ${message}${contextText ? ` ${contextText}` : ""}`;
  if (level === "INFO") {
    console.log(line);
    return;
  }
  if (level === "WARN") {
    console.warn(line);
    return;
  }
  if (error) {
    console.error(line, error);
    return;
  }
  console.error(line);
}
function logInfo(status, message, context) {
  logWorker("INFO", status, message, context);
}
function logWarn(status, message, context) {
  logWorker("WARN", status, message, context);
}
function logError(status, message, context, error) {
  logWorker("ERROR", status, message, context, error);
}
function logFatal(status, message, context, error) {
  logWorker("FATAL", status, message, context, error);
}
function getIdlePulseMs() {
  const parsed = parseInt(process.env.REPORT_WORKER_IDLE_LOG_EVERY_MS ?? "30000", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 3e4;
}
function buildJobLogContext(job, workerId) {
  return {
    workerId,
    jobId: job.id,
    reportId: job.reportId,
    kind: job.kind,
    attempt: job.attempts,
    maxAttempts: job.maxAttempts
  };
}
async function setJobPhaseWithLog(job, workerId, phase, meta) {
  logInfo("WORKING", "phase transition", {
    ...buildJobLogContext(job, workerId),
    phase
  });
  await updateReportJobPhase(job.id, phase, meta);
}
function formatDate(input) {
  if (input instanceof Date) return input.toISOString().slice(0, 10);
  return String(input).slice(0, 10);
}
function asNum(v) {
  const n = typeof v === "number" ? v : Number(v ?? 0);
  return Number.isFinite(n) ? n : 0;
}
function appendRequestTrace(existing, trace) {
  const current = Array.isArray(existing) ? existing : [];
  return [...current, trace].slice(-20);
}
function estimatePromptTokensFromPayload(payload) {
  return Math.ceil(JSON.stringify(payload).length / 4);
}
function deepCloneRecord(value) {
  return JSON.parse(JSON.stringify(value));
}
function applyArrayCapAtPath(payload, path, limit) {
  let cursor = payload;
  for (let i = 0; i < path.length - 1; i += 1) {
    if (!cursor || typeof cursor !== "object") {
      return { changed: false, before: 0, after: 0 };
    }
    cursor = cursor[path[i]];
  }
  if (!cursor || typeof cursor !== "object") {
    return { changed: false, before: 0, after: 0 };
  }
  const key = path[path.length - 1];
  const existing = cursor[key];
  if (!Array.isArray(existing)) {
    return { changed: false, before: 0, after: 0 };
  }
  const before = existing.length;
  if (before <= limit) {
    return { changed: false, before, after: before };
  }
  cursor[key] = existing.slice(0, limit);
  return { changed: true, before, after: limit };
}
function trimPromptPayloadToBudget(input) {
  const budget = Math.max(1e3, input.inputTokenBudget);
  const cloned = deepCloneRecord(input.payload);
  const beforeTokens = estimatePromptTokensFromPayload(cloned);
  const capActions = [];
  if (beforeTokens <= budget) {
    return {
      payload: cloned,
      budgetTokens: budget,
      beforeTokens,
      afterTokens: beforeTokens,
      trimmed: false,
      capActions
    };
  }
  const capPasses = [
    [
      { path: ["metrics", "gsc", "current", "topQueries"], limit: 20 },
      { path: ["metrics", "gsc", "compare", "topQueries"], limit: 20 },
      { path: ["metrics", "gsc", "current", "topPages"], limit: 20 },
      { path: ["metrics", "gsc", "compare", "topPages"], limit: 20 },
      { path: ["deterministic", "kpiTrendRows"], limit: 90 },
      { path: ["deterministic", "queryOpportunityRows"], limit: 35 },
      { path: ["deterministic", "pageWinnerLoserRows"], limit: 35 },
      { path: ["deterministic", "nearWinKeywordRows"], limit: 30 },
      { path: ["deterministic", "cannibalizationRows"], limit: 20 },
      { path: ["deterministic", "technicalIssueRows"], limit: 25 },
      { path: ["deterministic", "actionBacklogRows"], limit: 15 },
      { path: ["deterministic", "contentDecayRows"], limit: 15 },
      { path: ["deterministic", "lostClickEstimateRows"], limit: 20 },
      { path: ["deterministic", "workbookDataset", "gscQueries"], limit: 250 },
      { path: ["deterministic", "workbookDataset", "gscPages"], limit: 250 },
      { path: ["deterministic", "workbookDataset", "gaChannels"], limit: 250 },
      { path: ["deterministic", "workbookDataset", "gaLandingPages"], limit: 250 },
      { path: ["siteChanges", "newPages"], limit: 75 },
      { path: ["siteChanges", "changedPages"], limit: 75 },
      { path: ["siteChanges", "removedPages"], limit: 75 }
    ],
    [
      { path: ["metrics", "gsc", "current", "topQueries"], limit: 12 },
      { path: ["metrics", "gsc", "compare", "topQueries"], limit: 12 },
      { path: ["metrics", "gsc", "current", "topPages"], limit: 12 },
      { path: ["metrics", "gsc", "compare", "topPages"], limit: 12 },
      { path: ["deterministic", "kpiTrendRows"], limit: 60 },
      { path: ["deterministic", "queryOpportunityRows"], limit: 20 },
      { path: ["deterministic", "pageWinnerLoserRows"], limit: 20 },
      { path: ["deterministic", "nearWinKeywordRows"], limit: 15 },
      { path: ["deterministic", "cannibalizationRows"], limit: 12 },
      { path: ["deterministic", "technicalIssueRows"], limit: 15 },
      { path: ["deterministic", "actionBacklogRows"], limit: 10 },
      { path: ["deterministic", "contentDecayRows"], limit: 10 },
      { path: ["deterministic", "lostClickEstimateRows"], limit: 12 },
      { path: ["deterministic", "workbookDataset", "gscQueries"], limit: 120 },
      { path: ["deterministic", "workbookDataset", "gscPages"], limit: 120 },
      { path: ["deterministic", "workbookDataset", "gaChannels"], limit: 120 },
      { path: ["deterministic", "workbookDataset", "gaLandingPages"], limit: 120 },
      { path: ["siteChanges", "newPages"], limit: 40 },
      { path: ["siteChanges", "changedPages"], limit: 40 },
      { path: ["siteChanges", "removedPages"], limit: 40 }
    ],
    [
      { path: ["metrics", "gsc", "current", "topQueries"], limit: 8 },
      { path: ["metrics", "gsc", "compare", "topQueries"], limit: 8 },
      { path: ["metrics", "gsc", "current", "topPages"], limit: 8 },
      { path: ["metrics", "gsc", "compare", "topPages"], limit: 8 },
      { path: ["deterministic", "kpiTrendRows"], limit: 40 },
      { path: ["deterministic", "queryOpportunityRows"], limit: 12 },
      { path: ["deterministic", "pageWinnerLoserRows"], limit: 12 },
      { path: ["deterministic", "nearWinKeywordRows"], limit: 10 },
      { path: ["deterministic", "cannibalizationRows"], limit: 8 },
      { path: ["deterministic", "technicalIssueRows"], limit: 10 },
      { path: ["deterministic", "actionBacklogRows"], limit: 8 },
      { path: ["deterministic", "contentDecayRows"], limit: 8 },
      { path: ["deterministic", "lostClickEstimateRows"], limit: 8 },
      { path: ["deterministic", "workbookDataset", "gscQueries"], limit: 60 },
      { path: ["deterministic", "workbookDataset", "gscPages"], limit: 60 },
      { path: ["deterministic", "workbookDataset", "gaChannels"], limit: 60 },
      { path: ["deterministic", "workbookDataset", "gaLandingPages"], limit: 60 },
      { path: ["siteChanges", "newPages"], limit: 20 },
      { path: ["siteChanges", "changedPages"], limit: 20 },
      { path: ["siteChanges", "removedPages"], limit: 20 }
    ]
  ];
  let afterTokens = beforeTokens;
  for (const pass of capPasses) {
    for (const op of pass) {
      const result = applyArrayCapAtPath(cloned, op.path, op.limit);
      if (result.changed) {
        capActions.push({ path: op.path.join("."), before: result.before, after: result.after });
      }
    }
    afterTokens = estimatePromptTokensFromPayload(cloned);
    if (afterTokens <= budget) break;
  }
  return {
    payload: cloned,
    budgetTokens: budget,
    beforeTokens,
    afterTokens,
    trimmed: afterTokens < beforeTokens,
    capActions
  };
}
function shouldRunXlsxForJob(job) {
  return !!job.payload && typeof job.payload === "object" && job.payload.runXlsx !== false;
}
function emptySiteChanges() {
  return { newPages: [], changedPages: [], removedPages: [] };
}
function readStoredSiteChanges(value) {
  if (!value || typeof value !== "object") return emptySiteChanges();
  const siteChanges = value;
  return {
    newPages: Array.isArray(siteChanges.newPages) ? siteChanges.newPages : [],
    changedPages: Array.isArray(siteChanges.changedPages) ? siteChanges.changedPages : [],
    removedPages: Array.isArray(siteChanges.removedPages) ? siteChanges.removedPages : []
  };
}
function readStoredCrawlData(value) {
  if (!value || typeof value !== "object") return null;
  const crawl = value.crawl;
  if (!crawl || typeof crawl !== "object") return null;
  return crawl;
}
function hasPendingReportJob(job) {
  return !!job && (job.status === "queued" || job.status === "processing");
}
async function queueXlsxJobFromReportGeneration(job) {
  await enqueueReportJob({
    reportId: job.reportId,
    teamId: job.teamId,
    kind: "render_xlsx",
    priority: 110,
    payload: { sourceJobId: job.id }
  });
  await appendReportJobEvent({
    jobId: job.id,
    reportId: job.reportId,
    teamId: job.teamId,
    phase: "store_report",
    level: "info",
    message: "Queued render_xlsx job"
  });
}
async function queueCrawlSiteChangesJobFromReportGeneration(job) {
  await enqueueReportJob({
    reportId: job.reportId,
    teamId: job.teamId,
    kind: "crawl_site_changes",
    priority: 105,
    payload: {
      sourceJobId: job.id,
      runXlsx: shouldRunXlsxForJob(job)
    }
  });
  await appendReportJobEvent({
    jobId: job.id,
    reportId: job.reportId,
    teamId: job.teamId,
    phase: "site_changes",
    level: "info",
    message: "Queued crawl_site_changes job"
  });
}
async function getTeamOwnerGoogleAuth(teamId) {
  const owner = await db.query.teamMembers.findFirst({
    where: and4(eq5(teamMembers.teamId, teamId), eq5(teamMembers.role, "owner"))
  });
  if (!owner) throw new Error("No team owner found");
  const googleAccount = await getGoogleAccountTokensForUser(owner.userId);
  if (!googleAccount?.accessToken) throw new Error("Google account not linked");
  const authClient = getGoogleAuthClient(
    googleAccount.accessToken,
    googleAccount.refreshToken ?? void 0
  );
  return { owner, googleAccount, authClient };
}
async function appendDetailExpansionAttempt(input) {
  await db.insert(reportDetailAiExpansions).values({
    id: `rdae_${nanoid4(12)}`,
    reportId: input.reportId,
    teamId: input.teamId,
    requestedByUserId: input.requestedByUserId,
    requestNumber: input.requestNumber,
    kind: input.kind,
    rowId: input.rowId,
    model: input.model,
    usage: input.usage,
    estimatedCostUsd: input.estimatedCostUsd != null ? String(input.estimatedCostUsd) : null,
    xRequestId: input.xRequestId,
    xClientRequestId: input.xClientRequestId,
    status: input.status,
    error: input.error
  });
}
async function processGenerateDetailJob(job, workerId) {
  const payload = job.payload && typeof job.payload === "object" ? job.payload : {};
  const rowTypeValue = typeof payload.rowType === "string" ? payload.rowType : null;
  const rowId = typeof payload.rowId === "string" ? payload.rowId : null;
  const requestedByUserId = typeof payload.requestedByUserId === "string" ? payload.requestedByUserId : null;
  if (!rowTypeValue || !rowId || !requestedByUserId || !isRowType(rowTypeValue)) {
    throw new Error("Invalid generate_detail payload");
  }
  const rowType = rowTypeValue;
  await setJobPhaseWithLog(job, workerId, "detail", { rowType, rowId });
  const report = await db.query.reports.findFirst({
    where: and4(eq5(reports.id, job.reportId), eq5(reports.teamId, job.teamId))
  });
  if (!report) throw new Error("Report not found");
  const property = await db.query.properties.findFirst({
    where: (table, { eq: eq6 }) => eq6(table.id, report.propertyId)
  });
  const aiReport = report.aiReportJson;
  if (!aiReport) throw new Error("No AI report data");
  const rowData = findRow(aiReport, rowType, rowId);
  if (!rowData) throw new Error("Row not found");
  if (!shouldGenerateDetail(rowData)) {
    await appendReportJobEvent({
      jobId: job.id,
      reportId: job.reportId,
      teamId: job.teamId,
      phase: "detail",
      level: "info",
      message: "Skipped detail generation because cached detail already exists",
      meta: { rowType, rowId }
    });
    return;
  }
  const [counter] = await db.update(reports).set({
    detailsRequestCount: sql2`coalesce(${reports.detailsRequestCount}, 0) + 1`
  }).where(eq5(reports.id, job.reportId)).returning({ requestNumber: reports.detailsRequestCount });
  if (!counter) throw new Error("Report not found");
  const requestNumber = counter.requestNumber;
  const xClientRequestId = makeDetailClientRequestId({
    reportId: job.reportId,
    requestNumber,
    kind: rowType
  });
  let usageSnapshot = null;
  let callCost = null;
  let xRequestId = null;
  try {
    const response = await openaiClient.chat.completions.create(
      {
        model: DETAIL_MODEL,
        messages: [
          {
            role: "user",
            content: buildActionDetailPrompt({
              siteUrl: property?.url ?? report.propertyId,
              dateRangeStart: String(report.dateRangeStart),
              dateRangeEnd: String(report.dateRangeEnd),
              rowType,
              rowData
            })
          }
        ],
        temperature: supportsTemperature2(DETAIL_MODEL) ? 0.2 : void 0,
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "action_detail",
            schema: detailSchema,
            strict: true
          }
        }
      },
      {
        headers: { "X-Client-Request-Id": xClientRequestId }
      }
    );
    xRequestId = extractChatCompletionRequestId(response);
    usageSnapshot = normalizeDetailUsage(response.usage ?? null);
    callCost = estimateOpenAICostUsd(DETAIL_MODEL, usageSnapshot);
    if (callCost != null) {
      await db.update(reports).set({
        detailsCostUsd: sql2`(coalesce(${reports.detailsCostUsd}, 0::numeric) + ${callCost})::numeric(12, 6)`
      }).where(eq5(reports.id, job.reportId));
    }
    const content = response.choices[0]?.message?.content;
    if (!content) throw new Error("No response from AI");
    let finalSerializedDetail = serializeActionDetail(content);
    let saved = false;
    for (let attempt = 0; attempt < MAX_DETAIL_WRITE_RETRIES; attempt += 1) {
      const latestReport = attempt === 0 ? report : await db.query.reports.findFirst({
        where: and4(eq5(reports.id, job.reportId), eq5(reports.teamId, job.teamId))
      });
      if (!latestReport) {
        throw new Error("Report not found");
      }
      const latestAiReport = latestReport.aiReportJson;
      if (!latestAiReport) {
        throw new Error("No AI report data");
      }
      const latestRowData = findRow(latestAiReport, rowType, rowId);
      if (!latestRowData) {
        throw new Error("Row not found");
      }
      if (!shouldGenerateDetail(latestRowData)) {
        finalSerializedDetail = String(latestRowData.actionDetail ?? finalSerializedDetail);
        saved = true;
        break;
      }
      const patched = patchRowActionDetail(latestAiReport, rowType, rowId, finalSerializedDetail);
      const updated = await db.update(reports).set({
        aiReportJson: patched,
        updatedAt: /* @__PURE__ */ new Date()
      }).where(and4(eq5(reports.id, job.reportId), eq5(reports.updatedAt, latestReport.updatedAt))).returning({ id: reports.id });
      if (updated.length > 0) {
        saved = true;
        break;
      }
    }
    if (!saved) {
      throw new DetailSaveConflictError("Could not save detail due to concurrent updates. Please retry.");
    }
    await appendDetailExpansionAttempt({
      reportId: job.reportId,
      teamId: job.teamId,
      requestedByUserId,
      requestNumber,
      kind: rowType,
      rowId,
      model: DETAIL_MODEL,
      usage: usageSnapshot?.raw ?? usageSnapshot,
      estimatedCostUsd: callCost,
      xRequestId,
      xClientRequestId,
      status: "success",
      error: null
    });
    await appendReportJobEvent({
      jobId: job.id,
      reportId: job.reportId,
      teamId: job.teamId,
      phase: "detail",
      level: "info",
      message: "Generated action detail",
      meta: { rowType, rowId, requestNumber }
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    try {
      await appendDetailExpansionAttempt({
        reportId: job.reportId,
        teamId: job.teamId,
        requestedByUserId,
        requestNumber,
        kind: rowType,
        rowId,
        model: DETAIL_MODEL,
        usage: usageSnapshot?.raw ?? usageSnapshot,
        estimatedCostUsd: callCost,
        xRequestId,
        xClientRequestId,
        status: "failed",
        error: message
      });
    } catch (insertError) {
      logWarn("ERROR", "failed to persist detail expansion audit row", {
        ...buildJobLogContext(job, workerId),
        rowType,
        rowId,
        insertError: insertError instanceof Error ? insertError.message : "unknown"
      });
    }
    throw error;
  }
}
async function loadDailyTrends(params) {
  const gscRows = await db.query.gscDailyFacts.findMany({
    where: and4(
      eq5(gscDailyFacts.propertyId, params.propertyId),
      gte(gscDailyFacts.sourceDate, params.start),
      lte(gscDailyFacts.sourceDate, params.end)
    ),
    orderBy: (t, { asc }) => [asc(t.sourceDate)]
  });
  const ga4Rows = params.ga4PropertyId ? await db.query.ga4DailyFacts.findMany({
    where: and4(
      eq5(ga4DailyFacts.ga4PropertyId, params.ga4PropertyId),
      gte(ga4DailyFacts.sourceDate, params.start),
      lte(ga4DailyFacts.sourceDate, params.end)
    ),
    orderBy: (t, { asc }) => [asc(t.sourceDate)]
  }) : [];
  const gaByDate = new Map(
    ga4Rows.map((row) => [formatDate(row.sourceDate), row])
  );
  return gscRows.map((row) => {
    const date = formatDate(row.sourceDate);
    const ga = gaByDate.get(date);
    return {
      date,
      clicks: row.clicks,
      impressions: row.impressions,
      ctr: asNum(row.ctr),
      position: asNum(row.position),
      sessions: ga?.sessions,
      users: ga?.users
    };
  });
}
function alignCompareSeriesToCurrent(current, compare) {
  return current.map((row, index) => {
    const cmp = compare[index];
    return {
      date: row.date,
      clicks: cmp?.clicks ?? 0,
      impressions: cmp?.impressions ?? 0,
      ctr: cmp?.ctr ?? 0,
      position: cmp?.position ?? 0,
      sessions: cmp?.sessions,
      users: cmp?.users
    };
  });
}
function defaultMasterPrompt() {
  return [
    "You are a senior technical SEO and growth analyst.",
    "Use deterministic metrics and page-change signals to produce a paid-grade actionable report.",
    "Prioritize findings by measurable impact and implementation effort.",
    "Never invent metrics. If evidence is weak, state uncertainty explicitly.",
    "Return valid structured JSON matching the schema."
  ].join("\n");
}
function buildTechnicalQuickWinsFromBacklog(backlog) {
  return backlog.slice(0, 10).map((item, index) => ({
    index: index + 1,
    measure: item.task,
    problem: item.why,
    solution: item.task,
    effort: item.effort,
    impact: item.impactScore >= 80 ? "KRITISCH" : item.impactScore >= 60 ? "HOCH" : item.impactScore >= 35 ? "MITTEL" : "NIEDRIG"
  }));
}
function buildFallbackReportFromDeterministic(params) {
  return {
    metadata: {
      language: params.language,
      schemaVersion: params.schemaVersion,
      reportTitle: params.reportTitle,
      periodLabel: params.periodLabel,
      createdAtIso: (/* @__PURE__ */ new Date()).toISOString(),
      notes: ["Fallback deterministic report used due to structured AI parse failure."]
    },
    dashboardMarkdown: params.markdown,
    executiveSummary: params.deterministic.executiveSummary,
    kpiComparisonRows: params.deterministic.kpiComparisonRows,
    contentAuditRows: [],
    keywordLandingpageRows: [],
    faqPlanRows: [],
    technicalQuickWinRows: buildTechnicalQuickWinsFromBacklog(params.deterministic.actionBacklogRows),
    actionPlanRows: params.deterministic.actionBacklogRows.slice(0, 10).map((row, index) => ({
      phase: index < 5 ? "1. Quick Wins" : "2. Sprint Backlog",
      week: index < 5 ? "1" : "2",
      measure: row.task,
      description: row.why,
      owner: row.ownerHint,
      status: "\u2610"
    })),
    clientChecklistRows: [],
    siteChanges: params.siteChanges,
    kpiTrendRows: params.deterministic.kpiTrendRows,
    queryOpportunityRows: params.deterministic.queryOpportunityRows,
    pageWinnerLoserRows: params.deterministic.pageWinnerLoserRows,
    nearWinKeywordRows: params.deterministic.nearWinKeywordRows,
    cannibalizationRows: params.deterministic.cannibalizationRows,
    technicalIssueRows: params.deterministic.technicalIssueRows,
    actionBacklogRows: params.deterministic.actionBacklogRows,
    workbookDataset: params.deterministic.workbookDataset
  };
}
async function buildReportInputs(job) {
  const report = await db.query.reports.findFirst({
    where: (r, { eq: eq6 }) => eq6(r.id, job.reportId)
  });
  if (!report) throw new Error("Report not found");
  const resolvedSources = await resolveReportSourcesForExistingReport(report);
  const property = resolvedSources.canonicalGscProperty;
  const teamAuth = await getTeamOwnerGoogleAuth(report.teamId);
  await ensureMetricsCoverageForReport({
    teamId: report.teamId,
    triggeredByUserId: teamAuth.owner.userId,
    property,
    dateRangeStart: formatDate(report.dateRangeStart),
    dateRangeEnd: formatDate(report.dateRangeEnd),
    compareRangeStart: formatDate(report.compareRangeStart),
    compareRangeEnd: formatDate(report.compareRangeEnd),
    authClient: teamAuth.authClient,
    refreshRecentDays: 7
  });
  const cachedMetrics = await composeReportMetricsFromCache({
    property,
    dateRangeStart: formatDate(report.dateRangeStart),
    dateRangeEnd: formatDate(report.dateRangeEnd),
    compareRangeStart: formatDate(report.compareRangeStart),
    compareRangeEnd: formatDate(report.compareRangeEnd),
    refreshRecentDays: 7
  });
  const [gscCurrent, gscCompare, ga4CurrentBase, ga4CompareBase] = cachedMetrics ? [
    cachedMetrics.gsc.current,
    cachedMetrics.gsc.compare,
    cachedMetrics.ga4.current,
    cachedMetrics.ga4.compare
  ] : await withExternalPhaseTimeout({
    label: "google metrics fetch",
    timeoutMs: readTimeoutMs("REPORT_GOOGLE_METRICS_TIMEOUT_MS", 6e4),
    operation: async () => {
      const [liveGscCurrent, liveGscCompare] = await Promise.all([
        fetchGscMetrics(
          teamAuth.authClient,
          property.url,
          formatDate(report.dateRangeStart),
          formatDate(report.dateRangeEnd)
        ),
        fetchGscMetrics(
          teamAuth.authClient,
          property.url,
          formatDate(report.compareRangeStart),
          formatDate(report.compareRangeEnd)
        )
      ]);
      const [liveGa4Current, liveGa4Compare] = property.ga4PropertyId ? await Promise.all([
        fetchGa4Metrics(
          teamAuth.authClient,
          property.ga4PropertyId,
          formatDate(report.dateRangeStart),
          formatDate(report.dateRangeEnd)
        ),
        fetchGa4Metrics(
          teamAuth.authClient,
          property.ga4PropertyId,
          formatDate(report.compareRangeStart),
          formatDate(report.compareRangeEnd)
        )
      ]) : [null, null];
      return [liveGscCurrent, liveGscCompare, liveGa4Current, liveGa4Compare];
    }
  });
  let ga4Current = ga4CurrentBase;
  let ga4Compare = ga4CompareBase;
  if (property.ga4PropertyId) {
    const ga4PropertyId = property.ga4PropertyId;
    try {
      const profile = await withExternalPhaseTimeout({
        label: "ga4 profile fetch",
        timeoutMs: readTimeoutMs("REPORT_GOOGLE_PROFILE_TIMEOUT_MS", 6e4),
        operation: () => fetchGa4ReportProfile(
          teamAuth.authClient,
          ga4PropertyId,
          formatDate(report.dateRangeStart),
          formatDate(report.dateRangeEnd),
          formatDate(report.compareRangeStart),
          formatDate(report.compareRangeEnd)
        )
      });
      ga4Current = { ...ga4CurrentBase ?? {}, ...profile.current };
      ga4Compare = { ...ga4CompareBase ?? {}, ...profile.compare };
    } catch (error) {
      await appendReportJobEvent({
        jobId: job.id,
        reportId: report.id,
        teamId: report.teamId,
        phase: "preprocess",
        level: "warn",
        message: "GA4 profile fetch failed; using summary-only GA4 payload",
        meta: {
          ga4PropertyId,
          error: error instanceof Error ? error.message : "Unknown GA4 profile error"
        }
      });
    }
  }
  const crawlingEnabled = await isEnabled("crawling_enabled", teamAuth.owner.userId);
  const crawlData = readStoredCrawlData(report.data);
  const siteChanges = readStoredSiteChanges(report.siteChanges);
  const queryPagePairsCurrent = await withExternalPhaseTimeout({
    label: "gsc query-page pair fetch",
    timeoutMs: readTimeoutMs("REPORT_GSC_QUERY_PAGE_PAIRS_TIMEOUT_MS", 6e4),
    operation: () => fetchGscQueryPagePairs(
      teamAuth.authClient,
      property.url,
      formatDate(report.dateRangeStart),
      formatDate(report.dateRangeEnd)
    )
  }).catch(() => []);
  const currentSeries = await loadDailyTrends({
    propertyId: property.id,
    ga4PropertyId: property.ga4PropertyId,
    start: formatDate(report.dateRangeStart),
    end: formatDate(report.dateRangeEnd)
  });
  const compareSeriesRaw = await loadDailyTrends({
    propertyId: property.id,
    ga4PropertyId: property.ga4PropertyId,
    start: formatDate(report.compareRangeStart),
    end: formatDate(report.compareRangeEnd)
  });
  const compareSeries = alignCompareSeriesToCurrent(currentSeries, compareSeriesRaw);
  const deterministic = buildDeterministicInsights({
    gscCurrent,
    gscCompare,
    ga4Current,
    ga4Compare,
    crawl: crawlData,
    siteChanges,
    currentSeries,
    compareSeries,
    queryPagePairsCurrent,
    compareRangeEnd: formatDate(report.compareRangeEnd)
  });
  const reportData = {
    gsc: {
      current: gscCurrent,
      compare: gscCompare
    },
    ga4: {
      current: ga4Current,
      compare: ga4Compare
    },
    crawl: crawlData
  };
  return {
    report,
    property,
    teamAuth,
    reportData,
    deterministic,
    siteChanges,
    crawlingEnabled
  };
}
async function pollUntilFinished(params) {
  const timeoutMs = params.maxWaitMs ?? parseInt(process.env.REPORT_OPENAI_POLL_TIMEOUT_MS ?? "360000", 10);
  const intervalMs = parseInt(process.env.REPORT_OPENAI_POLL_INTERVAL_MS ?? "3000", 10);
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    const polled = await pollOpenAiResponse({
      client: params.client,
      responseId: params.responseId,
      reportId: params.reportId,
      jobId: params.jobId
    });
    if (isTerminalResponseStatus(polled.status)) {
      return polled;
    }
    await sleep(intervalMs);
  }
  throw new Error("OpenAI background response polling timed out");
}
async function processGenerateReportJob(job, workerId) {
  const reportBefore = await db.query.reports.findFirst({
    where: (r, { eq: eq6 }) => eq6(r.id, job.reportId)
  });
  if (!reportBefore) throw new Error("Report not found");
  const payload = job.payload && typeof job.payload === "object" ? job.payload : {};
  const forceRegenerate = payload.forceRegenerate === true;
  const skipCrawlEnqueue = payload.skipCrawlEnqueue === true;
  if (shouldSkipExistingAiReport({
    hasAiReport: !!reportBefore.aiReportJson,
    forceRegenerate
  })) {
    await appendReportJobEvent({
      jobId: job.id,
      reportId: job.reportId,
      teamId: job.teamId,
      phase: "preprocess",
      level: "info",
      message: "AI report already exists; skipping generation"
    });
    logInfo("WORKING", "skipping generation because AI report already exists", {
      ...buildJobLogContext(job, workerId)
    });
    return;
  }
  await setJobPhaseWithLog(job, workerId, "preprocess");
  await db.update(reports).set({ status: "processing", aiStatus: "preprocessing", error: null, updatedAt: /* @__PURE__ */ new Date() }).where(eq5(reports.id, job.reportId));
  const latestCrawlJob = await findLatestJobForReport(job.reportId, ["crawl_site_changes"]);
  const { report, property, teamAuth, reportData, deterministic, siteChanges, crawlingEnabled } = await buildReportInputs(job);
  const generationPlan = planReportGenerationPass({
    crawlingEnabled,
    skipCrawlEnqueue,
    hasStoredSiteChanges: siteChanges.newPages.length > 0 || siteChanges.changedPages.length > 0 || siteChanges.removedPages.length > 0,
    hasPendingCrawlJob: hasPendingReportJob(latestCrawlJob),
    requestedRunXlsx: shouldRunXlsxForJob(job)
  });
  if (generationPlan.queueCrawlJob) {
    await queueCrawlSiteChangesJobFromReportGeneration(job);
  }
  await setJobPhaseWithLog(job, workerId, "site_changes");
  await appendReportJobEvent({
    jobId: job.id,
    reportId: report.id,
    teamId: report.teamId,
    phase: "site_changes",
    level: "info",
    message: "Using deferred site change data for report generation",
    meta: {
      crawlQueued: generationPlan.queueCrawlJob,
      siteChangesSource: generationPlan.siteChangesSource,
      newPages: siteChanges.newPages.length,
      changedPages: siteChanges.changedPages.length,
      removedPages: siteChanges.removedPages.length
    }
  });
  await setJobPhaseWithLog(job, workerId, "deterministic_scoring");
  await db.update(reports).set({
    data: reportData,
    siteChanges,
    updatedAt: /* @__PURE__ */ new Date()
  }).where(eq5(reports.id, job.reportId));
  const settings = await ensureDefaultAiReportSettings();
  const promptVersion = settings.promptVersionId ? await db.query.aiReportPromptVersions.findFirst({
    where: (p, { eq: eq6 }) => eq6(p.id, settings.promptVersionId)
  }) : null;
  const languageResolution = await resolveReportLanguage({
    userId: teamAuth.owner.userId,
    googleIdToken: teamAuth.googleAccount.idToken
  });
  const language = languageResolution.language;
  const promptInputPayload = {
    report: {
      id: report.id,
      propertyId: report.propertyId,
      period: `${formatDate(report.dateRangeStart)} - ${formatDate(report.dateRangeEnd)}`,
      comparePeriod: `${formatDate(report.compareRangeStart)} - ${formatDate(report.compareRangeEnd)}`,
      language
    },
    metrics: reportData,
    siteChanges,
    deterministic
  };
  const promptPayloadTrim = trimPromptPayloadToBudget({
    payload: promptInputPayload,
    inputTokenBudget: settings.inputTokenBudget
  });
  const payloadForPrompt = promptPayloadTrim.payload;
  if (promptPayloadTrim.trimmed) {
    await appendReportJobEvent({
      jobId: job.id,
      reportId: report.id,
      teamId: report.teamId,
      phase: "deterministic_scoring",
      level: "warn",
      message: "input_budget_trim_applied",
      meta: {
        budgetTokens: promptPayloadTrim.budgetTokens,
        beforeTokens: promptPayloadTrim.beforeTokens,
        afterTokens: promptPayloadTrim.afterTokens,
        capsApplied: promptPayloadTrim.capActions.slice(0, 25)
      }
    });
  }
  const prompt = buildAiReportPrompt({
    masterPrompt: promptVersion?.template ?? defaultMasterPrompt(),
    schemaVersion: settings.schemaVersion,
    language,
    outputStrategy: settings.outputStrategy,
    examples: promptVersion?.examples ?? null,
    reportMetadata: {
      reportId: report.id,
      teamId: report.teamId,
      property: property.url,
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
    },
    payload: payloadForPrompt,
    promptVersionId: promptVersion?.id ?? null,
    model: settings.model,
    precomputedContext: {
      ctrBenchmarkSource: deterministic.ctrBenchmarkSummary.ctrBenchmarkSource,
      contentDecayCount: deterministic.contentDecayRows.length,
      significantLosersCount: deterministic.alertsAndFlags.significantLosers.length
    }
  });
  const sanitizedSnapshot = buildSanitizedReportInputSnapshot(payloadForPrompt);
  await db.update(reports).set({
    aiInputSnapshotSanitized: sanitizedSnapshot,
    aiPromptVersionId: promptVersion?.id ?? null,
    aiPromptSnapshot: prompt.prompt,
    aiOutputStrategy: settings.outputStrategy,
    aiModel: settings.model,
    aiStatus: "generating",
    updatedAt: /* @__PURE__ */ new Date()
  }).where(eq5(reports.id, report.id));
  const modelOverride = typeof payload.modelOverride === "string" ? payload.modelOverride : null;
  const selectedModel = modelOverride ?? settings.model;
  const schemaForModel = settings.useStrictSchema ? aiSeoReportJsonSchemaForOpenAI : aiSeoReportJsonSchema;
  const costCapUsd = Number(process.env.REPORT_AI_COST_CAP_USD ?? "1");
  const maxOutputTokens = typeof settings.maxOutputTokens === "number" && settings.maxOutputTokens > 0 ? settings.maxOutputTokens : void 0;
  let activeOpenAiClient = openaiClient;
  let usedOrgHeaderFallback = false;
  const runWithOrgHeaderFallback = async (params) => {
    try {
      return await params.operation(activeOpenAiClient);
    } catch (error) {
      if (!configuredOpenAiOrg || usedOrgHeaderFallback || !isOpenAiOrganizationHeaderMismatch(error)) {
        throw error;
      }
      usedOrgHeaderFallback = true;
      activeOpenAiClient = openaiClientWithoutOrg;
      await appendReportJobEvent({
        jobId: job.id,
        reportId: report.id,
        teamId: report.teamId,
        phase: params.phase,
        level: "warn",
        message: "OpenAI org header mismatch; retrying without organization header",
        meta: {
          configuredOrg: configuredOpenAiOrg,
          retryMode: "without_org_header"
        }
      });
      return params.operation(activeOpenAiClient);
    }
  };
  await setJobPhaseWithLog(job, workerId, "openai_start");
  let startResult;
  let requestTraces = Array.isArray(report.openaiRequestIds) ? report.openaiRequestIds : [];
  if (reportBefore.openaiResponseId) {
    startResult = {
      responseId: reportBefore.openaiResponseId,
      status: "in_progress",
      strategyUsed: settings.outputStrategy,
      responseText: null,
      usage: null,
      xRequestId: null,
      xClientRequestId: `report_${report.id}_job_${job.id}_openai_resume`,
      guardrail: {
        model: selectedModel,
        maxOutputTokens: maxOutputTokens ?? null,
        estimatedMaxCostUsd: null,
        guardrailActions: ["resumed_existing_response"]
      },
      rawResponse: null
    };
    await appendReportJobEvent({
      jobId: job.id,
      reportId: report.id,
      teamId: report.teamId,
      phase: "openai_start",
      level: "info",
      message: "Resuming existing OpenAI background response",
      meta: { responseId: reportBefore.openaiResponseId }
    });
  } else {
    try {
      startResult = await withExternalPhaseTimeout({
        label: "openai generation start",
        timeoutMs: readTimeoutMs("REPORT_OPENAI_START_TIMEOUT_MS", 12e4),
        operation: () => runWithOrgHeaderFallback({
          phase: "openai_start",
          operation: (client) => startOpenAiWithFallback({
            client,
            reportId: report.id,
            jobId: job.id,
            prompt: prompt.prompt,
            schema: schemaForModel,
            strictSchema: settings.useStrictSchema,
            model: selectedModel,
            fallbackModel: "gpt-5-mini",
            strategy: settings.outputStrategy,
            temperature: Number(settings.temperature),
            maxOutputTokens,
            background: settings.useBackgroundMode,
            promptCacheKey: settings.usePromptCaching ? prompt.promptCacheKey : void 0,
            serviceTier: settings.serviceTier,
            costCapUsd
          })
        })
      });
    } catch (error) {
      if (!isSchemaContractError(error)) throw error;
      const errorMessage = error instanceof Error ? error.message : "OpenAI schema contract error";
      const markdown2 = `# SEO Report

${deterministic.executiveSummary.headline}`;
      const deterministicFallback = buildFallbackReportFromDeterministic({
        reportTitle: `SEO Report ${property.name}`,
        periodLabel: `${formatDate(report.dateRangeStart)} - ${formatDate(report.dateRangeEnd)}`,
        language,
        schemaVersion: settings.schemaVersion,
        markdown: markdown2,
        siteChanges,
        deterministic
      });
      await appendReportJobEvent({
        jobId: job.id,
        reportId: report.id,
        teamId: report.teamId,
        phase: "openai_start",
        level: "error",
        message: "schema_contract_error",
        meta: {
          error: errorMessage,
          outputStrategy: settings.outputStrategy,
          useStrictSchema: settings.useStrictSchema
        }
      });
      await setJobPhaseWithLog(job, workerId, "store_report");
      await db.update(reports).set({
        status: "complete",
        aiStatus: "partial",
        data: reportData,
        aiReportMarkdown: deterministicFallback.dashboardMarkdown,
        aiReportJson: deterministicFallback,
        aiUsage: null,
        aiEstimatedCostUsd: null,
        siteChanges,
        xlsxStatus: report.xlsxStatus ?? "pending",
        openaiResponseId: null,
        updatedAt: /* @__PURE__ */ new Date(),
        error: errorMessage
      }).where(eq5(reports.id, report.id));
      await appendReportJobEvent({
        jobId: job.id,
        reportId: report.id,
        teamId: report.teamId,
        phase: "store_report",
        level: "warn",
        message: "Stored deterministic fallback report after schema contract error"
      });
      if (generationPlan.shouldRunXlsxAfterThisPass) {
        await queueXlsxJobFromReportGeneration(job);
      }
      return;
    }
    requestTraces = appendRequestTrace(report.openaiRequestIds, {
      phase: "openai_start",
      xRequestId: startResult.xRequestId,
      xClientRequestId: startResult.xClientRequestId
    });
    await appendReportJobEvent({
      jobId: job.id,
      reportId: report.id,
      teamId: report.teamId,
      phase: "openai_start",
      level: "info",
      message: "OpenAI generation started",
      meta: {
        responseId: startResult.responseId,
        model: startResult.guardrail.model,
        guardrailActions: startResult.guardrail.guardrailActions,
        estimatedMaxCostUsd: startResult.guardrail.estimatedMaxCostUsd,
        strategy: startResult.strategyUsed,
        useStrictSchema: settings.useStrictSchema,
        language,
        languageSource: languageResolution.source,
        retriedWithoutOrgHeader: usedOrgHeaderFallback
      }
    });
  }
  await db.update(reports).set({
    openaiResponseId: startResult.responseId,
    openaiRequestIds: requestTraces,
    aiStatus: "generating",
    aiModel: startResult.guardrail.model,
    updatedAt: /* @__PURE__ */ new Date()
  }).where(eq5(reports.id, report.id));
  await setJobPhaseWithLog(job, workerId, "openai_poll");
  let finalStatus = startResult.status;
  let finalUsage = startResult.usage;
  let finalResponseText = startResult.responseText;
  let finalPayload = startResult.responseText || startResult.rawResponse ? extractStructuredPayload({
    responseText: startResult.responseText,
    outputPayload: null,
    rawResponse: startResult.rawResponse
  }) : null;
  if (startResult.responseId && (settings.useBackgroundMode || !isTerminalResponseStatus(startResult.status))) {
    const responseId = startResult.responseId;
    const polled = await withExternalPhaseTimeout({
      label: "openai generation poll",
      timeoutMs: getOpenAiPollPhaseTimeoutMs(),
      operation: () => runWithOrgHeaderFallback({
        phase: "openai_poll",
        operation: (client) => pollUntilFinished({
          client,
          responseId,
          reportId: report.id,
          jobId: job.id
        })
      })
    });
    const pollTrace = appendRequestTrace(requestTraces, {
      phase: "openai_poll",
      xRequestId: polled.xRequestId,
      xClientRequestId: `report_${report.id}_job_${job.id}_openai_poll`
    });
    await db.update(reports).set({
      openaiRequestIds: pollTrace,
      updatedAt: /* @__PURE__ */ new Date()
    }).where(eq5(reports.id, report.id));
    finalStatus = polled.status;
    finalUsage = polled.usage;
    finalResponseText = polled.responseText;
    finalPayload = extractStructuredPayload({
      responseText: polled.responseText,
      outputPayload: polled.outputPayload,
      rawResponse: polled.rawResponse
    });
  }
  if (!isSuccessfulResponseStatus(finalStatus)) {
    throw new Error(`OpenAI response did not complete successfully (status: ${finalStatus ?? "unknown"})`);
  }
  await setJobPhaseWithLog(job, workerId, "parse");
  let parsed = safeParseAiSeoReport(finalPayload);
  let schemaContractFallbackError = null;
  let usedDeterministicFallback = false;
  if (!parsed.success) {
    await appendReportJobEvent({
      jobId: job.id,
      reportId: report.id,
      teamId: report.teamId,
      phase: "parse",
      level: "warn",
      message: "Primary structured parse failed; retrying with fallback strategy",
      meta: { error: parsed.error.message }
    });
    try {
      const fallbackStart = await withExternalPhaseTimeout({
        label: "openai parse fallback",
        timeoutMs: readTimeoutMs("REPORT_OPENAI_PARSE_FALLBACK_TIMEOUT_MS", 12e4),
        operation: () => runWithOrgHeaderFallback({
          phase: "parse",
          operation: (client) => startOpenAiReportGeneration({
            client,
            reportId: report.id,
            jobId: job.id,
            prompt: prompt.prompt,
            schema: schemaForModel,
            strictSchema: settings.useStrictSchema,
            model: "gpt-5-mini",
            fallbackModel: "gpt-5-mini",
            strategy: chooseFallbackStrategy(settings.outputStrategy),
            temperature: Number(settings.temperature),
            maxOutputTokens: maxOutputTokens != null ? Math.max(1200, Math.floor(maxOutputTokens * 0.8)) : void 0,
            background: false,
            promptCacheKey: settings.usePromptCaching ? `${prompt.promptCacheKey}:fallback` : void 0,
            serviceTier: settings.serviceTier,
            costCapUsd,
            phase: "openai_parse_fallback"
          })
        })
      });
      finalUsage = fallbackStart.usage;
      finalResponseText = fallbackStart.responseText;
      finalPayload = extractStructuredPayload({
        responseText: fallbackStart.responseText,
        outputPayload: null,
        rawResponse: fallbackStart.rawResponse
      });
      parsed = safeParseAiSeoReport(finalPayload);
    } catch (error) {
      if (!isSchemaContractError(error)) throw error;
      schemaContractFallbackError = error instanceof Error ? error.message : "OpenAI schema contract error during parse fallback";
      await appendReportJobEvent({
        jobId: job.id,
        reportId: report.id,
        teamId: report.teamId,
        phase: "parse",
        level: "error",
        message: "schema_contract_error",
        meta: {
          error: schemaContractFallbackError,
          outputStrategy: settings.outputStrategy,
          useStrictSchema: settings.useStrictSchema
        }
      });
    }
  }
  const markdown = typeof finalResponseText === "string" && finalResponseText.trim() ? finalResponseText : `# SEO Report

${deterministic.executiveSummary.headline}`;
  const aiReport = parsed.success ? {
    ...parseAiSeoReport(parsed.data),
    metadata: {
      ...parsed.data.metadata,
      language,
      schemaVersion: settings.schemaVersion,
      reportTitle: parsed.data.metadata.reportTitle || `SEO Report ${property.name}`,
      periodLabel: parsed.data.metadata.periodLabel || `${formatDate(report.dateRangeStart)} - ${formatDate(report.dateRangeEnd)}`,
      createdAtIso: (/* @__PURE__ */ new Date()).toISOString()
    },
    dashboardMarkdown: parsed.data.dashboardMarkdown || markdown,
    executiveSummary: parsed.data.executiveSummary?.headline ? parsed.data.executiveSummary : deterministic.executiveSummary,
    kpiComparisonRows: parsed.data.kpiComparisonRows?.length > 0 ? parsed.data.kpiComparisonRows : deterministic.kpiComparisonRows,
    technicalQuickWinRows: parsed.data.technicalQuickWinRows?.length > 0 ? parsed.data.technicalQuickWinRows : buildTechnicalQuickWinsFromBacklog(deterministic.actionBacklogRows),
    actionPlanRows: parsed.data.actionPlanRows?.length > 0 ? parsed.data.actionPlanRows : deterministic.actionBacklogRows.slice(0, 10).map((row, index) => ({
      phase: index < 5 ? "1. Quick Wins" : "2. Sprint Backlog",
      week: index < 5 ? "1" : "2",
      measure: row.task,
      description: row.why,
      owner: row.ownerHint,
      status: "\u2610"
    })),
    siteChanges,
    kpiTrendRows: deterministic.kpiTrendRows,
    queryOpportunityRows: deterministic.queryOpportunityRows,
    pageWinnerLoserRows: deterministic.pageWinnerLoserRows,
    nearWinKeywordRows: deterministic.nearWinKeywordRows,
    cannibalizationRows: deterministic.cannibalizationRows,
    technicalIssueRows: deterministic.technicalIssueRows,
    actionBacklogRows: deterministic.actionBacklogRows,
    workbookDataset: deterministic.workbookDataset
  } : buildFallbackReportFromDeterministic({
    reportTitle: `SEO Report ${property.name}`,
    periodLabel: `${formatDate(report.dateRangeStart)} - ${formatDate(report.dateRangeEnd)}`,
    language,
    schemaVersion: settings.schemaVersion,
    markdown,
    siteChanges,
    deterministic
  });
  if (!parsed.success) {
    usedDeterministicFallback = true;
  }
  if (schemaContractFallbackError) {
    usedDeterministicFallback = true;
  }
  const estimatedCost = estimateOpenAICostUsd(startResult.guardrail.model, finalUsage);
  await setJobPhaseWithLog(job, workerId, "store_report");
  await db.update(reports).set({
    status: "complete",
    aiStatus: usedDeterministicFallback ? "partial" : "complete",
    data: reportData,
    aiReportMarkdown: aiReport.dashboardMarkdown,
    aiReportJson: aiReport,
    aiUsage: finalUsage?.raw ?? null,
    aiEstimatedCostUsd: estimatedCost != null ? String(estimatedCost) : null,
    siteChanges,
    xlsxStatus: report.xlsxStatus ?? "pending",
    openaiResponseId: startResult.responseId,
    updatedAt: /* @__PURE__ */ new Date(),
    error: schemaContractFallbackError
  }).where(eq5(reports.id, report.id));
  await appendReportJobEvent({
    jobId: job.id,
    reportId: report.id,
    teamId: report.teamId,
    phase: "store_report",
    level: "info",
    message: "AI report generated and persisted",
    meta: {
      aiModel: startResult.guardrail.model,
      strategy: settings.outputStrategy,
      aiStatus: usedDeterministicFallback ? "partial" : "complete",
      estimatedCost,
      requestIds: appendRequestTrace(report.openaiRequestIds, {
        phase: "openai_complete",
        xRequestId: null,
        xClientRequestId: `report_${report.id}_job_${job.id}_openai_complete`
      })
    }
  });
  if (generationPlan.shouldRunXlsxAfterThisPass) {
    await queueXlsxJobFromReportGeneration(job);
  }
}
async function processCrawlSiteChangesJob(job, workerId) {
  await setJobPhaseWithLog(job, workerId, "site_changes");
  const report = await db.query.reports.findFirst({
    where: (r, { eq: eq6 }) => eq6(r.id, job.reportId)
  });
  if (!report) throw new Error("Report not found");
  const resolvedSources = await resolveReportSourcesForExistingReport(report);
  const property = resolvedSources.canonicalGscProperty;
  const teamAuth = await getTeamOwnerGoogleAuth(report.teamId);
  const crawlingEnabled = await isEnabled("crawling_enabled", teamAuth.owner.userId);
  if (!crawlingEnabled) {
    await appendReportJobEvent({
      jobId: job.id,
      reportId: job.reportId,
      teamId: job.teamId,
      phase: "site_changes",
      level: "info",
      message: "Skipped crawl_site_changes because crawling is disabled"
    });
    return;
  }
  const crawlData = await withExternalPhaseTimeout({
    label: "site crawl",
    timeoutMs: readTimeoutMs("REPORT_CRAWL_TIMEOUT_MS", 18e4),
    operation: () => crawlWebsite(property.url, 120)
  });
  const siteChanges = await computeAndPersistSiteChanges({
    reportId: report.id,
    teamId: report.teamId,
    propertyId: property.id,
    pages: crawlData.pages
  });
  const existingData = report.data && typeof report.data === "object" ? report.data : {};
  await db.update(reports).set({
    data: { ...existingData, crawl: crawlData },
    siteChanges,
    updatedAt: /* @__PURE__ */ new Date()
  }).where(eq5(reports.id, report.id));
  await appendReportJobEvent({
    jobId: job.id,
    reportId: job.reportId,
    teamId: job.teamId,
    phase: "site_changes",
    level: "info",
    message: "Crawl and site change tracking completed",
    meta: {
      pages: crawlData.pages.length,
      newPages: siteChanges.newPages.length,
      changedPages: siteChanges.changedPages.length,
      removedPages: siteChanges.removedPages.length
    }
  });
  await enqueueReportJob({
    reportId: report.id,
    teamId: report.teamId,
    kind: "generate_report",
    priority: 95,
    payload: buildCrawlRefreshGeneratePayload({
      runXlsx: shouldRunXlsxForJob(job)
    })
  });
  await appendReportJobEvent({
    jobId: job.id,
    reportId: job.reportId,
    teamId: job.teamId,
    phase: "queued",
    level: "info",
    message: "Queued generate_report refresh after crawl completion"
  });
}
async function processXlsxRenderJob(job, workerId) {
  await setJobPhaseWithLog(job, workerId, "xlsx");
  logInfo("XLSX", "starting xlsx generation", buildJobLogContext(job, workerId));
  const report = await db.query.reports.findFirst({
    where: (r, { eq: eq6 }) => eq6(r.id, job.reportId)
  });
  if (!report) throw new Error("Report not found");
  if (!report.aiReportJson) {
    throw new Error("Cannot render XLSX: aiReportJson is missing");
  }
  const aiReport = parseAiSeoReport(report.aiReportJson);
  await db.update(reports).set({ xlsxStatus: "generating", updatedAt: /* @__PURE__ */ new Date() }).where(eq5(reports.id, job.reportId));
  const buffer = await buildWorkbookBufferFromAiReport(aiReport);
  const store = getArtifactStore();
  const artifact = await store.put({
    reportId: job.reportId,
    kind: "xlsx",
    fileName: "seo-report.xlsx",
    contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    buffer
  });
  await db.update(reports).set({
    xlsxStatus: "ready",
    xlsxArtifactKey: artifact.key,
    xlsxArtifactUrl: artifact.url,
    updatedAt: /* @__PURE__ */ new Date()
  }).where(eq5(reports.id, job.reportId));
  logInfo("XLSX", "xlsx artifact stored", {
    ...buildJobLogContext(job, workerId),
    artifactKey: artifact.key
  });
}
async function processClaimedJob(job, workerId, hooks) {
  let heartbeatTimer = null;
  const startedAtMs = Date.now();
  try {
    hooks?.onJobStart?.({ workerId, jobId: job.id, nowMs: startedAtMs });
    logInfo("WORKING", "starting claimed job", buildJobLogContext(job, workerId));
    heartbeatTimer = setInterval(() => {
      void heartbeatReportJob(job.id, workerId);
    }, 1e4);
    if (job.kind === "generate_report") {
      await processGenerateReportJob(job, workerId);
    } else if (job.kind === "generate_detail") {
      await processGenerateDetailJob(job, workerId);
    } else if (job.kind === "render_xlsx") {
      await processXlsxRenderJob(job, workerId);
    } else if (job.kind === "crawl_site_changes") {
      await processCrawlSiteChangesJob(job, workerId);
    } else {
      throw new Error(`Unsupported job kind: ${job.kind}`);
    }
    await completeReportJob(job.id, "done");
    logInfo("WORKING", "job completed", {
      ...buildJobLogContext(job, workerId),
      durationMs: Date.now() - startedAtMs
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown worker error";
    const canRetry = job.attempts < job.maxAttempts;
    if (canRetry) {
      const backoffSeconds = 30 * job.attempts;
      logError(
        "ERROR",
        "job failed and will be retried",
        {
          ...buildJobLogContext(job, workerId),
          backoffSeconds,
          error: message
        },
        error
      );
      await requeueJobForRetry(job.id, message, backoffSeconds);
      logWarn("WORKING", "job requeued for retry", {
        ...buildJobLogContext(job, workerId),
        backoffSeconds,
        nextAttempt: job.attempts + 1
      });
    } else {
      logFatal(
        "FATAL",
        "job failed permanently after max attempts",
        {
          ...buildJobLogContext(job, workerId),
          error: message
        },
        error
      );
      if (job.kind === "render_xlsx") {
        await db.update(reports).set({ xlsxStatus: "failed", aiStatus: "partial", error: message, updatedAt: /* @__PURE__ */ new Date() }).where(eq5(reports.id, job.reportId));
      } else if (job.kind === "crawl_site_changes") {
        await appendReportJobEvent({
          jobId: job.id,
          reportId: job.reportId,
          teamId: job.teamId,
          phase: "site_changes",
          level: "error",
          message: "Crawl and site change tracking failed",
          meta: { error: message }
        });
      } else if (job.kind === "generate_detail") {
        await appendReportJobEvent({
          jobId: job.id,
          reportId: job.reportId,
          teamId: job.teamId,
          phase: "detail",
          level: "error",
          message: "Detail generation failed",
          meta: { error: message }
        });
      } else {
        await db.update(reports).set({ status: "failed", aiStatus: "failed", error: message, updatedAt: /* @__PURE__ */ new Date() }).where(eq5(reports.id, job.reportId));
      }
      await failReportJob(job.id, message, job.phase);
    }
  } finally {
    if (heartbeatTimer) clearInterval(heartbeatTimer);
    hooks?.onJobEnd?.({ workerId, jobId: job.id, nowMs: Date.now() });
  }
}
async function runSingleReportWorkerTick(workerId = `worker_${nanoid4(8)}`, hooks) {
  const job = await claimNextReportJob(workerId);
  if (!job) return { processed: false };
  logInfo("WORKING", "claimed job", buildJobLogContext(job, workerId));
  await processClaimedJob(job, workerId, hooks);
  return { processed: true, jobId: job.id };
}
function startReportWorkerLoop(input) {
  let stopped = false;
  const workerId = `worker_${nanoid4(8)}`;
  const intervalMs = parseInt(process.env.REPORT_WORKER_POLL_MS ?? "3000", 10);
  const maxPollMs = parseInt(process.env.REPORT_WORKER_MAX_POLL_MS ?? "30000", 10);
  const idlePulseMs = getIdlePulseMs();
  let isIdle = false;
  let idleSinceMs = 0;
  let lastIdlePulseMs = 0;
  let idleCount = 0;
  let isRunning = false;
  let pendingTimeout = null;
  let listenConn = null;
  logInfo("BOOT", "worker loop starting", { workerId, pollMs: intervalMs, idlePulseMs });
  const triggerImmediatePoll = () => {
    if (stopped) return;
    if (pendingTimeout !== null) {
      clearTimeout(pendingTimeout);
      pendingTimeout = null;
    }
    idleCount = 0;
    void loop();
  };
  try {
    const directUrl = requireDirectDatabaseUrl();
    listenConn = postgres(directUrl, { max: 1 });
    listenConn.listen("job_available", triggerImmediatePoll).catch((err) => {
      logFatal("BOOT", "LISTEN setup failed", { workerId }, err);
      listenConn = null;
    });
    logInfo("BOOT", "LISTEN/NOTIFY enabled", { workerId });
  } catch (err) {
    const reason = err instanceof Error && err.message.includes("DIRECT_DATABASE_URL is required") ? "DIRECT_DATABASE_URL not set" : `DIRECT_DATABASE_URL misconfigured: ${err instanceof Error ? err.message : String(err)}`;
    logInfo("BOOT", `LISTEN/NOTIFY disabled (${reason})`, { workerId });
  }
  const loop = async () => {
    if (stopped) return;
    if (isRunning) return;
    isRunning = true;
    let processed = false;
    try {
      const result = await runSingleReportWorkerTick(workerId, input?.hooks);
      processed = result.processed;
      const now = Date.now();
      input?.hooks?.onLoopTick?.({
        workerId,
        nowMs: now,
        processed: result.processed,
        jobId: result.processed ? result.jobId : void 0
      });
      if (!result.processed) {
        if (!isIdle) {
          isIdle = true;
          idleSinceMs = now;
          lastIdlePulseMs = now;
          logInfo("IDLE", "queue is idle", { workerId });
        } else if (now - lastIdlePulseMs >= idlePulseMs) {
          lastIdlePulseMs = now;
          logInfo("IDLE", "queue still idle", { workerId, idleForMs: now - idleSinceMs });
        }
      } else if (isIdle) {
        logInfo("WORKING", "leaving idle state after claiming work", {
          workerId,
          jobId: result.jobId,
          idleForMs: now - idleSinceMs
        });
        isIdle = false;
        idleSinceMs = 0;
        lastIdlePulseMs = 0;
      }
    } catch (error) {
      logFatal("FATAL", "worker loop error", { workerId }, error);
      input?.hooks?.onFatalError?.({ workerId, error, nowMs: Date.now() });
    } finally {
      isRunning = false;
      if (!stopped) {
        const delay = Math.min(intervalMs * Math.pow(2, idleCount), maxPollMs);
        if (!processed) {
          idleCount++;
        } else {
          idleCount = 0;
        }
        pendingTimeout = setTimeout(loop, delay);
      }
    }
  };
  void loop();
  return {
    stop() {
      stopped = true;
      if (pendingTimeout !== null) {
        clearTimeout(pendingTimeout);
        pendingTimeout = null;
      }
      if (listenConn) {
        listenConn.end({ timeout: 5 }).catch(() => {
        });
        listenConn = null;
      }
    }
  };
}
async function ensureDefaultAiReportSettings() {
  const existing = await db.query.aiReportSettings.findFirst({
    orderBy: (t, { desc: desc2 }) => [desc2(t.updatedAt)]
  });
  if (existing) return existing;
  const [created] = await db.insert(aiReportSettings).values({
    id: "default",
    model: process.env.OPENAI_MODEL ?? "gpt-5-mini",
    outputStrategy: "json_schema",
    language: "de",
    useStrictSchema: true,
    schemaVersion: "v1"
  }).returning();
  return created;
}
export {
  ensureDefaultAiReportSettings,
  runSingleReportWorkerTick,
  startReportWorkerLoop
};
