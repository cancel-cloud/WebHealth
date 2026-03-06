"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus } from "lucide-react";
import { cn } from "@webhealth/shared/lib/utils";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

const TOAST_ID = "report-create";
const PROPERTY_LIST_VISIBLE_ITEMS = 5;
const PROPERTY_ITEM_HEIGHT_REM = 2.5;

type Property = {
  id: string;
  name: string;
  type: string;
  url?: string | null;
  ga4PropertyId: string | null;
};

type ReportableProperty = {
  id: string;
  teamId: string;
  label: string;
  gscPropertyId: string;
  gscName: string;
  gscUrl: string;
  ga4PropertyId: string | null;
  ga4DbId: string | null;
  ga4Name: string | null;
  isLinked: boolean;
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

type PresetKey = "week" | "month" | "quarter" | "year";

interface PresetDates {
  dateRangeStart: string;
  dateRangeEnd: string;
  compareRangeStart: string;
  compareRangeEnd: string;
}

const PRESETS: { value: PresetKey; label: string }[] = [
  { value: "week", label: "Last Week" },
  { value: "month", label: "Last Month" },
  { value: "quarter", label: "Last Quarter" },
  { value: "year", label: "Last Year" },
];

function toDateStr(d: Date): string {
  const y = d.getFullYear();
  const mo = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${mo}-${day}`;
}

function computePresetDates(preset: PresetKey, opts?: { weekStartYesterday?: boolean }): PresetDates {
  const today = new Date();
  const y = today.getFullYear();
  const m = today.getMonth(); // 0-based

  if (preset === "week") {
    if (opts?.weekStartYesterday) {
      // Rolling 7-day window ending yesterday vs the 7 days before that
      const curEnd = new Date(y, m, today.getDate() - 1);
      const curStart = new Date(y, m, today.getDate() - 7);
      const cmpEnd = new Date(y, m, today.getDate() - 8);
      const cmpStart = new Date(y, m, today.getDate() - 14);
      return {
        dateRangeStart: toDateStr(curStart),
        dateRangeEnd: toDateStr(curEnd),
        compareRangeStart: toDateStr(cmpStart),
        compareRangeEnd: toDateStr(cmpEnd),
      };
    } else {
      // Last complete Mon–Sun week vs the Mon–Sun week before it
      const daysToLastSunday = today.getDay() === 0 ? 7 : today.getDay();
      const curEnd = new Date(y, m, today.getDate() - daysToLastSunday);
      const curStart = new Date(curEnd.getFullYear(), curEnd.getMonth(), curEnd.getDate() - 6);
      const cmpEnd = new Date(curStart.getFullYear(), curStart.getMonth(), curStart.getDate() - 1);
      const cmpStart = new Date(cmpEnd.getFullYear(), cmpEnd.getMonth(), cmpEnd.getDate() - 6);
      return {
        dateRangeStart: toDateStr(curStart),
        dateRangeEnd: toDateStr(curEnd),
        compareRangeStart: toDateStr(cmpStart),
        compareRangeEnd: toDateStr(cmpEnd),
      };
    }
  }

  if (preset === "month") {
    // Last complete calendar month
    const curEnd = new Date(y, m, 0); // last day of previous month
    const curStart = new Date(curEnd.getFullYear(), curEnd.getMonth(), 1);
    const cmpEnd = new Date(curStart.getFullYear(), curStart.getMonth(), 0);
    const cmpStart = new Date(cmpEnd.getFullYear(), cmpEnd.getMonth(), 1);
    return {
      dateRangeStart: toDateStr(curStart),
      dateRangeEnd: toDateStr(curEnd),
      compareRangeStart: toDateStr(cmpStart),
      compareRangeEnd: toDateStr(cmpEnd),
    };
  }

  if (preset === "quarter") {
    // Last complete calendar quarter
    const currentQ = Math.floor(m / 3); // 0-based quarter index for current quarter
    const lastQ = currentQ === 0 ? 3 : currentQ - 1;
    const lastQYear = currentQ === 0 ? y - 1 : y;
    const curStart = new Date(lastQYear, lastQ * 3, 1);
    const curEnd = new Date(lastQYear, lastQ * 3 + 3, 0);
    const prevQ = lastQ === 0 ? 3 : lastQ - 1;
    const prevQYear = lastQ === 0 ? lastQYear - 1 : lastQYear;
    const cmpStart = new Date(prevQYear, prevQ * 3, 1);
    const cmpEnd = new Date(prevQYear, prevQ * 3 + 3, 0);
    return {
      dateRangeStart: toDateStr(curStart),
      dateRangeEnd: toDateStr(curEnd),
      compareRangeStart: toDateStr(cmpStart),
      compareRangeEnd: toDateStr(cmpEnd),
    };
  }

  // year
  const curYear = y - 1;
  return {
    dateRangeStart: `${curYear}-01-01`,
    dateRangeEnd: `${curYear}-12-31`,
    compareRangeStart: `${curYear - 1}-01-01`,
    compareRangeEnd: `${curYear - 1}-12-31`,
  };
}

function isPresetAvailable(preset: PresetKey, dataRange: { earliest: string | null; latest: string | null } | null): boolean {
  if (!dataRange?.earliest) return false;
  if (preset === "week") return true; // ~2 weeks of data is always available
  const { compareRangeStart } = computePresetDates(preset);
  return dataRange.earliest <= compareRangeStart;
}

function formatDisplayDate(dateStr: string): string {
  const [y, mo, d] = dateStr.split("-").map(Number);
  return new Date(y, mo - 1, d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
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
  const [reportableProperties, setReportableProperties] = useState<ReportableProperty[]>([]);

  const [propertyId, setPropertyId] = useState("");
  const [propertyQuery, setPropertyQuery] = useState("");
  const [isPropertyListOpen, setIsPropertyListOpen] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<PresetKey | null>(null);
  const [weekStartYesterday, setWeekStartYesterday] = useState(false);
  const [dataRange, setDataRange] = useState<{ earliest: string | null; latest: string | null } | null>(null);
  const [dataRangeLoading, setDataRangeLoading] = useState(false);
  const propertyPickerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (open) {
      fetch("/api/properties")
        .then((r) => r.json())
        .then((data) => {
          setAllProperties(data.properties ?? []);
          setReportableProperties(data.reportableProperties ?? []);
        })
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
  const propertyOptions = reportableProperties.length
    ? reportableProperties.map((p) => ({
        id: p.id,
        label: p.label,
      }))
    : gscProperties.map((p) => ({
        id: p.id,
        label: propertyLabel(p),
      }));
  const selectedProperty = propertyOptions.find((p) => p.id === propertyId) ?? null;
  const filteredPropertyOptions = useMemo(() => {
    const query = propertyQuery.trim().toLowerCase();
    if (!query) return propertyOptions;
    return propertyOptions.filter((p) => p.label.toLowerCase().includes(query));
  }, [propertyOptions, propertyQuery]);
  const propertyInputValue = isPropertyListOpen ? propertyQuery : (selectedProperty?.label ?? "");

  useEffect(() => {
    if (!open) {
      setIsPropertyListOpen(false);
      setPropertyQuery("");
    }
  }, [open]);

  useEffect(() => {
    if (!isPropertyListOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (!propertyPickerRef.current?.contains(event.target as Node)) {
        setIsPropertyListOpen(false);
        setPropertyQuery("");
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isPropertyListOpen]);

  useEffect(() => {
    if (!propertyId) { setDataRange(null); return; }
    setDataRangeLoading(true);
    fetch(`/api/properties/${propertyId}/data-range`)
      .then((r) => r.json())
      .then((data) => setDataRange(data))
      .catch(() => setDataRange(null))
      .finally(() => setDataRangeLoading(false));
  }, [propertyId]);

  const handlePropertySelect = (selectedId: string) => {
    setPropertyId(selectedId);
    setIsPropertyListOpen(false);
    setPropertyQuery("");
    setSelectedPreset(null);
    setDataRange(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!propertyId) {
      toast.error("Please select a property.");
      return;
    }
    if (!selectedPreset) {
      toast.error("Please select a report period.");
      return;
    }
    const { dateRangeStart, dateRangeEnd, compareRangeStart, compareRangeEnd } = computePresetDates(
      selectedPreset,
      { weekStartYesterday }
    );
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
        toast.info("Report created. You can link GA4 in Properties or continue with GSC-only data from the report page.", {
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
              {propertyOptions.length === 0 ? (
                <p className="text-sm text-muted-foreground py-2">
                  No GSC properties synced yet. Click <strong>Sync Properties</strong> first.
                </p>
              ) : (
                <div ref={propertyPickerRef} className="relative">
                  <Input
                    id="property"
                    autoComplete="off"
                    placeholder="Search properties..."
                    value={propertyInputValue}
                    onClick={() => {
                      setIsPropertyListOpen(true);
                    }}
                    onFocus={() => {
                      setIsPropertyListOpen(true);
                      setPropertyQuery("");
                    }}
                    onChange={(event) => {
                      setPropertyQuery(event.target.value);
                      setPropertyId("");
                      setIsPropertyListOpen(true);
                    }}
                    onKeyDown={(event) => {
                      if (event.key === "Escape") {
                        setIsPropertyListOpen(false);
                        setPropertyQuery("");
                      }
                    }}
                    aria-expanded={isPropertyListOpen}
                    aria-autocomplete="list"
                    role="combobox"
                  />
                  {isPropertyListOpen && (
                    <div className="absolute z-50 mt-1 w-full rounded-md border border-border bg-popover text-popover-foreground shadow-md">
                      {filteredPropertyOptions.length === 0 ? (
                        <p className="px-3 py-2 text-sm text-muted-foreground">No properties found.</p>
                      ) : (
                        <ul
                          className="overflow-y-auto py-1"
                          style={{ maxHeight: `${PROPERTY_LIST_VISIBLE_ITEMS * PROPERTY_ITEM_HEIGHT_REM}rem` }}
                          role="listbox"
                          aria-label="Property options"
                        >
                          {filteredPropertyOptions.map((p) => (
                            <li key={p.id}>
                              <button
                                type="button"
                                className="flex h-10 w-full items-center px-3 text-left text-sm hover:bg-accent hover:text-accent-foreground"
                                onMouseDown={(event) => {
                                  event.preventDefault();
                                }}
                                onClick={() => handlePropertySelect(p.id)}
                              >
                                <span className="truncate">{p.label}</span>
                              </button>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label>Report Period</Label>
              <div className="grid grid-cols-2 gap-2">
                {PRESETS.map((preset) => {
                  const available = isPresetAvailable(preset.value, dataRange);
                  const isSelected = selectedPreset === preset.value;
                  return (
                    <button
                      key={preset.value}
                      type="button"
                      disabled={!propertyId || dataRangeLoading || !available}
                      onClick={() => setSelectedPreset(preset.value)}
                      className={cn(
                        "rounded-md border px-3 py-2 text-sm font-medium transition-colors",
                        "disabled:cursor-not-allowed disabled:opacity-40",
                        isSelected
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border bg-background hover:bg-accent hover:text-accent-foreground"
                      )}
                    >
                      {preset.label}
                    </button>
                  );
                })}
              </div>
              {selectedPreset === "week" && (
                <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={weekStartYesterday}
                    onChange={(e) => setWeekStartYesterday(e.target.checked)}
                    className="h-4 w-4 rounded border-border accent-primary"
                  />
                  Start yesterday
                </label>
              )}
              {selectedPreset && (() => {
                const d = computePresetDates(selectedPreset, { weekStartYesterday });
                return (
                  <p className="text-xs text-muted-foreground">
                    {formatDisplayDate(d.dateRangeStart)}–{formatDisplayDate(d.dateRangeEnd)}{" "}
                    vs {formatDisplayDate(d.compareRangeStart)}–{formatDisplayDate(d.compareRangeEnd)}
                  </p>
                );
              })()}
              {dataRange?.earliest && (
                <p className="text-xs text-muted-foreground">
                  Data available from {formatDisplayDate(dataRange.earliest)}
                </p>
              )}
              {propertyId && !dataRangeLoading && dataRange && !dataRange.earliest && (
                <p className="text-xs text-muted-foreground">
                  No data synced yet for this property.
                </p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting || propertyOptions.length === 0 || !selectedPreset} className="rounded-full">
              {isSubmitting ? "Queueing…" : "Generate Report"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
