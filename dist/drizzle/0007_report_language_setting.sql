ALTER TABLE "user_settings"
ADD COLUMN IF NOT EXISTS "report_language" text DEFAULT 'auto' NOT NULL;
