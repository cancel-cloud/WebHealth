const KEY_REDACTION_PATTERN = /(authorization|token|secret|password|cookie|api[-_]?key)/i;
const VALUE_REPLACERS: Array<[RegExp, string]> = [
  [/\bsk-[A-Za-z0-9_-]{16,}\b/g, "[REDACTED_API_KEY]"],
  [/\bBearer\s+[A-Za-z0-9._~-]+\b/gi, "Bearer [REDACTED]"],
  [/\bGOCSPX-[A-Za-z0-9_-]+\b/g, "[REDACTED_GOOGLE_SECRET]"],
  [/\bnpg_[A-Za-z0-9]+\b/g, "[REDACTED_DB_SECRET]"],
  [/\bya29\.[A-Za-z0-9._-]+\b/g, "[REDACTED_GOOGLE_TOKEN]"],
];

function redactString(value: string) {
  let redacted = value;
  for (const [pattern, replacement] of VALUE_REPLACERS) {
    redacted = redacted.replace(pattern, replacement);
  }
  return redacted;
}

export function redactForLog(value: unknown): unknown {
  if (typeof value === "string") {
    return redactString(value);
  }

  if (value instanceof Error) {
    return {
      name: value.name,
      message: redactString(value.message),
    };
  }

  if (Array.isArray(value)) {
    return value.map((entry) => redactForLog(entry));
  }

  if (!value || typeof value !== "object") {
    return value;
  }

  const record = value as Record<string, unknown>;
  return Object.fromEntries(
    Object.entries(record).map(([key, entry]) => {
      if (KEY_REDACTION_PATTERN.test(key)) {
        return [key, "[REDACTED]"];
      }
      return [key, redactForLog(entry)];
    })
  );
}
