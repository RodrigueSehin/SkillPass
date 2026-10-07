-- Phase 4, step 4 (Business evaluations). Run after update-0013-job-offers.sql. Safe to run more than once.

CREATE TABLE IF NOT EXISTS "evaluations" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "created_by_id" UUID,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "skill" TEXT NOT NULL DEFAULT '',
    "type" TEXT NOT NULL DEFAULT 'TECHNICAL',
    "difficulty" TEXT NOT NULL DEFAULT 'INTERMEDIATE',
    "duration_minutes" INTEGER NOT NULL DEFAULT 45,
    "language" TEXT NOT NULL DEFAULT 'Français',
    "questions" JSONB NOT NULL DEFAULT '[]',
    "settings" JSONB NOT NULL DEFAULT '{}',
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "publish_at" TIMESTAMP(3),
    "share_token" TEXT NOT NULL DEFAULT replace(gen_random_uuid()::text, '-', ''),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "evaluations_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "evaluations_share_token_key" ON "evaluations"("share_token");
CREATE INDEX IF NOT EXISTS "evaluations_organization_id_idx" ON "evaluations"("organization_id");

CREATE TABLE IF NOT EXISTS "evaluation_attempts" (
    "id" UUID NOT NULL,
    "evaluation_id" UUID NOT NULL,
    "profile_id" UUID NOT NULL,
    "answers" JSONB NOT NULL DEFAULT '{}',
    "score" INTEGER,
    "passed" BOOLEAN,
    "status" TEXT NOT NULL DEFAULT 'IN_PROGRESS',
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "submitted_at" TIMESTAMP(3),
    CONSTRAINT "evaluation_attempts_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "evaluation_attempts_evaluation_id_idx" ON "evaluation_attempts"("evaluation_id");
CREATE INDEX IF NOT EXISTS "evaluation_attempts_profile_id_idx" ON "evaluation_attempts"("profile_id");

DO $$ BEGIN
  ALTER TABLE "evaluations" ADD CONSTRAINT "evaluations_organization_id_fkey"
    FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "evaluation_attempts" ADD CONSTRAINT "evaluation_attempts_evaluation_id_fkey"
    FOREIGN KEY ("evaluation_id") REFERENCES "evaluations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "evaluation_attempts" ADD CONSTRAINT "evaluation_attempts_profile_id_fkey"
    FOREIGN KEY ("profile_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Row Level Security: members read their organization's tests; a talent reads only their own attempts.
-- (The application itself goes through Prisma and checks membership in code.)
ALTER TABLE "evaluations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "evaluation_attempts" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "members read their evaluations" ON "evaluations";
CREATE POLICY "members read their evaluations" ON "evaluations" FOR SELECT
  USING (EXISTS (SELECT 1 FROM "organization_members" m WHERE m.organization_id = evaluations.organization_id AND m.profile_id = auth.uid()));

DROP POLICY IF EXISTS "owner reads own attempts" ON "evaluation_attempts";
CREATE POLICY "owner reads own attempts" ON "evaluation_attempts" FOR SELECT
  USING (profile_id = auth.uid());

DROP POLICY IF EXISTS "members read their organization attempts" ON "evaluation_attempts";
CREATE POLICY "members read their organization attempts" ON "evaluation_attempts" FOR SELECT
  USING (EXISTS (SELECT 1 FROM "evaluations" e JOIN "organization_members" m ON m.organization_id = e.organization_id
                 WHERE e.id = evaluation_attempts.evaluation_id AND m.profile_id = auth.uid()));
