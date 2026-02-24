"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";

export function SyncButton({ onSynced }: { onSynced?: () => void } = {}) {
  const [isSyncing, setIsSyncing] = useState(false);
  const router = useRouter();

  const handleSync = async () => {
    setIsSyncing(true);
    toast("Syncing properties...", { id: "sync-toast" });

    try {
      const res = await fetch("/api/properties/sync", {
        method: "POST",
      });

      const data = await res.json();

      if (res.ok) {
        const parts = [];
        if (data.gscCount > 0) parts.push(`${data.gscCount} GSC`);
        if (data.ga4Count > 0) parts.push(`${data.ga4Count} GA4`);
        const newProps = parts.length > 0 ? parts.join(", ") : "0";
        const autoMsg = data.autoLinked > 0 ? ` • ${data.autoLinked} auto-linked` : "";
        toast.success(`Synced ${newProps} new properties${autoMsg}.`, { id: "sync-toast" });
        onSynced?.();
        router.refresh();
      } else {
        toast.error(`Sync failed: ${data.error}`, { id: "sync-toast" });
      }
    } catch (error) {
      toast.error(`An error occurred: ${error instanceof Error ? error.message : "Unknown error"}`, { id: "sync-toast" });
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <Button onClick={handleSync} disabled={isSyncing} variant="outline">
      <RefreshCw className={`h-4 w-4 mr-2 ${isSyncing ? "animate-spin" : ""}`} />
      {isSyncing ? "Syncing..." : "Sync Properties"}
    </Button>
  );
}
