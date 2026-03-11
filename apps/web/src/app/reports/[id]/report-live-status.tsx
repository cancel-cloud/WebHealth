"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  hasActiveReportLiveStatus,
  shouldIgnoreTerminalPollResult,
  shouldPollReportLiveStatus,
  type ReportStatus,
  type XlsxStatus,
} from "./report-live-status.logic";
import {
  REPORT_LIVE_SNAPSHOT_EVENT,
  type ReportLiveSnapshot,
} from "./report-page.logic";
import { requestJson } from "@/lib/client/api";

const POLL_INTERVAL_MS = 4000;

type ReportSnapshotEventDetail = {
  reportId: string;
  snapshot: ReportLiveSnapshot;
  source?: "optimistic-retry" | "poll";
};

export function ReportLiveStatus({
  reportId,
  initialStatus,
  initialXlsxStatus,
}: {
  reportId: string;
  initialStatus: ReportStatus;
  initialXlsxStatus: XlsxStatus;
}) {
  const router = useRouter();
  const [currentStatus, setCurrentStatus] = useState<ReportStatus>(initialStatus);
  const [currentXlsxStatus, setCurrentXlsxStatus] = useState<XlsxStatus>(initialXlsxStatus);
  const statusRef = useRef<ReportStatus>(initialStatus);
  const xlsxStatusRef = useRef<XlsxStatus>(initialXlsxStatus);
  const hasConfirmedActiveServerStateRef = useRef(
    hasActiveReportLiveStatus(initialStatus, initialXlsxStatus)
  );
  const toastId = `report-live-${reportId}`;

  useEffect(() => {
    const handleSnapshot = (event: Event) => {
      const detail = (event as CustomEvent<ReportSnapshotEventDetail>).detail;
      if (!detail || detail.reportId !== reportId) return;

      if (detail.source === "optimistic-retry") {
        hasConfirmedActiveServerStateRef.current = false;
      } else if (hasActiveReportLiveStatus(detail.snapshot.reportStatus, detail.snapshot.xlsxStatus)) {
        hasConfirmedActiveServerStateRef.current = true;
      }

      statusRef.current = detail.snapshot.reportStatus;
      xlsxStatusRef.current = detail.snapshot.xlsxStatus;
      setCurrentStatus(detail.snapshot.reportStatus);
      setCurrentXlsxStatus(detail.snapshot.xlsxStatus);
    };

    window.addEventListener(REPORT_LIVE_SNAPSHOT_EVENT, handleSnapshot);
    return () => {
      window.removeEventListener(REPORT_LIVE_SNAPSHOT_EVENT, handleSnapshot);
    };
  }, [reportId]);

  useEffect(() => {
    const isActive = shouldPollReportLiveStatus(currentStatus, currentXlsxStatus);
    if (!isActive) return;

    const toastMessage =
      currentStatus === "queued" || currentStatus === "processing"
        ? "Processing report…"
        : "Rendering XLSX…";
    toast.loading(toastMessage, {
      id: toastId,
      duration: Infinity,
    });

    const poll = async () => {
      let data: {
        report?: {
          status?: ReportStatus;
          aiStatus?: string | null;
          xlsxStatus?: XlsxStatus;
          aiReportJson?: unknown;
          xlsxArtifactUrl?: string | null;
        };
      } | null;

      try {
        data = await requestJson(`/api/reports/${reportId}`, { cache: "no-store" });
      } catch {
        return;
      }
      if (!data) return;

      const nextStatus = data.report?.status ?? statusRef.current;
      const nextXlsxStatus = data.report?.xlsxStatus ?? xlsxStatusRef.current;
      const nextSnapshot: ReportLiveSnapshot = {
        reportStatus: nextStatus,
        aiStatus: data.report?.aiStatus ?? null,
        xlsxStatus: nextXlsxStatus,
        hasAiReportJson: !!data.report?.aiReportJson,
        hasXlsxArtifact: !!data.report?.xlsxArtifactUrl,
      };

      if (
        shouldIgnoreTerminalPollResult({
          currentStatus: statusRef.current,
          currentXlsxStatus: xlsxStatusRef.current,
          nextStatus,
          nextXlsxStatus,
          hasConfirmedActiveServerState: hasConfirmedActiveServerStateRef.current,
        })
      ) {
        return;
      }

      if (nextStatus !== statusRef.current) {
        if (nextStatus === "complete") {
          toast.success("Report ready!", { id: toastId });
          router.refresh();
          return;
        }
        if (nextStatus === "failed") {
          toast.error("Report generation failed", { id: toastId });
          router.refresh();
          return;
        }
      }

      if (nextXlsxStatus !== xlsxStatusRef.current) {
        if (nextXlsxStatus === "ready") {
          toast.success("XLSX ready!", { id: toastId });
          router.refresh();
          return;
        }
        if (nextXlsxStatus === "failed") {
          toast.error("XLSX generation failed", { id: toastId });
          router.refresh();
        }
      }

      if (
        nextStatus !== statusRef.current ||
        nextXlsxStatus !== xlsxStatusRef.current
      ) {
        if (hasActiveReportLiveStatus(nextStatus, nextXlsxStatus)) {
          hasConfirmedActiveServerStateRef.current = true;
        }
        statusRef.current = nextStatus;
        xlsxStatusRef.current = nextXlsxStatus;
        setCurrentStatus(nextStatus);
        setCurrentXlsxStatus(nextXlsxStatus);
        window.dispatchEvent(
          new CustomEvent(REPORT_LIVE_SNAPSHOT_EVENT, {
            detail: {
              reportId,
              snapshot: nextSnapshot,
              source: "poll",
            },
          })
        );
      }
    };

    const interval = window.setInterval(() => {
      void poll();
    }, POLL_INTERVAL_MS);
    void poll();

    return () => {
      window.clearInterval(interval);
      toast.dismiss(toastId);
    };
  }, [currentStatus, currentXlsxStatus, reportId, router, toastId]);

  return null;
}
