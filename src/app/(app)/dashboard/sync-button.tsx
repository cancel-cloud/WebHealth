"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";

export function SyncButton() {
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
        toast.success(`Successfully synced ${data.count} new properties.`, { id: "sync-toast" });
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
