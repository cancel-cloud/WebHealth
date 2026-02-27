import { auth } from "@webhealth/shared/lib/auth";
import { headers } from "next/headers";
import { redirect, notFound } from "next/navigation";
import { db } from "@webhealth/shared/db";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { ArrowLeft, BarChart2, Globe2, TrendingDown, TrendingUp, Zap, AlertTriangle } from "lucide-react";
import type { QuickWin } from "@webhealth/shared/lib/openai";
import type { GscMetrics, Ga4Metrics } from "@webhealth/shared/lib/google/api";
import type { CrawlResult } from "@webhealth/shared/lib/crawl";
import { ReportActions } from "./report-actions";
import { ReportLiveStatus } from "./report-live-status";
import type { AiSeoReport } from "@webhealth/shared/lib/reports/types";

type ReportData = {
  gsc: { current: GscMetrics; compare: GscMetrics };
  ga4: { current: Ga4Metrics | null; compare: Ga4Metrics | null };
  crawl: CrawlResult;
};

function Delta({ current, compare, format = "number" }: { current: number; compare: number; format?: "number" | "percent" | "position" }) {
  const delta = current - compare;
  const pct = compare !== 0 ? ((delta / compare) * 100).toFixed(1) : "∞";
  // For position, lower is better
  const isPositive = format === "position" ? delta < 0 : delta > 0;
  const color = isPositive ? "text-green-500" : delta === 0 ? "text-muted-foreground" : "text-red-500";
  const Icon = isPositive ? TrendingUp : TrendingDown;

  return (
    <span className={`inline-flex items-center gap-1 text-sm font-medium ${color}`}>
      <Icon className="h-3 w-3" />
      {delta > 0 ? "+" : ""}{format === "percent" ? `${(delta * 100).toFixed(2)}%` : format === "position" ? delta.toFixed(1) : delta.toLocaleString()} ({pct}%)
    </span>
  );
}

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

function MiniTrendChart({
  points,
  color = "#2563eb",
}: {
  points: number[];
  color?: string;
}) {
  if (!points.length) return <div className="text-xs text-muted-foreground">No trend data</div>;
  const width = 220;
  const height = 60;
  const min = Math.min(...points);
  const max = Math.max(...points);
  const denom = max - min || 1;
  const path = points
    .map((value, idx) => {
      const x = (idx / Math.max(points.length - 1, 1)) * (width - 8) + 4;
      const y = height - ((value - min) / denom) * (height - 8) - 4;
      return `${idx === 0 ? "M" : "L"}${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(" ");

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="block">
      <path d={path} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
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

  // Access check: ensure report belongs to user's team
  const userTeams = await db.query.teamMembers.findMany({
    where: (tm, { eq }) => eq(tm.userId, session.user.id),
  });
  const isMember = userTeams.some((tm) => tm.teamId === report.teamId);
  if (!isMember) return redirect("/dashboard");

  const property = await db.query.properties.findFirst({
    where: (p, { eq }) => eq(p.id, report.propertyId),
  });

  const data = report.data as ReportData | null;
  const quickWins = report.quickWins as QuickWin[] | null;
  const aiReport = report.aiReportJson as AiSeoReport | null;
  const recentEvents = await db.query.reportJobEvents.findMany({
    where: (e, { eq }) => eq(e.reportId, reportId),
    orderBy: (e, { desc }) => [desc(e.createdAt)],
    limit: 20,
  });

  const impactColor: Record<string, string> = {
    high: "text-red-500 bg-red-50 border-red-200",
    medium: "text-amber-500 bg-amber-50 border-amber-200",
    low: "text-blue-500 bg-blue-50 border-blue-200",
  };

  return (
    <div className="flex-1 bg-background min-h-screen">
      <ReportLiveStatus reportId={reportId} initialStatus={report.status} />
      <div className="absolute top-0 inset-x-0 h-[300px] bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />

      <div className="container mx-auto py-10 px-4 relative z-10">
        {/* Header */}
        <div className="mb-8">
          <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4">
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight font-display mb-2">
                {property?.name ?? report.propertyId}
              </h1>
              <p className="text-muted-foreground">
                {new Date(report.dateRangeStart).toLocaleDateString()} – {new Date(report.dateRangeEnd).toLocaleDateString()}
                <span className="mx-2 text-border">vs</span>
                {new Date(report.compareRangeStart).toLocaleDateString()} – {new Date(report.compareRangeEnd).toLocaleDateString()}
              </p>
            </div>
            <div className="flex flex-col items-end gap-2">
              <StatusBadge status={report.status} />
              <div className="text-xs text-muted-foreground text-right space-y-1">
                <div>AI: {report.aiStatus ?? "n/a"}</div>
                <div>XLSX: {report.xlsxStatus ?? "n/a"}</div>
                {report.aiEstimatedCostUsd ? <div>Est. AI Cost: ${String(report.aiEstimatedCostUsd)}</div> : null}
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

        {report.status === 'queued' || report.status === 'processing' ? (
          <div className="border border-border/50 rounded-3xl p-16 text-center bg-card shadow-sm">
            <div className="h-16 w-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-6 mx-auto">
              <BarChart2 className="h-8 w-8 text-primary animate-pulse" />
            </div>
            <h2 className="text-2xl font-semibold font-display mb-3">Report is being generated</h2>
            <p className="text-muted-foreground max-w-sm mx-auto">
              We&apos;re crawling your site and fetching data from Google Search Console and Analytics. This usually takes 1–2 minutes.
            </p>
          </div>
        ) : report.status === 'failed' ? (
          <div className="border border-red-200 rounded-3xl p-16 text-center bg-red-50 dark:bg-red-950/20">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-semibold mb-3 text-red-700">Report generation failed</h2>
            <p className="text-muted-foreground">Please try creating the report again or contact support if the problem persists.</p>
          </div>
        ) : data ? (
          <div className="space-y-10">
            {aiReport?.dashboardMarkdown ? (
              <div className="p-6 rounded-3xl bg-card border border-border/50 shadow-sm">
                <h2 className="text-xl font-bold font-display mb-3">AI Summary</h2>
                <pre className="whitespace-pre-wrap text-sm leading-relaxed font-sans">
                  {aiReport.dashboardMarkdown}
                </pre>
              </div>
            ) : null}

            {aiReport?.kpiTrendRows && aiReport.kpiTrendRows.length > 1 ? (
              <div>
                <h2 className="text-xl font-bold font-display mb-4">Trend Signals</h2>
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="p-4 rounded-2xl bg-card border border-border/50 shadow-sm">
                    <p className="text-xs text-muted-foreground mb-2">Clicks trend</p>
                    <MiniTrendChart points={aiReport.kpiTrendRows.map((r) => r.clicksCurrent)} color="#2563eb" />
                  </div>
                  <div className="p-4 rounded-2xl bg-card border border-border/50 shadow-sm">
                    <p className="text-xs text-muted-foreground mb-2">Impressions trend</p>
                    <MiniTrendChart points={aiReport.kpiTrendRows.map((r) => r.impressionsCurrent)} color="#16a34a" />
                  </div>
                  <div className="p-4 rounded-2xl bg-card border border-border/50 shadow-sm">
                    <p className="text-xs text-muted-foreground mb-2">Sessions trend</p>
                    <MiniTrendChart
                      points={aiReport.kpiTrendRows.map((r) => r.sessionsCurrent ?? 0)}
                      color="#9333ea"
                    />
                  </div>
                </div>
              </div>
            ) : null}

            {/* GSC Metrics Comparison */}
            <div>
              <h2 className="text-xl font-bold font-display mb-4 flex items-center gap-2">
                <Globe2 className="h-5 w-5 text-primary" /> Search Console Metrics
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: "Clicks", curr: data.gsc.current.clicks, comp: data.gsc.compare.clicks, fmt: "number" as const },
                  { label: "Impressions", curr: data.gsc.current.impressions, comp: data.gsc.compare.impressions, fmt: "number" as const },
                  { label: "CTR", curr: data.gsc.current.ctr, comp: data.gsc.compare.ctr, fmt: "percent" as const },
                  { label: "Avg Position", curr: data.gsc.current.position, comp: data.gsc.compare.position, fmt: "position" as const },
                ].map(({ label, curr, comp, fmt }) => (
                  <div key={label} className="p-6 rounded-3xl bg-card border border-border/50 shadow-sm">
                    <p className="text-sm text-muted-foreground mb-1">{label}</p>
                    <p className="text-3xl font-bold font-display mb-2">
                      {fmt === "percent" ? `${(curr * 100).toFixed(2)}%` : fmt === "position" ? curr.toFixed(1) : curr.toLocaleString()}
                    </p>
                    <Delta current={curr} compare={comp} format={fmt} />
                  </div>
                ))}
              </div>
            </div>

            {/* GA4 Metrics */}
            {data.ga4?.current && (
              <div>
                <h2 className="text-xl font-bold font-display mb-4 flex items-center gap-2">
                  <BarChart2 className="h-5 w-5 text-blue-500" /> Analytics Metrics
                </h2>
                <div className="grid grid-cols-2 gap-4 max-w-lg">
                  <div className="p-6 rounded-3xl bg-card border border-border/50 shadow-sm">
                    <p className="text-sm text-muted-foreground mb-1">Sessions</p>
                    <p className="text-3xl font-bold font-display mb-2">{data.ga4.current.sessions.toLocaleString()}</p>
                    {data.ga4.compare && <Delta current={data.ga4.current.sessions} compare={data.ga4.compare.sessions} />}
                  </div>
                  <div className="p-6 rounded-3xl bg-card border border-border/50 shadow-sm">
                    <p className="text-sm text-muted-foreground mb-1">Users</p>
                    <p className="text-3xl font-bold font-display mb-2">{data.ga4.current.users.toLocaleString()}</p>
                    {data.ga4.compare && <Delta current={data.ga4.current.users} compare={data.ga4.compare.users} />}
                  </div>
                </div>
              </div>
            )}

            {/* Top Queries */}
            {data.gsc.current.topQueries.length > 0 && (
              <div>
                <h2 className="text-xl font-bold font-display mb-4">Top Queries</h2>
                <div className="border border-border/50 rounded-3xl overflow-hidden bg-card shadow-sm">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/30">
                      <tr>
                        {["Query", "Clicks", "Impressions", "CTR", "Position"].map((h) => (
                          <th key={h} className="text-left py-3 px-4 font-medium text-muted-foreground">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {data.gsc.current.topQueries.slice(0, 10).map((q) => (
                        <tr key={q.query} className="border-t border-border/30 hover:bg-muted/20 transition-colors">
                          <td className="py-3 px-4 font-medium">{q.query}</td>
                          <td className="py-3 px-4">{q.clicks.toLocaleString()}</td>
                          <td className="py-3 px-4">{q.impressions.toLocaleString()}</td>
                          <td className="py-3 px-4">{(q.ctr * 100).toFixed(2)}%</td>
                          <td className="py-3 px-4">{q.position.toFixed(1)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Quick Wins */}
            {quickWins && quickWins.length > 0 && (
              <div>
                <h2 className="text-xl font-bold font-display mb-4 flex items-center gap-2">
                  <Zap className="h-5 w-5 text-purple-500" /> AI Quick Wins
                </h2>
                <div className="space-y-4">
                  {quickWins.map((win) => (
                    <div key={win.rank} className="p-6 rounded-3xl bg-card border border-border/50 shadow-sm flex gap-4">
                      <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center text-sm font-bold text-muted-foreground shrink-0">
                        #{win.rank}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-semibold">{win.title}</p>
                          <Badge variant="outline" className={impactColor[win.impact]}>
                            {win.impact} impact
                          </Badge>
                        </div>
                        <p className="text-muted-foreground text-sm leading-relaxed">{win.description}</p>
                        {win.affectedPages && win.affectedPages.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {win.affectedPages.slice(0, 3).map((p) => (
                              <a key={p} href={p} target="_blank" rel="noopener noreferrer" className="text-xs text-primary underline-offset-2 hover:underline truncate max-w-xs">{p}</a>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {aiReport?.queryOpportunityRows && aiReport.queryOpportunityRows.length > 0 ? (
              <div>
                <h2 className="text-xl font-bold font-display mb-4">Query Opportunities</h2>
                <div className="border border-border/50 rounded-3xl overflow-hidden bg-card shadow-sm">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/30">
                      <tr>
                        {["Query", "Impr.", "CTR", "Pos", "Lost Clicks", "Score", "Action"].map((h) => (
                          <th key={h} className="text-left py-3 px-4 font-medium text-muted-foreground">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {aiReport.queryOpportunityRows.slice(0, 12).map((q) => (
                        <tr key={q.query} className="border-t border-border/30">
                          <td className="py-3 px-4 font-medium">{q.query}</td>
                          <td className="py-3 px-4">{q.impressions.toLocaleString()}</td>
                          <td className="py-3 px-4">{(q.ctr * 100).toFixed(2)}%</td>
                          <td className="py-3 px-4">{q.position.toFixed(1)}</td>
                          <td className="py-3 px-4">{q.lostClicksEstimate.toFixed(1)}</td>
                          <td className="py-3 px-4">{q.opportunityScore.toFixed(1)}</td>
                          <td className="py-3 px-4 text-muted-foreground">{q.recommendedAction}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : null}

            {aiReport?.pageWinnerLoserRows && aiReport.pageWinnerLoserRows.length > 0 ? (
              <div>
                <h2 className="text-xl font-bold font-display mb-4">Page Winners / Losers</h2>
                <div className="border border-border/50 rounded-3xl overflow-hidden bg-card shadow-sm">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/30">
                      <tr>
                        {["Page", "Clicks Δ", "Impr. Δ", "Status"].map((h) => (
                          <th key={h} className="text-left py-3 px-4 font-medium text-muted-foreground">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {aiReport.pageWinnerLoserRows.slice(0, 12).map((row) => (
                        <tr key={row.page} className="border-t border-border/30">
                          <td className="py-3 px-4 truncate max-w-[500px]">{row.page}</td>
                          <td className={`py-3 px-4 ${row.clicksDelta >= 0 ? "text-green-600" : "text-red-600"}`}>
                            {row.clicksDelta >= 0 ? "+" : ""}{row.clicksDelta}
                          </td>
                          <td className={`py-3 px-4 ${row.impressionsDelta >= 0 ? "text-green-600" : "text-red-600"}`}>
                            {row.impressionsDelta >= 0 ? "+" : ""}{row.impressionsDelta}
                          </td>
                          <td className="py-3 px-4">{row.status}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : null}

            {aiReport?.actionBacklogRows && aiReport.actionBacklogRows.length > 0 ? (
              <div>
                <h2 className="text-xl font-bold font-display mb-4">What To Do This Week</h2>
                <div className="space-y-3">
                  {aiReport.actionBacklogRows.slice(0, 8).map((row) => (
                    <div key={row.id} className="p-4 rounded-2xl bg-card border border-border/50 shadow-sm">
                      <div className="flex items-center justify-between gap-3">
                        <p className="font-semibold">{row.task}</p>
                        <Badge variant="outline">Impact {row.impactScore.toFixed(1)}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{row.why}</p>
                      <div className="text-xs text-muted-foreground mt-2">
                        Owner: {row.ownerHint} · Effort: {row.effort} · Area: {row.area}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {aiReport?.technicalIssueRows && aiReport.technicalIssueRows.length > 0 ? (
              <div>
                <h2 className="text-xl font-bold font-display mb-4">Technical Impact Map</h2>
                <div className="grid md:grid-cols-2 gap-4">
                  {aiReport.technicalIssueRows.slice(0, 8).map((row) => (
                    <div key={row.issueType} className="p-4 rounded-2xl bg-card border border-border/50 shadow-sm">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-semibold">{row.issueType}</p>
                        <Badge variant="outline">{row.severity}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {row.affectedPages} pages · est. affected clicks {row.affectedEstimatedClicks}
                      </p>
                      <p className="text-sm mt-2">{row.recommendation}</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {/* Crawl Summary */}
            {data.crawl && (
              <div>
                <h2 className="text-xl font-bold font-display mb-4">Crawl Issues</h2>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  {Object.entries(data.crawl.summary).map(([key, val]) => (
                    <div key={key} className={`p-4 rounded-2xl border ${val > 0 ? 'bg-red-50 dark:bg-red-950/20 border-red-200' : 'bg-card border-border/50'} shadow-sm text-center`}>
                      <p className={`text-2xl font-bold font-display ${val > 0 ? 'text-red-600' : 'text-green-600'}`}>{val}</p>
                      <p className="text-xs text-muted-foreground mt-1">{key.replace(/([A-Z])/g, ' $1').trim()}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Job Timeline */}
            {recentEvents.length > 0 && (
              <div>
                <h2 className="text-xl font-bold font-display mb-4">Recent Job Events</h2>
                <div className="space-y-3">
                  {recentEvents.map((e) => (
                    <div key={e.id} className="p-4 rounded-2xl bg-card border border-border/50 shadow-sm">
                      <div className="flex flex-wrap items-center gap-2 text-sm">
                        <Badge
                          variant="outline"
                          className={
                            e.level === "error"
                              ? "text-red-600 border-red-200"
                              : e.level === "warn"
                                ? "text-amber-600 border-amber-200"
                                : "text-blue-600 border-blue-200"
                          }
                        >
                          {e.level}
                        </Badge>
                        <span className="font-medium">{e.phase}</span>
                        <span className="text-muted-foreground">
                          {new Date(e.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <p className="mt-2 text-sm">{e.message}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}
