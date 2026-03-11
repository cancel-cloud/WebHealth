"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { getAppErrorMessage, isAppError } from "@/lib/client/app-error";
import { requestJson } from "@/lib/client/api";
import { ActionDetailModal } from "./action-detail-modal";
import { getDetailToastId, getDetailToastState } from "./get-details-button.logic";

type RowType =
  | "actionBacklog"
  | "ctrGap"
  | "nearWin"
  | "cannibalization"
  | "contentDecay";

type GetDetailsButtonProps = {
  reportId: string;
  rowType: RowType;
  rowId: string;
  rowTitle: string;
  initialDetail?: string | null;
};

const detailCache = new Map<string, string>();
const inFlightByKey = new Map<string, Promise<string | null>>();
const PENDING_STORAGE_KEY = "webhealth:detail-pending:v1";
const POLL_INTERVAL_MS = 2500;
const PENDING_MAX_AGE_MS = 1000 * 60 * 5;

function readPendingMap(): Record<string, number> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(PENDING_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, number>;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writePendingMap(map: Record<string, number>) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(PENDING_STORAGE_KEY, JSON.stringify(map));
  } catch {
    // Ignore storage write failures (private mode, quota, etc.)
  }
}

function setPendingPersisted(detailKey: string, startedAt = Date.now()) {
  const map = readPendingMap();
  map[detailKey] = startedAt;
  writePendingMap(map);
}

function clearPendingPersisted(detailKey: string) {
  const map = readPendingMap();
  if (!(detailKey in map)) return;
  delete map[detailKey];
  writePendingMap(map);
}

function getPendingStartedAt(detailKey: string): number | null {
  const map = readPendingMap();
  const value = map[detailKey];
  return typeof value === "number" ? value : null;
}

function hasFreshPendingPersisted(detailKey: string): boolean {
  const startedAt = getPendingStartedAt(detailKey);
  if (!startedAt) return false;
  if (Date.now() - startedAt > PENDING_MAX_AGE_MS) {
    clearPendingPersisted(detailKey);
    return false;
  }
  return true;
}

export function GetDetailsButton({
  reportId,
  rowType,
  rowId,
  rowTitle,
  initialDetail,
}: GetDetailsButtonProps) {
  const detailKey = useMemo(() => `${reportId}:${rowType}:${rowId}`, [reportId, rowType, rowId]);
  const detailToastId = useMemo(() => getDetailToastId(detailKey), [detailKey]);
  const detailToastArgs = useMemo(
    () => ({ detailKey, rowTitle }),
    [detailKey, rowTitle]
  );

  const [detail, setDetail] = useState<string | null>(() => {
    return detailCache.get(detailKey) ?? initialDetail ?? null;
  });
  const [loading, setLoading] = useState(() => inFlightByKey.has(detailKey) || hasFreshPendingPersisted(detailKey));
  const [modalOpen, setModalOpen] = useState(false);
  const [pollSeed, setPollSeed] = useState(0);

  useEffect(() => {
    if (initialDetail) detailCache.set(detailKey, initialDetail);
    const knownDetail = detailCache.get(detailKey) ?? initialDetail ?? null;
    setDetail(knownDetail);

    if (knownDetail) {
      clearPendingPersisted(detailKey);
      toast.dismiss(detailToastId);
      setLoading(false);
      return;
    }

    const pending = inFlightByKey.get(detailKey);
    const persistedStartedAt = getPendingStartedAt(detailKey);
    const shouldPollPersisted =
      persistedStartedAt != null &&
      Date.now() - persistedStartedAt <= PENDING_MAX_AGE_MS;

    let cancelled = false;
    let intervalId: number | null = null;

    const attachToPending = (request: Promise<string | null>) => {
      setLoading(true);
      void request
        .then((nextDetail) => {
          if (cancelled) return;
          if (nextDetail) detailCache.set(detailKey, nextDetail);
          setDetail(nextDetail || null);
          clearPendingPersisted(detailKey);
        })
        .catch((error) => {
          if (cancelled) return;
          console.error(error);
          clearPendingPersisted(detailKey);
        })
        .finally(() => {
          if (cancelled) return;
          if (inFlightByKey.get(detailKey) === request) {
            inFlightByKey.delete(detailKey);
          }
          setLoading(false);
        });
    };

    if (pending) {
      attachToPending(pending);
    } else if (shouldPollPersisted) {
      const queuedToast = getDetailToastState("queued", detailToastArgs);
      toast.loading(queuedToast.message, { id: queuedToast.id, duration: queuedToast.duration });

      const pollOnce = async (): Promise<boolean> => {
        try {
          const data = await requestJson<{
            ready?: boolean;
            actionDetail?: string | null;
          }>(
            `/api/reports/${reportId}/generate-detail?rowType=${encodeURIComponent(rowType)}&rowId=${encodeURIComponent(rowId)}`,
            { cache: "no-store" }
          );
          if (!data) return false;
          if (!data.ready || !data.actionDetail) return false;

          if (cancelled) return true;
          detailCache.set(detailKey, data.actionDetail);
          setDetail(data.actionDetail);
          clearPendingPersisted(detailKey);
          setLoading(false);
          toast.dismiss(detailToastId);
          const readyToast = getDetailToastState("ready", detailToastArgs);
          toast.success(readyToast.message, {
            duration: readyToast.duration,
            action: { label: "Open", onClick: () => setModalOpen(true) },
          });
          return true;
        } catch (error) {
          if (!cancelled) console.error(error);
          return false;
        }
      };

      setLoading(true);
      void pollOnce();
      intervalId = window.setInterval(() => {
        const startedAt = getPendingStartedAt(detailKey);
        if (!startedAt || Date.now() - startedAt > PENDING_MAX_AGE_MS) {
          clearPendingPersisted(detailKey);
          if (!cancelled) setLoading(false);
          toast.dismiss(detailToastId);
          if (intervalId != null) window.clearInterval(intervalId);
          intervalId = null;
          return;
        }
        void pollOnce().then((ready) => {
          if (ready && intervalId != null) {
            window.clearInterval(intervalId);
            intervalId = null;
          }
        });
      }, POLL_INTERVAL_MS);
    } else {
      if (persistedStartedAt != null) clearPendingPersisted(detailKey);
      toast.dismiss(detailToastId);
      setLoading(false);
    }

    return () => {
      cancelled = true;
      if (intervalId != null) window.clearInterval(intervalId);
    };
  }, [detailKey, detailToastArgs, detailToastId, initialDetail, pollSeed, reportId, rowId, rowType]);

  async function generateDetail() {
    const data = await requestJson<{
      actionDetail?: string | null;
    }>(`/api/reports/${reportId}/generate-detail`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rowType, rowId }),
    });
    return data?.actionDetail ?? null;
  }

  async function handleGetDetails() {
    if (detail) {
      setModalOpen(true);
      return;
    }

    setLoading(true);
    setPendingPersisted(detailKey);
    const startToast = getDetailToastState("start", detailToastArgs);
    toast.loading(startToast.message, { id: startToast.id, duration: startToast.duration });
    let queuedForPolling = false;
    try {
      let request = inFlightByKey.get(detailKey);
      if (!request) {
        request = generateDetail();
        inFlightByKey.set(detailKey, request);
      }

      const nextDetail = await request;
      if (nextDetail) {
        detailCache.set(detailKey, nextDetail);
        setDetail(nextDetail);
        clearPendingPersisted(detailKey);
        toast.dismiss(detailToastId);
        const readyToast = getDetailToastState("ready", detailToastArgs);
        toast.success(readyToast.message, {
          duration: readyToast.duration,
          action: { label: "Open", onClick: () => setModalOpen(true) },
        });
      } else {
        queuedForPolling = true;
        const queuedToast = getDetailToastState("queued", detailToastArgs);
        toast.loading(queuedToast.message, { id: queuedToast.id, duration: queuedToast.duration });
        setPollSeed((value) => value + 1);
      }
    } catch (err) {
      const abortLike =
        typeof err === "object" &&
        err !== null &&
        "name" in err &&
        (err as { name?: string }).name === "AbortError";
      const pageIsHidden =
        typeof document !== "undefined" && document.visibilityState === "hidden";

      // On reload/navigation the fetch can abort even though the server keeps processing.
      // Keep the persisted pending marker so the next page load can resume polling.
      if (abortLike || pageIsHidden) {
        return;
      }

      clearPendingPersisted(detailKey);

      if (isAppError(err) && err.code === "DETAIL_LIMIT_EXCEEDED") {
        toast.dismiss(detailToastId);
        toast.info("Monthly Deep Dive limit reached", {
          description: "Upgrade your plan to keep expanding action details.",
          action: { label: "Upgrade", onClick: () => { window.location.href = "/settings"; } },
          duration: 8000,
        });
        return;
      }

      const errorToast = getDetailToastState("error", detailToastArgs);
      toast.error(errorToast.message, { id: errorToast.id });
      console.error(getAppErrorMessage(err, "Failed to generate details"));
    } finally {
      inFlightByKey.delete(detailKey);
      if (!queuedForPolling) {
        setLoading(false);
      }
    }
  }

  return (
    <>
      {detail ? (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setModalOpen(true)}
        >
          View Details
        </Button>
      ) : (
        <Button
          variant="outline"
          size="sm"
          disabled={loading}
          onClick={handleGetDetails}
        >
          {loading ? "Generating…" : "Get Details"}
        </Button>
      )}

      <ActionDetailModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={rowTitle}
        detail={detail}
      />
    </>
  );
}
