import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { redactForLog } from "@webhealth/shared/lib/log-sanitizer";
import { toPublicError } from "@webhealth/shared/lib/http-errors";

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
