"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
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

type ManagedProperty = {
  id: string;
  name: string;
  url: string;
  type: string;
  active: boolean;
  ga4PropertyId: string | null;
};

function ga4NumericId(property: ManagedProperty) {
  return property.id.replace(/^ga4_/, "");
}

function getPropertyStatus(property: ManagedProperty, allProperties: ManagedProperty[]) {
  if (property.type === "gsc") {
    const linked = Boolean(property.ga4PropertyId && allProperties.some((item) => item.id === `ga4_${property.ga4PropertyId}`));
    return {
      linked,
      sourceLabel: "GSC",
      badgeLabel: linked ? "linked" : "setup",
      note: linked
        ? "Ready for dashboard cards, refresh jobs, and action computation."
        : "Missing GA4. Keep this hidden until Analytics is linked for complete traffic context.",
    };
  }

  const linked = allProperties.some((item) => item.type === "gsc" && item.ga4PropertyId === ga4NumericId(property));
  return {
    linked,
    sourceLabel: "GA4",
    badgeLabel: linked ? "linked" : "setup",
    note: linked
      ? "Ready through its linked Search Console property."
      : "Missing Search Console. Keep this hidden until GSC is linked for ranked actions and complete data.",
  };
}

function sortManagedProperties(properties: ManagedProperty[]) {
  return [...properties].sort((a, b) => {
    const aStatus = getPropertyStatus(a, properties);
    const bStatus = getPropertyStatus(b, properties);
    if (aStatus.linked !== bStatus.linked) return aStatus.linked ? -1 : 1;
    if (a.type !== b.type) return a.type === "gsc" ? -1 : 1;
    return a.name.localeCompare(b.name);
  });
}

export function ManagePropertiesDialog({
  properties,
}: {
  properties: ManagedProperty[];
}) {
  const router = useRouter();
  const [items, setItems] = useState(() => sortManagedProperties(properties));
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const currentActiveCount = items.filter((property) => property.active).length;

  async function updateProperty(property: ManagedProperty, active: boolean) {
    setPendingId(property.id);
    const previous = items;
    setItems((current) =>
      current.map((item) => item.id === property.id ? { ...item, active } : item),
    );

    try {
      await requestJson(`/api/properties/${encodeURIComponent(property.id)}/active`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active }),
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

        <div className="max-h-[60vh] space-y-2 overflow-y-auto pr-1">
          {items.map((property) => {
            const isUpdating = pendingId === property.id || isPending;
            const status = getPropertyStatus(property, items);
            return (
              <div
                key={property.id}
                className="flex items-start justify-between gap-4 rounded-lg border border-border/70 bg-card p-4"
              >
                <div className="min-w-0 space-y-2">
                  <div className="flex min-w-0 items-center gap-2">
                    <p className="truncate text-sm font-medium">{property.name}</p>
                    <Badge variant="outline" className="uppercase">{status.sourceLabel}</Badge>
                    {status.linked ? (
                      <Badge variant="outline" className="border-emerald-200 text-emerald-700">linked</Badge>
                    ) : (
                      <Badge variant="outline" className="border-amber-200 text-amber-700">setup</Badge>
                    )}
                  </div>
                  <p className="truncate text-xs text-muted-foreground">{property.url}</p>
                  <p className={status.linked ? "text-xs text-muted-foreground" : "text-xs text-amber-700 dark:text-amber-300"}>
                    {status.note}
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
        </div>
      </DialogContent>
    </Dialog>
  );
}
