"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

type ReportStatus = "queued" | "processing" | "complete" | "failed" | string;

const POLL_INTERVAL_MS = 4000;

export function ReportLiveStatus({
  reportId,
  initialStatus,
}: {
  reportId: string;
  initialStatus: ReportStatus;
}) {
  const router = useRouter();
  const statusRef = useRef<ReportStatus>(initialStatus);
  const toastId = `report-live-${reportId}`;

  useEffect(() => {
    statusRef.current = initialStatus;
  }, [initialStatus]);

  useEffect(() => {
    const isActive = initialStatus === "queued" || initialStatus === "processing";
    if (!isActive) return;

    toast.loading("Processing report…", {
      id: toastId,
      duration: Infinity,
    });

    const poll = async () => {
      const res = await fetch(`/api/reports/${reportId}`, { cache: "no-store" });
      if (!res.ok) return;
      const data = (await res.json()) as { report?: { status?: ReportStatus } };
      const nextStatus = data.report?.status;
      if (!nextStatus || nextStatus === statusRef.current) return;
      statusRef.current = nextStatus;

      if (nextStatus === "complete") {
        toast.success("Report ready!", { id: toastId });
        router.refresh();
        return;
      }
      if (nextStatus === "failed") {
        toast.error("Report generation failed", { id: toastId });
        router.refresh();
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
  }, [initialStatus, reportId, router, toastId]);

  return null;
}
