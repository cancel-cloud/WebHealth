ALTER TABLE "teams" ADD COLUMN IF NOT EXISTS "stripe_customer_id" text;
ALTER TABLE "teams" ADD COLUMN IF NOT EXISTS "stripe_subscription_id" text;
