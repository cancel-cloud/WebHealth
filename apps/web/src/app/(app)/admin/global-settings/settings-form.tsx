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
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { getAppErrorMessage } from "@/lib/client/app-error";
import { requestJson } from "@/lib/client/api";

interface TierSetting {
  id: string;
  tier: string;
  displayName: string;
  maxProperties: number | null;
  updatedAt: string;
}

function limitToString(n: number | null): string {
  return n == null ? "" : String(n);
}

function stringToLimit(s: string): number | null {
  const trimmed = s.trim();
  if (trimmed === "" || trimmed.toLowerCase() === "unlimited") return null;
  const n = parseInt(trimmed, 10);
  return isNaN(n) ? null : n;
}

export function SettingsForm({ initialSettings }: { initialSettings: TierSetting[] }) {
  const [settings, setSettings] = useState(() =>
    initialSettings.map((s) => ({
      ...s,
      propertiesInput: limitToString(s.maxProperties),
      saving: false,
      saved: false,
    })),
  );

  const updateField = (
    tier: string,
    field: "propertiesInput",
    value: string,
  ) => {
    setSettings((prev) =>
      prev.map((s) => (s.tier === tier ? { ...s, [field]: value, saved: false } : s)),
    );
  };

  const save = async (tier: string) => {
    const row = settings.find((s) => s.tier === tier);
    if (!row) return;

    setSettings((prev) =>
      prev.map((s) => (s.tier === tier ? { ...s, saving: true } : s)),
    );

    const body = {
      tier,
      maxProperties: stringToLimit(row.propertiesInput),
    };

    try {
      await requestJson("/api/admin/global-settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      setSettings((prev) =>
        prev.map((s) =>
          s.tier === tier ? { ...s, saving: false, saved: true } : s,
        ),
      );
    } catch (error) {
      setSettings((prev) =>
        prev.map((s) =>
          s.tier === tier ? { ...s, saving: false, saved: false } : s,
        ),
      );
      toast.error(getAppErrorMessage(error, "Failed to save settings"));
    }
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Tier</TableHead>
          <TableHead>Max Properties</TableHead>
          <TableHead className="w-24" />
        </TableRow>
      </TableHeader>
      <TableBody>
        {settings.map((row) => (
          <TableRow key={row.tier}>
            <TableCell>
              <Badge variant="outline">{row.displayName}</Badge>
            </TableCell>
            <TableCell>
              <Input
                value={row.propertiesInput}
                onChange={(e) =>
                  updateField(row.tier, "propertiesInput", e.target.value)
                }
                placeholder="Unlimited"
                className="w-32"
              />
            </TableCell>
            <TableCell>
              <Button
                size="sm"
                onClick={() => save(row.tier)}
                disabled={row.saving}
                variant={row.saved ? "outline" : "default"}
              >
                {row.saving ? "Saving…" : row.saved ? "Saved ✓" : "Save"}
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
