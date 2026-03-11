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
    scheduled: { label: "Waiting For Data", class: "text-amber-700 bg-amber-50 border-amber-200 dark:text-amber-100 dark:bg-amber-500/15 dark:border-amber-500/25" },
    processing: { label: "Processing", class: "text-blue-600 bg-blue-50 border-blue-200 animate-pulse dark:text-blue-100 dark:bg-blue-500/15 dark:border-blue-500/25" },
    complete: { label: "Complete", class: "text-green-600 bg-green-50 border-green-200 dark:text-green-100 dark:bg-green-500/15 dark:border-green-500/25" },
    failed: { label: "Failed", class: "text-red-600 bg-red-50 border-red-200 dark:text-red-100 dark:bg-red-500/15 dark:border-red-500/25" },
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

      <div className="relative z-10 w-full px-1 py-4 sm:px-2 lg:py-6">
        <div className="mb-8">
          <Link
            href="/reports"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Reports
          </Link>
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight font-display mb-2">
                {propertyName}
              </h1>
              <p className="text-muted-foreground">
                {dateRangeLabel}
                <span className="mx-2 text-border">vs</span>
                {compareRangeLabel}
              </p>
            </div>
            <div className="flex flex-col items-end gap-2">
              <StatusBadge status={snapshot.reportStatus} />
              <div className="text-xs text-muted-foreground text-right space-y-1">
                <div>AI: {snapshot.aiStatus ?? "n/a"}</div>
                <div>XLSX: {snapshot.xlsxStatus ?? "n/a"}</div>
                {isAdmin && viewKind === "complete" && aiEstimatedCostUsd ? (
                  <div>AI Cost: {formatEuroDisplay(aiEstimatedCostUsd)}</div>
                ) : null}
                {isAdmin && viewKind === "complete" && detailsCostUsd ? (
                  <div>Details cost: {formatEuroDisplay(detailsCostUsd)}</div>
                ) : null}
              </div>
            </div>
          </div>
          {shouldShowTopReportActions(snapshot.reportStatus) ? (
            <div className="mt-4">
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

        {viewKind === "scheduled" ? scheduledContent : null}
        {viewKind === "active" ? activeContent : null}
        {viewKind === "failed" ? failedContent : null}
        {viewKind === "complete" ? completeContent : null}
      </div>
    </>
  );
}
