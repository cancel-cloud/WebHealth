ALTER TABLE "user_settings" ADD COLUMN IF NOT EXISTS "preferred_language" text;--> statement-breakpoint
ALTER TABLE "user_settings" ADD COLUMN IF NOT EXISTS "preferred_language_source" text;--> statement-breakpoint
ALTER TABLE "snapshot_exports" ADD COLUMN IF NOT EXISTS "language" text DEFAULT 'de' NOT NULL;--> statement-breakpoint
ALTER TABLE "property_share_links" ADD COLUMN IF NOT EXISTS "language" text DEFAULT 'de' NOT NULL;
