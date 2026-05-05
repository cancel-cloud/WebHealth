CREATE TABLE "ai_runtime_settings" (
  "id" text PRIMARY KEY NOT NULL,
  "summary_model" text DEFAULT 'gpt-5.4-mini' NOT NULL,
  "analyzer_model" text DEFAULT 'gpt-5.5' NOT NULL,
  "max_output_tokens" integer DEFAULT 4096 NOT NULL,
  "updated_by_user_id" text,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "ai_runtime_settings" ADD CONSTRAINT "ai_runtime_settings_updated_by_user_id_user_id_fk" FOREIGN KEY ("updated_by_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
INSERT INTO "ai_runtime_settings" ("id", "summary_model", "analyzer_model", "max_output_tokens")
VALUES ('default', 'gpt-5.4-mini', 'gpt-5.5', 4096)
ON CONFLICT ("id") DO NOTHING;
