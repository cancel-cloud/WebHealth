import { NextResponse } from "next/server";
import { and, desc, eq } from "drizzle-orm";
import { db } from "@webhealth/shared/db";
import { aiAnalysisRuns, aiPromptTemplates, properties } from "@webhealth/shared/db/schema";
import { buildDefaultAiPromptTemplateRows } from "@webhealth/shared/lib/ai-analysis";
import { getAiRuntimeSettings, updateAiRuntimeSettings } from "@webhealth/shared/lib/ai-runtime-settings";
import { requireAdminSession } from "@/lib/server/authz";
import { handleRouteError } from "@/lib/server/route-security";
import {
  buildAiPromptTemplateId,
  normalizeCreateAiPromptTemplateBody,
  normalizeUpdateAiRuntimeSettingsBody,
} from "./route.logic";

async function ensureAiPromptTemplatesSeeded() {
  const existing = await db.query.aiPromptTemplates.findFirst({
    columns: { id: true },
  });
  if (existing) return;

  await db.insert(aiPromptTemplates).values(buildDefaultAiPromptTemplateRows());
}

export async function GET() {
  try {
    await requireAdminSession();
    await ensureAiPromptTemplatesSeeded();

    const [templates, runtimeSettings, latestRuns] = await Promise.all([
      db
        .select()
        .from(aiPromptTemplates)
        .orderBy(aiPromptTemplates.purpose, desc(aiPromptTemplates.version)),
      getAiRuntimeSettings(),
      db
        .select({
          id: aiAnalysisRuns.id,
          propertyId: aiAnalysisRuns.propertyId,
          propertyName: properties.name,
          status: aiAnalysisRuns.status,
          phase: aiAnalysisRuns.phase,
          summaryModel: aiAnalysisRuns.summaryModel,
          analyzerModel: aiAnalysisRuns.analyzerModel,
          usageSnapshot: aiAnalysisRuns.usageSnapshot,
          costEstimateUsd: aiAnalysisRuns.costEstimateUsd,
          error: aiAnalysisRuns.error,
          createdAt: aiAnalysisRuns.createdAt,
          updatedAt: aiAnalysisRuns.updatedAt,
          finishedAt: aiAnalysisRuns.finishedAt,
        })
        .from(aiAnalysisRuns)
        .leftJoin(properties, eq(properties.id, aiAnalysisRuns.propertyId))
        .orderBy(desc(aiAnalysisRuns.updatedAt))
        .limit(12),
    ]);

    return NextResponse.json({ templates, runtimeSettings, latestRuns });
  } catch (error) {
    return handleRouteError("Error fetching AI prompt templates", error);
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await requireAdminSession();
    const body = normalizeUpdateAiRuntimeSettingsBody(await req.json() as Record<string, unknown>);
    const runtimeSettings = await updateAiRuntimeSettings({
      ...body,
      updatedByUserId: session.user.id,
    });

    return NextResponse.json({ runtimeSettings });
  } catch (error) {
    return handleRouteError("Error updating AI runtime settings", error);
  }
}

export async function POST(req: Request) {
  try {
    const session = await requireAdminSession();
    await ensureAiPromptTemplatesSeeded();

    const body = normalizeCreateAiPromptTemplateBody(await req.json() as Record<string, unknown>);
    const latest = await db.query.aiPromptTemplates.findFirst({
      where: (table, { eq: eqFn }) => eqFn(table.purpose, body.purpose),
      orderBy: (table, { desc: descOrder }) => [descOrder(table.version)],
    });
    const version = (latest?.version ?? 0) + 1;
    const now = new Date();

    await db.transaction(async (tx) => {
      await tx
        .update(aiPromptTemplates)
        .set({ isActive: false, updatedAt: now })
        .where(and(eq(aiPromptTemplates.purpose, body.purpose), eq(aiPromptTemplates.isActive, true)));

      await tx.insert(aiPromptTemplates).values({
        id: buildAiPromptTemplateId(body.purpose, version),
        purpose: body.purpose,
        version,
        name: body.name,
        systemPrompt: body.systemPrompt,
        isActive: true,
        createdByUserId: session.user.id,
        createdAt: now,
        updatedAt: now,
      });
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleRouteError("Error saving AI prompt template", error);
  }
}
