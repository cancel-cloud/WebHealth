import { isFeedbackType, type FeedbackType } from "@/lib/feedback";

export function getFeatureRequestDialogTitle() {
  return "Share Feedback";
}

export function getFeatureRequestSuccessDismissDelayMs() {
  return 1000;
}

export function getFeatureRequestInitialFocusFieldId() {
  return "feature-request-message";
}

export function getFeatureRequestSubmissionState({
  type,
  message,
}: {
  type: FeedbackType | "";
  message: string;
}) {
  const trimmedMessage = message.trim();

  return {
    canSubmit: isFeedbackType(type) && trimmedMessage.length > 0,
    trimmedMessage,
  };
}

export function getFeatureRequestSubmitLabel(submitted: boolean) {
  return submitted ? "Thanks" : "Send request";
}
