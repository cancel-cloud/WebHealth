ALTER TABLE "property_page_registry" DROP CONSTRAINT IF EXISTS "property_page_registry_current_snapshot_id_crawl_page_snapshots_id_fk";
ALTER TABLE "property_page_registry" DROP CONSTRAINT IF EXISTS "property_page_registry_last_report_id_reports_id_fk";

UPDATE "property_page_registry" SET "current_snapshot_id" = NULL;

ALTER TABLE "property_page_registry" DROP COLUMN IF EXISTS "last_report_id";
ALTER TABLE "property_page_registry" ADD CONSTRAINT "property_page_registry_current_snapshot_id_property_crawl_snapshots_id_fk" FOREIGN KEY ("current_snapshot_id") REFERENCES "public"."property_crawl_snapshots"("id") ON DELETE set null ON UPDATE no action;

ALTER TABLE "user_settings" DROP COLUMN IF EXISTS "report_complete";
ALTER TABLE "user_settings" DROP COLUMN IF EXISTS "report_language";
ALTER TABLE "plan_settings" DROP COLUMN IF EXISTS "reports_per_month";
ALTER TABLE "plan_settings" DROP COLUMN IF EXISTS "details_per_month";

DROP TABLE IF EXISTS "report_detail_ai_expansions" CASCADE;
DROP TABLE IF EXISTS "report_job_events" CASCADE;
DROP TABLE IF EXISTS "report_jobs" CASCADE;
DROP TABLE IF EXISTS "report_recommendation_feedback" CASCADE;
DROP TABLE IF EXISTS "report_recommendation_states" CASCADE;
DROP TABLE IF EXISTS "weekly_review_runs" CASCADE;
DROP TABLE IF EXISTS "property_weekly_reviews" CASCADE;
DROP TABLE IF EXISTS "crawl_page_snapshots" CASCADE;
DROP TABLE IF EXISTS "crawls" CASCADE;
DROP TABLE IF EXISTS "ai_report_settings" CASCADE;
DROP TABLE IF EXISTS "ai_report_prompt_versions" CASCADE;
DROP TABLE IF EXISTS "team_usage" CASCADE;
DROP TABLE IF EXISTS "reports" CASCADE;
