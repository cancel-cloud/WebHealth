type JsonRecord = Record<string, unknown>;

const MAX_ARRAY_ITEMS = 20;

function sanitizeValue(value: unknown): unknown {
  if (value == null) return value;
  if (Array.isArray(value)) {
    return value.slice(0, MAX_ARRAY_ITEMS).map(sanitizeValue);
  }
  if (typeof value !== "object") return value;

  const out: JsonRecord = {};
  for (const [key, raw] of Object.entries(value as JsonRecord)) {
    const lower = key.toLowerCase();
    if (
      lower.includes("token") ||
      lower.includes("secret") ||
      lower.includes("password") ||
      lower.includes("refresh") ||
      lower.includes("access_token") ||
      lower.includes("id_token")
    ) {
      continue;
    }
    out[key] = sanitizeValue(raw);
  }
  return out;
}

export function buildSanitizedReportInputSnapshot(payload: unknown): JsonRecord {
  const sanitized = sanitizeValue(payload);
  return (sanitized && typeof sanitized === "object" ? sanitized : { payload: sanitized }) as JsonRecord;
}
