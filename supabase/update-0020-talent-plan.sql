-- Talent plans (Free / Pro): what an account can use depends on its plan.
-- Run after update-0019-platform-admin.sql. Safe to run more than once.
ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "plan" TEXT NOT NULL DEFAULT 'FREE';
