"use client";

import Link from "next/link";
import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type PropsWithChildren,
} from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import {
  buildGoogleConsentUpdate,
  readCookieConsent,
  shouldShowCookieConsentBanner,
  writeCookieConsent,
  type CookieConsentState,
} from "./cookie-consent.logic";

type CookieConsentContextValue = {
  consent: CookieConsentState;
  openBanner: boolean;
  accept: () => void;
  decline: () => void;
  reopen: () => void;
};

const CookieConsentContext = createContext<CookieConsentContextValue | null>(null);

function subscribeToHydration() {
  return () => {};
}

function getInitialConsent() {
  if (typeof window === "undefined") return "unknown" as CookieConsentState;
  return readCookieConsent(window.localStorage);
}

function updateGoogleConsent(consent: CookieConsentState, firePageView: boolean) {
  const w = window as Window & { gtag?: (...args: unknown[]) => void };
  w.gtag?.("consent", "update", buildGoogleConsentUpdate(consent));
  if (firePageView && consent === "accepted") {
    w.gtag?.("event", "page_view");
  }
}

function CookieConsentBanner({
  open,
  onAccept,
  onDecline,
}: {
  open: boolean;
  onAccept: () => void;
  onDecline: () => void;
}) {
  if (!open) return null;

  return (
    <div className="pointer-events-none fixed right-4 bottom-4 left-4 z-50 sm:left-auto sm:max-w-sm">
      <Card className="pointer-events-auto gap-0 border-border/80 bg-background/95 py-0 shadow-xl backdrop-blur">
        <CardHeader className="px-4 pt-4 pb-2">
          <CardTitle className="font-display text-base font-semibold">
            Cookie settings
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <p className="text-sm leading-relaxed text-muted-foreground">
            We use Google Analytics 4 and PostHog browser analytics only if you
            accept analytics cookies. Read our{" "}
            <Link href="/privacy" className="font-medium text-foreground underline underline-offset-4">
              privacy policy
            </Link>{" "}
            for details.
          </p>
        </CardContent>
        <CardFooter className="flex flex-col gap-2 border-t p-4 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" size="sm" className="w-full sm:w-auto" onClick={onDecline}>
            Decline
          </Button>
          <Button type="button" size="sm" className="w-full sm:w-auto" onClick={onAccept}>
            Accept
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

export function CookieConsentProvider({ children }: PropsWithChildren) {
  const hydrated = useSyncExternalStore(subscribeToHydration, () => true, () => false);
  const [consent, setConsent] = useState<CookieConsentState>(getInitialConsent);
  const [openBanner, setOpenBanner] = useState(() =>
    shouldShowCookieConsentBanner(getInitialConsent()),
  );
  const prevConsentRef = useRef<CookieConsentState | null>(null);

  useEffect(() => {
    if (!hydrated) return;

    const prev = prevConsentRef.current;
    prevConsentRef.current = consent;
    if (consent !== "unknown") {
      // Fire an explicit page_view only when transitioning from unknown → accepted
      // mid-session. For returning visitors (accepted on mount), the queued config
      // hit is released by the consent update within the wait_for_update window.
      const firePageView = (prev === null || prev === "unknown") && consent === "accepted";
      updateGoogleConsent(consent, firePageView);
    }
  }, [consent, hydrated]);

  const accept = () => {
    writeCookieConsent(window.localStorage, "accepted");
    setConsent("accepted");
    setOpenBanner(false);
  };

  const decline = () => {
    writeCookieConsent(window.localStorage, "declined");
    setConsent("declined");
    setOpenBanner(false);
  };

  const reopen = () => {
    setOpenBanner(true);
  };

  return (
    <CookieConsentContext.Provider
      value={{ consent, openBanner, accept, decline, reopen }}
    >
      {children}
      <CookieConsentBanner
        open={hydrated && openBanner}
        onAccept={accept}
        onDecline={decline}
      />
    </CookieConsentContext.Provider>
  );
}

export function CookieSettingsButton() {
  const context = useCookieConsent();

  return (
    <Button
      type="button"
      variant="link"
      size="sm"
      className="h-auto p-0 text-xs text-[oklch(0.55_0.02_250)]"
      onClick={context.reopen}
    >
      Cookie settings
    </Button>
  );
}

export function useCookieConsent() {
  const context = useContext(CookieConsentContext);

  if (!context) {
    throw new Error("useCookieConsent must be rendered inside CookieConsentProvider");
  }

  return context;
}
