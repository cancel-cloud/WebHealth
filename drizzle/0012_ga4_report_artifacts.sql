CREATE TABLE "ga4_report_artifacts" (
  "id" text PRIMARY KEY NOT NULL,
  "team_id" text NOT NULL,
  "gsc_property_id" text,
  "ga4_property_id" text NOT NULL,
  "date_start" date NOT NULL,
  "date_end" date NOT NULL,
  "report_payload" jsonb NOT NULL,
  "fetched_at" timestamp DEFAULT now() NOT NULL,
  "sync_job_id" text,
  "created_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "ga4_report_artifacts_ga4_property_id_date_start_date_end_unique" UNIQUE("ga4_property_id","date_start","date_end")
);
--> statement-breakpoint
ALTER TABLE "ga4_report_artifacts" ADD CONSTRAINT "ga4_report_artifacts_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "ga4_report_artifacts" ADD CONSTRAINT "ga4_report_artifacts_gsc_property_id_properties_id_fk" FOREIGN KEY ("gsc_property_id") REFERENCES "public"."properties"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "ga4_report_artifacts" ADD CONSTRAINT "ga4_report_artifacts_sync_job_id_metrics_backfill_jobs_id_fk" FOREIGN KEY ("sync_job_id") REFERENCES "public"."metrics_backfill_jobs"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "ga4_report_artifacts_gsc_range_idx" ON "ga4_report_artifacts" USING btree ("gsc_property_id","date_start","date_end");
--> statement-breakpoint
CREATE INDEX "ga4_report_artifacts_team_fetched_idx" ON "ga4_report_artifacts" USING btree ("team_id","fetched_at");
