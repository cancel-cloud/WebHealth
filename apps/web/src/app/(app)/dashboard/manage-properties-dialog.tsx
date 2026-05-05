"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { dispatchAppSidebarPropertiesRefresh } from "@/components/app-shell.logic";
import { requestJson } from "@/lib/client/api";
import { getAppErrorMessage } from "@/lib/client/app-error";
import { toast } from "sonner";
import {
  buildManagedPropertyRows,
  filterManagedPropertyRows,
  getManagedPropertyToggleTargets,
  type ManagedPropertyRow,
  type ManagedPropertySource,
} from "./manage-properties-dialog.logic";

export function ManagePropertiesDialog({
  properties,
}: {
  properties: ManagedPropertySource[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [savedItems, setSavedItems] = useState(() => buildManagedPropertyRows(properties));
  const [items, setItems] = useState(savedItems);
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState(false);
  const [isPending, startTransition] = useTransition();
  const currentActiveCount = items.filter((property) => property.active).length;
  const visibleItems = filterManagedPropertyRows(items, search);
  const changedItems = items.filter((item) => savedItems.find((saved) => saved.id === item.id)?.active !== item.active);
  const hasChanges = changedItems.length > 0;

  useEffect(() => {
    const next = buildManagedPropertyRows(properties);
    setSavedItems(next);
    setItems(next);
  }, [properties]);

  function updateProperty(property: ManagedPropertyRow, active: boolean) {
    setItems((current) =>
      current.map((item) => item.id === property.id ? { ...item, active } : item),
    );
  }

  function resetAndClose() {
    setItems(savedItems);
    setOpen(false);
  }

  async function saveChanges() {
    if (!changedItems.length) {
      setOpen(false);
      return;
    }

    setSaving(true);
    try {
      const saveOrder = [...changedItems].sort((a, b) => Number(a.active) - Number(b.active));
      for (const property of saveOrder) {
        const targetIds = getManagedPropertyToggleTargets(property);
        await requestJson(`/api/properties/${encodeURIComponent(targetIds[0])}/active`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ active: property.active, propertyIds: targetIds }),
        });
      }
      setSavedItems(items);
      toast.success(changedItems.length === 1 ? "Property setting saved" : "Property settings saved");
      setOpen(false);
      dispatchAppSidebarPropertiesRefresh();
      startTransition(() => router.refresh());
    } catch (error) {
      setItems(savedItems);
      toast.error(getAppErrorMessage(error, "Could not save property settings"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => {
      if (!nextOpen && hasChanges && !saving) {
        setItems(savedItems);
      }
      setOpen(nextOpen);
    }}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">Manage properties</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Manage properties</DialogTitle>
          <DialogDescription>
            Choose which linked website dashboards are active. Solo stays manual; paid plans can run background refreshes and AI insight work for active properties.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 rounded-lg border border-border/70 bg-muted/25 p-3 text-sm text-muted-foreground">
          <div className="flex flex-wrap gap-2">
            <span className="rounded-lg border border-border/70 bg-background px-3 py-2 font-medium text-foreground">
              {currentActiveCount} active linked {currentActiveCount === 1 ? "dashboard" : "dashboards"}
            </span>
            <span className="rounded-lg border border-border/70 bg-background/60 px-3 py-2">
              {items.length} synced {items.length === 1 ? "group" : "groups"} available
            </span>
          </div>
          <p>
            Only complete GSC + GA4 links can be activated. Plan limits are checked when changes are saved.
            Paid plans may fetch the default 28-day Google data automatically and send source evidence to OpenAI for AI insights; Solo users press Re-run when they want fresh data and AI recommendations.
          </p>
        </div>

        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search properties"
          aria-label="Search properties"
        />

        <div className="max-h-[60vh] space-y-2 overflow-y-auto pr-1">
          {visibleItems.map((property) => {
            const isUpdating = saving || isPending;
            return (
              <div
                key={property.id}
                className="flex items-start justify-between gap-4 rounded-lg border border-border/70 bg-card p-4"
              >
                <div className="min-w-0 space-y-2">
                  <div className="flex min-w-0 items-center gap-2">
                    <p className="truncate text-sm font-medium">{property.name}</p>
                    <Badge variant="outline" className="uppercase">{property.sourceLabel}</Badge>
                    {property.linked ? (
                      <Badge variant="outline" className="border-emerald-200 text-emerald-700">linked</Badge>
                    ) : (
                      <Badge variant="outline" className="border-amber-200 text-amber-700">setup</Badge>
                    )}
                  </div>
                  <p className="truncate text-xs text-muted-foreground">{property.url}</p>
                  <p className={property.linked ? "text-xs text-muted-foreground" : "text-xs text-amber-700 dark:text-amber-300"}>
                    {property.note}
                  </p>
                </div>
                <Switch
                  checked={property.active}
                  disabled={isUpdating || !property.linked}
                  onCheckedChange={(active) => updateProperty(property, active)}
                  aria-label={`Toggle ${property.name}`}
                />
              </div>
            );
          })}
          {!visibleItems.length ? (
            <div className="rounded-lg border border-border/70 p-6 text-center text-sm text-muted-foreground">
              No synced properties match your search.
            </div>
          ) : null}
        </div>
        <DialogFooter className="gap-2 sm:justify-between">
          <p className="text-xs text-muted-foreground">
            {hasChanges ? `${changedItems.length} unsaved ${changedItems.length === 1 ? "change" : "changes"}` : "No unsaved changes"}
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={resetAndClose} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={() => void saveChanges()} disabled={!hasChanges || saving || isPending}>
              {saving ? "Saving..." : "Save changes"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
