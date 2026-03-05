"use client";

import { useState } from "react";
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

export function GetDetailsButton({
  reportId,
  rowType,
  rowId,
  rowTitle,
  initialDetail,
}: GetDetailsButtonProps) {
  const [detail, setDetail] = useState<string | null>(initialDetail ?? null);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  async function handleGetDetails() {
    setLoading(true);
    const toastId = toast.loading(`Generating details for "${rowTitle}"…`);
    try {
      const res = await fetch(`/api/reports/${reportId}/generate-detail`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rowType, rowId }),
      });
      const data = await res.json() as { actionDetail?: string; error?: string };
      if (!res.ok) throw new Error(data.error ?? "Request failed");
      setDetail(data.actionDetail ?? null);
      toast.success("Details ready", {
        id: toastId,
        action: { label: "Open", onClick: () => setModalOpen(true) },
      });
    } catch (err) {
      toast.error("Failed to generate details", { id: toastId });
      console.error(err);
    } finally {
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
