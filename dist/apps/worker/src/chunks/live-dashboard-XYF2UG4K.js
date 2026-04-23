import {
  buildDeterministicInsights
} from "./chunk-IHU6YNCZ.js";
import {
  getLatestPropertyCrawl,
  getLatestPropertyRefreshState
} from "./chunk-KRCQEA7B.js";
import {
  resolveTeamReportSources
} from "./chunk-AJWHQMOS.js";
import {
  db
} from "./chunk-JRPUP4TA.js";
import {
  actionItems,
  analysisWindowCache,
  snapshotExports
} from "./chunk-3VHV6IUD.js";
import "./chunk-AHMZJEDT.js";
import "./chunk-3LHI6BO3.js";

// packages/shared/src/lib/live-dashboard.ts
import { createHash } from "node:crypto";
import { and, eq, isNull } from "drizzle-orm";
import { nanoid as nanoid2 } from "nanoid";

// packages/shared/src/lib/team-branding.ts
import { nanoid } from "nanoid";
var EMPTY_TEAM_BRANDING_PROFILE = {
  agencyName: "",
  contactName: "",
  contactEmail: "",
  contactPhone: "",
  websiteUrl: "",
  logoUrl: "",
  iconUrl: "",
  primaryColor: "#6366f1",
  accentColor: "#0ea5e9",
  footerNote: ""
};
function normalizeOptionalString(value) {
  return value?.trim() ?? "";
}
function normalizeColor(value, fallback) {
  const trimmed = value?.trim() ?? "";
  return /^#[0-9a-fA-F]{6}$/.test(trimmed) ? trimmed : fallback;
}
function normalizeTeamBrandingProfile(value) {
  return {
    agencyName: normalizeOptionalString(value?.agencyName),
    contactName: normalizeOptionalString(value?.contactName),
    contactEmail: normalizeOptionalString(value?.contactEmail),
    contactPhone: normalizeOptionalString(value?.contactPhone),
    websiteUrl: normalizeOptionalString(value?.websiteUrl),
    logoUrl: normalizeOptionalString(value?.logoUrl),
    iconUrl: normalizeOptionalString(value?.iconUrl),
    primaryColor: normalizeColor(value?.primaryColor, EMPTY_TEAM_BRANDING_PROFILE.primaryColor),
    accentColor: normalizeColor(value?.accentColor, EMPTY_TEAM_BRANDING_PROFILE.accentColor),
    footerNote: normalizeOptionalString(value?.footerNote)
  };
}
function toPartialBrandingProfile(value) {
  if (!value) return value;
  return {
    agencyName: value.agencyName ?? void 0,
    contactName: value.contactName ?? void 0,
    contactEmail: value.contactEmail ?? void 0,
    contactPhone: value.contactPhone ?? void 0,
    websiteUrl: value.websiteUrl ?? void 0,
    logoUrl: value.logoUrl ?? void 0,
    iconUrl: value.iconUrl ?? void 0,
    primaryColor: value.primaryColor ?? void 0,
    accentColor: value.accentColor ?? void 0,
    footerNote: value.footerNote ?? void 0
  };
}
async function getTeamBrandingProfile(teamId) {
  const row = await db.query.teamBrandingProfiles.findFirst({
    where: (table, { eq: eq2 }) => eq2(table.teamId, teamId)
  });
  return normalizeTeamBrandingProfile(toPartialBrandingProfile(row));
}

// packages/shared/src/lib/live-dashboard.ts
function normalizeDateString(value) {
  if (!value) return null;
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  const raw = String(value).slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(raw) ? raw : null;
}
function parseDate(value) {
  return /* @__PURE__ */ new Date(`${value}T00:00:00.000Z`);
}
function formatDate(value) {
  return value.toISOString().slice(0, 10);
}
function addDays(value, days) {
  const date = parseDate(value);
  date.setUTCDate(date.getUTCDate() + days);
  return formatDate(date);
}
function daysInclusive(startDate, endDate) {
  const start = parseDate(startDate).getTime();
  const end = parseDate(endDate).getTime();
  return Math.floor((end - start) / 864e5) + 1;
}
function toPercent(value) {
  return Number.isFinite(value) ? value : 0;
}
function parseNumericFact(value) {
  if (!value) return 0;
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
}
function aggregateGscSummary(rows) {
  const clicks = rows.reduce((sum, row) => sum + row.clicks, 0);
  const impressions = rows.reduce((sum, row) => sum + row.impressions, 0);
  const weightedPosition = rows.reduce(
    (sum, row) => sum + parseNumericFact(row.position) * Math.max(row.impressions, 1),
    0
  );
  return {
    clicks,
    impressions,
    ctr: impressions > 0 ? clicks / impressions : 0,
    position: impressions > 0 ? weightedPosition / impressions : 0
  };
}
function aggregateGa4Summary(rows) {
  return {
    sessions: rows.reduce((sum, row) => sum + row.sessions, 0),
    users: rows.reduce((sum, row) => sum + row.users, 0)
  };
}
function aggregateQueryPayloads(rawRows) {
  const map = /* @__PURE__ */ new Map();
  for (const row of rawRows) {
    const payload = Array.isArray(row.queriesPayload) ? row.queriesPayload : [];
    for (const item of payload) {
      if (!item || typeof item !== "object") continue;
      const record = item;
      const query = String(record.query ?? "");
      if (!query) continue;
      const clicks = Number(record.clicks ?? 0);
      const impressions = Number(record.impressions ?? 0);
      const position = Number(record.position ?? 0);
      const current = map.get(query) ?? { clicks: 0, impressions: 0, weightedPosition: 0 };
      current.clicks += clicks;
      current.impressions += impressions;
      current.weightedPosition += position * Math.max(impressions, 1);
      map.set(query, current);
    }
  }
  return [...map.entries()].map(([query, value]) => ({
    query,
    clicks: value.clicks,
    impressions: value.impressions,
    ctr: value.impressions > 0 ? value.clicks / value.impressions : 0,
    position: value.impressions > 0 ? value.weightedPosition / value.impressions : 0
  })).sort((left, right) => right.clicks - left.clicks).slice(0, 25);
}
function aggregatePagePayloads(rawRows) {
  const map = /* @__PURE__ */ new Map();
  for (const row of rawRows) {
    const payload = Array.isArray(row.pagesPayload) ? row.pagesPayload : [];
    for (const item of payload) {
      if (!item || typeof item !== "object") continue;
      const record = item;
      const page = String(record.page ?? "");
      if (!page) continue;
      const clicks = Number(record.clicks ?? 0);
      const impressions = Number(record.impressions ?? 0);
      const current = map.get(page) ?? { clicks: 0, impressions: 0 };
      current.clicks += clicks;
      current.impressions += impressions;
      map.set(page, current);
    }
  }
  return [...map.entries()].map(([page, value]) => ({
    page,
    clicks: value.clicks,
    impressions: value.impressions
  })).sort((left, right) => right.clicks - left.clicks).slice(0, 25);
}
function buildTrendSeries(params) {
  const currentByDate = new Map(params.facts.map((row) => [normalizeDateString(row.sourceDate), row]));
  const currentGa4ByDate = new Map(params.ga4Facts.map((row) => [normalizeDateString(row.sourceDate), row]));
  const labelStartDate = params.labelStartDate ?? params.startDate;
  const points = [];
  const totalDays = daysInclusive(params.startDate, params.endDate);
  for (let index = 0; index < totalDays; index += 1) {
    const sourceDate = addDays(params.startDate, index);
    const labelDate = addDays(labelStartDate, index);
    const current = currentByDate.get(sourceDate);
    const ga4Current = currentGa4ByDate.get(sourceDate);
    points.push({
      date: labelDate,
      clicks: current?.clicks ?? 0,
      impressions: current?.impressions ?? 0,
      ctr: current ? toPercent(current.clicks / Math.max(current.impressions, 1)) : 0,
      position: current ? parseNumericFact(current.position) : 0,
      sessions: ga4Current?.sessions ?? 0,
      users: ga4Current?.users ?? 0
    });
  }
  return points;
}
function buildSafeLatestDate(today) {
  return addDays(today, -2);
}
function resolvePreset(value) {
  if (value === "last_7d" || value === "last_28d" || value === "last_90d" || value === "custom") {
    return value;
  }
  return "last_28d";
}
function resolveCompareMode(value) {
  if (value === "previous_period" || value === "same_period_last_year" || value === "none") {
    return value;
  }
  return "previous_period";
}
function resolveAnalysisWindow(input) {
  const preset = resolvePreset(input.preset);
  const compareMode = resolveCompareMode(input.compareMode);
  const requestedEndDate = normalizeDateString(input.endDate) ?? input.safeLatestDate;
  let startDate = normalizeDateString(input.startDate);
  let endDate = requestedEndDate;
  if (preset === "last_7d") {
    startDate = addDays(endDate, -6);
  } else if (preset === "last_28d") {
    startDate = addDays(endDate, -27);
  } else if (preset === "last_90d") {
    startDate = addDays(endDate, -89);
  } else {
    const resolvedStart = normalizeDateString(input.startDate);
    startDate = resolvedStart ?? addDays(endDate, -27);
  }
  if (!startDate) {
    startDate = addDays(endDate, -27);
  }
  let compareStartDate = null;
  let compareEndDate = null;
  if (compareMode === "previous_period") {
    const length = daysInclusive(startDate, endDate);
    compareEndDate = addDays(startDate, -1);
    compareStartDate = addDays(compareEndDate, -(length - 1));
  } else if (compareMode === "same_period_last_year") {
    compareStartDate = formatDate(new Date(Date.UTC(parseInt(startDate.slice(0, 4), 10) - 1, parseInt(startDate.slice(5, 7), 10) - 1, parseInt(startDate.slice(8, 10), 10))));
    compareEndDate = formatDate(new Date(Date.UTC(parseInt(endDate.slice(0, 4), 10) - 1, parseInt(endDate.slice(5, 7), 10) - 1, parseInt(endDate.slice(8, 10), 10))));
  }
  return {
    preset,
    compareMode,
    startDate,
    endDate,
    requestedEndDate,
    compareStartDate,
    compareEndDate
  };
}
function summarizeSourceFreshness(params) {
  if (!params.lastAvailableDate) {
    return {
      source: params.source,
      state: "unavailable",
      safeLatestDate: null,
      lastAvailableDate: null,
      note: params.source === "ga4" ? "Analytics data has not been cached yet." : "Search Console data has not been cached yet."
    };
  }
  const safeLatest = params.lastAvailableDate < params.safeLatestDate ? params.lastAvailableDate : params.safeLatestDate;
  if (params.requestedEndDate > safeLatest) {
    return {
      source: params.source,
      state: "partial",
      safeLatestDate: safeLatest,
      lastAvailableDate: params.lastAvailableDate,
      note: `${params.source === "ga4" ? "GA4" : "Search Console"} is complete through ${safeLatest}.`
    };
  }
  return {
    source: params.source,
    state: "complete",
    safeLatestDate: safeLatest,
    lastAvailableDate: params.lastAvailableDate,
    note: `${params.source === "ga4" ? "GA4" : "Search Console"} is complete through ${safeLatest}.`
  };
}
function summarizeCrawlFreshness(input) {
  if (!input.crawl || !input.crawlCapturedAt) {
    return {
      source: "crawl",
      state: "unavailable",
      safeLatestDate: null,
      lastAvailableDate: null,
      capturedAt: null,
      ageInDays: null,
      note: "Technical scan has not been captured yet."
    };
  }
  const capturedAtDate = new Date(input.crawlCapturedAt);
  const ageInDays = Math.max(
    0,
    Math.floor((Date.now() - capturedAtDate.getTime()) / 864e5)
  );
  if (ageInDays >= 10) {
    return {
      source: "crawl",
      state: "stale",
      safeLatestDate: null,
      lastAvailableDate: null,
      capturedAt: input.crawlCapturedAt,
      ageInDays,
      note: `Technical scan is ${ageInDays} days old.`
    };
  }
  return {
    source: "crawl",
    state: "complete",
    safeLatestDate: null,
    lastAvailableDate: null,
    capturedAt: input.crawlCapturedAt,
    ageInDays,
    note: ageInDays === 0 ? "Technical scan was refreshed today." : `Technical scan is ${ageInDays} day${ageInDays === 1 ? "" : "s"} old.`
  };
}
function buildActionIdentity(row) {
  if (row.id.startsWith("weekly_decay_")) {
    const targetKey = row.targetPage ?? row.title;
    return {
      fingerprint: `content_refresh|page|${targetKey}|refresh_core_content|content_decay`,
      actionFamily: "content_refresh",
      causeFamily: "content_decay",
      remedyKey: "refresh_core_content",
      targetType: "page",
      targetKey
    };
  }
  if (row.id.startsWith("weekly_ctr_")) {
    const targetKey = row.supportingQueries?.[0] ?? row.title;
    return {
      fingerprint: `ctr_snippet_fix|query|${targetKey}|rewrite_title_meta|ctr_gap`,
      actionFamily: "ctr_snippet_fix",
      causeFamily: "ctr_gap",
      remedyKey: "rewrite_title_meta",
      targetType: "query",
      targetKey
    };
  }
  if (row.id.startsWith("weekly_near_")) {
    const targetKey = row.supportingQueries?.[0] ?? row.title;
    return {
      fingerprint: `near_win_optimization|query|${targetKey}|optimize_target_page|near_win`,
      actionFamily: "near_win_optimization",
      causeFamily: "near_win",
      remedyKey: "optimize_target_page",
      targetType: "query",
      targetKey
    };
  }
  if (row.id.startsWith("weekly_tech_")) {
    const issueType = row.detail.evidence.deterministic.find((fact) => fact.label === "Issue type")?.value ?? row.title;
    return {
      fingerprint: `technical_issue_fix|issue_scope|${issueType}|fix_technical_issue|technical_blocker`,
      actionFamily: "technical_issue_fix",
      causeFamily: "technical_blocker",
      remedyKey: "fix_technical_issue",
      targetType: "issue_scope",
      targetKey: issueType
    };
  }
  if (row.id.startsWith("weekly_cannibal_")) {
    const targetKey = row.supportingQueries?.[0] ?? row.title;
    return {
      fingerprint: `cannibalization_resolution|query|${targetKey}|merge_competing_pages|cannibalization`,
      actionFamily: "cannibalization_resolution",
      causeFamily: "cannibalization",
      remedyKey: "merge_competing_pages",
      targetType: "query",
      targetKey
    };
  }
  return {
    fingerprint: `${row.recommendationClass}|site|${row.title}|review_action|generic_signal`,
    actionFamily: "review_action",
    causeFamily: "generic_signal",
    remedyKey: "review_action",
    targetType: "site",
    targetKey: row.title
  };
}
function buildSourceVersionHash(params) {
  const rawVersionKey = JSON.stringify({
    gscLastFactAt: params.gscLastFactAt ?? null,
    ga4LastFactAt: params.ga4LastFactAt ?? null,
    crawlCapturedAt: params.crawlCapturedAt ?? null,
    crawlFingerprintDigest: params.crawlFingerprint ? createHash("sha256").update(params.crawlFingerprint).digest("hex") : null,
    changeLastUpdatedAt: params.changeLastUpdatedAt ?? null
  });
  return `ldv1_${createHash("sha256").update(rawVersionKey).digest("hex")}`;
}
function summarizeOperatingContext(params) {
  const clicksDelta = params.clicksCurrent - params.clicksCompare;
  const topAction = params.actions[0] ?? null;
  const technicalTopAction = params.actions.find((row) => row.id.startsWith("weekly_tech_")) ?? null;
  const status = params.crawlFreshness.state === "unavailable" ? "mixed" : clicksDelta < 0 && technicalTopAction ? "blocked" : clicksDelta < 0 ? "slipping" : topAction ? "mixed" : "healthy";
  return {
    status,
    summary: status === "blocked" ? "Traffic is slipping and technical blockers are present." : status === "slipping" ? "This window is down versus the comparison range." : status === "mixed" ? "Some movement needs action, but the picture is not clean." : "No major blockers are leading this window.",
    topRisk: technicalTopAction?.title ?? (clicksDelta < 0 ? "Traffic is down versus the comparison window." : null),
    topOpportunity: topAction?.title ?? null
  };
}
function buildDegradedStates(params) {
  const rows = [];
  if (params.crawlFreshness.state === "unavailable") {
    rows.push({
      code: "technical_unavailable",
      title: "Technical scan unavailable",
      message: "Traffic signals are live, but technical actions cannot be ranked until a crawl exists.",
      ctaLabel: "Run crawl"
    });
  } else if (params.crawlFreshness.state === "stale") {
    rows.push({
      code: "technical_stale",
      title: "Technical scan is stale",
      message: params.crawlFreshness.note,
      ctaLabel: "Refresh technical scan"
    });
  }
  if (params.refreshState?.status === "queued" || params.refreshState?.status === "processing") {
    rows.push({
      code: "refresh_in_progress",
      title: "Update in progress",
      message: params.refreshState.message ?? "Recommendations may change when the refresh completes."
    });
  } else if (params.refreshState?.status === "failed") {
    rows.push({
      code: "refresh_failed",
      title: "Latest update failed",
      message: "Showing the last valid decision set.",
      ctaLabel: "Refresh technical scan"
    });
  }
  if (params.dashboardFreshnessState === "partial") {
    rows.push({
      code: "partial_traffic_data",
      title: "Traffic data is partial",
      message: "Some traffic recommendations are based on partial source coverage."
    });
  }
  if (!params.actions.length) {
    rows.push({
      code: "no_ranked_actions",
      title: "No ranked actions qualified",
      message: "The current window has supporting signals, but none met the ranking threshold for an action."
    });
  }
  return rows;
}
async function fetchAuthorizedProperty(teamId, propertyId) {
  const resolved = await resolveTeamReportSources(teamId, propertyId);
  return resolved.canonicalGscProperty;
}
async function fetchLatestSnapshots(teamId, propertyId) {
  const rows = await db.query.snapshotExports.findMany({
    where: (table, { and: and2, eq: eq2 }) => and2(eq2(table.teamId, teamId), eq2(table.propertyId, propertyId)),
    orderBy: (table, { desc: descOrder }) => [descOrder(table.createdAt)],
    limit: 5
  });
  return rows.map((row) => ({
    id: row.id,
    createdAt: row.createdAt.toISOString(),
    freshnessState: row.freshnessState,
    startDate: normalizeDateString(row.startDate) ?? "",
    endDate: normalizeDateString(row.endDate) ?? "",
    compareMode: row.compareMode
  }));
}
async function fetchLatestDateForSource(params) {
  const [gscLatestRow, ga4LatestRow] = await Promise.all([
    db.query.gscDailyFacts.findFirst({
      where: (table, { eq: eqFn }) => eqFn(table.propertyId, params.property.id),
      orderBy: (table, { desc: descOrder }) => [descOrder(table.sourceDate)]
    }),
    params.property.ga4PropertyId ? db.query.ga4DailyFacts.findFirst({
      where: (table, { eq: eqFn }) => eqFn(table.ga4PropertyId, params.property.ga4PropertyId),
      orderBy: (table, { desc: descOrder }) => [descOrder(table.sourceDate)]
    }) : Promise.resolve(null)
  ]);
  return {
    gscLatestDate: normalizeDateString(gscLatestRow?.sourceDate),
    ga4LatestDate: normalizeDateString(ga4LatestRow?.sourceDate),
    gscLastFactAt: gscLatestRow?.updatedAt?.toISOString?.() ?? null,
    ga4LastFactAt: ga4LatestRow?.updatedAt?.toISOString?.() ?? null
  };
}
async function fetchRecentChanges(propertyId, startDate, endDate) {
  const rows = await db.query.propertyPageRegistry.findMany({
    where: (table, { and: andFn, eq: eqFn, gte: gteFn, lte: lteFn }) => andFn(
      eqFn(table.propertyId, propertyId),
      gteFn(table.lastChangedAt, /* @__PURE__ */ new Date(`${startDate}T00:00:00.000Z`)),
      lteFn(table.lastChangedAt, /* @__PURE__ */ new Date(`${endDate}T23:59:59.999Z`))
    ),
    orderBy: (table, { desc: descOrder }) => [descOrder(table.lastChangedAt)],
    limit: 10
  });
  return rows.map((row) => ({
    url: row.canonicalUrl,
    lastChangedAt: row.lastChangedAt?.toISOString() ?? null
  }));
}
async function fetchWindowData(params) {
  const [
    currentFacts,
    currentRaw,
    compareFacts,
    compareRaw,
    currentGa4,
    compareGa4
  ] = await Promise.all([
    db.query.gscDailyFacts.findMany({
      where: (table, { and: andFn, eq: eqFn, gte: gteFn, lte: lteFn }) => andFn(eqFn(table.propertyId, params.property.id), gteFn(table.sourceDate, params.startDate), lteFn(table.sourceDate, params.endDate)),
      orderBy: (table, { asc }) => [asc(table.sourceDate)]
    }),
    db.query.gscDailyRaw.findMany({
      where: (table, { and: andFn, eq: eqFn, gte: gteFn, lte: lteFn }) => andFn(eqFn(table.propertyId, params.property.id), gteFn(table.sourceDate, params.startDate), lteFn(table.sourceDate, params.endDate)),
      orderBy: (table, { asc }) => [asc(table.sourceDate)]
    }),
    params.compareStartDate && params.compareEndDate ? db.query.gscDailyFacts.findMany({
      where: (table, { and: andFn, eq: eqFn, gte: gteFn, lte: lteFn }) => andFn(
        eqFn(table.propertyId, params.property.id),
        gteFn(table.sourceDate, params.compareStartDate),
        lteFn(table.sourceDate, params.compareEndDate)
      ),
      orderBy: (table, { asc }) => [asc(table.sourceDate)]
    }) : Promise.resolve([]),
    params.compareStartDate && params.compareEndDate ? db.query.gscDailyRaw.findMany({
      where: (table, { and: andFn, eq: eqFn, gte: gteFn, lte: lteFn }) => andFn(
        eqFn(table.propertyId, params.property.id),
        gteFn(table.sourceDate, params.compareStartDate),
        lteFn(table.sourceDate, params.compareEndDate)
      ),
      orderBy: (table, { asc }) => [asc(table.sourceDate)]
    }) : Promise.resolve([]),
    params.property.ga4PropertyId ? db.query.ga4DailyFacts.findMany({
      where: (table, { and: andFn, eq: eqFn, gte: gteFn, lte: lteFn }) => andFn(
        eqFn(table.ga4PropertyId, params.property.ga4PropertyId),
        gteFn(table.sourceDate, params.startDate),
        lteFn(table.sourceDate, params.endDate)
      ),
      orderBy: (table, { asc }) => [asc(table.sourceDate)]
    }) : Promise.resolve([]),
    params.property.ga4PropertyId && params.compareStartDate && params.compareEndDate ? db.query.ga4DailyFacts.findMany({
      where: (table, { and: andFn, eq: eqFn, gte: gteFn, lte: lteFn }) => andFn(
        eqFn(table.ga4PropertyId, params.property.ga4PropertyId),
        gteFn(table.sourceDate, params.compareStartDate),
        lteFn(table.sourceDate, params.compareEndDate)
      ),
      orderBy: (table, { asc }) => [asc(table.sourceDate)]
    }) : Promise.resolve([])
  ]);
  return {
    currentFacts,
    currentRaw,
    compareFacts,
    compareRaw,
    currentGa4,
    compareGa4
  };
}
async function readCache(params) {
  const row = await db.query.analysisWindowCache.findFirst({
    where: and(
      eq(analysisWindowCache.propertyId, params.property.id),
      eq(analysisWindowCache.startDate, params.window.startDate),
      eq(analysisWindowCache.endDate, params.window.endDate),
      eq(analysisWindowCache.compareMode, params.window.compareMode),
      params.window.compareStartDate ? eq(analysisWindowCache.compareStartDate, params.window.compareStartDate) : isNull(analysisWindowCache.compareStartDate),
      params.window.compareEndDate ? eq(analysisWindowCache.compareEndDate, params.window.compareEndDate) : isNull(analysisWindowCache.compareEndDate),
      eq(analysisWindowCache.sourceVersionHash, params.sourceVersionHash)
    ),
    orderBy: (table, { desc: descOrder }) => [descOrder(table.updatedAt)]
  });
  if (!row || row.expiresAt <= /* @__PURE__ */ new Date()) {
    return null;
  }
  return row.resolvedPayload;
}
async function writeCache(params) {
  await db.insert(analysisWindowCache).values({
    id: `awc_${nanoid2(12)}`,
    teamId: params.property.teamId,
    propertyId: params.property.id,
    preset: params.window.preset,
    startDate: params.window.startDate,
    endDate: params.window.endDate,
    compareMode: params.window.compareMode,
    compareStartDate: params.window.compareStartDate,
    compareEndDate: params.window.compareEndDate,
    requestedEndDate: params.window.requestedEndDate,
    sourceVersionHash: params.sourceVersionHash,
    freshnessState: params.freshnessState,
    freshnessSummary: params.freshnessSummary,
    resolvedPayload: params.payload,
    expiresAt: new Date(Date.now() + 15 * 60 * 1e3),
    updatedAt: /* @__PURE__ */ new Date()
  }).onConflictDoUpdate({
    target: [
      analysisWindowCache.propertyId,
      analysisWindowCache.startDate,
      analysisWindowCache.endDate,
      analysisWindowCache.compareMode,
      analysisWindowCache.compareStartDate,
      analysisWindowCache.compareEndDate,
      analysisWindowCache.sourceVersionHash
    ],
    set: {
      preset: params.window.preset,
      requestedEndDate: params.window.requestedEndDate,
      freshnessState: params.freshnessState,
      freshnessSummary: params.freshnessSummary,
      resolvedPayload: params.payload,
      expiresAt: new Date(Date.now() + 15 * 60 * 1e3),
      updatedAt: /* @__PURE__ */ new Date()
    }
  });
}
async function syncActionsToStore(params) {
  const now = /* @__PURE__ */ new Date();
  for (const action of params.actions) {
    const existing = await db.query.actionItems.findFirst({
      where: (table, { and: andFn, eq: eqFn }) => andFn(eqFn(table.propertyId, params.propertyId), eqFn(table.fingerprint, action.fingerprint))
    });
    await db.insert(actionItems).values({
      id: existing?.id ?? `ai_${nanoid2(12)}`,
      teamId: params.teamId,
      propertyId: params.propertyId,
      fingerprint: action.fingerprint,
      actionFamily: action.actionFamily,
      causeFamily: action.causeFamily,
      remedyKey: action.remedyKey,
      targetType: action.targetType,
      targetKey: action.targetKey,
      title: action.title,
      owner: action.owner ?? null,
      state: existing?.state ?? "open",
      systemRank: action.rank,
      systemScore: Math.max(1, 100 - action.rank * 10),
      priorityOverride: existing?.priorityOverride ?? "none",
      overrideReason: existing?.overrideReason ?? null,
      overrideUpdatedByUserId: existing?.overrideUpdatedByUserId ?? null,
      overrideUpdatedAt: existing?.overrideUpdatedAt ?? null,
      lastEvaluatedAt: now,
      updatedAt: now
    }).onConflictDoUpdate({
      target: [actionItems.propertyId, actionItems.fingerprint],
      set: {
        actionFamily: action.actionFamily,
        causeFamily: action.causeFamily,
        remedyKey: action.remedyKey,
        targetType: action.targetType,
        targetKey: action.targetKey,
        title: action.title,
        owner: action.owner ?? null,
        systemRank: action.rank,
        systemScore: Math.max(1, 100 - action.rank * 10),
        lastEvaluatedAt: now,
        updatedAt: now
      }
    });
  }
}
function withActionState(params) {
  return params.actions.map((action) => {
    const eligibility = params.gscFreshness.state === "unavailable" ? "suppressed_due_to_freshness" : params.gscFreshness.state === "partial" ? "eligible_with_warning" : "eligible";
    const isTechnicalAction = action.id.startsWith("weekly_tech_");
    const crawlNote = isTechnicalAction && params.crawlFreshness.state !== "complete" ? params.crawlFreshness.note : null;
    return {
      ...action,
      state: params.actionStateByFingerprint.get(action.fingerprint)?.state ?? "open",
      freshnessEligibility: eligibility,
      freshnessNote: crawlNote ? crawlNote : eligibility === "eligible_with_warning" ? params.gscFreshness.note : eligibility === "suppressed_due_to_freshness" ? "This action is hidden until Search Console data is available." : null,
      systemRank: params.actionStateByFingerprint.get(action.fingerprint)?.systemRank ?? action.rank,
      systemScore: params.actionStateByFingerprint.get(action.fingerprint)?.systemScore ?? Math.max(1, 100 - action.rank * 10),
      priorityOverride: params.actionStateByFingerprint.get(action.fingerprint)?.priorityOverride ?? "none"
    };
  });
}
async function getLiveDashboardData(input) {
  const property = await fetchAuthorizedProperty(input.teamId, input.propertyId);
  const today = normalizeDateString(input.today) ?? formatDate(/* @__PURE__ */ new Date());
  const safeLatestDate = buildSafeLatestDate(today);
  const window = resolveAnalysisWindow({
    preset: input.preset,
    compareMode: input.compareMode,
    startDate: input.startDate,
    endDate: input.endDate,
    safeLatestDate
  });
  const [latestDates, latestCrawl, refreshState] = await Promise.all([
    fetchLatestDateForSource({ property }),
    getLatestPropertyCrawl({ teamId: input.teamId, propertyId: property.id }),
    getLatestPropertyRefreshState(input.teamId, property.id)
  ]);
  const gscFreshness = summarizeSourceFreshness({
    source: "gsc",
    lastAvailableDate: latestDates.gscLatestDate,
    safeLatestDate,
    requestedEndDate: window.requestedEndDate
  });
  const crawlFreshness = summarizeCrawlFreshness({
    crawlCapturedAt: latestCrawl?.createdAt ?? null,
    crawl: latestCrawl?.crawl ?? null
  });
  const freshnessSources = [
    gscFreshness,
    ...property.ga4PropertyId ? [
      summarizeSourceFreshness({
        source: "ga4",
        lastAvailableDate: latestDates.ga4LatestDate,
        safeLatestDate,
        requestedEndDate: window.requestedEndDate
      })
    ] : [],
    crawlFreshness
  ];
  const dashboardFreshnessState = gscFreshness.state === "unavailable" ? "unavailable" : freshnessSources.some((source) => source.state === "stale") ? "stale" : freshnessSources.some((source) => source.state === "partial" || source.source !== "gsc" && source.state === "unavailable") ? "partial" : "complete";
  const recentChanges = await fetchRecentChanges(property.id, window.startDate, window.endDate);
  const sourceVersionHash = buildSourceVersionHash({
    gscLastFactAt: latestDates.gscLastFactAt,
    ga4LastFactAt: latestDates.ga4LastFactAt,
    crawlCapturedAt: latestCrawl?.createdAt ?? null,
    crawlFingerprint: latestCrawl?.fingerprint ?? null,
    changeLastUpdatedAt: recentChanges[0]?.lastChangedAt ?? null
  });
  let payload = await readCache({
    property,
    window,
    sourceVersionHash
  });
  if (!payload) {
    const windowData = await fetchWindowData({
      property,
      startDate: window.startDate,
      endDate: window.endDate,
      compareStartDate: window.compareStartDate,
      compareEndDate: window.compareEndDate
    });
    const gscCurrent = {
      ...aggregateGscSummary(windowData.currentFacts),
      topQueries: aggregateQueryPayloads(windowData.currentRaw),
      topPages: aggregatePagePayloads(windowData.currentRaw),
      topCountries: [],
      topDevices: []
    };
    const gscCompare = {
      ...aggregateGscSummary(windowData.compareFacts),
      topQueries: aggregateQueryPayloads(windowData.compareRaw),
      topPages: aggregatePagePayloads(windowData.compareRaw),
      topCountries: [],
      topDevices: []
    };
    const ga4CurrentTotals = aggregateGa4Summary(windowData.currentGa4);
    const ga4CompareTotals = aggregateGa4Summary(windowData.compareGa4);
    const insights = buildDeterministicInsights({
      gscCurrent,
      gscCompare,
      ga4Current: property.ga4PropertyId ? { ...ga4CurrentTotals, newUsers: 0 } : null,
      ga4Compare: property.ga4PropertyId ? { ...ga4CompareTotals, newUsers: 0 } : null,
      crawl: latestCrawl?.crawl ?? null,
      siteChanges: {
        newPages: [],
        changedPages: recentChanges.map((change) => ({ url: change.url })),
        removedPages: []
      },
      currentSeries: buildTrendSeries({
        facts: windowData.currentFacts,
        ga4Facts: windowData.currentGa4,
        startDate: window.startDate,
        endDate: window.endDate
      }),
      compareSeries: window.compareStartDate && window.compareEndDate ? buildTrendSeries({
        facts: windowData.compareFacts,
        ga4Facts: windowData.compareGa4,
        startDate: window.compareStartDate,
        endDate: window.compareEndDate,
        labelStartDate: window.startDate
      }) : [],
      compareRangeEnd: window.compareEndDate ?? window.endDate
    });
    const actions = insights.weeklyActionRows.slice(0, 6).map((action) => ({
      ...action,
      ...buildActionIdentity(action)
    }));
    const operatingContext = summarizeOperatingContext({
      clicksCurrent: gscCurrent.clicks,
      clicksCompare: gscCompare.clicks,
      actions,
      crawlFreshness
    });
    const degradedStates = buildDegradedStates({
      actions,
      crawlFreshness,
      dashboardFreshnessState,
      refreshState
    });
    payload = {
      payloadVersion: sourceVersionHash,
      trend: insights.kpiTrendRows.map((row) => ({
        date: row.date,
        clicks: row.clicksCurrent,
        impressions: row.impressionsCurrent,
        ctr: row.ctrCurrent,
        position: row.positionCurrent,
        sessions: row.sessionsCurrent,
        users: row.usersCurrent
      })),
      overview: {
        clicks: gscCurrent.clicks,
        impressions: gscCurrent.impressions,
        ctr: gscCurrent.ctr,
        position: gscCurrent.position,
        sessions: property.ga4PropertyId ? ga4CurrentTotals.sessions : null,
        users: property.ga4PropertyId ? ga4CurrentTotals.users : null,
        compare: {
          clicks: gscCompare.clicks,
          impressions: gscCompare.impressions,
          ctr: gscCompare.ctr,
          position: gscCompare.position,
          sessions: property.ga4PropertyId ? ga4CompareTotals.sessions : null,
          users: property.ga4PropertyId ? ga4CompareTotals.users : null
        }
      },
      evidence: {
        queryOpportunities: insights.queryOpportunityRows.slice(0, 8),
        pageWinnersLosers: insights.pageWinnerLoserRows.slice(0, 8),
        nearWins: insights.nearWinKeywordRows.slice(0, 8),
        ctrGaps: insights.lostClickEstimateRows.slice(0, 8),
        contentDecay: insights.contentDecayRows.slice(0, 8),
        recentChanges
      },
      operatingContext,
      degradedStates,
      actions
    };
    await writeCache({
      property,
      window,
      sourceVersionHash,
      freshnessState: dashboardFreshnessState,
      freshnessSummary: {
        state: dashboardFreshnessState,
        safeLatestDate,
        sources: freshnessSources
      },
      payload
    });
  }
  if (!payload.payloadVersion) {
    payload.payloadVersion = sourceVersionHash;
  }
  if (!payload.operatingContext) {
    payload.operatingContext = summarizeOperatingContext({
      clicksCurrent: payload.overview.clicks,
      clicksCompare: payload.overview.compare.clicks,
      actions: payload.actions,
      crawlFreshness
    });
  }
  if (!payload.degradedStates) {
    payload.degradedStates = buildDegradedStates({
      actions: payload.actions,
      crawlFreshness,
      dashboardFreshnessState,
      refreshState
    });
  }
  if (payload.actions.length) {
    await syncActionsToStore({
      teamId: property.teamId,
      propertyId: property.id,
      actions: payload.actions
    });
  }
  const existingActions = await db.query.actionItems.findMany({
    where: (table, { and: andFn, eq: eqFn }) => andFn(eqFn(table.teamId, property.teamId), eqFn(table.propertyId, property.id))
  });
  const actionStateByFingerprint = new Map(existingActions.map((row) => [
    row.fingerprint,
    {
      state: row.state,
      systemRank: row.systemRank ?? null,
      systemScore: row.systemScore ?? null,
      priorityOverride: row.priorityOverride ?? "none"
    }
  ]));
  const hydratedActions = withActionState({
    actions: payload.actions,
    actionStateByFingerprint,
    gscFreshness,
    crawlFreshness
  });
  const topAction = hydratedActions[0] ?? null;
  return {
    property: {
      id: property.id,
      name: property.name,
      url: property.url,
      ga4PropertyId: property.ga4PropertyId
    },
    analysisWindow: window,
    payloadVersion: payload.payloadVersion ?? sourceVersionHash,
    propertyUpdateState: refreshState,
    freshness: {
      state: dashboardFreshnessState,
      safeLatestDate,
      sources: freshnessSources
    },
    operatingContext: payload.operatingContext,
    overview: payload.overview,
    trend: payload.trend,
    evidence: payload.evidence,
    degradedStates: payload.degradedStates,
    topAction,
    actions: hydratedActions,
    recentSnapshots: await fetchLatestSnapshots(property.teamId, property.id)
  };
}
async function upsertActionItemState(params) {
  const existing = await db.query.actionItems.findFirst({
    where: (table, { and: andFn, eq: eqFn }) => andFn(eqFn(table.propertyId, params.propertyId), eqFn(table.fingerprint, params.fingerprint))
  });
  const [row] = await db.insert(actionItems).values({
    id: existing?.id ?? `ai_${nanoid2(12)}`,
    teamId: params.teamId,
    propertyId: params.propertyId,
    fingerprint: params.fingerprint,
    actionFamily: params.actionFamily,
    causeFamily: params.causeFamily,
    remedyKey: params.remedyKey,
    targetType: params.targetType,
    targetKey: params.targetKey,
    title: params.title,
    owner: params.owner ?? null,
    state: params.state ?? existing?.state ?? "open",
    systemRank: existing?.systemRank ?? null,
    systemScore: existing?.systemScore ?? null,
    priorityOverride: params.priorityOverride ?? existing?.priorityOverride ?? "none",
    overrideReason: params.overrideReason ?? existing?.overrideReason ?? null,
    overrideUpdatedByUserId: params.priorityOverride ? params.overrideUpdatedByUserId ?? null : existing?.overrideUpdatedByUserId ?? null,
    overrideUpdatedAt: params.priorityOverride ? /* @__PURE__ */ new Date() : existing?.overrideUpdatedAt ?? null,
    lastEvaluatedAt: /* @__PURE__ */ new Date(),
    updatedAt: /* @__PURE__ */ new Date()
  }).onConflictDoUpdate({
    target: [actionItems.propertyId, actionItems.fingerprint],
    set: {
      actionFamily: params.actionFamily,
      causeFamily: params.causeFamily,
      remedyKey: params.remedyKey,
      targetType: params.targetType,
      targetKey: params.targetKey,
      title: params.title,
      owner: params.owner ?? null,
      state: params.state ?? existing?.state ?? "open",
      priorityOverride: params.priorityOverride ?? existing?.priorityOverride ?? "none",
      overrideReason: params.priorityOverride ? params.overrideReason ?? null : existing?.overrideReason ?? null,
      overrideUpdatedByUserId: params.priorityOverride ? params.overrideUpdatedByUserId ?? null : existing?.overrideUpdatedByUserId ?? null,
      overrideUpdatedAt: params.priorityOverride ? /* @__PURE__ */ new Date() : existing?.overrideUpdatedAt ?? null,
      lastEvaluatedAt: /* @__PURE__ */ new Date(),
      updatedAt: /* @__PURE__ */ new Date()
    }
  }).returning({
    id: actionItems.id,
    fingerprint: actionItems.fingerprint,
    state: actionItems.state,
    priorityOverride: actionItems.priorityOverride
  });
  return row;
}
async function getLatestDashboardPayloadVersion(params) {
  const row = await db.query.analysisWindowCache.findFirst({
    where: and(
      eq(analysisWindowCache.teamId, params.teamId),
      eq(analysisWindowCache.propertyId, params.propertyId)
    ),
    orderBy: (table, { desc: descOrder }) => [descOrder(table.updatedAt)]
  });
  return row?.sourceVersionHash ?? null;
}
async function getWorkspaceActionBoard(teamId) {
  const [rows, refreshRows] = await Promise.all([
    db.query.actionItems.findMany({
      where: (table, { eq: eqFn }) => eqFn(table.teamId, teamId),
      orderBy: (table, { asc: ascOrder, desc: descOrder }) => [
        ascOrder(table.systemRank),
        descOrder(table.updatedAt)
      ],
      limit: 30
    }),
    db.query.properties.findMany({
      where: (table, { and: andFn, eq: eqFn }) => andFn(eqFn(table.teamId, teamId), eqFn(table.type, "gsc")),
      columns: {
        id: true,
        name: true,
        url: true
      }
    })
  ]);
  const refreshStateByProperty = /* @__PURE__ */ new Map();
  const crawlStateByProperty = /* @__PURE__ */ new Map();
  await Promise.all(refreshRows.map(async (property) => {
    const [state, crawl] = await Promise.all([
      getLatestPropertyRefreshState(teamId, property.id),
      getLatestPropertyCrawl({ teamId, propertyId: property.id })
    ]);
    refreshStateByProperty.set(property.id, state);
    const crawlFreshness = summarizeCrawlFreshness({
      crawlCapturedAt: crawl?.createdAt ?? null,
      crawl: crawl?.crawl ?? null
    });
    crawlStateByProperty.set(property.id, {
      missing: crawlFreshness.state === "unavailable",
      stale: crawlFreshness.state === "stale"
    });
  }));
  const propertyById = new Map(refreshRows.map((row) => [row.id, row]));
  const actions = rows.map((row) => ({
    id: row.id,
    propertyId: row.propertyId,
    propertyName: propertyById.get(row.propertyId)?.name ?? row.propertyId,
    propertyUrl: propertyById.get(row.propertyId)?.url ?? null,
    fingerprint: row.fingerprint,
    actionFamily: row.actionFamily,
    causeFamily: row.causeFamily,
    remedyKey: row.remedyKey,
    targetType: row.targetType,
    targetKey: row.targetKey,
    title: row.title,
    owner: row.owner,
    state: row.state,
    systemRank: row.systemRank ?? null,
    systemScore: row.systemScore ?? null,
    priorityOverride: row.priorityOverride ?? "none",
    updatedAt: row.updatedAt.toISOString(),
    refreshState: refreshStateByProperty.get(row.propertyId) ?? null,
    crawlState: crawlStateByProperty.get(row.propertyId) ?? { missing: false, stale: false }
  }));
  return {
    counts: {
      open: rows.filter((row) => row.state === "open").length,
      inProgress: rows.filter((row) => row.state === "in_progress").length,
      snoozed: rows.filter((row) => row.state === "snoozed").length,
      blocked: rows.filter((row) => row.priorityOverride === "pin" || row.systemRank === 1).length,
      refreshing: [...refreshStateByProperty.values()].filter((row) => row?.status === "queued" || row?.status === "processing").length
    },
    actions,
    propertiesNeedingAttention: refreshRows.map((property) => ({
      propertyId: property.id,
      propertyName: property.name,
      propertyUrl: property.url,
      refreshState: refreshStateByProperty.get(property.id) ?? null,
      crawlState: crawlStateByProperty.get(property.id) ?? { missing: false, stale: false }
    })).filter(
      (row) => row.refreshState?.status === "failed" || row.refreshState?.status === "queued" || row.refreshState?.status === "processing" || row.crawlState.missing || row.crawlState.stale
    )
  };
}
async function createSnapshotExport(params) {
  const dashboard = await getLiveDashboardData({
    teamId: params.teamId,
    propertyId: params.propertyId,
    preset: params.preset,
    compareMode: params.compareMode,
    startDate: params.startDate,
    endDate: params.endDate
  });
  const brandingSnapshot = await getTeamBrandingProfile(params.teamId);
  const [row] = await db.insert(snapshotExports).values({
    id: `se_${nanoid2(12)}`,
    teamId: params.teamId,
    propertyId: dashboard.property.id,
    createdByUserId: params.createdByUserId,
    preset: dashboard.analysisWindow.preset,
    startDate: dashboard.analysisWindow.startDate,
    endDate: dashboard.analysisWindow.endDate,
    compareMode: dashboard.analysisWindow.compareMode,
    compareStartDate: dashboard.analysisWindow.compareStartDate,
    compareEndDate: dashboard.analysisWindow.compareEndDate,
    requestedEndDate: dashboard.analysisWindow.requestedEndDate,
    freshnessState: dashboard.freshness.state,
    freshnessSummary: dashboard.freshness,
    brandingSnapshot,
    dashboardPayload: dashboard
  }).returning({
    id: snapshotExports.id,
    createdAt: snapshotExports.createdAt,
    freshnessState: snapshotExports.freshnessState,
    startDate: snapshotExports.startDate,
    endDate: snapshotExports.endDate,
    compareMode: snapshotExports.compareMode
  });
  return {
    id: row.id,
    createdAt: row.createdAt.toISOString(),
    freshnessState: row.freshnessState,
    startDate: normalizeDateString(row.startDate) ?? "",
    endDate: normalizeDateString(row.endDate) ?? "",
    compareMode: row.compareMode
  };
}
async function getSnapshotExportDetail(params) {
  const row = await db.query.snapshotExports.findFirst({
    where: (table, { and: andFn, eq: eqFn }) => andFn(
      eqFn(table.id, params.snapshotId),
      eqFn(table.teamId, params.teamId),
      eqFn(table.propertyId, params.propertyId)
    )
  });
  if (!row) {
    return null;
  }
  const payload = row.dashboardPayload ?? null;
  const overview = payload && typeof payload === "object" && "overview" in payload ? payload.overview : null;
  const payloadActions = payload && typeof payload === "object" && "actions" in payload && Array.isArray(payload.actions) ? payload.actions : [];
  return {
    id: row.id,
    createdAt: row.createdAt.toISOString(),
    freshnessState: row.freshnessState,
    startDate: normalizeDateString(row.startDate) ?? "",
    endDate: normalizeDateString(row.endDate) ?? "",
    requestedEndDate: normalizeDateString(row.requestedEndDate) ?? "",
    compareMode: row.compareMode,
    compareStartDate: normalizeDateString(row.compareStartDate),
    compareEndDate: normalizeDateString(row.compareEndDate),
    freshnessSummary: row.freshnessSummary ?? null,
    overview,
    actionCount: payloadActions.length
  };
}
export {
  createSnapshotExport,
  getLatestDashboardPayloadVersion,
  getLiveDashboardData,
  getSnapshotExportDetail,
  getWorkspaceActionBoard,
  resolveAnalysisWindow,
  upsertActionItemState
};
