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
import { Badge } from "@/components/ui/badge";
import { UserDetailSheet } from "./user-detail-sheet";

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

export function UsersTable({ users }: { users: AdminUser[] }) {
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Plan</TableHead>
            <TableHead className="text-right">Properties</TableHead>
            <TableHead className="text-right">Reports</TableHead>
            <TableHead>Joined</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((u) => (
            <TableRow
              key={u.id}
              className="cursor-pointer hover:bg-muted/50"
              onClick={() => setSelectedUser(u)}
            >
              <TableCell className="font-medium">{u.name}</TableCell>
              <TableCell className="text-muted-foreground">{u.email}</TableCell>
              <TableCell>
                <Badge variant="outline">{u.tier ?? "free"}</Badge>
              </TableCell>
              <TableCell className="text-right">{u.propertiesCount}</TableCell>
              <TableCell className="text-right">{u.reportsCount}</TableCell>
              <TableCell className="text-muted-foreground text-sm">
                {new Date(u.createdAt).toLocaleDateString()}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <UserDetailSheet user={selectedUser} onClose={() => setSelectedUser(null)} />
    </>
  );
}
