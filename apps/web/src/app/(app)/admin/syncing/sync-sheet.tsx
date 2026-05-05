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
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { RefreshCw } from "lucide-react";
import { getAppErrorMessage } from "@/lib/client/app-error";
import { requestJson } from "@/lib/client/api";

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
  const [loading, setLoading] = useState(false);
  const [syncGsc, setSyncGsc] = useState(true);
  const [syncGa4, setSyncGa4] = useState(true);
  const [timeframe, setTimeframe] = useState<"14d" | "30d" | "60d">("30d");

  const handleSync = async () => {
    if (!user) return;
    if (!syncGsc && !syncGa4) {
      toast.error("Select at least one source to sync.");
      return;
    }
    setLoading(true);
    try {
      const data = await requestJson<{
        gscCount: number;
        ga4Count: number;
        autoLinked: number;
        gscValidated: number;
        ga4Validated: number;
        timeframeLabel: string;
      }>("/api/admin/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          includeGsc: syncGsc,
          includeGa4: syncGa4,
          timeframe,
        }),
      });
      toast.success(
        `Sync complete: ${data?.gscCount ?? 0} GSC, ${data?.ga4Count ?? 0} GA4, ${data?.autoLinked ?? 0} linked · tested ${data?.gscValidated ?? 0} GSC / ${data?.ga4Validated ?? 0} GA4 (${data?.timeframeLabel ?? timeframe})`
      );
      onClose();
    } catch (err: unknown) {
      toast.error(getAppErrorMessage(err, "Sync failed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Sheet open={!!user} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full sm:max-w-lg">
        <SheetHeader className="px-4 pt-6 pr-12 sm:px-6">
          <SheetTitle>Sync for {user?.name}</SheetTitle>
          <SheetDescription>{user?.email}</SheetDescription>
        </SheetHeader>
        <div className="mt-2 space-y-4 px-4 pb-6 sm:px-6">
          <div className="rounded-lg border p-3 space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Sources
            </p>
            <div className="flex items-center justify-between gap-3">
              <Label htmlFor="sync-gsc" className="cursor-pointer">
                Google Search Console
              </Label>
              <Switch id="sync-gsc" checked={syncGsc} onCheckedChange={setSyncGsc} />
            </div>
            <div className="flex items-center justify-between gap-3">
              <Label htmlFor="sync-ga4" className="cursor-pointer">
                Google Analytics 4
              </Label>
              <Switch id="sync-ga4" checked={syncGa4} onCheckedChange={setSyncGa4} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="sync-timeframe">Metrics test timeframe</Label>
            <Select value={timeframe} onValueChange={(v) => setTimeframe(v as "14d" | "30d" | "60d")}>
              <SelectTrigger id="sync-timeframe" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="14d">Last 2 weeks</SelectItem>
                <SelectItem value="30d">Last month</SelectItem>
                <SelectItem value="60d">Last 2 months</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Validates GSC/GA4 data fetches for the selected window.
            </p>
          </div>
          <Button onClick={handleSync} disabled={loading} className="w-full">
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            {loading ? "Syncing..." : "Sync Selected"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
