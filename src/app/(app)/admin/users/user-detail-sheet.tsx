"use client";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";

interface AdminUser {
  id: string;
  name: string;
  email: string;
  image: string | null;
  createdAt: string;
  teamId: string | null;
  teamName: string | null;
  tier: string | null;
  propertiesCount: number;
  reportsCount: number;
  lastSyncedAt: string | null;
}

interface UserDetailSheetProps {
  user: AdminUser | null;
  onClose: () => void;
}

export function UserDetailSheet({ user, onClose }: UserDetailSheetProps) {
  return (
    <Sheet open={!!user} onOpenChange={(open) => !open && onClose()}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>{user?.name}</SheetTitle>
          <SheetDescription>{user?.email}</SheetDescription>
        </SheetHeader>
        {user && (
          <div className="mt-6 space-y-4 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Plan</span>
              <Badge variant="outline">{user.tier ?? "free"}</Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Team</span>
              <span className="font-medium">{user.teamName ?? "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Properties</span>
              <span className="font-medium">{user.propertiesCount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Reports</span>
              <span className="font-medium">{user.reportsCount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Last Synced</span>
              <span className="font-medium">
                {user.lastSyncedAt
                  ? new Date(user.lastSyncedAt).toLocaleDateString()
                  : "Never"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Joined</span>
              <span className="font-medium">
                {new Date(user.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
