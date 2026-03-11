import { auth } from "@webhealth/shared/lib/auth";
import { headers } from "next/headers";
import { redirect, notFound } from "next/navigation";
import { db } from "@webhealth/shared/db";
import Link from "next/link";
import { BarChart2, AlertTriangle, Link2 } from "lucide-react";
import { resolveReportSourcesForExistingReport } from "@webhealth/shared/lib/properties/reportable-properties-db";
import { Button } from "@/components/ui/button";
import type { AiSeoReport } from "@webhealth/shared/lib/reports/types";
import {
  getScheduledNoticeState,
  type ReportLiveSnapshot,
} from "./report-page.logic";
import { isAdminEmail } from "@webhealth/shared/lib/admin-access";
import { ScheduledReportActions } from "./scheduled-report-actions";
import { ReportDetailClientView } from "./report-detail-client-view";

import { ExecutiveSummary } from "./sections/executive-summary";
import { KpiCards } from "./sections/kpi-cards";
import { QuickWinsGrid } from "./sections/quick-wins-grid";
import { DeepDiveQueries } from "./sections/deep-dive-queries";
import { DeepDivePages } from "./sections/deep-dive-pages";
import { DeepDiveTechnical } from "./sections/deep-dive-technical";
import { ActionBacklog } from "./sections/action-backlog";
import { SiteChangesSection } from "./sections/site-changes-section";
import { JobTimeline } from "./sections/job-timeline";
import { DashboardMarkdown } from "./sections/dashboard-markdown";

import type { GscMetrics, Ga4Metrics } from "@webhealth/shared/lib/google/api";
import type { CrawlResult } from "@webhealth/shared/lib/crawl";

type ReportData = {
  gsc: { current: GscMetrics; compare: GscMetrics };
  ga4: { current: Ga4Metrics | null; compare: Ga4Metrics | null };
  crawl: CrawlResult;
};

export default async function ReportDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: reportId } = await params;

  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return redirect("/");

  const report = await db.query.reports.findFirst({
    where: (r, { eq }) => eq(r.id, reportId),
  });
  if (!report) return notFound();

  const userTeams = await db.query.teamMembers.findMany({
    where: (tm, { eq }) => eq(tm.userId, session.user.id),
  });
  const isMember = userTeams.some((tm) => tm.teamId === report.teamId);
  if (!isMember) return redirect("/dashboard");

  const property = await db.query.properties.findFirst({
    where: (p, { eq }) => eq(p.id, report.propertyId),
  });

  const [recentEvents, teamGa4Property] = await Promise.all([
    db.query.reportJobEvents.findMany({
      where: (e, { eq }) => eq(e.reportId, reportId),
      orderBy: (e, { desc }) => [desc(e.createdAt)],
      limit: 20,
    }),
    db.query.properties.findFirst({
      where: (p, { and, eq }) => and(eq(p.teamId, report.teamId), eq(p.type, "ga4")),
    }),
  ]);
  const isAdmin = await isAdminEmail(session.user.email ?? null);

  const data = report.data as ReportData | null;
  const aiReport = report.aiReportJson as AiSeoReport | null;
  const teamHasAnyGa4Properties = !!teamGa4Property;
  let sourceValid = false;
  let hasLinkedGa4Now = false;
  try {
    const resolvedSources = await resolveReportSourcesForExistingReport(report);
    sourceValid = true;
    hasLinkedGa4Now = !!resolvedSources.canonicalGscProperty.ga4PropertyId;
  } catch {
    sourceValid = false;
    hasLinkedGa4Now = false;
  }
  const scheduledNoticeState = getScheduledNoticeState({
    teamHasAnyGa4Properties,
    sourceValid,
    hasLinkedGa4Now,
  });
  const propertyName = property?.name ?? report.propertyId;
  const dateRangeLabel = `${new Date(report.dateRangeStart).toLocaleDateString()} – ${new Date(report.dateRangeEnd).toLocaleDateString()}`;
  const compareRangeLabel = `${new Date(report.compareRangeStart).toLocaleDateString()} – ${new Date(report.compareRangeEnd).toLocaleDateString()}`;
  const initialSnapshot: ReportLiveSnapshot = {
    reportStatus: report.status,
    aiStatus: report.aiStatus ?? null,
    xlsxStatus: report.xlsxStatus,
    hasAiReportJson: !!aiReport,
    hasXlsxArtifact: !!report.xlsxArtifactUrl,
  };

  return (
    <div className="relative overflow-hidden">
      <ReportDetailClientView
        key={`${reportId}:${report.status}:${report.aiStatus ?? "n/a"}:${report.xlsxStatus ?? "n/a"}:${report.updatedAt instanceof Date ? report.updatedAt.toISOString() : String(report.updatedAt ?? "")}`}
        reportId={reportId}
        propertyName={propertyName}
        dateRangeLabel={dateRangeLabel}
        compareRangeLabel={compareRangeLabel}
        initialSnapshot={initialSnapshot}
        isAdmin={isAdmin}
        aiEstimatedCostUsd={report.aiEstimatedCostUsd ?? null}
        detailsCostUsd={report.detailsCostUsd ?? null}
        scheduledContent={
          <div className="border border-amber-200 rounded-lg p-10 bg-amber-50/70 shadow-sm">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
              <div className="max-w-2xl space-y-3">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
                  <Link2 className="h-6 w-6" />
                </div>
                <h2 className="text-2xl font-semibold font-display text-amber-950">{scheduledNoticeState.title}</h2>
                <p className="text-amber-950/80">{scheduledNoticeState.description}</p>
                <p className="text-sm text-amber-900/80">{scheduledNoticeState.helper}</p>
                <ScheduledReportActions
                  reportId={reportId}
                  canContinueAnyway={scheduledNoticeState.canContinueAnyway}
                  continueAnywayReason={scheduledNoticeState.continueAnywayReason}
                  canProceedWithGa4={scheduledNoticeState.canProceedWithGa4}
                  proceedWithGa4Reason={scheduledNoticeState.proceedWithGa4Reason}
                />
              </div>
              <div className="flex shrink-0">
                <Button asChild className="rounded-full">
                  <Link href="/properties">Open Properties</Link>
                </Button>
              </div>
            </div>
          </div>
        }
        activeContent={
          <div className="border border-border/50 rounded-lg p-16 text-center bg-card shadow-sm">
            <div className="h-16 w-16 bg-primary/10 rounded-lg flex items-center justify-center mb-6 mx-auto">
              <BarChart2 className="h-8 w-8 text-primary animate-pulse" />
            </div>
            <h2 className="text-2xl font-semibold font-display mb-3">Report is being generated</h2>
            <p className="text-muted-foreground max-w-sm mx-auto">
              We&apos;re crawling your site and fetching data from Google Search Console and Analytics. This usually
              takes 1–2 minutes.
            </p>
          </div>
        }
        failedContent={
          <div className="border border-red-200 rounded-lg p-16 text-center bg-red-50 dark:bg-red-950/20">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-semibold mb-3 text-red-700">Report generation failed</h2>
            <p className="text-muted-foreground">
              Please try creating the report again or contact support if the problem persists.
            </p>
          </div>
        }
        completeContent={data ? (
          <div className="space-y-10">
            {/* 1. AI Summary */}
            {aiReport?.dashboardMarkdown ? (
              <div className="p-6 rounded-lg bg-card border border-border/50 shadow-sm">
                <h2 className="text-xl font-bold font-display mb-4">AI Summary</h2>
                <DashboardMarkdown content={aiReport.dashboardMarkdown} />
              </div>
            ) : null}

            {/* 2. Executive Summary */}
            <ExecutiveSummary
              executiveSummary={aiReport?.executiveSummary}
              alertsAndFlags={aiReport?.alertsAndFlags}
            />

            {/* 3. KPI Cards with Recharts sparklines */}
            <section>
              <h2 className="text-xl font-bold font-display mb-4">Search Console Metrics</h2>
              <KpiCards
                gscCurrent={data.gsc.current}
                gscCompare={data.gsc.compare}
                ga4Current={data.ga4?.current ?? null}
                ga4Compare={data.ga4?.compare ?? null}
                kpiTrendRows={aiReport?.kpiTrendRows ?? []}
              />
            </section>

            {/* 4. Quick Wins — 4 tabs */}
            <section>
              <h2 className="text-xl font-bold font-display mb-4">Quick Wins</h2>
              <QuickWinsGrid
                reportId={reportId}
                ctrGaps={aiReport?.lostClickEstimateRows}
                nearWinKeywords={aiReport?.nearWinKeywordRows}
                contentDecay={aiReport?.contentDecayRows}
                cannibalization={aiReport?.cannibalizationRows}
              />
            </section>

            {/* 5. Deep Dives */}
            <DeepDiveQueries rows={aiReport?.queryOpportunityRows} />
            <DeepDivePages rows={aiReport?.pageWinnerLoserRows} />
            <DeepDiveTechnical
              rows={aiReport?.technicalIssueRows}
              crawlSummary={data.crawl?.summary as Record<string, number> | null}
            />

            {/* 6. Action Backlog */}
            <ActionBacklog reportId={reportId} rows={aiReport?.actionBacklogRows} />

            {/* 7. Site Changes */}
            <SiteChangesSection siteChanges={aiReport?.siteChanges} />

            {/* 8. Job Timeline */}
            <JobTimeline events={recentEvents} />
          </div>
        ) : null}
      />
    </div>
  );
}
