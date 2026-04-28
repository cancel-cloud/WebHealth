"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
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
  const [items, setItems] = useState(() => buildManagedPropertyRows(properties));
  const [search, setSearch] = useState("");
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const currentActiveCount = items.filter((property) => property.active).length;
  const visibleItems = filterManagedPropertyRows(items, search);

  async function updateProperty(property: ManagedPropertyRow, active: boolean) {
    const targetIds = getManagedPropertyToggleTargets(property);
    setPendingId(property.id);
    const previous = items;
    setItems((current) =>
      current.map((item) => item.id === property.id ? { ...item, active } : item),
    );

    try {
      await requestJson(`/api/properties/${encodeURIComponent(targetIds[0])}/active`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active, propertyIds: targetIds }),
      });
      toast.success(active ? "Property activated" : "Property hidden from dashboard");
      startTransition(() => router.refresh());
    } catch (error) {
      setItems(previous);
      toast.error(getAppErrorMessage(error, "Could not update property"));
    } finally {
      setPendingId(null);
    }
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">Manage properties</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Manage properties</DialogTitle>
          <DialogDescription>
            Choose which synced sources are active for dashboard cards, refresh jobs, and action computation.
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-lg border border-border/70 bg-muted/25 p-3 text-sm text-muted-foreground">
          {currentActiveCount} active of {items.length} synced properties. Linked GSC + GA4 sources are listed first. Sources missing one connector should usually stay inactive.
        </div>

        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search properties"
          aria-label="Search properties"
        />

        <div className="max-h-[60vh] space-y-2 overflow-y-auto pr-1">
          {visibleItems.map((property) => {
            const isUpdating = pendingId === property.id || isPending;
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
                  disabled={isUpdating}
                  onCheckedChange={(active) => void updateProperty(property, active)}
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
      </DialogContent>
    </Dialog>
  );
}
