"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { FlagDetailSheet } from "./flag-detail-sheet";
import { getAppErrorMessage } from "@/lib/client/app-error";
import { requestJson } from "@/lib/client/api";

interface FeatureFlag {
  id: string;
  name: string;
  description: string | null;
  enabledGlobally: boolean;
  overrideCount: number;
}

interface AdminUser {
  id: string;
  name: string;
  email: string;
}

export function FlagsTable({
  flags: initialFlags,
  allUsers,
}: {
  flags: FeatureFlag[];
  allUsers: AdminUser[];
}) {
  const [flags, setFlags] = useState(initialFlags);
  const [selectedFlag, setSelectedFlag] = useState<FeatureFlag | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const toggleGlobal = async (flag: FeatureFlag) => {
    setTogglingId(flag.id);
    try {
      const data = await requestJson<{ flag: { enabledGlobally: boolean } }>(
        `/api/admin/feature-flags/${flag.id}`,
        {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabledGlobally: !flag.enabledGlobally }),
        },
      );
      setFlags((prev) =>
        prev.map((f) => (f.id === flag.id ? { ...f, enabledGlobally: Boolean(data?.flag.enabledGlobally) } : f))
      );
      toast.success(`${flag.name} ${data?.flag.enabledGlobally ? "enabled" : "disabled"} globally`);
    } catch (err: unknown) {
      toast.error(getAppErrorMessage(err, "Failed to update flag"));
    } finally {
      setTogglingId(null);
    }
  };

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Flag Name</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Global</TableHead>
            <TableHead className="text-right">User Overrides</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {flags.map((flag) => (
            <TableRow
              key={flag.id}
              className="cursor-pointer hover:bg-muted/50"
              onClick={() => setSelectedFlag(flag)}
            >
              <TableCell className="font-mono text-sm font-medium">{flag.name}</TableCell>
              <TableCell className="text-muted-foreground text-sm">
                {flag.description ?? "—"}
              </TableCell>
              <TableCell onClick={(e) => e.stopPropagation()}>
                <Switch
                  checked={flag.enabledGlobally}
                  disabled={togglingId === flag.id}
                  onCheckedChange={() => toggleGlobal(flag)}
                />
              </TableCell>
              <TableCell className="text-right">
                <Badge variant="secondary">{flag.overrideCount}</Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <FlagDetailSheet
        flag={selectedFlag}
        allUsers={allUsers}
        onClose={() => setSelectedFlag(null)}
      />
    </>
  );
}
