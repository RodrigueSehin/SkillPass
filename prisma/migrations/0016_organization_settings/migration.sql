-- Phase 4, step 7: organization settings and deactivation.
ALTER TABLE "organizations"
  ADD COLUMN IF NOT EXISTS "settings" JSONB NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS "deactivated_at" TIMESTAMP(3);