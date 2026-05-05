"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  hasWelcomedFromStorage,
  ONBOARDING_WELCOMED_STORAGE_KEY,
  shouldOpenOnboardingModal,
} from "./onboarding-modal.logic";
import { requestJson } from "@/lib/client/api";
import type { PropertiesSyncResult } from "./sync-button";
import { useGoogleAccessRecovery } from "@/components/google-access-recovery";
import { getGoogleAccessDialogModel, getGoogleAccessIssueFromCode } from "@/components/google-access-recovery.logic";

type SyncState = "syncing" | "success" | "error";

export function OnboardingModal({ hasProperties }: { hasProperties: boolean }) {
  const router = useRouter();
  const [hasWelcomed, setHasWelcomed] = useState(() =>
    hasWelcomedFromStorage(
      typeof window === "undefined"
        ? null
        : window.localStorage.getItem(ONBOARDING_WELCOMED_STORAGE_KEY),
    ),
  );
  const [dismissed, setDismissed] = useState(false);
  const [syncAttemptState, setSyncAttemptState] = useState<SyncState>("syncing");
  const [propertyCount, setPropertyCount] = useState<number>(0);
  const { issue, hasBlockingIssue, openDialog, refreshHealth } = useGoogleAccessRecovery();
  const open = shouldOpenOnboardingModal({
    hasProperties,
    hasWelcomed,
    dismissed,
  });

  useEffect(() => {
    if (!open) return;
    if (hasBlockingIssue) return;
    requestJson<PropertiesSyncResult>("/api/properties/sync", { method: "POST" })
      .then((data) => {
        setPropertyCount((data?.discoveredGscCount ?? data?.gscCount ?? 0) + (data?.discoveredGa4Count ?? data?.ga4Count ?? 0));
        setSyncAttemptState("success");
      })
      .catch(async (error) => {
        if (error instanceof Error && "code" in error && getGoogleAccessIssueFromCode((error as { code?: string | null }).code)) {
          await refreshHealth();
        }
        setSyncAttemptState("error");
      });
  }, [hasBlockingIssue, open, refreshHealth]);

  if (hasProperties) return null;

  const recoveryModel = issue ? getGoogleAccessDialogModel(issue) : null;
  const syncState: SyncState = hasBlockingIssue ? "error" : syncAttemptState;

  function handleContinue() {
    localStorage.setItem(ONBOARDING_WELCOMED_STORAGE_KEY, "1");
    setHasWelcomed(true);
    setDismissed(true);
    router.push("/properties");
  }

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent
        className="max-w-md"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="text-xl font-bold font-display">
            Welcome to Webhealth
          </DialogTitle>
          <p className="text-sm text-muted-foreground mt-1">
            GSC + GA4 data. Ranked fixes in 3 minutes.
          </p>
        </DialogHeader>

        <div className="space-y-6 pt-2">
          <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/30 px-4 py-3">
            {syncState === "syncing" && (
              <>
                <span className="h-4 w-4 rounded-full border-2 border-primary border-t-transparent animate-spin flex-shrink-0" />
                <span className="text-sm">Syncing your Google properties…</span>
              </>
            )}
            {syncState === "success" && (
              <>
                <span className="text-primary text-lg flex-shrink-0">✓</span>
                <span className="text-sm">
                  {propertyCount > 0
                    ? `${propertyCount} ${propertyCount === 1 ? "property" : "properties"} synced`
                    : "No Google Search Console or Analytics properties are associated with this Google account yet."}
                </span>
              </>
            )}
            {syncState === "error" && (
              <>
                <span className="text-destructive text-lg flex-shrink-0">
                  !
                </span>
                <span className="text-sm text-destructive">
                  {recoveryModel?.description ?? "Sync failed — reconnect Google to continue."}
                </span>
              </>
            )}
          </div>

          {syncState !== "syncing" && (
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Getting started
              </p>
              <ol className="space-y-3">
                {[
                  {
                    n: "①",
                    title: "Properties",
                    desc: "Link your GSC and GA4 properties together",
                  },
                  {
                    n: "②",
                    title: "Snapshots",
                    desc: "Open a property dashboard and export a snapshot",
                  },
                  {
                    n: "③",
                    title: "Sidebar",
                    desc: "Bottom-left: Settings, Theme, and your usage",
                  },
                ].map(({ n, title, desc }) => (
                  <li key={title} className="flex items-start gap-3 text-sm">
                    <span className="text-primary font-bold flex-shrink-0">
                      {n}
                    </span>
                    <span>
                      <span className="font-medium">{title}</span>
                      {" — "}
                      <span className="text-muted-foreground">{desc}</span>
                    </span>
                  </li>
                ))}
              </ol>
            </div>
          )}

          <Button
            className="w-full"
            disabled={syncState === "syncing" || hasBlockingIssue}
            onClick={handleContinue}
          >
            Go to Properties →
          </Button>

          {hasBlockingIssue ? (
            <Button variant="outline" className="w-full" onClick={openDialog}>
              Reconnect Google
            </Button>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
