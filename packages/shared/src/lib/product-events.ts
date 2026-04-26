export const PRODUCT_EVENT_NAMES = [
  "weekly_watch_enabled",
  "weekly_watch_disabled",
  "weekly_auto_report_enqueued",
  "weekly_auto_report_completed",
  "weekly_auto_report_skipped_quota",
  "weekly_dashboard_card_viewed",
  "weekly_report_opened",
  "manual_report_created",
  "manual_report_opened",
  "report_detail_requested",
  "property_activated",
  "property_deactivated",
] as const;

export type ProductEventName = (typeof PRODUCT_EVENT_NAMES)[number];

export type ProductEventSource =
  | "dashboard"
  | "properties"
  | "reports"
  | "report_detail"
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
