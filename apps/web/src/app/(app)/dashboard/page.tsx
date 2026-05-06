import Link from "next/link";
import { headers } from "next/headers";
import { AlertCircle, ArrowRight, Bot, Globe2 } from "lucide-react";
import { auth } from "@webhealth/shared/lib/auth";
import { db } from "@webhealth/shared/db";
import { eq } from "drizzle-orm";
import { properties as propertiesSchema, user as userSchema } from "@webhealth/shared/db/schema";
import { getWorkspaceActionBoard } from "@webhealth/shared/lib/live-dashboard";
import { getAiRunCenterData, type AiRunCenterData } from "@webhealth/shared/lib/ai-run-center";
import { isAdminEmail } from "@webhealth/shared/lib/admin-access";
import { recordProductEvent } from "@webhealth/shared/lib/product-event-store";
import { listTeamCombinedReportableProperties } from "@webhealth/shared/lib/properties/reportable-properties-db";
import { OnboardingModal } from "./onboarding-modal";
import { shouldOpenOnboardingModal } from "./onboarding-modal.logic";
import { WorkspaceActionBoard } from "./workspace-action-board";
import { ManagePropertiesDialog } from "./manage-properties-dialog";
import { SetupDismissButton } from "./setup-dismiss-button";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams?: Promise<{ view?: string }>;
}) {
  const params = await searchParams;
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  const userTeams = await db.query.teamMembers.findMany({
    where: (table, { eq: eqFn }) => eqFn(table.userId, session!.user.id),
  });
  const currentUser = await db.query.user.findFirst({
    where: eq(userSchema.id, session!.user.id),
    columns: { onboardingCompletedAt: true },
  });

  let propertyCount = 0;
  let websites: Awaited<ReturnType<typeof listTeamCombinedReportableProperties>> = [];
  let allProperties: Array<{
    id: string;
    name: string;
    url: string;
    type: string;
    active: boolean;
    ga4PropertyId: string | null;
  }> = [];
  let dismissedSetupPropertyIds = new Set<string>();
  let workspaceBoard: Awaited<ReturnType<typeof getWorkspaceActionBoard>> | null = null;

  if (userTeams.length > 0) {
    const targetTeamId = userTeams[0].teamId;
    void recordProductEvent({
      teamId: targetTeamId,
      userId: session!.user.id,
      name: "dashboard_opened",
      source: "dashboard",
      entityType: "dashboard",
      entityId: params?.view === "ai-insights" ? "ai-insights" : "overview",
      properties: { view: params?.view ?? "overview" },
    }).catch(() => {});

    if (params?.view === "ai-insights") {
      const isAdmin = await isAdminEmail(session!.user.email ?? null);
      const aiRunCenter = await getAiRunCenterData(targetTeamId);
      return <AiRunCenterView data={aiRunCenter} isAdmin={isAdmin} />;
    }

    const userProperties = await db.query.properties.findMany({
      where: eq(propertiesSchema.teamId, targetTeamId),
    });
    const setupDismissals = await db.query.propertySetupDismissals.findMany({
      where: (table, { and, eq: eqFn }) =>
        and(eqFn(table.teamId, targetTeamId), eqFn(table.userId, session!.user.id)),
      columns: { propertyId: true },
    });

    allProperties = userProperties.map((property) => ({
      id: property.id,
      name: property.name,
      url: property.url,
      type: property.type,
      active: property.active,
      ga4PropertyId: property.ga4PropertyId,
    }));
    propertyCount = userProperties.filter((property) => property.active).length;
    dismissedSetupPropertyIds = new Set(setupDismissals.map((dismissal) => dismissal.propertyId));
    [websites, workspaceBoard] = await Promise.all([
      listTeamCombinedReportableProperties(targetTeamId),
      getWorkspaceActionBoard(targetTeamId),
    ]);
  }

  return (
    <div className="space-y-8">
      <OnboardingModal
        initialProperties={allProperties}
        shouldShow={shouldOpenOnboardingModal({
          onboardingCompletedAt: currentUser?.onboardingCompletedAt,
        })}
      />

      <div>
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Open a live website dashboard</h1>
          <p className="mt-1 max-w-2xl text-muted-foreground">
            Use this page as a launcher. Website analysis now lives at the property level, with snapshots as historical context.
          </p>
        </div>
      </div>

      <section className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold tracking-tight">Portfolio Websites overview</h2>
            <p className="text-sm text-muted-foreground">Pick a site to open its live decision surface.</p>
          </div>
          <ManagePropertiesDialog properties={allProperties} />
        </div>

        {websites.length ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {websites.map((website) => (
              <WebsiteLauncherCard
                key={website.id}
                website={website}
                setupDismissed={dismissedSetupPropertyIds.has(website.id)}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-border/70 bg-card/90 p-8 text-center text-muted-foreground shadow-sm">
            Activate a synced property first. The live dashboard is created from your active website sources.
          </div>
        )}
      </section>

      <div className="grid gap-3 md:grid-cols-2">
        <div className="rounded-lg border border-border/70 bg-card/90 p-4 shadow-sm">
          <div className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">Active sources</div>
          <div className="mt-1 text-2xl font-semibold tracking-tight">{propertyCount}</div>
          <p className="mt-1 text-xs text-muted-foreground">Synced sources enabled for dashboard work.</p>
        </div>
        <div className="rounded-lg border border-border/70 bg-card/90 p-4 shadow-sm">
          <div className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">Live dashboards</div>
          <div className="mt-1 text-2xl font-semibold tracking-tight">{websites.length}</div>
          <p className="mt-1 text-xs text-muted-foreground">Active website surfaces ready for decisions.</p>
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
            <div className="rounded-lg border border-border/70 bg-card/90 p-5 shadow-sm">
              <div className="mb-4">
                <h3 className="text-lg font-semibold tracking-tight">Open actions across websites</h3>
                <p className="text-sm text-muted-foreground">System rank stays primary. Property status stays visible.</p>
              </div>
              <WorkspaceActionBoard board={workspaceBoard} />
            </div>

            <div className="rounded-lg border border-border/70 bg-card/90 p-5 shadow-sm">
              <div className="mb-4">
                <h3 className="text-lg font-semibold tracking-tight">Properties needing attention</h3>
                <p className="text-sm text-muted-foreground">Refresh failures and active background work stay visible here.</p>
              </div>
              <div className="space-y-3">
                {workspaceBoard.propertiesNeedingAttention.length ? workspaceBoard.propertiesNeedingAttention.map((property) => (
                  <Link
                    key={property.propertyId}
                    href={`/properties/${encodeURIComponent(property.propertyId)}`}
                    className="block rounded-lg border border-border/70 px-4 py-3 transition-colors hover:border-primary/30 hover:bg-primary/[0.04]"
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
                  <div className="rounded-lg border border-border/70 px-4 py-6 text-sm text-muted-foreground">No properties are currently refreshing or failed.</div>
                )}
              </div>
            </div>
          </div>
        </section>
      ) : null}

    </div>
  );
}

function formatUsd(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 4,
  }).format(value);
}

function formatDate(value: string) {
  return new Date(value).toLocaleString();
}

function AiRunCenterView({ data, isAdmin }: { data: AiRunCenterData; isAdmin: boolean }) {
  const visibleRuns = isAdmin ? data.runs : data.runs.filter((run) => run.status !== "failed");
  const visibleCounts = isAdmin
    ? data.counts
    : {
        ...data.counts,
        failed: 0,
        total: data.counts.queued + data.counts.processing + data.counts.complete,
      };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">AI Run Center</h1>
          <p className="mt-1 max-w-2xl text-muted-foreground">
            Monitor AI review work across active properties. Property dashboards remain the source of ranked fix-list execution.
          </p>
        </div>
        {isAdmin ? (
          <div className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm text-muted-foreground">
            <Bot className="h-4 w-4" />
            <span>Estimated spend: {formatUsd(data.estimatedCostUsd)}</span>
          </div>
        ) : null}
      </div>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <SummaryTile label="Queued" value={visibleCounts.queued} description="Waiting to start" />
        <SummaryTile label="Processing" value={visibleCounts.processing} description="Currently running" />
        <SummaryTile label="Complete" value={visibleCounts.complete} description="Finished reviews" />
        {isAdmin ? <SummaryTile label="Failed" value={visibleCounts.failed} description="Needs retry or review" /> : null}
        <SummaryTile label="Total" value={visibleCounts.total} description="Tracked AI runs" />
      </section>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.3fr)_minmax(320px,0.7fr)]">
        <section className="rounded-lg border border-border bg-card p-5 shadow-sm">
          <div className="mb-4">
            <h2 className="font-display text-lg font-semibold">Recent AI runs</h2>
            <p className="text-sm text-muted-foreground">Latest source-summary and analyzer jobs by property.</p>
          </div>
          <div className="overflow-x-auto">
            <table className={`w-full text-left text-sm ${isAdmin ? "min-w-[760px]" : "min-w-[520px]"}`}>
              <thead className="border-b text-xs uppercase tracking-[0.12em] text-muted-foreground">
                <tr>
                  <th className="py-2 pr-4">Property</th>
                  <th className="py-2 pr-4">Status</th>
                  <th className="py-2 pr-4">Phase</th>
                  {isAdmin ? <th className="py-2 pr-4">Model</th> : null}
                  {isAdmin ? <th className="py-2 pr-4">Cost</th> : null}
                  {isAdmin ? <th className="py-2 pr-4">Updated</th> : null}
                </tr>
              </thead>
              <tbody className="divide-y">
                {visibleRuns.map((run) => {
                  const statusLabel = isAdmin ? run.status : run.status === "failed" ? "needs review" : run.status;
                  const phaseLabel = isAdmin ? run.phase : run.status === "failed" ? "review" : run.phase;

                  return (
                    <tr key={run.id}>
                      <td className="py-3 pr-4">
                        <div className="font-medium">{run.propertyName}</div>
                        <div className="text-xs text-muted-foreground">{run.propertyId}</div>
                        {isAdmin && run.error ? (
                          <pre className="mt-2 max-h-24 overflow-auto rounded-lg border border-destructive/20 bg-destructive/5 p-2 text-xs whitespace-pre-wrap text-destructive">
                            {run.error}
                          </pre>
                        ) : null}
                      </td>
                      <td className="py-3 pr-4">{statusLabel}</td>
                      <td className="py-3 pr-4">{phaseLabel}</td>
                      {isAdmin ? <td className="py-3 pr-4">{run.analyzerModel ?? "-"}</td> : null}
                      {isAdmin ? <td className="py-3 pr-4">{run.costEstimateUsd ? formatUsd(Number(run.costEstimateUsd)) : "-"}</td> : null}
                      {isAdmin ? <td className="py-3 pr-4">{formatDate(run.updatedAt)}</td> : null}
                    </tr>
                  );
                })}
                {!visibleRuns.length ? (
                  <tr>
                    <td colSpan={isAdmin ? 6 : 3} className="py-8 text-center text-muted-foreground">
                      No AI runs have been recorded yet.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </section>

        <section className="rounded-lg border border-border bg-card p-5 shadow-sm">
          <div className="mb-4">
            <h2 className="font-display text-lg font-semibold">Latest AI findings</h2>
            <p className="text-sm text-muted-foreground">Evidence-backed findings that can appear in ranked fix lists.</p>
          </div>
          <div className="space-y-3">
            {data.recommendations.map((item) => (
              <div key={item.id} className="rounded-lg border border-border/70 p-4">
                <div className="flex items-start gap-2">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <div>
                    <div className="text-sm font-medium">{item.title}</div>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      <span className="rounded-lg border border-primary/25 bg-primary/5 px-2 py-1 text-xs font-medium text-primary">
                        {item.propertyName}
                      </span>
                      <span className="rounded-lg border border-border bg-muted/40 px-2 py-1 text-xs font-medium text-foreground">
                        {item.area}
                      </span>
                      <span className="rounded-lg border border-emerald-200 bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-300">
                        {item.confidence}
                      </span>
                    </div>
                    <div className="mt-2 break-all text-xs text-muted-foreground">{item.targetKey}</div>
                  </div>
                </div>
              </div>
            ))}
            {!data.recommendations.length ? (
              <div className="rounded-lg border border-border/70 px-4 py-6 text-sm text-muted-foreground">
                No AI recommendations have been saved yet.
              </div>
            ) : null}
          </div>
        </section>
      </div>
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
    <div className="rounded-lg border border-border/70 bg-card/90 p-4 shadow-sm">
      <div className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">{label}</div>
      <div className="mt-2 text-3xl font-semibold tracking-tight">{value}</div>
      <p className="mt-2 text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

type WebsiteLauncherCardProps = {
  website: Awaited<ReturnType<typeof listTeamCombinedReportableProperties>>[number];
};

function WebsiteLauncherCard({ website, setupDismissed }: WebsiteLauncherCardProps & { setupDismissed: boolean }) {
  const statusLabel = website.isLinked ? "Linked" : website.sourceCoverage === "ga4_only" ? "GA4 only" : "GSC only";
  const statusClassName = website.isLinked
    ? "border-emerald-200/80 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300"
    : "border-amber-200/80 bg-amber-50 text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-300";
  const sourceCount = website.isLinked ? "2" : "1";
  const sourceMix = website.isLinked ? "GSC + GA4" : website.sourceCoverage === "ga4_only" ? "GA4 only" : "GSC only";
  const setupSummary = website.isLinked ? "Ready now" : "Limited";
  const setupMessage = website.sourceCoverage === "ga4_only"
    ? "Link Search Console on the Properties page to unlock ranked actions."
    : "Link GA4 on the Properties page to complete traffic context.";

  return (
    <div className="group overflow-hidden rounded-lg border border-border/70 bg-card/95 p-5 shadow-sm transition-colors hover:border-primary/35 hover:bg-card">
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

      {!website.isLinked && !setupDismissed ? (
        <div className="mt-4 flex items-start justify-between gap-3 rounded-lg border border-amber-200/70 bg-amber-50/70 p-3 text-sm text-amber-950 dark:border-amber-900/60 dark:bg-amber-950/25 dark:text-amber-100">
          <p>{setupMessage}</p>
          <SetupDismissButton propertyId={website.id} />
        </div>
      ) : null}

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
            <span className="font-semibold text-foreground">{website.isLinked ? "GSC + GA4 linked" : setupMessage}</span>
          </div>
          <Link
            href={`/properties/${encodeURIComponent(website.id)}`}
            className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-primary transition-transform group-hover:translate-x-0.5"
          >
            Open dashboard
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <p className="mt-2 truncate text-sm text-muted-foreground">{website.gscUrl ?? website.ga4Name ?? website.id}</p>
      </div>
    </div>
  );
}
