"use client";

import { useEffect, useRef } from "react";
import posthog from "posthog-js";
import { usePathname, useSearchParams } from "next/navigation";
import { authClient } from "@webhealth/shared/lib/auth-client";
import { useCookieConsent } from "@/components/cookie-consent";
import {
  buildPosthogBrowserConfig,
  getPosthogIdentityAction,
  isPosthogBrowserEnabled,
  sanitizeAnalyticsUrl,
} from "./posthog-analytics.logic";

type PosthogAnalyticsProps = {
  projectKey?: string | null;
  captureHost?: string | null;
  uiHost?: string | null;
};

export function PosthogAnalytics({
  projectKey,
  captureHost,
  uiHost,
}: PosthogAnalyticsProps) {
  const { consent } = useCookieConsent();
  const { data: session } = authClient.useSession();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const initializedRef = useRef(false);
  const identifiedUserIdRef = useRef<string | null>(null);
  const enabled = isPosthogBrowserEnabled(consent, projectKey);

  useEffect(() => {
    if (!enabled || !projectKey || initializedRef.current) return;

    posthog.init(projectKey, buildPosthogBrowserConfig({
      key: projectKey,
      captureHost,
      uiHost,
    }));
    initializedRef.current = true;
  }, [captureHost, enabled, projectKey, uiHost]);

  useEffect(() => {
    if (!enabled || !initializedRef.current) return;

    const search = searchParams.toString();
    const url = sanitizeAnalyticsUrl(`${window.location.origin}${pathname}${search ? `?${search}` : ""}`);
    const sanitizedPathname = new URL(url).pathname;
    posthog.capture("$pageview", {
      $current_url: url,
      pathname: sanitizedPathname,
    });
  }, [enabled, pathname, searchParams]);

  useEffect(() => {
    const action = getPosthogIdentityAction({
      consent,
      initialized: initializedRef.current,
      currentIdentifiedUserId: identifiedUserIdRef.current,
      user: session?.user ?? null,
    });

    if (action.type === "identify") {
      posthog.identify(action.distinctId, action.properties);
      identifiedUserIdRef.current = action.distinctId;
    }

    if (action.type === "reset") {
      posthog.reset();
      identifiedUserIdRef.current = null;
    }
  }, [consent, session?.user]);

  useEffect(() => {
    if (consent === "accepted" && initializedRef.current) {
      posthog.opt_in_capturing();
    }
    if (consent === "declined" && initializedRef.current) {
      posthog.opt_out_capturing();
    }
  }, [consent]);

  return null;
}
