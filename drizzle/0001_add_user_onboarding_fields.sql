ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "onboarding_completed_at" timestamp;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "onboarding_completion_reason" text;
