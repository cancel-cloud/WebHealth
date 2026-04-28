import {
  resolveTeamReportSources
} from "./chunk-DBENP726.js";
import {
  claimNextPropertyRefreshJob,
  completePropertyRefreshJob,
  failPropertyRefreshJob,
  heartbeatPropertyRefreshJob,
  storePropertyCrawlSnapshot,
  updatePropertyRefreshJobProgress
} from "./chunk-HOT5KVBW.js";
import {
  db
} from "./chunk-GSUZOY5F.js";
import "./chunk-4NLGD3XI.js";
import "./chunk-EJ6QGHXW.js";
import "./chunk-3LHI6BO3.js";

// packages/shared/src/lib/property-refresh-worker.ts
import { nanoid } from "nanoid";

// packages/shared/src/lib/crawl.ts
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

// packages/shared/src/lib/property-refresh-worker.ts
async function isRefreshPropertyActive(job) {
  const property = await db.query.properties.findFirst({
    where: (table, { and, eq: eqFn }) => and(eqFn(table.id, job.propertyId), eqFn(table.teamId, job.teamId), eqFn(table.active, true)),
    columns: { id: true }
  });
  return Boolean(property);
}
async function warmDashboardFromPayload(job) {
  const payload = job.payload ?? {};
  const { getLiveDashboardData } = await import("./live-dashboard-JL7G6ENM.js");
  await getLiveDashboardData({
    teamId: job.teamId,
    propertyId: job.propertyId,
    preset: typeof payload.preset === "string" ? payload.preset : null,
    compareMode: typeof payload.compareMode === "string" ? payload.compareMode : null,
    startDate: typeof payload.startDate === "string" ? payload.startDate : null,
    endDate: typeof payload.endDate === "string" ? payload.endDate : null
  });
}
async function processCrawlRefreshJob(job) {
  console.log(`[property-refresh][INFO] starting crawl refresh job=${job.id} property=${job.propertyId}`);
  await updatePropertyRefreshJobProgress({
    jobId: job.id,
    phase: "crawl",
    message: job.payload && typeof job.payload === "object" && job.payload.triggerSource === "automation" ? "Background technical scan refresh running\u2026" : "Refreshing technical scan\u2026"
  });
  const resolved = await resolveTeamReportSources(job.teamId, job.propertyId);
  const property = resolved.canonicalGscProperty;
  const crawlData = await crawlWebsite(property.url, 120);
  await storePropertyCrawlSnapshot({
    teamId: job.teamId,
    propertyId: property.id,
    refreshJobId: job.id,
    crawlData
  });
  await updatePropertyRefreshJobProgress({
    jobId: job.id,
    phase: "analysis",
    message: "Recomputing ranked actions\u2026",
    progressMeta: {
      crawlPages: crawlData.pages.length
    }
  });
  await warmDashboardFromPayload(job);
  console.log(`[property-refresh][INFO] completed crawl refresh job=${job.id} property=${job.propertyId} pages=${crawlData.pages.length}`);
  await completePropertyRefreshJob(job.id, "Technical refresh complete", {
    crawlPages: crawlData.pages.length
  });
}
async function processClaimedJob(job, workerId) {
  let heartbeatTimer = null;
  try {
    heartbeatTimer = setInterval(() => {
      void heartbeatPropertyRefreshJob(job.id, workerId);
    }, 1e4);
    if (!await isRefreshPropertyActive(job)) {
      await completePropertyRefreshJob(job.id, "Property is inactive; refresh skipped");
      return;
    }
    if (job.jobType === "crawl_refresh") {
      await processCrawlRefreshJob(job);
      return;
    }
    if (job.jobType === "decision_refresh") {
      console.log(`[property-refresh][INFO] starting decision refresh job=${job.id} property=${job.propertyId}`);
      await updatePropertyRefreshJobProgress({
        jobId: job.id,
        phase: "analysis",
        message: "Recomputing ranked actions\u2026"
      });
      await warmDashboardFromPayload(job);
      console.log(`[property-refresh][INFO] completed decision refresh job=${job.id} property=${job.propertyId}`);
      await completePropertyRefreshJob(job.id, "Decision refresh complete");
      return;
    }
    throw new Error(`Unsupported property refresh job type: ${job.jobType}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Property refresh failed";
    console.error(`[property-refresh][ERROR] job failed job=${job.id} property=${job.propertyId} message=${message}`);
    await failPropertyRefreshJob(job.id, message, job.phase, {
      error: message
    });
  } finally {
    if (heartbeatTimer) clearInterval(heartbeatTimer);
  }
}
async function runSinglePropertyRefreshWorkerTick(workerId = `pref_${nanoid(8)}`, options = {}) {
  const job = await claimNextPropertyRefreshJob(workerId, { lane: options.lane ?? "manual" });
  if (!job) return { processed: false };
  await processClaimedJob(job, workerId);
  return { processed: true, jobId: job.id };
}
function startPropertyRefreshWorkerLoop(input = {}) {
  let stopped = false;
  let isRunning = false;
  let pendingTimeout = null;
  const lane = input.lane ?? "manual";
  const workerId = `${input.workerName ?? "pref"}_${nanoid(8)}`;
  const intervalMs = input.intervalMs ?? parseInt(process.env.PROPERTY_REFRESH_WORKER_POLL_MS ?? "4000", 10);
  const maxPollMs = input.maxPollMs ?? parseInt(process.env.PROPERTY_REFRESH_WORKER_MAX_POLL_MS ?? "30000", 10);
  let idleCount = 0;
  const loop = async () => {
    if (stopped || isRunning) return;
    isRunning = true;
    let processed = false;
    try {
      const result = await runSinglePropertyRefreshWorkerTick(workerId, { lane });
      processed = result.processed;
      if (processed) {
        console.log(`[property-refresh][INFO] processed job worker=${workerId} job=${result.jobId}`);
      }
    } finally {
      isRunning = false;
      if (!stopped) {
        const delay = Math.min(intervalMs * Math.pow(2, idleCount), maxPollMs);
        idleCount = processed ? 0 : idleCount + 1;
        pendingTimeout = setTimeout(loop, delay);
      }
    }
  };
  console.log(`[property-refresh][INFO] loop started worker=${workerId} lane=${lane} pollMs=${intervalMs} maxPollMs=${maxPollMs}`);
  void loop();
  return {
    stop() {
      stopped = true;
      if (pendingTimeout) clearTimeout(pendingTimeout);
    }
  };
}
export {
  runSinglePropertyRefreshWorkerTick,
  startPropertyRefreshWorkerLoop
};
