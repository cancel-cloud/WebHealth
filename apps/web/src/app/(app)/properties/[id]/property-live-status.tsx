"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { PropertyRefreshState } from "@webhealth/shared/lib/property-refresh";
import { requestJson } from "@/lib/client/api";

const POLL_INTERVAL_MS = 4000;

export function PropertyLiveStatus({
  propertyId,
  initialRefreshState,
  payloadVersion,
  preset,
  compareMode,
  startDate,
  endDate,
  onStateChange,
}: {
  propertyId: string;
  initialRefreshState: PropertyRefreshState | null;
  payloadVersion: string;
  preset: string;
  compareMode: string;
  startDate: string;
  endDate: string;
  onStateChange?: (state: PropertyRefreshState | null) => void;
}) {
  const router = useRouter();
  const [currentState, setCurrentState] = useState(initialRefreshState);
  const toastId = `property-refresh-${propertyId}`;

  useEffect(() => {
    setCurrentState(initialRefreshState);
  }, [initialRefreshState]);

  useEffect(() => {
    const isActive = currentState?.status === "queued" || currentState?.status === "processing";
    if (!isActive) {
      toast.dismiss(toastId);
      return;
    }

    toast.loading(currentState?.message ?? "Refreshing property…", {
      id: toastId,
      duration: Infinity,
    });

    const poll = async () => {
      let data: {
        refreshState?: PropertyRefreshState | null;
        hasNewerPayload?: boolean;
        isActive?: boolean;
        isTerminal?: boolean;
      } | null = null;

      try {
        const params = new URLSearchParams({
          currentPayloadVersion: payloadVersion,
          preset,
          compare: compareMode,
          start: startDate,
          end: endDate,
        });
        data = await requestJson(`/api/properties/${encodeURIComponent(propertyId)}/status?${params.toString()}`, {
          cache: "no-store",
        });
      } catch {
        return;
      }

      const rawNextState = data?.refreshState ?? null;
      const nextState = data?.hasNewerPayload && (rawNextState?.status === "queued" || rawNextState?.status === "processing")
        ? null
        : rawNextState;
      setCurrentState(nextState);
      onStateChange?.(nextState);

      if (!nextState && data?.hasNewerPayload) {
        toast.success("Rerun complete.", { id: toastId });
        router.refresh();
        return;
      }

      if (nextState?.status === "complete") {
        toast.success(nextState.message ?? "Rerun complete.", { id: toastId });
        router.refresh();
        return;
      }

      if (nextState?.status === "failed") {
        toast.error(nextState.message ?? "Rerun failed. Showing last valid dashboard.", { id: toastId });
        router.refresh();
        return;
      }

      if (data?.hasNewerPayload) {
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
  }, [compareMode, currentState?.message, currentState?.status, endDate, onStateChange, payloadVersion, preset, propertyId, router, startDate, toastId]);

  return null;
}
