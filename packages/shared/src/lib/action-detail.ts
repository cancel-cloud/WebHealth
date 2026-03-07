import { sanitizeHttpUrls } from "./safe-url";

export type ActionDetailPayload = {
  affectedUrls: string[];
  fixSteps: string[];
  whyItMatters: string;
};

export function sanitizeActionDetailPayload(input: unknown): ActionDetailPayload {
  const raw = input && typeof input === "object" ? (input as Record<string, unknown>) : {};
  const affectedUrls = Array.isArray(raw.affectedUrls)
    ? raw.affectedUrls.filter((value): value is string => typeof value === "string")
    : [];
  const fixSteps = Array.isArray(raw.fixSteps)
    ? raw.fixSteps.filter((value): value is string => typeof value === "string").map((step) => step.trim()).filter(Boolean)
    : [];
  const whyItMatters =
    typeof raw.whyItMatters === "string" ? raw.whyItMatters.trim() : "";

  return {
    affectedUrls: sanitizeHttpUrls(affectedUrls),
    fixSteps,
    whyItMatters,
  };
}
