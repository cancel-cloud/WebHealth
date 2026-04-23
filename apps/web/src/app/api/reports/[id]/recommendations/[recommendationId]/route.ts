import { NextResponse } from "next/server";
import { and, eq, inArray } from "drizzle-orm";
import { nanoid } from "nanoid";
import { db } from "@webhealth/shared/db";
import {
  reportRecommendationFeedback,
  reportRecommendationStates,
  reports,
} from "@webhealth/shared/db/schema";
import type {
  RecommendationFeedbackType,
  RecommendationState,
} from "@webhealth/shared/lib/reports/types";
import { badRequest, notFound } from "@webhealth/shared/lib/http-errors";
import {
  requireUnrestrictedSession,
} from "@/lib/server/authz";
import { handleRouteError } from "@/lib/server/route-security";

const RECOMMENDATION_STATES = new Set<RecommendationState>([
  "open",
  "in_progress",
  "done",
  "ignored",
  "snoozed",
]);

const RECOMMENDATION_FEEDBACK_TYPES = new Set<RecommendationFeedbackType>([
  "helpful",
  "not_helpful",
  "too_generic",
  "not_applicable",
  "already_done",
]);

async function requireAuthorizedReport(reportId: string, userId: string) {
  const memberships = await db.query.teamMembers.findMany({
    where: (table, { eq }) => eq(table.userId, userId),
    columns: { teamId: true },
  });
  const teamIds = memberships.map((membership) => membership.teamId);
  if (teamIds.length === 0) {
    throw notFound("Report not found", "REPORT_NOT_FOUND");
  }
  const report = await db.query.reports.findFirst({
    where: and(eq(reports.id, reportId), inArray(reports.teamId, teamIds)),
    columns: { id: true },
  });
  if (!report) {
    throw notFound("Report not found", "REPORT_NOT_FOUND");
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string; recommendationId: string }> },
) {
  try {
    const session = await requireUnrestrictedSession();
    const { id: reportId, recommendationId } = await params;
    const body = await req.json() as { state?: string };
    const state = body.state;

    if (!state || !RECOMMENDATION_STATES.has(state as RecommendationState)) {
      throw badRequest("INVALID_RECOMMENDATION_STATE", "Unsupported recommendation state");
    }

    await requireAuthorizedReport(reportId, session.user.id);

    const [row] = await db
      .insert(reportRecommendationStates)
      .values({
        id: nanoid(),
        reportId,
        recommendationId,
        state,
      })
      .onConflictDoUpdate({
        target: [reportRecommendationStates.reportId, reportRecommendationStates.recommendationId],
        set: {
          state,
          updatedAt: new Date(),
        },
      })
      .returning({
        recommendationId: reportRecommendationStates.recommendationId,
        state: reportRecommendationStates.state,
      });

    return NextResponse.json({ recommendation: row });
  } catch (error) {
    return handleRouteError("PATCH /api/reports/[id]/recommendations/[recommendationId] error", error);
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string; recommendationId: string }> },
) {
  try {
    const session = await requireUnrestrictedSession();
    const { id: reportId, recommendationId } = await params;
    const body = await req.json() as { feedbackType?: string; note?: string };
    const feedbackType = body.feedbackType;
    const note = typeof body.note === "string" ? body.note.trim() : null;

    if (!feedbackType || !RECOMMENDATION_FEEDBACK_TYPES.has(feedbackType as RecommendationFeedbackType)) {
      throw badRequest("INVALID_RECOMMENDATION_FEEDBACK", "Unsupported recommendation feedback");
    }

    await requireAuthorizedReport(reportId, session.user.id);

    const [row] = await db
      .insert(reportRecommendationFeedback)
      .values({
        id: nanoid(),
        reportId,
        recommendationId,
        userId: session.user.id,
        feedbackType,
        note,
      })
      .onConflictDoUpdate({
        target: [reportRecommendationFeedback.reportId, reportRecommendationFeedback.recommendationId],
        set: {
          userId: session.user.id,
          feedbackType,
          note,
          updatedAt: new Date(),
        },
      })
      .returning({
        recommendationId: reportRecommendationFeedback.recommendationId,
        feedbackType: reportRecommendationFeedback.feedbackType,
      });

    return NextResponse.json({ feedback: row });
  } catch (error) {
    return handleRouteError("POST /api/reports/[id]/recommendations/[recommendationId] error", error);
  }
}
