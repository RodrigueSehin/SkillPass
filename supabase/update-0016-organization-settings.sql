-- Phase 4, step 7 (Business settings and subscription). Run after update-0015-organization-skills.sql. Safe to run more than once.

ALTER TABLE "organizations"
  ADD COLUMN IF NOT EXISTS "settings" JSONB NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS "deactivated_at" TIMESTAMP(3);