"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { dispatchAppSidebarPropertiesRefresh } from "@/components/app-shell.logic";
import { useGoogleAccessRecovery } from "@/components/google-access-recovery";
import { getGoogleAccessDialogModel, getGoogleAccessIssueFromCode } from "@/components/google-access-recovery.logic";
import { getAppErrorMessage } from "@/lib/client/app-error";
import { requestJson } from "@/lib/client/api";
import {
  buildManagedPropertyRows,
  getManagedPropertyToggleTargets,
} from "./manage-properties-dialog.logic";
import {
  buildOnboardingLinkRows,
  getGa4PropertyOptions,
  type LinkableGoogleProperty,
} from "./property-linking.logic";
import type { PropertiesSyncResult } from "./sync-button";

type OnboardingStep = "sync" | "link" | "activate" | "guide";
type SyncState = "idle" | "syncing" | "success" | "error";

type OnboardingProperty = LinkableGoogleProperty & {
  active: boolean;
};

export function OnboardingModal({
  initialProperties,
  shouldShow,
}: {
  initialProperties: OnboardingProperty[];
  shouldShow: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(shouldShow);
  const [step, setStep] = useState<OnboardingStep>("sync");
  const [syncState, setSyncState] = useState<SyncState>("idle");
  const [syncResult, setSyncResult] = useState<PropertiesSyncResult | null>(null);
  const [properties, setProperties] = useState<OnboardingProperty[]>(initialProperties);
  const [linkSelections, setLinkSelections] = useState<Record<string, string>>({});
  const [activationRowId, setActivationRowId] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);
  const [isSavingLinks, setIsSavingLinks] = useState(false);
  const [isActivating, setIsActivating] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const { issue, hasBlockingIssue, openDialog, refreshHealth } = useGoogleAccessRecovery();

  const ga4Options = useMemo(() => getGa4PropertyOptions(properties), [properties]);
  const linkRows = useMemo(() => buildOnboardingLinkRows(properties), [properties]);
  const managedRows = useMemo(() => buildManagedPropertyRows(properties), [properties]);
  const activatableRows = managedRows.filter((row) => row.linked);
  const selectedActivationRow = activatableRows.find((row) => row.id === activationRowId) ?? activatableRows[0] ?? null;
  const propertyTotal = properties.length;
  const discoveredTotal = (syncResult?.discoveredGscCount ?? 0) + (syncResult?.discoveredGa4Count ?? 0);
  const foundTotal = discoveredTotal || propertyTotal;

  useEffect(() => {
    setOpen(shouldShow);
  }, [shouldShow]);

  useEffect(() => {
    if (!open || syncState !== "idle" || hasBlockingIssue) return;

    setSyncState("syncing");
    setActionError(null);
    requestJson<PropertiesSyncResult>("/api/properties/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode: "onboarding" }),
    })
      .then(async (data) => {
        setSyncResult(data);
        await loadProperties();
        setSyncState("success");
      })
      .catch(async (error) => {
        if (error instanceof Error && "code" in error && getGoogleAccessIssueFromCode((error as { code?: string | null }).code)) {
          await refreshHealth();
        }
        setActionError(getAppErrorMessage(error, "Could not sync Google properties."));
        setSyncState("error");
      });
  }, [hasBlockingIssue, open, refreshHealth, syncState]);

  useEffect(() => {
    const nextSelections = Object.fromEntries(
      linkRows.map((row) => [row.gscId, row.selectedGa4PropertyId]),
    );
    setLinkSelections(nextSelections);
  }, [linkRows]);

  useEffect(() => {
    if (activationRowId || activatableRows.length === 0) return;
    setActivationRowId(activatableRows[0].id);
  }, [activatableRows, activationRowId]);

  async function loadProperties() {
    const data = await requestJson<{ properties?: OnboardingProperty[] }>("/api/properties");
    setProperties(data?.properties ?? []);
  }

  async function completeOnboarding(reason: "finished" | "skipped") {
    setIsCompleting(true);
    setActionError(null);
    try {
      await requestJson("/api/onboarding", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      });
      setOpen(false);
      startTransition(() => router.refresh());
    } catch (error) {
      setActionError(getAppErrorMessage(error, "Could not complete onboarding."));
    } finally {
      setIsCompleting(false);
    }
  }

  async function saveLinks() {
    setIsSavingLinks(true);
    setActionError(null);
    try {
      for (const row of linkRows) {
        const selectedGa4 = linkSelections[row.gscId];
        if (!selectedGa4 || selectedGa4 === row.linkedGa4PropertyId) continue;
        await requestJson(`/api/properties/${encodeURIComponent(row.gscId)}/link-ga4`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ga4PropertyId: selectedGa4 }),
        });
      }
      await loadProperties();
      dispatchAppSidebarPropertiesRefresh();
      setStep("activate");
    } catch (error) {
      setActionError(getAppErrorMessage(error, "Could not save property links."));
    } finally {
      setIsSavingLinks(false);
    }
  }

  async function activateSelectedDashboard() {
    if (!selectedActivationRow) {
      setStep("guide");
      return;
    }

    const targetIds = getManagedPropertyToggleTargets(selectedActivationRow);
    setIsActivating(true);
    setActionError(null);
    try {
      await requestJson(`/api/properties/${encodeURIComponent(targetIds[0])}/active`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: true, propertyIds: targetIds }),
      });
      await loadProperties();
      dispatchAppSidebarPropertiesRefresh();
      setStep("guide");
    } catch (error) {
      setActionError(getAppErrorMessage(error, "Could not activate this dashboard."));
    } finally {
      setIsActivating(false);
    }
  }

  const recoveryModel = issue ? getGoogleAccessDialogModel(issue) : null;

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent
        className="max-w-2xl"
        onPointerDownOutside={(event) => event.preventDefault()}
        onEscapeKeyDown={(event) => event.preventDefault()}
      >
        <DialogHeader>
          <div className="flex items-center justify-between gap-3">
            <div>
              <DialogTitle className="font-display text-xl font-bold">Set up WebHealth</DialogTitle>
              <DialogDescription className="mt-1">
                Sync properties, connect GSC with GA4, and activate your first dashboard.
              </DialogDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => void completeOnboarding("skipped")}
              disabled={isCompleting}
            >
              Skip
            </Button>
          </div>
        </DialogHeader>

        <div className="flex flex-wrap gap-2 text-xs">
          {[
            ["sync", "1. Sync"],
            ["link", "2. Link"],
            ["activate", "3. Activate"],
            ["guide", "4. Find things"],
          ].map(([value, label]) => (
            <Badge key={value} variant={step === value ? "default" : "outline"}>
              {label}
            </Badge>
          ))}
        </div>

        {actionError ? (
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
            {actionError}
          </div>
        ) : null}

        {hasBlockingIssue ? (
          <div className="space-y-3 rounded-lg border border-amber-200 bg-amber-50/70 p-4 text-sm text-amber-950">
            <p className="font-medium">{recoveryModel?.title ?? "Google access needs attention"}</p>
            <p>{recoveryModel?.description ?? "Reconnect Google before syncing properties."}</p>
            <Button onClick={openDialog}>Reconnect Google</Button>
          </div>
        ) : null}

        {step === "sync" ? (
          <div className="space-y-5">
            <div className="rounded-lg border border-border/70 bg-muted/25 p-4">
              <div className="flex items-center gap-3">
                {syncState === "syncing" ? (
                  <span className="h-4 w-4 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                ) : null}
                <div>
                  <p className="font-medium">
                    {syncState === "success"
                      ? `${foundTotal} ${foundTotal === 1 ? "property" : "properties"} found`
                      : syncState === "error"
                        ? "Property sync needs attention"
                        : "Properties are syncing"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {syncState === "success"
                      ? `${syncResult?.discoveredGscCount ?? 0} GSC and ${syncResult?.discoveredGa4Count ?? 0} GA4 properties were returned by Google.`
                      : "We are only syncing the list of available Search Console and Analytics properties right now."}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                onClick={() => setStep(propertyTotal > 0 ? "link" : "guide")}
                disabled={syncState === "syncing" || syncState === "idle" || hasBlockingIssue}
              >
                {propertyTotal > 0 ? "Continue to linking" : "Continue"}
              </Button>
            </div>
          </div>
        ) : null}

        {step === "link" ? (
          <div className="space-y-4">
            <div className="rounded-lg border border-border/70 bg-muted/25 p-3 text-sm text-muted-foreground">
              Confirm which Analytics property belongs with each Search Console property. Suggestions are preselected but are not saved until you continue.
            </div>
            {linkRows.length && ga4Options.length ? (
              <div className="max-h-[42vh] space-y-2 overflow-y-auto pr-1">
                {linkRows.map((row) => (
                  <div key={row.gscId} className="grid gap-3 rounded-lg border border-border/70 p-3 sm:grid-cols-[1fr_240px] sm:items-center">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{row.gscName}</p>
                      <p className="truncate text-xs text-muted-foreground">{row.gscUrl}</p>
                    </div>
                    <Select
                      value={linkSelections[row.gscId] ?? ""}
                      onValueChange={(value) => setLinkSelections((current) => ({ ...current, [row.gscId]: value }))}
                    >
                      <SelectTrigger aria-label={`Select GA4 property for ${row.gscName}`}>
                        <SelectValue placeholder="Select GA4" />
                      </SelectTrigger>
                      <SelectContent>
                        {ga4Options.map((option) => (
                          <SelectItem key={option.id} value={option.numericId}>
                            {option.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-lg border border-border/70 p-6 text-sm text-muted-foreground">
                {propertyTotal === 0
                  ? "No Google properties were found for this account yet."
                  : "Linking needs at least one Search Console property and one GA4 property. You can sync again later from Properties."}
              </div>
            )}
            <div className="flex justify-between gap-2">
              <Button variant="outline" onClick={() => setStep("sync")}>Back</Button>
              {linkRows.length && ga4Options.length ? (
                <Button onClick={() => void saveLinks()} disabled={isSavingLinks}>
                  {isSavingLinks ? "Saving..." : "Save links"}
                </Button>
              ) : (
                <Button onClick={() => setStep("guide")}>Continue</Button>
              )}
            </div>
          </div>
        ) : null}

        {step === "activate" ? (
          <div className="space-y-4">
            <div className="rounded-lg border border-border/70 bg-muted/25 p-3 text-sm text-muted-foreground">
              Activate one linked dashboard now. Plan limits are checked by the same activation rules used everywhere else.
            </div>
            {activatableRows.length ? (
              <Select value={selectedActivationRow?.id ?? ""} onValueChange={setActivationRowId}>
                <SelectTrigger aria-label="Select dashboard to activate">
                  <SelectValue placeholder="Select a linked dashboard" />
                </SelectTrigger>
                <SelectContent>
                  {activatableRows.map((row) => (
                    <SelectItem key={row.id} value={row.id}>
                      {row.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <div className="rounded-lg border border-border/70 p-6 text-sm text-muted-foreground">
                No complete GSC + GA4 link is ready to activate yet.
              </div>
            )}
            <div className="flex justify-between gap-2">
              <Button variant="outline" onClick={() => setStep("link")}>Back</Button>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep("guide")}>Continue without activating</Button>
                <Button onClick={() => void activateSelectedDashboard()} disabled={isActivating || !selectedActivationRow}>
                  {isActivating ? "Activating..." : "Activate dashboard"}
                </Button>
              </div>
            </div>
          </div>
        ) : null}

        {step === "guide" ? (
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                ["Dashboard", "Open active website dashboards and workspace-level next actions."],
                ["Properties", "Sync Google sources, link GSC with GA4, and activate dashboards."],
                ["Sidebar", "Find active dashboards, settings, theme, account, usage, and support."],
                ["Manage properties", "Use the dashboard control when you want to change active dashboards."],
              ].map(([title, description]) => (
                <div key={title} className="rounded-lg border border-border/70 p-3">
                  <p className="text-sm font-medium">{title}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{description}</p>
                </div>
              ))}
            </div>
            <div className="flex justify-between gap-2">
              <Button variant="outline" onClick={() => setStep(activatableRows.length ? "activate" : "link")}>Back</Button>
              <Button onClick={() => void completeOnboarding("finished")} disabled={isCompleting || isPending}>
                {isCompleting ? "Finishing..." : "Finish setup"}
              </Button>
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
