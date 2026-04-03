-- Add country and device payload columns to gsc_daily_raw for batch fetch
ALTER TABLE "gsc_daily_raw" ADD COLUMN "countries_payload" jsonb;
ALTER TABLE "gsc_daily_raw" ADD COLUMN "devices_payload" jsonb;

-- Add new_users to ga4_daily_facts
ALTER TABLE "ga4_daily_facts" ADD COLUMN "new_users" integer DEFAULT 0 NOT NULL;
