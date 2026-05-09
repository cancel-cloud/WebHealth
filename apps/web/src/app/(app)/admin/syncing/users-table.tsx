"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { SyncSheet } from "./sync-sheet";
import { RefreshCw } from "lucide-react";

interface AdminUser {
  id: string;
  name: string;
  email: string;
  image: string | null;
  propertiesCount: number;
  lastSyncedAt: string | null;
}

export function SyncUsersTable({ users }: { users: AdminUser[] }) {
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead className="text-right">Properties</TableHead>
            <TableHead>Last Synced</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((u) => (
            <TableRow key={u.id}>
              <TableCell className="font-medium">{u.name}</TableCell>
              <TableCell className="text-muted-foreground">{u.email}</TableCell>
              <TableCell className="text-right">{u.propertiesCount}</TableCell>
              <TableCell className="text-muted-foreground text-sm">
                {u.lastSyncedAt
                  ? new Date(u.lastSyncedAt).toLocaleDateString()
                  : "Never"}
              </TableCell>
              <TableCell>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setSelectedUser(u)}
                >
                  <RefreshCw className="size-3 mr-1" />
                  Sync
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <SyncSheet user={selectedUser} onClose={() => setSelectedUser(null)} />
    </>
  );
}
