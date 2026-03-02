import ExcelJS from "exceljs";
import type {
  ActionBacklogRow,
  AiSeoReport,
  CannibalizationRow,
  NearWinKeywordRow,
  PageWinnerLoserRow,
  QueryOpportunityRow,
  TechnicalIssueRow,
} from "@webhealth/shared/lib/reports/types";

const MAX_ROWS = 1500;

function capRows<T>(rows: T[], limit = MAX_ROWS) {
  return rows.slice(0, limit);
}

function safeCell(value: unknown) {
  if (value == null) return "";
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  if (typeof value === "boolean") return value ? "true" : "false";
  const text = String(value);
  return text.length > 2000 ? `${text.slice(0, 1997)}...` : text;
}

function styleHeader(row: ExcelJS.Row) {
  row.font = { bold: true };
  row.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFEFEFEF" },
  };
  row.alignment = { vertical: "middle", horizontal: "left" };
}

function autoWidths(ws: ExcelJS.Worksheet, width = 24) {
  ws.columns?.forEach((col) => {
    col.width = Math.min(Math.max(col.width ?? width, 14), 54);
  });
}

function addTitle(ws: ExcelJS.Worksheet, title: string, subtitle?: string) {
  ws.addRow([title]);
  if (subtitle) ws.addRow([subtitle]);
  ws.addRow([]);
}

function assertRequiredReportFields(report: AiSeoReport) {
  if (!report.metadata?.reportTitle) throw new Error("XLSX build failed: missing metadata.reportTitle");
  if (!report.metadata?.periodLabel) throw new Error("XLSX build failed: missing metadata.periodLabel");
  if (!Array.isArray(report.kpiComparisonRows)) throw new Error("XLSX build failed: missing kpiComparisonRows");
}

function buildExecSheet(ws: ExcelJS.Worksheet, report: AiSeoReport) {
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
      safeCell(row.assessment),
    ]);
  }
  ws.addRow([]);
  ws.addRow(["Top Action Areas"]);
  for (const area of capRows(report.executiveSummary?.topActionAreas ?? [], 25)) {
    ws.addRow([safeCell(area)]);
  }
  autoWidths(ws, 26);
}

function buildKpiTrendSheet(ws: ExcelJS.Worksheet, report: AiSeoReport) {
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
    "Users(Compare)",
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
      safeCell(row.usersCompare),
    ]);
  }
  autoWidths(ws, 18);
}

function addQueryOpportunityRows(ws: ExcelJS.Worksheet, rows: QueryOpportunityRow[]) {
  const header = ws.addRow([
    "Query",
    "Clicks",
    "Impressions",
    "CTR",
    "Position",
    "Expected CTR",
    "Lost Clicks Est.",
    "Opportunity Score",
    "Recommended Action",
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
      safeCell(row.recommendedAction),
    ]);
  }
}

function addPageWinnerLoserRows(ws: ExcelJS.Worksheet, rows: PageWinnerLoserRow[]) {
  const header = ws.addRow([
    "Page",
    "Clicks(Current)",
    "Clicks(Compare)",
    "Clicks Delta",
    "Impressions(Current)",
    "Impressions(Compare)",
    "Impressions Delta",
    "Status",
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
      safeCell(row.status),
    ]);
  }
}

function addNearWinRows(ws: ExcelJS.Worksheet, rows: NearWinKeywordRow[]) {
  const header = ws.addRow([
    "Keyword",
    "Position",
    "Impressions",
    "Clicks",
    "CTR",
    "Target Landing Page",
    "Action",
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
      safeCell(row.action),
    ]);
  }
}

function addCannibalizationRows(ws: ExcelJS.Worksheet, rows: CannibalizationRow[]) {
  const header = ws.addRow([
    "Query",
    "Pages",
    "Total Clicks",
    "Total Impressions",
    "Recommendation",
  ]);
  styleHeader(header);

  for (const row of capRows(rows, 250)) {
    ws.addRow([
      safeCell(row.query),
      safeCell(row.pages.join(" | ")),
      safeCell(row.totalClicks),
      safeCell(row.totalImpressions),
      safeCell(row.recommendation),
    ]);
  }
}

function addTechnicalIssueRows(ws: ExcelJS.Worksheet, rows: TechnicalIssueRow[]) {
  const header = ws.addRow([
    "Issue Type",
    "Affected Pages",
    "Affected Estimated Clicks",
    "Severity",
    "Recommendation",
  ]);
  styleHeader(header);

  for (const row of capRows(rows, 250)) {
    ws.addRow([
      safeCell(row.issueType),
      safeCell(row.affectedPages),
      safeCell(row.affectedEstimatedClicks),
      safeCell(row.severity),
      safeCell(row.recommendation),
    ]);
  }
}

function addSiteChanges(ws: ExcelJS.Worksheet, report: AiSeoReport) {
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
      safeCell(row.machineDiffSummary),
    ]);
  }
  for (const row of capRows(report.siteChanges?.removedPages ?? [], 200)) {
    ws.addRow(["removed", safeCell(row.url), "", ""]);
  }
}

function addActionBacklogRows(ws: ExcelJS.Worksheet, rows: ActionBacklogRow[]) {
  const header = ws.addRow([
    "ID",
    "Area",
    "Task",
    "Owner Hint",
    "Effort",
    "Impact Score",
    "Why",
    "Done",
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
      row.done ? "yes" : "no",
    ]);
  }
}

function addRawRows(ws: ExcelJS.Worksheet, rows: Array<Record<string, unknown>>) {
  const items = capRows(rows, 2000);
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

export async function buildWorkbookBufferFromAiReport(report: AiSeoReport): Promise<Buffer> {
  assertRequiredReportFields(report);

  const wb = new ExcelJS.Workbook();
  wb.creator = "WebHealth";
  wb.created = new Date();

  const readme = wb.addWorksheet("00_Readme");
  addTitle(readme, report.metadata.reportTitle, report.metadata.periodLabel);
  readme.addRow([
    "This workbook is generated for analysts and developers. It includes deterministic opportunity scoring plus AI-prioritized actions.",
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
