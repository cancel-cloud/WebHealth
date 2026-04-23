import type { RecommendationDetail, RecommendationEvidenceFact } from "./reports/types";

function sanitizeStringList(input: unknown) {
  return Array.isArray(input)
    ? input
        .filter((value): value is string => typeof value === "string")
        .map((value) => value.trim())
        .filter(Boolean)
    : [];
}

function sanitizeEvidenceFacts(input: unknown): RecommendationEvidenceFact[] {
  if (!Array.isArray(input)) return [];

  return input
    .map((value) => {
      const raw = value && typeof value === "object" ? (value as Record<string, unknown>) : {};
      const label = typeof raw.label === "string" ? raw.label.trim() : "";
      const factValue = typeof raw.value === "string" ? raw.value.trim() : "";

      if (!label || !factValue) return null;
      return { label, value: factValue } satisfies RecommendationEvidenceFact;
    })
    .filter((value): value is RecommendationEvidenceFact => value !== null);
}

export function sanitizeActionDetailPayload(input: unknown): RecommendationDetail {
  const raw = input && typeof input === "object" ? (input as Record<string, unknown>) : {};
  const evidence =
    raw.evidence && typeof raw.evidence === "object"
      ? (raw.evidence as Record<string, unknown>)
      : {};

  return {
    observed: sanitizeStringList(raw.observed),
    likelyCauses: sanitizeStringList(raw.likelyCauses),
    recommendedActions: sanitizeStringList(raw.recommendedActions),
    whyThisHelps: sanitizeStringList(raw.whyThisHelps),
    expectedOutcome: sanitizeStringList(raw.expectedOutcome),
    evidence: {
      deterministic: sanitizeEvidenceFacts(evidence.deterministic),
      inferred: sanitizeStringList(evidence.inferred),
    },
  };
}

function normalizeActionDetailInput(raw: unknown) {
  if (typeof raw !== "string") return raw;

  try {
    return JSON.parse(raw);
  } catch {
    throw new Error("Invalid action detail JSON");
  }
}

export function serializeActionDetail(raw: unknown) {
  return sanitizeActionDetailPayload(normalizeActionDetailInput(raw));
}
