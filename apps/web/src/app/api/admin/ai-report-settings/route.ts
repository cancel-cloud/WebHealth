import { NextResponse } from "next/server";
import { asc, eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { db } from "@webhealth/shared/db";
import { aiReportPromptVersions, aiReportSettings } from "@webhealth/shared/db/schema";
import { ensureDefaultAiReportSettings } from "@webhealth/shared/lib/queue/report-worker";
import { requireAdminSession } from "@/lib/server/authz";
import { handleRouteError } from "@/lib/server/route-security";

export async function GET() {
  try {
    await requireAdminSession();

    const settings = await ensureDefaultAiReportSettings();
    const prompts = await db
      .select()
      .from(aiReportPromptVersions)
      .orderBy(asc(aiReportPromptVersions.createdAt));

    return NextResponse.json({ settings, prompts });
  } catch (error) {
    return handleRouteError("Error fetching AI report settings", error);
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await requireAdminSession();

    const body = (await req.json()) as {
      model?: string;
      outputStrategy?: "json_schema" | "tool_strict";
      temperature?: number;
      maxOutputTokens?: number;
      inputTokenBudget?: number;
      language?: string;
      serviceTier?: string;
      useBackgroundMode?: boolean;
      usePromptCaching?: boolean;
      useStrictSchema?: boolean;
      schemaVersion?: string;
      masterPrompt?: string;
      promptExamples?: string | null;
    };

    const existing = await ensureDefaultAiReportSettings();
    const normalizedMaxOutputTokens =
      body.maxOutputTokens == null
        ? existing.maxOutputTokens
        : Math.max(0, Math.floor(body.maxOutputTokens));

    let promptVersionId = existing.promptVersionId ?? null;
    if (typeof body.masterPrompt === "string" && body.masterPrompt.trim()) {
      const [prompt] = await db
        .insert(aiReportPromptVersions)
        .values({
          id: `airp_${nanoid(12)}`,
          name: `Prompt ${new Date().toISOString()}`,
          template: body.masterPrompt.trim(),
          examples: body.promptExamples?.trim() || null,
          schemaVersion: body.schemaVersion ?? existing.schemaVersion,
          isActive: true,
          createdByUserId: session.user.id,
        })
        .returning();

      promptVersionId = prompt.id;
    }

    const [updated] = await db
      .update(aiReportSettings)
      .set({
        model: body.model ?? existing.model,
        outputStrategy: body.outputStrategy ?? (existing.outputStrategy as "json_schema" | "tool_strict"),
        temperature:
          body.temperature != null ? String(body.temperature) : (existing.temperature as unknown as string),
        maxOutputTokens: normalizedMaxOutputTokens,
        inputTokenBudget: body.inputTokenBudget ?? existing.inputTokenBudget,
        language: body.language ?? existing.language,
        serviceTier: body.serviceTier ?? existing.serviceTier,
        useBackgroundMode: body.useBackgroundMode ?? existing.useBackgroundMode,
        usePromptCaching: body.usePromptCaching ?? existing.usePromptCaching,
        useStrictSchema: body.useStrictSchema ?? existing.useStrictSchema,
        schemaVersion: body.schemaVersion ?? existing.schemaVersion,
        promptVersionId,
        updatedByUserId: session.user.id,
        updatedAt: new Date(),
      })
      .where(eq(aiReportSettings.id, existing.id))
      .returning();

    return NextResponse.json({ settings: updated });
  } catch (error) {
    return handleRouteError("Error updating AI report settings", error);
  }
}
