"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Share2 } from "lucide-react";
import { toast } from "sonner";

export function ReportActions({
  reportId,
  xlsxReady,
  canRetryReport,
  retryReportReason,
  canRetryXlsx,
  retryXlsxReason,
}: {
  reportId: string;
  xlsxReady: boolean;
  canRetryReport: boolean;
  retryReportReason: string | null;
  canRetryXlsx: boolean;
  retryXlsxReason: string | null;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<null | "retry" | "xlsx">(null);

  async function post(path: string, mode: "retry" | "xlsx") {
    setBusy(mode);
    try {
      await toast.promise(
        (async () => {
          const res = await fetch(path, { method: "POST" });
          const data = await res.json().catch(() => ({}));
          if (!res.ok) throw new Error(data.error ?? "Request failed");
        })(),
        {
          loading: mode === "retry" ? "Re-queuing report…" : "Re-queuing XLSX…",
          success: mode === "retry" ? "Report re-queued" : "XLSX render re-queued",
          error: (error) =>
            error instanceof Error ? error.message : "Request failed",
        }
      );
      if (mode === "retry") {
        toast.loading("Processing report…", { id: `report-live-${reportId}`, duration: Infinity });
      }
      router.refresh();
    } catch {
      // Toast is handled by toast.promise
    } finally {
      setBusy(null);
    }
  }

  function ActionButton(props: {
    label: string;
    busyLabel: string;
    mode: "retry" | "xlsx";
    path: string;
    canRun: boolean;
    disabledReason: string | null;
  }) {
    const isDisabled = busy !== null || !props.canRun;
    const button = (
      <Button
        size="sm"
        variant="outline"
        onClick={() => post(props.path, props.mode)}
        disabled={isDisabled}
      >
        {busy === props.mode ? props.busyLabel : props.label}
      </Button>
    );

    if (!props.disabledReason) return button;

    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <span tabIndex={isDisabled ? 0 : undefined} className="inline-flex">
            {button}
          </span>
        </TooltipTrigger>
        <TooltipContent sideOffset={8}>{props.disabledReason}</TooltipContent>
      </Tooltip>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Tooltip>
        <TooltipTrigger asChild>
          <span tabIndex={0}>
            <Button size="sm" variant="outline" disabled className="gap-1.5">
              <Share2 className="h-3.5 w-3.5" aria-hidden="true" />
              Share
            </Button>
          </span>
        </TooltipTrigger>
        <TooltipContent>Share a public link with clients — coming soon</TooltipContent>
      </Tooltip>
      <ActionButton
        label="Retry Report"
        busyLabel="Re-queuing..."
        mode="retry"
        path={`/api/reports/${reportId}/retry`}
        canRun={canRetryReport}
        disabledReason={retryReportReason}
      />
      <ActionButton
        label="Retry XLSX Only"
        busyLabel="Re-queuing..."
        mode="xlsx"
        path={`/api/reports/${reportId}/retry-xlsx`}
        canRun={canRetryXlsx}
        disabledReason={retryXlsxReason}
      />
      {xlsxReady ? (
        <Button size="sm" asChild>
          <a href={`/api/reports/${reportId}/download`}>Download XLSX</a>
        </Button>
      ) : null}
    </div>
  );
}
