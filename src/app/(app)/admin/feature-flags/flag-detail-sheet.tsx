"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Trash2 } from "lucide-react";

interface UserOverride {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  enabled: boolean;
}

interface FeatureFlag {
  id: string;
  name: string;
  description: string | null;
  enabledGlobally: boolean;
  overrideCount: number;
}

interface FlagDetailSheetProps {
  flag: FeatureFlag | null;
  allUsers: { id: string; name: string; email: string }[];
  onClose: () => void;
}

export function FlagDetailSheet({
  flag,
  allUsers,
  onClose,
}: FlagDetailSheetProps) {
  const [overrides, setOverrides] = useState<UserOverride[]>([]);
  const [loadingOverrides, setLoadingOverrides] = useState(false);
  const [togglingUserId, setTogglingUserId] = useState<string | null>(null);

  useEffect(() => {
    if (!flag) return;
    setLoadingOverrides(true);
    fetch(`/api/admin/feature-flags/${flag.id}/users`)
      .then((r) => r.json())
      .then((data) => setOverrides(data.overrides ?? []))
      .catch(() => setOverrides([]))
      .finally(() => setLoadingOverrides(false));
  }, [flag]);

  const toggleUserOverride = async (userId: string, currentEnabled: boolean | null) => {
    if (!flag) return;
    setTogglingUserId(userId);
    try {
      if (currentEnabled === null) {
        // No override → create one toggling from global
        const newEnabled = !flag.enabledGlobally;
        await fetch(`/api/admin/feature-flags/${flag.id}/users/${userId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ enabled: newEnabled }),
        });
        const user = allUsers.find((u) => u.id === userId);
        setOverrides((prev) => [
          ...prev,
          { id: `tmp_${userId}`, userId, userName: user?.name ?? "", userEmail: user?.email ?? "", enabled: newEnabled },
        ]);
        toast.success("Override created");
      } else {
        // Toggle existing override
        await fetch(`/api/admin/feature-flags/${flag.id}/users/${userId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ enabled: !currentEnabled }),
        });
        setOverrides((prev) =>
          prev.map((o) => (o.userId === userId ? { ...o, enabled: !currentEnabled } : o))
        );
        toast.success("Override updated");
      }
    } catch {
      toast.error("Failed to update override");
    } finally {
      setTogglingUserId(null);
    }
  };

  const removeOverride = async (userId: string) => {
    if (!flag) return;
    setTogglingUserId(userId);
    try {
      await fetch(`/api/admin/feature-flags/${flag.id}/users/${userId}`, {
        method: "DELETE",
      });
      setOverrides((prev) => prev.filter((o) => o.userId !== userId));
      toast.success("Override removed");
    } catch {
      toast.error("Failed to remove override");
    } finally {
      setTogglingUserId(null);
    }
  };

  const usersWithoutOverride = allUsers.filter(
    (u) => !overrides.some((o) => o.userId === u.id)
  );

  return (
    <Sheet open={!!flag} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-[420px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="font-mono">{flag?.name}</SheetTitle>
          <SheetDescription>{flag?.description}</SheetDescription>
        </SheetHeader>

        {flag && (
          <div className="mt-6 space-y-6">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">
                User Overrides
              </p>
              {loadingOverrides && (
                <p className="text-sm text-muted-foreground">Loading...</p>
              )}
              {!loadingOverrides && overrides.length === 0 && (
                <p className="text-sm text-muted-foreground">No overrides set.</p>
              )}
              <div className="space-y-2">
                {overrides.map((o) => (
                  <div key={o.userId} className="flex items-center justify-between gap-2 py-1.5">
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{o.userName}</p>
                      <p className="text-xs text-muted-foreground truncate">{o.userEmail}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Switch
                        checked={o.enabled}
                        disabled={togglingUserId === o.userId}
                        onCheckedChange={() => toggleUserOverride(o.userId, o.enabled)}
                      />
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-muted-foreground hover:text-destructive"
                        disabled={togglingUserId === o.userId}
                        onClick={() => removeOverride(o.userId)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {usersWithoutOverride.length > 0 && (
              <>
                <Separator />
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">
                    Add Override
                  </p>
                  <div className="space-y-1">
                    {usersWithoutOverride.map((u) => (
                      <div
                        key={u.id}
                        className="flex items-center justify-between gap-2 py-1.5 cursor-pointer hover:bg-muted/50 px-2 rounded-md"
                        onClick={() => toggleUserOverride(u.id, null)}
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{u.name}</p>
                          <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                        </div>
                        <Badge variant="outline" className="flex-shrink-0 text-xs">
                          Click to override
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
