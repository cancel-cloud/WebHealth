CREATE TABLE IF NOT EXISTS "feedback_submissions" (
  "id" text PRIMARY KEY NOT NULL,
  "team_id" text,
  "user_id" text,
  "user_name_snapshot" text NOT NULL,
  "email_snapshot" text NOT NULL,
  "type" text NOT NULL,
  "source" text NOT NULL,
  "message" text NOT NULL,
  "status" text DEFAULT 'open' NOT NULL,
  "resolved_at" timestamp,
  "resolved_by_user_id" text,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'feedback_submissions_team_id_teams_id_fk'
  ) THEN
    ALTER TABLE "feedback_submissions" ADD CONSTRAINT "feedback_submissions_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE set null ON UPDATE no action;
  END IF;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'feedback_submissions_user_id_user_id_fk'
  ) THEN
    ALTER TABLE "feedback_submissions" ADD CONSTRAINT "feedback_submissions_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;
  END IF;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'feedback_submissions_resolved_by_user_id_user_id_fk'
  ) THEN
    ALTER TABLE "feedback_submissions" ADD CONSTRAINT "feedback_submissions_resolved_by_user_id_user_id_fk" FOREIGN KEY ("resolved_by_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;
  END IF;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "feedback_submissions_status_created_idx" ON "feedback_submissions" USING btree ("status","created_at");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "feedback_submissions_team_created_idx" ON "feedback_submissions" USING btree ("team_id","created_at");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "feedback_submissions_user_created_idx" ON "feedback_submissions" USING btree ("user_id","created_at");
