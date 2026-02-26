"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

const TOAST_ID = "report-create";

type Property = {
  id: string;
  name: string;
  type: string;
  url?: string | null;
  ga4PropertyId: string | null;
};

function normalizeGscSiteKey(property: Property): string {
  const raw = (property.url || property.id.replace(/^gsc_/, "") || property.name || "").trim();
  if (!raw) return property.id;

  if (raw.startsWith("sc-domain:")) {
    return `site:${raw.slice("sc-domain:".length).toLowerCase().replace(/^www\./, "")}`;
  }

  try {
    const parsed = new URL(raw);
    const host = parsed.hostname.toLowerCase().replace(/^www\./, "");
    const path = parsed.pathname.replace(/\/+$/, "") || "/";
    // Treat root URL-prefix properties as the same site as a matching sc-domain property.
    if (path === "/") return `site:${host}`;
    return `site-path:${host}${path}`;
  } catch {
    return raw.toLowerCase();
  }
}

function propertyLabel(property: Property): string {
  const raw = (property.url || property.name || "").trim();
  if (!raw) return property.id;

  if (raw.startsWith("sc-domain:")) {
    return raw.slice("sc-domain:".length);
  }

  try {
    const parsed = new URL(raw);
    const host = parsed.hostname.toLowerCase();
    const path = parsed.pathname.replace(/\/+$/, "") || "/";
    return path === "/" ? host : `${host}${path}`;
  } catch {
    return raw;
  }
}

async function pollUntilComplete(reportId: string): Promise<void> {
  const MAX_POLLS = 60; // 5 minutes max
  for (let i = 0; i < MAX_POLLS; i++) {
    await new Promise((r) => setTimeout(r, 5000));
    const res = await fetch(`/api/reports/${reportId}`);
    if (!res.ok) throw new Error("Failed to check report status");
    const data = await res.json();
    const status = data.report?.status;
    if (status === "complete") return;
    if (status === "failed") throw new Error("Report processing failed");
  }
  throw new Error("Report timed out");
}

export function NewReportDialog({ onCreated }: { onCreated?: () => void }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [allProperties, setAllProperties] = useState<Property[]>([]);

  const [propertyId, setPropertyId] = useState("");
  const [dateRangeStart, setDateRangeStart] = useState("");
  const [dateRangeEnd, setDateRangeEnd] = useState("");
  const [compareRangeStart, setCompareRangeStart] = useState("");
  const [compareRangeEnd, setCompareRangeEnd] = useState("");

  useEffect(() => {
    if (open) {
      fetch("/api/properties")
        .then((r) => r.json())
        .then((data) => setAllProperties(data.properties ?? []))
        .catch(() => {});
    }
  }, [open]);

  // Reports are created from GSC properties only.
  // Deduplicate by canonical GSC site URL/domain so GA entries and duplicate site variants
  // do not appear multiple times in the picker.
  const gscProperties = Array.from(
    allProperties
      .filter((p) => p.id.startsWith("gsc_") || p.type === "gsc")
      .reduce((map, p) => {
        const key = normalizeGscSiteKey(p);
        const existing = map.get(key);
        // Prefer the entry that already has a linked GA4 property, otherwise keep the first.
        if (!existing || (!existing.ga4PropertyId && p.ga4PropertyId)) {
          map.set(key, p);
        }
        return map;
      }, new Map<string, Property>())
      .values(),
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!propertyId) {
      toast.error("Please select a property.");
      return;
    }
    setIsSubmitting(true);
    setOpen(false);
    onCreated?.();

    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ propertyId, dateRangeStart, dateRangeEnd, compareRangeStart, compareRangeEnd }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to create report");

      const reportId = data.report.id;

      if (!data.ga4Missing) {
        // Happy path — GA4 is linked, report is queued
        router.push(`/reports/${reportId}`);
        toast.promise(pollUntilComplete(reportId), {
          loading: "Processing report…",
          success: "Report ready!",
          error: (err) => err.message,
        });
      } else {
        // GA4 missing — attempt auto-link via sync
        toast.loading("Syncing GA4 data…", { id: TOAST_ID, duration: Infinity });

        const syncRes = await fetch("/api/properties/sync", { method: "POST" });
        const syncData = await syncRes.json();

        if (syncRes.ok && syncData.autoLinked > 0) {
          // Re-check: did this property get linked?
          const propsRes = await fetch("/api/properties");
          const propsData = await propsRes.json();
          const updatedProp = (propsData.properties ?? []).find(
            (p: Property) => p.id === propertyId
          );

          if (updatedProp?.ga4PropertyId) {
            // Auto-link succeeded — start the scheduled report
            toast.success("GA4 data synced!", { id: TOAST_ID });
            router.push(`/reports/${reportId}`);
            await fetch(`/api/reports/${reportId}/start`, { method: "POST" });
            toast.promise(pollUntilComplete(reportId), {
              loading: "Processing report…",
              success: "Report ready!",
              error: (err) => err.message,
            });
            return;
          }
        }

        // Could not auto-link
        toast.warning("GA4 couldn't be auto-linked. Go to Properties to link manually.", {
          id: TOAST_ID,
          duration: 8000,
          action: {
            label: "Properties",
            onClick: () => router.push("/properties"),
          },
        });
        // Navigate to the report page so the user can see the scheduled state
        router.push(`/reports/${reportId}`);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "An error occurred", { id: TOAST_ID });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="rounded-full">
          <Plus className="mr-2 h-4 w-4" /> New Report
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[460px]">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">Create Comparison Report</DialogTitle>
          <DialogDescription>
            Select a property and two date ranges to analyze traffic changes and get AI-driven SEO Quick Wins.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-5 py-4">
            <div className="space-y-2">
              <Label htmlFor="property">Property</Label>
              {gscProperties.length === 0 ? (
                <p className="text-sm text-muted-foreground py-2">
                  No GSC properties synced yet. Click <strong>Sync Properties</strong> first.
                </p>
              ) : (
                <Select value={propertyId} onValueChange={setPropertyId} required>
                  <SelectTrigger id="property" className="w-half">
                    <SelectValue placeholder="Select a property…" />
                  </SelectTrigger>
                  <SelectContent>
                    {gscProperties.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {propertyLabel(p)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            <div className="space-y-1">
              <Label className="text-muted-foreground text-xs uppercase tracking-wide">Current Period</Label>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="dateRangeStart" className="text-xs">Start</Label>
                  <Input id="dateRangeStart" type="date" required value={dateRangeStart} onChange={(e) => setDateRangeStart(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="dateRangeEnd" className="text-xs">End</Label>
                  <Input id="dateRangeEnd" type="date" required value={dateRangeEnd} onChange={(e) => setDateRangeEnd(e.target.value)} />
                </div>
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-muted-foreground text-xs uppercase tracking-wide">Compare Period</Label>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="compareRangeStart" className="text-xs">Start</Label>
                  <Input id="compareRangeStart" type="date" required value={compareRangeStart} onChange={(e) => setCompareRangeStart(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="compareRangeEnd" className="text-xs">End</Label>
                  <Input id="compareRangeEnd" type="date" required value={compareRangeEnd} onChange={(e) => setCompareRangeEnd(e.target.value)} />
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting || gscProperties.length === 0} className="rounded-full">
              {isSubmitting ? "Queueing…" : "Generate Report"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
