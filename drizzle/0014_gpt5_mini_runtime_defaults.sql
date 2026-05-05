ALTER TABLE "ai_runtime_settings" ALTER COLUMN "summary_model" SET DEFAULT 'gpt-5-mini';
--> statement-breakpoint
ALTER TABLE "ai_runtime_settings" ALTER COLUMN "analyzer_model" SET DEFAULT 'gpt-5-mini';
--> statement-breakpoint
ALTER TABLE "ai_runtime_settings" ALTER COLUMN "max_output_tokens" SET DEFAULT 128000;
--> statement-breakpoint
UPDATE "ai_runtime_settings"
SET
  "summary_model" = 'gpt-5-mini',
  "analyzer_model" = 'gpt-5-mini',
  "max_output_tokens" = GREATEST("max_output_tokens", 128000),
  "updated_at" = now()
WHERE "id" = 'default';
