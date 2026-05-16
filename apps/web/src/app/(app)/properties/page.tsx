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
import { Switch } from "@/components/ui/switch";
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
import { Globe, Link2, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  SyncButton,
  formatPropertiesSyncSuccess,
  runPropertiesSync,
} from "../dashboard/sync-button";
import { toast } from "sonner";
import { getAppErrorMessage } from "@/lib/client/app-error";
import { requestJson } from "@/lib/client/api";
import { dispatchAppSidebarPropertiesRefresh } from "@/components/app-shell.logic";
import { useGoogleAccessRecovery } from "@/components/google-access-recovery";
import {
  getGoogleAccessDialogModel,
  getGoogleAccessIssueFromCode,
} from "@/components/google-access-recovery.logic";
import {
  buildManagedPropertyRows,
  getManagedPropertyToggleTargets,
  type ManagedPropertyRow,
} from "../dashboard/manage-properties-dialog.logic";
import { getGa4PropertyOptions } from "../dashboard/property-linking.logic";
import { useAppLanguage } from "@/lib/app-language";

const PROPERTIES_COPY = {
  en: {
    activated: "Property activated",
    deactivated: "Property deactivated",
    updateFailed: "Could not update property activation",
    setup: "Setup",
    linkToActivate: "Link GSC + GA4 to activate.",
    included: "Included",
    managedByCanonical: "Managed by the canonical dashboard.",
    activeDashboard: "Active dashboard",
    inactive: "Inactive",
    title: "Properties",
    subtitle: "Google Search Console and Analytics properties synced to your account.",
    paused: "Your existing properties stay visible, but sync and linking are paused until Google access is restored.",
    reconnect: "Reconnect Google",
    explainer: "Activate only complete GSC + GA4 website dashboards. Paid plans can refresh the default 28-day Google data in the background and send relevant source evidence to OpenAI for AI insights. Solo users stay manual: open the property and press Re-run to fetch fresh Google data and AI recommendations.",
    emptyTitle: "No properties synced",
    emptyDescription: "No Google Search Console or Analytics properties are associated with this connected Google account yet.",
    search: "Search properties...",
    name: "Name",
    url: "URL",
    type: "Type",
    active: "Active",
    status: "Status",
    synced: "Synced",
    openLiveDashboard: "Open live dashboard",
    linkGa4ThenActivate: "Link GA4, then activate.",
    secondary: "Secondary to the website dashboard.",
    ga4Linked: "GA4 linked!",
    genericError: "An error occurred",
    linkGa4: "Link GA4",
    linkGa4Title: "Link GA4 Property",
    linkGa4Description: (name: string) => <>Select a GA4 property to link with <strong>{name}</strong>.</>,
    selectGa4: "Select a GA4 property…",
    cancel: "Cancel",
    linking: "Linking…",
    link: "Link",
    autoSyncLoading: "Properties are syncing. Please wait a few seconds…",
    googleAccessNeedsAttention: "Google access needs attention before properties can sync.",
    autoSyncFailed: "Auto-sync failed",
    unknownError: "Unknown error",
  },
  de: {
    activated: "Property aktiviert",
    deactivated: "Property deaktiviert",
    updateFailed: "Property-Aktivierung konnte nicht aktualisiert werden",
    setup: "Setup",
    linkToActivate: "GSC + GA4 verknüpfen, um zu aktivieren.",
    included: "Enthalten",
    managedByCanonical: "Wird vom kanonischen Dashboard verwaltet.",
    activeDashboard: "Aktives Dashboard",
    inactive: "Inaktiv",
    title: "Properties",
    subtitle: "Mit deinem Konto synchronisierte Google Search Console- und Analytics-Properties.",
    paused: "Deine bestehenden Properties bleiben sichtbar, aber Synchronisierung und Verknüpfung pausieren bis Google-Zugriff wiederhergestellt ist.",
    reconnect: "Google erneut verbinden",
    explainer: "Aktiviere nur vollständige GSC- + GA4-Website-Dashboards. Bezahlte Pläne können die standardmäßigen 28 Tage Google-Daten im Hintergrund aktualisieren und relevante Quellenbelege an OpenAI für KI-Insights senden. Solo-Nutzer bleiben manuell: Property öffnen und Re-run drücken, um frische Google-Daten und KI-Empfehlungen zu holen.",
    emptyTitle: "Keine Properties synchronisiert",
    emptyDescription: "Für dieses verbundene Google-Konto sind noch keine Google Search Console- oder Analytics-Properties vorhanden.",
    search: "Properties suchen...",
    name: "Name",
    url: "URL",
    type: "Typ",
    active: "Aktiv",
    status: "Status",
    synced: "Synchronisiert",
    openLiveDashboard: "Live-Dashboard öffnen",
    linkGa4ThenActivate: "GA4 verknüpfen, dann aktivieren.",
    secondary: "Sekundär zum Website-Dashboard.",
    ga4Linked: "GA4 verknüpft!",
    genericError: "Ein Fehler ist aufgetreten",
    linkGa4: "GA4 verknüpfen",
    linkGa4Title: "GA4-Property verknüpfen",
    linkGa4Description: (name: string) => <><strong>{name}</strong> mit einer GA4-Property verknüpfen.</>,
    selectGa4: "GA4-Property auswählen…",
    cancel: "Abbrechen",
    linking: "Verknüpft…",
    link: "Verknüpfen",
    autoSyncLoading: "Properties werden synchronisiert. Bitte warte ein paar Sekunden…",
    googleAccessNeedsAttention: "Google-Zugriff braucht Aufmerksamkeit, bevor Properties synchronisiert werden können.",
    autoSyncFailed: "Auto-Sync fehlgeschlagen",
    unknownError: "Unbekannter Fehler",
  },
} as const;

type Property = {
  id: string;
  name: string;
  url: string;
  type: string;
  syncStatus: string;
  lastSyncedAt: string | null;
  ga4PropertyId: string | null;
  active: boolean;
};


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
  const language = useAppLanguage();
  const copy = PROPERTIES_COPY[language];

  const ga4Options = getGa4PropertyOptions(ga4Properties);

  const handleLink = async () => {
    if (!selectedGa4Id) return;
    setIsSubmitting(true);
    try {
      await requestJson(
        `/api/properties/${encodeURIComponent(gscProperty.id)}/link-ga4`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ga4PropertyId: selectedGa4Id }),
        },
      );
      toast.success(copy.ga4Linked);
      setOpen(false);
      dispatchAppSidebarPropertiesRefresh();
      onLinked();
    } catch (err) {
      toast.error(getAppErrorMessage(err, copy.genericError));
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
        disabled={ga4Options.length === 0 || hasBlockingIssue}
      >
        <Link2 className="size-3" />
        {copy.linkGa4}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="font-display">{copy.linkGa4Title}</DialogTitle>
            <DialogDescription>
              {copy.linkGa4Description(gscProperty.name)}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Select value={selectedGa4Id} onValueChange={setSelectedGa4Id}>
              <SelectTrigger>
                <SelectValue placeholder={copy.selectGa4} />
              </SelectTrigger>
              <SelectContent>
                {ga4Options.map((property) => (
                  <SelectItem key={property.id} value={property.numericId}>
                    {property.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              {copy.cancel}
            </Button>
            <Button onClick={handleLink} disabled={!selectedGa4Id || isSubmitting} className="rounded-full">
              {isSubmitting ? copy.linking : copy.link}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default function PropertiesPage() {
  const language = useAppLanguage();
  const copy = PROPERTIES_COPY[language];
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAutoSyncing, setIsAutoSyncing] = useState(false);
  const [pendingActivationId, setPendingActivationId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const hasAttemptedAutoSync = useRef(false);
  const { issue, hasBlockingIssue, openDialog, refreshHealth } = useGoogleAccessRecovery();

  const loadProperties = useCallback(async () => {
    try {
      const data = await requestJson<{ properties?: Property[] }>("/api/properties");
      setProperties(data?.properties ?? []);
    } catch {
      setProperties([]);
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
      loading: copy.autoSyncLoading,
      success: (data) => formatPropertiesSyncSuccess(data, language),
      error: (err) => {
        const code = err instanceof Error && "code" in err ? (err as { code?: string | null }).code : null;
        if (getGoogleAccessIssueFromCode(code)) {
          void refreshHealth();
          return copy.googleAccessNeedsAttention;
        }
        return `${copy.autoSyncFailed}: ${err instanceof Error ? err.message : copy.unknownError}`;
      },
    });

    void syncPromise.finally(() => {
      setIsAutoSyncing(false);
    });
  }, [copy, hasBlockingIssue, isAutoSyncing, language, loading, loadProperties, properties.length, refreshHealth]);

  const ga4Properties = properties.filter((p) => p.type === "ga4");
  const managedRows = buildManagedPropertyRows(properties);
  const activationRowBySourceId = new Map<string, ManagedPropertyRow>();
  for (const row of managedRows) {
    for (const sourceId of row.sourceIds) {
      activationRowBySourceId.set(sourceId, row);
    }
  }
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

  const updateActiveProperty = async (row: ManagedPropertyRow, active: boolean) => {
    const targetIds = getManagedPropertyToggleTargets(row);
    setPendingActivationId(row.id);
    try {
      await requestJson(`/api/properties/${encodeURIComponent(targetIds[0])}/active`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active, propertyIds: targetIds }),
      });
      toast.success(active ? copy.activated : copy.deactivated);
      await loadProperties();
      dispatchAppSidebarPropertiesRefresh();
    } catch (error) {
      toast.error(getAppErrorMessage(error, copy.updateFailed));
    } finally {
      setPendingActivationId(null);
    }
  };

  function renderActivationControl(property: Property) {
    const row = activationRowBySourceId.get(property.id);
    if (!row?.linked) {
      return (
        <div className="min-w-0 space-y-1">
          <Badge variant="outline" className="border-amber-200 text-amber-700">{copy.setup}</Badge>
          <p className="max-w-44 whitespace-normal text-xs leading-snug text-muted-foreground">
            {copy.linkToActivate}
          </p>
        </div>
      );
    }

    if (property.id !== row.sourceIds[0]) {
      return (
        <div className="min-w-0 space-y-1">
          <Badge variant="outline">{copy.included}</Badge>
          <p className="max-w-44 whitespace-normal break-words text-xs leading-snug text-muted-foreground">
            {copy.managedByCanonical}
          </p>
        </div>
      );
    }

    return (
      <div className="flex min-w-0 flex-wrap items-center gap-2">
        <Switch
          checked={row.active}
          disabled={pendingActivationId === row.id}
          onCheckedChange={(active) => void updateActiveProperty(row, active)}
          aria-label={`Toggle ${row.name}`}
        />
        <span className="whitespace-normal text-xs leading-snug text-muted-foreground">
          {row.active ? copy.activeDashboard : copy.inactive}
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex min-w-0 flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div className="min-w-0">
          <h1 className="text-3xl font-semibold tracking-tight font-display" style={{ textWrap: "balance" }}>
            {copy.title}
          </h1>
          <p className="mt-1 max-w-3xl text-muted-foreground">{copy.subtitle}</p>
        </div>
        <div className="shrink-0 self-start xl:self-auto">
          <SyncButton
            onSynced={loadProperties}
            externalIsSyncing={isAutoSyncing}
            refreshStrategy="callback"
          />
        </div>
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
                {copy.paused}
              </p>
            </div>
            <Button onClick={openDialog} className="rounded-full">
              {copy.reconnect}
            </Button>
          </div>
        </div>
      ) : null}

      <div className="rounded-lg border border-border/70 bg-muted/25 p-4 text-sm text-muted-foreground">
        {copy.explainer}
      </div>

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
          <div className="size-16 bg-muted/50 rounded-lg flex items-center justify-center mb-6">
            <Globe aria-hidden="true" className="size-8 text-muted-foreground/50" />
          </div>
          <h3 className="text-xl font-medium text-foreground font-display">{copy.emptyTitle}</h3>
          <p className="max-w-sm mt-3 text-muted-foreground leading-relaxed">
            {copy.emptyDescription}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
            <Input
              placeholder={copy.search}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        <div className="border border-border/50 rounded-lg overflow-hidden bg-card shadow-sm">
          <Table className="table-fixed">
            <TableHeader className="bg-muted/30">
              <TableRow className="hover:bg-transparent border-border/50">
                <TableHead className="w-[30%] py-4 font-medium">{copy.name}</TableHead>
                <TableHead className="w-[18%] py-4 font-medium">{copy.url}</TableHead>
                <TableHead className="w-[5%] py-4 font-medium">{copy.type}</TableHead>
                <TableHead className="w-[12%] py-4 font-medium">GA4</TableHead>
                <TableHead className="w-[18%] py-4 font-medium">{copy.active}</TableHead>
                <TableHead className="w-[9%] py-4 font-medium">{copy.status}</TableHead>
                <TableHead className="w-[8%] py-4 text-right font-medium">{copy.synced}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProperties.map((property) => (
                <TableRow key={property.id} className="border-border/50 hover:bg-muted/20 transition-colors">
                  <TableCell className="py-4 align-top whitespace-normal">
                    <div className="min-w-0 space-y-1.5">
                      <div className="break-words font-medium leading-snug">{property.name}</div>
                      {!property.active ? (
                        <Badge variant="outline" className="border-amber-200 text-amber-700">{copy.inactive}</Badge>
                      ) : null}
                      {property.type === "gsc" && property.active ? (
                        <Link
                          href={`/properties/${encodeURIComponent(property.id)}`}
                          className="inline-flex items-center text-xs font-medium text-primary hover:text-primary/80"
                        >
                          {copy.openLiveDashboard}
                        </Link>
                      ) : property.type === "gsc" ? (
                        <span className="block text-xs leading-snug text-muted-foreground">{copy.linkGa4ThenActivate}</span>
                      ) : (
                        <span className="block text-xs leading-snug text-muted-foreground">{copy.secondary}</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="py-4 align-top whitespace-normal break-words text-sm text-muted-foreground">
                    {property.url}
                  </TableCell>
                  <TableCell className="py-4 align-top whitespace-normal">
                    <Badge variant="outline" className="uppercase text-xs font-mono">
                      {property.type}
                    </Badge>
                  </TableCell>
                  <TableCell className="py-4 align-top whitespace-normal">
                    {property.type === "gsc" ? (
                      property.ga4PropertyId ? (
                        <span className="block break-words text-sm leading-snug text-muted-foreground">
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
                  <TableCell className="py-4 align-top whitespace-normal">
                    {renderActivationControl(property)}
                  </TableCell>
                  <TableCell className="py-4 align-top whitespace-normal">{getSyncStatusBadge(property.syncStatus)}</TableCell>
                  <TableCell className="py-4 text-right align-top text-sm whitespace-normal text-muted-foreground">
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
