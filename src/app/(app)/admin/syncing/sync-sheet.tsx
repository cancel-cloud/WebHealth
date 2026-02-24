"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RefreshCw } from "lucide-react";

interface AdminUser {
  id: string;
  name: string;
  email: string;
  image: string | null;
  propertiesCount: number;
  lastSyncedAt: string | null;
}

interface SyncSheetProps {
  user: AdminUser | null;
  onClose: () => void;
}

export function SyncSheet({ user, onClose }: SyncSheetProps) {
  const [dateStart, setDateStart] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 28);
    return d.toISOString().slice(0, 10);
  });
  const [dateEnd, setDateEnd] = useState(() => new Date().toISOString().slice(0, 10));
  const [loading, setLoading] = useState(false);

  const handleSync = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await fetch("/api/admin/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, dateStart, dateEnd }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Sync failed");
      toast.success(
        `Sync complete: ${data.gscCount} GSC, ${data.ga4Count} GA4, ${data.autoLinked} linked, ${data.reportsCreated} reports queued`
      );
      onClose();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Sync failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Sheet open={!!user} onOpenChange={(open) => !open && onClose()}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Sync for {user?.name}</SheetTitle>
          <SheetDescription>{user?.email}</SheetDescription>
        </SheetHeader>
        <div className="mt-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="dateStart">Date Start</Label>
            <Input
              id="dateStart"
              type="date"
              value={dateStart}
              onChange={(e) => setDateStart(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="dateEnd">Date End</Label>
            <Input
              id="dateEnd"
              type="date"
              value={dateEnd}
              onChange={(e) => setDateEnd(e.target.value)}
            />
          </div>
          <Button onClick={handleSync} disabled={loading} className="w-full">
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            {loading ? "Syncing..." : "Sync Properties & Queue Reports"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
