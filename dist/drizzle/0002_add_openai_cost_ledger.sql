CREATE TABLE IF NOT EXISTS "openai_cost_ledger" (
	"id" text PRIMARY KEY NOT NULL,
	"ai_run_id" text NOT NULL,
	"team_id" text NOT NULL,
	"property_id" text NOT NULL,
	"refresh_job_id" text,
	"call_purpose" text NOT NULL,
	"model" text NOT NULL,
	"request_id" text,
	"outcome" text DEFAULT 'succeeded' NOT NULL,
	"input_tokens" integer DEFAULT 0 NOT NULL,
	"output_tokens" integer DEFAULT 0 NOT NULL,
	"total_tokens" integer DEFAULT 0 NOT NULL,
	"cached_input_tokens" integer DEFAULT 0 NOT NULL,
	"reasoning_tokens" integer DEFAULT 0 NOT NULL,
	"usage_snapshot" jsonb NOT NULL,
	"cost_estimate_usd" numeric(14, 6) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "openai_cost_ledger" ADD CONSTRAINT "openai_cost_ledger_ai_run_id_ai_analysis_runs_id_fk" FOREIGN KEY ("ai_run_id") REFERENCES "public"."ai_analysis_runs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "openai_cost_ledger" ADD CONSTRAINT "openai_cost_ledger_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "openai_cost_ledger" ADD CONSTRAINT "openai_cost_ledger_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "openai_cost_ledger" ADD CONSTRAINT "openai_cost_ledger_refresh_job_id_property_refresh_jobs_id_fk" FOREIGN KEY ("refresh_job_id") REFERENCES "public"."property_refresh_jobs"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "openai_cost_ledger_run_outcome_idx" ON "openai_cost_ledger" USING btree ("ai_run_id","outcome","created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "openai_cost_ledger_team_created_idx" ON "openai_cost_ledger" USING btree ("team_id","created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "openai_cost_ledger_property_created_idx" ON "openai_cost_ledger" USING btree ("property_id","created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "openai_cost_ledger_request_idx" ON "openai_cost_ledger" USING btree ("request_id");
