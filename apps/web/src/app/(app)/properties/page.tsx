"use client";

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
import { Button } from "@/components/ui/button";
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
import { Globe, Link2 } from "lucide-react";
import {
  SyncButton,
  formatPropertiesSyncSuccess,
  runPropertiesSync,
} from "../dashboard/sync-button";
import { toast } from "sonner";

type Property = {
  id: string;
  name: string;
  url: string;
  type: string;
  syncStatus: string;
  lastSyncedAt: string | null;
  ga4PropertyId: string | null;
};

function getSyncStatusBadge(status: string) {
  switch (status) {
    case "complete":
      return <Badge className="bg-green-500/10 text-green-600 border border-green-200 hover:bg-green-500/20">Complete</Badge>;
    case "syncing":
      return <Badge className="bg-blue-500/10 text-blue-600 border border-blue-200 animate-pulse">Syncing</Badge>;
    case "pending":
      return <Badge variant="outline" className="text-zinc-500">Pending</Badge>;
    case "failed":
      return <Badge variant="destructive">Failed</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
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

  const unlinkedGa4 = ga4Properties;

  const handleLink = async () => {
    if (!selectedGa4Id) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/properties/${gscProperty.id}/link-ga4`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ga4PropertyId: selectedGa4Id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to link GA4");

      const msg =
        data.scheduledReportsStarted > 0
          ? `GA4 linked! ${data.scheduledReportsStarted} scheduled report${data.scheduledReportsStarted > 1 ? "s have" : " has"} started.`
          : "GA4 linked!";
      toast.success(msg);
      setOpen(false);
      onLinked();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "An error occurred");
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
        disabled={unlinkedGa4.length === 0}
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
  const hasAttemptedAutoSync = useRef(false);

  const loadProperties = useCallback(async () => {
    try {
      const res = await fetch("/api/properties");
      const data = await res.json();
      setProperties(data.properties ?? []);
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
    if (loading || properties.length > 0 || isAutoSyncing || hasAttemptedAutoSync.current) {
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
      error: (err) =>
        `Auto-sync failed: ${err instanceof Error ? err.message : "Unknown error"}`,
    });

    void syncPromise.finally(() => {
      setIsAutoSyncing(false);
    });
  }, [isAutoSyncing, loading, loadProperties, properties.length]);

  const ga4Properties = properties.filter((p) => p.type === "ga4");

  // Build a lookup: numeric GA4 ID → display name
  const ga4ById = Object.fromEntries(
    ga4Properties.map((p) => [p.id.replace("ga4_", ""), p.name])
  );

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

      {loading ? (
        <div className="border border-border/50 rounded-3xl p-8 bg-card">
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 rounded-xl bg-muted/40 animate-pulse" />
            ))}
          </div>
        </div>
      ) : properties.length === 0 ? (
        <div className="border border-border/50 rounded-3xl p-12 text-center flex flex-col items-center justify-center bg-card shadow-sm">
          <div className="h-16 w-16 bg-muted/50 rounded-2xl flex items-center justify-center mb-6">
            <Globe aria-hidden="true" className="h-8 w-8 text-muted-foreground/50" />
          </div>
          <h3 className="text-xl font-medium text-foreground font-display">No properties synced</h3>
          <p className="max-w-sm mt-3 text-muted-foreground leading-relaxed">
            Click <strong>Sync Properties</strong> to fetch your Google Search Console and Analytics properties.
          </p>
        </div>
      ) : (
        <div className="border border-border/50 rounded-3xl overflow-hidden bg-card shadow-sm">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow className="hover:bg-transparent border-border/50">
                <TableHead className="py-4 font-medium">Name</TableHead>
                <TableHead className="py-4 font-medium">URL</TableHead>
                <TableHead className="py-4 font-medium">Type</TableHead>
                <TableHead className="py-4 font-medium">GA4</TableHead>
                <TableHead className="py-4 font-medium">Sync Status</TableHead>
                <TableHead className="py-4 font-medium text-right">Last Synced</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {properties.map((property) => (
                <TableRow key={property.id} className="border-border/50 hover:bg-muted/20 transition-colors">
                  <TableCell className="font-medium py-4">{property.name}</TableCell>
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
      )}
    </div>
  );
}
