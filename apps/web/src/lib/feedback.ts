export const FEEDBACK_TYPE_VALUES = ["feature_request", "bug_report"] as const;
export const FEEDBACK_SOURCE_VALUES = ["sidebar", "command_palette", "settings"] as const;
export const FEEDBACK_STATUS_VALUES = ["open", "resolved"] as const;
export const FEEDBACK_FILTER_STATUS_VALUES = ["open", "resolved", "all"] as const;

export type FeedbackType = (typeof FEEDBACK_TYPE_VALUES)[number];
export type FeedbackSource = (typeof FEEDBACK_SOURCE_VALUES)[number];
export type FeedbackStatus = (typeof FEEDBACK_STATUS_VALUES)[number];
export type FeedbackFilterStatus = (typeof FEEDBACK_FILTER_STATUS_VALUES)[number];

export const FEEDBACK_TYPE_OPTIONS: { value: FeedbackType; label: string }[] = [
  { value: "feature_request", label: "Feature request" },
  { value: "bug_report", label: "Bug report" },
];

export function isFeedbackType(value: unknown): value is FeedbackType {
  return typeof value === "string" && FEEDBACK_TYPE_VALUES.includes(value as FeedbackType);
}

export function isFeedbackSource(value: unknown): value is FeedbackSource {
  return typeof value === "string" && FEEDBACK_SOURCE_VALUES.includes(value as FeedbackSource);
}

export function isFeedbackStatus(value: unknown): value is FeedbackStatus {
  return typeof value === "string" && FEEDBACK_STATUS_VALUES.includes(value as FeedbackStatus);
}

export function isFeedbackFilterStatus(value: unknown): value is FeedbackFilterStatus {
  return typeof value === "string" && FEEDBACK_FILTER_STATUS_VALUES.includes(value as FeedbackFilterStatus);
}
