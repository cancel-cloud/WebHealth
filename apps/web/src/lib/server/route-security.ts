import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { redactForLog } from "@webhealth/shared/lib/log-sanitizer";
import { toPublicError } from "@webhealth/shared/lib/http-errors";

type HandledRouteFailureOptions = {
  label: string;
  status: number;
  code: string;
  message?: string;
  context?: Record<string, unknown>;
};

export function handleRouteError(
  label: string,
  error: unknown,
  fallback = "Internal server error"
) {
  const publicError = toPublicError(error, fallback);
  Sentry.withScope((scope) => {
    scope.setTag("error_surface", "route-handler");
    scope.setTag("route_error_label", label);
    scope.setLevel("error");
    scope.setContext("public_error", {
      status: publicError.status,
      code: publicError.body.code,
    });
    Sentry.captureException(error);
  });
  console.error(label, redactForLog(error));
  return NextResponse.json(publicError.body, { status: publicError.status });
}

export function reportHandledRouteFailure({
  label,
  status,
  code,
  message,
  context,
}: HandledRouteFailureOptions) {
  if (status < 500) return;

  Sentry.withScope((scope) => {
    scope.setTag("error_surface", "route-handler");
    scope.setTag("route_error_label", label);
    scope.setTag("handled_route_failure_code", code);
    scope.setLevel("error");
    scope.setContext("handled_route_failure", {
      status,
      code,
      ...context,
    });
    Sentry.captureMessage(message ?? `${label}: ${code}`);
  });
}
