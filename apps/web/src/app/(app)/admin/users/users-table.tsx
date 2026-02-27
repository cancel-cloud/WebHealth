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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UserDetailSheet } from "./user-detail-sheet";

export interface PlanLimits {
  id: string;
  tier: string;
  displayName: string;
  reportsPerMonth: number | null;
  maxProperties: number | null;
  updatedAt: string;
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  image: string | null;
  createdAt: string;
  isRestricted: boolean;
  restrictionMessage: string | null;
  teamId: string | null;
  teamName: string | null;
  tier: string | null;
  propertiesCount: number;
  reportsCount: number;
  reportsLast30Days: number;
  lastSyncedAt: string | null;
  lastSignedInAt: string | null;
  planLimits: PlanLimits | null;
}

export function UsersTable({ users }: { users: AdminUser[] }) {
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [search, setSearch] = useState("");

  const filtered = users.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <>
      <div className="mb-4">
        <Input
          placeholder="Search by name or email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Plan</TableHead>
            <TableHead className="text-right">Properties</TableHead>
            <TableHead className="text-right">Reports</TableHead>
            <TableHead>Last Sign In</TableHead>
            <TableHead>Joined</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filtered.map((u) => (
            <TableRow
              key={u.id}
              className="cursor-pointer hover:bg-muted/50"
              onClick={() => setSelectedUser(u)}
            >
              <TableCell className="font-medium">
                {u.name}
                {u.isRestricted && (
                  <Badge variant="destructive" className="ml-2 text-xs">
                    Restricted
                  </Badge>
                )}
              </TableCell>
              <TableCell className="text-muted-foreground">{u.email}</TableCell>
              <TableCell>
                <Badge variant="outline">{u.tier ?? "free"}</Badge>
              </TableCell>
              <TableCell className="text-right">{u.propertiesCount}</TableCell>
              <TableCell className="text-right">{u.reportsCount}</TableCell>
              <TableCell className="text-muted-foreground text-sm">
                {u.lastSignedInAt
                  ? new Date(u.lastSignedInAt).toLocaleDateString()
                  : "Never"}
              </TableCell>
              <TableCell className="text-muted-foreground text-sm">
                {new Date(u.createdAt).toLocaleDateString()}
              </TableCell>
              <TableCell className="text-right">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedUser(u);
                  }}
                >
                  Edit
                </Button>
              </TableCell>
            </TableRow>
          ))}
          {filtered.length === 0 && (
            <TableRow>
              <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                No users found
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      <UserDetailSheet user={selectedUser} onClose={() => setSelectedUser(null)} />
    </>
  );
}
