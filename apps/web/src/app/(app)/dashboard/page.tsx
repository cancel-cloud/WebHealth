import Link from "next/link";
import { headers } from "next/headers";
import { ArrowRight, Globe2 } from "lucide-react";
import { auth } from "@webhealth/shared/lib/auth";
import { db } from "@webhealth/shared/db";
import { count, eq } from "drizzle-orm";
import { properties as propertiesSchema, reports as reportsSchema } from "@webhealth/shared/db/schema";
import { getWorkspaceActionBoard } from "@webhealth/shared/lib/live-dashboard";
import { listTeamCombinedReportableProperties } from "@webhealth/shared/lib/properties/reportable-properties-db";
import { SyncButton } from "./sync-button";
import { ReportsTable } from "./reports-table";
import { OnboardingModal } from "./onboarding-modal";
import { WeeklyReviewCard } from "./weekly-review-card";
import { WorkspaceActionBoard } from "./workspace-action-board";

export default async function DashboardPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  const userTeams = await db.query.teamMembers.findMany({
    where: (table, { eq: eqFn }) => eqFn(table.userId, session!.user.id),
  });

  let propertyCount = 0;
  let reportCount = 0;
  let hasProperties = false;
  let websites: Awaited<ReturnType<typeof listTeamCombinedReportableProperties>> = [];
  let workspaceBoard: Awaited<ReturnType<typeof getWorkspaceActionBoard>> | null = null;

  if (userTeams.length > 0) {
    const targetTeamId = userTeams[0].teamId;
    const userProperties = await db.query.properties.findMany({
      where: eq(propertiesSchema.teamId, targetTeamId),
    });
    const [reportCountRow] = await db
      .select({ count: count(reportsSchema.id) })
      .from(reportsSchema)
      .where(eq(reportsSchema.teamId, targetTeamId));

    propertyCount = userProperties.length;
    reportCount = reportCountRow?.count ?? 0;
    hasProperties = userProperties.length > 0;
    [websites, workspaceBoard] = await Promise.all([
      listTeamCombinedReportableProperties(targetTeamId),
      getWorkspaceActionBoard(targetTeamId),
    ]);
  }

  return (
    <div className="space-y-8">
      <OnboardingModal hasProperties={hasProperties} />

      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Open a live website dashboard</h1>
          <p className="mt-1 max-w-2xl text-muted-foreground">
            Use this page as a launcher. Website analysis now lives at the property level, while reports stay secondary history artifacts.
          </p>
        </div>
        <SyncButton />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-[24px] border border-border/70 bg-card/90 p-5 shadow-sm">
          <div className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">Properties</div>
          <div className="mt-2 text-3xl font-semibold tracking-tight">{propertyCount}</div>
          <p className="mt-2 text-sm text-muted-foreground">Connected sources across Search Console and Analytics.</p>
        </div>
        <div className="rounded-[24px] border border-border/70 bg-card/90 p-5 shadow-sm">
          <div className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">Live dashboards</div>
          <div className="mt-2 text-3xl font-semibold tracking-tight">{websites.length}</div>
          <p className="mt-2 text-sm text-muted-foreground">Canonical website surfaces ready for decision-making.</p>
        </div>
        <div className="rounded-[24px] border border-border/70 bg-card/90 p-5 shadow-sm">
          <div className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">Reports</div>
          <div className="mt-2 text-3xl font-semibold tracking-tight">{reportCount}</div>
          <p className="mt-2 text-sm text-muted-foreground">Snapshot history remains available, but it no longer owns the product.</p>
        </div>
      </div>

      {workspaceBoard ? (
        <section className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold tracking-tight">Workspace action board</h2>
              <p className="text-sm text-muted-foreground">Operate the whole workspace here first, then drop into a property when you need evidence.</p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-5">
            <SummaryTile label="Open" value={workspaceBoard.counts.open} description="Unresolved actions across sites" />
            <SummaryTile label="In progress" value={workspaceBoard.counts.inProgress} description="Actions currently being worked" />
            <SummaryTile label="Snoozed" value={workspaceBoard.counts.snoozed} description="Deferred follow-up work" />
            <SummaryTile label="Critical" value={workspaceBoard.counts.blocked} description="Pinned or top-ranked blockers" />
            <SummaryTile label="Refreshing" value={workspaceBoard.counts.refreshing} description="Properties updating in the background" />
          </div>

          <div className="grid gap-4 xl:grid-cols-[minmax(0,1.4fr)_minmax(320px,0.6fr)]">
            <div className="rounded-[24px] border border-border/70 bg-card/90 p-5 shadow-sm">
              <div className="mb-4">
                <h3 className="text-lg font-semibold tracking-tight">Open actions across websites</h3>
                <p className="text-sm text-muted-foreground">System rank stays primary. Property status stays visible.</p>
              </div>
              <WorkspaceActionBoard board={workspaceBoard} />
            </div>

            <div className="rounded-[24px] border border-border/70 bg-card/90 p-5 shadow-sm">
              <div className="mb-4">
                <h3 className="text-lg font-semibold tracking-tight">Properties needing attention</h3>
                <p className="text-sm text-muted-foreground">Refresh failures and active background work stay visible here.</p>
              </div>
              <div className="space-y-3">
                {workspaceBoard.propertiesNeedingAttention.length ? workspaceBoard.propertiesNeedingAttention.map((property) => (
                  <Link
                    key={property.propertyId}
                    href={`/properties/${encodeURIComponent(property.propertyId)}`}
                    className="block rounded-[18px] border border-border/70 px-4 py-3 transition-colors hover:border-primary/30 hover:bg-primary/[0.04]"
                  >
                    <div className="text-sm font-medium">{property.propertyName}</div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      {property.refreshState?.message
                        ?? (property.crawlState.missing
                          ? "No technical scan captured yet."
                          : property.crawlState.stale
                            ? "Technical scan is stale."
                            : "Needs review")}
                    </div>
                  </Link>
                )) : (
                  <div className="rounded-[18px] border border-border/70 px-4 py-6 text-sm text-muted-foreground">No properties are currently refreshing or failed.</div>
                )}
              </div>
            </div>
          </div>
        </section>
      ) : null}

      <section className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold tracking-tight">Portfolio Websites overview</h2>
            <p className="text-sm text-muted-foreground">Pick a site to open its live decision surface.</p>
          </div>
          <Link href="/properties" className="text-sm font-medium text-primary hover:text-primary/80">
            Manage properties
          </Link>
        </div>

        {websites.length ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {websites.map((website) => (
              <WebsiteLauncherCard key={website.id} website={website} />
            ))}
          </div>
        ) : (
          <div className="rounded-[24px] border border-border/70 bg-card/90 p-8 text-center text-muted-foreground shadow-sm">
            Add and sync a property first. The live dashboard is created from your connected website sources.
          </div>
        )}
      </section>

      <WeeklyReviewCard />

      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Snapshot history</h2>
          <p className="text-sm text-muted-foreground">Generated reports remain available as historical artifacts.</p>
        </div>
        <ReportsTable limit={5} showViewAll />
      </section>
    </div>
  );
}

function SummaryTile({
  label,
  value,
  description,
}: {
  label: string;
  value: number;
  description: string;
}) {
  return (
    <div className="rounded-[24px] border border-border/70 bg-card/90 p-5 shadow-sm">
      <div className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">{label}</div>
      <div className="mt-2 text-3xl font-semibold tracking-tight">{value}</div>
      <p className="mt-2 text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

type WebsiteLauncherCardProps = {
  website: Awaited<ReturnType<typeof listTeamCombinedReportableProperties>>[number];
};

function WebsiteLauncherCard({ website }: WebsiteLauncherCardProps) {
  const statusLabel = website.isLinked ? "Linked" : "Setup needed";
  const statusClassName = website.isLinked
    ? "border-emerald-200/80 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300"
    : "border-amber-200/80 bg-amber-50 text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-300";
  const sourceCount = website.isLinked ? "2" : "1";
  const sourceMix = website.isLinked ? "GSC + GA4" : "GSC only";
  const setupSummary = website.isLinked ? "Ready now" : "Add GA4";

  return (
    <Link
      href={`/properties/${encodeURIComponent(website.id)}`}
      className="group overflow-hidden rounded-[24px] border border-border/70 bg-card/95 p-5 shadow-sm transition-colors hover:border-primary/35 hover:bg-card"
    >
      <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 items-center gap-4">
          <div className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-blue-400 text-primary-foreground shadow-sm">
            <Globe2 className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-2xl font-semibold tracking-tight">{website.label}</h3>
          </div>
        </div>
        <span className={`max-w-full self-start rounded-full border px-3 py-1 text-xs font-medium whitespace-nowrap sm:text-sm ${statusClassName}`}>
          {statusLabel}
        </span>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-6">
        <div>
          <div className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">Sources</div>
          <div className="mt-1 text-3xl font-semibold tracking-tight">{sourceCount}</div>
          <div className="mt-1 text-sm font-medium text-emerald-600 dark:text-emerald-400">{sourceMix}</div>
        </div>
        <div>
          <div className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">Dashboard</div>
          <div className="mt-1 text-3xl font-semibold tracking-tight">Live</div>
          <div className="mt-1 text-sm font-medium text-muted-foreground">{setupSummary}</div>
        </div>
      </div>

      <div className="mt-5 border-t border-dashed border-border/70 pt-4">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0 text-sm text-muted-foreground">
            Source setup:{" "}
            <span className="font-semibold text-foreground">{website.isLinked ? "GSC + GA4 linked" : "Search Console first"}</span>
          </div>
          <span className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-primary transition-transform group-hover:translate-x-0.5">
            Open dashboard
            <ArrowRight className="h-4 w-4" />
          </span>
        </div>
        <p className="mt-2 truncate text-sm text-muted-foreground">{website.gscUrl}</p>
      </div>
    </Link>
  );
}
