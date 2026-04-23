"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatEuroDisplay } from "@/lib/pricing";
import { ReportActions } from "./report-actions";
import { ReportLiveStatus } from "./report-live-status";
import {
  getReportActionAvailability,
  getReportDetailViewKind,
  REPORT_LIVE_SNAPSHOT_EVENT,
  type ReportLiveSnapshot,
  shouldShowTopReportActions,
} from "./report-page.logic";

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; class: string }> = {
    queued: { label: "Queued", class: "text-zinc-500 bg-zinc-100 border-zinc-200 dark:text-zinc-300 dark:bg-white/5 dark:border-white/10" },
    scheduled: { label: "Waiting For Data", class: "text-amber-700 bg-amber-50 border-amber-200 dark:text-amber-100 dark:bg-amber-500/12 dark:border-amber-500/20" },
    processing: { label: "Processing", class: "text-blue-700 bg-blue-50 border-blue-200 dark:text-blue-100 dark:bg-blue-500/12 dark:border-blue-500/20" },
    complete: { label: "Complete", class: "text-green-700 bg-green-50 border-green-200 dark:text-green-100 dark:bg-green-500/12 dark:border-green-500/20" },
    failed: { label: "Failed", class: "text-red-700 bg-red-50 border-red-200 dark:text-red-100 dark:bg-red-500/12 dark:border-red-500/20" },
  };
  const cfg = map[status] ?? map.queued;
  return <Badge variant="outline" className={cfg.class}>{cfg.label}</Badge>;
}

type ReportSnapshotEventDetail = {
  reportId: string;
  snapshot: ReportLiveSnapshot;
};

export function ReportDetailClientView({
  reportId,
  propertyName,
  dateRangeLabel,
  compareRangeLabel,
  initialSnapshot,
  isAdmin,
  aiEstimatedCostUsd,
  detailsCostUsd,
  summaryChips,
  scheduledContent,
  activeContent,
  failedContent,
  completeContent,
}: {
  reportId: string;
  propertyName: string;
  dateRangeLabel: string;
  compareRangeLabel: string;
  initialSnapshot: ReportLiveSnapshot;
  isAdmin: boolean;
  aiEstimatedCostUsd: string | number | null;
  detailsCostUsd: string | number | null;
  summaryChips?: Array<{ label: string; value: string }>;
  scheduledContent: React.ReactNode;
  activeContent: React.ReactNode;
  failedContent: React.ReactNode;
  completeContent: React.ReactNode;
}) {
  const [snapshot, setSnapshot] = useState(initialSnapshot);

  useEffect(() => {
    const handleSnapshot = (event: Event) => {
      const detail = (event as CustomEvent<ReportSnapshotEventDetail>).detail;
      if (!detail || detail.reportId !== reportId) return;
      setSnapshot(detail.snapshot);
    };

    window.addEventListener(REPORT_LIVE_SNAPSHOT_EVENT, handleSnapshot);
    return () => {
      window.removeEventListener(REPORT_LIVE_SNAPSHOT_EVENT, handleSnapshot);
    };
  }, [reportId]);

  const viewKind = getReportDetailViewKind(snapshot.reportStatus);
  const actionAvailability = getReportActionAvailability({
    hasAiReportJson: snapshot.hasAiReportJson,
    reportStatus: snapshot.reportStatus,
  });
  const xlsxReady = snapshot.xlsxStatus === "ready" && snapshot.hasXlsxArtifact;

  return (
    <>
      <ReportLiveStatus
        reportId={reportId}
        initialStatus={initialSnapshot.reportStatus}
        initialXlsxStatus={initialSnapshot.xlsxStatus}
      />

      <div className="relative z-10 w-full bg-report-canvas px-1 py-4 sm:px-2 lg:py-6">
        <div className="mb-6 rounded-lg border border-report-separator bg-report-panel px-5 py-5 shadow-sm" data-report-header>
          <Link
            href="/reports"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Reports
          </Link>
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div className="space-y-3">
              <div>
                <h1 className="text-3xl font-extrabold tracking-tight font-display mb-2">
                  {propertyName}
                </h1>
                <p className="text-sm text-muted-foreground">
                  {dateRangeLabel}
                  <span className="mx-2 text-border">vs</span>
                  {compareRangeLabel}
                </p>
              </div>

              {summaryChips && summaryChips.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {summaryChips.map((chip) => (
                    <Badge
                      key={`${chip.label}:${chip.value}`}
                      variant="outline"
                      className="border-report-separator bg-report-chip text-report-chip-foreground shadow-none"
                    >
                      {chip.label}: {chip.value}
                    </Badge>
                  ))}
                </div>
              ) : null}
            </div>

            <div className="flex flex-col gap-3 xl:items-end">
              <div className="flex flex-wrap items-center gap-2 xl:justify-end">
                <StatusBadge status={snapshot.reportStatus} />
                {isAdmin && viewKind === "complete" && aiEstimatedCostUsd ? (
                  <Badge variant="outline" className="border-report-separator bg-report-chip text-report-chip-foreground shadow-none">
                    AI cost: {formatEuroDisplay(aiEstimatedCostUsd)}
                  </Badge>
                ) : null}
                {isAdmin && viewKind === "complete" && detailsCostUsd ? (
                  <Badge variant="outline" className="border-report-separator bg-report-chip text-report-chip-foreground shadow-none">
                    Detail cost: {formatEuroDisplay(detailsCostUsd)}
                  </Badge>
                ) : null}
              </div>

              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground xl:justify-end">
                <span>Report: {snapshot.reportStatus}</span>
                <span>AI: {snapshot.aiStatus ?? "n/a"}</span>
                <span>XLSX: {snapshot.xlsxStatus ?? "n/a"}</span>
              </div>

              {shouldShowTopReportActions(snapshot.reportStatus) ? (
                <div className="pt-1 xl:self-end">
                  <ReportActions
                    reportId={reportId}
                    reportStatus={snapshot.reportStatus}
                    aiStatus={snapshot.aiStatus}
                    xlsxStatus={snapshot.xlsxStatus}
                    hasAiReportJson={snapshot.hasAiReportJson}
                    hasXlsxArtifact={snapshot.hasXlsxArtifact}
                    xlsxReady={xlsxReady}
                    canRetryReport={actionAvailability.canRetryReport}
                    retryReportReason={actionAvailability.retryReportReason}
                    canRetryXlsx={actionAvailability.canRetryXlsx}
                    retryXlsxReason={actionAvailability.retryXlsxReason}
                  />
                </div>
              ) : null}
            </div>
          </div>
        </div>

        {viewKind === "scheduled" ? scheduledContent : null}
        {viewKind === "active" ? activeContent : null}
        {viewKind === "failed" ? failedContent : null}
        {viewKind === "complete" ? completeContent : null}
      </div>
    </>
  );
}
