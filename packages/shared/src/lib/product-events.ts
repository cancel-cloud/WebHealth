export const PRODUCT_EVENT_NAMES = [
  "dashboard_opened",
  "property_activated",
  "property_deactivated",
  "refresh_started",
  "refresh_completed",
  "refresh_failed",
  "ai_run_queued",
  "ai_run_started",
  "ai_run_completed",
  "ai_run_failed",
  "action_state_changed",
  "snapshot_captured",
  "snapshot_copied",
  "snapshot_opened",
  "snapshot_share_created",
  "billing_cta_clicked",
  "google_reconnect_started",
] as const;

export type ProductEventName = (typeof PRODUCT_EVENT_NAMES)[number];

export type ProductEventSource =
  | "dashboard"
  | "properties"
  | "property_dashboard"
  | "snapshot"
  | "worker"
  | "api";

export type BuildProductEventPayloadInput = {
  teamId: string;
  userId?: string | null;
  name: ProductEventName;
  source: ProductEventSource;
  entityType?: string | null;
  entityId?: string | null;
  properties?: Record<string, unknown> | null;
};

export type PosthogConfig = {
  apiKey?: string | null;
  host?: string | null;
};

const PII_KEYS = new Set([
  "email",
  "emailAddress",
  "name",
  "userName",
  "fullName",
]);

export function isProductEventName(value: string): value is ProductEventName {
  return PRODUCT_EVENT_NAMES.includes(value as ProductEventName);
}

export function sanitizeProductEventProperties(input?: Record<string, unknown> | null) {
  const sanitized: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(input ?? {})) {
    if (PII_KEYS.has(key)) continue;
    sanitized[key] = value;
  }
  return sanitized;
}

export function buildProductEventPayload(input: BuildProductEventPayloadInput) {
  return {
    teamId: input.teamId,
    userId: input.userId ?? null,
    name: input.name,
    source: input.source,
    entityType: input.entityType ?? null,
    entityId: input.entityId ?? null,
    properties: sanitizeProductEventProperties(input.properties),
  };
}

export function shouldSendPosthogEvent(config: PosthogConfig) {
  return Boolean(config.apiKey);
}

export function buildPosthogCapturePayload(
  config: PosthogConfig,
  input: ReturnType<typeof buildProductEventPayload>,
) {
  if (!shouldSendPosthogEvent(config)) return null;

  return {
    api_key: config.apiKey,
    event: input.name,
    distinct_id: input.userId ?? input.teamId,
    properties: {
      teamId: input.teamId,
      userId: input.userId,
      source: input.source,
      entityType: input.entityType,
      entityId: input.entityId,
      ...input.properties,
    },
  };
}
