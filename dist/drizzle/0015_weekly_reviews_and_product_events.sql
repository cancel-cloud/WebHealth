ALTER TABLE "reports" ADD COLUMN IF NOT EXISTS "source" text DEFAULT 'manual' NOT NULL;
--> statement-breakpoint
ALTER TABLE "reports" ADD COLUMN IF NOT EXISTS "auto_run_key" text;
--> statement-breakpoint
ALTER TABLE "reports" ADD COLUMN IF NOT EXISTS "weekly_review_findings" jsonb;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "property_weekly_reviews" (
  "id" text PRIMARY KEY NOT NULL,
  "team_id" text NOT NULL,
  "property_id" text NOT NULL,
  "enabled" boolean DEFAULT true NOT NULL,
  "created_by_user_id" text,
  "last_run_at" timestamp,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "property_weekly_reviews_team_id_property_id_unique" UNIQUE("team_id","property_id")
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "property_weekly_reviews_team_id_property_id_unique" ON "property_weekly_reviews" USING btree ("team_id","property_id");
--> statement-breakpoint
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'property_weekly_reviews_team_id_teams_id_fk'
  ) THEN
    ALTER TABLE "property_weekly_reviews" ADD CONSTRAINT "property_weekly_reviews_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;
  END IF;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'property_weekly_reviews_property_id_properties_id_fk'
  ) THEN
    ALTER TABLE "property_weekly_reviews" ADD CONSTRAINT "property_weekly_reviews_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE cascade ON UPDATE no action;
  END IF;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'property_weekly_reviews_created_by_user_id_user_id_fk'
  ) THEN
    ALTER TABLE "property_weekly_reviews" ADD CONSTRAINT "property_weekly_reviews_created_by_user_id_user_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;
  END IF;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "property_weekly_reviews_team_enabled_idx" ON "property_weekly_reviews" USING btree ("team_id","enabled");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "weekly_review_runs" (
  "id" text PRIMARY KEY NOT NULL,
  "team_id" text NOT NULL,
  "property_id" text NOT NULL,
  "report_id" text,
  "run_key" text NOT NULL,
  "status" text DEFAULT 'queued' NOT NULL,
  "skip_reason" text,
  "date_range_start" date NOT NULL,
  "date_range_end" date NOT NULL,
  "compare_range_start" date NOT NULL,
  "compare_range_end" date NOT NULL,
  "actionable_count" integer DEFAULT 0 NOT NULL,
  "notification_seen_at" timestamp,
  "completed_at" timestamp,
  "error" text,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "weekly_review_runs_team_id_property_id_run_key_unique" UNIQUE("team_id","property_id","run_key")
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "weekly_review_runs_team_id_property_id_run_key_unique" ON "weekly_review_runs" USING btree ("team_id","property_id","run_key");
--> statement-breakpoint
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'weekly_review_runs_team_id_teams_id_fk'
  ) THEN
    ALTER TABLE "weekly_review_runs" ADD CONSTRAINT "weekly_review_runs_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;
  END IF;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'weekly_review_runs_property_id_properties_id_fk'
  ) THEN
    ALTER TABLE "weekly_review_runs" ADD CONSTRAINT "weekly_review_runs_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE cascade ON UPDATE no action;
  END IF;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'weekly_review_runs_report_id_reports_id_fk'
  ) THEN
    ALTER TABLE "weekly_review_runs" ADD CONSTRAINT "weekly_review_runs_report_id_reports_id_fk" FOREIGN KEY ("report_id") REFERENCES "public"."reports"("id") ON DELETE set null ON UPDATE no action;
  END IF;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "weekly_review_runs_team_created_idx" ON "weekly_review_runs" USING btree ("team_id","created_at");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "weekly_review_runs_report_idx" ON "weekly_review_runs" USING btree ("report_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "weekly_review_runs_status_created_idx" ON "weekly_review_runs" USING btree ("status","created_at");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "product_events" (
  "id" text PRIMARY KEY NOT NULL,
  "team_id" text NOT NULL,
  "user_id" text,
  "name" text NOT NULL,
  "source" text NOT NULL,
  "entity_type" text,
  "entity_id" text,
  "properties" jsonb,
  "created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'product_events_team_id_teams_id_fk'
  ) THEN
    ALTER TABLE "product_events" ADD CONSTRAINT "product_events_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;
  END IF;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'product_events_user_id_user_id_fk'
  ) THEN
    ALTER TABLE "product_events" ADD CONSTRAINT "product_events_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;
  END IF;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "product_events_team_created_idx" ON "product_events" USING btree ("team_id","created_at");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "product_events_name_created_idx" ON "product_events" USING btree ("name","created_at");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "product_events_user_created_idx" ON "product_events" USING btree ("user_id","created_at");
