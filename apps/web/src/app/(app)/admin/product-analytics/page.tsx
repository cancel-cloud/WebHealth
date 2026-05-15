import { desc, sql } from "drizzle-orm";
import { db } from "@webhealth/shared/db";
import { openaiCostLedger, productEvents } from "@webhealth/shared/db/schema";
import { ProductAnalyticsCharts } from "./product-analytics-charts";
import { PosthogInstallCheck } from "./posthog-install-check";
import {
  buildActualSpendSeries,
  buildActualSpendSummary,
  buildEstimatedSpendSeries,
  buildEstimatedSpendSummary,
  buildJobThroughputSeries,
  type JobThroughputRow,
} from "./page.logic";
import { buildPosthogInstallCheckConfigStatus } from "@/app/api/admin/posthog/install-check/route.logic";
import { resolvePosthogProjectToken } from "@webhealth/shared/lib/product-events";

type MetricRow = {
  label: string;
  value: number;
};

type TeamUsageRow = {
  team_id: string;
  team_name: string;
  snapshot_count: number;
  share_link_count: number;
  action_count: number;
  action_done_count: number;
  source_data_refresh_count: number;
  property_refresh_count: number;
  property_open_count: number;
  last_activity_at: Date | string | null;
};

type DailyActualCostRow = { sourceDate: string; totalUsd: string | null };
type DailyEstimatedCostRow = DailyActualCostRow;
type RecentProductEvent = {
  id: string;
  name: string;
  source: string;
  createdAt: Date;
};

function formatUsdDisplay(amount: string | number) {
  const value = Number(amount);
  if (!Number.isFinite(value)) return "$0.00";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: value >= 1 ? 2 : 4,
    maximumFractionDigits: value >= 1 ? 2 : 4,
  }).format(value);
}

export default async function ProductAnalyticsPage() {
  const [
    actualDailyCostRows,
    estimatedDailyCostRows,
    metricsJobStatusRows,
    propertyRefreshStatusRows,
    snapshotStatusRows,
    metricRows,
    teamActivityRows,
    recentProductEventRows,
  ] = await Promise.all([
    db.execute(sql<DailyActualCostRow>`
      select source_date::text as "sourceDate", sum(amount_usd)::text as "totalUsd"
      from openai_daily_costs
      group by source_date
      order by source_date desc
      limit 60
    `),
    db.execute(sql<DailyEstimatedCostRow>`
      select created_at::date::text as "sourceDate", sum(cost_estimate_usd)::text as "totalUsd"
      from ${openaiCostLedger}
      where outcome = 'succeeded'
      group by created_at::date
      order by created_at::date desc
      limit 60
    `),
    db.execute(sql<{ family: "source_data"; status: string; count: number }>`
      select 'source_data' as family, status, count(*)::int as count
      from metrics_backfill_jobs
      group by status
    `),
    db.execute(sql<{ family: "property_refresh"; status: string; count: number }>`
      select 'property_refresh' as family, status, count(*)::int as count
      from property_refresh_jobs
      group by status
    `),
    db.execute(sql<{ family: "snapshot"; status: string; count: number }>`
      select 'snapshot' as family, 'complete' as status, count(*)::int as count
      from snapshot_exports
    `),
    db.execute(sql<MetricRow>`
      select 'Snapshots captured' as label, count(*)::int as value from snapshot_exports
      union all
      select 'Share links created' as label, count(*)::int as value from property_share_links
      union all
      select 'Source-data refresh jobs' as label, count(*)::int as value from metrics_backfill_jobs
      union all
      select 'Property refresh jobs' as label, count(*)::int as value from property_refresh_jobs
      union all
      select 'Open action items' as label, count(*)::int as value from action_items where state = 'open'
      union all
      select 'Completed action items' as label, count(*)::int as value from action_items where state = 'done'
    `),
    db.execute(sql<TeamUsageRow>`
      with snapshots as (
        select team_id, count(*)::int as snapshot_count, max(created_at) as last_snapshot_at
        from snapshot_exports
        group by team_id
      ),
      shares as (
        select team_id, count(*)::int as share_link_count, max(created_at) as last_share_at
        from property_share_links
        group by team_id
      ),
      actions as (
        select
          team_id,
          count(*)::int as action_count,
          count(*) filter (where state = 'done')::int as action_done_count,
          max(updated_at) as last_action_at
        from action_items
        group by team_id
      ),
      source_refreshes as (
        select team_id, count(*)::int as source_data_refresh_count, max(created_at) as last_source_refresh_at
        from metrics_backfill_jobs
        group by team_id
      ),
      property_refreshes as (
        select team_id, count(*)::int as property_refresh_count, max(created_at) as last_property_refresh_at
        from property_refresh_jobs
        group by team_id
      ),
      events as (
        select
          team_id,
          count(*) filter (where name in ('snapshot_opened', 'snapshot_captured', 'snapshot_share_created'))::int as property_open_count,
          max(created_at) as last_event_at
        from product_events
        group by team_id
      )
      select
        t.id as team_id,
        t.name as team_name,
        coalesce(snapshots.snapshot_count, 0)::int as snapshot_count,
        coalesce(shares.share_link_count, 0)::int as share_link_count,
        coalesce(actions.action_count, 0)::int as action_count,
        coalesce(actions.action_done_count, 0)::int as action_done_count,
        coalesce(source_refreshes.source_data_refresh_count, 0)::int as source_data_refresh_count,
        coalesce(property_refreshes.property_refresh_count, 0)::int as property_refresh_count,
        coalesce(events.property_open_count, 0)::int as property_open_count,
        greatest(
          coalesce(snapshots.last_snapshot_at, t.created_at),
          coalesce(shares.last_share_at, t.created_at),
          coalesce(actions.last_action_at, t.created_at),
          coalesce(source_refreshes.last_source_refresh_at, t.created_at),
          coalesce(property_refreshes.last_property_refresh_at, t.created_at),
          coalesce(events.last_event_at, t.created_at)
        ) as last_activity_at
      from teams t
      left join snapshots on snapshots.team_id = t.id
      left join shares on shares.team_id = t.id
      left join actions on actions.team_id = t.id
      left join source_refreshes on source_refreshes.team_id = t.id
      left join property_refreshes on property_refreshes.team_id = t.id
      left join events on events.team_id = t.id
      order by last_activity_at desc, t.name asc
      limit 50
    `),
    db
      .select({
        id: productEvents.id,
        name: productEvents.name,
        source: productEvents.source,
        createdAt: productEvents.createdAt,
      })
      .from(productEvents)
      .orderBy(desc(productEvents.createdAt))
      .limit(8),
  ]);

  const actualDailyCosts = Array.from(actualDailyCostRows).map((row) => ({
    sourceDate: String(row.sourceDate ?? ""),
    totalUsd: row.totalUsd == null ? null : String(row.totalUsd),
  }));
  const actualSpendSeries = buildActualSpendSeries(actualDailyCosts);
  const actualSpendTotal = buildActualSpendSummary(actualDailyCosts);
  const estimatedDailyCosts = Array.from(estimatedDailyCostRows).map((row) => ({
    sourceDate: String(row.sourceDate ?? ""),
    totalUsd: row.totalUsd == null ? null : String(row.totalUsd),
  }));
  const estimatedSpendSeries = buildEstimatedSpendSeries(estimatedDailyCosts);
  const estimatedSpendTotal = buildEstimatedSpendSummary(estimatedDailyCosts);
  const jobThroughputSeries = buildJobThroughputSeries([
    ...Array.from(metricsJobStatusRows),
    ...Array.from(propertyRefreshStatusRows),
    ...Array.from(snapshotStatusRows),
  ] as JobThroughputRow[]);
  const metrics = Array.from(metricRows).map((row) => ({
    label: String(row.label ?? ""),
    value: Number(row.value ?? 0),
  }));
  const teamActivity = Array.from(teamActivityRows).map((row) => ({
    team_id: String(row.team_id ?? ""),
    team_name: String(row.team_name ?? ""),
    snapshot_count: Number(row.snapshot_count ?? 0),
    share_link_count: Number(row.share_link_count ?? 0),
    action_count: Number(row.action_count ?? 0),
    action_done_count: Number(row.action_done_count ?? 0),
    source_data_refresh_count: Number(row.source_data_refresh_count ?? 0),
    property_refresh_count: Number(row.property_refresh_count ?? 0),
    property_open_count: Number(row.property_open_count ?? 0),
    last_activity_at: row.last_activity_at == null ? null : String(row.last_activity_at),
  }));
  const recentProductEvents: RecentProductEvent[] = recentProductEventRows.map((row) => ({
    id: row.id,
    name: row.name,
    source: row.source,
    createdAt: row.createdAt,
  }));
  const posthogConfig = buildPosthogInstallCheckConfigStatus({
    projectToken: resolvePosthogProjectToken(process.env),
    browserKey: process.env.NEXT_PUBLIC_POSTHOG_KEY,
    captureHost: process.env.POSTHOG_CAPTURE_HOST ?? process.env.POSTHOG_HOST,
    projectId: process.env.POSTHOG_PROJECT_ID,
    uiHost: process.env.POSTHOG_UI_HOST,
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight font-display">Product Analytics</h1>
        <p className="mt-1 text-muted-foreground">
          Product usage, snapshots, source-data jobs, property refreshes, OpenAI billed cost, and AI run estimates.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-lg border border-border bg-card p-5 shadow-sm">
          <p className="text-sm text-muted-foreground">OpenAI billed cost</p>
          <p className="mt-2 text-3xl font-bold font-display">{formatUsdDisplay(actualSpendTotal)}</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-5 shadow-sm">
          <p className="text-sm text-muted-foreground">AI run estimate</p>
          <p className="mt-2 text-3xl font-bold font-display">{formatUsdDisplay(estimatedSpendTotal)}</p>
        </div>
        {metrics.slice(0, 2).map((metric) => (
          <div key={metric.label} className="rounded-lg border border-border bg-card p-5 shadow-sm">
            <p className="text-sm text-muted-foreground">{metric.label}</p>
            <p className="mt-2 text-3xl font-bold font-display">{metric.value}</p>
          </div>
        ))}
      </div>

      <ProductAnalyticsCharts
        actualSpend={actualSpendSeries}
        estimatedSpend={estimatedSpendSeries}
        jobThroughput={jobThroughputSeries}
      />

      <PosthogInstallCheck initialConfig={posthogConfig} />

      <section className="rounded-lg border border-border bg-card p-5 shadow-sm">
        <h2 className="text-xl font-semibold font-display">Recent Product Events</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-muted-foreground">
                <th className="py-2 pr-4 font-medium">Event</th>
                <th className="py-2 pr-4 font-medium">Source</th>
                <th className="py-2 font-medium">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {recentProductEvents.map((event) => (
                <tr key={event.id}>
                  <td className="py-3 pr-4 font-medium text-foreground">{event.name}</td>
                  <td className="py-3 pr-4">{event.source}</td>
                  <td className="py-3">{event.createdAt.toLocaleString()}</td>
                </tr>
              ))}
              {!recentProductEvents.length ? (
                <tr>
                  <td className="py-3 text-muted-foreground" colSpan={3}>
                    No product events have been stored locally yet.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-4">
        {metrics.slice(2).map((metric) => (
          <div key={metric.label} className="rounded-lg border border-border bg-card p-5 shadow-sm">
            <p className="text-sm text-muted-foreground">{metric.label}</p>
            <p className="mt-2 text-3xl font-bold font-display">{metric.value}</p>
          </div>
        ))}
      </div>

      <section className="rounded-lg border border-border bg-card p-5 shadow-sm">
        <h2 className="text-xl font-semibold font-display">Team Usage</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[960px] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-muted-foreground">
                <th className="py-2 pr-4 font-medium">Team</th>
                <th className="py-2 pr-4 font-medium">Snapshots</th>
                <th className="py-2 pr-4 font-medium">Share Links</th>
                <th className="py-2 pr-4 font-medium">Actions</th>
                <th className="py-2 pr-4 font-medium">Done</th>
                <th className="py-2 pr-4 font-medium">Source Jobs</th>
                <th className="py-2 pr-4 font-medium">Refresh Jobs</th>
                <th className="py-2 pr-4 font-medium">Opens</th>
                <th className="py-2 font-medium">Last Activity</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {teamActivity.map((row) => (
                <tr key={row.team_id}>
                  <td className="py-3 pr-4">
                    <div className="font-medium text-foreground">{row.team_name}</div>
                    <div className="text-xs text-muted-foreground">{row.team_id}</div>
                  </td>
                  <td className="py-3 pr-4">{row.snapshot_count}</td>
                  <td className="py-3 pr-4">{row.share_link_count}</td>
                  <td className="py-3 pr-4">{row.action_count}</td>
                  <td className="py-3 pr-4">{row.action_done_count}</td>
                  <td className="py-3 pr-4">{row.source_data_refresh_count}</td>
                  <td className="py-3 pr-4">{row.property_refresh_count}</td>
                  <td className="py-3 pr-4">{row.property_open_count}</td>
                  <td className="py-3">
                    {row.last_activity_at ? new Date(row.last_activity_at).toLocaleString() : "Never"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
