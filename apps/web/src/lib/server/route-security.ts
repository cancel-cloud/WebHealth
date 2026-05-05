import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import {
  type BuildProductEventPayloadInput,
  buildPosthogErrorEventProperties,
} from "@webhealth/shared/lib/product-events";
import { redactForLog } from "@webhealth/shared/lib/log-sanitizer";
import { toPublicError } from "@webhealth/shared/lib/http-errors";

type HandledRouteFailureOptions = {
  label: string;
  status: number;
  code: string;
  message?: string;
  context?: Record<string, unknown>;
  productEventRecorder?: ProductEventRecorder;
};

type ProductEventRecorder = (event: BuildProductEventPayloadInput) => void | Promise<void>;

function getStringContextValue(context: Record<string, unknown> | undefined, key: string) {
  const value = context?.[key];
  return typeof value === "string" && value.trim() ? value : null;
}

function recordPosthogRouteError(event: BuildProductEventPayloadInput, recorder?: ProductEventRecorder) {
  if (recorder) {
    void recorder(event);
    return;
  }

  void import("@webhealth/shared/lib/product-event-store")
    .then(({ recordProductEvent }) => recordProductEvent(event))
    .catch(() => {});
}

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
  if (publicError.status >= 500) {
    recordPosthogRouteError({
      teamId: "internal_system",
      userId: null,
      name: "app_error_reported",
      source: "api",
      entityType: "route",
      entityId: label,
      properties: buildPosthogErrorEventProperties({
        surface: "route-handler",
        code: publicError.body.code,
        status: publicError.status,
        message: error instanceof Error ? error.message : fallback,
      }),
    });
  }
  console.error(label, redactForLog(error));
  return NextResponse.json(publicError.body, { status: publicError.status });
}

export function reportHandledRouteFailure({
  label,
  status,
  code,
  message,
  context,
  productEventRecorder,
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
  recordPosthogRouteError({
    teamId: getStringContextValue(context, "teamId") ?? "internal_system",
    userId: getStringContextValue(context, "userId"),
    name: "app_error_reported",
    source: "api",
    entityType: "route",
    entityId: label,
    properties: buildPosthogErrorEventProperties({
      surface: "route-handler",
      code,
      status,
      message,
      context,
    }),
  }, productEventRecorder);
}
