ALTER TABLE "action_items" ADD COLUMN IF NOT EXISTS "language" text DEFAULT 'de' NOT NULL;--> statement-breakpoint
ALTER TABLE "ai_analysis_runs" ADD COLUMN IF NOT EXISTS "language" text DEFAULT 'de' NOT NULL;--> statement-breakpoint
ALTER TABLE "ai_recommendations" ADD COLUMN IF NOT EXISTS "language" text DEFAULT 'de' NOT NULL;
