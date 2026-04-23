"use client";

import { startTransition, useEffect, useMemo, useState, type ReactNode } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertTriangle, ArrowRight, ArrowUpDown, CheckCircle2, ChevronRight, Clock3, Download, ExternalLink, Filter, LineChart, LoaderCircle, RefreshCcw, Search, ShieldAlert, Sparkles, Zap } from "lucide-react";
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

type PropertyDashboardClientProps = {
  dashboard: LiveDashboardData;
  brandColors: {
    primary: string;
    accent: string;
  };
};

type ActionRow = LiveDashboardData["actions"][number];
type SnapshotSummary = LiveDashboardData["recentSnapshots"][number];
type EvidenceTab = "queries" | "pages" | "opportunities" | "changes";

const ACTION_STATES: Array<{ value: ActionRow["state"]; label: string }> = [
  { value: "open", label: "Open" },
  { value: "in_progress", label: "In progress" },
  { value: "done", label: "Done" },
  { value: "ignored", label: "Ignored" },
  { value: "snoozed", label: "Snoozed" },
];

function formatNumber(value: number | null) {
  if (value == null) return "—";
  return Math.round(value).toLocaleString();
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

function formatDateLabel(value: string | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat(undefined, {
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

function formatCompareModeLabel(compareMode: LiveDashboardData["analysisWindow"]["compareMode"]) {
  if (compareMode === "none") return "No comparison";
  if (compareMode === "previous_period") return "Previous period";
  return "Same period last year";
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
  sourceState,
  }: {
  label: string;
  value: string;
  delta: ReturnType<typeof formatDelta>;
  sourceState: "complete" | "partial" | "stale" | "unavailable";
}) {
  return (
    <div className="h-full min-w-0 overflow-hidden rounded-[22px] border border-slate-200/85 bg-white/82 px-4 py-3 shadow-[0_16px_34px_-26px_rgba(15,23,42,0.22)] backdrop-blur dark:border-white/10 dark:bg-white/[0.04] dark:shadow-[0_24px_50px_-32px_rgba(0,0,0,0.65)]">
      <div className="flex min-w-0 items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
          <div className="mt-2 font-display text-[28px] font-bold tracking-[-0.04em] text-foreground">{value}</div>
        </div>
        {sourceState !== "complete" ? (
          <Badge variant="outline" className="w-fit shrink-0 whitespace-nowrap border-amber-200 bg-amber-50/90 text-[11px] text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
            {sourceState === "stale" ? "Stale" : "Partial"}
          </Badge>
        ) : null}
      </div>
      <div className={`mt-3 text-sm font-medium ${delta ? toneClasses(delta.tone) : "text-muted-foreground"}`}>
        {delta ? delta.text : "No comparison"}
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
    <div className={`inline-flex items-center gap-1.5 rounded-full border border-slate-200/95 bg-white/88 px-3 py-1.5 shadow-[0_10px_24px_-22px_rgba(15,23,42,0.28)] backdrop-blur dark:border-white/10 dark:bg-white/[0.04] ${className}`}>
      {children}
    </div>
  );
}

export function PropertyDashboardClient({
  dashboard,
  brandColors,
}: PropertyDashboardClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedAction, setSelectedAction] = useState<ActionRow | null>(null);
  const [pendingStateKey, setPendingStateKey] = useState<string | null>(null);
  const [snapshotLoading, setSnapshotLoading] = useState(false);
  const [refreshLoading, setRefreshLoading] = useState(false);
  const [snapshotDetail, setSnapshotDetail] = useState<LiveDashboardSnapshotDetail | null>(null);
  const [isSnapshotSheetOpen, setIsSnapshotSheetOpen] = useState(false);
  const [snapshotDetailLoading, setSnapshotDetailLoading] = useState(false);
  const [isFreshnessDialogOpen, setIsFreshnessDialogOpen] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(null);
  const [activeEvidenceTab, setActiveEvidenceTab] = useState<EvidenceTab>("queries");
  const [evidenceSearch, setEvidenceSearch] = useState("");
  const [evidenceSort, setEvidenceSort] = useState("clicks_desc");
  const [currentRefreshState, setCurrentRefreshState] = useState<PropertyRefreshState | null>(dashboard.propertyUpdateState);

  useEffect(() => {
    setCurrentRefreshState(dashboard.propertyUpdateState);
  }, [dashboard.propertyUpdateState, dashboard.payloadVersion]);

  const [preset, setPreset] = useState(dashboard.analysisWindow.preset);
  const [compareMode, setCompareMode] = useState(dashboard.analysisWindow.compareMode);
  const [startDate, setStartDate] = useState(dashboard.analysisWindow.startDate);
  const [endDate, setEndDate] = useState(dashboard.analysisWindow.requestedEndDate);

  const safeLatestDate = dashboard.freshness.safeLatestDate;
  const crawlFreshness = dashboard.freshness.sources.find((source) => source.source === "crawl");
  const lowestSafeLatest = dashboard.freshness.sources
    .filter((source) => source.source !== "crawl")
    .map((source) => source.safeLatestDate)
    .filter((value): value is string => !!value)
    .sort()[0] ?? safeLatestDate;

  const tiles = useMemo(() => {
    return [
      {
        id: "clicks",
        label: "Clicks",
        value: formatNumber(dashboard.overview.clicks),
        delta: compareMode === "none" ? null : formatDelta(dashboard.overview.clicks, dashboard.overview.compare.clicks),
        sourceState: dashboard.freshness.sources.find((source) => source.source === "gsc")?.state ?? "unavailable",
      },
      {
        id: "impressions",
        label: "Impressions",
        value: formatNumber(dashboard.overview.impressions),
        delta: compareMode === "none" ? null : formatDelta(dashboard.overview.impressions, dashboard.overview.compare.impressions),
        sourceState: dashboard.freshness.sources.find((source) => source.source === "gsc")?.state ?? "unavailable",
      },
      {
        id: "ctr",
        label: "CTR",
        value: formatPercent(dashboard.overview.ctr),
        delta: compareMode === "none" ? null : formatDelta(dashboard.overview.ctr, dashboard.overview.compare.ctr, { percent: true }),
        sourceState: dashboard.freshness.sources.find((source) => source.source === "gsc")?.state ?? "unavailable",
      },
      {
        id: "position",
        label: "Position",
        value: formatPosition(dashboard.overview.position),
        delta: compareMode === "none" ? null : formatDelta(dashboard.overview.position, dashboard.overview.compare.position, { invert: true }),
        sourceState: dashboard.freshness.sources.find((source) => source.source === "gsc")?.state ?? "unavailable",
      },
      ...(dashboard.overview.sessions != null
        ? [
            {
              id: "sessions",
              label: "Sessions",
              value: formatNumber(dashboard.overview.sessions),
              delta: compareMode === "none" ? null : formatDelta(dashboard.overview.sessions, dashboard.overview.compare.sessions),
              sourceState: dashboard.freshness.sources.find((source) => source.source === "ga4")?.state ?? "unavailable",
            },
          ]
        : []),
      ...(dashboard.overview.users != null
        ? [
            {
              id: "users",
              label: "Users",
              value: formatNumber(dashboard.overview.users),
              delta: compareMode === "none" ? null : formatDelta(dashboard.overview.users, dashboard.overview.compare.users),
              sourceState: dashboard.freshness.sources.find((source) => source.source === "ga4")?.state ?? "unavailable",
            },
          ]
        : []),
    ];
  }, [compareMode, dashboard]);

  const clicksSeries = dashboard.trend.map((point) => point.clicks);
  const clicksStart = dashboard.trend[0]?.date ?? dashboard.analysisWindow.startDate;
  const clicksEnd = dashboard.trend[dashboard.trend.length - 1]?.date ?? dashboard.analysisWindow.endDate;
  const trendLabels = dashboard.trend.map((point) =>
    new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" }).format(
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
        { value: "clicks_desc", label: "Sort by clicks" },
        { value: "impressions_desc", label: "Sort by impressions" },
        { value: "ctr_desc", label: "Sort by CTR" },
        { value: "position_asc", label: "Sort by position" },
        { value: "query_asc", label: "Sort by query" },
      ];
    }

    if (activeEvidenceTab === "pages") {
      return [
        { value: "delta_desc", label: "Sort by change" },
        { value: "clicks_desc", label: "Sort by current clicks" },
        { value: "status_asc", label: "Sort by status" },
        { value: "page_asc", label: "Sort by page" },
      ];
    }

    if (activeEvidenceTab === "opportunities") {
      return [
        { value: "impact_desc", label: "Sort by impact" },
        { value: "type_asc", label: "Sort by type" },
        { value: "target_asc", label: "Sort by target" },
      ];
    }

    return [
      { value: "recent_desc", label: "Sort by latest" },
      { value: "recent_asc", label: "Sort by oldest" },
      { value: "url_asc", label: "Sort by URL" },
    ];
  }, [activeEvidenceTab]);

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
        type: "Near win",
        target: row.keyword,
        signal: `Position ${row.position.toFixed(1)} • ${formatNumber(row.impressions)} impressions`,
        impact: row.estimatedImpact ?? row.impressions,
      })),
      ...dashboard.evidence.ctrGaps.map((row) => ({
        id: `ctr:${row.query}`,
        type: "CTR gap",
        target: row.query,
        signal: `${formatNumber(row.estimatedLostClicks)} reachable clicks • benchmark ${formatPercent(row.benchmarkCtr)}`,
        impact: row.estimatedLostClicks,
      })),
      ...dashboard.evidence.contentDecay.map((row) => ({
        id: `decay:${row.page}`,
        type: "Content decay",
        target: row.page,
        signal: `${formatNumber(row.estimatedLostClicks)} lost clicks • peak ${formatNumber(row.peakClicks)}`,
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
    const params = new URLSearchParams(searchParams.toString());
    params.set("preset", next.preset);
    params.set("compare", next.compareMode);
    params.set("end", next.endDate);

    if (next.preset === "custom") {
      params.set("start", next.startDate);
    } else {
      params.delete("start");
    }

    return `/properties/${encodeURIComponent(dashboard.property.id)}?${params.toString()}`;
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
        }),
      });
      toast.success("Action state updated.");
      router.refresh();
    } catch (error) {
      toast.error(getAppErrorMessage(error, "Could not update action state."));
    } finally {
      setPendingStateKey(null);
    }
  };

  const captureSnapshot = async () => {
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
      toast.success("Snapshot captured.");
      router.refresh();
    } catch (error) {
      toast.error(getAppErrorMessage(error, "Could not capture snapshot."));
    } finally {
      setSnapshotLoading(false);
    }
  };

  const refreshSourceData = async () => {
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
          ? `Data refreshed for ${formatDateLabel(response.dateStart)} to ${formatDateLabel(response.dateEnd)}.`
          : "Source data refreshed.",
      );
      router.refresh();
    } catch (error) {
      toast.error(getAppErrorMessage(error, "Could not refresh source data."));
    } finally {
      setRefreshLoading(false);
    }
  };

  const refreshTechnicalScan = async () => {
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
      toast.success("Technical refresh queued.");
      router.refresh();
    } catch (error) {
      toast.error(getAppErrorMessage(error, "Could not refresh the technical scan."));
    } finally {
      setRefreshLoading(false);
    }
  };

  const updatePriorityOverride = async (action: ActionRow, priorityOverride: ActionRow["priorityOverride"]) => {
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
      toast.success("Priority override updated.");
      router.refresh();
    } catch (error) {
      toast.error(getAppErrorMessage(error, "Could not update the priority override."));
    } finally {
      setPendingStateKey(null);
    }
  };

  const openSnapshotDetail = async (snapshot: SnapshotSummary) => {
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
      toast.error(getAppErrorMessage(error, "Could not load snapshot details."));
    } finally {
      setSnapshotDetailLoading(false);
    }
  };

  return (
    <div className="relative space-y-10">
      <PropertyLiveStatus
        propertyId={dashboard.property.id}
        initialRefreshState={dashboard.propertyUpdateState}
        payloadVersion={dashboard.payloadVersion}
        onStateChange={setCurrentRefreshState}
      />
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[520px] bg-[radial-gradient(circle_at_18%_18%,rgba(99,102,241,0.13),transparent_32%),radial-gradient(circle_at_82%_8%,rgba(14,165,233,0.10),transparent_28%)] dark:bg-[radial-gradient(circle_at_18%_18%,rgba(99,102,241,0.22),transparent_32%),radial-gradient(circle_at_82%_8%,rgba(14,165,233,0.14),transparent_28%)]" />

      <section className="relative overflow-hidden rounded-[34px] border border-primary/15 bg-[linear-gradient(180deg,rgba(255,255,255,0.86),rgba(255,255,255,0.72))] p-6 shadow-[0_30px_70px_-34px_rgba(15,23,42,0.25)] backdrop-blur-xl dark:border-primary/20 dark:bg-[linear-gradient(180deg,rgba(20,24,38,0.82),rgba(20,24,38,0.7))] dark:shadow-[0_32px_78px_-34px_rgba(0,0,0,0.72)]">
        <div className="pointer-events-none absolute -left-16 top-6 h-40 w-40 rounded-full bg-primary/10 blur-3xl dark:bg-primary/20" />
        <div className="pointer-events-none absolute -right-12 top-0 h-36 w-36 rounded-full bg-sky-400/10 blur-3xl dark:bg-sky-400/15" />

        <div className="space-y-5">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="rounded-full border-primary/20 bg-primary/[0.06] px-3 py-1 text-[11px] uppercase tracking-[0.16em] text-primary dark:border-primary/30 dark:bg-primary/10">
                Live workspace
              </Badge>
              <Badge variant={freshnessBadgeVariant(dashboard.freshness.state)} className="rounded-full px-3 py-1">
                {dashboard.freshness.state === "complete" ? "Data complete" : dashboard.freshness.state === "stale" ? "Technical scan stale" : dashboard.freshness.state === "partial" ? "Partial window" : "Data unavailable"}
              </Badge>
              {currentRefreshState && (currentRefreshState.status === "queued" || currentRefreshState.status === "processing") ? (
                <Badge variant="outline" className="rounded-full border-amber-200 bg-amber-50 px-3 py-1 text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
                  {currentRefreshState.phase === "analysis" ? "Recomputing ranked actions" : "Refreshing technical scan"}
                </Badge>
              ) : null}
            </div>

            <div className="space-y-2">
              <h1 className="max-w-3xl text-[clamp(2rem,4vw,3.5rem)] font-semibold tracking-[-0.05em] text-foreground">
                {dashboard.property.name}
              </h1>
              <p className="max-w-2xl text-[15px] leading-7 text-muted-foreground">
                {dashboard.operatingContext.summary}
              </p>
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              <div className="rounded-[20px] border border-slate-200/90 bg-white/84 p-4 shadow-[0_10px_24px_-20px_rgba(15,23,42,0.24)] dark:border-white/10 dark:bg-white/[0.04]">
                <div className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">Operating state</div>
                <div className="mt-2 text-lg font-semibold capitalize">{dashboard.operatingContext.status}</div>
              </div>
              <div className="rounded-[20px] border border-slate-200/90 bg-white/84 p-4 shadow-[0_10px_24px_-20px_rgba(15,23,42,0.24)] dark:border-white/10 dark:bg-white/[0.04]">
                <div className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">Top risk</div>
                <div className="mt-2 text-sm font-medium">{dashboard.operatingContext.topRisk ?? "No immediate blocker is leading this window."}</div>
              </div>
              <div className="rounded-[20px] border border-slate-200/90 bg-white/84 p-4 shadow-[0_10px_24px_-20px_rgba(15,23,42,0.24)] dark:border-white/10 dark:bg-white/[0.04]">
                <div className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">Top opportunity</div>
                <div className="mt-2 text-sm font-medium">{dashboard.operatingContext.topOpportunity ?? "No material opportunity is leading this window."}</div>
              </div>
            </div>

            {dashboard.degradedStates.length ? (
              <div className="grid gap-3">
                {dashboard.degradedStates.map((state) => (
                  <div key={state.code} className="flex flex-col gap-3 rounded-[20px] border border-amber-200/90 bg-amber-50/80 px-4 py-3 text-sm text-amber-950 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-100 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-start gap-3">
                      <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
                      <div>
                        <div className="font-medium">{state.title}</div>
                        <div className="text-amber-900/80 dark:text-amber-100/80">{state.message}</div>
                      </div>
                    </div>
                    {state.ctaLabel === "Refresh technical scan" ? (
                      <Button size="sm" variant="outline" className="rounded-full border-amber-300 bg-white/80 dark:border-amber-800 dark:bg-transparent" onClick={refreshTechnicalScan} disabled={refreshLoading}>
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
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </PropertyMetaPill>
              <PropertyMetaPill>
                <Button
                  variant="ghost"
                  className="h-auto rounded-full px-0 text-foreground/80 hover:bg-transparent hover:text-foreground"
                  onClick={refreshSourceData}
                  disabled={refreshLoading}
                >
                  {refreshLoading ? (
                    <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCcw className="mr-2 h-4 w-4" />
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
                  disabled={refreshLoading}
                >
                  <Zap className="mr-2 h-4 w-4" />
                  Refresh technical scan
                </Button>
              </PropertyMetaPill>
              <Popover>
                <PopoverTrigger asChild>
                  <div>
                    <PropertyMetaPill>
                      <Button variant="ghost" className="h-auto rounded-full px-0 text-foreground/80 hover:bg-transparent hover:text-foreground">
                        <Download className="mr-2 h-4 w-4" />
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
                            className="flex w-full items-center justify-between rounded-[18px] border border-slate-200/85 px-3 py-2 text-left transition-colors hover:border-primary/30 hover:bg-primary/[0.04] dark:border-white/10 dark:hover:bg-white/[0.04]"
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
                  <Button onClick={captureSnapshot} disabled={snapshotLoading} className="w-full rounded-full shadow-[0_16px_34px_-16px_rgba(99,102,241,0.5)]">
                    {snapshotLoading ? "Capturing…" : "Capture snapshot"}
                  </Button>
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="flex flex-col overflow-hidden rounded-[26px] border border-slate-300/95 bg-slate-50/88 p-4 shadow-[0_18px_42px_-24px_rgba(15,23,42,0.2)] backdrop-blur dark:border-white/12 dark:bg-white/[0.045] dark:shadow-[0_22px_48px_-28px_rgba(0,0,0,0.62)]">
            <div className="flex min-w-0 flex-wrap items-center gap-2 border-b border-slate-200/95 pb-4 text-sm dark:border-white/12">
              <Badge variant="outline" className="rounded-full border-white/70 bg-white/80 dark:border-white/10 dark:bg-white/[0.05]">
                <Filter className="mr-1.5 h-3.5 w-3.5" />
                {formatDateLabel(dashboard.analysisWindow.startDate)} to {formatDateLabel(dashboard.analysisWindow.endDate)}
              </Badge>
              <Badge variant="outline" className="rounded-full border-white/70 bg-white/80 dark:border-white/10 dark:bg-white/[0.05]">
                {formatCompareModeLabel(dashboard.analysisWindow.compareMode)}
              </Badge>
              {dashboard.freshness.sources.map((source) => (
                <Badge key={source.source} variant="outline" className="rounded-full border-white/70 bg-white/80 dark:border-white/10 dark:bg-white/[0.05]">
                  {source.source === "ga4" ? "GA4" : source.source === "crawl" ? "Crawl" : "Search Console"}: {source.state}
                </Badge>
              ))}
            </div>

            <div className="mt-4 space-y-4">
              <div className="grid min-w-0 gap-3 lg:grid-cols-2 2xl:grid-cols-[minmax(180px,1fr)_minmax(180px,1fr)_minmax(180px,1fr)_minmax(180px,1fr)]">
                <div className="space-y-2 rounded-[18px] border border-slate-200/95 bg-white/92 px-3 py-3 shadow-[0_8px_20px_-18px_rgba(15,23,42,0.32)] dark:border-white/10 dark:bg-white/[0.035]">
                  <label className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">Window</label>
                  <Select value={preset} onValueChange={(value) => setPreset(value as typeof preset)}>
                    <SelectTrigger className="h-11 rounded-2xl border-slate-200/95 bg-white shadow-none dark:border-white/10 dark:bg-white/[0.05]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="last_7d">Last 7 days</SelectItem>
                      <SelectItem value="last_28d">Last 28 days</SelectItem>
                      <SelectItem value="last_90d">Last 90 days</SelectItem>
                      <SelectItem value="custom">Custom range</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2 rounded-[18px] border border-slate-200/95 bg-white/92 px-3 py-3 shadow-[0_8px_20px_-18px_rgba(15,23,42,0.32)] dark:border-white/10 dark:bg-white/[0.035]">
                  <label className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">Compare</label>
                  <Select value={compareMode} onValueChange={(value) => setCompareMode(value as typeof compareMode)}>
                    <SelectTrigger className="h-11 rounded-2xl border-slate-200/95 bg-white shadow-none dark:border-white/10 dark:bg-white/[0.05]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="previous_period">Previous period</SelectItem>
                      <SelectItem value="same_period_last_year">Same period last year</SelectItem>
                      <SelectItem value="none">No comparison</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {preset === "custom" ? (
                  <div className="space-y-2 rounded-[18px] border border-slate-200/95 bg-white/92 px-3 py-3 shadow-[0_8px_20px_-18px_rgba(15,23,42,0.32)] dark:border-white/10 dark:bg-white/[0.035]">
                    <label className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">Start date</label>
                    <Input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} className="h-11 rounded-2xl border-slate-200/95 bg-white shadow-none dark:border-white/10 dark:bg-white/[0.05]" />
                  </div>
                ) : (
                  <div className="space-y-2 rounded-[18px] border border-slate-200/95 bg-white/92 px-3 py-3 shadow-[0_8px_20px_-18px_rgba(15,23,42,0.32)] dark:border-white/10 dark:bg-white/[0.035]">
                    <label className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">Window start</label>
                    <div className="flex h-11 items-center rounded-2xl border border-slate-200/95 bg-white px-3 text-sm text-muted-foreground dark:border-white/10 dark:bg-white/[0.05]">
                      {formatDateLabel(dashboard.analysisWindow.startDate)}
                    </div>
                  </div>
                )}

                <div className="min-w-0 space-y-2 rounded-[18px] border border-slate-200/95 bg-white/92 px-3 py-3 shadow-[0_8px_20px_-18px_rgba(15,23,42,0.32)] dark:border-white/10 dark:bg-white/[0.035]">
                  <label className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">End date</label>
                  <Input type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} className="h-11 rounded-2xl border-slate-200/95 bg-white shadow-none dark:border-white/10 dark:bg-white/[0.05]" />
                </div>
              </div>

              <div className="flex flex-col gap-3 border-t border-slate-200/95 pt-4 dark:border-white/12 lg:flex-row lg:items-center lg:justify-between">
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

      <section className="rounded-[34px] border border-slate-200/90 bg-[linear-gradient(180deg,rgba(255,255,255,0.84),rgba(255,255,255,0.76))] p-5 shadow-[0_30px_70px_-34px_rgba(15,23,42,0.22)] backdrop-blur-xl dark:border-white/8 dark:bg-[linear-gradient(180deg,rgba(20,24,38,0.72),rgba(20,24,38,0.62))] dark:shadow-[0_34px_80px_-36px_rgba(0,0,0,0.72)]">
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-5">
            <div className="rounded-[28px] border border-slate-200/90 bg-white/80 p-5 shadow-[0_18px_42px_-24px_rgba(15,23,42,0.2)] backdrop-blur dark:border-white/8 dark:bg-white/[0.04] dark:shadow-[0_22px_48px_-28px_rgba(0,0,0,0.62)]">
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
                    sourceState={tile.sourceState}
                  />
                ))}
              </div>
            </div>

            <div className="overflow-hidden rounded-[28px] border border-slate-200/95 bg-white/82 shadow-[0_22px_48px_-28px_rgba(15,23,42,0.24)] backdrop-blur dark:border-white/8 dark:bg-white/[0.04] dark:shadow-[0_24px_54px_-28px_rgba(0,0,0,0.68)]">
              <div className="border-b border-border/70 px-5 py-4">
                <div className="flex flex-wrap items-end justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-primary" />
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

              {dashboard.actions.length ? (
                <div className="divide-y divide-border/70">
                  {dashboard.actions.map((action) => (
                    <div key={action.fingerprint} className="grid gap-4 px-5 py-4 transition-colors hover:bg-primary/[0.03] dark:hover:bg-white/[0.02] lg:grid-cols-[56px_minmax(0,1fr)_auto] lg:items-center">
                      <div className="flex items-center gap-3 lg:block">
                        <div className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-white/70 bg-white/80 text-sm font-semibold shadow-[0_10px_26px_-20px_rgba(15,23,42,0.35)] dark:border-white/10 dark:bg-white/[0.05]">
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
                          <Badge variant="outline" className="rounded-full border-white/70 bg-white/80 dark:border-white/10 dark:bg-white/[0.05]">{action.effort}</Badge>
                          <Badge variant="outline" className="rounded-full border-white/70 bg-white/80 dark:border-white/10 dark:bg-white/[0.05]">{action.successWindow}</Badge>
                          <Badge variant="outline" className="rounded-full border-white/70 bg-white/80 dark:border-white/10 dark:bg-white/[0.05]">System #{action.systemRank ?? action.rank}</Badge>
                          {action.priorityOverride !== "none" ? <Badge variant="outline" className="rounded-full border-sky-200 bg-sky-50 text-sky-900 dark:border-sky-900 dark:bg-sky-950/40 dark:text-sky-100">Override: {action.priorityOverride}</Badge> : null}
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
                            <Button variant="outline" className="rounded-full border-white/70 bg-white/80 dark:border-white/10 dark:bg-white/[0.05]" disabled={pendingStateKey?.startsWith(action.fingerprint)}>
                              Update
                              <ChevronRight className="ml-2 h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {ACTION_STATES.map((state) => (
                              <DropdownMenuItem key={state.value} onClick={() => updateActionState(action, state.value)}>
                                {state.label}
                              </DropdownMenuItem>
                            ))}
                            <DropdownMenuItem onClick={() => updatePriorityOverride(action, "none")}>System priority only</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => updatePriorityOverride(action, "raise")}>Raise priority</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => updatePriorityOverride(action, "pin")}>Pin to top</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => updatePriorityOverride(action, "lower")}>Lower priority</DropdownMenuItem>
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
                  {dashboard.freshness.state !== "complete" && earliestCoverageDate ? (
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
            <Card className="gap-0 rounded-[28px] border-slate-200/90 bg-white/80 py-0 shadow-[0_18px_42px_-24px_rgba(15,23,42,0.24)] backdrop-blur dark:border-white/8 dark:bg-white/[0.05] dark:shadow-[0_22px_50px_-28px_rgba(0,0,0,0.65)]">
              <CardContent className="space-y-4 p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">Trend</p>
                    <h3 className="mt-1 text-lg font-semibold">Clicks over the current window</h3>
                  </div>
                  <Badge variant="outline" className="max-w-full rounded-full border-white/70 bg-white/70 text-xs dark:border-white/10 dark:bg-white/[0.05]">
                    <LineChart className="mr-1 h-3.5 w-3.5" />
                    {formatDateLabel(clicksStart)} to {formatDateLabel(clicksEnd)}
                  </Badge>
                </div>
                <div className="h-40 rounded-[24px] border border-slate-200/95 bg-[linear-gradient(180deg,rgba(255,255,255,0.92),rgba(240,244,255,0.76))] p-3 dark:border-white/10 dark:bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.02))]">
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
                    className="h-full w-full"
                    ariaLabel="Clicks trend for the selected window"
                  />
                </div>
                <p className="text-sm text-muted-foreground">
                  Context only. The queue on the left remains the primary decision surface.
                </p>
              </CardContent>
            </Card>

            <div className="rounded-[28px] border border-slate-200/95 bg-white/80 p-5 shadow-[0_18px_42px_-24px_rgba(15,23,42,0.24)] backdrop-blur dark:border-white/8 dark:bg-white/[0.05] dark:shadow-[0_22px_50px_-28px_rgba(0,0,0,0.65)]">
              <div>
                <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">Freshness</p>
                <h3 className="mt-1 text-lg font-semibold">Source coverage</h3>
              </div>
              <div className="mt-4 space-y-3">
                {dashboard.freshness.sources.map((source) => (
                  <div key={source.source} className="rounded-[18px] border border-slate-200/95 bg-white/85 px-4 py-3 shadow-[0_10px_24px_-22px_rgba(15,23,42,0.35)] dark:border-white/12 dark:bg-white/[0.03]">
                    <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <span className="min-w-0 font-medium">{source.source === "ga4" ? "GA4" : "Search Console"}</span>
                      <Badge variant="outline" className="w-fit shrink-0 rounded-full">
                        {source.state}
                      </Badge>
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">{source.note}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[28px] border border-slate-200/95 bg-white/80 p-5 shadow-[0_18px_42px_-24px_rgba(15,23,42,0.24)] backdrop-blur dark:border-white/8 dark:bg-white/[0.05] dark:shadow-[0_22px_50px_-28px_rgba(0,0,0,0.65)]">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">Recent captures</p>
                  <h3 className="mt-1 text-lg font-semibold">Snapshot trail</h3>
                </div>
                <Badge variant="outline" className="rounded-full">{dashboard.recentSnapshots.length}</Badge>
              </div>
              <div className="mt-4 space-y-2">
                {dashboard.recentSnapshots.length ? dashboard.recentSnapshots.slice(0, 3).map((snapshot) => (
                  <button
                    key={snapshot.id}
                    type="button"
                    onClick={() => void openSnapshotDetail(snapshot)}
                    className="w-full rounded-[18px] border border-slate-200/95 px-3 py-3 text-left transition-colors hover:border-primary/35 hover:bg-primary/[0.04] dark:border-white/10 dark:hover:bg-white/[0.04]"
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
        className="rounded-[32px] border border-slate-200/95 bg-white/84 p-5 shadow-[0_28px_64px_-34px_rgba(15,23,42,0.22)] backdrop-blur dark:border-white/8 dark:bg-white/[0.04] dark:shadow-[0_30px_72px_-36px_rgba(0,0,0,0.7)]"
      >
        <div className="flex flex-col gap-4 border-b border-slate-200/95 pb-5 dark:border-white/10 lg:flex-row lg:items-end lg:justify-between">
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
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={evidenceSearch}
                onChange={(event) => setEvidenceSearch(event.target.value)}
                placeholder={`Search ${activeEvidenceTab}`}
                className="h-11 rounded-2xl border-slate-200/95 bg-white pl-9 dark:border-white/10 dark:bg-white/[0.05]"
              />
            </div>

            <div className="flex items-center gap-2 rounded-2xl border border-slate-200/95 bg-white px-3 dark:border-white/10 dark:bg-white/[0.05]">
              <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
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

        <TabsList variant="line" className="mt-5 w-full justify-start overflow-x-auto rounded-none border-b border-slate-200/95 bg-transparent p-0 dark:border-white/10">
          <TabsTrigger value="queries">Queries</TabsTrigger>
          <TabsTrigger value="pages">Pages</TabsTrigger>
          <TabsTrigger value="opportunities">Opportunities</TabsTrigger>
          <TabsTrigger value="changes">Changes</TabsTrigger>
        </TabsList>

        <TabsContent value="queries" className="pt-5">
          <div className="overflow-hidden rounded-[24px] border border-slate-200/95 bg-white/82 shadow-[0_16px_34px_-24px_rgba(15,23,42,0.26)] dark:border-white/10 dark:bg-white/[0.03]">
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
          <div className="overflow-hidden rounded-[24px] border border-slate-200/95 bg-white/82 shadow-[0_16px_34px_-24px_rgba(15,23,42,0.26)] dark:border-white/10 dark:bg-white/[0.03]">
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
          <div className="overflow-hidden rounded-[24px] border border-slate-200/95 bg-white/82 shadow-[0_16px_34px_-24px_rgba(15,23,42,0.26)] dark:border-white/10 dark:bg-white/[0.03]">
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
          <div className="overflow-hidden rounded-[24px] border border-slate-200/95 bg-white/82 shadow-[0_16px_34px_-24px_rgba(15,23,42,0.26)] dark:border-white/10 dark:bg-white/[0.03]">
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
                <Badge variant="outline" className="rounded-full">{selectedAction.owner}</Badge>
                <Badge variant="outline" className="rounded-full">{selectedAction.effort}</Badge>
                <Badge variant="outline" className="rounded-full">{selectedAction.successWindow}</Badge>
                <Badge variant="outline" className="rounded-full">System #{selectedAction.systemRank ?? selectedAction.rank}</Badge>
                {selectedAction.priorityOverride !== "none" ? <Badge variant="outline" className="rounded-full">Override: {selectedAction.priorityOverride}</Badge> : null}
                {selectedAction.freshnessNote ? <Badge variant="outline" className="rounded-full">{selectedAction.freshnessNote}</Badge> : null}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-border/70 p-4">
                  <div className="text-xs uppercase tracking-[0.14em] text-muted-foreground">First visible win</div>
                  <div className="mt-2 font-medium">{selectedAction.firstVisibleWin}</div>
                </div>
                <div className="rounded-2xl border border-border/70 p-4">
                  <div className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Confidence</div>
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
                  <div className="flex items-center gap-2 font-medium"><CheckCircle2 className="h-4 w-4 text-emerald-600" /> Recommended actions</div>
                  <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                    {selectedAction.detail.recommendedActions.map((item) => (
                      <li key={item} className="flex gap-2"><ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />{item}</li>
                    ))}
                  </ul>
                </div>

                <div className="rounded-2xl border border-border/70 p-4">
                  <div className="flex items-center gap-2 font-medium"><Clock3 className="h-4 w-4 text-primary" /> Expected outcome</div>
                  <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                    {selectedAction.detail.expectedOutcome.map((item) => (
                      <li key={item} className="flex gap-2"><ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />{item}</li>
                    ))}
                  </ul>
                </div>

                <div className="rounded-2xl border border-border/70 p-4">
                  <div className="flex items-center gap-2 font-medium"><AlertTriangle className="h-4 w-4 text-amber-600" /> Evidence</div>
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
              <SheetTitle>Snapshot trail entry</SheetTitle>
              <SheetDescription>
                Review the frozen window, freshness state, and top-line metrics captured from the live dashboard.
              </SheetDescription>
            </SheetHeader>

            {snapshotDetailLoading ? (
              <div className="rounded-2xl border border-slate-200/90 px-4 py-6 text-sm text-muted-foreground dark:border-white/10">
                Loading snapshot details…
              </div>
            ) : snapshotDetail ? (
              <>
                <div className="rounded-[24px] border border-slate-200/95 bg-white/86 p-4 shadow-[0_16px_34px_-24px_rgba(15,23,42,0.28)] dark:border-white/10 dark:bg-white/[0.04]">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">Captured window</p>
                      <h3 className="mt-1 text-lg font-semibold">
                        {formatDateLabel(snapshotDetail.startDate)} to {formatDateLabel(snapshotDetail.endDate)}
                      </h3>
                    </div>
                    <Badge variant="outline" className="rounded-full">
                      {snapshotDetail.freshnessState}
                    </Badge>
                  </div>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl border border-slate-200/90 px-3 py-3 dark:border-white/10">
                      <div className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">Comparison</div>
                      <div className="mt-1 text-sm font-medium">{formatCompareModeLabel(snapshotDetail.compareMode)}</div>
                    </div>
                    <div className="rounded-2xl border border-slate-200/90 px-3 py-3 dark:border-white/10">
                      <div className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">Captured at</div>
                      <div className="mt-1 text-sm font-medium">{new Date(snapshotDetail.createdAt).toLocaleString()}</div>
                    </div>
                  </div>
                </div>

                {snapshotDetail.overview ? (
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl border border-slate-200/90 p-4 dark:border-white/10">
                      <div className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">Clicks</div>
                      <div className="mt-2 text-3xl font-semibold">{formatNumber(snapshotDetail.overview.clicks)}</div>
                    </div>
                    <div className="rounded-2xl border border-slate-200/90 p-4 dark:border-white/10">
                      <div className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">Impressions</div>
                      <div className="mt-2 text-3xl font-semibold">{formatNumber(snapshotDetail.overview.impressions)}</div>
                    </div>
                    <div className="rounded-2xl border border-slate-200/90 p-4 dark:border-white/10">
                      <div className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">CTR</div>
                      <div className="mt-2 text-3xl font-semibold">{formatPercent(snapshotDetail.overview.ctr)}</div>
                    </div>
                    <div className="rounded-2xl border border-slate-200/90 p-4 dark:border-white/10">
                      <div className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">Captured actions</div>
                      <div className="mt-2 text-3xl font-semibold">{formatNumber(snapshotDetail.actionCount)}</div>
                    </div>
                  </div>
                ) : null}

                {snapshotDetail.freshnessSummary?.sources?.length ? (
                  <div className="space-y-3">
                    <div className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">Freshness at capture time</div>
                    {snapshotDetail.freshnessSummary.sources.map((source) => (
                      <div key={source.source} className="rounded-2xl border border-slate-200/90 px-4 py-3 dark:border-white/10">
                        <div className="flex items-center justify-between gap-3">
                          <div className="font-medium">{source.source === "ga4" ? "GA4" : "Search Console"}</div>
                          <Badge variant="outline" className="rounded-full">{source.state}</Badge>
                        </div>
                        <p className="mt-2 text-sm text-muted-foreground">{source.note}</p>
                      </div>
                    ))}
                  </div>
                ) : null}
              </>
            ) : (
              <div className="rounded-2xl border border-slate-200/90 px-4 py-6 text-sm text-muted-foreground dark:border-white/10">
                Snapshot details are not available for this item.
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>

      <Dialog open={isFreshnessDialogOpen} onOpenChange={setIsFreshnessDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Recent data may still be incomplete</DialogTitle>
            <DialogDescription>
              The selected end date runs past the latest safe coverage for at least one source. Keep the selected dates if you want the freshest available view, or shift the window back to the latest safe date.
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-2xl border border-border/70 bg-muted/20 p-4 text-sm text-muted-foreground">
            {dashboard.freshness.sources.map((source) => (
              <div key={source.source}>
                {source.source === "ga4" ? "GA4" : "Search Console"} is complete through {formatDateLabel(source.safeLatestDate)}.
              </div>
            ))}
          </div>
          <DialogFooter className="gap-2 sm:justify-between">
            <Button variant="outline" onClick={applyShiftedWindow}>
              Shift to safe window
            </Button>
            <Button onClick={applyLatestAnyway}>
              Use latest available data
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
