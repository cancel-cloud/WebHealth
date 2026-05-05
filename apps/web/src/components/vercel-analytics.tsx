"use client";

import { Analytics, type BeforeSendEvent } from "@vercel/analytics/next";
import { sanitizeAnalyticsUrl } from "@/components/posthog-analytics.logic";

function beforeSend(event: BeforeSendEvent): BeforeSendEvent | null {
  return {
    ...event,
    url: sanitizeAnalyticsUrl(event.url),
  };
}

export function VercelAnalytics() {
  return <Analytics beforeSend={beforeSend} />;
}
