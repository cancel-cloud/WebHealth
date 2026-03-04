import { auth } from "@webhealth/shared/lib/auth";
import { headers } from "next/headers";
import { redirect, notFound } from "next/navigation";
import { db } from "@webhealth/shared/db";
import Link from "next/link";
import { ArrowLeft, BarChart2, AlertTriangle } from "lucide-react";
import { ReportActions } from "./report-actions";
import { ReportLiveStatus } from "./report-live-status";
import { Badge } from "@/components/ui/badge";
import type { AiSeoReport } from "@webhealth/shared/lib/reports/types";

import { ExecutiveSummary } from "./sections/executive-summary";
import { KpiCards } from "./sections/kpi-cards";
import { QuickWinsGrid } from "./sections/quick-wins-grid";
import { DeepDiveQueries } from "./sections/deep-dive-queries";
import { DeepDivePages } from "./sections/deep-dive-pages";
import { DeepDiveTechnical } from "./sections/deep-dive-technical";
import { ActionBacklog } from "./sections/action-backlog";
import { SiteChangesSection } from "./sections/site-changes-section";
import { JobTimeline } from "./sections/job-timeline";

import type { GscMetrics, Ga4Metrics } from "@webhealth/shared/lib/google/api";
import type { CrawlResult } from "@webhealth/shared/lib/crawl";

type ReportData = {
  gsc: { current: GscMetrics; compare: GscMetrics };
  ga4: { current: Ga4Metrics | null; compare: Ga4Metrics | null };
  crawl: CrawlResult;
};

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; class: string }> = {
    queued: { label: "Queued", class: "text-zinc-500 bg-zinc-100 border-zinc-200" },
    processing: { label: "Processing", class: "text-blue-600 bg-blue-50 border-blue-200 animate-pulse" },
    complete: { label: "Complete", class: "text-green-600 bg-green-50 border-green-200" },
    failed: { label: "Failed", class: "text-red-600 bg-red-50 border-red-200" },
  };
  const cfg = map[status] ?? map.queued;
  return <Badge variant="outline" className={cfg.class}>{cfg.label}</Badge>;
}

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

  const data = report.data as ReportData | null;
  const aiReport = report.aiReportJson as AiSeoReport | null;
  const recentEvents = await db.query.reportJobEvents.findMany({
    where: (e, { eq }) => eq(e.reportId, reportId),
    orderBy: (e, { desc }) => [desc(e.createdAt)],
    limit: 20,
  });

  return (
    <div className="flex-1 bg-background min-h-screen">
      <ReportLiveStatus
        reportId={reportId}
        initialStatus={report.status}
        initialXlsxStatus={report.xlsxStatus}
      />
      <div className="absolute top-0 inset-x-0 h-[300px] bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />

      <div className="container mx-auto py-10 px-4 relative z-10">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight font-display mb-2">
                {property?.name ?? report.propertyId}
              </h1>
              <p className="text-muted-foreground">
                {new Date(report.dateRangeStart).toLocaleDateString()} –{" "}
                {new Date(report.dateRangeEnd).toLocaleDateString()}
                <span className="mx-2 text-border">vs</span>
                {new Date(report.compareRangeStart).toLocaleDateString()} –{" "}
                {new Date(report.compareRangeEnd).toLocaleDateString()}
              </p>
            </div>
            <div className="flex flex-col items-end gap-2">
              <StatusBadge status={report.status} />
              <div className="text-xs text-muted-foreground text-right space-y-1">
                <div>AI: {report.aiStatus ?? "n/a"}</div>
                <div>XLSX: {report.xlsxStatus ?? "n/a"}</div>
                {report.aiEstimatedCostUsd ? (
                  <div>Est. AI Cost: ${String(report.aiEstimatedCostUsd)}</div>
                ) : null}
              </div>
            </div>
          </div>
          <div className="mt-4">
            <ReportActions
              reportId={reportId}
              xlsxReady={report.xlsxStatus === "ready" && !!report.xlsxArtifactUrl}
            />
          </div>
        </div>

        {report.status === "queued" || report.status === "processing" ? (
          <div className="border border-border/50 rounded-3xl p-16 text-center bg-card shadow-sm">
            <div className="h-16 w-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-6 mx-auto">
              <BarChart2 className="h-8 w-8 text-primary animate-pulse" />
            </div>
            <h2 className="text-2xl font-semibold font-display mb-3">Report is being generated</h2>
            <p className="text-muted-foreground max-w-sm mx-auto">
              We&apos;re crawling your site and fetching data from Google Search Console and Analytics. This usually
              takes 1–2 minutes.
            </p>
          </div>
        ) : report.status === "failed" ? (
          <div className="border border-red-200 rounded-3xl p-16 text-center bg-red-50 dark:bg-red-950/20">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-semibold mb-3 text-red-700">Report generation failed</h2>
            <p className="text-muted-foreground">
              Please try creating the report again or contact support if the problem persists.
            </p>
          </div>
        ) : data ? (
          <div className="space-y-10">
            {/* 1. AI Summary */}
            {aiReport?.dashboardMarkdown ? (
              <div className="p-6 rounded-3xl bg-card border border-border/50 shadow-sm">
                <h2 className="text-xl font-bold font-display mb-3">AI Summary</h2>
                <pre className="whitespace-pre-wrap text-sm leading-relaxed font-sans">
                  {aiReport.dashboardMarkdown}
                </pre>
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
            <ActionBacklog rows={aiReport?.actionBacklogRows} />

            {/* 7. Site Changes */}
            <SiteChangesSection siteChanges={aiReport?.siteChanges} />

            {/* 8. Job Timeline */}
            <JobTimeline events={recentEvents} />
          </div>
        ) : null}
      </div>
    </div>
  );
}
