ALTER TABLE "ai_report_settings"
ADD COLUMN IF NOT EXISTS "use_strict_schema" boolean DEFAULT true NOT NULL;
