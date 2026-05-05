import type { RecommendationState } from "@webhealth/shared/lib/action-types";
import { badRequest } from "@webhealth/shared/lib/http-errors";

const ACTION_STATES = new Set<RecommendationState>([
  "open",
  "in_progress",
  "done",
  "ignored",
  "snoozed",
]);
const PRIORITY_OVERRIDES = new Set(["none", "raise", "pin", "lower"]);

function isDateString(value: unknown): value is string {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

export function normalizeActionUpdateBody(body: Record<string, unknown>) {
  const normalized = {
    fingerprint: typeof body.fingerprint === "string" ? body.fingerprint : "",
    actionFamily: typeof body.actionFamily === "string" ? body.actionFamily : "",
    causeFamily: typeof body.causeFamily === "string" ? body.causeFamily : "",
    remedyKey: typeof body.remedyKey === "string" ? body.remedyKey : "",
    targetType: typeof body.targetType === "string" ? body.targetType : "",
    targetKey: typeof body.targetKey === "string" ? body.targetKey : "",
    title: typeof body.title === "string" ? body.title : "",
    owner: typeof body.owner === "string" ? body.owner : null,
    state: typeof body.state === "string" ? body.state : undefined,
    priorityOverride: typeof body.priorityOverride === "string" ? body.priorityOverride : undefined,
    overrideReason: typeof body.overrideReason === "string" ? body.overrideReason : null,
    assigneeUserId: typeof body.assigneeUserId === "string" ? body.assigneeUserId : null,
    assigneeEmail: typeof body.assigneeEmail === "string" ? body.assigneeEmail : null,
    snoozedUntil: isDateString(body.snoozedUntil) ? body.snoozedUntil : null,
  };

  if (
    !normalized.fingerprint ||
    !normalized.actionFamily ||
    !normalized.causeFamily ||
    !normalized.remedyKey ||
    !normalized.targetType ||
    !normalized.targetKey ||
    !normalized.title
  ) {
    throw badRequest("ACTION_METADATA_REQUIRED", "Action identity metadata is required.");
  }

  if (normalized.state && !ACTION_STATES.has(normalized.state as RecommendationState)) {
    throw badRequest("INVALID_ACTION_STATE", "Unsupported action state.");
  }

  if (normalized.priorityOverride && !PRIORITY_OVERRIDES.has(normalized.priorityOverride)) {
    throw badRequest("INVALID_PRIORITY_OVERRIDE", "Unsupported priority override.");
  }

  if (
    !normalized.state &&
    !normalized.priorityOverride &&
    normalized.assigneeUserId == null &&
    normalized.assigneeEmail == null &&
    normalized.snoozedUntil == null
  ) {
    throw badRequest("ACTION_UPDATE_REQUIRED", "A state, priority, assignee, or snooze update is required.");
  }

  return normalized;
}
