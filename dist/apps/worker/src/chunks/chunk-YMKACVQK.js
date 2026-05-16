import { createRequire } from "node:module"; const require = createRequire(import.meta.url);

// packages/shared/src/lib/product-events.ts
var DEFAULT_POSTHOG_CAPTURE_HOST = "https://d.devbrew.dev";
var PII_KEYS = /* @__PURE__ */ new Set([
  "authorization",
  "cookie",
  "email",
  "emailAddress",
  "name",
  "stack",
  "token",
  "userName",
  "fullName"
]);
var SAFE_ERROR_CONTEXT_KEYS = /* @__PURE__ */ new Set([
  "jobId",
  "phase",
  "route",
  "status"
]);
function sanitizeProductEventProperties(input) {
  const sanitized = {};
  for (const [key, value] of Object.entries(input ?? {})) {
    if (PII_KEYS.has(key)) continue;
    sanitized[key] = value;
  }
  return sanitized;
}
function buildProductEventPayload(input) {
  return {
    teamId: input.teamId,
    userId: input.userId ?? null,
    name: input.name,
    source: input.source,
    entityType: input.entityType ?? null,
    entityId: input.entityId ?? null,
    properties: sanitizeProductEventProperties(input.properties)
  };
}
function resolvePosthogProjectToken(env) {
  return env.POSTHOG_PROJECT_TOKEN?.trim() || env.POSTHOG_API_KEY?.trim() || env.NEXT_PUBLIC_POSTHOG_KEY?.trim() || null;
}
function resolvePosthogConfigProjectToken(config) {
  return config.projectToken?.trim() || config.legacyProjectToken?.trim() || null;
}
function getPosthogDistinctId(input) {
  return input.userId ?? input.teamId;
}
function normalizePosthogHost(host) {
  return (host?.trim() || DEFAULT_POSTHOG_CAPTURE_HOST).replace(/\/+$/, "");
}
function buildPosthogCaptureEndpoint(config) {
  return `${normalizePosthogHost(config.host)}/i/v0/e/`;
}
function buildPosthogCapturePayload(config, input) {
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
      ...input.properties
    }
  };
}
function sanitizeErrorMessage(message) {
  return message.replace(/(password=)[^\s]+/gi, "$1[REDACTED]").replace(/\/Users\/[^\s]+/g, "[REDACTED_PATH]").slice(0, 240);
}
function buildPosthogErrorEventProperties(input) {
  const properties = {
    errorSurface: input.surface
  };
  if (input.code) properties.errorCode = input.code;
  if (typeof input.status === "number") properties.status = input.status;
  if (input.message) properties.message = sanitizeErrorMessage(input.message);
  for (const [key, value] of Object.entries(input.context ?? {})) {
    if (!SAFE_ERROR_CONTEXT_KEYS.has(key)) continue;
    if (value === null || value === void 0) continue;
    properties[key] = typeof value === "string" ? sanitizeErrorMessage(value) : value;
  }
  return properties;
}
function buildAiRunFailedCostProperties(input) {
  const properties = {
    aiRunId: input.aiRunId
  };
  if (input.message) properties.message = sanitizeErrorMessage(input.message);
  if (typeof input.failedCostEstimateUsd === "number") {
    properties.failedCostEstimateUsd = Number(input.failedCostEstimateUsd.toFixed(6));
  }
  return properties;
}

export {
  buildProductEventPayload,
  resolvePosthogProjectToken,
  buildPosthogCaptureEndpoint,
  buildPosthogCapturePayload,
  buildPosthogErrorEventProperties,
  buildAiRunFailedCostProperties
};
