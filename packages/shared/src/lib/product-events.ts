export const PRODUCT_EVENT_NAMES = [
  "property_activated",
  "property_deactivated",
  "snapshot_captured",
  "snapshot_opened",
  "snapshot_share_created",
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
