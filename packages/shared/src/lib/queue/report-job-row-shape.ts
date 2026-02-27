const snakeToCamelClaimJobKeys = [
  ["report_id", "reportId"],
  ["team_id", "teamId"],
  ["available_at", "availableAt"],
  ["max_attempts", "maxAttempts"],
  ["claimed_by", "claimedBy"],
  ["claimed_at", "claimedAt"],
  ["claim_expires_at", "claimExpiresAt"],
  ["heartbeat_at", "heartbeatAt"],
  ["started_at", "startedAt"],
  ["finished_at", "finishedAt"],
  ["last_error", "lastError"],
  ["created_at", "createdAt"],
  ["updated_at", "updatedAt"],
] as const;

export function normalizeClaimedReportJobRow<T extends Record<string, unknown>>(row: T) {
  const normalized: Record<string, unknown> = { ...row };

  for (const [snakeKey, camelKey] of snakeToCamelClaimJobKeys) {
    if (!(camelKey in normalized) && snakeKey in normalized) {
      normalized[camelKey] = normalized[snakeKey];
    }
  }

  return normalized as T & Record<string, unknown>;
}
