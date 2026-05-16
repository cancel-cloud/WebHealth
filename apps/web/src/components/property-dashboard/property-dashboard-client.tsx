"use client";

import { startTransition, useEffect, useMemo, useState, type ReactNode } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertTriangle, ArrowRight, ArrowUpDown, Bot, CalendarDays, CheckCircle2, ChevronDown, ChevronRight, ClipboardList, Clock3, Download, ExternalLink, FileJson, Filter, LineChart, Link, LoaderCircle, RefreshCcw, Search, Share2, ShieldAlert, Sparkles, UserCheck, Zap } from "lucide-react";
import type { LiveDashboardData, LiveDashboardSnapshotDetail } from "@webhealth/shared/lib/live-dashboard";
import type { PropertyRefreshState } from "@webhealth/shared/lib/property-refresh";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverHeader, PopoverTitle, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { requestJson } from "@/lib/client/api";
import { getAppErrorMessage } from "@/lib/client/app-error";
import { EchartsChart } from "@/components/echarts-chart";
import { toast } from "sonner";
import { PropertyLiveStatus } from "./property-live-status";
import {
  buildDashboardHref,
  buildSparklinePath,
  buildSnapshotDownload,
  filterDashboardActions,
  formatSourceDateCoverage,
  getActionCategoryModel,
  getPriorityModel,
  getSeverityValue,
  getSourceLabel,
  type ActionFilter,
} from "./property-dashboard-client.logic";

type PropertyDashboardClientProps = {
  dashboard: LiveDashboardData;
  currentUser: {
    id: string;
    email: string;
  };
  brandColors: {
    primary: string;
    accent: string;
  };
  mode?: "authenticated" | "publicDemo";
  language?: DashboardLanguage;
};

type DashboardLanguage = "en" | "de";
type ActionRow = LiveDashboardData["actions"][number];
type SnapshotSummary = LiveDashboardData["recentSnapshots"][number];
type EvidenceTab = "queries" | "pages" | "opportunities" | "changes";
type FreshnessSource = LiveDashboardData["freshness"]["sources"][number];

const TERMINAL_REFRESH_TOAST_DURATION_MS = 5000;

export const DASHBOARD_COPY = {
  en: {
    properties: "Properties",
    verified: "Verified",
    data: "Data",
    single: "Single",
    compare: "Compare",
    export: "Export",
    shareWithClient: "Share with client",
    copyShareLink: "Copy share link",
    downloadSnapshot: "Download snapshot",
    exportJson: "Export JSON",
    demoOnly: "Demo only",
    rerunning: "Rerunning...",
    rankedFixList: "Ranked action list",
    rankedFixListLead: "AI-prioritized actions across GSC, GA4, and the latest crawl",
    rerun: "Re-run",
    rerunAllData: "Rerun all data",
    reset: "Reset",
    apply: "Apply",
    liveWorkspace: "Live workspace",
    dataComplete: "Data complete",
    technicalScanStale: "Technical scan stale",
    partialWindow: "Partial window",
    dataUnavailable: "Data unavailable",
    recomputingActionsShort: "Recomputing ranked actions",
    refreshingSourceDataShort: "Refreshing source data",
    refreshingTechnicalScan: "Refreshing technical scan",
    whyThisMatters: "Why this matters",
    affectedPages: "Affected pages",
    affectedTarget: "Affected target",
    noPageMetrics: "No page metrics",
    clicksShort: "clicks",
    impressionsShort: "impr",
    positionShort: "pos",
    openDetails: "Open details",
    copyAsTask: "Copy as task",
    assignToMe: "Assign to me",
    markDone: "Mark done",
    estimatedLift: "Estimated lift",
    clicksPerMonth: "Clicks / mo",
    source: "Source",
    noRankedActions: "No ranked actions match this filter.",
    trafficTrend: "Traffic trend",
    noTrendData: "No trend data is available for this window.",
    topPages: "Top pages",
    topOpportunities: "Top opportunities",
    recentChanges: "Recent changes",
    topQueries: "Top queries",
    pagesLead: "GSC clicks and traffic movement, sorted by clicks.",
    opportunitiesLead: "Ranked supporting signals behind the queue.",
    changesLead: "Tracked page changes in this window.",
    queriesLead: "Sorted by clicks.",
    search: "Search...",
    queries: "Queries",
    pages: "Pages",
    opportunities: "Opportunities",
    changes: "Changes",
    query: "Query",
    clicks: "Clicks",
    impressions: "Impressions",
    ctr: "CTR",
    position: "Position",
    page: "Page",
    currentClicks: "Current clicks",
    compareClicks: "Compare clicks",
    delta: "Delta",
    status: "Status",
    type: "Type",
    target: "Target",
    signal: "Signal",
    impact: "Impact",
    changedPage: "Changed page",
    lastChanged: "Last changed",
    noQueryEvidence: "No query evidence matches this search.",
    noPageEvidence: "No page evidence matches this search.",
    noOpportunityEvidence: "No opportunity evidence matches this search.",
    noTrackedChanges: "No tracked page changes match this search.",
    recommendedActions: "Recommended actions",
    expectedOutcome: "Expected outcome",
    evidence: "Evidence",
    firstVisibleWin: "First visible win",
    confidence: "Confidence",
    system: "System",
    override: "Override",
    snapshotTrailEntry: "Snapshot trail entry",
    recentCaptures: "Recent captures",
    snapshotTrail: "Snapshot trail",
    snapshotTrailDescription: "Review the frozen window, freshness state, and top-line metrics captured from the live dashboard.",
    loadingSnapshotDetails: "Loading snapshot details...",
    capturedWindow: "Captured window",
    comparison: "Comparison",
    capturedAt: "Captured at",
    capturedActions: "Captured actions",
    freshnessAtCapture: "Freshness at capture time",
    noSnapshotDetails: "Snapshot details are not available for this item.",
    freshnessDialogTitle: "Recent data may still be incomplete",
    freshnessDialogDescription: "The selected end date runs past the latest safe coverage for at least one source. Keep the selected dates if you want the freshest available view, or shift the window back to the latest safe date.",
    completeThrough: "is complete through",
    shiftSafeWindow: "Shift to safe window",
    useLatestData: "Use latest available data",
    noComparison: "No comparison",
    compareUnavailable: "Compare data unavailable",
    previousPeriod: "Previous period",
    samePeriodLastYear: "Same period last year",
    last7Days: "Last 7 days",
    last28Days: "Last 28 days",
    last90Days: "Last 90 days",
    customRange: "Custom range",
    sessions: "Sessions",
    users: "Users",
    avgPosition: "Avg. position",
    stale: "Stale",
    noData: "No data",
    partial: "Partial",
    severity: "Severity",
    stateOpen: "Open",
    stateInProgress: "In progress",
    stateDone: "Done",
    stateIgnored: "Ignored",
    stateSnoozed: "Snoozed",
    filterAll: "All",
    filterCritical: "Critical / high",
    filterIgnoredSnoozed: "Ignored / snoozed",
    filterPerformance: "Performance",
    filterPerf: "Perf",
    sortByClicks: "Sort by clicks",
    sortByImpressions: "Sort by impressions",
    sortByCtr: "Sort by CTR",
    sortByPosition: "Sort by position",
    sortByQuery: "Sort by query",
    sortByChange: "Sort by change",
    sortByCurrentClicks: "Sort by current clicks",
    sortByStatus: "Sort by status",
    sortByPage: "Sort by page",
    sortByImpact: "Sort by impact",
    sortByType: "Sort by type",
    sortByTarget: "Sort by target",
    sortByLatest: "Sort by latest",
    sortByOldest: "Sort by oldest",
    sortByUrl: "Sort by URL",
    nearWin: "Near win",
    ctrGap: "CTR gap",
    contentDecay: "Content decay",
    reachableClicks: "reachable clicks",
    benchmark: "benchmark",
    lostClicks: "lost clicks",
    peak: "peak",
    actionStateUpdated: "Action state updated.",
    actionStateUpdateFailed: "Could not update action state.",
    actionAssigned: "Action assigned to you.",
    actionAssignFailed: "Could not assign action.",
    snapshotCaptured: "Snapshot captured.",
    snapshotCaptureFailed: "Could not capture snapshot.",
    refreshSourceFailed: "Could not refresh source data.",
    refreshCrawlFailed: "Could not refresh the technical scan.",
    refreshCrawlQueued: "Technical refresh queued.",
    refreshSourceSuccess: "Source data refreshed.",
    refreshSourceSuccessRange: (start: string, end: string) => `Data refreshed for ${start} to ${end}.`,
    rerunLoading: "Rerunning GA4, Search Console and crawl...",
    rerunQueued: "Rerun queued.",
    rerunFailed: "Rerun failed. Showing last valid dashboard.",
    updateInProgress: "Update in progress",
    rerunInProgressMessage: "Re-run in progress for the displayed data.",
    recomputingActions: "Recomputing ranked actions...",
    refreshingSourceData: "Refreshing source data...",
    refreshingDisplayedData: "Refreshing the displayed data...",
    taskCopied: "Task draft copied.",
    taskCopyFailed: "Could not copy task draft.",
    shareCreated: "Client share link created.",
    shareCreateFailed: "Could not create share link.",
    shareCopied: "Share link copied.",
    shareCopyFailed: "Could not copy share link.",
    priorityOverrideUpdated: "Priority override updated.",
    priorityOverrideFailed: "Could not update the priority override.",
    snapshotLoadFailed: "Could not load snapshot details.",
  },
  de: {
    properties: "Properties",
    verified: "Verifiziert",
    data: "Daten",
    single: "Einzeln",
    compare: "Vergleich",
    export: "Export",
    shareWithClient: "Mit Kunde teilen",
    copyShareLink: "Share-Link kopieren",
    downloadSnapshot: "Snapshot herunterladen",
    exportJson: "JSON exportieren",
    demoOnly: "Nur Demo",
    rerunning: "Läuft neu...",
    rankedFixList: "Maßnahmenliste",
    rankedFixListLead: "Nach Impact priorisierte Maßnahmen über GSC, GA4 und den letzten Crawl",
    rerun: "Neu berechnen",
    rerunAllData: "Alle Daten neu berechnen",
    reset: "Zurücksetzen",
    apply: "Anwenden",
    liveWorkspace: "Live-Arbeitsbereich",
    dataComplete: "Daten vollständig",
    technicalScanStale: "Technischer Scan veraltet",
    partialWindow: "Teilweises Zeitfenster",
    dataUnavailable: "Daten nicht verfügbar",
    recomputingActionsShort: "Maßnahmenliste wird neu berechnet",
    refreshingSourceDataShort: "Quelldaten werden aktualisiert",
    refreshingTechnicalScan: "Technischer Scan wird aktualisiert",
    whyThisMatters: "Warum das wichtig ist",
    affectedPages: "Betroffene Seiten",
    affectedTarget: "Betroffenes Ziel",
    noPageMetrics: "Keine Seitenmetriken",
    clicksShort: "Klicks",
    impressionsShort: "Impr.",
    positionShort: "Pos.",
    openDetails: "Details öffnen",
    copyAsTask: "Als Aufgabe kopieren",
    assignToMe: "Mir zuweisen",
    markDone: "Erledigt markieren",
    estimatedLift: "Geschätzter Lift",
    clicksPerMonth: "Klicks / Monat",
    source: "Quelle",
    noRankedActions: "Keine priorisierten Maßnahmen passen zu diesem Filter.",
    trafficTrend: "Traffic-Trend",
    noTrendData: "Für dieses Zeitfenster sind keine Trenddaten verfügbar.",
    topPages: "Top-Seiten",
    topOpportunities: "Top-Chancen",
    recentChanges: "Letzte Änderungen",
    topQueries: "Top-Queries",
    pagesLead: "GSC-Klicks und Traffic-Bewegung, nach Klicks sortiert.",
    opportunitiesLead: "Priorisierte Signale hinter der Queue.",
    changesLead: "Erfasste Seitenänderungen in diesem Zeitfenster.",
    queriesLead: "Nach Klicks sortiert.",
    search: "Suchen...",
    queries: "Queries",
    pages: "Seiten",
    opportunities: "Chancen",
    changes: "Änderungen",
    query: "Query",
    clicks: "Klicks",
    impressions: "Impressionen",
    ctr: "CTR",
    position: "Position",
    page: "Seite",
    currentClicks: "Aktuelle Klicks",
    compareClicks: "Vergleichs-Klicks",
    delta: "Delta",
    status: "Status",
    type: "Typ",
    target: "Ziel",
    signal: "Signal",
    impact: "Impact",
    changedPage: "Geänderte Seite",
    lastChanged: "Zuletzt geändert",
    noQueryEvidence: "Keine Query-Evidenz passt zu dieser Suche.",
    noPageEvidence: "Keine Seiten-Evidenz passt zu dieser Suche.",
    noOpportunityEvidence: "Keine Chancen-Evidenz passt zu dieser Suche.",
    noTrackedChanges: "Keine erfassten Seitenänderungen passen zu dieser Suche.",
    recommendedActions: "Empfohlene Maßnahmen",
    expectedOutcome: "Erwartetes Ergebnis",
    evidence: "Evidenz",
    firstVisibleWin: "Erster sichtbarer Gewinn",
    confidence: "Sicherheit",
    system: "System",
    override: "Override",
    snapshotTrailEntry: "Snapshot-Eintrag",
    recentCaptures: "Aktuelle Erfassungen",
    snapshotTrail: "Snapshot-Verlauf",
    snapshotTrailDescription: "Prüfe das eingefrorene Zeitfenster, die Datenfrische und die Top-Metriken aus dem Live-Dashboard.",
    loadingSnapshotDetails: "Snapshot-Details werden geladen...",
    capturedWindow: "Erfasstes Zeitfenster",
    comparison: "Vergleich",
    capturedAt: "Erfasst am",
    capturedActions: "Erfasste Maßnahmen",
    freshnessAtCapture: "Datenfrische zum Erfassungszeitpunkt",
    noSnapshotDetails: "Für diesen Eintrag sind keine Snapshot-Details verfügbar.",
    freshnessDialogTitle: "Aktuelle Daten können noch unvollständig sein",
    freshnessDialogDescription: "Das gewählte Enddatum liegt nach der letzten sicheren Abdeckung mindestens einer Quelle. Behalte die Daten für die frischeste verfügbare Ansicht oder verschiebe das Fenster zurück auf das sichere Datum.",
    completeThrough: "ist vollständig bis",
    shiftSafeWindow: "Auf sicheres Fenster verschieben",
    useLatestData: "Neueste verfügbare Daten nutzen",
    noComparison: "Kein Vergleich",
    compareUnavailable: "Vergleichsdaten nicht verfügbar",
    previousPeriod: "Vorperiode",
    samePeriodLastYear: "Gleicher Zeitraum Vorjahr",
    last7Days: "Letzte 7 Tage",
    last28Days: "Letzte 28 Tage",
    last90Days: "Letzte 90 Tage",
    customRange: "Eigener Zeitraum",
    sessions: "Sessions",
    users: "Nutzer",
    avgPosition: "Durchschn. Position",
    stale: "Veraltet",
    noData: "Keine Daten",
    partial: "Teilweise",
    severity: "Schwere",
    stateOpen: "Offen",
    stateInProgress: "In Arbeit",
    stateDone: "Erledigt",
    stateIgnored: "Ignoriert",
    stateSnoozed: "Zurückgestellt",
    filterAll: "Alle",
    filterCritical: "Kritisch / hoch",
    filterIgnoredSnoozed: "Ignoriert / zurückgestellt",
    filterPerformance: "Performance",
    filterPerf: "Perf",
    sortByClicks: "Nach Klicks sortieren",
    sortByImpressions: "Nach Impressionen sortieren",
    sortByCtr: "Nach CTR sortieren",
    sortByPosition: "Nach Position sortieren",
    sortByQuery: "Nach Query sortieren",
    sortByChange: "Nach Veränderung sortieren",
    sortByCurrentClicks: "Nach aktuellen Klicks sortieren",
    sortByStatus: "Nach Status sortieren",
    sortByPage: "Nach Seite sortieren",
    sortByImpact: "Nach Impact sortieren",
    sortByType: "Nach Typ sortieren",
    sortByTarget: "Nach Ziel sortieren",
    sortByLatest: "Nach neuesten sortieren",
    sortByOldest: "Nach ältesten sortieren",
    sortByUrl: "Nach URL sortieren",
    nearWin: "Near Win",
    ctrGap: "CTR-Lücke",
    contentDecay: "Content-Verfall",
    reachableClicks: "erreichbare Klicks",
    benchmark: "Benchmark",
    lostClicks: "verlorene Klicks",
    peak: "Peak",
    actionStateUpdated: "Maßnahmenstatus aktualisiert.",
    actionStateUpdateFailed: "Maßnahmenstatus konnte nicht aktualisiert werden.",
    actionAssigned: "Maßnahme dir zugewiesen.",
    actionAssignFailed: "Maßnahme konnte nicht zugewiesen werden.",
    snapshotCaptured: "Snapshot erfasst.",
    snapshotCaptureFailed: "Snapshot konnte nicht erfasst werden.",
    refreshSourceFailed: "Quelldaten konnten nicht aktualisiert werden.",
    refreshCrawlFailed: "Technischer Scan konnte nicht aktualisiert werden.",
    refreshCrawlQueued: "Technische Aktualisierung wurde eingereiht.",
    refreshSourceSuccess: "Quelldaten aktualisiert.",
    refreshSourceSuccessRange: (start: string, end: string) => `Daten für ${start} bis ${end} aktualisiert.`,
    rerunLoading: "GA4, Search Console und Crawl werden neu berechnet...",
    rerunQueued: "Neuberechnung wurde eingereiht.",
    rerunFailed: "Neuberechnung fehlgeschlagen. Das letzte gültige Dashboard bleibt sichtbar.",
    updateInProgress: "Aktualisierung läuft",
    rerunInProgressMessage: "Neuberechnung für die angezeigten Daten läuft.",
    recomputingActions: "Maßnahmenliste wird neu berechnet...",
    refreshingSourceData: "Quelldaten werden aktualisiert...",
    refreshingDisplayedData: "Angezeigte Daten werden aktualisiert...",
    taskCopied: "Aufgabenentwurf kopiert.",
    taskCopyFailed: "Aufgabenentwurf konnte nicht kopiert werden.",
    shareCreated: "Kunden-Share-Link erstellt.",
    shareCreateFailed: "Share-Link konnte nicht erstellt werden.",
    shareCopied: "Share-Link kopiert.",
    shareCopyFailed: "Share-Link konnte nicht kopiert werden.",
    priorityOverrideUpdated: "Prioritäts-Override aktualisiert.",
    priorityOverrideFailed: "Prioritäts-Override konnte nicht aktualisiert werden.",
    snapshotLoadFailed: "Snapshot-Details konnten nicht geladen werden.",
  },
} as const;

type DashboardCopy = (typeof DASHBOARD_COPY)[DashboardLanguage];

function buildOptimisticRerunState(propertyId: string, baseState: PropertyRefreshState | null, copy: DashboardCopy): PropertyRefreshState {
  const now = new Date().toISOString();

  return {
    id: baseState?.id ?? `optimistic-rerun-${propertyId}`,
    jobType: "decision_refresh",
    status: "queued",
    phase: "rerun_queued",
    message: copy.rerunInProgressMessage,
    progressMeta: baseState?.progressMeta ?? null,
    startedAt: baseState?.startedAt ?? null,
    finishedAt: null,
    updatedAt: now,
  };
}

function getActiveRefreshMessage(state: PropertyRefreshState, copy: DashboardCopy) {
  if (state.message) {
    return state.message;
  }

  if (state.phase === "analysis") {
    return copy.recomputingActions;
  }

  if (state.phase.startsWith("source_data")) {
    return copy.refreshingSourceData;
  }

  return copy.refreshingDisplayedData;
}

const ACTION_STATES: Array<{ value: ActionRow["state"]; label: string }> = [
  { value: "open", label: "Open" },
  { value: "in_progress", label: "In progress" },
  { value: "done", label: "Done" },
  { value: "ignored", label: "Ignored" },
  { value: "snoozed", label: "Snoozed" },
];

const ACTION_FILTERS: Array<{ value: ActionFilter; label: string }> = [
  { value: "all", label: "All" },
  { value: "critical", label: "Critical / high" },
  { value: "in_progress", label: "In progress" },
  { value: "open", label: "Open" },
  { value: "done", label: "Done" },
  { value: "ignored_snoozed", label: "Ignored / snoozed" },
  { value: "crawl", label: "Crawl" },
  { value: "seo", label: "SEO" },
  { value: "content", label: "Content" },
  { value: "performance", label: "Performance" },
  { value: "ai", label: "AI" },
];

const RANKED_ACTION_FILTERS: Array<{ value: ActionFilter; label: string }> = [
  { value: "all", label: "All" },
  { value: "ai", label: "AI" },
  { value: "crawl", label: "Crawl" },
  { value: "performance", label: "Perf" },
  { value: "seo", label: "SEO" },
  { value: "content", label: "Content" },
];

function getActionStateLabel(state: ActionRow["state"], language: DashboardLanguage) {
  const copy = DASHBOARD_COPY[language];
  if (state === "in_progress") return copy.stateInProgress;
  if (state === "done") return copy.stateDone;
  if (state === "ignored") return copy.stateIgnored;
  if (state === "snoozed") return copy.stateSnoozed;
  return copy.stateOpen;
}

function getActionFilterLabel(filter: ActionFilter, language: DashboardLanguage, compact = false) {
  const copy = DASHBOARD_COPY[language];
  if (filter === "all") return copy.filterAll;
  if (filter === "critical") return copy.filterCritical;
  if (filter === "in_progress") return copy.stateInProgress;
  if (filter === "open") return copy.stateOpen;
  if (filter === "done") return copy.stateDone;
  if (filter === "ignored_snoozed") return copy.filterIgnoredSnoozed;
  if (filter === "performance") return compact ? copy.filterPerf : copy.filterPerformance;
  if (filter === "crawl") return "Crawl";
  if (filter === "seo") return "SEO";
  if (filter === "content") return "Content";
  return "AI";
}

const HEADER_SOURCE_ORDER: FreshnessSource["source"][] = ["ga4", "gsc", "crawl"];

function getHeaderSourceLabel(source: FreshnessSource["source"]) {
  if (source === "ga4") return "GA4";
  if (source === "gsc") return "GSC";
  return "Crawl";
}

function getActionFilterCount(actions: ActionRow[], filter: ActionFilter) {
  return filterDashboardActions(actions, filter).length;
}

function getActionLiftValue(action: ActionRow) {
  return action.valueAtStake.nearWinOpportunity
    ?? action.valueAtStake.recoveryPotential
    ?? action.valueAtStake.clicksAtRisk
    ?? action.valueAtStake.trafficExposure
    ?? null;
}

function getActionSourceLabel(action: ActionRow) {
  if (action.area === "technical" || action.causeFamily.includes("technical")) return "GSC + Crawl";
  if (action.area === "analytics") return "GA4";
  if (action.area === "content") return "GSC + Content";
  return "GSC";
}

function getDashboardLocale(language: DashboardLanguage) {
  return language === "de" ? "de-DE" : undefined;
}

function formatNumber(value: number | null, language: DashboardLanguage = "en") {
  if (value == null) return "—";
  return Math.round(value).toLocaleString(getDashboardLocale(language));
}

function formatPercent(value: number | null) {
  if (value == null) return "—";
  return `${(value * 100).toFixed(1)}%`;
}

function formatPosition(value: number | null) {
  if (value == null) return "—";
  return value.toFixed(1);
}

function formatDelta(
  current: number | null,
  compare: number | null,
  options?: { percent?: boolean; invert?: boolean },
): { text: string; tone: "positive" | "negative" | "neutral" } | null {
  if (current == null || compare == null) return null;
  const delta = current - compare;
  const positive = options?.invert ? delta < 0 : delta > 0;
  const neutral = delta === 0;
  const rendered = options?.percent ? `${delta >= 0 ? "+" : ""}${(delta * 100).toFixed(1)}%` : `${delta >= 0 ? "+" : ""}${Math.round(delta).toLocaleString()}`;
  return {
    text: rendered,
    tone: neutral ? "neutral" : positive ? "positive" : "negative",
  };
}

function formatDateLabel(value: string | null, language: DashboardLanguage = "en") {
  if (!value) return "—";
  return new Intl.DateTimeFormat(getDashboardLocale(language), {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(`${value}T00:00:00.000Z`));
}

function addDays(value: string, days: number) {
  const date = new Date(`${value}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function formatCompareModeLabel(
  compareMode: LiveDashboardData["analysisWindow"]["compareMode"],
  language: DashboardLanguage = "en",
) {
  const copy = DASHBOARD_COPY[language];
  if (compareMode === "none") return copy.noComparison;
  if (compareMode === "previous_period") return copy.previousPeriod;
  return copy.samePeriodLastYear;
}

function formatShortDate(value: string | null, language: DashboardLanguage = "en") {
  if (!value) return "—";
  return new Intl.DateTimeFormat(getDashboardLocale(language), {
    month: "short",
    day: "numeric",
  }).format(new Date(`${value}T00:00:00.000Z`));
}

export function formatPresetLabel(
  value: LiveDashboardData["analysisWindow"]["preset"],
  language: DashboardLanguage = "en",
) {
  const copy = DASHBOARD_COPY[language];
  if (value === "last_7d") return copy.last7Days;
  if (value === "last_90d") return copy.last90Days;
  if (value === "custom") return copy.customRange;
  return copy.last28Days;
}

function getPropertySiteUrl(rawUrl: string) {
  if (rawUrl.startsWith("sc-domain:")) {
    return `https://${rawUrl.replace(/^sc-domain:/, "")}`;
  }
  if (/^https?:\/\//i.test(rawUrl)) return rawUrl;
  return `https://${rawUrl}`;
}

function getPropertyFaviconUrl(rawUrl: string) {
  const siteUrl = getPropertySiteUrl(rawUrl);
  return `https://www.google.com/s2/favicons?domain_url=${encodeURIComponent(siteUrl)}&sz=128`;
}

function matchesSearch(values: Array<string | number | null | undefined>, search: string) {
  if (!search) return true;
  const needle = search.trim().toLowerCase();
  if (!needle) return true;

  return values.some((value) => String(value ?? "").toLowerCase().includes(needle));
}

function daysInclusive(startDate: string, endDate: string) {
  const start = new Date(`${startDate}T00:00:00.000Z`).getTime();
  const end = new Date(`${endDate}T00:00:00.000Z`).getTime();
  return Math.floor((end - start) / 86_400_000) + 1;
}

function toneClasses(tone: "positive" | "negative" | "neutral") {
  if (tone === "positive") return "text-emerald-600 dark:text-emerald-400";
  if (tone === "negative") return "text-rose-600 dark:text-rose-400";
  return "text-muted-foreground";
}

function freshnessBadgeVariant(state: LiveDashboardData["freshness"]["state"]) {
  if (state === "complete") return "outline" as const;
  if (state === "stale") return "secondary" as const;
  if (state === "partial") return "secondary" as const;
  return "destructive" as const;
}

function MetricTile({
  label,
  value,
  delta,
  deltaFallback,
  sourceState,
  sparkline,
  color,
  badgeLabels = DASHBOARD_COPY.en,
}: {
  label: string;
  value: string;
  delta: ReturnType<typeof formatDelta>;
  deltaFallback: string;
  sourceState: "complete" | "partial" | "stale" | "unavailable";
  sparkline?: number[];
  color?: string;
  badgeLabels?: DashboardCopy;
}) {
  const sparklinePath = sparkline ? buildSparklinePath(sparkline, 92, 28) : null;
  return (
    <div className="relative h-full min-w-0 overflow-hidden rounded-lg border border-zinc-200 bg-white p-3 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
      <div className="flex min-w-0 items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">{label}</p>
          <div className="mt-2 font-display text-2xl font-extrabold leading-none tracking-[-0.02em] text-foreground">{value}</div>
        </div>
        {sourceState !== "complete" ? (
          <Badge variant="outline" className="w-fit shrink-0 whitespace-nowrap border-amber-200 bg-amber-50 text-[10px] text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
            {sourceState === "stale" ? badgeLabels.stale : sourceState === "unavailable" ? badgeLabels.noData : badgeLabels.partial}
          </Badge>
        ) : null}
      </div>
      {sparklinePath ? (
        <svg aria-hidden="true" viewBox="0 0 92 28" className="absolute right-3 top-10 h-7 w-[44%] opacity-60">
          <path d={sparklinePath} fill="none" stroke={color ?? "currentColor"} strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
        </svg>
      ) : null}
      <div className={`mt-3 text-xs font-semibold ${delta ? toneClasses(delta.tone) : "text-muted-foreground"}`}>
        {delta ? delta.text : deltaFallback}
      </div>
    </div>
  );
}

function SeverityMeter({ value, label = DASHBOARD_COPY.en.severity }: { value: number; label?: string }) {
  const clamped = Math.max(1, Math.min(5, value));
  const tone = clamped >= 4 ? "text-rose-500" : clamped === 3 ? "text-amber-500" : clamped === 2 ? "text-sky-500" : "text-emerald-500";
  return (
    <div className={`w-32 ${tone}`}>
      <div className="mb-1 flex items-center justify-between text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
        <span>{label}</span>
        <span className="text-foreground">{clamped}/5</span>
      </div>
      <div className="flex h-1.5 gap-1">
        {[1, 2, 3, 4, 5].map((segment) => (
          <span key={segment} className={`h-full flex-1 rounded-full ${segment <= clamped ? "bg-current" : "bg-zinc-200 dark:bg-white/10"}`} />
        ))}
      </div>
    </div>
  );
}

function PropertyMetaPill({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`inline-flex items-center gap-1.5 rounded-full border border-zinc-200/95 bg-white/88 px-3 py-1.5 shadow-[0_10px_24px_-22px_rgba(15,23,42,0.28)] backdrop-blur dark:border-white/10 dark:bg-white/[0.04] ${className}`}>
      {children}
    </div>
  );
}

export function PropertyDashboardClient({
  dashboard,
  currentUser,
  brandColors,
  mode = "authenticated",
  language = "en",
}: PropertyDashboardClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedAction, setSelectedAction] = useState<ActionRow | null>(null);
  const [pendingStateKey, setPendingStateKey] = useState<string | null>(null);
  const [snapshotLoading, setSnapshotLoading] = useState(false);
  const [refreshLoading, setRefreshLoading] = useState(false);
  const [rerunLoading, setRerunLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState<"share" | "copy" | null>(null);
  const [snapshotDetail, setSnapshotDetail] = useState<LiveDashboardSnapshotDetail | null>(null);
  const [isSnapshotSheetOpen, setIsSnapshotSheetOpen] = useState(false);
  const [snapshotDetailLoading, setSnapshotDetailLoading] = useState(false);
  const [isFreshnessDialogOpen, setIsFreshnessDialogOpen] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(null);
  const [activeEvidenceTab, setActiveEvidenceTab] = useState<EvidenceTab>("queries");
  const [evidenceSearch, setEvidenceSearch] = useState("");
  const [evidenceSort, setEvidenceSort] = useState("clicks_desc");
  const [actionFilter, setActionFilter] = useState<ActionFilter>("all");
  const [expandedActionFingerprints, setExpandedActionFingerprints] = useState<string[]>([]);
  const [trendMetrics, setTrendMetrics] = useState<Array<"clicks" | "impressions" | "sessions" | "users">>(["clicks"]);
  const [currentRefreshState, setCurrentRefreshState] = useState<PropertyRefreshState | null>(dashboard.propertyUpdateState);
  const [faviconFailed, setFaviconFailed] = useState(false);
  const copy = DASHBOARD_COPY[language];
  const isPublicDemo = mode === "publicDemo";
  const demoOperationMessage = language === "de"
    ? "Diese Funktion ist verfügbar, sobald ein Workspace verbunden ist. In der Acme-Demo bleiben Backend-Aktionen deaktiviert."
    : "This control is available after a workspace is connected. The Acme demo keeps backend operations disabled.";

  useEffect(() => {
    setCurrentRefreshState(dashboard.propertyUpdateState);
  }, [dashboard.propertyUpdateState, dashboard.payloadVersion]);

  useEffect(() => {
    setFaviconFailed(false);
  }, [dashboard.property.url]);

  const [preset, setPreset] = useState(dashboard.analysisWindow.preset);
  const [compareMode, setCompareMode] = useState(dashboard.analysisWindow.compareMode);
  const [startDate, setStartDate] = useState(dashboard.analysisWindow.startDate);
  const [endDate, setEndDate] = useState(dashboard.analysisWindow.requestedEndDate);
  const refreshToastId = `property-refresh-${dashboard.property.id}`;
  const activeRefreshState = currentRefreshState && (currentRefreshState.status === "queued" || currentRefreshState.status === "processing")
    ? currentRefreshState
    : null;
  const isBackendOperationDisabled = isPublicDemo;
  const rerunInProgress = rerunLoading || Boolean(activeRefreshState);
  const rerunDisabled = isBackendOperationDisabled || rerunInProgress;
  const visibleDegradedStates = dashboard.degradedStates.filter((state) => state.code !== "refresh_in_progress");

  const safeLatestDate = dashboard.freshness.safeLatestDate;
  const crawlFreshness = dashboard.freshness.sources.find((source) => source.source === "crawl");
  const propertySiteUrl = getPropertySiteUrl(dashboard.property.url);
  const propertyFaviconUrl = isPublicDemo ? "" : getPropertyFaviconUrl(dashboard.property.url);
  const showPropertyFavicon = Boolean(propertyFaviconUrl) && !faviconFailed;
  const headerFreshnessSources = HEADER_SOURCE_ORDER
    .map((sourceKey) => dashboard.freshness.sources.find((source) => source.source === sourceKey))
    .filter((source): source is FreshnessSource => Boolean(source));
  const lowestSafeLatest = dashboard.freshness.sources
    .filter((source) => source.source !== "crawl")
    .map((source) => source.safeLatestDate)
    .filter((value): value is string => !!value)
    .sort()[0] ?? safeLatestDate;

  const tiles = useMemo(() => {
    const gscState = dashboard.freshness.sources.find((source) => source.source === "gsc")?.state ?? "unavailable";
    const ga4State = dashboard.freshness.sources.find((source) => source.source === "ga4")?.state ?? "unavailable";
    const compareBaselineAvailable = compareMode !== "none" && (
      dashboard.overview.compare.clicks > 0
      || dashboard.overview.compare.impressions > 0
      || (dashboard.overview.compare.sessions ?? 0) > 0
      || (dashboard.overview.compare.users ?? 0) > 0
    );
    const deltaFallback = compareMode === "none" ? copy.noComparison : copy.compareUnavailable;
    return [
      {
        id: "clicks",
        label: copy.clicks,
        value: formatNumber(dashboard.overview.clicks, language),
        delta: compareBaselineAvailable ? formatDelta(dashboard.overview.clicks, dashboard.overview.compare.clicks) : null,
        deltaFallback,
        sourceState: gscState,
        sparkline: dashboard.trend.map((point) => point.clicks),
        color: brandColors.primary,
      },
      {
        id: "impressions",
        label: copy.impressions,
        value: formatNumber(dashboard.overview.impressions, language),
        delta: compareBaselineAvailable ? formatDelta(dashboard.overview.impressions, dashboard.overview.compare.impressions) : null,
        deltaFallback,
        sourceState: gscState,
        sparkline: dashboard.trend.map((point) => point.impressions),
        color: brandColors.accent,
      },
      {
        id: "ctr",
        label: "CTR",
        value: formatPercent(dashboard.overview.ctr),
        delta: compareBaselineAvailable ? formatDelta(dashboard.overview.ctr, dashboard.overview.compare.ctr, { percent: true }) : null,
        deltaFallback,
        sourceState: gscState,
        sparkline: dashboard.trend.map((point) => point.ctr),
        color: brandColors.accent,
      },
      {
        id: "avg-position",
        label: copy.avgPosition,
        value: formatPosition(dashboard.overview.position),
        delta: compareBaselineAvailable ? formatDelta(dashboard.overview.position, dashboard.overview.compare.position, { invert: true }) : null,
        deltaFallback,
        sourceState: gscState,
        sparkline: dashboard.trend.map((point) => point.position),
        color: "#94a3b8",
      },
      {
        id: "sessions",
        label: copy.sessions,
        value: formatNumber(dashboard.overview.sessions, language),
        delta: compareBaselineAvailable ? formatDelta(dashboard.overview.sessions, dashboard.overview.compare.sessions) : null,
        deltaFallback,
        sourceState: ga4State,
        sparkline: dashboard.trend.map((point) => point.sessions ?? NaN),
        color: "#10b981",
      },
      {
        id: "users",
        label: copy.users,
        value: formatNumber(dashboard.overview.users, language),
        delta: compareBaselineAvailable ? formatDelta(dashboard.overview.users, dashboard.overview.compare.users) : null,
        deltaFallback,
        sourceState: ga4State,
        sparkline: dashboard.trend.map((point) => point.users ?? NaN),
        color: "#fb923c",
      },
    ];
  }, [brandColors.accent, brandColors.primary, compareMode, copy, dashboard, language]);

  const clicksSeries = dashboard.trend.map((point) => point.clicks);
  const clicksStart = dashboard.trend[0]?.date ?? dashboard.analysisWindow.startDate;
  const clicksEnd = dashboard.trend[dashboard.trend.length - 1]?.date ?? dashboard.analysisWindow.endDate;
  const trendLabels = dashboard.trend.map((point) =>
    new Intl.DateTimeFormat(getDashboardLocale(language), { month: "short", day: "numeric" }).format(
      new Date(`${point.date}T00:00:00.000Z`),
    ),
  );
  const earliestCoverageDate = dashboard.freshness.sources
    .map((source) => source.safeLatestDate)
    .filter((value): value is string => !!value)
    .sort()[0] ?? null;
  const opportunitySignalCount = dashboard.evidence.nearWins.length
    + dashboard.evidence.ctrGaps.length
    + dashboard.evidence.contentDecay.length;

  const evidenceSortOptions = useMemo(() => {
    if (activeEvidenceTab === "queries") {
      return [
        { value: "clicks_desc", label: copy.sortByClicks },
        { value: "impressions_desc", label: copy.sortByImpressions },
        { value: "ctr_desc", label: copy.sortByCtr },
        { value: "position_asc", label: copy.sortByPosition },
        { value: "query_asc", label: copy.sortByQuery },
      ];
    }

    if (activeEvidenceTab === "pages") {
      return [
        { value: "delta_desc", label: copy.sortByChange },
        { value: "clicks_desc", label: copy.sortByCurrentClicks },
        { value: "status_asc", label: copy.sortByStatus },
        { value: "page_asc", label: copy.sortByPage },
      ];
    }

    if (activeEvidenceTab === "opportunities") {
      return [
        { value: "impact_desc", label: copy.sortByImpact },
        { value: "type_asc", label: copy.sortByType },
        { value: "target_asc", label: copy.sortByTarget },
      ];
    }

    return [
      { value: "recent_desc", label: copy.sortByLatest },
      { value: "recent_asc", label: copy.sortByOldest },
      { value: "url_asc", label: copy.sortByUrl },
    ];
  }, [activeEvidenceTab, copy]);

  const activeEvidenceSort = evidenceSortOptions.some((option) => option.value === evidenceSort)
    ? evidenceSort
    : evidenceSortOptions[0]?.value ?? "clicks_desc";

  const filteredQueryRows = useMemo(() => {
    return [...dashboard.evidence.queryOpportunities]
      .filter((row) => matchesSearch([row.query, row.clicks, row.impressions], evidenceSearch))
      .sort((left, right) => {
        switch (activeEvidenceSort) {
          case "impressions_desc":
            return right.impressions - left.impressions;
          case "ctr_desc":
            return right.ctr - left.ctr;
          case "position_asc":
            return left.position - right.position;
          case "query_asc":
            return left.query.localeCompare(right.query);
          case "clicks_desc":
          default:
            return right.clicks - left.clicks;
        }
      });
  }, [activeEvidenceSort, dashboard.evidence.queryOpportunities, evidenceSearch]);

  const filteredPageRows = useMemo(() => {
    return [...dashboard.evidence.pageWinnersLosers]
      .filter((row) =>
        matchesSearch(
          [row.page, row.status, row.clicksCurrent, row.clicksCompare],
          evidenceSearch,
        ),
      )
      .sort((left, right) => {
        switch (activeEvidenceSort) {
          case "clicks_desc":
            return right.clicksCurrent - left.clicksCurrent;
          case "status_asc":
            return left.status.localeCompare(right.status);
          case "page_asc":
            return left.page.localeCompare(right.page);
          case "delta_desc":
          default:
            return (right.clicksCurrent - right.clicksCompare) - (left.clicksCurrent - left.clicksCompare);
        }
      });
  }, [activeEvidenceSort, dashboard.evidence.pageWinnersLosers, evidenceSearch]);

  const opportunityRows = useMemo(() => {
    return [
      ...dashboard.evidence.nearWins.map((row) => ({
        id: `near:${row.keyword}`,
        type: copy.nearWin,
        target: row.keyword,
        signal: `${copy.position} ${row.position.toFixed(1)} • ${formatNumber(row.impressions, language)} ${copy.impressions.toLowerCase()}`,
        impact: row.estimatedImpact ?? row.impressions,
      })),
      ...dashboard.evidence.ctrGaps.map((row) => ({
        id: `ctr:${row.query}`,
        type: copy.ctrGap,
        target: row.query,
        signal: `${formatNumber(row.estimatedLostClicks, language)} ${copy.reachableClicks} • ${copy.benchmark} ${formatPercent(row.benchmarkCtr)}`,
        impact: row.estimatedLostClicks,
      })),
      ...dashboard.evidence.contentDecay.map((row) => ({
        id: `decay:${row.page}`,
        type: copy.contentDecay,
        target: row.page,
        signal: `${formatNumber(row.estimatedLostClicks, language)} ${copy.lostClicks} • ${copy.peak} ${formatNumber(row.peakClicks, language)}`,
        impact: row.estimatedLostClicks,
      })),
    ]
      .filter((row) => matchesSearch([row.type, row.target, row.signal], evidenceSearch))
      .sort((left, right) => {
        switch (activeEvidenceSort) {
          case "type_asc":
            return left.type.localeCompare(right.type);
          case "target_asc":
            return left.target.localeCompare(right.target);
          case "impact_desc":
          default:
            return right.impact - left.impact;
        }
      });
  }, [
    activeEvidenceSort,
    dashboard.evidence.contentDecay,
    dashboard.evidence.ctrGaps,
    dashboard.evidence.nearWins,
    evidenceSearch,
    copy,
    language,
  ]);

  const filteredChangeRows = useMemo(() => {
    return [...dashboard.evidence.recentChanges]
      .filter((row) => matchesSearch([row.url, row.lastChangedAt], evidenceSearch))
      .sort((left, right) => {
        switch (activeEvidenceSort) {
          case "recent_asc":
            return (left.lastChangedAt ?? "").localeCompare(right.lastChangedAt ?? "");
          case "url_asc":
            return left.url.localeCompare(right.url);
          case "recent_desc":
          default:
            return (right.lastChangedAt ?? "").localeCompare(left.lastChangedAt ?? "");
        }
      });
  }, [activeEvidenceSort, dashboard.evidence.recentChanges, evidenceSearch]);

  const buildHref = (next: {
    preset: string;
    compareMode: string;
    startDate: string;
    endDate: string;
  }) => {
    return buildDashboardHref({
      propertyId: dashboard.property.id,
      currentSearchParams: searchParams.toString(),
      preset: next.preset,
      compareMode: next.compareMode,
      startDate: next.startDate,
      endDate: next.endDate,
      routeMode: mode,
      language,
    });
  };

  const filteredActions = useMemo(
    () => filterDashboardActions(dashboard.actions, actionFilter),
    [actionFilter, dashboard.actions],
  );
  const actionFilterCounts = useMemo(
    () => new Map(RANKED_ACTION_FILTERS.map((filter) => [filter.value, getActionFilterCount(dashboard.actions, filter.value)])),
    [dashboard.actions],
  );
  const visibleExpandedFingerprints = expandedActionFingerprints.filter((fingerprint) =>
    filteredActions.some((action) => action.fingerprint === fingerprint),
  );
  const fallbackExpandedFingerprint = visibleExpandedFingerprints.length
    ? null
    : filteredActions[0]?.fingerprint ?? null;
  const trendMetricOptions = useMemo(() => {
    return [
      { value: "clicks" as const, label: copy.clicks, color: brandColors.primary, data: dashboard.trend.map((point) => point.clicks), axis: 0 },
      { value: "impressions" as const, label: copy.impressions, color: brandColors.accent, data: dashboard.trend.map((point) => point.impressions), axis: 1 },
      { value: "sessions" as const, label: copy.sessions, color: "#10b981", data: dashboard.trend.map((point) => point.sessions).filter((value): value is number => value != null), axis: 0 },
      { value: "users" as const, label: copy.users, color: "#fb923c", data: dashboard.trend.map((point) => point.users).filter((value): value is number => value != null), axis: 0 },
    ].filter((option) => option.data.length > 0);
  }, [brandColors.accent, brandColors.primary, copy, dashboard.trend]);
  const activeTrendMetrics = trendMetricOptions.filter((option) => trendMetrics.includes(option.value));
  const toggleTrendMetric = (value: "clicks" | "impressions" | "sessions" | "users") => {
    setTrendMetrics((current) => {
      if (current.includes(value)) {
        return current.length === 1 ? current : current.filter((metric) => metric !== value);
      }
      return [...current, value];
    });
  };
  const renderRerunButtonContent = (idleLabel: string) => {
    if (isPublicDemo) {
      return (
        <>
          <RefreshCcw className="mr-2 size-4" />
          {copy.demoOnly}
        </>
      );
    }

    if (rerunInProgress) {
      return (
        <>
          <LoaderCircle className="mr-2 size-4 animate-spin" />
          {copy.rerunning}
        </>
      );
    }

    return (
      <>
        <RefreshCcw className="mr-2 size-4" />
        {idleLabel}
      </>
    );
  };

  const applyFilters = () => {
    const nextHref = buildHref({
      preset,
      compareMode,
      startDate,
      endDate,
    });

    if (lowestSafeLatest && endDate > lowestSafeLatest) {
      setPendingNavigation(nextHref);
      setIsFreshnessDialogOpen(true);
      return;
    }

    startTransition(() => {
      router.push(nextHref);
    });
  };

  const applyHeaderWindow = (next: {
    preset?: typeof preset;
    compareMode?: typeof compareMode;
    startDate?: string;
    endDate?: string;
  }) => {
    const nextPreset = next.preset ?? preset;
    const nextCompareMode = next.compareMode ?? compareMode;
    const nextStartDate = next.startDate ?? startDate;
    const nextEndDate = next.endDate ?? endDate;

    setPreset(nextPreset);
    setCompareMode(nextCompareMode);
    setStartDate(nextStartDate);
    setEndDate(nextEndDate);

    const nextHref = buildHref({
      preset: nextPreset,
      compareMode: nextCompareMode,
      startDate: nextStartDate,
      endDate: nextEndDate,
    });

    if (lowestSafeLatest && nextEndDate > lowestSafeLatest) {
      setPendingNavigation(nextHref);
      setIsFreshnessDialogOpen(true);
      return;
    }

    startTransition(() => {
      router.push(nextHref);
    });
  };

  const applyShiftedWindow = () => {
    if (!lowestSafeLatest) return;
    const rangeLength = daysInclusive(startDate, endDate);
    const shiftedEnd = lowestSafeLatest;
    const shiftedStart = preset === "custom" ? addDays(shiftedEnd, -(rangeLength - 1)) : startDate;

    const href = buildHref({
      preset,
      compareMode,
      startDate: shiftedStart,
      endDate: shiftedEnd,
    });
    setIsFreshnessDialogOpen(false);
    setPendingNavigation(null);
    startTransition(() => {
      router.push(href);
    });
  };

  const applyLatestAnyway = () => {
    if (!pendingNavigation) return;
    setIsFreshnessDialogOpen(false);
    const href = pendingNavigation;
    setPendingNavigation(null);
    startTransition(() => {
      router.push(href);
    });
  };

  const updateActionState = async (action: ActionRow, state: ActionRow["state"]) => {
    if (isPublicDemo) {
      toast.info(demoOperationMessage);
      return;
    }
    const pendingKey = `${action.fingerprint}:${state}`;
    setPendingStateKey(pendingKey);
    try {
      await requestJson(`/api/properties/${encodeURIComponent(dashboard.property.id)}/actions`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fingerprint: action.fingerprint,
          actionFamily: action.actionFamily,
          causeFamily: action.causeFamily,
          remedyKey: action.remedyKey,
          targetType: action.targetType,
          targetKey: action.targetKey,
          title: action.title,
          owner: action.owner,
          state,
          snoozedUntil: state === "snoozed" ? addDays(new Date().toISOString().slice(0, 10), 7) : null,
        }),
      });
      toast.success(copy.actionStateUpdated);
      router.refresh();
    } catch (error) {
      toast.error(getAppErrorMessage(error, copy.actionStateUpdateFailed));
    } finally {
      setPendingStateKey(null);
    }
  };

  const assignActionToMe = async (action: ActionRow) => {
    if (isPublicDemo) {
      toast.info(demoOperationMessage);
      return;
    }
    const pendingKey = `${action.fingerprint}:assign`;
    setPendingStateKey(pendingKey);
    try {
      await requestJson(`/api/properties/${encodeURIComponent(dashboard.property.id)}/actions`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fingerprint: action.fingerprint,
          actionFamily: action.actionFamily,
          causeFamily: action.causeFamily,
          remedyKey: action.remedyKey,
          targetType: action.targetType,
          targetKey: action.targetKey,
          title: action.title,
          owner: action.owner,
          assigneeUserId: currentUser.id,
          assigneeEmail: currentUser.email,
        }),
      });
      toast.success(copy.actionAssigned);
      router.refresh();
    } catch (error) {
      toast.error(getAppErrorMessage(error, copy.actionAssignFailed));
    } finally {
      setPendingStateKey(null);
    }
  };

  const captureSnapshot = async () => {
    if (isPublicDemo) {
      toast.info(demoOperationMessage);
      return;
    }
    setSnapshotLoading(true);
    try {
      await requestJson(`/api/properties/${encodeURIComponent(dashboard.property.id)}/snapshots`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          preset: dashboard.analysisWindow.preset,
          compareMode: dashboard.analysisWindow.compareMode,
          startDate: dashboard.analysisWindow.startDate,
          endDate: dashboard.analysisWindow.requestedEndDate,
        }),
      });
      toast.success(copy.snapshotCaptured);
      router.refresh();
    } catch (error) {
      toast.error(getAppErrorMessage(error, copy.snapshotCaptureFailed));
    } finally {
      setSnapshotLoading(false);
    }
  };

  const refreshSourceData = async () => {
    if (isPublicDemo) {
      toast.info(demoOperationMessage);
      return;
    }
    setRefreshLoading(true);
    try {
      const response = await requestJson<{
        status: string;
        dateStart: string;
        dateEnd: string;
      }>(`/api/properties/${encodeURIComponent(dashboard.property.id)}/refresh-data`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          startDate: dashboard.analysisWindow.startDate,
          endDate: dashboard.analysisWindow.requestedEndDate,
          compareStartDate: dashboard.analysisWindow.compareStartDate,
          compareEndDate: dashboard.analysisWindow.compareEndDate,
        }),
      });

      toast.success(
        response
          ? copy.refreshSourceSuccessRange(formatDateLabel(response.dateStart), formatDateLabel(response.dateEnd))
          : copy.refreshSourceSuccess,
      );
      router.refresh();
    } catch (error) {
      toast.error(getAppErrorMessage(error, copy.refreshSourceFailed));
    } finally {
      setRefreshLoading(false);
    }
  };

  const refreshTechnicalScan = async () => {
    if (isPublicDemo) {
      toast.info(demoOperationMessage);
      return;
    }
    setRefreshLoading(true);
    try {
      const response = await requestJson<{ refresh?: PropertyRefreshState }>(
        `/api/properties/${encodeURIComponent(dashboard.property.id)}/refresh-technical`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            preset: dashboard.analysisWindow.preset,
            compareMode: dashboard.analysisWindow.compareMode,
            startDate: dashboard.analysisWindow.startDate,
            endDate: dashboard.analysisWindow.requestedEndDate,
          }),
        },
      );

      setCurrentRefreshState(response?.refresh ?? null);
      toast.success(copy.refreshCrawlQueued);
      router.refresh();
    } catch (error) {
      toast.error(getAppErrorMessage(error, copy.refreshCrawlFailed));
    } finally {
      setRefreshLoading(false);
    }
  };

  const rerunAllData = async () => {
    if (isPublicDemo) {
      toast.info(demoOperationMessage);
      return;
    }
    setRerunLoading(true);
    setCurrentRefreshState((state) => buildOptimisticRerunState(dashboard.property.id, state, copy));
    toast.loading(copy.rerunLoading, {
      id: refreshToastId,
      duration: Infinity,
    });
    try {
      const response = await requestJson<{
        status: "queued" | "partial" | "failed";
        warnings?: string[];
        crawlRefresh?: PropertyRefreshState | { jobId?: string | null; status?: string; message?: string | null };
      }>(`/api/properties/${encodeURIComponent(dashboard.property.id)}/rerun-all`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          preset: dashboard.analysisWindow.preset,
          compareMode: dashboard.analysisWindow.compareMode,
          startDate: dashboard.analysisWindow.startDate,
          endDate: dashboard.analysisWindow.requestedEndDate,
          compareStartDate: dashboard.analysisWindow.compareStartDate,
          compareEndDate: dashboard.analysisWindow.compareEndDate,
        }),
      });

      if (response?.status === "failed") {
        setCurrentRefreshState(null);
        toast.error(copy.rerunFailed, {
          id: refreshToastId,
          duration: TERMINAL_REFRESH_TOAST_DURATION_MS,
        });
      } else if (response?.warnings?.length) {
        toast.loading(`${copy.rerunQueued} ${response.warnings[0]}`, { id: refreshToastId, duration: Infinity });
      } else {
        toast.loading(copy.rerunQueued, { id: refreshToastId, duration: Infinity });
      }
      router.refresh();
    } catch (error) {
      setCurrentRefreshState(null);
      toast.error(getAppErrorMessage(error, copy.rerunFailed), {
        id: refreshToastId,
        duration: TERMINAL_REFRESH_TOAST_DURATION_MS,
      });
    } finally {
      setRerunLoading(false);
    }
  };

  const copyActionAsTask = async (action: ActionRow) => {
    const deterministicEvidence = action.detail.evidence.deterministic
      .map((fact) => `- ${fact.label}: ${fact.value}`)
      .join("\n");
    const recommendedActions = action.detail.recommendedActions
      .map((item, index) => `${index + 1}. ${item}`)
      .join("\n");
    const expectedOutcome = action.detail.expectedOutcome
      .map((item) => `- ${item}`)
      .join("\n");
    const taskDraft = [
      `# ${action.title}`,
      "",
      `Property: ${dashboard.property.name}`,
      `URL/property id: ${dashboard.property.url}`,
      `Priority: ${getPriorityModel(action.systemRank ?? action.rank).label}`,
      `State: ${action.state.replace("_", " ")}`,
      `Category: ${getActionCategoryModel(action).label}`,
      `Owner: ${action.owner}`,
      `Effort: ${action.effort}`,
      `Expected success window: ${action.successWindow}`,
      `Target: ${action.targetKey || action.targetType}`,
      "",
      "## Why this matters",
      action.whyNow,
      "",
      "## Recommended actions",
      recommendedActions || "- Review the linked dashboard action and define implementation steps.",
      "",
      "## Expected outcome",
      expectedOutcome || `- ${action.firstVisibleWin}`,
      "",
      "## Evidence",
      deterministicEvidence || "- No deterministic evidence rows were attached to this action.",
      "",
      "## Confidence",
      `${action.confidenceLabel}: ${action.confidenceBasis}`,
    ].join("\n");

    try {
      await navigator.clipboard.writeText(taskDraft);
      toast.success(copy.taskCopied);
    } catch (error) {
      toast.error(getAppErrorMessage(error, copy.taskCopyFailed));
    }
  };

  const createShareLink = async () => {
    if (isPublicDemo) {
      throw new Error(demoOperationMessage);
    }
    const response = await requestJson<{
      shareUrl: string;
      shareId: string;
      token: string;
      expiresAt?: string | null;
    }>(`/api/properties/${encodeURIComponent(dashboard.property.id)}/share`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        preset: dashboard.analysisWindow.preset,
        compareMode: dashboard.analysisWindow.compareMode,
        startDate: dashboard.analysisWindow.startDate,
        endDate: dashboard.analysisWindow.requestedEndDate,
        mode: "client",
      }),
    });
    if (!response) {
      throw new Error("Share endpoint returned an empty response.");
    }
    return response.shareUrl;
  };

  const shareWithClient = async () => {
    setExportLoading("share");
    try {
      const shareUrl = await createShareLink();
      window.open(shareUrl, "_blank", "noopener,noreferrer");
      toast.success(copy.shareCreated);
    } catch (error) {
      toast.error(getAppErrorMessage(error, copy.shareCreateFailed));
    } finally {
      setExportLoading(null);
    }
  };

  const copyShareLink = async () => {
    setExportLoading("copy");
    try {
      const shareUrl = await createShareLink();
      await navigator.clipboard.writeText(shareUrl);
      toast.success(copy.shareCopied);
    } catch (error) {
      toast.error(getAppErrorMessage(error, copy.shareCopyFailed));
    } finally {
      setExportLoading(null);
    }
  };

  const downloadSnapshotJson = () => {
    const download = buildSnapshotDownload({
      dashboard,
      brandColors,
      language,
    });
    const blob = new Blob([JSON.stringify(download.payload, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = download.filename;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const updatePriorityOverride = async (action: ActionRow, priorityOverride: ActionRow["priorityOverride"]) => {
    if (isPublicDemo) {
      toast.info(demoOperationMessage);
      return;
    }
    const pendingKey = `${action.fingerprint}:override:${priorityOverride}`;
    setPendingStateKey(pendingKey);
    try {
      await requestJson(`/api/properties/${encodeURIComponent(dashboard.property.id)}/actions`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fingerprint: action.fingerprint,
          actionFamily: action.actionFamily,
          causeFamily: action.causeFamily,
          remedyKey: action.remedyKey,
          targetType: action.targetType,
          targetKey: action.targetKey,
          title: action.title,
          owner: action.owner,
          priorityOverride,
        }),
      });
      toast.success(copy.priorityOverrideUpdated);
      router.refresh();
    } catch (error) {
      toast.error(getAppErrorMessage(error, copy.priorityOverrideFailed));
    } finally {
      setPendingStateKey(null);
    }
  };

  const openSnapshotDetail = async (snapshot: SnapshotSummary) => {
    if (isPublicDemo) {
      toast.info(demoOperationMessage);
      return;
    }
    setIsSnapshotSheetOpen(true);
    setSnapshotDetail(null);
    setSnapshotDetailLoading(true);
    try {
      const response = await requestJson<{ snapshot: LiveDashboardSnapshotDetail }>(
        `/api/properties/${encodeURIComponent(dashboard.property.id)}/snapshots?snapshotId=${encodeURIComponent(snapshot.id)}`,
      );
      setSnapshotDetail(response?.snapshot ?? null);
    } catch (error) {
      setIsSnapshotSheetOpen(false);
      toast.error(getAppErrorMessage(error, copy.snapshotLoadFailed));
    } finally {
      setSnapshotDetailLoading(false);
    }
  };

  return (
    <div className="relative space-y-10">
      {isPublicDemo ? null : (
        <PropertyLiveStatus
          propertyId={dashboard.property.id}
          initialRefreshState={currentRefreshState}
          payloadVersion={dashboard.payloadVersion}
          preset={dashboard.analysisWindow.preset}
          compareMode={dashboard.analysisWindow.compareMode}
          startDate={dashboard.analysisWindow.startDate}
          endDate={dashboard.analysisWindow.requestedEndDate}
          onStateChange={setCurrentRefreshState}
          language={language}
        />
      )}
      <div className="space-y-5">
        <header className="space-y-4">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>{copy.properties}</span>
            <ChevronRight className="size-3.5" />
            <span className="font-semibold text-foreground">{dashboard.property.name}</span>
          </div>

          <div className="flex min-w-0 items-center gap-5">
            <div
              className="flex h-[72px] w-[72px] shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-white font-display text-3xl font-extrabold text-white shadow-[0_18px_36px_-22px_rgba(59,130,246,0.75)] ring-1 ring-zinc-200 dark:bg-white/10 dark:ring-white/10"
              style={!showPropertyFavicon ? { background: `linear-gradient(135deg, ${brandColors.primary}, ${brandColors.accent})` } : undefined}
            >
              {!showPropertyFavicon ? (
                dashboard.property.name.slice(0, 1).toUpperCase()
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={propertyFaviconUrl}
                  alt=""
                  className="size-12 rounded-lg"
                  onError={() => setFaviconFailed(true)}
                />
              )}
            </div>
            <div className="min-w-0">
              {isPublicDemo ? (
                <h2 className="truncate font-display text-[44px] font-semibold leading-none tracking-[-0.035em] text-foreground">
                  {dashboard.property.name}
                </h2>
              ) : (
                <h1 className="truncate font-display text-[44px] font-semibold leading-none tracking-[-0.035em] text-foreground">
                  {dashboard.property.name}
                </h1>
              )}
              <div className="mt-3 flex flex-wrap items-center gap-3 text-xl text-muted-foreground">
                <a
                  href={propertySiteUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-primary hover:underline"
                >
                  {dashboard.property.url}
                </a>
                <span>·</span>
                <span className="inline-flex items-center gap-2">
                  {copy.verified} <CheckCircle2 className="size-5 text-emerald-500" />
                </span>
                {crawlFreshness?.note ? (
                  <>
                    <span>·</span>
                    <span>{crawlFreshness.note}</span>
                  </>
                ) : null}
              </div>
            </div>
          </div>

          <div className="flex flex-nowrap items-center gap-1.5 overflow-x-auto pb-1">
            <div className="inline-flex h-10 shrink-0 items-center gap-2 rounded-full border border-zinc-200 bg-white px-3 text-[13px] shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
              <span className="font-bold text-zinc-600 dark:text-zinc-300">{copy.data}</span>
              <span className="flex gap-1.5">
                {headerFreshnessSources.map((source) => (
                  <button
                    key={source.source}
                    type="button"
                    onClick={() => setIsFreshnessDialogOpen(true)}
                    className={`inline-flex h-7 items-center gap-1.5 rounded-full border px-2.5 text-[13px] font-bold leading-none ${
                      source.state === "complete"
                        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                        : source.state === "unavailable"
                          ? "border-rose-200 bg-rose-50 text-rose-700"
                          : "border-amber-200 bg-amber-50 text-amber-800"
                    }`}
                  >
                    <span className="size-2 rounded-full bg-current" />
                    {getHeaderSourceLabel(source.source)}
                  </button>
                ))}
              </span>
            </div>

            <div className="inline-flex h-10 shrink-0 items-center rounded-full border border-zinc-200 bg-white p-1 text-[13px] font-bold shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
              <button
                type="button"
                onClick={() => applyHeaderWindow({ compareMode: "none" })}
                className={`h-8 rounded-full px-3.5 ${compareMode === "none" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
              >
                {copy.single}
              </button>
              <button
                type="button"
                onClick={() => applyHeaderWindow({ compareMode: compareMode === "none" ? "previous_period" : compareMode })}
                className={`h-8 rounded-full px-3.5 ${compareMode !== "none" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
              >
                {copy.compare}
              </button>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                className="inline-flex h-10 min-w-[286px] shrink-0 items-center rounded-full border border-zinc-200 bg-white px-3.5 py-0 text-[13px] font-bold shadow-sm dark:border-white/10 dark:bg-white/[0.04]"
                >
                  <CalendarDays className="mr-2 size-5 text-primary" />
                  <span>{formatPresetLabel(preset, language)}</span>
                  <span className="mx-2 text-muted-foreground">·</span>
                  <span className="font-medium text-muted-foreground">
                    {formatShortDate(dashboard.analysisWindow.startDate, language)} – {formatShortDate(dashboard.analysisWindow.endDate, language)}
                  </span>
                  <ChevronDown className="ml-auto size-4 text-muted-foreground" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" sideOffset={8} className="w-56 rounded-lg">
                <DropdownMenuItem onClick={() => applyHeaderWindow({ preset: "last_7d" })}>{copy.last7Days}</DropdownMenuItem>
                <DropdownMenuItem onClick={() => applyHeaderWindow({ preset: "last_28d" })}>{copy.last28Days}</DropdownMenuItem>
                <DropdownMenuItem onClick={() => applyHeaderWindow({ preset: "last_90d" })}>{copy.last90Days}</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {compareMode !== "none" ? (
              <button
                type="button"
                onClick={() => applyHeaderWindow({ compareMode: compareMode === "previous_period" ? "same_period_last_year" : "previous_period" })}
                className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-3.5 py-0 text-[13px] font-bold uppercase tracking-[0.02em] text-primary shadow-sm dark:border-blue-400/30 dark:bg-blue-400/20 dark:text-blue-200"
              >
                <Share2 className="size-4" />
                VS {formatShortDate(dashboard.analysisWindow.compareStartDate, language)} – {formatShortDate(dashboard.analysisWindow.compareEndDate, language)}
              </button>
            ) : null}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button className="h-10 min-h-0 shrink-0 rounded-full px-5 py-0 text-[13px] font-bold shadow-[0_18px_38px_-18px_rgba(37,99,235,0.75)]">
                  <Download className="mr-2 size-4" />
                  {copy.export}
                  <ChevronDown className="ml-2 size-4 opacity-80" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64 rounded-lg">
                <DropdownMenuItem onClick={shareWithClient} disabled={isBackendOperationDisabled || exportLoading !== null}>
                  <Share2 className="mr-2 size-4" />
                  {copy.shareWithClient}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={copyShareLink} disabled={isBackendOperationDisabled || exportLoading !== null}>
                  <Link className="mr-2 size-4" />
                  {copy.copyShareLink}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={downloadSnapshotJson}>
                  <Download className="mr-2 size-4" />
                  {copy.downloadSnapshot}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={downloadSnapshotJson}>
                  <FileJson className="mr-2 size-4" />
                  {copy.exportJson}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="hidden">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex min-w-0 items-center gap-3">
              <div
                className="flex size-12 shrink-0 items-center justify-center rounded-lg font-display text-xl font-extrabold text-white shadow-sm"
                style={{ background: `linear-gradient(135deg, ${brandColors.primary}, ${brandColors.accent})` }}
              >
                {dashboard.property.name.slice(0, 1).toUpperCase()}
              </div>
              <div className="min-w-0">
                <div className="truncate font-display text-3xl font-semibold leading-none tracking-[-0.02em]">
                  {dashboard.property.name}
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                  <a
                    href={dashboard.property.url.replace(/^sc-domain:/, "https://")}
                    target="_blank"
                    rel="noreferrer"
                    className="text-primary hover:underline"
                  >
                    {dashboard.property.url}
                  </a>
                  <span>·</span>
                  <span className="inline-flex items-center gap-1">
                    Verified <CheckCircle2 className="size-3.5 text-emerald-500" />
                  </span>
                  {crawlFreshness?.note ? (
                    <>
                      <span>·</span>
                      <span>{crawlFreshness.note}</span>
                    </>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-start gap-2 lg:justify-end">
              <div className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-2 py-1 text-xs shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
                <span className="font-semibold text-muted-foreground">Data</span>
                {dashboard.freshness.sources.map((source) => (
                  <button
                    key={source.source}
                    type="button"
                    onClick={() => setIsFreshnessDialogOpen(true)}
                    className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold capitalize ${
                      source.state === "complete"
                        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                        : source.state === "unavailable"
                          ? "border-rose-200 bg-rose-50 text-rose-700"
                          : "border-amber-200 bg-amber-50 text-amber-800"
                    }`}
                  >
                    <span className="size-1.5 rounded-full bg-current" />
                    {getSourceLabel(source.source)}
                  </button>
                ))}
              </div>

              <Select value={compareMode} onValueChange={(value) => setCompareMode(value as typeof compareMode)}>
                <SelectTrigger className="h-9 w-[150px] rounded-full border-zinc-200 bg-white text-xs shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="previous_period">Previous period</SelectItem>
                  <SelectItem value="same_period_last_year">{copy.samePeriodLastYear}</SelectItem>
                  <SelectItem value="none">{copy.noComparison}</SelectItem>
                </SelectContent>
              </Select>

              <Select value={preset} onValueChange={(value) => setPreset(value as typeof preset)}>
                <SelectTrigger className="h-9 w-[132px] rounded-full border-zinc-200 bg-white text-xs shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="last_7d">{copy.last7Days}</SelectItem>
                  <SelectItem value="last_28d">{copy.last28Days}</SelectItem>
                  <SelectItem value="last_90d">{copy.last90Days}</SelectItem>
                  <SelectItem value="custom">{copy.customRange}</SelectItem>
                </SelectContent>
              </Select>

              {preset === "custom" ? (
                <Input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} className="h-9 w-[145px] rounded-full border-zinc-200 bg-white text-xs shadow-sm dark:border-white/10 dark:bg-white/[0.04]" />
              ) : null}
              <Input type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} className="h-9 w-[145px] rounded-full border-zinc-200 bg-white text-xs shadow-sm dark:border-white/10 dark:bg-white/[0.04]" />
              <Button variant="outline" size="sm" className="h-9 rounded-full bg-white" onClick={() => {
                setPreset(dashboard.analysisWindow.preset);
                setCompareMode(dashboard.analysisWindow.compareMode);
                setStartDate(dashboard.analysisWindow.startDate);
                setEndDate(dashboard.analysisWindow.requestedEndDate);
              }}>
                {copy.reset}
              </Button>
              <Button size="sm" className="h-9 rounded-full" onClick={applyFilters}>{copy.apply}</Button>
              <Button variant="outline" size="sm" className="h-9 rounded-full bg-white" onClick={rerunAllData} disabled={rerunDisabled}>
                {renderRerunButtonContent(copy.rerunAllData)}
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="sm" className="h-9 rounded-full">
                    <Share2 className="mr-2 size-4" />
                    Export
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64 rounded-lg">
                  <DropdownMenuItem onClick={shareWithClient} disabled={isBackendOperationDisabled || exportLoading !== null}>
                    <Share2 className="mr-2 size-4" />
                    Share with client
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={copyShareLink} disabled={isBackendOperationDisabled || exportLoading !== null}>
                    <Link className="mr-2 size-4" />
                    {copy.copyShareLink}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={downloadSnapshotJson}>
                    <Download className="mr-2 size-4" />
                    Download snapshot
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={downloadSnapshotJson}>
                    <FileJson className="mr-2 size-4" />
                    Export JSON
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="h-9 rounded-full bg-white">
                    <Download className="mr-2 size-4" />
                    Snapshot
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="end" className="w-80 rounded-lg">
                  <PopoverHeader>
                    <PopoverTitle>Internal snapshot</PopoverTitle>
                  </PopoverHeader>
                  <div className="mt-3 space-y-3 text-sm">
                    <div className="rounded-lg border bg-muted/20 p-3">
                      <div className="font-medium">{formatDateLabel(dashboard.analysisWindow.startDate)} to {formatDateLabel(dashboard.analysisWindow.endDate)}</div>
                      <div className="mt-1 text-muted-foreground">{formatCompareModeLabel(dashboard.analysisWindow.compareMode)}</div>
                    </div>
                    <Button onClick={captureSnapshot} disabled={isBackendOperationDisabled || snapshotLoading} className="w-full rounded-full">
                      {snapshotLoading ? "Capturing..." : "Capture snapshot"}
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>
          </div>

          {visibleDegradedStates.length ? (
            <div className="grid gap-2">
              {visibleDegradedStates.map((state) => (
                <div key={state.code} className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-100">
                  <ShieldAlert className="mt-0.5 size-4 shrink-0" />
                  <div>
                    <div className="font-semibold">{state.title}</div>
                    <div>{state.message}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : null}

          {activeRefreshState ? (
            <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-100">
              <LoaderCircle className="mt-0.5 size-4 shrink-0 animate-spin" />
              <div>
                <div className="font-semibold">{copy.updateInProgress}</div>
                <div>{getActiveRefreshMessage(activeRefreshState, copy)}</div>
              </div>
            </div>
          ) : null}
        </header>

        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
          {tiles.map((tile) => (
            <MetricTile
              key={tile.id}
              label={tile.label}
              value={tile.value}
              delta={tile.delta}
              deltaFallback={tile.deltaFallback}
              sourceState={tile.sourceState}
              sparkline={tile.sparkline}
              color={tile.color}
              badgeLabels={copy}
            />
          ))}
        </section>

        <section className="overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
          <div className="flex flex-col gap-3 border-b border-zinc-200 p-4 dark:border-white/10 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="font-display text-lg font-semibold tracking-[-0.01em]">{copy.rankedFixList}</h2>
              <p className="text-xs text-muted-foreground">{copy.rankedFixListLead}</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex gap-1 overflow-x-auto rounded-full border border-zinc-200 bg-zinc-50 p-1 dark:border-white/10 dark:bg-white/[0.03]">
                {RANKED_ACTION_FILTERS.map((filter) => (
                  <button
                    key={filter.value}
                    type="button"
                    onClick={() => setActionFilter(filter.value)}
                    className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${actionFilter === filter.value ? "bg-white text-foreground shadow-sm dark:bg-white/10" : "text-muted-foreground hover:text-foreground"}`}
                  >
                    <span>{getActionFilterLabel(filter.value, language, true)}</span>
                    <span className="rounded-full bg-zinc-200 px-1.5 py-0.5 text-[10px] leading-none text-zinc-600 dark:bg-white/10 dark:text-zinc-300">
                      {actionFilterCounts.get(filter.value) ?? 0}
                    </span>
                  </button>
                ))}
              </div>
              <Button variant="outline" size="sm" className="h-9 shrink-0 rounded-full bg-white" onClick={rerunAllData} disabled={rerunDisabled}>
                {renderRerunButtonContent(copy.rerun)}
              </Button>
            </div>
          </div>

          {filteredActions.length ? (
            <div className="divide-y divide-zinc-200 dark:divide-white/10">
              {filteredActions.map((action) => {
                const priority = getPriorityModel(action.systemRank ?? action.rank);
                const category = getActionCategoryModel(action);
                const severity = getSeverityValue({ rank: action.systemRank ?? action.rank, systemScore: action.systemScore });
                const isExpanded = expandedActionFingerprints.includes(action.fingerprint)
                  || fallbackExpandedFingerprint === action.fingerprint;
                const liftValue = getActionLiftValue(action);
                const affectedTargets = action.affectedTargets?.length
                  ? action.affectedTargets
                  : action.targetPage
                    ? [{ url: action.targetPage, clicks: null, impressions: null, position: null }]
                    : [{ url: action.targetKey || action.targetType, clicks: null, impressions: null, position: null }];
                return (
                  <div key={action.fingerprint} className={isExpanded ? "bg-zinc-50/80 dark:bg-white/[0.03]" : "bg-white dark:bg-transparent"}>
                    <button
                      type="button"
                      className="grid w-full gap-3 px-4 py-3 text-left transition-colors hover:bg-zinc-50 dark:hover:bg-white/[0.03] lg:grid-cols-[48px_minmax(0,1fr)_150px_42px] lg:items-center"
                      onClick={() => {
                        setExpandedActionFingerprints((current) => {
                          const withoutFallback = fallbackExpandedFingerprint && !current.length
                            ? [fallbackExpandedFingerprint]
                            : current;
                          return withoutFallback.includes(action.fingerprint)
                            ? withoutFallback.filter((fingerprint) => fingerprint !== action.fingerprint)
                            : [...withoutFallback, action.fingerprint];
                        });
                      }}
                    >
                      <span className={`flex size-11 flex-col items-center justify-center rounded-lg border text-xs font-extrabold leading-none ${priority.className}`}>
                        <span>{priority.label}</span>
                        <span className="mt-0.5 max-w-full text-[7px] uppercase tracking-normal opacity-70">{priority.tone}</span>
                      </span>
                      <span className="min-w-0 space-y-1">
                        <span className="block truncate text-sm font-semibold">{action.title}</span>
                        <span className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                          <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 font-semibold uppercase ${category.className}`}>
                            {category.label === "Crawl" ? <Bot className="size-3" /> : null}
                            {category.label}
                          </span>
                          <span className="truncate font-mono">{action.targetKey || action.targetType}</span>
                          <span>{getActionStateLabel(action.state, language)}</span>
                          {action.assigneeEmail ? <span>Assigned: {action.assigneeEmail}</span> : null}
                        </span>
                      </span>
                      <span className="hidden lg:block">
                        <SeverityMeter value={severity} label={copy.severity} />
                      </span>
                      <ChevronRight className={`size-5 justify-self-end text-muted-foreground transition-transform ${isExpanded ? "rotate-90" : ""}`} />
                    </button>

                    {isExpanded ? (
                      <div className="grid gap-5 border-t border-dashed border-zinc-200 p-4 dark:border-white/10 lg:grid-cols-[minmax(0,1fr)_390px]">
                        <div className="space-y-4">
                          <div>
                            <h3 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">{copy.whyThisMatters}</h3>
                            <p className="mt-2 max-w-3xl text-sm leading-6 text-foreground">{action.whyNow}</p>
                          </div>
                          <div>
                            <h3 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                              {action.affectedTargets?.length || action.targetPage ? copy.affectedPages : copy.affectedTarget}
                            </h3>
                            <div className="mt-2 space-y-1.5">
                              {affectedTargets.slice(0, 4).map((target) => (
                                <div key={target.url} className="flex items-center justify-between gap-3 rounded-lg bg-zinc-100/70 px-3 py-2 text-xs dark:bg-white/[0.04]">
                                  <span className="flex min-w-0 items-center gap-2 font-mono text-foreground">
                                    <Link className="size-3.5 shrink-0 text-muted-foreground" />
                                    <span className="truncate">{target.url}</span>
                                  </span>
                                  <span className="shrink-0 text-right text-muted-foreground">
                                    {target.impressions != null ? `${formatNumber(target.impressions, language)} ${copy.impressionsShort}` : target.clicks != null ? `${formatNumber(target.clicks, language)} ${copy.clicksShort}` : copy.noPageMetrics}
                                    {target.position != null ? ` · ${copy.positionShort} ${formatPosition(target.position)}` : ""}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                          <div className="flex flex-wrap items-center gap-2">
                            <Button variant="outline" size="sm" className="rounded-full bg-white" onClick={() => setSelectedAction(action)}>{copy.openDetails}</Button>
                            <Button variant="outline" size="sm" className="rounded-full bg-white" onClick={() => copyActionAsTask(action)}>
                              <ClipboardList className="mr-2 size-4" />
                              {copy.copyAsTask}
                            </Button>
                            <Button variant="outline" size="sm" className="rounded-full bg-white" onClick={() => assignActionToMe(action)} disabled={isBackendOperationDisabled || pendingStateKey?.startsWith(action.fingerprint)}>
                              <UserCheck className="mr-2 size-4" />
                              {copy.assignToMe}
                            </Button>
                            <Button variant="ghost" size="sm" className="rounded-full" onClick={() => updateActionState(action, "done")} disabled={isBackendOperationDisabled || pendingStateKey?.startsWith(action.fingerprint)}>
                              {copy.markDone}
                            </Button>
                          </div>
                        </div>
                        <div className="h-fit space-y-4">
                          <h3 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">{copy.estimatedLift}</h3>
                          <div className="rounded-lg border border-emerald-200 bg-emerald-50/60 p-4 dark:border-emerald-900/60 dark:bg-emerald-950/20">
                            <div className="grid gap-2 text-sm">
                              <div className="flex items-center justify-between gap-4">
                                <span className="font-bold uppercase tracking-[0.12em] text-muted-foreground">{copy.clicksPerMonth}</span>
                                <span className="font-display text-xl font-extrabold text-emerald-700 dark:text-emerald-300">
                                  {liftValue != null ? `+${formatNumber(liftValue, language)}` : "—"}
                                </span>
                              </div>
                              <p className="pt-1 text-muted-foreground">
                                {action.confidenceLabel} · {action.confidenceBasis}
                              </p>
                            </div>
                          </div>
                          <div>
                            <h3 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">{copy.source}</h3>
                            <p className="mt-2 text-sm font-medium text-foreground">{getActionSourceLabel(action)}</p>
                          </div>
                        </div>
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="px-5 py-10 text-center text-sm text-muted-foreground">{copy.noRankedActions}</div>
          )}
        </section>

        <section className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
          <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-display text-lg font-semibold tracking-[-0.01em]">{copy.trafficTrend}</h2>
              <p className="text-xs text-muted-foreground">{formatDateLabel(clicksStart, language)} to {formatDateLabel(clicksEnd, language)}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {trendMetricOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => toggleTrendMetric(option.value)}
                  className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                    trendMetrics.includes(option.value)
                      ? "bg-primary text-primary-foreground"
                      : "bg-white text-muted-foreground hover:bg-zinc-50 hover:text-zinc-700 dark:border-white/10 dark:bg-white dark:text-zinc-500 dark:hover:bg-zinc-100 dark:hover:text-zinc-700"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
          <div className="h-[300px]">
            {dashboard.trend.length && activeTrendMetrics.length ? (
              <EchartsChart
                option={{
                  grid: { left: 44, right: activeTrendMetrics.some((metric) => metric.axis === 1) ? 54 : 18, top: 18, bottom: 30 },
                  tooltip: {
                    trigger: "axis",
                    formatter: (params: unknown) => {
                      const points = Array.isArray(params) ? params as Array<{ axisValueLabel?: string; marker?: string; seriesName?: string; value?: number }> : [params as { axisValueLabel?: string; marker?: string; seriesName?: string; value?: number }];
                      const firstPoint = points[0];
                      if (!firstPoint) return "";
                      return [
                        firstPoint.axisValueLabel ?? "",
                        ...points.map((point) => `${point.marker ?? ""}${point.seriesName ?? "Metric"}: <strong>${formatNumber(point.value ?? null, language)}</strong>`),
                      ].join("<br/>");
                    },
                  },
                  xAxis: {
                    type: "category",
                    data: trendLabels,
                    boundaryGap: false,
                    axisLine: { lineStyle: { color: "#e2e8f0" } },
                    axisTick: { show: false },
                    axisLabel: { color: "#64748b", fontSize: 11, interval: Math.max(0, Math.floor(trendLabels.length / 7)) },
                  },
                  yAxis: [
                    {
                      type: "value",
                      minInterval: 1,
                      axisLine: { show: false },
                      axisTick: { show: false },
                      splitLine: { lineStyle: { color: "#e2e8f0" } },
                      axisLabel: { color: "#64748b", fontSize: 11 },
                    },
                    {
                      type: "value",
                      minInterval: 1,
                      axisLine: { show: false },
                      axisTick: { show: false },
                      splitLine: { show: false },
                      axisLabel: { color: "#64748b", fontSize: 11 },
                    },
                  ],
                  series: activeTrendMetrics.map((metric) => ({
                    name: metric.label,
                    type: "line",
                    yAxisIndex: metric.axis,
                    data: metric.data,
                    smooth: true,
                    showSymbol: false,
                    areaStyle: activeTrendMetrics.length === 1 ? { color: `${metric.color}16` } : undefined,
                    lineStyle: { color: metric.color, width: 2.4 },
                    itemStyle: { color: metric.color },
                  })),
                }}
                className="size-full"
                ariaLabel={`${activeTrendMetrics.map((metric) => metric.label).join(", ")} trend for the selected window`}
              />
            ) : (
                <div className="flex h-full items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground">{copy.noTrendData}</div>
            )}
          </div>
        </section>

        <Tabs
          value={activeEvidenceTab}
          onValueChange={(value) => setActiveEvidenceTab(value as EvidenceTab)}
          className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-white/[0.04]"
        >
          <div className="flex flex-col gap-3 border-b border-zinc-200 pb-4 dark:border-white/10 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="font-display text-lg font-semibold tracking-[-0.01em]">
                {activeEvidenceTab === "pages" ? copy.topPages : activeEvidenceTab === "opportunities" ? copy.topOpportunities : activeEvidenceTab === "changes" ? copy.recentChanges : copy.topQueries}
              </h2>
              <p className="text-xs text-muted-foreground">
                {activeEvidenceTab === "pages" ? copy.pagesLead : activeEvidenceTab === "opportunities" ? copy.opportunitiesLead : activeEvidenceTab === "changes" ? copy.changesLead : copy.queriesLead}
              </p>
            </div>
            <div className="flex w-full flex-col gap-2 sm:flex-row lg:w-auto">
              <div className="relative min-w-0 sm:min-w-[260px]">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input value={evidenceSearch} onChange={(event) => setEvidenceSearch(event.target.value)} placeholder={copy.search} className="h-9 rounded-lg pl-9" />
              </div>
              <TabsList className="h-9 shrink-0 rounded-full border border-zinc-200 bg-zinc-50 p-1 dark:border-white/10 dark:bg-white/[0.03]">
                <TabsTrigger className="h-7 rounded-full px-3 text-xs text-muted-foreground data-[state=active]:bg-white data-[state=active]:!text-zinc-950 data-[state=active]:shadow-sm dark:text-zinc-400 dark:data-[state=active]:bg-white dark:data-[state=active]:!text-zinc-950" value="queries">{copy.queries}</TabsTrigger>
                <TabsTrigger className="h-7 rounded-full px-3 text-xs text-muted-foreground data-[state=active]:bg-white data-[state=active]:!text-zinc-950 data-[state=active]:shadow-sm dark:text-zinc-400 dark:data-[state=active]:bg-white dark:data-[state=active]:!text-zinc-950" value="pages">{copy.pages}</TabsTrigger>
                <TabsTrigger className="h-7 rounded-full px-3 text-xs text-muted-foreground data-[state=active]:bg-white data-[state=active]:!text-zinc-950 data-[state=active]:shadow-sm dark:text-zinc-400 dark:data-[state=active]:bg-white dark:data-[state=active]:!text-zinc-950" value="opportunities">{copy.opportunities}</TabsTrigger>
                <TabsTrigger className="h-7 rounded-full px-3 text-xs text-muted-foreground data-[state=active]:bg-white data-[state=active]:!text-zinc-950 data-[state=active]:shadow-sm dark:text-zinc-400 dark:data-[state=active]:bg-white dark:data-[state=active]:!text-zinc-950" value="changes">{copy.changes}</TabsTrigger>
              </TabsList>
            </div>
          </div>

          <TabsContent value="queries" className="pt-4">
            <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-white/10">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{copy.query}</TableHead>
                    <TableHead className="text-right">{copy.clicks}</TableHead>
                    <TableHead className="text-right">{copy.impressions}</TableHead>
                    <TableHead className="text-right">{copy.ctr}</TableHead>
                    <TableHead className="text-right">{copy.position}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredQueryRows.length ? filteredQueryRows.map((row) => (
                    <TableRow key={row.query}>
                      <TableCell className="font-medium">{row.query}</TableCell>
                      <TableCell className="text-right">{formatNumber(row.clicks, language)}</TableCell>
                      <TableCell className="text-right">{formatNumber(row.impressions, language)}</TableCell>
                      <TableCell className="text-right">{formatPercent(row.ctr)}</TableCell>
                      <TableCell className="text-right">{formatPosition(row.position)}</TableCell>
                    </TableRow>
                  )) : (
                    <TableRow>
                      <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">{copy.noQueryEvidence}</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
          <TabsContent value="pages" className="pt-4">
            <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-white/10">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{copy.page}</TableHead>
                    <TableHead className="text-right">{copy.currentClicks}</TableHead>
                    <TableHead className="text-right">{copy.compareClicks}</TableHead>
                    <TableHead className="text-right">{copy.delta}</TableHead>
                    <TableHead>{copy.status}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPageRows.length ? filteredPageRows.map((row) => {
                    const delta = row.clicksCurrent - row.clicksCompare;
                    return (
                      <TableRow key={row.page}>
                        <TableCell className="font-medium">{row.page}</TableCell>
                        <TableCell className="text-right">{formatNumber(row.clicksCurrent, language)}</TableCell>
                        <TableCell className="text-right">{formatNumber(row.clicksCompare, language)}</TableCell>
                        <TableCell className={`text-right ${toneClasses(delta === 0 ? "neutral" : delta > 0 ? "positive" : "negative")}`}>{delta >= 0 ? "+" : ""}{formatNumber(delta, language)}</TableCell>
                        <TableCell><Badge variant="outline" className="rounded-full">{row.status}</Badge></TableCell>
                      </TableRow>
                    );
                  }) : (
                    <TableRow><TableCell colSpan={5} className="py-10 text-center text-muted-foreground">{copy.noPageEvidence}</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
          <TabsContent value="opportunities" className="pt-4">
            <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-white/10">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{copy.type}</TableHead>
                    <TableHead>{copy.target}</TableHead>
                    <TableHead>{copy.signal}</TableHead>
                    <TableHead className="text-right">{copy.impact}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {opportunityRows.length ? opportunityRows.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell><Badge variant="outline" className="rounded-full">{row.type}</Badge></TableCell>
                      <TableCell className="font-medium">{row.target}</TableCell>
                      <TableCell className="text-muted-foreground">{row.signal}</TableCell>
                      <TableCell className="text-right">{formatNumber(row.impact, language)}</TableCell>
                    </TableRow>
                  )) : (
                    <TableRow><TableCell colSpan={4} className="py-10 text-center text-muted-foreground">{copy.noOpportunityEvidence}</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
          <TabsContent value="changes" className="pt-4">
            <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-white/10">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{copy.changedPage}</TableHead>
                    <TableHead className="text-right">{copy.lastChanged}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredChangeRows.length ? filteredChangeRows.map((row) => (
                    <TableRow key={row.url}>
                      <TableCell className="font-medium">{row.url}</TableCell>
                      <TableCell className="text-right text-muted-foreground">{row.lastChangedAt ? new Date(row.lastChangedAt).toLocaleString(getDashboardLocale(language)) : "—"}</TableCell>
                    </TableRow>
                  )) : (
                    <TableRow><TableCell colSpan={2} className="py-10 text-center text-muted-foreground">{copy.noTrackedChanges}</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
        </Tabs>
      </div>
      <div className="hidden">
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[520px] bg-[radial-gradient(circle_at_18%_18%,rgba(99,102,241,0.13),transparent_32%),radial-gradient(circle_at_82%_8%,rgba(14,165,233,0.10),transparent_28%)] dark:bg-[radial-gradient(circle_at_18%_18%,rgba(99,102,241,0.22),transparent_32%),radial-gradient(circle_at_82%_8%,rgba(14,165,233,0.14),transparent_28%)]" />

      <section className="relative overflow-hidden rounded-[34px] border border-primary/15 bg-[linear-gradient(180deg,rgba(255,255,255,0.86),rgba(255,255,255,0.72))] p-6 shadow-[0_30px_70px_-34px_rgba(15,23,42,0.25)] backdrop-blur-xl dark:border-primary/20 dark:bg-[linear-gradient(180deg,rgba(20,24,38,0.82),rgba(20,24,38,0.7))] dark:shadow-[0_32px_78px_-34px_rgba(0,0,0,0.72)]">
        <div className="pointer-events-none absolute -left-16 top-6 size-40 rounded-full bg-primary/10 blur-3xl dark:bg-primary/20" />
        <div className="pointer-events-none absolute -right-12 top-0 size-36 rounded-full bg-sky-400/10 blur-3xl dark:bg-sky-400/15" />

        <div className="space-y-5">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="rounded-full border-primary/20 bg-primary/[0.06] px-3 py-1 text-[11px] uppercase tracking-[0.16em] text-primary dark:border-primary/30 dark:bg-primary/10">
                {copy.liveWorkspace}
              </Badge>
              <Badge variant={freshnessBadgeVariant(dashboard.freshness.state)} className="rounded-full px-3 py-1">
                {dashboard.freshness.state === "complete" ? copy.dataComplete : dashboard.freshness.state === "stale" ? copy.technicalScanStale : dashboard.freshness.state === "partial" ? copy.partialWindow : copy.dataUnavailable}
              </Badge>
              {currentRefreshState && (currentRefreshState.status === "queued" || currentRefreshState.status === "processing") ? (
                <Badge variant="outline" className="rounded-full border-amber-200 bg-amber-50 px-3 py-1 text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
                  {currentRefreshState.phase === "analysis"
                    ? copy.recomputingActionsShort
                    : currentRefreshState.phase.startsWith("source_data")
                      ? copy.refreshingSourceDataShort
                      : copy.refreshingTechnicalScan}
                </Badge>
              ) : null}
            </div>

            <div className="space-y-2">
              <div className="max-w-3xl text-[clamp(2rem,4vw,3.5rem)] font-semibold tracking-[-0.05em] text-foreground">
                {dashboard.property.name}
              </div>
              <p className="max-w-2xl text-[15px] leading-7 text-muted-foreground">
                {dashboard.operatingContext.summary}
              </p>
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              <div className="rounded-[20px] border border-zinc-200/90 bg-white/84 p-4 shadow-[0_10px_24px_-20px_rgba(15,23,42,0.24)] dark:border-white/10 dark:bg-white/[0.04]">
                <div className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">Operating state</div>
                <div className="mt-2 text-lg font-semibold capitalize">{dashboard.operatingContext.status}</div>
              </div>
              <div className="rounded-[20px] border border-zinc-200/90 bg-white/84 p-4 shadow-[0_10px_24px_-20px_rgba(15,23,42,0.24)] dark:border-white/10 dark:bg-white/[0.04]">
                <div className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">Top risk</div>
                <div className="mt-2 text-sm font-medium">{dashboard.operatingContext.topRisk ?? "No immediate blocker is leading this window."}</div>
              </div>
              <div className="rounded-[20px] border border-zinc-200/90 bg-white/84 p-4 shadow-[0_10px_24px_-20px_rgba(15,23,42,0.24)] dark:border-white/10 dark:bg-white/[0.04]">
                <div className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">Top opportunity</div>
                <div className="mt-2 text-sm font-medium">{dashboard.operatingContext.topOpportunity ?? "No material opportunity is leading this window."}</div>
              </div>
            </div>

            {visibleDegradedStates.length ? (
              <div className="grid gap-3">
                {visibleDegradedStates.map((state) => (
                  <div key={state.code} className="flex flex-col gap-3 rounded-[20px] border border-amber-200/90 bg-amber-50/80 px-4 py-3 text-sm text-amber-950 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-100 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-start gap-3">
                      <ShieldAlert className="mt-0.5 size-4 shrink-0" />
                      <div>
                        <div className="font-medium">{state.title}</div>
                        <div className="text-amber-900/80 dark:text-amber-100/80">{state.message}</div>
                      </div>
                    </div>
                    {state.ctaLabel === "Refresh technical scan" ? (
                      <Button size="sm" variant="outline" className="rounded-full border-amber-300 bg-white/80 dark:border-amber-800 dark:bg-transparent" onClick={refreshTechnicalScan} disabled={isBackendOperationDisabled || refreshLoading}>
                        {refreshLoading ? "Refreshing…" : state.ctaLabel}
                      </Button>
                    ) : null}
                  </div>
                ))}
              </div>
            ) : null}

            <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <PropertyMetaPill className="max-w-full">
                <span className="truncate">{dashboard.property.url}</span>
              </PropertyMetaPill>
              <PropertyMetaPill>
                <a
                  href={dashboard.property.url.replace(/^sc-domain:/, "https://")}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-foreground/80 hover:text-foreground"
                >
                  Open site
                  <ExternalLink className="size-3.5" />
                </a>
              </PropertyMetaPill>
              <PropertyMetaPill>
                <Button
                  variant="ghost"
                  className="h-auto rounded-full px-0 text-foreground/80 hover:bg-transparent hover:text-foreground"
                  onClick={refreshSourceData}
                  disabled={isBackendOperationDisabled || refreshLoading}
                >
                  {refreshLoading ? (
                    <LoaderCircle className="mr-2 size-4 animate-spin" />
                  ) : (
                    <RefreshCcw className="mr-2 size-4" />
                  )}
                  {refreshLoading ? "Re-fetching data…" : "Re-fetch data"}
                </Button>
              </PropertyMetaPill>
              {crawlFreshness ? (
                <PropertyMetaPill>
                  <span className="text-foreground/80">{crawlFreshness.note}</span>
                </PropertyMetaPill>
              ) : null}
              <PropertyMetaPill>
                <Button
                  variant="ghost"
                  className="h-auto rounded-full px-0 text-foreground/80 hover:bg-transparent hover:text-foreground"
                  onClick={refreshTechnicalScan}
                  disabled={isBackendOperationDisabled || refreshLoading}
                >
                  <Zap className="mr-2 size-4" />
                  {language === "de" ? "Technischen Scan aktualisieren" : "Refresh technical scan"}
                </Button>
              </PropertyMetaPill>
              <PropertyMetaPill>
                <Button
                  variant="ghost"
                  className="h-auto rounded-full px-0 text-foreground/80 hover:bg-transparent hover:text-foreground"
                  onClick={rerunAllData}
                  disabled={rerunDisabled}
                >
                  {renderRerunButtonContent(copy.rerunAllData)}
                </Button>
              </PropertyMetaPill>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <div>
                    <PropertyMetaPill>
                      <Button variant="ghost" className="h-auto rounded-full px-0 text-foreground/80 hover:bg-transparent hover:text-foreground">
                        <Share2 className="mr-2 size-4" />
                        Export
                      </Button>
                    </PropertyMetaPill>
                  </div>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64 rounded-lg">
                  <DropdownMenuItem onClick={shareWithClient} disabled={isBackendOperationDisabled || exportLoading !== null}>
                    <Share2 className="mr-2 size-4" />
                    Share with client
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={copyShareLink} disabled={isBackendOperationDisabled || exportLoading !== null}>
                    <Link className="mr-2 size-4" />
                    {copy.copyShareLink}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={downloadSnapshotJson}>
                    <Download className="mr-2 size-4" />
                    Download snapshot
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={downloadSnapshotJson}>
                    <FileJson className="mr-2 size-4" />
                    Export JSON
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Popover>
                <PopoverTrigger asChild>
                  <div>
                    <PropertyMetaPill>
                      <Button variant="ghost" className="h-auto rounded-full px-0 text-foreground/80 hover:bg-transparent hover:text-foreground">
                        <Download className="mr-2 size-4" />
                        Snapshot
                      </Button>
                    </PropertyMetaPill>
                  </div>
                </PopoverTrigger>
                <PopoverContent align="start" className="w-80 space-y-4 rounded-[22px] border-white/70 bg-white/92 shadow-[0_24px_54px_-26px_rgba(15,23,42,0.32)] backdrop-blur dark:border-white/10 dark:bg-[rgba(18,22,34,0.94)] dark:shadow-[0_24px_60px_-22px_rgba(0,0,0,0.75)]">
                  <PopoverHeader>
                    <PopoverTitle>Capture this dashboard state</PopoverTitle>
                  </PopoverHeader>
                  <div className="rounded-[18px] border border-border/70 bg-muted/20 p-3 text-sm">
                    <div className="font-medium">{formatDateLabel(dashboard.analysisWindow.startDate)} to {formatDateLabel(dashboard.analysisWindow.endDate)}</div>
                    <p className="mt-1 text-muted-foreground">
                      {formatCompareModeLabel(dashboard.analysisWindow.compareMode)}
                    </p>
                  </div>
                  <div className="space-y-2 text-sm">
                    <p className="font-medium">Recent snapshots</p>
                    {dashboard.recentSnapshots.length ? (
                      <div className="space-y-2">
                        {dashboard.recentSnapshots.map((snapshot) => (
                          <button
                            key={snapshot.id}
                            type="button"
                            onClick={() => void openSnapshotDetail(snapshot)}
                            disabled={isBackendOperationDisabled}
                            className="flex w-full items-center justify-between rounded-[18px] border border-zinc-200/85 px-3 py-2 text-left transition-colors hover:border-primary/30 hover:bg-primary/[0.04] dark:border-white/10 dark:hover:bg-white/[0.04]"
                          >
                            <div>
                              <div className="text-sm font-medium">{formatDateLabel(snapshot.startDate)} to {formatDateLabel(snapshot.endDate)}</div>
                              <div className="text-xs text-muted-foreground">{new Date(snapshot.createdAt).toLocaleString()}</div>
                            </div>
                            <Badge variant="outline">{snapshot.freshnessState}</Badge>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted-foreground">No snapshots yet.</p>
                    )}
                  </div>
                  <Button onClick={captureSnapshot} disabled={isBackendOperationDisabled || snapshotLoading} className="w-full rounded-full shadow-[0_16px_34px_-16px_rgba(99,102,241,0.5)]">
                    {snapshotLoading ? "Capturing…" : "Capture snapshot"}
                  </Button>
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="flex flex-col overflow-hidden rounded-[26px] border border-zinc-300/95 bg-zinc-50/88 p-4 shadow-[0_18px_42px_-24px_rgba(15,23,42,0.2)] backdrop-blur dark:border-white/12 dark:bg-white/[0.045] dark:shadow-[0_22px_48px_-28px_rgba(0,0,0,0.62)]">
            <div className="flex min-w-0 flex-wrap items-center gap-2 border-b border-zinc-200/95 pb-4 text-sm dark:border-white/12">
              <Badge variant="outline" className="rounded-full border-white/70 bg-white/80 dark:border-white/10 dark:bg-white/[0.05]">
                <Filter className="mr-1.5 size-3.5" />
                {formatDateLabel(dashboard.analysisWindow.startDate)} to {formatDateLabel(dashboard.analysisWindow.endDate)}
              </Badge>
              <Badge variant="outline" className="rounded-full border-white/70 bg-white/80 dark:border-white/10 dark:bg-white/[0.05]">
                {formatCompareModeLabel(dashboard.analysisWindow.compareMode)}
              </Badge>
              {dashboard.freshness.sources.map((source) => (
                <Badge key={source.source} variant="outline" className="rounded-full border-white/70 bg-white/80 dark:border-white/10 dark:bg-white/[0.05]">
                  {getSourceLabel(source.source)}: {source.state}
                </Badge>
              ))}
            </div>

            <div className="mt-4 space-y-4">
              <div className="grid min-w-0 gap-3 lg:grid-cols-2 2xl:grid-cols-[minmax(180px,1fr)_minmax(180px,1fr)_minmax(180px,1fr)_minmax(180px,1fr)]">
                <div className="space-y-2 rounded-[18px] border border-zinc-200/95 bg-white/92 p-3 shadow-[0_8px_20px_-18px_rgba(15,23,42,0.32)] dark:border-white/10 dark:bg-white/[0.035]">
                  <label htmlFor="dashboard-window-preset" className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">Window</label>
                  <Select value={preset} onValueChange={(value) => setPreset(value as typeof preset)}>
                    <SelectTrigger id="dashboard-window-preset" className="h-11 rounded-2xl border-zinc-200/95 bg-white shadow-none dark:border-white/10 dark:bg-white/[0.05]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="last_7d">{copy.last7Days}</SelectItem>
                      <SelectItem value="last_28d">{copy.last28Days}</SelectItem>
                      <SelectItem value="last_90d">{copy.last90Days}</SelectItem>
                      <SelectItem value="custom">{copy.customRange}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2 rounded-[18px] border border-zinc-200/95 bg-white/92 p-3 shadow-[0_8px_20px_-18px_rgba(15,23,42,0.32)] dark:border-white/10 dark:bg-white/[0.035]">
                  <label htmlFor="dashboard-compare-mode" className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">Compare</label>
                  <Select value={compareMode} onValueChange={(value) => setCompareMode(value as typeof compareMode)}>
                    <SelectTrigger id="dashboard-compare-mode" className="h-11 rounded-2xl border-zinc-200/95 bg-white shadow-none dark:border-white/10 dark:bg-white/[0.05]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="previous_period">Previous period</SelectItem>
                      <SelectItem value="same_period_last_year">{copy.samePeriodLastYear}</SelectItem>
                      <SelectItem value="none">{copy.noComparison}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {preset === "custom" ? (
                  <div className="space-y-2 rounded-[18px] border border-zinc-200/95 bg-white/92 p-3 shadow-[0_8px_20px_-18px_rgba(15,23,42,0.32)] dark:border-white/10 dark:bg-white/[0.035]">
                    <label htmlFor="dashboard-start-date" className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">Start date</label>
                    <Input id="dashboard-start-date" type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} className="h-11 rounded-2xl border-zinc-200/95 bg-white shadow-none dark:border-white/10 dark:bg-white/[0.05]" />
                  </div>
                ) : (
                  <div className="space-y-2 rounded-[18px] border border-zinc-200/95 bg-white/92 p-3 shadow-[0_8px_20px_-18px_rgba(15,23,42,0.32)] dark:border-white/10 dark:bg-white/[0.035]">
                    <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">Window start</p>
                    <div className="flex h-11 items-center rounded-2xl border border-zinc-200/95 bg-white px-3 text-sm text-muted-foreground dark:border-white/10 dark:bg-white/[0.05]">
                      {formatDateLabel(dashboard.analysisWindow.startDate)}
                    </div>
                  </div>
                )}

                <div className="min-w-0 space-y-2 rounded-[18px] border border-zinc-200/95 bg-white/92 p-3 shadow-[0_8px_20px_-18px_rgba(15,23,42,0.32)] dark:border-white/10 dark:bg-white/[0.035]">
                  <label htmlFor="dashboard-end-date" className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">End date</label>
                  <Input id="dashboard-end-date" type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} className="h-11 rounded-2xl border-zinc-200/95 bg-white shadow-none dark:border-white/10 dark:bg-white/[0.05]" />
                </div>
              </div>

              <div className="flex flex-col gap-3 border-t border-zinc-200/95 pt-4 dark:border-white/12 lg:flex-row lg:items-center lg:justify-between">
                <p className="text-sm text-muted-foreground">
                  This page is already scoped to <span className="font-medium text-foreground">{dashboard.property.name}</span>. Adjust the window only.
                </p>
                <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
                  <Button variant="outline" className="rounded-full border-white/70 bg-white/80 dark:border-white/10 dark:bg-white/[0.05]" onClick={() => {
                    setPreset(dashboard.analysisWindow.preset);
                    setCompareMode(dashboard.analysisWindow.compareMode);
                    setStartDate(dashboard.analysisWindow.startDate);
                    setEndDate(dashboard.analysisWindow.requestedEndDate);
                  }}>
                    Reset
                  </Button>
                  <Button className="rounded-full shadow-[0_16px_34px_-16px_rgba(99,102,241,0.45)]" onClick={applyFilters}>
                    Apply window
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-[34px] border border-zinc-200/90 bg-[linear-gradient(180deg,rgba(255,255,255,0.84),rgba(255,255,255,0.76))] p-5 shadow-[0_30px_70px_-34px_rgba(15,23,42,0.22)] backdrop-blur-xl dark:border-white/8 dark:bg-[linear-gradient(180deg,rgba(20,24,38,0.72),rgba(20,24,38,0.62))] dark:shadow-[0_34px_80px_-36px_rgba(0,0,0,0.72)]">
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-5">
            <div className="rounded-[28px] border border-zinc-200/90 bg-white/80 p-5 shadow-[0_18px_42px_-24px_rgba(15,23,42,0.2)] backdrop-blur dark:border-white/8 dark:bg-white/[0.04] dark:shadow-[0_22px_48px_-28px_rgba(0,0,0,0.62)]">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">Overview strip</p>
                  <h2 className="mt-1 text-xl font-semibold tracking-tight">What changed and how much it matters</h2>
                </div>
                <p className="max-w-md text-sm text-muted-foreground">
                  Compact on purpose. The strip orients the window fast and leaves the page to decisions.
                </p>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {tiles.map((tile) => (
                  <MetricTile
                    key={tile.id}
                    label={tile.label}
                    value={tile.value}
                    delta={tile.delta}
                    deltaFallback={tile.deltaFallback}
                    sourceState={tile.sourceState}
                  />
                ))}
              </div>
            </div>

            <div className="overflow-hidden rounded-[28px] border border-zinc-200/95 bg-white/82 shadow-[0_22px_48px_-28px_rgba(15,23,42,0.24)] backdrop-blur dark:border-white/8 dark:bg-white/[0.04] dark:shadow-[0_24px_54px_-28px_rgba(0,0,0,0.68)]">
              <div className="border-b border-border/70 px-5 py-4">
                <div className="flex flex-wrap items-end justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Sparkles className="size-4 text-primary" />
                      <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">Priority queue</p>
                    </div>
                    <h2 className="text-xl font-semibold tracking-tight">What To Do Now</h2>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="rounded-full">
                      {dashboard.actions.length} ranked
                    </Badge>
                    <span className="text-sm text-muted-foreground">Compact by default. Open detail only when needed.</span>
                  </div>
                </div>
              </div>

              {dashboard.topAction ? (
                <div className="border-b border-border/70 bg-primary/[0.03] px-5 py-4 dark:bg-white/[0.02]">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-2">
                      <div className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">Top priority this window</div>
                      <div className="text-lg font-semibold">{dashboard.topAction.title}</div>
                      <div className="max-w-3xl text-sm text-muted-foreground">{dashboard.topAction.whyNow}</div>
                      <div className="text-sm font-medium text-foreground/90">{dashboard.topAction.firstVisibleWin}</div>
                    </div>
                    <Button className="rounded-full" onClick={() => setSelectedAction(dashboard.topAction)}>
                      Open details
                    </Button>
                  </div>
                </div>
              ) : null}

              <div className="flex gap-2 overflow-x-auto border-b border-border/70 px-5 py-3">
                {ACTION_FILTERS.map((filter) => (
                  <Button
                    key={filter.value}
                    type="button"
                    variant={actionFilter === filter.value ? "default" : "outline"}
                    size="sm"
                    className="shrink-0 rounded-full"
                    onClick={() => setActionFilter(filter.value)}
                  >
                    {filter.label}
                  </Button>
                ))}
              </div>

              {filteredActions.length ? (
                <div className="divide-y divide-border/70">
                  {filteredActions.map((action) => (
                    <div key={action.fingerprint} className="grid gap-4 px-5 py-4 transition-colors hover:bg-primary/[0.03] dark:hover:bg-white/[0.02] lg:grid-cols-[56px_minmax(0,1fr)_auto] lg:items-center">
                      <div className="flex items-center gap-3 lg:block">
                        <div className="inline-flex size-10 items-center justify-center rounded-2xl border border-white/70 bg-white/80 text-sm font-semibold shadow-[0_10px_26px_-20px_rgba(15,23,42,0.35)] dark:border-white/10 dark:bg-white/[0.05]">
                          {action.rank}
                        </div>
                        <Badge variant="outline" className="rounded-full border-white/70 bg-white/80 lg:mt-2 dark:border-white/10 dark:bg-white/[0.05]">
                          {action.recommendationClass}
                        </Badge>
                      </div>

                      <div className="min-w-0 space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="truncate text-base font-semibold">{action.title}</h3>
                          {action.freshnessEligibility !== "eligible" ? (
                            <Badge variant="outline" className="rounded-full border-amber-300/80 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
                              Partial
                            </Badge>
                          ) : null}
                        </div>
                        <p className="text-sm text-muted-foreground">{action.whyNow}</p>
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant="outline" className="rounded-full border-white/70 bg-white/80 dark:border-white/10 dark:bg-white/[0.05]">{action.owner}</Badge>
                          <Badge variant="outline" className="rounded-full border-white/70 bg-white/80 dark:border-white/10 dark:bg-white/[0.05]">
                            {action.source === "ai" ? "AI review" : action.source === "rules_ai" ? "Rules + AI" : "Rules"}
                          </Badge>
                          <Badge variant="outline" className="rounded-full border-white/70 bg-white/80 dark:border-white/10 dark:bg-white/[0.05]">{action.effort}</Badge>
                          <Badge variant="outline" className="rounded-full border-white/70 bg-white/80 dark:border-white/10 dark:bg-white/[0.05]">{action.successWindow}</Badge>
                          <Badge variant="outline" className="rounded-full border-white/70 bg-white/80 dark:border-white/10 dark:bg-white/[0.05]">System #{action.systemRank ?? action.rank}</Badge>
                          {action.priorityOverride !== "none" ? <Badge variant="outline" className="rounded-full border-sky-200 bg-sky-50 text-sky-900 dark:border-sky-900 dark:bg-sky-950/40 dark:text-sky-100">Override: {action.priorityOverride}</Badge> : null}
                          {action.assigneeEmail ? <Badge variant="outline" className="rounded-full border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-100">Assigned: {action.assigneeEmail}</Badge> : null}
                          {action.snoozedUntil ? <Badge variant="outline" className="rounded-full">Snoozed until {formatDateLabel(action.snoozedUntil)}</Badge> : null}
                          {action.freshnessNote ? <Badge variant="outline" className="rounded-full border-white/70 bg-white/80 dark:border-white/10 dark:bg-white/[0.05]">{action.freshnessNote}</Badge> : null}
                        </div>
                        <div className="text-sm font-medium text-foreground/90">{action.firstVisibleWin}</div>
                      </div>

                      <div className="flex items-center justify-between gap-2 lg:justify-end">
                        <div className="text-right">
                          <div className="text-xs uppercase tracking-[0.14em] text-muted-foreground">State</div>
                          <div className="text-sm font-medium">{action.state.replace("_", " ")}</div>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="rounded-full border-white/70 bg-white/80 dark:border-white/10 dark:bg-white/[0.05]" disabled={isBackendOperationDisabled || pendingStateKey?.startsWith(action.fingerprint)}>
                              Update
                              <ChevronRight className="ml-2 size-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {ACTION_STATES.map((state) => (
                              <DropdownMenuItem key={state.value} onClick={() => updateActionState(action, state.value)} disabled={isBackendOperationDisabled}>
                                {state.label}
                              </DropdownMenuItem>
                            ))}
                            <DropdownMenuItem onClick={() => assignActionToMe(action)} disabled={isBackendOperationDisabled}>
                              <UserCheck className="mr-2 size-4" />
                              Assign to me
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => updatePriorityOverride(action, "none")} disabled={isBackendOperationDisabled}>System priority only</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => updatePriorityOverride(action, "raise")} disabled={isBackendOperationDisabled}>Raise priority</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => updatePriorityOverride(action, "pin")} disabled={isBackendOperationDisabled}>Pin to top</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => updatePriorityOverride(action, "lower")} disabled={isBackendOperationDisabled}>Lower priority</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                        <Button variant="ghost" className="rounded-full" onClick={() => setSelectedAction(action)}>
                          Details
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="px-5 py-10 text-center text-muted-foreground">
                  <p>No weekly actions crossed the ranking threshold for this window.</p>
                  {dashboard.actions.length && actionFilter !== "all" ? (
                    <p className="mt-2 text-sm">
                      No actions match the selected filter.
                    </p>
                  ) : dashboard.freshness.state !== "complete" && earliestCoverageDate ? (
                    <p className="mt-2 text-sm">
                      Current source coverage ends on {formatDateLabel(earliestCoverageDate)}. Refresh source data first if you expect newer actions here.
                    </p>
                  ) : opportunitySignalCount > 0 ? (
                    <p className="mt-2 text-sm">
                      The queue is active. WebHealth found {opportunitySignalCount} supporting signals, but none of them were strong enough to become a ranked action.
                    </p>
                  ) : (
                    <p className="mt-2 text-sm">
                      The queue is active, but this window did not produce any actionable signals yet.
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          <aside className="space-y-5">
            <Card className="gap-0 rounded-[28px] border-zinc-200/90 bg-white/80 py-0 shadow-[0_18px_42px_-24px_rgba(15,23,42,0.24)] backdrop-blur dark:border-white/8 dark:bg-white/[0.05] dark:shadow-[0_22px_50px_-28px_rgba(0,0,0,0.65)]">
              <CardContent className="space-y-4 p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">Trend</p>
                    <h3 className="mt-1 text-lg font-semibold">Clicks over the current window</h3>
                  </div>
                  <Badge variant="outline" className="max-w-full rounded-full border-white/70 bg-white/70 text-xs dark:border-white/10 dark:bg-white/[0.05]">
                    <LineChart className="mr-1 size-3.5" />
                    {formatDateLabel(clicksStart)} to {formatDateLabel(clicksEnd)}
                  </Badge>
                </div>
                <div className="h-40 rounded-[24px] border border-zinc-200/95 bg-[linear-gradient(180deg,rgba(255,255,255,0.92),rgba(240,244,255,0.76))] p-3 dark:border-white/10 dark:bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.02))]">
                  {dashboard.trend.length ? (
                    <EchartsChart
                      option={{
                        grid: { left: 46, right: 18, top: 18, bottom: 32 },
                        tooltip: {
                          trigger: "axis",
                          axisPointer: { type: "line" },
                          formatter: (params: unknown) => {
                            const point = Array.isArray(params) ? params[0] as { axisValueLabel?: string; value?: number } | undefined : params as { axisValueLabel?: string; value?: number } | undefined;
                            if (!point) return "";
                            return `${point.axisValueLabel ?? ""}<br/>Clicks: <strong>${formatNumber(point.value ?? null)}</strong>`;
                          },
                        },
                        xAxis: {
                          type: "category",
                          name: "Date",
                          nameLocation: "middle",
                          nameGap: 24,
                          data: trendLabels,
                          boundaryGap: false,
                          axisLine: { lineStyle: { color: "#cbd5e1" } },
                          axisTick: { show: false },
                          axisLabel: {
                            color: "#64748b",
                            fontSize: 11,
                            interval: Math.max(0, Math.floor(trendLabels.length / 5)),
                          },
                        },
                        yAxis: {
                          type: "value",
                          name: "Clicks",
                          nameLocation: "middle",
                          nameGap: 36,
                          minInterval: 1,
                          axisLine: { show: false },
                          axisTick: { show: false },
                          splitLine: { lineStyle: { color: "#e2e8f0" } },
                          axisLabel: {
                            color: "#64748b",
                            fontSize: 11,
                          },
                        },
                        series: [
                          {
                            type: "line",
                            data: clicksSeries,
                            smooth: true,
                            showSymbol: true,
                            symbolSize: 6,
                            areaStyle: { color: `${brandColors.accent}22` },
                            lineStyle: { color: brandColors.primary, width: 2.6 },
                            itemStyle: { color: brandColors.primary },
                          },
                        ],
                      }}
                      className="size-full"
                      ariaLabel="Clicks trend for the selected window"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                      No trend data is available for this window.
                    </div>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  Context only. The queue on the left remains the primary decision surface.
                </p>
              </CardContent>
            </Card>

            <div className="rounded-[28px] border border-zinc-200/95 bg-white/80 p-5 shadow-[0_18px_42px_-24px_rgba(15,23,42,0.24)] backdrop-blur dark:border-white/8 dark:bg-white/[0.05] dark:shadow-[0_22px_50px_-28px_rgba(0,0,0,0.65)]">
              <div>
                <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">Freshness</p>
                <h3 className="mt-1 text-lg font-semibold">Source coverage</h3>
              </div>
              <div className="mt-4 space-y-3">
                {dashboard.freshness.sources.map((source) => (
                  <div key={source.source} className="rounded-[18px] border border-zinc-200/95 bg-white/85 px-4 py-3 shadow-[0_10px_24px_-22px_rgba(15,23,42,0.35)] dark:border-white/12 dark:bg-white/[0.03]">
                    <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <span className="min-w-0 font-medium">{getSourceLabel(source.source)}</span>
                      <Badge variant="outline" className="w-fit shrink-0 rounded-full">
                        {source.state}
                      </Badge>
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">{source.note}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[28px] border border-zinc-200/95 bg-white/80 p-5 shadow-[0_18px_42px_-24px_rgba(15,23,42,0.24)] backdrop-blur dark:border-white/8 dark:bg-white/[0.05] dark:shadow-[0_22px_50px_-28px_rgba(0,0,0,0.65)]">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">{copy.recentCaptures}</p>
                  <h3 className="mt-1 text-lg font-semibold">{copy.snapshotTrail}</h3>
                </div>
                <Badge variant="outline" className="rounded-full">{dashboard.recentSnapshots.length}</Badge>
              </div>
              <div className="mt-4 space-y-2">
                {dashboard.recentSnapshots.length ? dashboard.recentSnapshots.slice(0, 3).map((snapshot) => (
                  <button
                    key={snapshot.id}
                    type="button"
                    onClick={() => void openSnapshotDetail(snapshot)}
                    disabled={isBackendOperationDisabled}
                    className="w-full rounded-[18px] border border-zinc-200/95 p-3 text-left transition-colors hover:border-primary/35 hover:bg-primary/[0.04] dark:border-white/10 dark:hover:bg-white/[0.04]"
                  >
                    <div className="text-sm font-medium">{formatDateLabel(snapshot.startDate)} to {formatDateLabel(snapshot.endDate)}</div>
                    <div className="mt-1 text-xs text-muted-foreground">{new Date(snapshot.createdAt).toLocaleString()}</div>
                  </button>
                )) : (
                  <p className="text-sm text-muted-foreground">No snapshots captured yet.</p>
                )}
              </div>
            </div>
          </aside>
        </div>
      </section>

      <Tabs
        value={activeEvidenceTab}
        onValueChange={(value) => setActiveEvidenceTab(value as EvidenceTab)}
        className="rounded-[32px] border border-zinc-200/95 bg-white/84 p-5 shadow-[0_28px_64px_-34px_rgba(15,23,42,0.22)] backdrop-blur dark:border-white/8 dark:bg-white/[0.04] dark:shadow-[0_30px_72px_-36px_rgba(0,0,0,0.7)]"
      >
        <div className="flex flex-col gap-4 border-b border-zinc-200/95 pb-5 dark:border-white/10 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-2">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">Supporting analysis</p>
              <h2 className="mt-1 text-[clamp(1.5rem,2vw,2rem)] font-semibold tracking-tight">Open only the context you need</h2>
            </div>
            <p className="max-w-3xl text-sm text-muted-foreground">
              This view is full-width on purpose. Search the evidence, change the sort order, and only open the slice of context you need for the current decision.
            </p>
          </div>

          <div className="flex w-full flex-col gap-3 sm:flex-row lg:w-auto">
            <div className="relative min-w-0 sm:min-w-[260px]">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={evidenceSearch}
                onChange={(event) => setEvidenceSearch(event.target.value)}
                placeholder={`Search ${activeEvidenceTab}`}
                className="h-11 rounded-2xl border-zinc-200/95 bg-white pl-9 dark:border-white/10 dark:bg-white/[0.05]"
              />
            </div>

            <div className="flex items-center gap-2 rounded-2xl border border-zinc-200/95 bg-white px-3 dark:border-white/10 dark:bg-white/[0.05]">
              <ArrowUpDown className="size-4 text-muted-foreground" />
              <Select value={activeEvidenceSort} onValueChange={setEvidenceSort}>
                <SelectTrigger className="h-11 min-w-[180px] border-0 bg-transparent px-0 shadow-none focus:ring-0 dark:bg-transparent">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {evidenceSortOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <TabsList variant="line" className="mt-5 w-full justify-start overflow-x-auto rounded-none border-b border-zinc-200/95 bg-transparent p-0 dark:border-white/10">
          <TabsTrigger value="queries">Queries</TabsTrigger>
          <TabsTrigger value="pages">Pages</TabsTrigger>
          <TabsTrigger value="opportunities">Opportunities</TabsTrigger>
          <TabsTrigger value="changes">Changes</TabsTrigger>
        </TabsList>

        <TabsContent value="queries" className="pt-5">
          <div className="overflow-x-auto rounded-[24px] border border-zinc-200/95 bg-white/82 shadow-[0_16px_34px_-24px_rgba(15,23,42,0.26)] dark:border-white/10 dark:bg-white/[0.03]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Query</TableHead>
                  <TableHead className="text-right">Clicks</TableHead>
                  <TableHead className="text-right">Impressions</TableHead>
                  <TableHead className="text-right">CTR</TableHead>
                  <TableHead className="text-right">Position</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredQueryRows.length ? filteredQueryRows.map((row) => (
                  <TableRow key={row.query}>
                    <TableCell className="font-medium">{row.query}</TableCell>
                    <TableCell className="text-right">{formatNumber(row.clicks)}</TableCell>
                    <TableCell className="text-right">{formatNumber(row.impressions)}</TableCell>
                    <TableCell className="text-right">{formatPercent(row.ctr)}</TableCell>
                    <TableCell className="text-right">{formatPosition(row.position)}</TableCell>
                  </TableRow>
                )) : (
                  <TableRow>
                    <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                      No query evidence matches this search.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="pages" className="pt-5">
          <div className="overflow-x-auto rounded-[24px] border border-zinc-200/95 bg-white/82 shadow-[0_16px_34px_-24px_rgba(15,23,42,0.26)] dark:border-white/10 dark:bg-white/[0.03]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Page</TableHead>
                  <TableHead className="text-right">Current clicks</TableHead>
                  <TableHead className="text-right">Compare clicks</TableHead>
                  <TableHead className="text-right">Delta</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPageRows.length ? filteredPageRows.map((row) => {
                  const delta = row.clicksCurrent - row.clicksCompare;
                  return (
                    <TableRow key={row.page}>
                      <TableCell className="font-medium">{row.page}</TableCell>
                      <TableCell className="text-right">{formatNumber(row.clicksCurrent)}</TableCell>
                      <TableCell className="text-right">{formatNumber(row.clicksCompare)}</TableCell>
                      <TableCell className={`text-right ${toneClasses(delta === 0 ? "neutral" : delta > 0 ? "positive" : "negative")}`}>
                        {delta >= 0 ? "+" : ""}{formatNumber(delta)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="rounded-full">{row.status}</Badge>
                      </TableCell>
                    </TableRow>
                  );
                }) : (
                  <TableRow>
                    <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                      No page evidence matches this search.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="opportunities" className="pt-5">
          <div className="overflow-x-auto rounded-[24px] border border-zinc-200/95 bg-white/82 shadow-[0_16px_34px_-24px_rgba(15,23,42,0.26)] dark:border-white/10 dark:bg-white/[0.03]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Target</TableHead>
                  <TableHead>Signal</TableHead>
                  <TableHead className="text-right">Impact</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {opportunityRows.length ? opportunityRows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>
                      <Badge variant="outline" className="rounded-full">{row.type}</Badge>
                    </TableCell>
                    <TableCell className="font-medium">{row.target}</TableCell>
                    <TableCell className="text-muted-foreground">{row.signal}</TableCell>
                    <TableCell className="text-right">{formatNumber(row.impact)}</TableCell>
                  </TableRow>
                )) : (
                  <TableRow>
                    <TableCell colSpan={4} className="py-10 text-center text-muted-foreground">
                      No opportunity evidence matches this search.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="changes" className="pt-5">
          <div className="overflow-x-auto rounded-[24px] border border-zinc-200/95 bg-white/82 shadow-[0_16px_34px_-24px_rgba(15,23,42,0.26)] dark:border-white/10 dark:bg-white/[0.03]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Changed page</TableHead>
                  <TableHead className="text-right">Last changed</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredChangeRows.length ? filteredChangeRows.map((row) => (
                  <TableRow key={row.url}>
                    <TableCell className="font-medium">{row.url}</TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {row.lastChangedAt ? new Date(row.lastChangedAt).toLocaleString() : "—"}
                    </TableCell>
                  </TableRow>
                )) : (
                  <TableRow>
                    <TableCell colSpan={2} className="py-10 text-center text-muted-foreground">
                      No tracked page changes match this search.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>
      </div>

      <Sheet open={!!selectedAction} onOpenChange={(open) => !open && setSelectedAction(null)}>
        <SheetContent side="right" className="w-full max-w-2xl overflow-y-auto">
          {selectedAction ? (
            <div className="space-y-6">
              <SheetHeader>
                <SheetTitle>{selectedAction.title}</SheetTitle>
                <SheetDescription>{selectedAction.whyNow}</SheetDescription>
              </SheetHeader>

              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className="rounded-full">{selectedAction.recommendationClass}</Badge>
                <Badge variant="outline" className="rounded-full">
                  {selectedAction.source === "ai" ? "AI review" : selectedAction.source === "rules_ai" ? "Rules + AI" : "Rules"}
                </Badge>
                <Badge variant="outline" className="rounded-full">{selectedAction.owner}</Badge>
                <Badge variant="outline" className="rounded-full">{selectedAction.effort}</Badge>
                <Badge variant="outline" className="rounded-full">{selectedAction.successWindow}</Badge>
                <Badge variant="outline" className="rounded-full">{copy.system} #{selectedAction.systemRank ?? selectedAction.rank}</Badge>
                {selectedAction.priorityOverride !== "none" ? <Badge variant="outline" className="rounded-full">{copy.override}: {selectedAction.priorityOverride}</Badge> : null}
                {selectedAction.freshnessNote ? <Badge variant="outline" className="rounded-full">{selectedAction.freshnessNote}</Badge> : null}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-border/70 p-4">
                  <div className="text-xs uppercase tracking-[0.14em] text-muted-foreground">{copy.firstVisibleWin}</div>
                  <div className="mt-2 font-medium">{selectedAction.firstVisibleWin}</div>
                </div>
                <div className="rounded-2xl border border-border/70 p-4">
                  <div className="text-xs uppercase tracking-[0.14em] text-muted-foreground">{copy.confidence}</div>
                  <div className="mt-2 font-medium">{selectedAction.confidenceLabel}</div>
                  <p className="mt-1 text-sm text-muted-foreground">{selectedAction.confidenceBasis}</p>
                </div>
              </div>

              {currentRefreshState && (currentRefreshState.status === "queued" || currentRefreshState.status === "processing") ? (
                <div className="rounded-2xl border border-amber-200 bg-amber-50/80 p-4 text-sm text-amber-950 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-100">
                  Recommendations may change when the refresh completes.
                </div>
              ) : null}

              <div className="grid gap-4">
                <div className="rounded-2xl border border-border/70 p-4">
                  <div className="flex items-center gap-2 font-medium"><CheckCircle2 className="size-4 text-emerald-600" /> {copy.recommendedActions}</div>
                  <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                    {selectedAction.detail.recommendedActions.map((item) => (
                      <li key={item} className="flex gap-2"><ArrowRight className="mt-0.5 size-4 shrink-0 text-muted-foreground" />{item}</li>
                    ))}
                  </ul>
                </div>

                <div className="rounded-2xl border border-border/70 p-4">
                  <div className="flex items-center gap-2 font-medium"><Clock3 className="size-4 text-primary" /> {copy.expectedOutcome}</div>
                  <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                    {selectedAction.detail.expectedOutcome.map((item) => (
                      <li key={item} className="flex gap-2"><ArrowRight className="mt-0.5 size-4 shrink-0 text-muted-foreground" />{item}</li>
                    ))}
                  </ul>
                </div>

                <div className="rounded-2xl border border-border/70 p-4">
                  <div className="flex items-center gap-2 font-medium"><AlertTriangle className="size-4 text-amber-600" /> {copy.evidence}</div>
                  <div className="mt-3 space-y-2 text-sm text-muted-foreground">
                    {selectedAction.detail.evidence.deterministic.map((fact) => (
                      <div key={`${fact.label}:${fact.value}`} className="flex items-start justify-between gap-4 rounded-xl border border-border/60 px-3 py-2">
                        <span>{fact.label}</span>
                        <span className="font-medium text-foreground">{fact.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </SheetContent>
      </Sheet>

      <Sheet open={isSnapshotSheetOpen} onOpenChange={setIsSnapshotSheetOpen}>
        <SheetContent side="right" className="w-full max-w-xl overflow-y-auto">
          <div className="space-y-6">
            <SheetHeader>
              <SheetTitle>{copy.snapshotTrailEntry}</SheetTitle>
              <SheetDescription>
                {copy.snapshotTrailDescription}
              </SheetDescription>
            </SheetHeader>

            {snapshotDetailLoading ? (
              <div className="rounded-2xl border border-zinc-200/90 px-4 py-6 text-sm text-muted-foreground dark:border-white/10">
                {copy.loadingSnapshotDetails}
              </div>
            ) : snapshotDetail ? (
              <>
                <div className="rounded-[24px] border border-zinc-200/95 bg-white/86 p-4 shadow-[0_16px_34px_-24px_rgba(15,23,42,0.28)] dark:border-white/10 dark:bg-white/[0.04]">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">{copy.capturedWindow}</p>
                      <h3 className="mt-1 text-lg font-semibold">
                        {formatDateLabel(snapshotDetail.startDate, language)} to {formatDateLabel(snapshotDetail.endDate, language)}
                      </h3>
                    </div>
                    <Badge variant="outline" className="rounded-full">
                      {snapshotDetail.freshnessState}
                    </Badge>
                  </div>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl border border-zinc-200/90 p-3 dark:border-white/10">
                      <div className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">{copy.comparison}</div>
                      <div className="mt-1 text-sm font-medium">{formatCompareModeLabel(snapshotDetail.compareMode, language)}</div>
                    </div>
                    <div className="rounded-2xl border border-zinc-200/90 p-3 dark:border-white/10">
                      <div className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">{copy.capturedAt}</div>
                      <div className="mt-1 text-sm font-medium">{new Date(snapshotDetail.createdAt).toLocaleString(getDashboardLocale(language))}</div>
                    </div>
                  </div>
                </div>

                {snapshotDetail.overview ? (
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl border border-zinc-200/90 p-4 dark:border-white/10">
                      <div className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">{copy.clicks}</div>
                      <div className="mt-2 text-3xl font-semibold">{formatNumber(snapshotDetail.overview.clicks, language)}</div>
                    </div>
                    <div className="rounded-2xl border border-zinc-200/90 p-4 dark:border-white/10">
                      <div className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">{copy.impressions}</div>
                      <div className="mt-2 text-3xl font-semibold">{formatNumber(snapshotDetail.overview.impressions, language)}</div>
                    </div>
                    <div className="rounded-2xl border border-zinc-200/90 p-4 dark:border-white/10">
                      <div className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">CTR</div>
                      <div className="mt-2 text-3xl font-semibold">{formatPercent(snapshotDetail.overview.ctr)}</div>
                    </div>
                    <div className="rounded-2xl border border-zinc-200/90 p-4 dark:border-white/10">
                      <div className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">{copy.capturedActions}</div>
                      <div className="mt-2 text-3xl font-semibold">{formatNumber(snapshotDetail.actionCount, language)}</div>
                    </div>
                  </div>
                ) : null}

                {snapshotDetail.freshnessSummary?.sources?.length ? (
                  <div className="space-y-3">
                    <div className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">{copy.freshnessAtCapture}</div>
                    {snapshotDetail.freshnessSummary.sources.map((source) => (
                      <div key={source.source} className="rounded-2xl border border-zinc-200/90 px-4 py-3 dark:border-white/10">
                        <div className="flex items-center justify-between gap-3">
                          <div className="font-medium">{getSourceLabel(source.source)}</div>
                          <Badge variant="outline" className="rounded-full">{source.state}</Badge>
                        </div>
                        <p className="mt-2 text-sm text-muted-foreground">{source.note}</p>
                      </div>
                    ))}
                  </div>
                ) : null}
              </>
            ) : (
              <div className="rounded-2xl border border-zinc-200/90 px-4 py-6 text-sm text-muted-foreground dark:border-white/10">
                {copy.noSnapshotDetails}
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>

      <Dialog open={isFreshnessDialogOpen} onOpenChange={setIsFreshnessDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{copy.freshnessDialogTitle}</DialogTitle>
            <DialogDescription>
              {copy.freshnessDialogDescription}
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-2xl border border-border/70 bg-muted/20 p-4 text-sm text-muted-foreground">
            {dashboard.freshness.sources.filter((source) => source.safeLatestDate).map((source) => (
              <div key={source.source}>
                {getSourceLabel(source.source)} {copy.completeThrough} {formatSourceDateCoverage(source.safeLatestDate)}.
              </div>
            ))}
          </div>
          <DialogFooter className="gap-2 sm:justify-between">
            <Button variant="outline" onClick={applyShiftedWindow}>
              {copy.shiftSafeWindow}
            </Button>
            <Button onClick={applyLatestAnyway}>
              {copy.useLatestData}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
