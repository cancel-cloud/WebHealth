CREATE TABLE IF NOT EXISTS "admin_emails" (
  "id" text PRIMARY KEY NOT NULL,
  "email" text NOT NULL,
  "created_by_user_id" text,
  "created_at" timestamp DEFAULT now() NOT NULL
);

ALTER TABLE "admin_emails"
  ADD CONSTRAINT "admin_emails_created_by_user_id_user_id_fk"
  FOREIGN KEY ("created_by_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;

CREATE UNIQUE INDEX IF NOT EXISTS "admin_emails_email_unique"
  ON "admin_emails" ("email");

INSERT INTO "admin_emails" ("id", "email")
SELECT 'admin_seed_lukas', 'lukas@devbrew.dev'
WHERE NOT EXISTS (
  SELECT 1 FROM "admin_emails" WHERE "email" = 'lukas@devbrew.dev'
);
