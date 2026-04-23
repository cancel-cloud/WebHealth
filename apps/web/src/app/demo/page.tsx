import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ExecutiveSummary } from "@/app/reports/[id]/sections/executive-summary";
import { KpiCards } from "@/app/reports/[id]/sections/kpi-cards";
import { QuickWinsGrid } from "@/app/reports/[id]/sections/quick-wins-grid";
import { DeepDiveQueries } from "@/app/reports/[id]/sections/deep-dive-queries";
import { DeepDivePages } from "@/app/reports/[id]/sections/deep-dive-pages";
import { DeepDiveTechnical } from "@/app/reports/[id]/sections/deep-dive-technical";
import { ActionBacklog } from "@/app/reports/[id]/sections/action-backlog";
import { NotRecommendedSection } from "@/app/reports/[id]/sections/not-recommended-section";
import { SiteChangesSection } from "@/app/reports/[id]/sections/site-changes-section";
import { getWeeklyActionSummaryChips } from "@/app/reports/[id]/sections/action-surface.logic";
import {
  DEMO_REPORT_ID,
  DEMO_DOMAIN,
  DEMO_GSC_CURRENT,
  DEMO_GSC_COMPARE,
  DEMO_GA4_CURRENT,
  DEMO_GA4_COMPARE,
  DEMO_AI_REPORT,
} from "./fixture";

export const metadata: Metadata = {
  title: "Demo Report — Webhealth",
  description:
    "See a sample Webhealth SEO report for example-store.com, with AI-ranked fixes, KPIs, quick wins, and technical analysis.",
};

export default function DemoPage() {
  const aiReport = DEMO_AI_REPORT;
  const summaryChips = getWeeklyActionSummaryChips(aiReport.weeklyActionRows);
  const crawlSummary = {
    "Missing meta description": 8,
    "Broken internal link (4xx)": 3,
    "Missing H1": 2,
    "Duplicate title": 4,
  };

  return (
    <div className="min-h-screen flex-1 bg-report-canvas">
      <div className="sticky top-0 z-40 border-b border-report-separator bg-report-panel/95 px-6 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
          <p className="text-sm text-foreground/88">
            Sample report for <span className="font-semibold">{DEMO_DOMAIN}</span>. Connect your own site to generate this view with live data.
          </p>
          <Button asChild size="sm" className="shrink-0 rounded-full font-semibold">
            <Link href="/">
              Connect your Google account
              <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>
      </div>

      <div className="relative z-10 mx-auto max-w-6xl px-4 py-8">
        <div className="mb-6 rounded-lg border border-report-separator bg-report-panel px-5 py-5 shadow-sm" data-report-header>
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div className="space-y-3">
              <div>
                <h1 className="mb-2 text-3xl font-extrabold tracking-tight font-display">{DEMO_DOMAIN}</h1>
                <p className="text-sm text-muted-foreground">
                  Feb 1, 2026 – Feb 28, 2026
                  <span className="mx-2 text-border">vs</span>
                  Jan 1, 2026 – Jan 28, 2026
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                {summaryChips.map((chip) => (
                  <span
                    key={`${chip.label}:${chip.value}`}
                    className="inline-flex items-center rounded-full border border-report-separator bg-report-chip px-2 py-0.5 text-xs font-medium text-report-chip-foreground"
                  >
                    {chip.label}: {chip.value}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-3 xl:items-end">
              <div className="flex flex-wrap items-center gap-2 xl:justify-end">
                <span className="inline-flex items-center rounded-full border border-green-200 bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700 dark:border-green-500/20 dark:bg-green-500/12 dark:text-green-100">
                  Demo report
                </span>
                <span className="inline-flex items-center rounded-full border border-report-separator bg-report-chip px-2 py-0.5 text-xs font-medium text-report-chip-foreground">
                  AI ready
                </span>
                <span className="inline-flex items-center rounded-full border border-report-separator bg-report-chip px-2 py-0.5 text-xs font-medium text-report-chip-foreground">
                  XLSX ready
                </span>
              </div>
              <p className="max-w-md text-sm text-muted-foreground xl:text-right">
                This sample is intentionally compact: decisions first, evidence underneath.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-8">
          <ActionBacklog
            reportId={DEMO_REPORT_ID}
            rows={aiReport.weeklyActionRows}
          />

          <ExecutiveSummary
            executiveSummary={aiReport.executiveSummary}
            alertsAndFlags={aiReport.alertsAndFlags}
          />

          <NotRecommendedSection rows={aiReport.notRecommendedRows} />

          <section className="space-y-5" data-report-secondary>
            <div className="space-y-1">
              <h2 className="text-lg font-semibold font-display">Evidence And Context</h2>
              <p className="max-w-3xl text-sm text-muted-foreground">
                Open the supporting tables and snapshots when you need to validate why the weekly decisions above were ranked this way.
              </p>
            </div>

            <section>
              <h3 className="mb-4 text-base font-semibold font-display">
                Search performance snapshot
              </h3>
              <KpiCards
                gscCurrent={DEMO_GSC_CURRENT}
                gscCompare={DEMO_GSC_COMPARE}
                ga4Current={DEMO_GA4_CURRENT}
                ga4Compare={DEMO_GA4_COMPARE}
                kpiTrendRows={aiReport.kpiTrendRows ?? []}
              />
            </section>

            <section>
              <h3 className="mb-4 text-base font-semibold font-display">Supporting opportunities</h3>
              <QuickWinsGrid
                reportId={DEMO_REPORT_ID}
                ctrGaps={aiReport.lostClickEstimateRows}
                nearWinKeywords={aiReport.nearWinKeywordRows}
                contentDecay={aiReport.contentDecayRows}
                cannibalization={aiReport.cannibalizationRows}
              />
            </section>

            <DeepDiveQueries rows={aiReport.queryOpportunityRows} />
            <DeepDivePages rows={aiReport.pageWinnerLoserRows} />
            <DeepDiveTechnical
              rows={aiReport.technicalIssueRows}
              crawlSummary={crawlSummary}
            />

            <SiteChangesSection siteChanges={aiReport.siteChanges} />
          </section>

          <div
            className="rounded-lg border border-report-separator bg-report-panel px-6 py-8 text-center shadow-sm"
          >
            <h2 className="font-display text-2xl font-bold mb-3">
              Ready to see your own site&apos;s data?
            </h2>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Connect your Google Search Console and Analytics in under 2
              minutes. Your first report is free — no credit card required.
            </p>
            <Button asChild size="lg" className="rounded-full px-8">
              <Link href="/">
                Connect your Google account
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
