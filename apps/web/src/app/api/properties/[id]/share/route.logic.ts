import { badRequest } from "@webhealth/shared/lib/http-errors";

function isDateString(value: unknown): value is string {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

export function normalizeShareRequestBody(body: Record<string, unknown>) {
  const mode = body.mode === "client" ? "client" : null;
  if (!mode) {
    throw badRequest("INVALID_SHARE_MODE", "A client share mode is required.");
  }

  if (
    typeof body.preset !== "string" ||
    typeof body.compareMode !== "string" ||
    !isDateString(body.startDate) ||
    !isDateString(body.endDate)
  ) {
    throw badRequest("INVALID_SHARE_WINDOW", "A valid share window is required.");
  }

  return {
    preset: body.preset,
    compareMode: body.compareMode,
    startDate: body.startDate,
    endDate: body.endDate,
    mode,
    brandProfileId: typeof body.brandProfileId === "string" ? body.brandProfileId : null,
  };
}

export function buildPropertyShareUrl(params: {
  requestUrl: string;
  token: string;
  baseUrl?: string | null;
}) {
  const configuredBaseUrl = params.baseUrl?.trim();
  const baseUrl = configuredBaseUrl ? new URL(configuredBaseUrl) : new URL(params.requestUrl);
  return `${baseUrl.origin}/share/property/${encodeURIComponent(params.token)}`;
}
