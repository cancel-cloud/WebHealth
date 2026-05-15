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
  "posthog_install_check_ran",
  "app_error_reported",
  "worker_error_reported",
  "weekly_watch_enabled",
  "weekly_auto_report_enqueued",
  "weekly_auto_report_completed",
  "weekly_report_opened",
  "weekly_dashboard_card_viewed",
] as const;

export type ProductEventName = (typeof PRODUCT_EVENT_NAMES)[number];

export type ProductEventSource =
  | "dashboard"
  | "properties"
  | "property_dashboard"
  | "snapshot"
  | "worker"
  | "admin"
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
  projectToken?: string | null;
  legacyProjectToken?: string | null;
  host?: string | null;
};

export type PosthogEnv = Record<string, string | null | undefined> & {
  POSTHOG_PROJECT_TOKEN?: string | null;
  POSTHOG_API_KEY?: string | null;
  NEXT_PUBLIC_POSTHOG_KEY?: string | null;
};

export const DEFAULT_POSTHOG_CAPTURE_HOST = "https://d.devbrew.dev";
export const DEFAULT_POSTHOG_UI_HOST = "https://eu.posthog.com";
export const POSTHOG_BROWSER_DEFAULTS = "2026-01-30";
export const POSTHOG_PERSON_PROFILES = "identified_only";

const PII_KEYS = new Set([
  "authorization",
  "cookie",
  "email",
  "emailAddress",
  "name",
  "stack",
  "token",
  "userName",
  "fullName",
]);

const SAFE_ERROR_CONTEXT_KEYS = new Set([
  "jobId",
  "phase",
  "route",
  "status",
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
  return Boolean(resolvePosthogConfigProjectToken(config));
}

export function resolvePosthogProjectToken(env: PosthogEnv) {
  return (
    env.POSTHOG_PROJECT_TOKEN?.trim() ||
    env.POSTHOG_API_KEY?.trim() ||
    env.NEXT_PUBLIC_POSTHOG_KEY?.trim() ||
    null
  );
}

function resolvePosthogConfigProjectToken(config: PosthogConfig) {
  return config.projectToken?.trim() || config.legacyProjectToken?.trim() || null;
}

export function getPosthogDistinctId(input: Pick<ReturnType<typeof buildProductEventPayload>, "teamId" | "userId">) {
  return input.userId ?? input.teamId;
}

export function normalizePosthogHost(host: string | null | undefined) {
  return (host?.trim() || DEFAULT_POSTHOG_CAPTURE_HOST).replace(/\/+$/, "");
}

export function buildPosthogCaptureEndpoint(config: Pick<PosthogConfig, "host">) {
  return `${normalizePosthogHost(config.host)}/i/v0/e/`;
}

export function buildPosthogCapturePayload(
  config: PosthogConfig,
  input: ReturnType<typeof buildProductEventPayload>,
) {
  const projectToken = resolvePosthogConfigProjectToken(config);
  if (!projectToken) return null;

  return {
    api_key: projectToken,
    event: input.name,
    distinct_id: getPosthogDistinctId(input),
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

function sanitizeErrorMessage(message: string) {
  return message
    .replace(/(password=)[^\s]+/gi, "$1[REDACTED]")
    .replace(/\/Users\/[^\s]+/g, "[REDACTED_PATH]")
    .slice(0, 240);
}

export function buildPosthogErrorEventProperties(input: {
  surface: string;
  code?: string | null;
  status?: number | null;
  message?: string | null;
  context?: Record<string, unknown> | null;
}) {
  const properties: Record<string, unknown> = {
    errorSurface: input.surface,
  };

  if (input.code) properties.errorCode = input.code;
  if (typeof input.status === "number") properties.status = input.status;
  if (input.message) properties.message = sanitizeErrorMessage(input.message);

  for (const [key, value] of Object.entries(input.context ?? {})) {
    if (!SAFE_ERROR_CONTEXT_KEYS.has(key)) continue;
    if (value === null || value === undefined) continue;
    properties[key] = typeof value === "string" ? sanitizeErrorMessage(value) : value;
  }

  return properties;
}

export function buildAiRunFailedCostProperties(input: {
  aiRunId: string;
  message?: string | null;
  failedCostEstimateUsd?: number | null;
}) {
  const properties: Record<string, unknown> = {
    aiRunId: input.aiRunId,
  };
  if (input.message) properties.message = sanitizeErrorMessage(input.message);
  if (typeof input.failedCostEstimateUsd === "number") {
    properties.failedCostEstimateUsd = Number(input.failedCostEstimateUsd.toFixed(6));
  }
  return properties;
}
