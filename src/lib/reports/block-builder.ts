import type { DashboardBlock, TableBlock } from "./dashboard-blocks";
import type { DeterministicInsights } from "./deterministic-insights";
import type { KpiTrendRow } from "./types";
import { buildContentGapRows } from "./deterministic/content-gaps";
import { buildPositionBuckets, buildSegmentSummaryRows } from "./deterministic/position-buckets";
import { buildQueryDrilldowns, buildPageDrilldowns, type DrilldownBuilderInput } from "./drilldown-builder";
import type { PageIssue } from "@/lib/crawl";

const PAYLOAD_SIZE_CAP_BYTES = 1.5 * 1024 * 1024; // 1.5 MB

type BlockBuilderInput = {
  insights: DeterministicInsights;
  queryPagePairs?: Array<{ query: string; page: string; clicks: number; impressions: number; ctr: number; position: number }>;
  ga4LandingPages?: Array<{ join_key: string; sessions: number; engagementRate?: number; bounceRate?: number; engagedSessions?: number }>;
  crawlPages?: PageIssue[];
  gscCurrentDevices?: Array<{ device: string; clicks: number; impressions: number; ctr: number; position: number }>;
  gscCompareDevices?: Array<{ device: string; clicks: number; impressions: number; ctr: number; position: number }>;
  gscCurrentCountries?: Array<{ country: string; clicks: number; impressions: number; ctr: number; position: number }>;
  gscCompareCountries?: Array<{ country: string; clicks: number; impressions: number; ctr: number; position: number }>;
  gscCurrentQueries?: Array<{ query: string; clicks: number; impressions: number; ctr: number; position: number }>;
  gscCompareQueries?: Array<{ query: string; clicks: number; impressions: number; ctr: number; position: number }>;
  domainName?: string;
};

/** Strips `details` from blocks[startIdx..] to reduce payload size. */
function stripDetailsFrom(blocks: DashboardBlock[], startIdx: number): void {
  for (let i = startIdx; i < blocks.length; i++) {
    const b = blocks[i];
    if (b.type === "table" && "details" in b) {
      delete (b as Record<string, unknown>)["details"];
    }
  }
}

/**
 * Applies the payload cap guard: if serialized blocks exceed PAYLOAD_SIZE_CAP_BYTES,
 * strip details from lower-priority blocks. If still too large, strip all details.
 * Returns a note about what was stripped (empty string if nothing was stripped).
 */
export function applyPayloadCapGuard(blocks: DashboardBlock[]): string {
  const sizeBytes = Buffer.byteLength(JSON.stringify(blocks), "utf8");
  if (sizeBytes <= PAYLOAD_SIZE_CAP_BYTES) return "";

  // First pass: strip details from block index 3 onward
  stripDetailsFrom(blocks, 3);
  const sizeAfterFirstStrip = Buffer.byteLength(JSON.stringify(blocks), "utf8");
  if (sizeAfterFirstStrip <= PAYLOAD_SIZE_CAP_BYTES) {
    return `Drilldown details stripped from blocks[3+] (original size: ${Math.round(sizeBytes / 1024)}KB)`;
  }

  // Second pass: strip all details
  stripDetailsFrom(blocks, 0);
  return `All drilldown details stripped — payload exceeded ${PAYLOAD_SIZE_CAP_BYTES / 1024}KB cap (original size: ${Math.round(sizeBytes / 1024)}KB)`;
}

function buildTimeSeriesBlocks(kpiTrendRows: KpiTrendRow[]): DashboardBlock[] {
  const clicksCurrent = kpiTrendRows.map((r) => ({ date: r.date, value: r.clicksCurrent }));
  const clicksCompare = kpiTrendRows.map((r) => ({ date: r.date, value: r.clicksCompare }));
  const sessionsCurrent = kpiTrendRows.filter((r) => r.sessionsCurrent != null).map((r) => ({ date: r.date, value: r.sessionsCurrent! }));
  const sessionsCompare = kpiTrendRows.filter((r) => r.sessionsCompare != null).map((r) => ({ date: r.date, value: r.sessionsCompare! }));

  const blocks: DashboardBlock[] = [
    {
      type: "time_series",
      metric: "clicks",
      label: "Organic Clicks",
      currentSeries: clicksCurrent,
      compareSeries: clicksCompare,
    },
  ];

  if (sessionsCurrent.length > 0) {
    blocks.push({
      type: "time_series",
      metric: "sessions",
      label: "GA4 Sessions",
      currentSeries: sessionsCurrent,
      compareSeries: sessionsCompare,
    });
  }

  return blocks;
}

export function buildDashboardBlocks(input: BlockBuilderInput): DashboardBlock[] {
  const { insights } = input;
  const blocks: DashboardBlock[] = [];

  // Shared drilldown builder input
  const drilldownInput: DrilldownBuilderInput = {
    queryPagePairs: input.queryPagePairs ?? [],
    pageWinnerLoserRows: insights.pageWinnerLoserRows,
    ga4LandingPages: input.ga4LandingPages ?? [],
    crawlPages: input.crawlPages,
    gscCurrentDevices: (input.gscCurrentDevices ?? []).map((d) => ({
      device: d.device,
      clicks: d.clicks,
      impressions: d.impressions,
    })),
    gscCurrentCountries: (input.gscCurrentCountries ?? []).map((c) => ({
      country: c.country,
      clicks: c.clicks,
      impressions: c.impressions,
    })),
    domainName: input.domainName,
  };

  // 1. KPI Cards
  blocks.push({
    type: "kpi_cards",
    rows: insights.kpiComparisonRows,
  });

  // 2. Time Series blocks
  blocks.push(...buildTimeSeriesBlocks(insights.kpiTrendRows));

  // 3. Query Opportunities table (with query drilldowns)
  if (insights.queryOpportunityRows.length > 0) {
    const queryKeys = insights.queryOpportunityRows.map((r) => r.query);
    const details = input.queryPagePairs && input.queryPagePairs.length > 0
      ? buildQueryDrilldowns(queryKeys, drilldownInput)
      : undefined;
    const tableBlock: TableBlock = {
      type: "table",
      id: "query_opportunities",
      columns: ["query", "position", "impressions", "clicks", "ctr", "expectedCtr", "lostClicksEstimate", "opportunityScore", "recommendedAction"],
      rows: insights.queryOpportunityRows.map((r) => ({ ...r })),
      ...(details && Object.keys(details).length > 0 ? { details } : {}),
    };
    blocks.push(tableBlock);
  }

  // 4. Near Win Keywords table (with query drilldowns)
  if (insights.nearWinKeywordRows.length > 0) {
    const nearWinKeys = insights.nearWinKeywordRows.map((r) => r.keyword);
    const details = input.queryPagePairs && input.queryPagePairs.length > 0
      ? buildQueryDrilldowns(nearWinKeys, drilldownInput)
      : undefined;
    const tableBlock: TableBlock = {
      type: "table",
      id: "near_win_keywords",
      columns: ["keyword", "position", "impressions", "clicks", "ctr", "targetLandingPage", "action"],
      rows: insights.nearWinKeywordRows.map((r) => ({ ...r })),
      ...(details && Object.keys(details).length > 0 ? { details } : {}),
    };
    blocks.push(tableBlock);
  }

  // 5. Page Winners/Losers table (with page drilldowns)
  if (insights.pageWinnerLoserRows.length > 0) {
    const pageKeys = insights.pageWinnerLoserRows.map((r) => r.page);
    const details = input.queryPagePairs && input.queryPagePairs.length > 0
      ? buildPageDrilldowns(pageKeys, drilldownInput)
      : undefined;
    const tableBlock: TableBlock = {
      type: "table",
      id: "page_winners_losers",
      columns: ["page", "status", "clicksCurrent", "clicksCompare", "clicksDelta", "impressionsCurrent", "impressionsCompare", "impressionsDelta"],
      rows: insights.pageWinnerLoserRows.map((r) => ({ ...r })),
      ...(details && Object.keys(details).length > 0 ? { details } : {}),
    };
    blocks.push(tableBlock);
  }

  // 6. Position Buckets table (Phase 3d)
  if (input.gscCurrentQueries && input.gscCompareQueries) {
    const positionBuckets = buildPositionBuckets(input.gscCurrentQueries, input.gscCompareQueries);
    if (positionBuckets.length > 0) {
      blocks.push({
        type: "table",
        id: "position_buckets",
        columns: ["bucket", "impressionsCurrent", "impressionsCompare", "clicksCurrent", "clicksCompare", "ctrCurrent", "ctrCompare", "impressionsDelta", "clicksDelta"],
        rows: positionBuckets.map((r) => ({ ...r })),
      });
    }
  }

  // 7. Segment Summary (device + country)
  if (input.gscCurrentDevices && input.gscCurrentCountries) {
    const segmentRows = buildSegmentSummaryRows({
      currentDevices: input.gscCurrentDevices,
      compareDevices: input.gscCompareDevices ?? [],
      currentCountries: input.gscCurrentCountries,
      compareCountries: input.gscCompareCountries ?? [],
    });
    if (segmentRows.length > 0) {
      blocks.push({
        type: "table",
        id: "segment_summary",
        columns: ["segmentType", "segmentValue", "impressionsCurrent", "clicksCurrent", "ctrCurrent", "impressionsDelta", "clicksDelta"],
        rows: segmentRows.map((r) => ({ ...r })),
      });
    }
  }

  // 8. Content Gaps block (Phase 3c)
  const { rows: contentGapRows, warnings: gapWarnings } = buildContentGapRows({
    queryPagePairs: input.queryPagePairs ?? [],
    ga4LandingPages: input.ga4LandingPages ?? [],
    domainName: input.domainName,
  });
  if (contentGapRows.length > 0 || gapWarnings.length > 0) {
    blocks.push({
      type: "content_gaps",
      rows: contentGapRows,
      warnings: gapWarnings.length > 0 ? gapWarnings : undefined,
    });
  }

  // 9. Cannibalization table
  if (insights.cannibalizationRows.length > 0) {
    blocks.push({
      type: "table",
      id: "cannibalization",
      columns: ["query", "pages", "totalClicks", "totalImpressions", "recommendation"],
      rows: insights.cannibalizationRows.map((r) => ({ ...r })),
    });
  }

  // 10. Technical Issues block
  if (insights.technicalIssueRows.length > 0) {
    blocks.push({
      type: "technical_issues",
      rows: insights.technicalIssueRows,
    });
  }

  // 11. Action Backlog block
  if (insights.actionBacklogRows.length > 0) {
    blocks.push({
      type: "action_backlog",
      rows: insights.actionBacklogRows,
    });
  }

  return blocks;
}
