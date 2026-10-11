-- Platform administration: company validation and the administrator's audit log.
-- Run after update-0018-profile-settings.sql. Safe to run more than once.

-- Companies that already exist keep working: they are created as VERIFIED. Companies created from now on
-- start PENDING and wait for the SkillPass administrator.
ALTER TABLE "organizations"
  ADD COLUMN IF NOT EXISTS "verification_status" TEXT NOT NULL DEFAULT 'VERIFIED',
  ADD COLUMN IF NOT EXISTS "verification_note" TEXT,
  ADD COLUMN IF NOT EXISTS "rejection_reason" TEXT,
  ADD COLUMN IF NOT EXISTS "verified_at" TIMESTAMP(3);
ALTER TABLE "organizations" ALTER COLUMN "verification_status" SET DEFAULT 'PENDING';
UPDATE "organizations" SET "verified" = true WHERE "verification_status" = 'VERIFIED' AND "verified" = false;

CREATE TABLE IF NOT EXISTS "admin_audit_log" (
    "id" UUID NOT NULL,
    "actor_id" UUID,
    "actor_name" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "target_type" TEXT NOT NULL,
    "target_id" TEXT,
    "target_label" TEXT NOT NULL DEFAULT '',
    "detail" TEXT NOT NULL DEFAULT '',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "admin_audit_log_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "admin_audit_log_created_at_idx" ON "admin_audit_log"("created_at");

-- Only the application (service connection) reads this table: no policy for the Supabase API.
ALTER TABLE "admin_audit_log" ENABLE ROW LEVEL SECURITY;

-- First SkillPass administrator: replace the e-mail with yours, then run this line once.
-- UPDATE "profiles" SET "role" = 'SKILLPASS_ADMIN' WHERE "email" = 'vous@exemple.com';
