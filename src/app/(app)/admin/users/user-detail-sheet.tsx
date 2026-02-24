"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { AdminUser } from "./users-table";

interface UserDetailSheetProps {
  user: AdminUser | null;
  onClose: () => void;
}

function fmtDate(d: string | null | undefined) {
  if (!d) return "Never";
  return new Date(d).toLocaleString();
}

function fmtLimit(n: number | null | undefined) {
  return n == null ? "Unlimited" : String(n);
}

export function UserDetailSheet({ user, onClose }: UserDetailSheetProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Tier
  const [tier, setTier] = useState(user?.tier ?? "free");

  // Restriction
  const [isRestricted, setIsRestricted] = useState(user?.isRestricted ?? false);
  const [restrictionMessage, setRestrictionMessage] = useState(
    user?.restrictionMessage ?? "",
  );

  // Keep local state in sync when the selected user changes
  const userId = user?.id;
  const [lastUserId, setLastUserId] = useState<string | undefined>(userId);
  if (userId !== lastUserId) {
    setLastUserId(userId);
    setTier(user?.tier ?? "free");
    setIsRestricted(user?.isRestricted ?? false);
    setRestrictionMessage(user?.restrictionMessage ?? "");
  }

  async function patch(body: Record<string, unknown>) {
    if (!user) return;
    setSaving(true);
    try {
      await fetch(`/api/admin/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!user) return;
    setDeleting(true);
    try {
      await fetch(`/api/admin/users/${user.id}`, { method: "DELETE" });
      router.refresh();
      onClose();
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  }

  return (
    <>
      <Sheet open={!!user} onOpenChange={(open) => !open && onClose()}>
        <SheetContent className="overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{user?.name}</SheetTitle>
            <SheetDescription>{user?.email}</SheetDescription>
          </SheetHeader>

          {user && (
            <div className="mt-6 space-y-6 text-sm">
              {/* ── Stats ── */}
              <div className="space-y-3">
                <h3 className="font-semibold text-xs uppercase tracking-wide text-muted-foreground">
                  Stats
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Joined</span>
                    <span className="font-medium">{fmtDate(user.createdAt)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Last Sign In</span>
                    <span className="font-medium">{fmtDate(user.lastSignedInAt)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Reports (last 30d)</span>
                    <span className="font-medium">{user.reportsLast30Days}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Reports (total)</span>
                    <span className="font-medium">{user.reportsCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Properties</span>
                    <span className="font-medium">{user.propertiesCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Last Synced</span>
                    <span className="font-medium">{fmtDate(user.lastSyncedAt)}</span>
                  </div>
                </div>
              </div>

              <Separator />

              {/* ── Plan Limits ── */}
              <div className="space-y-3">
                <h3 className="font-semibold text-xs uppercase tracking-wide text-muted-foreground">
                  Plan Limits
                </h3>
                <div className="rounded-md border p-3 space-y-2 bg-muted/30">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Current tier</span>
                    <Badge variant="outline">{user.tier ?? "free"}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Reports / month</span>
                    <span className="font-medium">
                      {fmtLimit(user.planLimits?.reportsPerMonth)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Max properties</span>
                    <span className="font-medium">
                      {fmtLimit(user.planLimits?.maxProperties)}
                    </span>
                  </div>
                </div>
              </div>

              <Separator />

              {/* ── Change Tier ── */}
              <div className="space-y-3">
                <h3 className="font-semibold text-xs uppercase tracking-wide text-muted-foreground">
                  Change Tier
                </h3>
                <div className="flex gap-2">
                  <Select value={tier} onValueChange={setTier}>
                    <SelectTrigger className="flex-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="free">Free</SelectItem>
                      <SelectItem value="pro">Pro</SelectItem>
                      <SelectItem value="team">Team</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    size="sm"
                    onClick={() => patch({ tier })}
                    disabled={saving || tier === user.tier}
                  >
                    Save
                  </Button>
                </div>
              </div>

              <Separator />

              {/* ── Restrict User ── */}
              <div className="space-y-3">
                <h3 className="font-semibold text-xs uppercase tracking-wide text-muted-foreground">
                  Restrict Access
                </h3>
                <div className="flex items-center gap-3">
                  <Switch
                    id="restrict-toggle"
                    checked={isRestricted}
                    onCheckedChange={setIsRestricted}
                  />
                  <Label htmlFor="restrict-toggle">
                    {isRestricted ? "Restricted" : "Not restricted"}
                  </Label>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="restriction-msg" className="text-muted-foreground">
                    Message shown to user
                  </Label>
                  <Input
                    id="restriction-msg"
                    placeholder="Some features have been limited…"
                    value={restrictionMessage}
                    onChange={(e) => setRestrictionMessage(e.target.value)}
                    disabled={!isRestricted}
                  />
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => patch({ isRestricted, restrictionMessage })}
                  disabled={
                    saving ||
                    (isRestricted === user.isRestricted &&
                      restrictionMessage === (user.restrictionMessage ?? ""))
                  }
                >
                  Save
                </Button>
              </div>

              <Separator />

              {/* ── Danger Zone ── */}
              <div className="space-y-3">
                <h3 className="font-semibold text-xs uppercase tracking-wide text-destructive">
                  Danger Zone
                </h3>
                <Button
                  variant="destructive"
                  size="sm"
                  className="w-full"
                  onClick={() => setShowDeleteConfirm(true)}
                  disabled={deleting}
                >
                  {deleting ? "Deleting…" : "Delete User"}
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {user?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the user, their team, all properties, and all reports.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
