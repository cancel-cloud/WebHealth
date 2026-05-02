import { notFound } from "next/navigation";
import type { CSSProperties } from "react";
import { ArrowDownRight, ArrowUpRight, CheckCircle2, ExternalLink } from "lucide-react";
import { getPropertyShareReportByToken, type ClientReportComparison } from "@webhealth/shared/lib/live-dashboard";
import { recordProductEvent } from "@webhealth/shared/lib/product-event-store";
import { PropertyShareTrendChart } from "./property-share-trend-chart";

function formatNumber(value: number | null | undefined) {
  if (value == null) return "—";
  return Math.round(value).toLocaleString();
}

function formatPercent(value: number | null | undefined) {
  if (value == null) return "—";
  return `${(value * 100).toFixed(1)}%`;
}

function formatPosition(value: number | null | undefined) {
  if (value == null) return "—";
  return value.toFixed(1);
}

function formatFullDate(value: string | null | undefined) {
  if (!value) return "—";
  return new Intl.DateTimeFormat(undefined, {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(`${value}T00:00:00.000Z`));
}

function formatDateTime(value: string | null | undefined) {
  if (!value) return "—";
  return new Intl.DateTimeFormat(undefined, {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function formatPropertyUrl(rawUrl: string) {
  if (rawUrl.startsWith("sc-domain:")) return `https://${rawUrl.replace(/^sc-domain:/, "")}`;
  if (/^https?:\/\//i.test(rawUrl)) return rawUrl;
  return `https://${rawUrl}`;
}

function formatCompareMode(compareMode: string) {
  if (compareMode === "previous_period") return "Compared with previous period";
  if (compareMode === "same_period_last_year") return "Compared with same period last year";
  return "No comparison period";
}

function getDeltaTone(delta: number | null, invert = false) {
  if (delta == null || delta === 0) return "neutral";
  const positive = invert ? delta < 0 : delta > 0;
  return positive ? "positive" : "negative";
}

function formatDelta(delta: number | null, options?: { percent?: boolean; position?: boolean }) {
  if (delta == null) return null;
  if (options?.percent) return `${delta >= 0 ? "+" : ""}${(delta * 100).toFixed(1)}pt`;
  if (options?.position) return `${delta >= 0 ? "+" : ""}${delta.toFixed(1)}`;
  return `${delta >= 0 ? "+" : ""}${Math.round(delta).toLocaleString()}`;
}

function DeltaPill({
  delta,
  invert,
  children,
}: {
  delta: number | null;
  invert?: boolean;
  children: string;
}) {
  const tone = getDeltaTone(delta, invert);
  if (delta == null) return <span className="text-xs font-medium text-slate-500">Comparison data unavailable for this period.</span>;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold ${
        tone === "positive"
          ? "bg-emerald-50 text-emerald-700"
          : tone === "negative"
            ? "bg-rose-50 text-rose-700"
            : "bg-slate-100 text-slate-600"
      }`}
    >
      {tone === "negative" ? <ArrowDownRight className="h-3.5 w-3.5" /> : <ArrowUpRight className="h-3.5 w-3.5" />}
      {children}
    </span>
  );
}

function getRecapSentence(comparison: ClientReportComparison) {
  if (!comparison.previousCreatedAt) {
    return "This is the baseline snapshot. Future shared snapshots will show how performance changed from this point.";
  }

  const clicksDelta = comparison.metricDeltas.clicks;
  const impressionsDelta = comparison.metricDeltas.impressions;
  if ((clicksDelta ?? 0) > 0 && (impressionsDelta ?? 0) >= 0) {
    return "Traffic and visibility improved compared with the last shared snapshot.";
  }
  if ((clicksDelta ?? 0) < 0 || (impressionsDelta ?? 0) < 0) {
    return "Some visibility softened compared with the last shared snapshot. The tables below show which pages and queries moved most.";
  }
  return "Performance is broadly stable compared with the last shared snapshot.";
}

export default async function PropertySharePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const share = await getPropertyShareReportByToken(token);
  if (!share) notFound();

  void recordProductEvent({
    teamId: share.teamId,
    userId: null,
    name: "snapshot_opened",
    source: "snapshot",
    entityType: "share",
    entityId: share.shareId,
    properties: {
      propertyId: share.propertyId,
    },
  }).catch(() => {});

  const dashboard = share.payloadSnapshot;
  const comparison = share.clientReportComparison;
  const brand = share.brandSnapshot;
  const primary = brand.primaryColor;
  const accent = brand.accentColor;
  const propertyUrl = formatPropertyUrl(dashboard.property.url);
  const compareBaselineAvailable = dashboard.analysisWindow.compareMode !== "none" && (
    dashboard.overview.compare.clicks > 0
    || dashboard.overview.compare.impressions > 0
    || (dashboard.overview.compare.sessions ?? 0) > 0
    || (dashboard.overview.compare.users ?? 0) > 0
  );
  const metricCards = [
    {
      label: "Clicks",
      value: formatNumber(dashboard.overview.clicks),
      delta: compareBaselineAvailable ? dashboard.overview.clicks - dashboard.overview.compare.clicks : null,
      deltaText: compareBaselineAvailable ? formatDelta(dashboard.overview.clicks - dashboard.overview.compare.clicks) : null,
    },
    {
      label: "Impressions",
      value: formatNumber(dashboard.overview.impressions),
      delta: compareBaselineAvailable ? dashboard.overview.impressions - dashboard.overview.compare.impressions : null,
      deltaText: compareBaselineAvailable ? formatDelta(dashboard.overview.impressions - dashboard.overview.compare.impressions) : null,
    },
    {
      label: "CTR",
      value: formatPercent(dashboard.overview.ctr),
      delta: compareBaselineAvailable ? dashboard.overview.ctr - dashboard.overview.compare.ctr : null,
      deltaText: compareBaselineAvailable ? formatDelta(dashboard.overview.ctr - dashboard.overview.compare.ctr, { percent: true }) : null,
    },
    {
      label: "Avg. position",
      value: formatPosition(dashboard.overview.position),
      delta: compareBaselineAvailable ? dashboard.overview.position - dashboard.overview.compare.position : null,
      deltaText: compareBaselineAvailable ? formatDelta(dashboard.overview.position - dashboard.overview.compare.position, { position: true }) : null,
      invert: true,
    },
    {
      label: "Sessions",
      value: formatNumber(dashboard.overview.sessions),
      delta: compareBaselineAvailable && dashboard.overview.sessions != null && dashboard.overview.compare.sessions != null
        ? dashboard.overview.sessions - dashboard.overview.compare.sessions
        : null,
      deltaText: compareBaselineAvailable && dashboard.overview.sessions != null && dashboard.overview.compare.sessions != null
        ? formatDelta(dashboard.overview.sessions - dashboard.overview.compare.sessions)
        : null,
    },
    {
      label: "Users",
      value: formatNumber(dashboard.overview.users),
      delta: compareBaselineAvailable && dashboard.overview.users != null && dashboard.overview.compare.users != null
        ? dashboard.overview.users - dashboard.overview.compare.users
        : null,
      deltaText: compareBaselineAvailable && dashboard.overview.users != null && dashboard.overview.compare.users != null
        ? formatDelta(dashboard.overview.users - dashboard.overview.compare.users)
        : null,
    },
  ];

  return (
    <main
      className="min-h-screen bg-slate-50 px-5 py-6 text-slate-950"
      style={{
        "--share-primary": primary,
        "--share-accent": accent,
      } as CSSProperties}
    >
      <div className="mx-auto max-w-6xl space-y-6">
        <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="h-2" style={{ background: `linear-gradient(90deg, ${primary}, ${accent})` }} />
          <div className="p-6 md:p-8">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-3">
                  {brand.logoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={brand.logoUrl} alt={brand.agencyName || "Agency logo"} className="h-10 max-w-40 rounded object-contain" />
                  ) : null}
                  <span className="text-sm font-medium text-slate-500">{brand.agencyName || "WebHealth"}</span>
                </div>
                <p className="mt-6 text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">Website performance snapshot</p>
                <h1 className="mt-2 font-display text-3xl font-bold tracking-tight md:text-5xl">
                  {dashboard.property.name}
                </h1>
                <a href={propertyUrl} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-2 text-base font-medium text-blue-600 hover:underline">
                  {dashboard.property.url}
                  <ExternalLink className="h-4 w-4" />
                </a>
              </div>
              <div className="grid gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600 lg:min-w-[340px]">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Snapshot period</div>
                  <div className="mt-1 font-medium text-slate-950">
                    {formatFullDate(dashboard.analysisWindow.startDate)} to {formatFullDate(dashboard.analysisWindow.endDate)}
                  </div>
                </div>
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">{formatCompareMode(dashboard.analysisWindow.compareMode)}</div>
                  <div className="mt-1 font-medium text-slate-950">
                    {dashboard.analysisWindow.compareStartDate && dashboard.analysisWindow.compareEndDate
                      ? `${formatFullDate(dashboard.analysisWindow.compareStartDate)} to ${formatFullDate(dashboard.analysisWindow.compareEndDate)}`
                      : "No comparison selected"}
                  </div>
                </div>
                <div className="text-xs text-slate-500">Shared on {formatDateTime(share.createdAt)}</div>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
          {metricCards.map((metric) => (
            <div key={metric.label} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">{metric.label}</div>
              <div className="mt-3 font-display text-3xl font-bold" style={{ color: primary }}>{metric.value}</div>
              <div className="mt-3">
                <DeltaPill delta={metric.delta} invert={metric.invert}>
                  {metric.deltaText ?? ""}
                </DeltaPill>
              </div>
            </div>
          ))}
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <h2 className="font-display text-2xl font-bold tracking-tight">What changed since the last snapshot</h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">{getRecapSentence(comparison)}</p>
              {comparison.previousCreatedAt ? (
                <p className="mt-1 text-xs text-slate-500">Previous shared snapshot: {formatDateTime(comparison.previousCreatedAt)}</p>
              ) : null}
            </div>
          </div>

          <div className="mt-5 grid gap-4 lg:grid-cols-3">
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Pages with the biggest movement</div>
              <div className="mt-3 space-y-2">
                {comparison.pageMovements.length ? comparison.pageMovements.slice(0, 4).map((row) => (
                  <div key={row.label} className="flex items-center justify-between gap-3 text-sm">
                    <span className="min-w-0 truncate font-medium">{row.label}</span>
                    <span className={row.delta >= 0 ? "font-semibold text-emerald-700" : "font-semibold text-rose-700"}>
                      {row.delta >= 0 ? "+" : ""}{formatNumber(row.delta)}
                    </span>
                  </div>
                )) : (
                  <p className="text-sm text-slate-500">No page movement is available yet.</p>
                )}
              </div>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Queries with the biggest movement</div>
              <div className="mt-3 space-y-2">
                {comparison.queryMovements.length ? comparison.queryMovements.slice(0, 4).map((row) => (
                  <div key={row.label} className="flex items-center justify-between gap-3 text-sm">
                    <span className="min-w-0 truncate font-medium">{row.label}</span>
                    <span className={row.delta >= 0 ? "font-semibold text-emerald-700" : "font-semibold text-rose-700"}>
                      {row.delta >= 0 ? "+" : ""}{formatNumber(row.delta)}
                    </span>
                  </div>
                )) : (
                  <p className="text-sm text-slate-500">No query movement is available yet.</p>
                )}
              </div>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Completed and detected changes</div>
              <div className="mt-3 space-y-3">
                {comparison.completedWork.length ? comparison.completedWork.slice(0, 3).map((item) => (
                  <div key={`${item.title}:${item.target}`} className="flex gap-2 text-sm">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                    <div>
                      <div className="font-medium">{item.title}</div>
                      <div className="text-slate-500">{item.firstVisibleWin}</div>
                    </div>
                  </div>
                )) : comparison.changedPages.length ? comparison.changedPages.slice(0, 3).map((item) => (
                  <div key={item.url} className="text-sm">
                    <div className="truncate font-medium">{item.url}</div>
                    <div className="text-slate-500">Page content changed during this snapshot period.</div>
                  </div>
                )) : (
                  <p className="text-sm text-slate-500">No completed changes were recorded for this snapshot period.</p>
                )}
              </div>
            </div>
          </div>
        </section>

        <PropertyShareTrendChart trend={dashboard.trend} primary={primary} accent={accent} />

        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-1">
            <h2 className="font-display text-2xl font-bold tracking-tight">Top pages</h2>
            <p className="text-sm text-slate-500">Pages that contributed most to traffic in this snapshot period.</p>
          </div>
          <div className="mt-4 overflow-x-auto rounded-lg border border-slate-200">
            <table className="w-full min-w-[720px] text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3 text-left">Page</th>
                  <th className="px-4 py-3 text-right">Clicks</th>
                  <th className="px-4 py-3 text-right">Previous</th>
                  <th className="px-4 py-3 text-right">Change</th>
                  <th className="px-4 py-3 text-left">Movement</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {dashboard.evidence.pageWinnersLosers.slice(0, 8).map((row) => {
                  const delta = row.clicksCurrent - row.clicksCompare;
                  return (
                    <tr key={row.page}>
                      <td className="max-w-[360px] truncate px-4 py-3 font-medium">{row.page}</td>
                      <td className="px-4 py-3 text-right">{formatNumber(row.clicksCurrent)}</td>
                      <td className="px-4 py-3 text-right text-slate-500">{formatNumber(row.clicksCompare)}</td>
                      <td className={`px-4 py-3 text-right font-semibold ${delta >= 0 ? "text-emerald-700" : "text-rose-700"}`}>
                        {delta >= 0 ? "+" : ""}{formatNumber(delta)}
                      </td>
                      <td className="px-4 py-3 text-slate-600">{row.status}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-1">
            <h2 className="font-display text-2xl font-bold tracking-tight">Top queries</h2>
            <p className="text-sm text-slate-500">Search terms that brought visibility and clicks during this snapshot period.</p>
          </div>
          <div className="mt-4 overflow-x-auto rounded-lg border border-slate-200">
            <table className="w-full min-w-[720px] text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3 text-left">Query</th>
                  <th className="px-4 py-3 text-right">Clicks</th>
                  <th className="px-4 py-3 text-right">Impressions</th>
                  <th className="px-4 py-3 text-right">CTR</th>
                  <th className="px-4 py-3 text-right">Position</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {dashboard.evidence.queryOpportunities.slice(0, 8).map((row) => (
                  <tr key={row.query}>
                    <td className="max-w-[360px] truncate px-4 py-3 font-medium">{row.query}</td>
                    <td className="px-4 py-3 text-right">{formatNumber(row.clicks)}</td>
                    <td className="px-4 py-3 text-right">{formatNumber(row.impressions)}</td>
                    <td className="px-4 py-3 text-right">{formatPercent(row.ctr)}</td>
                    <td className="px-4 py-3 text-right">{formatPosition(row.position)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {brand.footerNote ? (
          <footer className="rounded-lg border border-slate-200 bg-white p-5 text-sm text-slate-600 shadow-sm">
            {brand.footerNote}
          </footer>
        ) : null}
      </div>
    </main>
  );
}
