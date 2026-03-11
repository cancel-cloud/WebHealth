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
import { FileText, ArrowRight } from "lucide-react";
import { getReportStatusBadge } from "@/lib/status-badge";
import Link from "next/link";
import { propertyIdLabel } from "@/lib/property-label";
import { NewReportDialog } from "./new-report-dialog";
import { useRouter } from "next/navigation";

type ReportType = {
  id: string;
  propertyId: string;
  dateRangeStart: string;
  dateRangeEnd: string;
  status: "queued" | "scheduled" | "processing" | "complete" | "failed";
  createdAt: string;
};

export function ReportsTable({ limit, showViewAll }: { limit?: number; showViewAll?: boolean } = {}) {
  const router = useRouter();
  const [reports, setReports] = useState<ReportType[]>([]);
  const [loading, setLoading] = useState(true);
  const reportsRef = useRef<ReportType[]>([]);

  const fetchReports = useCallback(async () => {
    try {
      const res = await fetch("/api/reports");
      const data = await res.json();
      const next = data.reports ?? [];
      reportsRef.current = next;
      setReports(next);
      window.dispatchEvent(new CustomEvent("reports-updated", { detail: { reports: next } }));
    } catch {
      reportsRef.current = [];
      setReports([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReports();
    // Poll every 15 seconds if any reports are processing or queued
    const interval = setInterval(() => {
      const hasActiveReports = reportsRef.current.some(
        (r) => r.status === "queued" || r.status === "processing"
      );
      if (hasActiveReports) fetchReports();
    }, 15000);
    return () => clearInterval(interval);
  }, [fetchReports]);

  const displayedReports = limit ? reports.slice(0, limit) : reports;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-extrabold tracking-tight font-display">Recent Reports</h2>
        <div className="flex items-center gap-2">
          {showViewAll && reports.length > 0 && (
            <Link href="/reports" className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
              View all reports <ArrowRight aria-hidden="true" className="h-3 w-3" />
            </Link>
          )}
          <NewReportDialog onCreated={fetchReports} />
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
      ) : reports.length === 0 ? (
        <div className="border border-border/50 rounded-lg p-12 text-center text-muted-foreground flex flex-col items-center justify-center bg-card shadow-sm">
          <div className="h-16 w-16 bg-muted/50 rounded-lg flex items-center justify-center mb-6">
            <FileText className="h-8 w-8 text-muted-foreground/50" />
          </div>
          <h3 className="text-xl font-medium text-foreground font-display">No reports generated</h3>
          <p className="max-w-sm mt-3 text-muted-foreground leading-relaxed">
            You haven&apos;t generated any SEO reports yet. Sync your properties and click &quot;New Report&quot; to start.
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
              {displayedReports.map((report) => (
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
                      <ArrowRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
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
