import { eq } from "drizzle-orm";
import { db } from "@webhealth/shared/db";
import { aiRuntimeSettings } from "@webhealth/shared/db/schema";

export const AI_RUNTIME_SETTINGS_ID = "default";
export const DEFAULT_AI_MODEL = "gpt-5-mini";
export const DEFAULT_AI_SUMMARY_MODEL = DEFAULT_AI_MODEL;
export const DEFAULT_AI_ANALYZER_MODEL = DEFAULT_AI_MODEL;
export const DEFAULT_AI_MAX_OUTPUT_TOKENS = 128000;

export type AiRuntimeSettings = {
  id: string;
  summaryModel: string;
  analyzerModel: string;
  maxOutputTokens: number;
  updatedByUserId: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type AiRuntimeSettingsPatch = {
  summaryModel: string;
  analyzerModel: string;
  maxOutputTokens: number;
  updatedByUserId?: string | null;
};

function normalizeModel(value: string | null | undefined, fallback: string) {
  const trimmed = value?.trim();
  return trimmed || fallback;
}

function normalizeMaxOutputTokens(value: number | null | undefined) {
  if (typeof value !== "number" || !Number.isFinite(value)) return DEFAULT_AI_MAX_OUTPUT_TOKENS;
  return Math.min(DEFAULT_AI_MAX_OUTPUT_TOKENS, Math.max(512, Math.trunc(value)));
}

export async function ensureAiRuntimeSettings() {
  const existing = await db.query.aiRuntimeSettings.findFirst({
    where: eq(aiRuntimeSettings.id, AI_RUNTIME_SETTINGS_ID),
  });
  if (existing) return existing;

  const [created] = await db
    .insert(aiRuntimeSettings)
    .values({
      id: AI_RUNTIME_SETTINGS_ID,
      summaryModel: DEFAULT_AI_SUMMARY_MODEL,
      analyzerModel: DEFAULT_AI_ANALYZER_MODEL,
      maxOutputTokens: DEFAULT_AI_MAX_OUTPUT_TOKENS,
    })
    .onConflictDoNothing()
    .returning();

  if (created) return created;

  return db.query.aiRuntimeSettings.findFirst({
    where: eq(aiRuntimeSettings.id, AI_RUNTIME_SETTINGS_ID),
  });
}

export async function getAiRuntimeSettings(): Promise<AiRuntimeSettings> {
  const settings = await ensureAiRuntimeSettings();

  return {
    id: settings?.id ?? AI_RUNTIME_SETTINGS_ID,
    summaryModel: normalizeModel(settings?.summaryModel, DEFAULT_AI_SUMMARY_MODEL),
    analyzerModel: normalizeModel(settings?.analyzerModel, DEFAULT_AI_ANALYZER_MODEL),
    maxOutputTokens: normalizeMaxOutputTokens(settings?.maxOutputTokens),
    updatedByUserId: settings?.updatedByUserId ?? null,
    createdAt: settings?.createdAt ?? new Date(),
    updatedAt: settings?.updatedAt ?? new Date(),
  };
}

export async function updateAiRuntimeSettings(patch: AiRuntimeSettingsPatch): Promise<AiRuntimeSettings> {
  const now = new Date();
  const [row] = await db
    .insert(aiRuntimeSettings)
    .values({
      id: AI_RUNTIME_SETTINGS_ID,
      summaryModel: normalizeModel(patch.summaryModel, DEFAULT_AI_SUMMARY_MODEL),
      analyzerModel: normalizeModel(patch.analyzerModel, DEFAULT_AI_ANALYZER_MODEL),
      maxOutputTokens: normalizeMaxOutputTokens(patch.maxOutputTokens),
      updatedByUserId: patch.updatedByUserId ?? null,
      createdAt: now,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: aiRuntimeSettings.id,
      set: {
        summaryModel: normalizeModel(patch.summaryModel, DEFAULT_AI_SUMMARY_MODEL),
        analyzerModel: normalizeModel(patch.analyzerModel, DEFAULT_AI_ANALYZER_MODEL),
        maxOutputTokens: normalizeMaxOutputTokens(patch.maxOutputTokens),
        updatedByUserId: patch.updatedByUserId ?? null,
        updatedAt: now,
      },
    })
    .returning();

  return {
    id: row.id,
    summaryModel: row.summaryModel,
    analyzerModel: row.analyzerModel,
    maxOutputTokens: row.maxOutputTokens,
    updatedByUserId: row.updatedByUserId ?? null,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}
