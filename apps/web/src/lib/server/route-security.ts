import { NextResponse } from "next/server";
import { redactForLog } from "@webhealth/shared/lib/log-sanitizer";
import { toPublicError } from "@webhealth/shared/lib/http-errors";

export function handleRouteError(
  label: string,
  error: unknown,
  fallback = "Internal server error"
) {
  const publicError = toPublicError(error, fallback);
  console.error(label, redactForLog(error));
  return NextResponse.json(publicError.body, { status: publicError.status });
}
