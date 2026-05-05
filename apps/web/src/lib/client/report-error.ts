import * as Sentry from "@sentry/nextjs";
import posthog from "posthog-js";
import { buildPosthogErrorEventProperties } from "@webhealth/shared/lib/product-events";

import { isAppError } from "./app-error";

function shouldReportClientError(error: unknown) {
  if (
    typeof error === "object" &&
    error !== null &&
    "name" in error &&
    (error as { name?: string }).name === "AbortError"
  ) {
    return false;
  }

  return !(isAppError(error) && error.handled);
}

export function reportClientError(error: unknown, extra?: Record<string, unknown>) {
  if (!shouldReportClientError(error)) return;
  Sentry.withScope((scope) => {
    scope.setTag("error_surface", "client-request");
    if (extra) {
      scope.setContext("client_request", extra);
    }
    Sentry.captureException(error);
  });
  posthog.capture("app_error_reported", buildPosthogErrorEventProperties({
    surface: "client-request",
    message: error instanceof Error ? error.message : "Client error",
    context: extra,
  }));
}
