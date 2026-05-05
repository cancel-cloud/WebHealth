import type { LogEntry } from "@/app/(app)/admin/logs/logs-table.logic";

export type AdminActivityLogEntry = Omit<LogEntry, "createdAt"> & {
  createdAt: Date | string;
};

export function normalizeProductEventStatus(name: string) {
  if (name.endsWith("_queued")) return "queued";
  if (name.endsWith("_started")) return "started";
  if (name.endsWith("_failed")) return "failed";
  return "success";
}

export function buildProductEventDetails(input: {
  source: string;
  entityType: string | null;
  entityId: string | null;
  properties: unknown;
}) {
  const details: Record<string, unknown> = {
    source: input.source,
    entityType: input.entityType,
    entityId: input.entityId,
  };

  if (input.properties && typeof input.properties === "object" && !Array.isArray(input.properties)) {
    Object.assign(details, input.properties);
  }

  return details;
}

export function normalizeLogDetails(details: unknown) {
  if (!details || typeof details !== "object" || Array.isArray(details)) return null;
  return details as Record<string, unknown>;
}

export function sortAndLimitActivityLogs<T extends AdminActivityLogEntry>(logs: T[], limit: number) {
  return [...logs]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, limit);
}
