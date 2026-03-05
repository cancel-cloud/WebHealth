"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ActionDetailModal } from "./action-detail-modal";

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
const inFlightByKey = new Map<string, Promise<string>>();

export function GetDetailsButton({
  reportId,
  rowType,
  rowId,
  rowTitle,
  initialDetail,
}: GetDetailsButtonProps) {
  const detailKey = useMemo(() => `${reportId}:${rowType}:${rowId}`, [reportId, rowType, rowId]);

  const [detail, setDetail] = useState<string | null>(() => {
    return detailCache.get(detailKey) ?? initialDetail ?? null;
  });
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    if (initialDetail) detailCache.set(detailKey, initialDetail);
    setDetail(detailCache.get(detailKey) ?? initialDetail ?? null);
  }, [detailKey, initialDetail]);

  async function generateDetail() {
    const res = await fetch(`/api/reports/${reportId}/generate-detail`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rowType, rowId }),
    });
    const data = await res.json() as { actionDetail?: string; error?: string };
    if (!res.ok) throw new Error(data.error ?? "Request failed");
    return data.actionDetail ?? "";
  }

  async function handleGetDetails() {
    if (detail) {
      setModalOpen(true);
      return;
    }

    setLoading(true);
    const toastId = toast.loading(`Generating details for "${rowTitle}"…`);
    try {
      let request = inFlightByKey.get(detailKey);
      if (!request) {
        request = generateDetail();
        inFlightByKey.set(detailKey, request);
      }

      const nextDetail = await request;
      if (nextDetail) detailCache.set(detailKey, nextDetail);
      setDetail(nextDetail || null);
      toast.success("Details ready", {
        id: toastId,
        action: { label: "Open", onClick: () => setModalOpen(true) },
      });
    } catch (err) {
      toast.error("Failed to generate details", { id: toastId });
      console.error(err);
    } finally {
      inFlightByKey.delete(detailKey);
      setLoading(false);
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
