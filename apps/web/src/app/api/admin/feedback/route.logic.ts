import { isFeedbackFilterStatus, isFeedbackStatus, type FeedbackFilterStatus, type FeedbackStatus } from "@/lib/feedback";

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;

export function parseAdminFeedbackQuery(searchParams: URLSearchParams) {
  const rawStatus = searchParams.get("status");
  const rawQuery = searchParams.get("q") ?? "";
  const rawPage = Number.parseInt(searchParams.get("page") ?? "1", 10);
  const rawLimit = Number.parseInt(searchParams.get("limit") ?? String(DEFAULT_LIMIT), 10);

  const status: FeedbackFilterStatus = isFeedbackFilterStatus(rawStatus) ? rawStatus : "open";
  const q = rawQuery.trim();
  const page = Number.isFinite(rawPage) && rawPage > 0 ? rawPage : 1;
  const limit = Number.isFinite(rawLimit) ? Math.min(Math.max(rawLimit, 1), MAX_LIMIT) : DEFAULT_LIMIT;

  return {
    status,
    q,
    page,
    limit,
    offset: (page - 1) * limit,
  };
}

export function parseFeedbackStatusPatch(body: unknown): { status: FeedbackStatus } | null {
  const input = typeof body === "object" && body !== null ? body as Record<string, unknown> : {};
  return isFeedbackStatus(input.status) ? { status: input.status } : null;
}
