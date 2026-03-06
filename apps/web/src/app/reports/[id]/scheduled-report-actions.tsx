"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "sonner";
import { waitForReportToStart } from "./scheduled-report-actions.logic";

type ScheduledReportActionsProps = {
  reportId: string;
  canContinueAnyway: boolean;
  continueAnywayReason: string | null;
  canProceedWithGa4: boolean;
  proceedWithGa4Reason: string | null;
};

export function ScheduledReportActions({
  reportId,
  canContinueAnyway,
  continueAnywayReason,
  canProceedWithGa4,
  proceedWithGa4Reason,
}: ScheduledReportActionsProps) {
  const [busy, setBusy] = useState<null | "continue" | "full">(null);

  async function start(mode: "continue" | "full") {
    setBusy(mode);
    try {
      await toast.promise(
        (async () => {
          const res = await fetch(`/api/reports/${reportId}/start`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(mode === "continue" ? { forceWithoutGa4: true } : {}),
          });
          const data = await res.json().catch(() => ({}));
          if (!res.ok) throw new Error(data.error ?? "Request failed");
        })(),
        {
          loading: mode === "continue" ? "Starting report without GA4…" : "Starting report with GSC + GA4…",
          success: mode === "continue" ? "Report queued with GSC-only data" : "Report queued with GSC + GA4 data",
          error: (error) => (error instanceof Error ? error.message : "Request failed"),
        }
      );
      await waitForReportToStart({
        getStatus: async () => {
          const res = await fetch(`/api/reports/${reportId}`, { cache: "no-store" });
          if (!res.ok) return null;
          const data = (await res.json()) as { report?: { status?: string } };
          return data.report?.status ?? null;
        },
      });
      window.location.reload();
    } catch {
      // Toast handled above
    } finally {
      setBusy(null);
    }
  }

  function ActionButton(props: {
    label: string;
    mode: "continue" | "full";
    canRun: boolean;
    disabledReason: string | null;
  }) {
    const isDisabled = busy !== null || !props.canRun;
    const button = (
      <Button
        variant={props.mode === "full" ? "default" : "outline"}
        className="rounded-full"
        onClick={() => start(props.mode)}
        disabled={isDisabled}
      >
        {busy === props.mode
          ? props.mode === "continue"
            ? "Starting..."
            : "Starting..."
          : props.label}
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
    <div className="flex flex-wrap gap-3">
      <ActionButton
        label="Continue Anyway"
        mode="continue"
        canRun={canContinueAnyway}
        disabledReason={continueAnywayReason}
      />
      {canProceedWithGa4 || proceedWithGa4Reason ? (
        <ActionButton
          label="Proceed With GSC + GA4"
          mode="full"
          canRun={canProceedWithGa4}
          disabledReason={proceedWithGa4Reason}
        />
      ) : null}
    </div>
  );
}
