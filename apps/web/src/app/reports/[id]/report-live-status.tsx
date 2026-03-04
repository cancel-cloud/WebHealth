"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  shouldPollReportLiveStatus,
  type ReportStatus,
  type XlsxStatus,
} from "./report-live-status.logic";

const POLL_INTERVAL_MS = 4000;

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
  const statusRef = useRef<ReportStatus>(initialStatus);
  const xlsxStatusRef = useRef<XlsxStatus>(initialXlsxStatus);
  const toastId = `report-live-${reportId}`;

  useEffect(() => {
    statusRef.current = initialStatus;
  }, [initialStatus]);

  useEffect(() => {
    xlsxStatusRef.current = initialXlsxStatus;
  }, [initialXlsxStatus]);

  useEffect(() => {
    const isActive = shouldPollReportLiveStatus(initialStatus, initialXlsxStatus);
    if (!isActive) return;

    const toastMessage =
      initialStatus === "queued" || initialStatus === "processing"
        ? "Processing report…"
        : "Rendering XLSX…";
    toast.loading(toastMessage, {
      id: toastId,
      duration: Infinity,
    });

    const poll = async () => {
      const res = await fetch(`/api/reports/${reportId}`, { cache: "no-store" });
      if (!res.ok) return;
      const data = (await res.json()) as {
        report?: { status?: ReportStatus; xlsxStatus?: XlsxStatus };
      };
      const nextStatus = data.report?.status;
      const nextXlsxStatus = data.report?.xlsxStatus;

      if (nextStatus && nextStatus !== statusRef.current) {
        statusRef.current = nextStatus;

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

      if (nextXlsxStatus && nextXlsxStatus !== xlsxStatusRef.current) {
        xlsxStatusRef.current = nextXlsxStatus;
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
    };

    const interval = window.setInterval(() => {
      void poll();
    }, POLL_INTERVAL_MS);
    void poll();

    return () => {
      window.clearInterval(interval);
      toast.dismiss(toastId);
    };
  }, [initialStatus, initialXlsxStatus, reportId, router, toastId]);

  return null;
}
