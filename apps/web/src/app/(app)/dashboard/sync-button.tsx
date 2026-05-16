"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { getAppErrorMessage, isAppError } from "@/lib/client/app-error";
import { requestJson } from "@/lib/client/api";
import { dispatchAppSidebarPropertiesRefresh } from "@/components/app-shell.logic";
import { useGoogleAccessRecovery } from "@/components/google-access-recovery";
import { getGoogleAccessIssueFromCode } from "@/components/google-access-recovery.logic";
import { useAppLanguage } from "@/lib/app-language";
import type { SupportedLanguage } from "@webhealth/shared/lib/language";

export type PropertiesSyncResult = {
  gscCount: number;
  ga4Count: number;
  discoveredGscCount?: number;
  discoveredGa4Count?: number;
  autoLinked: number;
};

type SyncButtonProps = {
  onSynced?: () => void | Promise<void>;
  externalIsSyncing?: boolean;
  refreshStrategy?: "router" | "callback" | "both";
};

export async function runPropertiesSync(): Promise<PropertiesSyncResult> {
  const data = await requestJson<PropertiesSyncResult>("/api/properties/sync", {
    method: "POST",
  });
  return data ?? { gscCount: 0, ga4Count: 0, discoveredGscCount: 0, discoveredGa4Count: 0, autoLinked: 0 };
}

const SYNC_COPY = {
  en: {
    noProperties: "No Google Search Console or Analytics properties are associated with this Google account yet.",
    googleReturned: (summary: string, autoLinked: number) =>
      `Google returned ${summary}. Everything was already synced${autoLinked > 0 ? ` • ${autoLinked} auto-linked` : ""}.`,
    syncedNew: (summary: string, autoLinked: number) =>
      `Synced ${summary} new properties${autoLinked > 0 ? ` • ${autoLinked} auto-linked` : ""}.`,
    loading: "Syncing properties...",
    error: "An error occurred",
    unknownError: "Unknown error",
    busy: "Syncing...",
    action: "Sync Properties",
  },
  de: {
    noProperties: "Mit diesem Google-Konto sind noch keine Search-Console- oder Analytics-Properties verbunden.",
    googleReturned: (summary: string, autoLinked: number) =>
      `Google hat ${summary} zurückgegeben. Alles war bereits synchronisiert${autoLinked > 0 ? ` • ${autoLinked} automatisch verknüpft` : ""}.`,
    syncedNew: (summary: string, autoLinked: number) =>
      `${summary} neue Properties synchronisiert${autoLinked > 0 ? ` • ${autoLinked} automatisch verknüpft` : ""}.`,
    loading: "Properties werden synchronisiert...",
    error: "Ein Fehler ist aufgetreten",
    unknownError: "Unbekannter Fehler",
    busy: "Synchronisiert...",
    action: "Properties synchronisieren",
  },
} as const;

export function formatPropertiesSyncSuccess(data: PropertiesSyncResult, language: SupportedLanguage = "en") {
  const copy = SYNC_COPY[language];
  const discoveredGscCount = data.discoveredGscCount ?? data.gscCount;
  const discoveredGa4Count = data.discoveredGa4Count ?? data.ga4Count;
  const discoveredTotal = discoveredGscCount + discoveredGa4Count;

  if (discoveredTotal === 0) {
    return copy.noProperties;
  }

  if (data.gscCount === 0 && data.ga4Count === 0) {
    const parts = [];
    if (discoveredGscCount > 0) parts.push(`${discoveredGscCount} GSC`);
    if (discoveredGa4Count > 0) parts.push(`${discoveredGa4Count} GA4`);
    const discoveredSummary = parts.join(", ");
    return copy.googleReturned(discoveredSummary, data.autoLinked);
  }

  const parts = [];
  if (data.gscCount > 0) parts.push(`${data.gscCount} GSC`);
  if (data.ga4Count > 0) parts.push(`${data.ga4Count} GA4`);
  const newProps = parts.length > 0 ? parts.join(", ") : "0";
  return copy.syncedNew(newProps, data.autoLinked);
}

export function SyncButton({
  onSynced,
  externalIsSyncing = false,
  refreshStrategy = "both",
}: SyncButtonProps = {}) {
  const [isSyncing, setIsSyncing] = useState(false);
  const router = useRouter();
  const language = useAppLanguage();
  const copy = SYNC_COPY[language];
  const { hasBlockingIssue, openDialog, refreshHealth } = useGoogleAccessRecovery();
  const isBusy = isSyncing || externalIsSyncing;

  const handleSync = async () => {
    if (isBusy) return;
    if (hasBlockingIssue) {
      openDialog();
      return;
    }
    setIsSyncing(true);
    toast(copy.loading, { id: "sync-toast" });

    try {
      const data = await runPropertiesSync();
      toast.success(formatPropertiesSyncSuccess(data, language), { id: "sync-toast" });
      dispatchAppSidebarPropertiesRefresh();

      if (refreshStrategy === "callback" || refreshStrategy === "both") {
        await onSynced?.();
      }
      if (refreshStrategy === "router" || refreshStrategy === "both") {
        router.refresh();
      }
    } catch (error) {
      if (isAppError(error) && getGoogleAccessIssueFromCode(error.code)) {
        await refreshHealth({ openDialogOnIssue: true });
      } else {
        toast.error(`${copy.error}: ${getAppErrorMessage(error, copy.unknownError)}`, {
          id: "sync-toast",
        });
      }
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <Button onClick={handleSync} disabled={isBusy} variant="outline">
      <RefreshCw className={`size-4 mr-2 ${isBusy ? "animate-spin" : ""}`} />
      {isBusy ? copy.busy : copy.action}
    </Button>
  );
}
