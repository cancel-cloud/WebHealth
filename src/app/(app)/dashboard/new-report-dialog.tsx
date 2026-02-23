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

type Property = {
  id: string;
  name: string;
  type: string;
};

export function NewReportDialog({ onCreated }: { onCreated?: () => void }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [properties, setProperties] = useState<Property[]>([]);

  const [propertyId, setPropertyId] = useState("");
  const [dateRangeStart, setDateRangeStart] = useState("");
  const [dateRangeEnd, setDateRangeEnd] = useState("");
  const [compareRangeStart, setCompareRangeStart] = useState("");
  const [compareRangeEnd, setCompareRangeEnd] = useState("");

  useEffect(() => {
    if (open) {
      fetch("/api/properties")
        .then((r) => r.json())
        .then((data) => setProperties(data.properties ?? []))
        .catch(() => {});
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!propertyId) {
      toast.error("Please select a property.");
      return;
    }
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ propertyId, dateRangeStart, dateRangeEnd, compareRangeStart, compareRangeEnd }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to create report");

      toast.success("Report queued! It will be ready in 1–2 minutes.");
      setOpen(false);
      onCreated?.();
      router.push(`/reports/${data.report.id}`);
    } catch (err: any) {
      toast.error(err.message);
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
          <DialogTitle className="font-outfit text-xl">Create Comparison Report</DialogTitle>
          <DialogDescription>
            Select a property and two date ranges to analyze traffic changes and get AI-driven SEO Quick Wins.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-5 py-4">
            <div className="space-y-2">
              <Label htmlFor="property">Property</Label>
              {properties.length === 0 ? (
                <p className="text-sm text-muted-foreground py-2">
                  No properties synced yet. Click <strong>Sync Properties</strong> first.
                </p>
              ) : (
                <Select value={propertyId} onValueChange={setPropertyId} required>
                  <SelectTrigger id="property">
                    <SelectValue placeholder="Select a property…" />
                  </SelectTrigger>
                  <SelectContent>
                    {properties.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name} <span className="text-muted-foreground ml-1 uppercase text-xs">{p.type}</span>
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
            <Button type="submit" disabled={isSubmitting || properties.length === 0} className="rounded-full">
              {isSubmitting ? "Queueing…" : "Generate Report"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
