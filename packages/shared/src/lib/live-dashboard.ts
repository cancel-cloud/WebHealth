import { createHash } from "node:crypto";
import { and, eq, isNull, lt } from "drizzle-orm";
import { nanoid } from "nanoid";
import { db } from "@webhealth/shared/db";
import {
  actionItems,
  analysisWindowCache,
  ga4DailyFacts,
  gscDailyFacts,
  gscDailyRaw,
  properties,
  propertyPageRegistry,
  propertyShareLinks,
  snapshotExports,
} from "@webhealth/shared/db/schema";
import type { CrawlResult } from "@webhealth/shared/lib/crawl";
import {
  getLatestPropertyCrawl,
  getLatestPropertyRefreshState,
  getLatestPropertyRefreshStateForWindow,
  type PropertyRefreshState,
} from "@webhealth/shared/lib/property-refresh";
import { getLatestMetricsBackfillState } from "@webhealth/shared/lib/metrics-cache";
import { buildDeterministicInsights } from "@webhealth/shared/lib/deterministic-insights";
import type {
  RecommendationState,
  WeeklyActionRow,
} from "@webhealth/shared/lib/action-types";
import { resolveTeamReportSources } from "@webhealth/shared/lib/properties/reportable-properties-db";
import { getTeamBrandingProfile } from "@webhealth/shared/lib/team-branding";
import { getLatestCompleteAiActions } from "@webhealth/shared/lib/ai-dashboard-actions";

export type AnalysisPreset = "last_7d" | "last_28d" | "last_90d" | "custom";
export type CompareMode = "previous_period" | "same_period_last_year" | "none";
export type FreshnessState = "complete" | "partial" | "stale" | "unavailable";
export type FreshnessEligibility = "eligible" | "eligible_with_warning" | "suppressed_due_to_freshness";
export type PriorityOverride = "none" | "raise" | "pin" | "lower";

type DateString = string;
type PropertyRecord = typeof properties.$inferSelect;

type TrendPoint = {
  date: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
  sessions?: number;
  users?: number;
};

export type SourceFreshness = {
  source: "gsc" | "ga4" | "crawl";
  state: FreshnessState;
  safeLatestDate: DateString | null;
  lastAvailableDate: DateString | null;
  note: string;
  capturedAt?: string | null;
  ageInDays?: number | null;
};

type ActionIdentity = {
  fingerprint: string;
  actionFamily: string;
  causeFamily: string;
  remedyKey: string;
  targetType: string;
  targetKey: string;
};

export type ActionWorkflowState = {
  state: RecommendationState;
  systemRank: number | null;
  systemScore: number | null;
  priorityOverride: PriorityOverride;
  assigneeUserId: string | null;
  assigneeEmail: string | null;
  snoozedUntil: string | null;
};

type CachedDashboardPayload = {
  payloadVersion: string;
  trend: TrendPoint[];
  overview: {
    clicks: number;
    impressions: number;
    ctr: number;
    position: number;
    sessions: number | null;
    users: number | null;
    compare: {
      clicks: number;
      impressions: number;
      ctr: number;
      position: number;
      sessions: number | null;
      users: number | null;
    };
  };
  evidence: {
    queryOpportunities: ReturnType<typeof buildDeterministicInsights>["queryOpportunityRows"];
    pageWinnersLosers: ReturnType<typeof buildDeterministicInsights>["pageWinnerLoserRows"];
    nearWins: ReturnType<typeof buildDeterministicInsights>["nearWinKeywordRows"];
    ctrGaps: ReturnType<typeof buildDeterministicInsights>["lostClickEstimateRows"];
    contentDecay: ReturnType<typeof buildDeterministicInsights>["contentDecayRows"];
    recentChanges: Array<{ url: string; lastChangedAt: string | null }>;
  };
  operatingContext: {
    status: "healthy" | "slipping" | "blocked" | "mixed";
    summary: string;
    topRisk: string | null;
    topOpportunity: string | null;
  };
  degradedStates: Array<{
    code: string;
    title: string;
    message: string;
    ctaLabel?: string | null;
  }>;
  actions: Array<WeeklyActionRow & ActionIdentity>;
};

export type LiveDashboardInput = {
  teamId: string;
  propertyId: string;
  preset?: string | null;
  compareMode?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  today?: string;
};

export type LiveDashboardSnapshotSummary = {
  id: string;
  createdAt: string;
  freshnessState: FreshnessState;
  startDate: string;
  endDate: string;
  compareMode: CompareMode;
};

export type LiveDashboardSnapshotDetail = LiveDashboardSnapshotSummary & {
  requestedEndDate: string;
  compareStartDate: string | null;
  compareEndDate: string | null;
  freshnessSummary: LiveDashboardData["freshness"] | null;
  overview: LiveDashboardData["overview"] | null;
  actionCount: number;
};

export type LiveDashboardData = {
  property: {
    id: string;
    name: string;
    url: string;
    ga4PropertyId: string | null;
  };
  analysisWindow: {
    preset: AnalysisPreset;
    compareMode: CompareMode;
    startDate: DateString;
    endDate: DateString;
    requestedEndDate: DateString;
    compareStartDate: DateString | null;
    compareEndDate: DateString | null;
  };
  freshness: {
    state: FreshnessState;
    safeLatestDate: DateString | null;
    sources: SourceFreshness[];
  };
  payloadVersion: string;
  propertyUpdateState: PropertyRefreshState | null;
  operatingContext: CachedDashboardPayload["operatingContext"];
  overview: CachedDashboardPayload["overview"];
  trend: TrendPoint[];
  evidence: CachedDashboardPayload["evidence"];
  degradedStates: CachedDashboardPayload["degradedStates"];
  topAction: ((WeeklyActionRow & ActionIdentity) & {
    state: RecommendationState;
    freshnessEligibility: FreshnessEligibility;
    freshnessNote: string | null;
    systemRank: number | null;
    systemScore: number | null;
    priorityOverride: PriorityOverride;
    assigneeUserId: string | null;
    assigneeEmail: string | null;
    snoozedUntil: string | null;
  }) | null;
  actions: Array<(WeeklyActionRow & ActionIdentity) & {
    state: RecommendationState;
    freshnessEligibility: FreshnessEligibility;
    freshnessNote: string | null;
    systemRank: number | null;
    systemScore: number | null;
    priorityOverride: PriorityOverride;
    assigneeUserId: string | null;
    assigneeEmail: string | null;
    snoozedUntil: string | null;
  }>;
  recentSnapshots: LiveDashboardSnapshotSummary[];
};

function normalizeDateString(value: unknown): DateString | null {
  if (!value) return null;
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  const raw = String(value).slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(raw) ? raw : null;
}

function parseDate(value: DateString) {
  return new Date(`${value}T00:00:00.000Z`);
}

function formatDate(value: Date) {
  return value.toISOString().slice(0, 10);
}

function addDays(value: DateString, days: number) {
  const date = parseDate(value);
  date.setUTCDate(date.getUTCDate() + days);
  return formatDate(date);
}

function daysInclusive(startDate: DateString, endDate: DateString) {
  const start = parseDate(startDate).getTime();
  const end = parseDate(endDate).getTime();
  return Math.floor((end - start) / 86_400_000) + 1;
}

function toPercent(value: number) {
  return Number.isFinite(value) ? value : 0;
}

function parseNumericFact(value: string | null | undefined) {
  if (!value) return 0;
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
}

function aggregateGscSummary(rows: Array<typeof gscDailyFacts.$inferSelect>) {
  const clicks = rows.reduce((sum, row) => sum + row.clicks, 0);
  const impressions = rows.reduce((sum, row) => sum + row.impressions, 0);
  const weightedPosition = rows.reduce(
    (sum, row) => sum + parseNumericFact(row.position) * Math.max(row.impressions, 1),
    0,
  );

  return {
    clicks,
    impressions,
    ctr: impressions > 0 ? clicks / impressions : 0,
    position: impressions > 0 ? weightedPosition / impressions : 0,
  };
}

function aggregateGa4Summary(rows: Array<typeof ga4DailyFacts.$inferSelect>) {
  return {
    sessions: rows.reduce((sum, row) => sum + row.sessions, 0),
    users: rows.reduce((sum, row) => sum + row.users, 0),
  };
}

function aggregateQueryPayloads(rawRows: Array<typeof gscDailyRaw.$inferSelect>) {
  const map = new Map<string, { clicks: number; impressions: number; weightedPosition: number }>();
  for (const row of rawRows) {
    const payload = Array.isArray(row.queriesPayload) ? row.queriesPayload : [];
    for (const item of payload) {
      if (!item || typeof item !== "object") continue;
      const record = item as Record<string, unknown>;
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

  return [...map.entries()]
    .map(([query, value]) => ({
      query,
      clicks: value.clicks,
      impressions: value.impressions,
      ctr: value.impressions > 0 ? value.clicks / value.impressions : 0,
      position: value.impressions > 0 ? value.weightedPosition / value.impressions : 0,
    }))
    .sort((left, right) => right.clicks - left.clicks)
    .slice(0, 25);
}

function aggregatePagePayloads(rawRows: Array<typeof gscDailyRaw.$inferSelect>) {
  const map = new Map<string, { clicks: number; impressions: number }>();
  for (const row of rawRows) {
    const payload = Array.isArray(row.pagesPayload) ? row.pagesPayload : [];
    for (const item of payload) {
      if (!item || typeof item !== "object") continue;
      const record = item as Record<string, unknown>;
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

  return [...map.entries()]
    .map(([page, value]) => ({
      page,
      clicks: value.clicks,
      impressions: value.impressions,
    }))
    .sort((left, right) => right.clicks - left.clicks)
    .slice(0, 25);
}

function buildTrendSeries(params: {
  facts: Array<typeof gscDailyFacts.$inferSelect>;
  ga4Facts: Array<typeof ga4DailyFacts.$inferSelect>;
  startDate: DateString;
  endDate: DateString;
  labelStartDate?: DateString;
}) {
  const currentByDate = new Map(params.facts.map((row) => [normalizeDateString(row.sourceDate)!, row] as const));
  const currentGa4ByDate = new Map(params.ga4Facts.map((row) => [normalizeDateString(row.sourceDate)!, row] as const));
  const labelStartDate = params.labelStartDate ?? params.startDate;

  const points: TrendPoint[] = [];
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
      users: ga4Current?.users ?? 0,
    });
  }

  return points;
}

function buildSafeLatestDate(today: DateString) {
  return addDays(today, -2);
}

function resolvePreset(value: string | null | undefined): AnalysisPreset {
  if (value === "last_7d" || value === "last_28d" || value === "last_90d" || value === "custom") {
    return value;
  }
  return "last_28d";
}

function resolveCompareMode(value: string | null | undefined): CompareMode {
  if (value === "previous_period" || value === "same_period_last_year" || value === "none") {
    return value;
  }
  return "previous_period";
}

export function resolveAnalysisWindow(input: {
  preset?: string | null;
  compareMode?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  safeLatestDate: DateString;
}) {
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

  let compareStartDate: DateString | null = null;
  let compareEndDate: DateString | null = null;

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
    compareEndDate,
  };
}

function summarizeSourceFreshness(params: {
  source: "gsc" | "ga4";
  lastAvailableDate: DateString | null;
  safeLatestDate: DateString;
  requestedEndDate: DateString;
  hasLinkedProperty?: boolean;
}) {
  if (params.source === "ga4" && params.hasLinkedProperty === false) {
    return {
      source: params.source,
      state: "unavailable" as const,
      safeLatestDate: null,
      lastAvailableDate: null,
      note: "GA4 is not linked for this property.",
    };
  }

  if (!params.lastAvailableDate) {
    return {
      source: params.source,
      state: "unavailable" as const,
      safeLatestDate: null,
      lastAvailableDate: null,
      note: params.source === "ga4" ? "Analytics data has not been cached yet." : "Search Console data has not been cached yet.",
    };
  }

  const safeLatest = params.lastAvailableDate < params.safeLatestDate ? params.lastAvailableDate : params.safeLatestDate;
  if (params.requestedEndDate > safeLatest) {
    return {
      source: params.source,
      state: "partial" as const,
      safeLatestDate: safeLatest,
      lastAvailableDate: params.lastAvailableDate,
      note: `${params.source === "ga4" ? "GA4" : "Search Console"} is complete through ${safeLatest}.`,
    };
  }

  return {
    source: params.source,
    state: "complete" as const,
    safeLatestDate: safeLatest,
    lastAvailableDate: params.lastAvailableDate,
    note: `${params.source === "ga4" ? "GA4" : "Search Console"} is complete through ${safeLatest}.`,
  };
}

function summarizeCrawlFreshness(input: {
  crawlCapturedAt: string | null;
  crawl: CrawlResult | null;
  now?: Date;
}) {
  if (!input.crawl || !input.crawlCapturedAt) {
    return {
      source: "crawl" as const,
      state: "unavailable" as const,
      safeLatestDate: null,
      lastAvailableDate: null,
      capturedAt: null,
      ageInDays: null,
      note: "Technical scan has not been captured yet.",
    };
  }

  const capturedAtDate = new Date(input.crawlCapturedAt);
  const ageInDays = Math.max(
    0,
    Math.floor(((input.now ?? new Date()).getTime() - capturedAtDate.getTime()) / 86_400_000),
  );

  if (ageInDays >= 10) {
    return {
      source: "crawl" as const,
      state: "stale" as const,
      safeLatestDate: null,
      lastAvailableDate: null,
      capturedAt: input.crawlCapturedAt,
      ageInDays,
      note: `Technical scan is ${ageInDays} days old.`,
    };
  }

  return {
    source: "crawl" as const,
    state: "complete" as const,
    safeLatestDate: null,
    lastAvailableDate: null,
    capturedAt: input.crawlCapturedAt,
    ageInDays,
    note: ageInDays === 0 ? "Technical scan was refreshed today." : `Technical scan is ${ageInDays} day${ageInDays === 1 ? "" : "s"} old.`,
  };
}

export function buildFreshnessSources(input: {
  gscLatestDate: DateString | null;
  ga4LatestDate: DateString | null;
  hasGa4Property: boolean;
  safeLatestDate: DateString;
  requestedEndDate: DateString;
  crawlCapturedAt: string | null;
  crawl: CrawlResult | null;
  now?: Date;
}): { state: FreshnessState; safeLatestDate: DateString | null; sources: SourceFreshness[] } {
  const gscFreshness = summarizeSourceFreshness({
    source: "gsc",
    lastAvailableDate: input.gscLatestDate,
    safeLatestDate: input.safeLatestDate,
    requestedEndDate: input.requestedEndDate,
  });
  const ga4Freshness = summarizeSourceFreshness({
    source: "ga4",
    lastAvailableDate: input.ga4LatestDate,
    safeLatestDate: input.safeLatestDate,
    requestedEndDate: input.requestedEndDate,
    hasLinkedProperty: input.hasGa4Property,
  });
  const crawlFreshness = summarizeCrawlFreshness({
    crawlCapturedAt: input.crawlCapturedAt,
    crawl: input.crawl,
    now: input.now,
  });
  const sources = [gscFreshness, ga4Freshness, crawlFreshness];
  const state: FreshnessState =
    gscFreshness.state === "unavailable"
      ? "unavailable"
      : sources.some((source) => source.state === "stale")
        ? "stale"
        : sources.some((source) => source.state === "partial" || (source.source !== "gsc" && source.state === "unavailable"))
          ? "partial"
          : "complete";

  return {
    state,
    safeLatestDate: input.safeLatestDate,
    sources,
  };
}

function buildActionIdentity(row: WeeklyActionRow): ActionIdentity {
  if (row.id.startsWith("weekly_decay_")) {
    const targetKey = row.targetPage ?? row.title;
    return {
      fingerprint: `content_refresh|page|${targetKey}|refresh_core_content|content_decay`,
      actionFamily: "content_refresh",
      causeFamily: "content_decay",
      remedyKey: "refresh_core_content",
      targetType: "page",
      targetKey,
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
      targetKey,
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
      targetKey,
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
      targetKey: issueType,
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
      targetKey,
    };
  }

  return {
    fingerprint: `${row.recommendationClass}|site|${row.title}|review_action|generic_signal`,
    actionFamily: "review_action",
    causeFamily: "generic_signal",
    remedyKey: "review_action",
    targetType: "site",
    targetKey: row.title,
  };
}

function buildSourceVersionHash(params: {
  gscLastFactAt: string | null;
  ga4LastFactAt: string | null;
  crawlCapturedAt: string | null;
  crawlFingerprint: string | null;
  changeLastUpdatedAt: string | null;
}) {
  const rawVersionKey = JSON.stringify({
    gscLastFactAt: params.gscLastFactAt ?? null,
    ga4LastFactAt: params.ga4LastFactAt ?? null,
    crawlCapturedAt: params.crawlCapturedAt ?? null,
    crawlFingerprintDigest: params.crawlFingerprint
      ? createHash("sha256").update(params.crawlFingerprint).digest("hex")
      : null,
    changeLastUpdatedAt: params.changeLastUpdatedAt ?? null,
  });

  return `ldv1_${createHash("sha256").update(rawVersionKey).digest("hex")}`;
}

function summarizeOperatingContext(params: {
  clicksCurrent: number;
  clicksCompare: number;
  actions: Array<WeeklyActionRow & ActionIdentity>;
  crawlFreshness: SourceFreshness;
}) {
  const clicksDelta = params.clicksCurrent - params.clicksCompare;
  const topAction = params.actions[0] ?? null;
  const technicalTopAction = params.actions.find((row) => row.id.startsWith("weekly_tech_")) ?? null;
  const status: "healthy" | "slipping" | "blocked" | "mixed" =
    params.crawlFreshness.state === "unavailable"
      ? "mixed"
      : clicksDelta < 0 && technicalTopAction
        ? "blocked"
        : clicksDelta < 0
          ? "slipping"
          : topAction
            ? "mixed"
            : "healthy";

  return {
    status,
    summary:
      status === "blocked"
        ? "Traffic is slipping and technical blockers are present."
        : status === "slipping"
          ? "This window is down versus the comparison range."
          : status === "mixed"
            ? "Some movement needs action, but the picture is not clean."
            : "No major blockers are leading this window.",
    topRisk: technicalTopAction?.title ?? (clicksDelta < 0 ? "Traffic is down versus the comparison window." : null),
    topOpportunity: topAction?.title ?? null,
  };
}

export function buildDegradedStates(params: {
  actions: Array<WeeklyActionRow & ActionIdentity>;
  crawlFreshness: SourceFreshness;
  dashboardFreshnessState: FreshnessState;
  refreshState: PropertyRefreshState | null;
}) {
  const rows: CachedDashboardPayload["degradedStates"] = [];

  if (params.crawlFreshness.state === "unavailable") {
    rows.push({
      code: "technical_unavailable",
      title: "Technical scan unavailable",
      message: "Traffic signals are live, but technical actions cannot be ranked until a crawl exists.",
      ctaLabel: "Run crawl",
    });
  } else if (params.crawlFreshness.state === "stale") {
    rows.push({
      code: "technical_stale",
      title: "Technical scan is stale",
      message: params.crawlFreshness.note,
      ctaLabel: "Refresh technical scan",
    });
  }

  if (params.refreshState?.status === "queued" || params.refreshState?.status === "processing") {
    rows.push({
      code: "refresh_in_progress",
      title: "Update in progress",
      message: params.refreshState.message ?? "Recommendations may change when the refresh completes.",
    });
  } else if (params.refreshState?.status === "failed") {
    rows.push({
      code: "refresh_failed",
      title: "Latest update failed",
      message: "Showing the last valid decision set.",
      ctaLabel: "Refresh technical scan",
    });
  }

  if (params.dashboardFreshnessState === "partial") {
    rows.push({
      code: "partial_traffic_data",
      title: "Traffic data is partial",
      message: "Some traffic recommendations are based on partial source coverage.",
    });
  }

  if (!params.actions.length) {
    rows.push({
      code: "no_ranked_actions",
      title: "No ranked actions qualified",
      message: "The current window has supporting signals, but none met the ranking threshold for an action.",
    });
  }

  return rows;
}

function chooseVisibleRefreshState(
  propertyRefreshState: PropertyRefreshState | null,
  metricsRefreshState: PropertyRefreshState | null,
) {
  const propertyActive = propertyRefreshState?.status === "queued" || propertyRefreshState?.status === "processing";
  const metricsActive = metricsRefreshState?.status === "queued" || metricsRefreshState?.status === "processing";
  if (propertyActive || !metricsActive) return propertyRefreshState;
  return metricsRefreshState;
}

async function fetchAuthorizedProperty(teamId: string, propertyId: string) {
  const resolved = await resolveTeamReportSources(teamId, propertyId);
  return resolved.canonicalGscProperty;
}

async function fetchLatestSnapshots(teamId: string, propertyId: string): Promise<LiveDashboardSnapshotSummary[]> {
  const rows = await db.query.snapshotExports.findMany({
    where: (table, { and, eq }) => and(eq(table.teamId, teamId), eq(table.propertyId, propertyId)),
    orderBy: (table, { desc: descOrder }) => [descOrder(table.createdAt)],
    limit: 5,
  });

  return rows.map((row) => ({
    id: row.id,
    createdAt: row.createdAt.toISOString(),
    freshnessState: row.freshnessState as FreshnessState,
    startDate: normalizeDateString(row.startDate) ?? "",
    endDate: normalizeDateString(row.endDate) ?? "",
    compareMode: row.compareMode as CompareMode,
  }));
}

async function fetchLatestDateForSource(params: {
  property: PropertyRecord;
}) {
  const [gscLatestRow, ga4LatestRow] = await Promise.all([
    db.query.gscDailyFacts.findFirst({
      where: (table, { eq: eqFn }) => eqFn(table.propertyId, params.property.id),
      orderBy: (table, { desc: descOrder }) => [descOrder(table.sourceDate)],
    }),
    params.property.ga4PropertyId
      ? db.query.ga4DailyFacts.findFirst({
          where: (table, { eq: eqFn }) => eqFn(table.ga4PropertyId, params.property.ga4PropertyId!),
          orderBy: (table, { desc: descOrder }) => [descOrder(table.sourceDate)],
        })
      : Promise.resolve(null),
  ]);

  return {
    gscLatestDate: normalizeDateString(gscLatestRow?.sourceDate),
    ga4LatestDate: normalizeDateString(ga4LatestRow?.sourceDate),
    gscLastFactAt: gscLatestRow?.updatedAt?.toISOString?.() ?? null,
    ga4LastFactAt: ga4LatestRow?.updatedAt?.toISOString?.() ?? null,
  };
}

async function fetchRecentChanges(propertyId: string, startDate: DateString, endDate: DateString) {
  const rows = await db.query.propertyPageRegistry.findMany({
    where: (table, { and: andFn, eq: eqFn, gte: gteFn, lte: lteFn }) =>
      andFn(
        eqFn(table.propertyId, propertyId),
        gteFn(table.lastChangedAt, new Date(`${startDate}T00:00:00.000Z`)),
        lteFn(table.lastChangedAt, new Date(`${endDate}T23:59:59.999Z`)),
      ),
    orderBy: (table, { desc: descOrder }) => [descOrder(table.lastChangedAt)],
    limit: 10,
  });

  return rows.map((row) => ({
    url: row.canonicalUrl,
    lastChangedAt: row.lastChangedAt?.toISOString() ?? null,
  }));
}

async function fetchWindowData(params: {
  property: PropertyRecord;
  startDate: DateString;
  endDate: DateString;
  compareStartDate: DateString | null;
  compareEndDate: DateString | null;
}) {
  const [
    currentFacts,
    currentRaw,
    compareFacts,
    compareRaw,
    currentGa4,
    compareGa4,
  ] = await Promise.all([
    db.query.gscDailyFacts.findMany({
      where: (table, { and: andFn, eq: eqFn, gte: gteFn, lte: lteFn }) =>
        andFn(eqFn(table.propertyId, params.property.id), gteFn(table.sourceDate, params.startDate), lteFn(table.sourceDate, params.endDate)),
      orderBy: (table, { asc }) => [asc(table.sourceDate)],
    }),
    db.query.gscDailyRaw.findMany({
      where: (table, { and: andFn, eq: eqFn, gte: gteFn, lte: lteFn }) =>
        andFn(eqFn(table.propertyId, params.property.id), gteFn(table.sourceDate, params.startDate), lteFn(table.sourceDate, params.endDate)),
      orderBy: (table, { asc }) => [asc(table.sourceDate)],
    }),
    params.compareStartDate && params.compareEndDate
      ? db.query.gscDailyFacts.findMany({
          where: (table, { and: andFn, eq: eqFn, gte: gteFn, lte: lteFn }) =>
            andFn(
              eqFn(table.propertyId, params.property.id),
              gteFn(table.sourceDate, params.compareStartDate!),
              lteFn(table.sourceDate, params.compareEndDate!),
            ),
          orderBy: (table, { asc }) => [asc(table.sourceDate)],
        })
      : Promise.resolve([]),
    params.compareStartDate && params.compareEndDate
      ? db.query.gscDailyRaw.findMany({
          where: (table, { and: andFn, eq: eqFn, gte: gteFn, lte: lteFn }) =>
            andFn(
              eqFn(table.propertyId, params.property.id),
              gteFn(table.sourceDate, params.compareStartDate!),
              lteFn(table.sourceDate, params.compareEndDate!),
            ),
          orderBy: (table, { asc }) => [asc(table.sourceDate)],
        })
      : Promise.resolve([]),
    params.property.ga4PropertyId
      ? db.query.ga4DailyFacts.findMany({
          where: (table, { and: andFn, eq: eqFn, gte: gteFn, lte: lteFn }) =>
            andFn(
              eqFn(table.ga4PropertyId, params.property.ga4PropertyId!),
              gteFn(table.sourceDate, params.startDate),
              lteFn(table.sourceDate, params.endDate),
            ),
          orderBy: (table, { asc }) => [asc(table.sourceDate)],
        })
      : Promise.resolve([]),
    params.property.ga4PropertyId && params.compareStartDate && params.compareEndDate
      ? db.query.ga4DailyFacts.findMany({
          where: (table, { and: andFn, eq: eqFn, gte: gteFn, lte: lteFn }) =>
            andFn(
              eqFn(table.ga4PropertyId, params.property.ga4PropertyId!),
              gteFn(table.sourceDate, params.compareStartDate!),
              lteFn(table.sourceDate, params.compareEndDate!),
            ),
          orderBy: (table, { asc }) => [asc(table.sourceDate)],
        })
      : Promise.resolve([]),
  ]);

  return {
    currentFacts,
    currentRaw,
    compareFacts,
    compareRaw,
    currentGa4,
    compareGa4,
  };
}

async function readCache(params: {
  property: PropertyRecord;
  window: ReturnType<typeof resolveAnalysisWindow>;
  sourceVersionHash: string;
}) {
  const row = await db.query.analysisWindowCache.findFirst({
    where: and(
      eq(analysisWindowCache.propertyId, params.property.id),
      eq(analysisWindowCache.startDate, params.window.startDate),
      eq(analysisWindowCache.endDate, params.window.endDate),
      eq(analysisWindowCache.compareMode, params.window.compareMode),
      params.window.compareStartDate
        ? eq(analysisWindowCache.compareStartDate, params.window.compareStartDate)
        : isNull(analysisWindowCache.compareStartDate),
      params.window.compareEndDate
        ? eq(analysisWindowCache.compareEndDate, params.window.compareEndDate)
        : isNull(analysisWindowCache.compareEndDate),
      eq(analysisWindowCache.sourceVersionHash, params.sourceVersionHash),
    ),
    orderBy: (table, { desc: descOrder }) => [descOrder(table.updatedAt)],
  });

  if (!row || row.expiresAt <= new Date()) {
    return null;
  }

  return row.resolvedPayload as CachedDashboardPayload;
}

async function writeCache(params: {
  property: PropertyRecord;
  window: ReturnType<typeof resolveAnalysisWindow>;
  sourceVersionHash: string;
  freshnessState: FreshnessState;
  freshnessSummary: { state: FreshnessState; safeLatestDate: DateString | null; sources: SourceFreshness[] };
  payload: CachedDashboardPayload;
}) {
  await db
    .insert(analysisWindowCache)
    .values({
      id: `awc_${nanoid(12)}`,
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
      expiresAt: new Date(Date.now() + 15 * 60 * 1000),
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: [
        analysisWindowCache.propertyId,
        analysisWindowCache.startDate,
        analysisWindowCache.endDate,
        analysisWindowCache.compareMode,
        analysisWindowCache.compareStartDate,
        analysisWindowCache.compareEndDate,
        analysisWindowCache.sourceVersionHash,
      ],
      set: {
        preset: params.window.preset,
        requestedEndDate: params.window.requestedEndDate,
        freshnessState: params.freshnessState,
        freshnessSummary: params.freshnessSummary,
        resolvedPayload: params.payload,
        expiresAt: new Date(Date.now() + 15 * 60 * 1000),
        updatedAt: new Date(),
      },
    });
}

async function syncActionsToStore(params: {
  teamId: string;
  propertyId: string;
  actions: Array<WeeklyActionRow & ActionIdentity>;
}) {
  const now = new Date();
  for (const action of params.actions) {
    const existing = await db.query.actionItems.findFirst({
      where: (table, { and: andFn, eq: eqFn }) =>
        andFn(eqFn(table.propertyId, params.propertyId), eqFn(table.fingerprint, action.fingerprint)),
    });

    await db
      .insert(actionItems)
      .values({
        id: existing?.id ?? `ai_${nanoid(12)}`,
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
        assigneeUserId: existing?.assigneeUserId ?? null,
        assigneeEmail: existing?.assigneeEmail ?? null,
        state: (existing?.state as RecommendationState | undefined) ?? "open",
        systemRank: action.rank,
        systemScore: Math.max(1, 100 - action.rank * 10),
        priorityOverride: (existing?.priorityOverride as PriorityOverride | undefined) ?? "none",
        overrideReason: existing?.overrideReason ?? null,
        overrideUpdatedByUserId: existing?.overrideUpdatedByUserId ?? null,
        overrideUpdatedAt: existing?.overrideUpdatedAt ?? null,
        snoozedUntil: normalizeDateString(existing?.snoozedUntil),
        lastEvaluatedAt: now,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: [actionItems.propertyId, actionItems.fingerprint],
        set: {
          actionFamily: action.actionFamily,
          causeFamily: action.causeFamily,
          remedyKey: action.remedyKey,
          targetType: action.targetType,
          targetKey: action.targetKey,
          title: action.title,
          owner: action.owner ?? null,
          assigneeUserId: existing?.assigneeUserId ?? null,
          assigneeEmail: existing?.assigneeEmail ?? null,
          snoozedUntil: normalizeDateString(existing?.snoozedUntil),
          systemRank: action.rank,
          systemScore: Math.max(1, 100 - action.rank * 10),
          lastEvaluatedAt: now,
          updatedAt: now,
        },
      });
  }
}

function withActionState(params: {
  actions: Array<WeeklyActionRow & ActionIdentity>;
  actionStateByFingerprint: Map<string, ActionWorkflowState>;
  gscFreshness: SourceFreshness;
  crawlFreshness: SourceFreshness;
}) {
  return params.actions.map((action) => {
    const workflow = mergeActionWorkflowState({
      generated: action,
      stored: params.actionStateByFingerprint.get(action.fingerprint) ?? null,
    });
    const eligibility: FreshnessEligibility =
      params.gscFreshness.state === "unavailable"
        ? "suppressed_due_to_freshness"
        : params.gscFreshness.state === "partial"
          ? "eligible_with_warning"
          : "eligible";
    const isTechnicalAction = action.id.startsWith("weekly_tech_");
    const crawlNote = isTechnicalAction && params.crawlFreshness.state !== "complete"
      ? params.crawlFreshness.note
      : null;

    return {
      ...action,
      state: workflow.state,
      freshnessEligibility: eligibility,
      freshnessNote:
        crawlNote
          ? crawlNote
          : 
        eligibility === "eligible_with_warning"
          ? params.gscFreshness.note
          : eligibility === "suppressed_due_to_freshness"
            ? "This action is hidden until Search Console data is available."
            : null,
      systemRank: workflow.systemRank,
      systemScore: workflow.systemScore,
      priorityOverride: workflow.priorityOverride,
      assigneeUserId: workflow.assigneeUserId,
      assigneeEmail: workflow.assigneeEmail,
      snoozedUntil: workflow.snoozedUntil,
    };
  });
}

export function mergeActionWorkflowState(params: {
  generated: Pick<WeeklyActionRow, "rank" | "owner">;
  stored?: Partial<ActionWorkflowState> | null;
}): ActionWorkflowState {
  return {
    state: params.stored?.state ?? "open",
    systemRank: params.stored?.systemRank ?? params.generated.rank,
    systemScore: params.stored?.systemScore ?? Math.max(1, 100 - params.generated.rank * 10),
    priorityOverride: params.stored?.priorityOverride ?? "none",
    assigneeUserId: params.stored?.assigneeUserId ?? null,
    assigneeEmail: params.stored?.assigneeEmail ?? null,
    snoozedUntil: params.stored?.snoozedUntil ?? null,
  };
}

export async function getLiveDashboardData(input: LiveDashboardInput): Promise<LiveDashboardData> {
  const property = await fetchAuthorizedProperty(input.teamId, input.propertyId);
  const today = normalizeDateString(input.today) ?? formatDate(new Date());
  const safeLatestDate = buildSafeLatestDate(today);
  const window = resolveAnalysisWindow({
    preset: input.preset,
    compareMode: input.compareMode,
    startDate: input.startDate,
    endDate: input.endDate,
    safeLatestDate,
  });

  const [latestDates, latestCrawl, propertyRefreshState, metricsRefreshState] = await Promise.all([
    fetchLatestDateForSource({ property }),
    getLatestPropertyCrawl({ teamId: input.teamId, propertyId: property.id }),
    getLatestPropertyRefreshStateForWindow({
      teamId: input.teamId,
      propertyId: property.id,
      payload: {
        preset: window.preset,
        compareMode: window.compareMode,
        startDate: window.startDate,
        endDate: window.requestedEndDate,
      },
    }),
    getLatestMetricsBackfillState({
      teamId: input.teamId,
      propertyId: property.id,
    }),
  ]);
  const refreshState = chooseVisibleRefreshState(propertyRefreshState, metricsRefreshState);

  const freshnessSummary = buildFreshnessSources({
    gscLatestDate: latestDates.gscLatestDate,
    ga4LatestDate: latestDates.ga4LatestDate,
    hasGa4Property: Boolean(property.ga4PropertyId),
    safeLatestDate,
    requestedEndDate: window.requestedEndDate,
    crawlCapturedAt: latestCrawl?.createdAt ?? null,
    crawl: latestCrawl?.crawl ?? null,
  });
  const gscFreshness = freshnessSummary.sources.find((source) => source.source === "gsc")!;
  const crawlFreshness = freshnessSummary.sources.find((source) => source.source === "crawl")!;
  const freshnessSources = freshnessSummary.sources;
  const dashboardFreshnessState = freshnessSummary.state;

  const recentChanges = await fetchRecentChanges(property.id, window.startDate, window.endDate);
  const sourceVersionHash = buildSourceVersionHash({
    gscLastFactAt: latestDates.gscLastFactAt,
    ga4LastFactAt: latestDates.ga4LastFactAt,
    crawlCapturedAt: latestCrawl?.createdAt ?? null,
    crawlFingerprint: latestCrawl?.fingerprint ?? null,
    changeLastUpdatedAt: recentChanges[0]?.lastChangedAt ?? null,
  });

  let payload = await readCache({
    property,
    window,
    sourceVersionHash,
  });

  if (!payload) {
    const windowData = await fetchWindowData({
      property,
      startDate: window.startDate,
      endDate: window.endDate,
      compareStartDate: window.compareStartDate,
      compareEndDate: window.compareEndDate,
    });

    const gscCurrent = {
      ...aggregateGscSummary(windowData.currentFacts),
      topQueries: aggregateQueryPayloads(windowData.currentRaw),
      topPages: aggregatePagePayloads(windowData.currentRaw),
      topCountries: [],
      topDevices: [],
    };
    const gscCompare = {
      ...aggregateGscSummary(windowData.compareFacts),
      topQueries: aggregateQueryPayloads(windowData.compareRaw),
      topPages: aggregatePagePayloads(windowData.compareRaw),
      topCountries: [],
      topDevices: [],
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
        removedPages: [],
      },
      currentSeries: buildTrendSeries({
        facts: windowData.currentFacts,
        ga4Facts: windowData.currentGa4,
        startDate: window.startDate,
        endDate: window.endDate,
      }),
      compareSeries: window.compareStartDate && window.compareEndDate
        ? buildTrendSeries({
            facts: windowData.compareFacts,
            ga4Facts: windowData.compareGa4,
            startDate: window.compareStartDate,
            endDate: window.compareEndDate,
            labelStartDate: window.startDate,
          })
        : [],
      compareRangeEnd: window.compareEndDate ?? window.endDate,
    });

    const actions = insights.weeklyActionRows
      .slice(0, 6)
      .map((action) => ({
        ...action,
        ...buildActionIdentity(action),
      }));

    const operatingContext = summarizeOperatingContext({
      clicksCurrent: gscCurrent.clicks,
      clicksCompare: gscCompare.clicks,
      actions,
      crawlFreshness,
    });
    const degradedStates = buildDegradedStates({
      actions,
      crawlFreshness,
      dashboardFreshnessState,
      refreshState,
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
        users: row.usersCurrent,
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
          users: property.ga4PropertyId ? ga4CompareTotals.users : null,
        },
      },
      evidence: {
        queryOpportunities: insights.queryOpportunityRows.slice(0, 8),
        pageWinnersLosers: insights.pageWinnerLoserRows.slice(0, 8),
        nearWins: insights.nearWinKeywordRows.slice(0, 8),
        ctrGaps: insights.lostClickEstimateRows.slice(0, 8),
        contentDecay: insights.contentDecayRows.slice(0, 8),
        recentChanges,
      },
      operatingContext,
      degradedStates,
      actions,
    };

    await writeCache({
      property,
      window,
      sourceVersionHash,
      freshnessState: dashboardFreshnessState,
      freshnessSummary: {
        state: dashboardFreshnessState,
        safeLatestDate,
        sources: freshnessSources,
      },
      payload,
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
      crawlFreshness,
    });
  }
  if (!payload.degradedStates) {
    payload.degradedStates = buildDegradedStates({
      actions: payload.actions,
      crawlFreshness,
      dashboardFreshnessState,
      refreshState,
    });
  }

  const aiActions = await getLatestCompleteAiActions({
    teamId: property.teamId,
    propertyId: property.id,
    startDate: window.startDate,
    endDate: window.endDate,
    compareMode: window.compareMode,
    compareStartDate: window.compareStartDate,
    compareEndDate: window.compareEndDate,
  });
  if (aiActions.length) {
    const deterministicActions = payload.actions
      .filter((action) => action.source !== "ai")
      .map((action) => ({ ...action, source: action.source ?? "rules" as const }));
    const mergedActions = [...deterministicActions.slice(0, 4), ...aiActions]
      .slice(0, 8)
      .map((action, index) => ({ ...action, rank: index + 1 }));
    payload = {
      ...payload,
      actions: mergedActions,
    };
  } else {
    payload = {
      ...payload,
      actions: payload.actions.map((action) => ({ ...action, source: action.source ?? "rules" as const })),
    };
  }

  if (payload.actions.length) {
    await syncActionsToStore({
      teamId: property.teamId,
      propertyId: property.id,
      actions: payload.actions,
    });
  }

  const existingActions = await db.query.actionItems.findMany({
    where: (table, { and: andFn, eq: eqFn }) =>
      andFn(eqFn(table.teamId, property.teamId), eqFn(table.propertyId, property.id)),
  });
  const actionStateByFingerprint = new Map(existingActions.map((row) => [
    row.fingerprint,
    {
      state: row.state as RecommendationState,
      systemRank: row.systemRank ?? null,
      systemScore: row.systemScore ?? null,
      priorityOverride: (row.priorityOverride as PriorityOverride | null) ?? "none",
      assigneeUserId: row.assigneeUserId ?? null,
      assigneeEmail: row.assigneeEmail ?? null,
      snoozedUntil: normalizeDateString(row.snoozedUntil),
    },
  ] as const));

  const hydratedActions = withActionState({
    actions: payload.actions,
    actionStateByFingerprint,
    gscFreshness,
    crawlFreshness,
  });
  const topAction = hydratedActions[0] ?? null;

  return {
    property: {
      id: property.id,
      name: property.name,
      url: property.url,
      ga4PropertyId: property.ga4PropertyId,
    },
    analysisWindow: window,
    payloadVersion: payload.payloadVersion ?? sourceVersionHash,
    propertyUpdateState: refreshState,
    freshness: {
      state: dashboardFreshnessState,
      safeLatestDate,
      sources: freshnessSources,
    },
    operatingContext: payload.operatingContext,
    overview: payload.overview,
    trend: payload.trend,
    evidence: payload.evidence,
    degradedStates: payload.degradedStates,
    topAction,
    actions: hydratedActions,
    recentSnapshots: await fetchLatestSnapshots(property.teamId, property.id),
  };
}

export async function upsertActionItemState(params: {
  teamId: string;
  propertyId: string;
  fingerprint: string;
  actionFamily: string;
  causeFamily: string;
  remedyKey: string;
  targetType: string;
  targetKey: string;
  title: string;
  owner?: string | null;
  state?: RecommendationState;
  priorityOverride?: PriorityOverride;
  overrideReason?: string | null;
  overrideUpdatedByUserId?: string | null;
  assigneeUserId?: string | null;
  assigneeEmail?: string | null;
  snoozedUntil?: string | null;
}) {
  const existing = await db.query.actionItems.findFirst({
    where: (table, { and: andFn, eq: eqFn }) =>
      andFn(eqFn(table.propertyId, params.propertyId), eqFn(table.fingerprint, params.fingerprint)),
  });
  const [row] = await db
    .insert(actionItems)
    .values({
      id: existing?.id ?? `ai_${nanoid(12)}`,
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
      assigneeUserId: params.assigneeUserId ?? existing?.assigneeUserId ?? null,
      assigneeEmail: params.assigneeEmail ?? existing?.assigneeEmail ?? null,
      state: params.state ?? (existing?.state as RecommendationState | undefined) ?? "open",
      systemRank: existing?.systemRank ?? null,
      systemScore: existing?.systemScore ?? null,
      priorityOverride: params.priorityOverride ?? (existing?.priorityOverride as PriorityOverride | undefined) ?? "none",
      overrideReason: params.overrideReason ?? existing?.overrideReason ?? null,
      overrideUpdatedByUserId: params.priorityOverride ? (params.overrideUpdatedByUserId ?? null) : existing?.overrideUpdatedByUserId ?? null,
      overrideUpdatedAt: params.priorityOverride ? new Date() : existing?.overrideUpdatedAt ?? null,
      snoozedUntil: params.snoozedUntil === undefined ? normalizeDateString(existing?.snoozedUntil) : normalizeDateString(params.snoozedUntil),
      lastEvaluatedAt: new Date(),
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: [actionItems.propertyId, actionItems.fingerprint],
      set: {
        actionFamily: params.actionFamily,
        causeFamily: params.causeFamily,
        remedyKey: params.remedyKey,
        targetType: params.targetType,
        targetKey: params.targetKey,
        title: params.title,
        owner: params.owner ?? null,
        assigneeUserId: params.assigneeUserId ?? existing?.assigneeUserId ?? null,
        assigneeEmail: params.assigneeEmail ?? existing?.assigneeEmail ?? null,
        state: params.state ?? (existing?.state as RecommendationState | undefined) ?? "open",
        priorityOverride: params.priorityOverride ?? (existing?.priorityOverride as PriorityOverride | undefined) ?? "none",
        overrideReason: params.priorityOverride ? (params.overrideReason ?? null) : existing?.overrideReason ?? null,
        overrideUpdatedByUserId: params.priorityOverride ? (params.overrideUpdatedByUserId ?? null) : existing?.overrideUpdatedByUserId ?? null,
        overrideUpdatedAt: params.priorityOverride ? new Date() : existing?.overrideUpdatedAt ?? null,
        snoozedUntil: params.snoozedUntil === undefined ? normalizeDateString(existing?.snoozedUntil) : normalizeDateString(params.snoozedUntil),
        lastEvaluatedAt: new Date(),
        updatedAt: new Date(),
      },
    })
    .returning({
      id: actionItems.id,
      fingerprint: actionItems.fingerprint,
      state: actionItems.state,
      priorityOverride: actionItems.priorityOverride,
      assigneeUserId: actionItems.assigneeUserId,
      assigneeEmail: actionItems.assigneeEmail,
      snoozedUntil: actionItems.snoozedUntil,
    });

  return row;
}

export async function getLatestDashboardPayloadVersion(params: {
  teamId: string;
  propertyId: string;
}) {
  const row = await db.query.analysisWindowCache.findFirst({
    where: and(
      eq(analysisWindowCache.teamId, params.teamId),
      eq(analysisWindowCache.propertyId, params.propertyId),
    ),
    orderBy: (table, { desc: descOrder }) => [descOrder(table.updatedAt)],
  });

  return row?.sourceVersionHash ?? null;
}

export async function getWorkspaceActionBoard(teamId: string) {
  const [rows, refreshRows] = await Promise.all([
    db.query.actionItems.findMany({
      where: (table, { eq: eqFn }) => eqFn(table.teamId, teamId),
      orderBy: (table, { asc: ascOrder, desc: descOrder }) => [
        ascOrder(table.systemRank),
        descOrder(table.updatedAt),
      ],
      limit: 30,
    }),
    db.query.properties.findMany({
      where: (table, { and: andFn, eq: eqFn }) => andFn(eqFn(table.teamId, teamId), eqFn(table.type, "gsc"), eqFn(table.active, true)),
      columns: {
        id: true,
        name: true,
        url: true,
      },
    }),
  ]);

  const refreshStateByProperty = new Map<string, PropertyRefreshState | null>();
  const crawlStateByProperty = new Map<string, { missing: boolean; stale: boolean }>();
  await Promise.all(refreshRows.map(async (property) => {
    const [propertyRefreshState, metricsRefreshState, crawl] = await Promise.all([
      getLatestPropertyRefreshState(teamId, property.id),
      getLatestMetricsBackfillState({ teamId, propertyId: property.id }),
      getLatestPropertyCrawl({ teamId, propertyId: property.id }),
    ]);
    const state = chooseVisibleRefreshState(propertyRefreshState, metricsRefreshState);
    refreshStateByProperty.set(property.id, state);
    const crawlFreshness = summarizeCrawlFreshness({
      crawlCapturedAt: crawl?.createdAt ?? null,
      crawl: crawl?.crawl ?? null,
    });
    crawlStateByProperty.set(property.id, {
      missing: crawlFreshness.state === "unavailable",
      stale: crawlFreshness.state === "stale",
    });
  }));
  const propertyById = new Map(refreshRows.map((row) => [row.id, row] as const));
  const visibleRows = rows.filter((row) => propertyById.has(row.propertyId));

  const actions = visibleRows.map((row) => ({
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
    state: row.state as RecommendationState,
    systemRank: row.systemRank ?? null,
    systemScore: row.systemScore ?? null,
    priorityOverride: (row.priorityOverride as PriorityOverride | null) ?? "none",
    updatedAt: row.updatedAt.toISOString(),
      refreshState: refreshStateByProperty.get(row.propertyId) ?? null,
      crawlState: crawlStateByProperty.get(row.propertyId) ?? { missing: false, stale: false },
    }));

  return {
    counts: {
      open: visibleRows.filter((row) => row.state === "open").length,
      inProgress: visibleRows.filter((row) => row.state === "in_progress").length,
      snoozed: visibleRows.filter((row) => row.state === "snoozed").length,
      blocked: visibleRows.filter((row) => row.priorityOverride === "pin" || row.systemRank === 1).length,
      refreshing: [...refreshStateByProperty.values()].filter((row) => row?.status === "queued" || row?.status === "processing").length,
    },
    actions,
    propertiesNeedingAttention: refreshRows
      .map((property) => ({
        propertyId: property.id,
        propertyName: property.name,
        propertyUrl: property.url,
        refreshState: refreshStateByProperty.get(property.id) ?? null,
        crawlState: crawlStateByProperty.get(property.id) ?? { missing: false, stale: false },
      }))
      .filter((row) =>
        row.refreshState?.status === "failed" ||
        row.refreshState?.status === "queued" ||
        row.refreshState?.status === "processing" ||
        row.crawlState.missing ||
        row.crawlState.stale,
      ),
  };
}

export async function createSnapshotExport(params: {
  teamId: string;
  createdByUserId: string;
  propertyId: string;
  preset?: string | null;
  compareMode?: string | null;
  startDate?: string | null;
  endDate?: string | null;
}) {
  const dashboard = await getLiveDashboardData({
    teamId: params.teamId,
    propertyId: params.propertyId,
    preset: params.preset,
    compareMode: params.compareMode,
    startDate: params.startDate,
    endDate: params.endDate,
  });
  const brandingSnapshot = await getTeamBrandingProfile(params.teamId);

  const [row] = await db
    .insert(snapshotExports)
    .values({
      id: `se_${nanoid(12)}`,
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
      dashboardPayload: dashboard,
    })
    .returning({
      id: snapshotExports.id,
      createdAt: snapshotExports.createdAt,
      freshnessState: snapshotExports.freshnessState,
      startDate: snapshotExports.startDate,
      endDate: snapshotExports.endDate,
      compareMode: snapshotExports.compareMode,
    });

  return {
    id: row.id,
    createdAt: row.createdAt.toISOString(),
    freshnessState: row.freshnessState as FreshnessState,
    startDate: normalizeDateString(row.startDate) ?? "",
    endDate: normalizeDateString(row.endDate) ?? "",
    compareMode: row.compareMode as CompareMode,
  };
}

export async function getSnapshotExportDetail(params: {
  teamId: string;
  propertyId: string;
  snapshotId: string;
}): Promise<LiveDashboardSnapshotDetail | null> {
  const row = await db.query.snapshotExports.findFirst({
    where: (table, { and: andFn, eq: eqFn }) =>
      andFn(
        eqFn(table.id, params.snapshotId),
        eqFn(table.teamId, params.teamId),
        eqFn(table.propertyId, params.propertyId),
      ),
  });

  if (!row) {
    return null;
  }

  const payload = (row.dashboardPayload ?? null) as LiveDashboardData | CachedDashboardPayload | null;
  const overview =
    payload && typeof payload === "object" && "overview" in payload
      ? (payload.overview as LiveDashboardData["overview"])
      : null;
  const payloadActions =
    payload && typeof payload === "object" && "actions" in payload && Array.isArray(payload.actions)
      ? payload.actions
      : [];

  return {
    id: row.id,
    createdAt: row.createdAt.toISOString(),
    freshnessState: row.freshnessState as FreshnessState,
    startDate: normalizeDateString(row.startDate) ?? "",
    endDate: normalizeDateString(row.endDate) ?? "",
    requestedEndDate: normalizeDateString(row.requestedEndDate) ?? "",
    compareMode: row.compareMode as CompareMode,
    compareStartDate: normalizeDateString(row.compareStartDate),
    compareEndDate: normalizeDateString(row.compareEndDate),
    freshnessSummary: (row.freshnessSummary as LiveDashboardData["freshness"] | null) ?? null,
    overview,
    actionCount: payloadActions.length,
  };
}

export type PropertyShareLinkDetail = {
  id: string;
  token: string;
  shareId: string;
  propertyId: string;
  teamId: string;
  createdAt: string;
  expiresAt: string | null;
  brandSnapshot: Awaited<ReturnType<typeof getTeamBrandingProfile>>;
  payloadSnapshot: LiveDashboardData;
};

export type ClientReportMovement = {
  label: string;
  current: number;
  previous: number;
  delta: number;
};

export type ClientReportCompletedWork = {
  title: string;
  firstVisibleWin: string;
  target: string;
};

export type ClientReportComparison = {
  previousCreatedAt: string | null;
  previousWindow: {
    startDate: string;
    endDate: string;
  } | null;
  metricDeltas: {
    clicks: number | null;
    impressions: number | null;
    ctr: number | null;
    position: number | null;
    sessions: number | null;
    users: number | null;
  };
  pageMovements: ClientReportMovement[];
  queryMovements: ClientReportMovement[];
  completedWork: ClientReportCompletedWork[];
  changedPages: Array<{ url: string; lastChangedAt: string | null }>;
};

export type PropertyShareReportDetail = PropertyShareLinkDetail & {
  previousShare: Pick<PropertyShareLinkDetail, "id" | "shareId" | "createdAt" | "payloadSnapshot"> | null;
  clientReportComparison: ClientReportComparison;
};

export type PropertyShareCandidate = {
  id: string;
  token: string;
  teamId: string;
  propertyId: string;
  createdAt: Date;
  expiresAt: Date | null;
  revokedAt: Date | null;
  brandSnapshot: unknown;
  payloadSnapshot: unknown;
};

function mapPropertyShareRow(row: PropertyShareCandidate): PropertyShareLinkDetail {
  return {
    id: row.id,
    shareId: row.id,
    token: row.token,
    propertyId: row.propertyId,
    teamId: row.teamId,
    createdAt: row.createdAt.toISOString(),
    expiresAt: row.expiresAt?.toISOString() ?? null,
    brandSnapshot: row.brandSnapshot as Awaited<ReturnType<typeof getTeamBrandingProfile>>,
    payloadSnapshot: row.payloadSnapshot as LiveDashboardData,
  };
}

function metricDelta(current: number | null | undefined, previous: number | null | undefined) {
  if (current == null || previous == null) return null;
  return current - previous;
}

function topMovements<T extends { [key: string]: unknown }>(params: {
  currentRows: T[];
  previousRows: T[];
  key: keyof T;
  value: keyof T;
  limit?: number;
}): ClientReportMovement[] {
  const previousByKey = new Map<string, number>();
  for (const row of params.previousRows) {
    const label = String(row[params.key] ?? "");
    const value = Number(row[params.value] ?? 0);
    if (label) previousByKey.set(label, value);
  }

  return params.currentRows
    .map((row) => {
      const label = String(row[params.key] ?? "");
      const current = Number(row[params.value] ?? 0);
      const previous = previousByKey.get(label) ?? 0;
      return { label, current, previous, delta: current - previous };
    })
    .filter((row) => row.label && row.delta !== 0)
    .sort((left, right) => Math.abs(right.delta) - Math.abs(left.delta))
    .slice(0, params.limit ?? 5);
}

export function selectPreviousPropertyShare(
  rows: PropertyShareCandidate[],
  now: Date = new Date(),
): PropertyShareLinkDetail | null {
  const row = rows
    .filter((candidate) => !candidate.revokedAt && (!candidate.expiresAt || candidate.expiresAt > now))
    .sort((left, right) => right.createdAt.getTime() - left.createdAt.getTime())[0];

  return row ? mapPropertyShareRow(row) : null;
}

export function buildClientReportComparison(params: {
  current: LiveDashboardData;
  previous?: LiveDashboardData | null;
  previousCreatedAt?: string | null;
}): ClientReportComparison {
  const current = params.current;
  const previous = params.previous ?? null;
  const completedWork = current.actions
    .filter((action) => action.state === "done")
    .slice(0, 6)
    .map((action) => ({
      title: action.title,
      firstVisibleWin: action.firstVisibleWin,
      target: action.targetPage ?? action.targetKey ?? action.targetType,
    }));

  return {
    previousCreatedAt: previous ? params.previousCreatedAt ?? null : null,
    previousWindow: previous
      ? {
          startDate: previous.analysisWindow.startDate,
          endDate: previous.analysisWindow.endDate,
        }
      : null,
    metricDeltas: {
      clicks: previous ? metricDelta(current.overview.clicks, previous.overview.clicks) : null,
      impressions: previous ? metricDelta(current.overview.impressions, previous.overview.impressions) : null,
      ctr: previous ? metricDelta(current.overview.ctr, previous.overview.ctr) : null,
      position: previous ? metricDelta(current.overview.position, previous.overview.position) : null,
      sessions: previous ? metricDelta(current.overview.sessions, previous.overview.sessions) : null,
      users: previous ? metricDelta(current.overview.users, previous.overview.users) : null,
    },
    pageMovements: previous
      ? topMovements({
          currentRows: current.evidence.pageWinnersLosers,
          previousRows: previous.evidence.pageWinnersLosers,
          key: "page",
          value: "clicksCurrent",
        })
      : [],
    queryMovements: previous
      ? topMovements({
          currentRows: current.evidence.queryOpportunities,
          previousRows: previous.evidence.queryOpportunities,
          key: "query",
          value: "clicks",
        })
      : [],
    completedWork,
    changedPages: current.evidence.recentChanges.slice(0, 6),
  };
}

export async function createPropertyShareLink(params: {
  teamId: string;
  createdByUserId: string;
  propertyId: string;
  preset?: string | null;
  compareMode?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  expiresAt?: Date | null;
}) {
  const dashboard = await getLiveDashboardData({
    teamId: params.teamId,
    propertyId: params.propertyId,
    preset: params.preset,
    compareMode: params.compareMode,
    startDate: params.startDate,
    endDate: params.endDate,
  });
  const brandSnapshot = await getTeamBrandingProfile(params.teamId);
  const token = `ps_${nanoid(32)}`;

  const [row] = await db
    .insert(propertyShareLinks)
    .values({
      id: `psl_${nanoid(12)}`,
      teamId: params.teamId,
      propertyId: dashboard.property.id,
      token,
      createdByUserId: params.createdByUserId,
      expiresAt: params.expiresAt ?? null,
      windowPreset: dashboard.analysisWindow.preset,
      compareMode: dashboard.analysisWindow.compareMode,
      startDate: dashboard.analysisWindow.startDate,
      endDate: dashboard.analysisWindow.requestedEndDate,
      brandSnapshot,
      payloadSnapshot: dashboard,
    })
    .returning({
      id: propertyShareLinks.id,
      token: propertyShareLinks.token,
      expiresAt: propertyShareLinks.expiresAt,
    });

  return {
    shareId: row.id,
    token: row.token,
    expiresAt: row.expiresAt?.toISOString() ?? null,
  };
}

export async function getPropertyShareByToken(token: string): Promise<PropertyShareLinkDetail | null> {
  const row = await db.query.propertyShareLinks.findFirst({
    where: (table, { eq: eqFn }) => eqFn(table.token, token),
  });

  if (!row || row.revokedAt || (row.expiresAt && row.expiresAt <= new Date())) {
    return null;
  }

  return mapPropertyShareRow(row);
}

export async function getPropertyShareReportByToken(token: string): Promise<PropertyShareReportDetail | null> {
  const currentShare = await getPropertyShareByToken(token);
  if (!currentShare) return null;

  const currentCreatedAt = new Date(currentShare.createdAt);
  const previousRows = await db.query.propertyShareLinks.findMany({
    where: (table, { and: andFn, eq: eqFn }) =>
      andFn(
        eqFn(table.teamId, currentShare.teamId),
        eqFn(table.propertyId, currentShare.propertyId),
        lt(table.createdAt, currentCreatedAt),
      ),
    orderBy: (table, { desc: descOrder }) => [descOrder(table.createdAt)],
    limit: 10,
  });
  const previousShare = selectPreviousPropertyShare(previousRows);

  return {
    ...currentShare,
    previousShare: previousShare
      ? {
          id: previousShare.id,
          shareId: previousShare.shareId,
          createdAt: previousShare.createdAt,
          payloadSnapshot: previousShare.payloadSnapshot,
        }
      : null,
    clientReportComparison: buildClientReportComparison({
      current: currentShare.payloadSnapshot,
      previous: previousShare?.payloadSnapshot ?? null,
      previousCreatedAt: previousShare?.createdAt ?? null,
    }),
  };
}

export function buildPropertyShareDownloadPayload(params: {
  dashboard: LiveDashboardData;
  brandSnapshot: Awaited<ReturnType<typeof getTeamBrandingProfile>>;
  createdAt?: string;
}) {
  return {
    metadata: {
      exportType: "dashboard_snapshot_json",
      createdAt: params.createdAt ?? new Date().toISOString(),
      propertyId: params.dashboard.property.id,
      propertyName: params.dashboard.property.name,
      startDate: params.dashboard.analysisWindow.startDate,
      endDate: params.dashboard.analysisWindow.requestedEndDate,
      compareMode: params.dashboard.analysisWindow.compareMode,
      payloadVersion: params.dashboard.payloadVersion,
    },
    brand: params.brandSnapshot,
    dashboard: params.dashboard,
  };
}
