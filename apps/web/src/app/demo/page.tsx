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
import { SiteChangesSection } from "@/app/reports/[id]/sections/site-changes-section";
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
  title: "Demo Report — WebAudit",
  description: "See a sample WebAudit SEO report for example-store.com, with AI-ranked fixes, KPIs, quick wins, and technical analysis.",
};

export default function DemoPage() {
  const aiReport = DEMO_AI_REPORT;
  const crawlSummary = {
    "Missing meta description": 8,
    "Broken internal link (4xx)": 3,
    "Missing H1": 2,
    "Duplicate title": 4,
  };

  return (
    <div className="flex-1 bg-background min-h-screen">
      {/* Demo banner */}
      <div
        className="sticky top-0 z-40 border-b flex items-center justify-between px-6 py-3 gap-4"
        style={{ backgroundColor: "#6366f1", borderColor: "#4f52c8" }}
      >
        <p className="text-sm font-medium text-white">
          This is a demo report for{" "}
          <span className="font-bold">{DEMO_DOMAIN}</span>. Sign in to generate
          reports for your own site.
        </p>
        <Button
          asChild
          size="sm"
          className="shrink-0 rounded-full bg-white text-[#6366f1] hover:bg-white/90 font-semibold"
        >
          <Link href="/">
            Connect your Google account
            <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
          </Link>
        </Button>
      </div>

      <div className="absolute top-0 inset-x-0 h-[300px] bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />

      <div className="container mx-auto py-10 px-4 relative z-10">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold tracking-tight font-display mb-2">
            {DEMO_DOMAIN}
          </h1>
          <p className="text-muted-foreground">
            Feb 1, 2026 – Feb 28, 2026
            <span className="mx-2 text-border">vs</span>
            Jan 1, 2026 – Jan 28, 2026
          </p>
        </div>

        <div className="space-y-10">
          {/* 1. Executive Summary */}
          <ExecutiveSummary
            executiveSummary={aiReport.executiveSummary}
            alertsAndFlags={aiReport.alertsAndFlags}
          />

          {/* 2. KPI Cards */}
          <section>
            <h2 className="text-xl font-bold font-display mb-4">Search Console Metrics</h2>
            <KpiCards
              gscCurrent={DEMO_GSC_CURRENT}
              gscCompare={DEMO_GSC_COMPARE}
              ga4Current={DEMO_GA4_CURRENT}
              ga4Compare={DEMO_GA4_COMPARE}
              kpiTrendRows={aiReport.kpiTrendRows ?? []}
            />
          </section>

          {/* 3. Quick Wins */}
          <section>
            <h2 className="text-xl font-bold font-display mb-4">Quick Wins</h2>
            <QuickWinsGrid
              reportId={DEMO_REPORT_ID}
              ctrGaps={aiReport.lostClickEstimateRows}
              nearWinKeywords={aiReport.nearWinKeywordRows}
              contentDecay={aiReport.contentDecayRows}
              cannibalization={aiReport.cannibalizationRows}
            />
          </section>

          {/* 4. Deep Dives */}
          <DeepDiveQueries rows={aiReport.queryOpportunityRows} />
          <DeepDivePages rows={aiReport.pageWinnerLoserRows} />
          <DeepDiveTechnical rows={aiReport.technicalIssueRows} crawlSummary={crawlSummary} />

          {/* 5. Action Backlog */}
          <ActionBacklog reportId={DEMO_REPORT_ID} rows={aiReport.actionBacklogRows} />

          {/* 6. Site Changes */}
          <SiteChangesSection siteChanges={aiReport.siteChanges} />

          {/* Bottom CTA */}
          <div
            className="rounded-3xl p-10 text-center"
            style={{ backgroundColor: "#6366f108", border: "1px solid #6366f120" }}
          >
            <h2 className="font-display text-2xl font-bold mb-3">
              Ready to see your own site&apos;s data?
            </h2>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Connect your Google Search Console and Analytics in under 2 minutes.
              Your first report is free — no credit card required.
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
