import {
  db
} from "./chunk-PCKVAB6H.js";
import {
  account,
  ga4DailyFacts,
  ga4DailyRaw,
  ga4ReportArtifacts,
  gscDailyFacts,
  gscDailyRaw,
  metricsBackfillJobs,
  systemLogs,
  teamMembers
} from "./chunk-EBBHWYW3.js";

// packages/shared/src/lib/metrics-cache.ts
import { and as and2, eq as eq2, sql } from "drizzle-orm";
import { nanoid } from "nanoid";

// packages/shared/src/lib/google/api.ts
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
async function fetchGscMetricsBatch(authClient, siteUrl, dateStart, dateEnd) {
  const searchConsole = google.webmasters({ version: "v3", auth: authClient });
  const [dailyRes, queriesRes, pagesRes, queryPageRes, countriesRes, devicesRes] = await Promise.all([
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
    // 4. Daily query-page pairs for intent and cannibalization evidence
    searchConsole.searchanalytics.query({
      siteUrl,
      requestBody: { startDate: dateStart, endDate: dateEnd, dimensions: ["date", "query", "page"], rowLimit: 25e3 }
    }),
    // 5. Daily country breakdown
    searchConsole.searchanalytics.query({
      siteUrl,
      requestBody: { startDate: dateStart, endDate: dateEnd, dimensions: ["date", "country"], rowLimit: 25e3 }
    }),
    // 6. Daily device breakdown
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
      queryPagePairs: [],
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
  const queryPagePairsByDay = /* @__PURE__ */ new Map();
  for (const row of queryPageRes.data.rows ?? []) {
    const [date, query, page] = row.keys;
    if (!queryPagePairsByDay.has(date)) queryPagePairsByDay.set(date, []);
    queryPagePairsByDay.get(date).push({
      query,
      page,
      clicks: row.clicks ?? 0,
      impressions: row.impressions ?? 0,
      ctr: row.ctr ?? 0,
      position: row.position ?? 0
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
    const pairs = queryPagePairsByDay.get(date) ?? [];
    entry.queryPagePairs = pairs.sort((a, b) => b.clicks - a.clicks).slice(0, 50);
    entry.topCountries = countriesByDay.get(date) ?? [];
    entry.topDevices = devicesByDay.get(date) ?? [];
  }
  return dayMap;
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
async function fetchGa4ReportProfileForRange(authClient, propertyId, startDate, endDate) {
  const analyticsData = google.analyticsdata({ version: "v1beta", auth: authClient });
  return fetchGa4ProfileForPeriod(
    analyticsData,
    `properties/${propertyId}`,
    startDate,
    endDate
  );
}

// packages/shared/src/lib/metrics-window-policy.ts
var MAX_METRICS_REFRESH_WINDOW_DAYS = 90;
var DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
var DAY_MS = 24 * 60 * 60 * 1e3;
function parseDateString(value) {
  if (typeof value !== "string" || !DATE_PATTERN.test(value)) return null;
  const date = /* @__PURE__ */ new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString().slice(0, 10) === value ? date : null;
}
function metricsWindowDaysInclusive(start, end) {
  const startDate = parseDateString(start);
  const endDate = parseDateString(end);
  if (!startDate || !endDate) return Number.NaN;
  return Math.floor((endDate.getTime() - startDate.getTime()) / DAY_MS) + 1;
}
function validateMetricsRefreshWindow(window) {
  const startDate = parseDateString(window.dateStart);
  const endDate = parseDateString(window.dateEnd);
  if (!startDate || !endDate) {
    return { ok: false, message: "A valid refresh window is required." };
  }
  if (startDate.getTime() > endDate.getTime()) {
    return { ok: false, message: "Refresh start date must be on or before end date." };
  }
  const days = metricsWindowDaysInclusive(window.dateStart, window.dateEnd);
  if (days > MAX_METRICS_REFRESH_WINDOW_DAYS) {
    return { ok: false, message: `Refresh windows cannot exceed ${MAX_METRICS_REFRESH_WINDOW_DAYS} days.` };
  }
  return { ok: true, days };
}
function assertMetricsRefreshWindow(window) {
  const validation = validateMetricsRefreshWindow(window);
  if (!validation.ok) throw new Error(validation.message);
  return window;
}

// packages/shared/src/lib/provider-tokens.ts
import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import { and, eq } from "drizzle-orm";
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
  return createHash("sha256").update(raw).digest();
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
  const { db: db2 } = await import("./db-VBV7VJDO.js");
  const googleAccount = await db2.query.account.findFirst({
    where: (table, { and: and3, eq: eq3 }) => and3(eq3(table.userId, userId), eq3(table.providerId, "google"))
  });
  if (!googleAccount) return null;
  return decryptGoogleAccountTokens(googleAccount);
}

// packages/shared/src/lib/metrics-cache.ts
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
function rangeDaysInclusive(start, end) {
  return metricsWindowDaysInclusive(start, end);
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
    queryPagePairsPayload: metrics.queryPagePairs,
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
      queryPagePairsPayload: metrics.queryPagePairs,
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
async function upsertGa4ReportArtifact(params) {
  const now = /* @__PURE__ */ new Date();
  await db.insert(ga4ReportArtifacts).values({
    id: `ga4a_${nanoid(12)}`,
    teamId: params.teamId,
    gscPropertyId: params.gscPropertyId,
    ga4PropertyId: params.ga4PropertyId,
    dateStart: params.dateStart,
    dateEnd: params.dateEnd,
    reportPayload: params.reportPayload,
    fetchedAt: now,
    syncJobId: params.syncJobId ?? null
  }).onConflictDoUpdate({
    target: [ga4ReportArtifacts.ga4PropertyId, ga4ReportArtifacts.dateStart, ga4ReportArtifacts.dateEnd],
    set: {
      gscPropertyId: params.gscPropertyId,
      reportPayload: params.reportPayload,
      fetchedAt: now,
      syncJobId: params.syncJobId ?? null
    }
  });
}
async function createMetricsBackfillJob(input) {
  assertMetricsRefreshWindow({ dateStart: input.dateStart, dateEnd: input.dateEnd });
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
    triggerSource: input.triggerSource ?? "manual",
    status: "queued"
  }).returning();
  return job;
}
function normalizeClaimedMetricsBackfillJobRow(row) {
  if (!row) return null;
  const readDate = (value) => {
    if (!value) return null;
    if (value instanceof Date) return value;
    const parsed = new Date(String(value));
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  };
  return {
    id: String(row.id ?? ""),
    teamId: String(row.team_id ?? row.teamId ?? ""),
    triggeredByUserId: String(row.triggered_by_user_id ?? row.triggeredByUserId ?? ""),
    targetPropertyId: typeof (row.target_property_id ?? row.targetPropertyId) === "string" ? String(row.target_property_id ?? row.targetPropertyId) : null,
    targetUserId: typeof (row.target_user_id ?? row.targetUserId) === "string" ? String(row.target_user_id ?? row.targetUserId) : null,
    includeGsc: Boolean(row.include_gsc ?? row.includeGsc),
    includeGa4: Boolean(row.include_ga4 ?? row.includeGa4),
    timeframeMode: String(row.timeframe_mode ?? row.timeframeMode ?? "custom"),
    dateStart: String(row.date_start ?? row.dateStart ?? ""),
    dateEnd: String(row.date_end ?? row.dateEnd ?? ""),
    refreshRecentDays: Number(row.refresh_recent_days ?? row.refreshRecentDays ?? 7),
    reason: String(row.reason ?? ""),
    status: String(row.status ?? ""),
    triggerSource: String(row.trigger_source ?? row.triggerSource ?? "manual"),
    totals: row.totals ?? null,
    error: typeof row.error === "string" ? row.error : null,
    availableAt: readDate(row.available_at ?? row.availableAt) ?? /* @__PURE__ */ new Date(),
    attempts: Number(row.attempts ?? 0),
    maxAttempts: Number(row.max_attempts ?? row.maxAttempts ?? 2),
    claimedBy: typeof (row.claimed_by ?? row.claimedBy) === "string" ? String(row.claimed_by ?? row.claimedBy) : null,
    claimedAt: readDate(row.claimed_at ?? row.claimedAt),
    claimExpiresAt: readDate(row.claim_expires_at ?? row.claimExpiresAt),
    heartbeatAt: readDate(row.heartbeat_at ?? row.heartbeatAt),
    createdAt: readDate(row.created_at ?? row.createdAt) ?? /* @__PURE__ */ new Date(),
    startedAt: readDate(row.started_at ?? row.startedAt),
    finishedAt: readDate(row.finished_at ?? row.finishedAt)
  };
}
async function claimNextMetricsBackfillJob(workerId) {
  const leaseSeconds = parseInt(process.env.METRICS_BACKFILL_WORKER_LEASE_SECONDS ?? "90", 10);
  const rows = await db.execute(sql`
    with candidate as (
      select j.id
      from metrics_backfill_jobs j
      where (
          (j.status = 'queued' and j.available_at <= now())
          or (j.status = 'processing' and j.claim_expires_at < now() and j.attempts < j.max_attempts)
        )
      order by case when j.trigger_source = 'automation' then 1 else 0 end asc, j.created_at asc
      for update skip locked
      limit 1
    )
    update metrics_backfill_jobs j
    set
      status = 'processing',
      claimed_by = ${workerId},
      claimed_at = now(),
      heartbeat_at = now(),
      claim_expires_at = now() + (${leaseSeconds} || ' seconds')::interval,
      started_at = coalesce(j.started_at, now()),
      attempts = j.attempts + 1
    from candidate
    where j.id = candidate.id
    returning j.*
  `);
  const claimedRows = rows;
  return normalizeClaimedMetricsBackfillJobRow(claimedRows[0]);
}
async function heartbeatMetricsBackfillJob(jobId, workerId) {
  const leaseSeconds = parseInt(process.env.METRICS_BACKFILL_WORKER_LEASE_SECONDS ?? "90", 10);
  const [job] = await db.update(metricsBackfillJobs).set({
    heartbeatAt: /* @__PURE__ */ new Date(),
    claimExpiresAt: sql`now() + (${leaseSeconds} || ' seconds')::interval`
  }).where(
    and2(
      eq2(metricsBackfillJobs.id, jobId),
      eq2(metricsBackfillJobs.status, "processing"),
      eq2(metricsBackfillJobs.claimedBy, workerId)
    )
  ).returning();
  return job ?? null;
}
async function getGscPropertiesForJob(job) {
  if (job.targetPropertyId) {
    return db.query.properties.findMany({
      where: (p, { and: and3, eq: eq3 }) => and3(eq3(p.teamId, job.teamId), eq3(p.id, job.targetPropertyId), eq3(p.type, "gsc"), eq3(p.active, true))
    });
  }
  return db.query.properties.findMany({
    where: (p, { and: and3, eq: eq3 }) => and3(eq3(p.teamId, job.teamId), eq3(p.type, "gsc"), eq3(p.active, true))
  });
}
async function existingGscDateSet(propertyId, start, end) {
  const rows = await db.query.gscDailyFacts.findMany({
    where: (t, { and: and3, eq: eq3, gte, lte }) => and3(eq3(t.propertyId, propertyId), gte(t.sourceDate, start), lte(t.sourceDate, end)),
    columns: { sourceDate: true }
  });
  return new Set(rows.map((r) => normalizeDateStr(r.sourceDate)));
}
async function existingGa4DateSet(ga4PropertyId, start, end) {
  const rows = await db.query.ga4DailyFacts.findMany({
    where: (t, { and: and3, eq: eq3, gte, lte }) => and3(eq3(t.ga4PropertyId, ga4PropertyId), gte(t.sourceDate, start), lte(t.sourceDate, end)),
    columns: { sourceDate: true }
  });
  return new Set(rows.map((r) => normalizeDateStr(r.sourceDate)));
}
async function processMetricsBackfillJob(args) {
  const existingJob = await db.query.metricsBackfillJobs.findFirst({
    where: (j, { eq: eq3 }) => eq3(j.id, args.jobId)
  });
  if (!existingJob) throw new Error("Metrics backfill job not found");
  const ownerId = args.workerId ?? `mbi_${nanoid(8)}`;
  const [job] = await db.update(metricsBackfillJobs).set({
    status: "processing",
    claimedBy: ownerId,
    claimedAt: existingJob.claimedAt ?? /* @__PURE__ */ new Date(),
    heartbeatAt: /* @__PURE__ */ new Date(),
    claimExpiresAt: sql`now() + (${parseInt(process.env.METRICS_BACKFILL_WORKER_LEASE_SECONDS ?? "90", 10)} || ' seconds')::interval`,
    startedAt: existingJob.startedAt ?? /* @__PURE__ */ new Date(),
    error: null
  }).where(
    args.workerId ? and2(
      eq2(metricsBackfillJobs.id, existingJob.id),
      eq2(metricsBackfillJobs.status, "processing"),
      eq2(metricsBackfillJobs.claimedBy, ownerId)
    ) : and2(eq2(metricsBackfillJobs.id, existingJob.id), eq2(metricsBackfillJobs.status, "queued"))
  ).returning();
  if (!job) throw new Error("Metrics backfill job lease was lost");
  const totals = ZERO_TOTALS();
  const gscValidatedProps = /* @__PURE__ */ new Set();
  const gscValidationFailedProps = /* @__PURE__ */ new Set();
  const ga4ValidatedProps = /* @__PURE__ */ new Set();
  const ga4ValidationFailedProps = /* @__PURE__ */ new Set();
  const dateStart = String(job.dateStart);
  const dateEnd = String(job.dateEnd);
  assertMetricsRefreshWindow({ dateStart, dateEnd });
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
                  queryPagePairs: [],
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
          const [dayMap, profile] = await Promise.all([
            fetchGa4DailySummary(args.authClient, ga4Id, fetchStart, fetchEnd),
            fetchGa4ReportProfileForRange(args.authClient, ga4Id, fetchStart, fetchEnd)
          ]);
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
          await upsertGa4ReportArtifact({
            teamId: job.teamId,
            gscPropertyId: prop.id,
            ga4PropertyId: ga4Id,
            dateStart: fetchStart,
            dateEnd: fetchEnd,
            reportPayload: profile,
            syncJobId: job.id
          });
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
    const [finalJob] = await db.update(metricsBackfillJobs).set({
      status: finalStatus,
      totals,
      finishedAt: /* @__PURE__ */ new Date(),
      claimExpiresAt: null
    }).where(
      and2(
        eq2(metricsBackfillJobs.id, job.id),
        eq2(metricsBackfillJobs.status, "processing"),
        eq2(metricsBackfillJobs.claimedBy, ownerId)
      )
    ).returning();
    if (!finalJob) throw new Error("Metrics backfill job lease was lost");
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
      finishedAt: /* @__PURE__ */ new Date(),
      claimExpiresAt: null
    }).where(
      and2(
        eq2(metricsBackfillJobs.id, job.id),
        eq2(metricsBackfillJobs.status, "processing"),
        eq2(metricsBackfillJobs.claimedBy, ownerId)
      )
    );
    throw error;
  }
}
async function getMetricsBackfillAuthClient(job) {
  const userId = job.targetUserId ?? job.triggeredByUserId;
  const googleAccount = await getGoogleAccountTokensForUser(userId);
  if (googleAccount?.accessToken) {
    return getGoogleAuthClient(
      googleAccount.accessToken,
      googleAccount.refreshToken ?? void 0,
      googleAccount.accessTokenExpiresAt ?? null
    );
  }
  const owner = await db.query.teamMembers.findFirst({
    where: and2(eq2(teamMembers.teamId, job.teamId), eq2(teamMembers.role, "owner"))
  });
  if (!owner) throw new Error("No team owner found for metrics backfill");
  const ownerAccount = await db.query.account.findFirst({
    where: and2(eq2(account.userId, owner.userId), eq2(account.providerId, "google")),
    columns: { id: true }
  });
  if (!ownerAccount) throw new Error("Google account not linked");
  const ownerTokens = await getGoogleAccountTokensForUser(owner.userId);
  if (!ownerTokens?.accessToken) throw new Error("Google account not linked");
  return getGoogleAuthClient(
    ownerTokens.accessToken,
    ownerTokens.refreshToken ?? void 0,
    ownerTokens.accessTokenExpiresAt ?? null
  );
}
async function runSingleMetricsBackfillWorkerTick(workerId = `mbw_${nanoid(8)}`) {
  const job = await claimNextMetricsBackfillJob(workerId);
  if (!job) return { processed: false };
  let heartbeatTimer = null;
  try {
    heartbeatTimer = setInterval(() => {
      void heartbeatMetricsBackfillJob(job.id, workerId);
    }, 1e4);
    const authClient = await getMetricsBackfillAuthClient(job);
    await processMetricsBackfillJob({ jobId: job.id, authClient, workerId });
    return { processed: true, jobId: job.id };
  } finally {
    if (heartbeatTimer) clearInterval(heartbeatTimer);
  }
}
function startMetricsBackfillWorkerLoop(input = {}) {
  let stopped = false;
  let isRunning = false;
  let pendingTimeout = null;
  const workerId = `mbw_${nanoid(8)}`;
  const intervalMs = input.intervalMs ?? parseInt(process.env.METRICS_BACKFILL_WORKER_POLL_MS ?? "4000", 10);
  const maxPollMs = input.maxPollMs ?? parseInt(process.env.METRICS_BACKFILL_WORKER_MAX_POLL_MS ?? "30000", 10);
  let idleCount = 0;
  const loop = async () => {
    if (stopped || isRunning) return;
    isRunning = true;
    let processed = false;
    try {
      const result = await runSingleMetricsBackfillWorkerTick(workerId);
      processed = result.processed;
      if (processed) {
        console.log(`[metrics-backfill][INFO] processed job worker=${workerId} job=${result.jobId}`);
      }
    } catch (error) {
      console.error("[metrics-backfill][ERROR] worker loop error", error);
    } finally {
      isRunning = false;
      if (!stopped) {
        const delay = Math.min(intervalMs * Math.pow(2, idleCount), maxPollMs);
        idleCount = processed ? 0 : idleCount + 1;
        pendingTimeout = setTimeout(loop, delay);
      }
    }
  };
  console.log(`[metrics-backfill][INFO] loop started worker=${workerId} pollMs=${intervalMs} maxPollMs=${maxPollMs}`);
  void loop();
  return {
    stop() {
      stopped = true;
      if (pendingTimeout) clearTimeout(pendingTimeout);
    }
  };
}
async function getLatestMetricsBackfillState(params) {
  const row = await db.query.metricsBackfillJobs.findFirst({
    where: and2(
      eq2(metricsBackfillJobs.teamId, params.teamId),
      eq2(metricsBackfillJobs.targetPropertyId, params.propertyId)
    ),
    orderBy: (table, { desc: descOrder, sql: sqlOrder }) => [
      sqlOrder`case when ${table.status} in ('queued', 'processing') then 0 else 1 end`,
      descOrder(table.createdAt)
    ]
  });
  if (!row) return null;
  return {
    id: row.id,
    jobType: "metrics_refresh",
    status: row.status,
    phase: row.status === "queued" ? "source_data_queued" : row.status === "processing" ? "source_data" : "done",
    message: row.status === "queued" ? "Source data refresh queued" : row.status === "processing" ? "Refreshing GA4 and Search Console data..." : row.status === "partial" ? "Source data refresh partially complete" : row.status === "failed" ? "Source data refresh failed" : "Source data refresh complete",
    progressMeta: row.totals,
    startedAt: row.startedAt?.toISOString() ?? null,
    finishedAt: row.finishedAt?.toISOString() ?? null,
    updatedAt: (row.finishedAt ?? row.startedAt ?? row.createdAt).toISOString()
  };
}
function collectDateSet(rows) {
  return new Set(rows.map((r) => normalizeDateStr(r.sourceDate)));
}
function uniqueDateStrings(values) {
  return [...new Set(values)].sort();
}
async function getPropertyMetricsCoverage(params) {
  assertMetricsRefreshWindow({ dateStart: params.dateStart, dateEnd: params.dateEnd });
  const refreshRecentDays = params.refreshRecentDays ?? 7;
  const requiredDates = eachDateInRange(params.dateStart, params.dateEnd);
  const [gscFactRows, gscRawRows] = await Promise.all([
    db.query.gscDailyFacts.findMany({
      where: (t, { and: and3, eq: eq3, gte, lte }) => and3(eq3(t.propertyId, params.property.id), gte(t.sourceDate, params.dateStart), lte(t.sourceDate, params.dateEnd)),
      columns: { sourceDate: true }
    }),
    db.query.gscDailyRaw.findMany({
      where: (t, { and: and3, eq: eq3, gte, lte }) => and3(eq3(t.propertyId, params.property.id), gte(t.sourceDate, params.dateStart), lte(t.sourceDate, params.dateEnd)),
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
        where: (t, { and: and3, eq: eq3, gte, lte }) => and3(eq3(t.ga4PropertyId, params.property.ga4PropertyId), gte(t.sourceDate, params.dateStart), lte(t.sourceDate, params.dateEnd)),
        columns: { sourceDate: true }
      }),
      db.query.ga4DailyRaw.findMany({
        where: (t, { and: and3, eq: eq3, gte, lte }) => and3(eq3(t.ga4PropertyId, params.property.ga4PropertyId), gte(t.sourceDate, params.dateStart), lte(t.sourceDate, params.dateEnd)),
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
function aggregateGscQueryPagePairs(rawRows) {
  const map = /* @__PURE__ */ new Map();
  for (const row of rawRows) {
    const items = Array.isArray(row.queryPagePairsPayload) ? row.queryPagePairsPayload : [];
    for (const item of items) {
      if (!item || typeof item !== "object") continue;
      const record = item;
      const query = String(record.query ?? "");
      const page = String(record.page ?? "");
      if (!query || !page) continue;
      const key = `${query}\0${page}`;
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
  return [...map.entries()].map(([key, v]) => {
    const [query = "", page = ""] = key.split("\0");
    return {
      query,
      page,
      clicks: v.clicks,
      impressions: v.impressions,
      ctr: v.impressions > 0 ? v.clicks / v.impressions : 0,
      position: v.impressions > 0 ? v.positionImpr / v.impressions : 0
    };
  }).sort((a, b) => b.clicks - a.clicks).slice(0, 25);
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
      where: (t, { and: and3, eq: eq3, gte, lte }) => and3(eq3(t.propertyId, propertyId), gte(t.sourceDate, start), lte(t.sourceDate, end)),
      orderBy: (t, { asc }) => [asc(t.sourceDate)]
    }),
    db.query.gscDailyRaw.findMany({
      where: (t, { and: and3, eq: eq3, gte, lte }) => and3(eq3(t.propertyId, propertyId), gte(t.sourceDate, start), lte(t.sourceDate, end)),
      orderBy: (t, { asc }) => [asc(t.sourceDate)]
    })
  ]);
  return { factRows, rawRows };
}
async function loadGa4Range(ga4PropertyId, start, end) {
  const factRows = await db.query.ga4DailyFacts.findMany({
    where: (t, { and: and3, eq: eq3, gte, lte }) => and3(eq3(t.ga4PropertyId, ga4PropertyId), gte(t.sourceDate, start), lte(t.sourceDate, end)),
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
        queryPagePairs: aggregateGscQueryPagePairs(gscCurrent.rawRows),
        topCountries: aggregateGscTopCountries(gscCurrent.rawRows),
        topDevices: aggregateGscTopDevices(gscCurrent.rawRows)
      },
      compare: {
        ...gscCompareSummary,
        topQueries: aggregateGscTopQueries(gscCompare.rawRows),
        topPages: aggregateGscTopPages(gscCompare.rawRows),
        queryPagePairs: aggregateGscQueryPagePairs(gscCompare.rawRows),
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
  const currentWindow = assertMetricsRefreshWindow({
    dateStart: params.dateRangeStart,
    dateEnd: params.dateRangeEnd
  });
  const compareWindow = assertMetricsRefreshWindow({
    dateStart: params.compareRangeStart,
    dateEnd: params.compareRangeEnd
  });
  const [currentCoverage, compareCoverage] = await Promise.all([
    getPropertyMetricsCoverage({
      property: params.property,
      dateStart: currentWindow.dateStart,
      dateEnd: currentWindow.dateEnd,
      refreshRecentDays
    }),
    getPropertyMetricsCoverage({
      property: params.property,
      dateStart: compareWindow.dateStart,
      dateEnd: compareWindow.dateEnd,
      refreshRecentDays
    })
  ]);
  if (currentCoverage.complete && compareCoverage.complete) {
    return { needed: false, jobId: null, result: null };
  }
  const windowsToRefresh = [
    currentCoverage.complete ? null : currentWindow,
    compareCoverage.complete ? null : compareWindow
  ].filter((window) => Boolean(window));
  const jobs = [];
  const results = [];
  for (const window of windowsToRefresh) {
    const job = await createMetricsBackfillJob({
      teamId: params.teamId,
      triggeredByUserId: params.triggeredByUserId,
      targetPropertyId: params.property.id,
      includeGsc: true,
      includeGa4: !!params.property.ga4PropertyId,
      dateStart: window.dateStart,
      dateEnd: window.dateEnd,
      reason: "report_preflight",
      timeframeMode: "custom",
      refreshRecentDays
    });
    jobs.push(job);
    results.push(await processMetricsBackfillJob({ jobId: job.id, authClient: params.authClient }));
  }
  return { needed: true, jobId: jobs[0]?.id ?? null, result: results[0] ?? null, jobIds: jobs.map((job) => job.id), results };
}

export {
  eachDateInRange,
  rangeDaysInclusive,
  createMetricsBackfillJob,
  claimNextMetricsBackfillJob,
  heartbeatMetricsBackfillJob,
  processMetricsBackfillJob,
  runSingleMetricsBackfillWorkerTick,
  startMetricsBackfillWorkerLoop,
  getLatestMetricsBackfillState,
  getPropertyMetricsCoverage,
  composeReportMetricsFromCache,
  ensureMetricsCoverageForReport
};
