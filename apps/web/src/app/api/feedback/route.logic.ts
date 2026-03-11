import { isFeedbackSource, isFeedbackType, type FeedbackSource, type FeedbackType } from "@/lib/feedback";

type CreateFeedbackPayload = {
  type: FeedbackType;
  source: FeedbackSource;
  message: string;
};

type CreateFeedbackParseResult =
  | { ok: true; value: CreateFeedbackPayload }
  | { ok: false; error: "INVALID_TYPE" | "INVALID_SOURCE" | "INVALID_MESSAGE" };

export function parseCreateFeedbackRequest(body: unknown): CreateFeedbackParseResult {
  const input = typeof body === "object" && body !== null ? body as Record<string, unknown> : {};
  const type = input.type;
  const source = input.source;
  const message = typeof input.message === "string" ? input.message.trim() : "";

  if (!isFeedbackType(type)) {
    return { ok: false, error: "INVALID_TYPE" };
  }

  if (!isFeedbackSource(source)) {
    return { ok: false, error: "INVALID_SOURCE" };
  }

  if (!message) {
    return { ok: false, error: "INVALID_MESSAGE" };
  }

  return {
    ok: true,
    value: {
      type,
      source,
      message,
    },
  };
}
