"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getReportStatusBadge } from "@/lib/status-badge";
import { FileText, ArrowRight } from "lucide-react";
import { NewReportDialog } from "../dashboard/new-report-dialog";
import { propertyIdLabel } from "@/lib/property-label";

type ReportType = {
  id: string;
  propertyId: string;
  dateRangeStart: string;
  dateRangeEnd: string;
  status: "queued" | "scheduled" | "processing" | "complete" | "failed";
  createdAt: string;
};

type StatusFilter = "all" | "queued" | "scheduled" | "processing" | "complete" | "failed";

const STATUS_FILTERS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "queued", label: "Queued" },
  { value: "scheduled", label: "Waiting For Data" },
  { value: "processing", label: "Processing" },
  { value: "complete", label: "Complete" },
  { value: "failed", label: "Failed" },
];


export default function ReportsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [reports, setReports] = useState<ReportType[]>([]);
  const [loading, setLoading] = useState(true);
  const reportsRef = useRef<ReportType[]>([]);

  const searchQuery = searchParams.get("q") ?? "";
  const statusFilter = (searchParams.get("status") as StatusFilter) ?? "all";

  const setSearch = (val: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (val) params.set("q", val); else params.delete("q");
    router.replace(`/reports?${params.toString()}`);
  };

  const setStatus = (val: StatusFilter) => {
    const params = new URLSearchParams(searchParams.toString());
    if (val !== "all") params.set("status", val); else params.delete("status");
    router.replace(`/reports?${params.toString()}`);
  };

  const fetchReports = useCallback(async () => {
    try {
      const res = await fetch("/api/reports");
      const data = await res.json();
      const next = data.reports ?? [];
      reportsRef.current = next;
      setReports(next);
    } catch {
      reportsRef.current = [];
      setReports([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReports();
    const interval = setInterval(() => {
      const hasActive = reportsRef.current.some(
        (r) => r.status === "queued" || r.status === "processing"
      );
      if (hasActive) fetchReports();
    }, 15000);
    return () => clearInterval(interval);
  }, [fetchReports]);

  const filtered = reports.filter((r) => {
    const matchesSearch =
      !searchQuery ||
      r.propertyId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.dateRangeStart.includes(searchQuery) ||
      r.dateRangeEnd.includes(searchQuery);
    const matchesStatus = statusFilter === "all" || r.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight font-display" style={{ textWrap: "balance" }}>
            Reports
          </h1>
          <p className="text-muted-foreground mt-1">View and manage your SEO comparison reports.</p>
        </div>
        <NewReportDialog onCreated={fetchReports} />
      </div>

      {/* Search + status filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="search"
          aria-label="Search reports"
          autoComplete="off"
          placeholder="Search by property or date…"
          value={searchQuery}
          onChange={(e) => setSearch(e.target.value)}
          className="flex h-9 w-full sm:max-w-xs rounded-lg border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        <div className="flex gap-2 flex-wrap">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setStatus(f.value)}
              aria-pressed={statusFilter === f.value}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none border ${
                statusFilter === f.value
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background border-border text-muted-foreground hover:text-foreground hover:border-foreground/30"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="border border-border/50 rounded-lg p-8 bg-card">
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 rounded-lg bg-muted/40 animate-pulse" />
            ))}
          </div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="border border-border/50 rounded-lg p-12 text-center flex flex-col items-center justify-center bg-card shadow-sm">
          <div className="h-16 w-16 bg-muted/50 rounded-lg flex items-center justify-center mb-6">
            <FileText aria-hidden="true" className="h-8 w-8 text-muted-foreground/50" />
          </div>
          <h3 className="text-xl font-medium text-foreground font-display">
            {reports.length === 0 ? "No reports yet" : "No reports match your filters"}
          </h3>
          <p className="max-w-sm mt-3 text-muted-foreground leading-relaxed">
            {reports.length === 0
              ? "Sync your properties and click \"New Report\" to get started."
              : "Try adjusting your search or status filter."}
          </p>
        </div>
      ) : (
        <div className="border border-border/50 rounded-lg overflow-hidden bg-card shadow-sm">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow className="hover:bg-transparent border-border/50">
                <TableHead className="py-4 font-medium">Property</TableHead>
                <TableHead className="py-4 font-medium">Date Range</TableHead>
                <TableHead className="py-4 font-medium">Status</TableHead>
                <TableHead className="py-4 font-medium text-right">Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((report) => (
                <TableRow
                  key={report.id}
                  className="cursor-pointer hover:bg-muted/30 border-border/50 transition-colors group"
                  onClick={() => router.push(`/reports/${report.id}`)}
                >
                  <TableCell className="font-medium py-4">{propertyIdLabel(report.propertyId)}</TableCell>
                  <TableCell className="py-4 text-muted-foreground">
                    {new Date(report.dateRangeStart).toLocaleDateString()} –{" "}
                    {new Date(report.dateRangeEnd).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="py-4">{getReportStatusBadge(report.status)}</TableCell>
                  <TableCell className="text-right text-muted-foreground text-sm py-4">
                    <span className="flex items-center justify-end gap-2">
                      {new Date(report.createdAt).toLocaleDateString()}
                      <ArrowRight aria-hidden="true" className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </span>
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
