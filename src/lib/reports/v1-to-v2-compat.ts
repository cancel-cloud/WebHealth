import type { AiSeoReport } from "./types";
import type { DashboardBlock } from "./dashboard-blocks";

export function mapV1ReportToBlocks(report: AiSeoReport): DashboardBlock[] {
  const blocks: DashboardBlock[] = [];

  // KPI Cards
  if (report.kpiComparisonRows?.length) {
    blocks.push({ type: "kpi_cards", rows: report.kpiComparisonRows });
  }

  // Time series — clicks
  if (report.kpiTrendRows?.length) {
    blocks.push({
      type: "time_series",
      metric: "clicks",
      label: "Organic Clicks",
      currentSeries: report.kpiTrendRows.map((r) => ({ date: r.date, value: r.clicksCurrent })),
      compareSeries: report.kpiTrendRows.map((r) => ({ date: r.date, value: r.clicksCompare })),
    });
    const hasSessions = report.kpiTrendRows.some((r) => r.sessionsCurrent != null);
    if (hasSessions) {
      blocks.push({
        type: "time_series",
        metric: "sessions",
        label: "GA4 Sessions",
        currentSeries: report.kpiTrendRows.map((r) => ({ date: r.date, value: r.sessionsCurrent ?? 0 })),
        compareSeries: report.kpiTrendRows.map((r) => ({ date: r.date, value: r.sessionsCompare ?? 0 })),
      });
    }
  }

  // Query opportunities table
  if (report.queryOpportunityRows?.length) {
    blocks.push({
      type: "table",
      id: "query_opportunities",
      columns: ["query", "position", "impressions", "clicks", "ctr", "expectedCtr", "lostClicksEstimate", "opportunityScore", "recommendedAction"],
      rows: report.queryOpportunityRows.map((r) => ({ ...r })),
    });
  }

  // Near-win keywords table
  if (report.nearWinKeywordRows?.length) {
    blocks.push({
      type: "table",
      id: "near_win_keywords",
      columns: ["keyword", "position", "impressions", "clicks", "ctr", "targetLandingPage", "action"],
      rows: report.nearWinKeywordRows.map((r) => ({ ...r })),
    });
  }

  // Page winners/losers table
  if (report.pageWinnerLoserRows?.length) {
    blocks.push({
      type: "table",
      id: "page_winners_losers",
      columns: ["page", "status", "clicksCurrent", "clicksCompare", "clicksDelta", "impressionsCurrent", "impressionsCompare", "impressionsDelta"],
      rows: report.pageWinnerLoserRows.map((r) => ({ ...r })),
    });
  }

  // Cannibalization
  if (report.cannibalizationRows?.length) {
    blocks.push({
      type: "table",
      id: "cannibalization",
      columns: ["query", "pages", "totalClicks", "totalImpressions", "recommendation"],
      rows: report.cannibalizationRows.map((r) => ({ ...r })),
    });
  }

  // Technical issues
  if (report.technicalIssueRows?.length) {
    blocks.push({ type: "technical_issues", rows: report.technicalIssueRows });
  }

  // Action backlog
  if (report.actionBacklogRows?.length) {
    blocks.push({ type: "action_backlog", rows: report.actionBacklogRows });
  }

  return blocks;
}
