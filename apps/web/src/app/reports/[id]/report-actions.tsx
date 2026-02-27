"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export function ReportActions({
  reportId,
  xlsxReady,
}: {
  reportId: string;
  xlsxReady: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<null | "retry" | "xlsx">(null);

  async function post(path: string, mode: "retry" | "xlsx") {
    setBusy(mode);
    try {
      const res = await fetch(path, { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Request failed");
      toast.success(mode === "retry" ? "Report re-queued" : "XLSX render re-queued");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Request failed");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Button size="sm" variant="outline" onClick={() => post(`/api/reports/${reportId}/retry`, "retry")} disabled={busy !== null}>
        {busy === "retry" ? "Re-queuing..." : "Retry Report"}
      </Button>
      <Button size="sm" variant="outline" onClick={() => post(`/api/reports/${reportId}/retry-xlsx`, "xlsx")} disabled={busy !== null}>
        {busy === "xlsx" ? "Re-queuing..." : "Retry XLSX Only"}
      </Button>
      {xlsxReady ? (
        <Button size="sm" asChild>
          <a href={`/api/reports/${reportId}/download`}>Download XLSX</a>
        </Button>
      ) : null}
    </div>
  );
}
