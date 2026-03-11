"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { getAppErrorMessage, isAppError } from "@/lib/client/app-error";
import { requestJson } from "@/lib/client/api";

export type PropertiesSyncResult = {
  gscCount: number;
  ga4Count: number;
  autoLinked: number;
};

type SyncButtonProps = {
  onSynced?: () => void | Promise<void>;
  externalIsSyncing?: boolean;
  refreshStrategy?: "router" | "callback" | "both";
};

export async function runPropertiesSync(): Promise<PropertiesSyncResult> {
  const data = await requestJson<PropertiesSyncResult>("/api/properties/sync", {
    method: "POST",
  });
  return data ?? { gscCount: 0, ga4Count: 0, autoLinked: 0 };
}

export function formatPropertiesSyncSuccess(data: PropertiesSyncResult) {
  const parts = [];
  if (data.gscCount > 0) parts.push(`${data.gscCount} GSC`);
  if (data.ga4Count > 0) parts.push(`${data.ga4Count} GA4`);
  const newProps = parts.length > 0 ? parts.join(", ") : "0";
  const autoMsg = data.autoLinked > 0 ? ` • ${data.autoLinked} auto-linked` : "";
  return `Synced ${newProps} new properties${autoMsg}.`;
}

export function SyncButton({
  onSynced,
  externalIsSyncing = false,
  refreshStrategy = "both",
}: SyncButtonProps = {}) {
  const [isSyncing, setIsSyncing] = useState(false);
  const router = useRouter();
  const isBusy = isSyncing || externalIsSyncing;

  const handleSync = async () => {
    if (isBusy) return;
    setIsSyncing(true);
    toast("Syncing properties...", { id: "sync-toast" });

    try {
      const data = await runPropertiesSync();
      toast.success(formatPropertiesSyncSuccess(data), { id: "sync-toast" });

      if (refreshStrategy === "callback" || refreshStrategy === "both") {
        await onSynced?.();
      }
      if (refreshStrategy === "router" || refreshStrategy === "both") {
        router.refresh();
      }
    } catch (error) {
      if (isAppError(error) && error.code === "GOOGLE_AUTH_RELOGIN_REQUIRED") {
        toast.error("Google authorization expired. Please sign in again.", {
          id: "sync-toast",
          duration: 10000,
          action: {
            label: "Sign in again",
            onClick: () => router.push("/"),
          },
        });
      } else {
        toast.error(`An error occurred: ${getAppErrorMessage(error, "Unknown error")}`, {
          id: "sync-toast",
        });
      }
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <Button onClick={handleSync} disabled={isBusy} variant="outline">
      <RefreshCw className={`h-4 w-4 mr-2 ${isBusy ? "animate-spin" : ""}`} />
      {isBusy ? "Syncing..." : "Sync Properties"}
    </Button>
  );
}
