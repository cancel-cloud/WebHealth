"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "sonner";
import { getAppErrorMessage } from "@/lib/client/app-error";
import { requestJson } from "@/lib/client/api";
import { waitForReportToStart } from "./scheduled-report-actions.logic";
import { useGoogleAccessRecovery } from "@/components/google-access-recovery";
import {
  getGoogleAccessDialogModel,
  getGoogleAccessIssueFromCode,
} from "@/components/google-access-recovery.logic";

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
  const { issue, hasBlockingIssue, refreshHealth } = useGoogleAccessRecovery();

  async function start(mode: "continue" | "full") {
    setBusy(mode);
    try {
      await toast.promise(
        (async () => {
          await requestJson(`/api/reports/${reportId}/start`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(mode === "continue" ? { forceWithoutGa4: true } : {}),
          });
        })(),
        {
          loading: mode === "continue" ? "Starting report without GA4…" : "Starting report with GSC + GA4…",
          success: mode === "continue" ? "Report queued with GSC-only data" : "Report queued with GSC + GA4 data",
          error: (error) => getAppErrorMessage(error),
        }
      );
      await waitForReportToStart({
        getStatus: async () => {
          try {
            const data = await requestJson<{ report?: { status?: string } }>(`/api/reports/${reportId}`, { cache: "no-store" });
            return data?.report?.status ?? null;
          } catch {
            return null;
          }
        },
      });
      window.location.reload();
    } catch (error) {
      const code =
        error instanceof Error && "code" in error
          ? (error as { code?: string | null }).code
          : null;
      if (getGoogleAccessIssueFromCode(code)) {
        await refreshHealth({ openDialogOnIssue: true });
      }
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
    const recoveryModel = issue ? getGoogleAccessDialogModel(issue) : null;
    const disabledReason = hasBlockingIssue
      ? recoveryModel?.description ?? "Reconnect Google to continue."
      : props.disabledReason;
    const isDisabled = busy !== null || !props.canRun || hasBlockingIssue;
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

    if (!disabledReason) return button;

    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <span tabIndex={isDisabled ? 0 : undefined} className="inline-flex">
            {button}
          </span>
        </TooltipTrigger>
        <TooltipContent sideOffset={8}>{disabledReason}</TooltipContent>
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
