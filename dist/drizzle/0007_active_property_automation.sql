ALTER TABLE "metrics_backfill_jobs"
  ADD COLUMN "trigger_source" text DEFAULT 'manual' NOT NULL,
  ADD COLUMN "available_at" timestamp DEFAULT now() NOT NULL,
  ADD COLUMN "attempts" integer DEFAULT 0 NOT NULL,
  ADD COLUMN "max_attempts" integer DEFAULT 2 NOT NULL,
  ADD COLUMN "claimed_by" text,
  ADD COLUMN "claimed_at" timestamp,
  ADD COLUMN "claim_expires_at" timestamp,
  ADD COLUMN "heartbeat_at" timestamp;
--> statement-breakpoint
CREATE INDEX "metrics_backfill_jobs_status_available_idx" ON "metrics_backfill_jobs" USING btree ("status","available_at","created_at");
