"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { ShieldAlert } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { authClient } from "@webhealth/shared/lib/auth-client";
import type { GoogleAccessHealth } from "@webhealth/shared/lib/google-access";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { requestJson } from "@/lib/client/api";
import { getAppErrorMessage } from "@/lib/client/app-error";
import { toast } from "sonner";
import {
  type GoogleAccessIssue,
  getGoogleAccessDialogModel,
  getGoogleAccessToastModel,
} from "./google-access-recovery.logic";

const GOOGLE_ACCESS_TOAST_ID = "google-access-recovery";
const GOOGLE_REAUTH_PENDING_KEY = "webhealth_google_reauth_pending";

type RefreshGoogleAccessOptions = {
  openDialogOnIssue?: boolean;
};

type GoogleAccessRecoveryContextValue = {
  health: GoogleAccessHealth | null;
  issue: GoogleAccessIssue | null;
  hasBlockingIssue: boolean;
  isChecking: boolean;
  openDialog: () => void;
  refreshHealth: (options?: RefreshGoogleAccessOptions) => Promise<GoogleAccessHealth | null>;
};

const GoogleAccessRecoveryContext = createContext<GoogleAccessRecoveryContextValue | null>(null);

function getIssueFromHealth(health: GoogleAccessHealth | null): GoogleAccessIssue | null {
  if (!health || health.state === "ok") return null;
  return {
    state: health.state,
    missingGrants: health.missingGrants,
  };
}

export function GoogleAccessRecoveryProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [health, setHealth] = useState<GoogleAccessHealth | null>(null);
  const [isChecking, setIsChecking] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const hasHandledPendingReauthRef = useRef(false);

  const issue = getIssueFromHealth(health);

  const refreshHealth = useCallback(
    async (options?: RefreshGoogleAccessOptions) => {
      setIsChecking(true);
      try {
        const data = await requestJson<{ health?: GoogleAccessHealth }>("/api/google-access/health", {
          cache: "no-store",
        });
        const nextHealth = data?.health ?? null;
        setHealth(nextHealth);
        if (options?.openDialogOnIssue && nextHealth && nextHealth.state !== "ok") {
          setDialogOpen(true);
        }
        return nextHealth;
      } catch {
        setHealth(null);
        return null;
      } finally {
        setIsChecking(false);
      }
    },
    [],
  );

  const openDialog = useCallback(() => {
    setDialogOpen(true);
  }, []);

  const startReconnect = useCallback(async () => {
    const qs = searchParams?.toString();
    const callbackURL = qs ? `${pathname}?${qs}` : pathname || "/dashboard";

    if (typeof window !== "undefined") {
      window.sessionStorage.setItem(GOOGLE_REAUTH_PENDING_KEY, "1");
    }

    setIsReconnecting(true);
    try {
      await authClient.signIn.social({
        provider: "google",
        callbackURL,
      });
    } finally {
      setIsReconnecting(false);
    }
  }, [pathname, searchParams]);

  useEffect(() => {
    void refreshHealth();
  }, [refreshHealth]);

  useEffect(() => {
    if (!issue) {
      toast.dismiss(GOOGLE_ACCESS_TOAST_ID);
      return;
    }

    const toastModel = getGoogleAccessToastModel(issue);
    toast.warning(toastModel.title, {
      id: GOOGLE_ACCESS_TOAST_ID,
      description: toastModel.description,
      duration: Infinity,
      dismissible: false,
      action: {
        label: toastModel.actionLabel,
        onClick: () => setDialogOpen(true),
      },
    });
  }, [issue]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.sessionStorage.getItem(GOOGLE_REAUTH_PENDING_KEY) !== "1") {
      hasHandledPendingReauthRef.current = false;
      return;
    }
    if (!health || health.state !== "ok" || hasHandledPendingReauthRef.current) return;

    hasHandledPendingReauthRef.current = true;

    void (async () => {
      try {
        await requestJson("/api/properties/sync", { method: "POST" });
        window.sessionStorage.removeItem(GOOGLE_REAUTH_PENDING_KEY);
        await refreshHealth();
        setDialogOpen(false);
        router.refresh();
        toast.success("Google access restored. Properties synced.", {
          id: GOOGLE_ACCESS_TOAST_ID,
          duration: 5000,
        });
      } catch (error) {
        window.sessionStorage.removeItem(GOOGLE_REAUTH_PENDING_KEY);
        await refreshHealth({ openDialogOnIssue: true });
        toast.error(getAppErrorMessage(error, "Google reconnected, but property sync failed."), {
          id: GOOGLE_ACCESS_TOAST_ID,
          duration: 8000,
        });
      }
    })();
  }, [health, refreshHealth, router]);

  const dialogModel = issue ? getGoogleAccessDialogModel(issue) : null;

  const value = useMemo<GoogleAccessRecoveryContextValue>(
    () => ({
      health,
      issue,
      hasBlockingIssue: !!issue,
      isChecking,
      openDialog,
      refreshHealth,
    }),
    [health, issue, isChecking, openDialog, refreshHealth],
  );

  return (
    <GoogleAccessRecoveryContext.Provider value={value}>
      {children}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">
              {dialogModel?.title ?? "Review Google access"}
            </DialogTitle>
            <DialogDescription>
              {dialogModel?.description ?? "Reconnect Google to restore property sync and report actions."}
            </DialogDescription>
          </DialogHeader>

          <div className="rounded-lg border border-amber-200 bg-amber-50/70 p-4">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
                <ShieldAlert className="h-5 w-5" />
              </div>
              <div className="space-y-2">
                <p className="font-medium text-amber-950">What needs to happen</p>
                <ol className="space-y-2 text-sm text-amber-950/85">
                  <li>Reconnect your Google account.</li>
                  <li>Approve the required Search Console and Analytics access on the consent screen.</li>
                  <li>Return to WebHealth so we can refresh your properties automatically.</li>
                </ol>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Not now
            </Button>
            <Button onClick={() => void startReconnect()} disabled={isReconnecting} className="rounded-full">
              {isReconnecting
                ? "Redirecting..."
                : (dialogModel?.primaryActionLabel ?? "Reconnect Google")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </GoogleAccessRecoveryContext.Provider>
  );
}

export function useGoogleAccessRecovery() {
  const context = useContext(GoogleAccessRecoveryContext);
  if (!context) {
    throw new Error("useGoogleAccessRecovery must be used within GoogleAccessRecoveryProvider");
  }
  return context;
}
