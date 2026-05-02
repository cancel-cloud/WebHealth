export type LogEntry = {
  id: string;
  action: string;
  status: string;
  details: Record<string, unknown> | null;
  createdAt: string;
  triggeredByEmail: string | null;
  targetUserEmail: string | null;
};

export type LogActionOption = {
  value: string;
  label: string;
  group: "Account" | "Source data" | "Background AI" | "Snapshots";
};

export const ACTION_OPTIONS: LogActionOption[] = [
  { value: "user_signin", label: "User sign-in", group: "Account" },
  { value: "user_deleted", label: "User deleted", group: "Account" },
  { value: "property_sync", label: "Property source sync", group: "Source data" },
  { value: "property_link_ga4", label: "GA4 property linked", group: "Source data" },
  { value: "metrics_sync", label: "Metrics refresh", group: "Source data" },
  { value: "refresh_started", label: "Background refresh started", group: "Background AI" },
  { value: "refresh_completed", label: "Background refresh completed", group: "Background AI" },
  { value: "refresh_failed", label: "Background refresh failed", group: "Background AI" },
  { value: "ai_run_queued", label: "AI insights queued", group: "Background AI" },
  { value: "ai_run_started", label: "AI insights started", group: "Background AI" },
  { value: "ai_run_completed", label: "AI insights completed", group: "Background AI" },
  { value: "ai_run_failed", label: "AI insights failed", group: "Background AI" },
  { value: "action_state_changed", label: "Action state changed", group: "Background AI" },
  { value: "snapshot_captured", label: "Snapshot captured", group: "Snapshots" },
  { value: "snapshot_copied", label: "Snapshot copied", group: "Snapshots" },
  { value: "snapshot_opened", label: "Snapshot opened", group: "Snapshots" },
  { value: "snapshot_share_created", label: "Snapshot share created", group: "Snapshots" },
];

export const STATUS_OPTIONS = [
  { value: "queued", label: "Queued" },
  { value: "started", label: "Started" },
  { value: "success", label: "Success" },
  { value: "failed", label: "Failed" },
];

const ACTION_LABELS = new Map(ACTION_OPTIONS.map((option) => [option.value, option.label]));
const STATUS_LABELS = new Map(STATUS_OPTIONS.map((option) => [option.value, option.label]));

export const ACTION_GROUPS = ["Account", "Source data", "Background AI", "Snapshots"] as const;

export function getActionLabel(action: string) {
  return ACTION_LABELS.get(action) ?? action;
}

export function getStatusLabel(status: string) {
  return STATUS_LABELS.get(status) ?? status;
}

