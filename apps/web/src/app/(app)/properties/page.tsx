"use client";

import Link from "next/link";
import { useState, useEffect, useCallback, useRef } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { getSyncStatusBadge } from "@/lib/status-badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Globe, HelpCircle, Link2, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  SyncButton,
  formatPropertiesSyncSuccess,
  runPropertiesSync,
} from "../dashboard/sync-button";
import { toast } from "sonner";
import { getAppErrorMessage } from "@/lib/client/app-error";
import { requestJson } from "@/lib/client/api";
import { useGoogleAccessRecovery } from "@/components/google-access-recovery";
import {
  getGoogleAccessDialogModel,
  getGoogleAccessIssueFromCode,
} from "@/components/google-access-recovery.logic";

type Property = {
  id: string;
  name: string;
  url: string;
  type: string;
  syncStatus: string;
  lastSyncedAt: string | null;
  ga4PropertyId: string | null;
  weeklyReviewEnabled?: boolean;
  weeklyReviewLimit?: number;
  weeklyReviewWatchedCount?: number;
};

type WeeklyReviewMeta = {
  limit: number;
  watchedCount: number;
};

function WeeklyReviewInfoTooltip() {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          aria-label="What weekly reviews do"
          className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <HelpCircle className="h-3.5 w-3.5" />
        </button>
      </TooltipTrigger>
      <TooltipContent sideOffset={8} className="max-w-xs">
        Weekly reviews create an automatic report every Sunday for the latest complete Mon-Sun Search Console week. They count against your monthly report limit.
      </TooltipContent>
    </Tooltip>
  );
}

function WeeklyReviewToggle({
  property,
  weeklyReview,
  updatingWeeklyReviewId,
  onToggle,
}: {
  property: Property;
  weeklyReview: WeeklyReviewMeta;
  updatingWeeklyReviewId: string | null;
  onToggle: (property: Property) => void;
}) {
  const atLimit = !property.weeklyReviewEnabled && weeklyReview.watchedCount >= weeklyReview.limit;
  const isUpdating = updatingWeeklyReviewId === property.id;
  const disabled = isUpdating || atLimit;
  const button = (
    <Button
      variant={property.weeklyReviewEnabled ? "default" : "outline"}
      size="sm"
      className="h-7 text-xs"
      onClick={() => onToggle(property)}
      disabled={disabled}
    >
      {property.weeklyReviewEnabled ? "Watching" : "Watch"}
    </Button>
  );

  if (!atLimit) return button;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="inline-flex cursor-not-allowed">{button}</span>
      </TooltipTrigger>
      <TooltipContent sideOffset={8} className="max-w-xs">
        Weekly review limit reached ({weeklyReview.watchedCount}/{weeklyReview.limit}). Disable another watched property or upgrade for more weekly auto reports.
      </TooltipContent>
    </Tooltip>
  );
}


function LinkGa4Dialog({
  gscProperty,
  ga4Properties,
  onLinked,
}: {
  gscProperty: Property;
  ga4Properties: Property[];
  onLinked: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [selectedGa4Id, setSelectedGa4Id] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { hasBlockingIssue } = useGoogleAccessRecovery();

  const unlinkedGa4 = ga4Properties;

  const handleLink = async () => {
    if (!selectedGa4Id) return;
    setIsSubmitting(true);
    try {
      const data = await requestJson<{ scheduledReportsStarted?: number }>(
        `/api/properties/${encodeURIComponent(gscProperty.id)}/link-ga4`,
        {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ga4PropertyId: selectedGa4Id }),
        }
      );

      const msg =
        (data?.scheduledReportsStarted ?? 0) > 0
          ? `GA4 linked! ${data?.scheduledReportsStarted} scheduled report${(data?.scheduledReportsStarted ?? 0) > 1 ? "s have" : " has"} started.`
          : "GA4 linked!";
      toast.success(msg);
      setOpen(false);
      onLinked();
    } catch (err) {
      toast.error(getAppErrorMessage(err, "An error occurred"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="h-7 text-xs gap-1"
        onClick={() => setOpen(true)}
        disabled={unlinkedGa4.length === 0 || hasBlockingIssue}
      >
        <Link2 className="h-3 w-3" />
        Link GA4
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="font-display">Link GA4 Property</DialogTitle>
            <DialogDescription>
              Select a GA4 property to link with <strong>{gscProperty.name}</strong>.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Select value={selectedGa4Id} onValueChange={setSelectedGa4Id}>
              <SelectTrigger>
                <SelectValue placeholder="Select a GA4 property…" />
              </SelectTrigger>
              <SelectContent>
                {unlinkedGa4.map((p) => (
                  <SelectItem key={p.id} value={p.id.replace("ga4_", "")}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleLink} disabled={!selectedGa4Id || isSubmitting} className="rounded-full">
              {isSubmitting ? "Linking…" : "Link"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default function PropertiesPage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAutoSyncing, setIsAutoSyncing] = useState(false);
  const [weeklyReview, setWeeklyReview] = useState<WeeklyReviewMeta>({ limit: 1, watchedCount: 0 });
  const [updatingWeeklyReviewId, setUpdatingWeeklyReviewId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const hasAttemptedAutoSync = useRef(false);
  const { issue, hasBlockingIssue, openDialog, refreshHealth } = useGoogleAccessRecovery();

  const loadProperties = useCallback(async () => {
    try {
      const data = await requestJson<{ properties?: Property[]; weeklyReview?: WeeklyReviewMeta }>("/api/properties");
      setProperties(data?.properties ?? []);
      setWeeklyReview(data?.weeklyReview ?? { limit: 1, watchedCount: 0 });
    } catch {
      setProperties([]);
      setWeeklyReview({ limit: 1, watchedCount: 0 });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadProperties();
  }, [loadProperties]);

  useEffect(() => {
    if (
      loading ||
      properties.length > 0 ||
      isAutoSyncing ||
      hasAttemptedAutoSync.current ||
      hasBlockingIssue
    ) {
      return;
    }

    hasAttemptedAutoSync.current = true;
    setIsAutoSyncing(true);

    const syncPromise = (async () => {
      const data = await runPropertiesSync();
      await loadProperties();
      return data;
    })();

    void toast.promise(syncPromise, {
      loading: "Properties are syncing. Please wait a few seconds…",
      success: (data) => formatPropertiesSyncSuccess(data),
      error: (err) => {
        const code = err instanceof Error && "code" in err ? (err as { code?: string | null }).code : null;
        if (getGoogleAccessIssueFromCode(code)) {
          void refreshHealth();
          return "Google access needs attention before properties can sync.";
        }
        return `Auto-sync failed: ${err instanceof Error ? err.message : "Unknown error"}`;
      },
    });

    void syncPromise.finally(() => {
      setIsAutoSyncing(false);
    });
  }, [hasBlockingIssue, isAutoSyncing, loading, loadProperties, properties.length, refreshHealth]);

  const ga4Properties = properties.filter((p) => p.type === "ga4");
  const filteredProperties = searchQuery.trim()
    ? properties.filter((p) => {
        const q = searchQuery.trim().toLowerCase();
        return p.name.toLowerCase().includes(q) || p.url.toLowerCase().includes(q);
      })
    : properties;

  // Build a lookup: numeric GA4 ID → display name
  const ga4ById = Object.fromEntries(
    ga4Properties.map((p) => [p.id.replace("ga4_", ""), p.name])
  );
  const recoveryModel = issue ? getGoogleAccessDialogModel(issue) : null;

  const toggleWeeklyReview = async (property: Property) => {
    const enabled = !property.weeklyReviewEnabled;
    setUpdatingWeeklyReviewId(property.id);
    try {
      const result = await requestJson<{
        weeklyReviewEnabled: boolean;
        weeklyReviewLimit: number;
        weeklyReviewWatchedCount: number;
      }>(`/api/properties/${encodeURIComponent(property.id)}/weekly-review`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled }),
      });
      if (!result) throw new Error("No response from weekly review update");

      setProperties((current) =>
        current.map((item) => ({
          ...item,
          weeklyReviewEnabled:
            item.id === property.id ? result.weeklyReviewEnabled : item.weeklyReviewEnabled,
          weeklyReviewLimit: result.weeklyReviewLimit,
          weeklyReviewWatchedCount: result.weeklyReviewWatchedCount,
        })),
      );
      setWeeklyReview({
        limit: result.weeklyReviewLimit,
        watchedCount: result.weeklyReviewWatchedCount,
      });
      toast.success(enabled ? "Weekly review enabled" : "Weekly review disabled");
    } catch (err) {
      toast.error(getAppErrorMessage(err, "Could not update weekly review"));
    } finally {
      setUpdatingWeeklyReviewId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight font-display" style={{ textWrap: "balance" }}>
            Properties
          </h1>
          <p className="text-muted-foreground mt-1">Google Search Console and Analytics properties synced to your account.</p>
        </div>
        <SyncButton
          onSynced={loadProperties}
          externalIsSyncing={isAutoSyncing}
          refreshStrategy="callback"
        />
      </div>

      {issue ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50/70 p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-2">
              <h2 className="font-display text-lg font-semibold text-amber-950">
                {recoveryModel?.title ?? "Google access needs attention"}
              </h2>
              <p className="text-sm text-amber-950/85">
                {recoveryModel?.description}
              </p>
              <p className="text-sm text-amber-900/80">
                Your existing properties stay visible, but sync and linking are paused until Google access is restored.
              </p>
            </div>
            <Button onClick={openDialog} className="rounded-full">
              Reconnect Google
            </Button>
          </div>
        </div>
      ) : null}

      {loading ? (
        <div className="border border-border/50 rounded-lg p-8 bg-card">
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 rounded-lg bg-muted/40 animate-pulse" />
            ))}
          </div>
        </div>
      ) : properties.length === 0 ? (
        <div className="border border-border/50 rounded-lg p-12 text-center flex flex-col items-center justify-center bg-card shadow-sm">
          <div className="h-16 w-16 bg-muted/50 rounded-lg flex items-center justify-center mb-6">
            <Globe aria-hidden="true" className="h-8 w-8 text-muted-foreground/50" />
          </div>
          <h3 className="text-xl font-medium text-foreground font-display">No properties synced</h3>
          <p className="max-w-sm mt-3 text-muted-foreground leading-relaxed">
            No Google Search Console or Analytics properties are associated with this connected Google account yet.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex flex-col gap-1 rounded-lg border border-border/50 bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-medium">Weekly reviews</p>
              <p className="text-sm text-muted-foreground">
                Watch GSC properties for automatic Mon-Sun reviews every Sunday.
              </p>
            </div>
            <Badge variant="outline" className="w-fit">
              {weeklyReview.watchedCount}/{weeklyReview.limit} watched
            </Badge>
          </div>
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="Search properties…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        <div className="border border-border/50 rounded-lg overflow-hidden bg-card shadow-sm">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow className="hover:bg-transparent border-border/50">
                <TableHead className="py-4 font-medium">Name</TableHead>
                <TableHead className="py-4 font-medium">URL</TableHead>
                <TableHead className="py-4 font-medium">Type</TableHead>
                <TableHead className="py-4 font-medium">GA4</TableHead>
                <TableHead className="py-4 font-medium">Weekly Review</TableHead>
                <TableHead className="py-4 font-medium">Sync Status</TableHead>
                <TableHead className="py-4 font-medium text-right">Last Synced</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProperties.map((property) => (
                <TableRow key={property.id} className="border-border/50 hover:bg-muted/20 transition-colors">
                  <TableCell className="py-4">
                    <div className="space-y-1">
                      <div className="font-medium">{property.name}</div>
                      {property.type === "gsc" ? (
                        <Link
                          href={`/properties/${encodeURIComponent(property.id)}`}
                          className="inline-flex items-center text-xs font-medium text-primary hover:text-primary/80"
                        >
                          Open live dashboard
                        </Link>
                      ) : (
                        <span className="text-xs text-muted-foreground">GA4 rows stay secondary to the website dashboard</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="py-4 text-muted-foreground text-sm truncate max-w-[200px]">
                    {property.url}
                  </TableCell>
                  <TableCell className="py-4">
                    <Badge variant="outline" className="uppercase text-xs font-mono">
                      {property.type}
                    </Badge>
                  </TableCell>
                  <TableCell className="py-4">
                    {property.type === "gsc" ? (
                      property.ga4PropertyId ? (
                        <span className="text-sm text-muted-foreground">
                          {ga4ById[property.ga4PropertyId] ?? property.ga4PropertyId}
                        </span>
                      ) : (
                        <LinkGa4Dialog
                          gscProperty={property}
                          ga4Properties={ga4Properties}
                          onLinked={loadProperties}
                        />
                      )
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="py-4">
                    {property.type === "gsc" ? (
                      <div className="flex items-center gap-1.5">
                        <WeeklyReviewToggle
                          property={property}
                          weeklyReview={weeklyReview}
                          updatingWeeklyReviewId={updatingWeeklyReviewId}
                          onToggle={toggleWeeklyReview}
                        />
                        <WeeklyReviewInfoTooltip />
                      </div>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="py-4">{getSyncStatusBadge(property.syncStatus)}</TableCell>
                  <TableCell className="text-right text-muted-foreground text-sm py-4">
                    {property.lastSyncedAt
                      ? new Date(property.lastSyncedAt).toLocaleDateString()
                      : "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        </div>
      )}
    </div>
  );
}
