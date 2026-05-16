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
import { getUserPreferredLanguage } from "@/lib/server/language";
import type { SupportedLanguage } from "@webhealth/shared/lib/language";

const DASHBOARD_PAGE_COPY = {
  en: {
    title: "Open a live website dashboard",
    subtitle: "Use this page as a launcher. Website analysis now lives at the property level, with snapshots as historical context.",
    portfolioTitle: "Portfolio Websites overview",
    portfolioSubtitle: "Pick a site to open its live decision surface.",
    emptyPortfolio: "Activate a synced property first. The live dashboard is created from your active website sources.",
    activeSources: "Active sources",
    activeSourcesDescription: "Synced sources enabled for dashboard work.",
    liveDashboards: "Live dashboards",
    liveDashboardsDescription: "Active website surfaces ready for decisions.",
    workspaceBoardTitle: "Workspace action board",
    workspaceBoardSubtitle: "Operate the whole workspace here first, then drop into a property when you need evidence.",
    open: "Open",
    openDescription: "Unresolved actions across sites",
    inProgress: "In progress",
    inProgressDescription: "Actions currently being worked",
    snoozed: "Snoozed",
    snoozedDescription: "Deferred follow-up work",
    critical: "Critical",
    criticalDescription: "Pinned or top-ranked blockers",
    refreshing: "Refreshing",
    refreshingDescription: "Properties updating in the background",
    openActionsTitle: "Open actions across websites",
    openActionsSubtitle: "System rank stays primary. Property status stays visible.",
    propertiesAttentionTitle: "Properties needing attention",
    propertiesAttentionSubtitle: "Refresh failures and active background work stay visible here.",
    noTechnicalScan: "No technical scan captured yet.",
    staleTechnicalScan: "Technical scan is stale.",
    needsReview: "Needs review",
    noPropertiesAttention: "No properties are currently refreshing or failed.",
    aiRunCenterTitle: "AI Run Center",
    aiRunCenterSubtitle: "Monitor AI review work across active properties. Property dashboards remain the source of prioritized action-list execution.",
    estimatedSpend: "Estimated spend",
    queued: "Queued",
    queuedDescription: "Waiting to start",
    processing: "Processing",
    processingDescription: "Currently running",
    complete: "Complete",
    completeDescription: "Finished reviews",
    failed: "Failed",
    failedDescription: "Needs retry or review",
    total: "Total",
    totalDescription: "Tracked AI runs",
    recentAiRuns: "Recent AI runs",
    recentAiRunsSubtitle: "Latest source-summary and analyzer jobs by property.",
    property: "Property",
    status: "Status",
    phase: "Phase",
    model: "Model",
    cost: "Cost",
    updated: "Updated",
    noAiRuns: "No AI runs have been recorded yet.",
    latestAiFindings: "Latest AI findings",
    latestAiFindingsSubtitle: "Evidence-backed findings that can appear in prioritized action lists.",
    noAiRecommendations: "No AI recommendations have been saved yet.",
    linked: "Linked",
    ga4Only: "GA4 only",
    gscOnly: "GSC only",
    readyNow: "Ready now",
    limited: "Limited",
    linkGscSetup: "Link Search Console on the Properties page to unlock ranked actions.",
    linkGa4Setup: "Link GA4 on the Properties page to complete traffic context.",
    sources: "Sources",
    dashboard: "Dashboard",
    live: "Live",
    sourceSetup: "Source setup",
    linkedSources: "GSC + GA4 linked",
    openDashboard: "Open dashboard",
  },
  de: {
    title: "Live-Website-Dashboard öffnen",
    subtitle: "Nutze diese Seite als Startpunkt. Website-Analysen liegen auf Property-Ebene, Snapshots liefern den historischen Kontext.",
    portfolioTitle: "Portfolio-Websites",
    portfolioSubtitle: "Wähle eine Site, um die Live-Entscheidungsfläche zu öffnen.",
    emptyPortfolio: "Aktiviere zuerst eine synchronisierte Property. Das Live-Dashboard entsteht aus deinen aktiven Website-Quellen.",
    activeSources: "Aktive Quellen",
    activeSourcesDescription: "Synchronisierte Quellen für Dashboard-Arbeit.",
    liveDashboards: "Live-Dashboards",
    liveDashboardsDescription: "Aktive Website-Flächen bereit für Entscheidungen.",
    workspaceBoardTitle: "Maßnahmenliste im Arbeitsbereich",
    workspaceBoardSubtitle: "Steuere zuerst den gesamten Arbeitsbereich und öffne dann eine Property, wenn du Belege brauchst.",
    open: "Offen",
    openDescription: "Ungelöste Maßnahmen über alle Sites",
    inProgress: "In Arbeit",
    inProgressDescription: "Maßnahmen, die gerade bearbeitet werden",
    snoozed: "Zurückgestellt",
    snoozedDescription: "Auf später verschobene Arbeit",
    critical: "Kritisch",
    criticalDescription: "Gepinnte oder hoch priorisierte Blocker",
    refreshing: "Aktualisiert",
    refreshingDescription: "Properties laufen im Hintergrund",
    openActionsTitle: "Offene Maßnahmen über Websites",
    openActionsSubtitle: "Der Systemrang bleibt führend. Der Property-Status bleibt sichtbar.",
    propertiesAttentionTitle: "Properties mit Handlungsbedarf",
    propertiesAttentionSubtitle: "Fehlgeschlagene Aktualisierungen und laufende Hintergrundarbeit bleiben hier sichtbar.",
    noTechnicalScan: "Noch kein technischer Scan erfasst.",
    staleTechnicalScan: "Der technische Scan ist veraltet.",
    needsReview: "Prüfung nötig",
    noPropertiesAttention: "Aktuell werden keine Properties aktualisiert oder als fehlgeschlagen markiert.",
    aiRunCenterTitle: "KI-Laufcenter",
    aiRunCenterSubtitle: "Überwache KI-Prüfungen über aktive Properties. Property-Dashboards bleiben die Quelle für die priorisierte Maßnahmenliste.",
    estimatedSpend: "Geschätzte Kosten",
    queued: "Wartend",
    queuedDescription: "Wartet auf Start",
    processing: "Läuft",
    processingDescription: "Wird gerade ausgeführt",
    complete: "Abgeschlossen",
    completeDescription: "Fertige Prüfungen",
    failed: "Fehlgeschlagen",
    failedDescription: "Braucht Wiederholung oder Prüfung",
    total: "Gesamt",
    totalDescription: "Erfasste KI-Läufe",
    recentAiRuns: "Neueste KI-Läufe",
    recentAiRunsSubtitle: "Aktuelle Source-Summary- und Analyzer-Jobs je Property.",
    property: "Property",
    status: "Status",
    phase: "Phase",
    model: "Modell",
    cost: "Kosten",
    updated: "Aktualisiert",
    noAiRuns: "Noch keine KI-Läufe erfasst.",
    latestAiFindings: "Neueste KI-Erkenntnisse",
    latestAiFindingsSubtitle: "Beleggestützte Erkenntnisse, die in Maßnahmenlisten erscheinen können.",
    noAiRecommendations: "Noch keine KI-Empfehlungen gespeichert.",
    linked: "Verknüpft",
    ga4Only: "Nur GA4",
    gscOnly: "Nur GSC",
    readyNow: "Bereit",
    limited: "Eingeschränkt",
    linkGscSetup: "Verknüpfe Search Console auf der Properties-Seite, um priorisierte Maßnahmen freizuschalten.",
    linkGa4Setup: "Verknüpfe GA4 auf der Properties-Seite, um den Traffic-Kontext zu vervollständigen.",
    sources: "Quellen",
    dashboard: "Dashboard",
    live: "Live",
    sourceSetup: "Quellen-Setup",
    linkedSources: "GSC + GA4 verknüpft",
    openDashboard: "Dashboard öffnen",
  },
} as const;

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
  const language = await getUserPreferredLanguage(session!.user.id);
  const copy = DASHBOARD_PAGE_COPY[language];

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
      return <AiRunCenterView data={aiRunCenter} isAdmin={isAdmin} language={language} />;
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
          <h1 className="text-3xl font-semibold tracking-tight">{copy.title}</h1>
          <p className="mt-1 max-w-2xl text-muted-foreground">
            {copy.subtitle}
          </p>
        </div>
      </div>

      <section className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold tracking-tight">{copy.portfolioTitle}</h2>
            <p className="text-sm text-muted-foreground">{copy.portfolioSubtitle}</p>
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
                language={language}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-border/70 bg-card/90 p-8 text-center text-muted-foreground shadow-sm">
            {copy.emptyPortfolio}
          </div>
        )}
      </section>

      <div className="grid gap-3 md:grid-cols-2">
        <div className="rounded-lg border border-border/70 bg-card/90 p-4 shadow-sm">
          <div className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">{copy.activeSources}</div>
          <div className="mt-1 text-2xl font-semibold tracking-tight">{propertyCount}</div>
          <p className="mt-1 text-xs text-muted-foreground">{copy.activeSourcesDescription}</p>
        </div>
        <div className="rounded-lg border border-border/70 bg-card/90 p-4 shadow-sm">
          <div className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">{copy.liveDashboards}</div>
          <div className="mt-1 text-2xl font-semibold tracking-tight">{websites.length}</div>
          <p className="mt-1 text-xs text-muted-foreground">{copy.liveDashboardsDescription}</p>
        </div>
      </div>

      {workspaceBoard ? (
        <section className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold tracking-tight">{copy.workspaceBoardTitle}</h2>
              <p className="text-sm text-muted-foreground">{copy.workspaceBoardSubtitle}</p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-5">
            <SummaryTile label={copy.open} value={workspaceBoard.counts.open} description={copy.openDescription} />
            <SummaryTile label={copy.inProgress} value={workspaceBoard.counts.inProgress} description={copy.inProgressDescription} />
            <SummaryTile label={copy.snoozed} value={workspaceBoard.counts.snoozed} description={copy.snoozedDescription} />
            <SummaryTile label={copy.critical} value={workspaceBoard.counts.blocked} description={copy.criticalDescription} />
            <SummaryTile label={copy.refreshing} value={workspaceBoard.counts.refreshing} description={copy.refreshingDescription} />
          </div>

          <div className="grid gap-4 xl:grid-cols-[minmax(0,1.4fr)_minmax(320px,0.6fr)]">
            <div className="rounded-lg border border-border/70 bg-card/90 p-5 shadow-sm">
              <div className="mb-4">
                <h3 className="text-lg font-semibold tracking-tight">{copy.openActionsTitle}</h3>
                <p className="text-sm text-muted-foreground">{copy.openActionsSubtitle}</p>
              </div>
              <WorkspaceActionBoard board={workspaceBoard} />
            </div>

            <div className="rounded-lg border border-border/70 bg-card/90 p-5 shadow-sm">
              <div className="mb-4">
                <h3 className="text-lg font-semibold tracking-tight">{copy.propertiesAttentionTitle}</h3>
                <p className="text-sm text-muted-foreground">{copy.propertiesAttentionSubtitle}</p>
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
                          ? copy.noTechnicalScan
                          : property.crawlState.stale
                            ? copy.staleTechnicalScan
                            : copy.needsReview)}
                    </div>
                  </Link>
                )) : (
                  <div className="rounded-lg border border-border/70 px-4 py-6 text-sm text-muted-foreground">{copy.noPropertiesAttention}</div>
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

function AiRunCenterView({ data, isAdmin, language }: { data: AiRunCenterData; isAdmin: boolean; language: SupportedLanguage }) {
  const copy = DASHBOARD_PAGE_COPY[language];
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
          <h1 className="text-3xl font-semibold tracking-tight">{copy.aiRunCenterTitle}</h1>
          <p className="mt-1 max-w-2xl text-muted-foreground">
            {copy.aiRunCenterSubtitle}
          </p>
        </div>
        {isAdmin ? (
          <div className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm text-muted-foreground">
            <Bot className="size-4" />
            <span>{copy.estimatedSpend}: {formatUsd(data.estimatedCostUsd)}</span>
          </div>
        ) : null}
      </div>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <SummaryTile label={copy.queued} value={visibleCounts.queued} description={copy.queuedDescription} />
        <SummaryTile label={copy.processing} value={visibleCounts.processing} description={copy.processingDescription} />
        <SummaryTile label={copy.complete} value={visibleCounts.complete} description={copy.completeDescription} />
        {isAdmin ? <SummaryTile label={copy.failed} value={visibleCounts.failed} description={copy.failedDescription} /> : null}
        <SummaryTile label={copy.total} value={visibleCounts.total} description={copy.totalDescription} />
      </section>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.3fr)_minmax(320px,0.7fr)]">
        <section className="rounded-lg border border-border bg-card p-5 shadow-sm">
          <div className="mb-4">
            <h2 className="font-display text-lg font-semibold">{copy.recentAiRuns}</h2>
            <p className="text-sm text-muted-foreground">{copy.recentAiRunsSubtitle}</p>
          </div>
          <div className="overflow-x-auto">
            <table className={`w-full text-left text-sm ${isAdmin ? "min-w-[760px]" : "min-w-[520px]"}`}>
              <thead className="border-b text-xs uppercase tracking-[0.12em] text-muted-foreground">
                <tr>
                  <th className="py-2 pr-4">{copy.property}</th>
                  <th className="py-2 pr-4">{copy.status}</th>
                  <th className="py-2 pr-4">{copy.phase}</th>
                  {isAdmin ? <th className="py-2 pr-4">{copy.model}</th> : null}
                  {isAdmin ? <th className="py-2 pr-4">{copy.cost}</th> : null}
                  {isAdmin ? <th className="py-2 pr-4">{copy.updated}</th> : null}
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
                      {copy.noAiRuns}
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </section>

        <section className="rounded-lg border border-border bg-card p-5 shadow-sm">
          <div className="mb-4">
            <h2 className="font-display text-lg font-semibold">{copy.latestAiFindings}</h2>
            <p className="text-sm text-muted-foreground">{copy.latestAiFindingsSubtitle}</p>
          </div>
          <div className="space-y-3">
            {data.recommendations.map((item) => (
              <div key={item.id} className="rounded-lg border border-border/70 p-4">
                <div className="flex items-start gap-2">
                  <AlertCircle className="mt-0.5 size-4 shrink-0 text-primary" />
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
                {copy.noAiRecommendations}
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

function WebsiteLauncherCard({ website, setupDismissed, language }: WebsiteLauncherCardProps & { setupDismissed: boolean; language: SupportedLanguage }) {
  const copy = DASHBOARD_PAGE_COPY[language];
  const statusLabel = website.isLinked ? copy.linked : website.sourceCoverage === "ga4_only" ? copy.ga4Only : copy.gscOnly;
  const statusClassName = website.isLinked
    ? "border-emerald-200/80 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300"
    : "border-amber-200/80 bg-amber-50 text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-300";
  const sourceCount = website.isLinked ? "2" : "1";
  const sourceMix = website.isLinked ? "GSC + GA4" : website.sourceCoverage === "ga4_only" ? copy.ga4Only : copy.gscOnly;
  const setupSummary = website.isLinked ? copy.readyNow : copy.limited;
  const setupMessage = website.sourceCoverage === "ga4_only"
    ? copy.linkGscSetup
    : copy.linkGa4Setup;

  return (
    <div className="group overflow-hidden rounded-lg border border-border/70 bg-card/95 p-5 shadow-sm transition-colors hover:border-primary/35 hover:bg-card">
      <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 items-center gap-4">
          <div className="inline-flex size-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-blue-400 text-primary-foreground shadow-sm">
            <Globe2 className="size-5" />
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
          <div className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">{copy.sources}</div>
          <div className="mt-1 text-3xl font-semibold tracking-tight">{sourceCount}</div>
          <div className="mt-1 text-sm font-medium text-emerald-600 dark:text-emerald-400">{sourceMix}</div>
        </div>
        <div>
          <div className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">{copy.dashboard}</div>
          <div className="mt-1 text-3xl font-semibold tracking-tight">{copy.live}</div>
          <div className="mt-1 text-sm font-medium text-muted-foreground">{setupSummary}</div>
        </div>
      </div>

      <div className="mt-5 border-t border-dashed border-border/70 pt-4">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0 text-sm text-muted-foreground">
            {copy.sourceSetup}:{" "}
            <span className="font-semibold text-foreground">{website.isLinked ? copy.linkedSources : setupMessage}</span>
          </div>
          <Link
            href={`/properties/${encodeURIComponent(website.id)}`}
            className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-primary transition-transform group-hover:translate-x-0.5"
          >
            {copy.openDashboard}
            <ArrowRight className="size-4" />
          </Link>
        </div>
        <p className="mt-2 truncate text-sm text-muted-foreground">{website.gscUrl ?? website.ga4Name ?? website.id}</p>
      </div>
    </div>
  );
}
