"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { PropertyRefreshState } from "@webhealth/shared/lib/property-refresh";
import type { SupportedLanguage } from "@webhealth/shared/lib/language";
import { requestJson } from "@/lib/client/api";

const POLL_INTERVAL_MS = 4000;
const TERMINAL_TOAST_DURATION_MS = 5000;

const LIVE_STATUS_COPY = {
  en: {
    refreshing: "Refreshing property...",
    complete: "Rerun complete.",
    failed: "Rerun failed. Showing last valid dashboard.",
  },
  de: {
    refreshing: "Property wird aktualisiert...",
    complete: "Neuberechnung abgeschlossen.",
    failed: "Neuberechnung fehlgeschlagen. Das letzte gültige Dashboard bleibt sichtbar.",
  },
} as const;

export function PropertyLiveStatus({
  propertyId,
  initialRefreshState,
  payloadVersion,
  preset,
  compareMode,
  startDate,
  endDate,
  onStateChange,
  language = "en",
}: {
  propertyId: string;
  initialRefreshState: PropertyRefreshState | null;
  payloadVersion: string;
  preset: string;
  compareMode: string;
  startDate: string;
  endDate: string;
  onStateChange?: (state: PropertyRefreshState | null) => void;
  language?: SupportedLanguage;
}) {
  const router = useRouter();
  const copy = LIVE_STATUS_COPY[language];
  const currentStateRef = useRef(initialRefreshState);
  const onStateChangeRef = useRef(onStateChange);
  const toastId = `property-refresh-${propertyId}`;
  // Prevents cleanup from dismissing a success/error toast that poll() just promoted
  const terminalToastShownRef = useRef(false);
  const initialRefreshStatus = initialRefreshState?.status ?? null;

  useEffect(() => {
    currentStateRef.current = initialRefreshState;
  }, [initialRefreshState]);

  useEffect(() => {
    onStateChangeRef.current = onStateChange;
  }, [onStateChange]);

  useEffect(() => {
    const currentState = currentStateRef.current;
    const isActive = currentState?.status === "queued" || currentState?.status === "processing";
    if (!isActive) {
      if (!terminalToastShownRef.current) {
        toast.dismiss(toastId);
      }
      terminalToastShownRef.current = false;
      return;
    }

    terminalToastShownRef.current = false;
    toast.loading(currentState?.message ?? copy.refreshing, {
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
      currentStateRef.current = nextState;
      onStateChangeRef.current?.(nextState);

      if (!nextState && data?.hasNewerPayload) {
        terminalToastShownRef.current = true;
        toast.success(copy.complete, { id: toastId, duration: TERMINAL_TOAST_DURATION_MS });
        router.refresh();
        return;
      }

      if (nextState?.status === "complete") {
        terminalToastShownRef.current = true;
        toast.success(nextState.message ?? copy.complete, { id: toastId, duration: TERMINAL_TOAST_DURATION_MS });
        router.refresh();
        return;
      }

      if (nextState?.status === "failed") {
        terminalToastShownRef.current = true;
        toast.error(nextState.message ?? copy.failed, {
          id: toastId,
          duration: TERMINAL_TOAST_DURATION_MS,
        });
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
      if (!terminalToastShownRef.current) {
        toast.dismiss(toastId);
      }
    };
  }, [compareMode, copy.complete, copy.failed, copy.refreshing, endDate, initialRefreshStatus, payloadVersion, preset, propertyId, router, startDate, toastId]);

  return null;
}
