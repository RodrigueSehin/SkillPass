-- SkillPass Business, everything in one go: organizations, job offers, evaluations, skills referential, settings.
-- Run it once in the Supabase SQL editor, after supabase/update-0003-0010.sql. Safe to run more than once.

-- ============================================================ update-0012-business-organization.sql
-- Phase 4, step 1 (SkillPass Business: organizations, members, departments, sites).
-- Run it in the Supabase SQL editor after supabase/update-0003-0010.sql. Safe to run more than once.

-- SkillPass Business: organizations, members, departments, sites.
CREATE TABLE IF NOT EXISTS "organizations" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "industry" TEXT,
    "size" TEXT,
    "website" TEXT,
    "address" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "timezone" TEXT NOT NULL DEFAULT 'Africa/Abidjan',
    "language" TEXT NOT NULL DEFAULT 'fr',
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "plan" TEXT NOT NULL DEFAULT 'BUSINESS',
    "logo_path" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "organizations_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "organizations_slug_key" ON "organizations"("slug");

CREATE TABLE IF NOT EXISTS "organization_members" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "profile_id" UUID,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "job_title" TEXT,
    "role" TEXT NOT NULL DEFAULT 'VIEWER',
    "permissions" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "status" TEXT NOT NULL DEFAULT 'INVITED',
    "site_id" UUID,
    "manager_id" UUID,
    "invitation_message" TEXT,
    "invite_token" TEXT,
    "invite_expires_at" TIMESTAMP(3),
    "invited_at" TIMESTAMP(3),
    "last_active_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "organization_members_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "organization_members_invite_token_key" ON "organization_members"("invite_token");
CREATE UNIQUE INDEX IF NOT EXISTS "organization_members_organization_id_email_key" ON "organization_members"("organization_id", "email");
CREATE UNIQUE INDEX IF NOT EXISTS "organization_members_organization_id_profile_id_key" ON "organization_members"("organization_id", "profile_id");
CREATE INDEX IF NOT EXISTS "organization_members_profile_id_idx" ON "organization_members"("profile_id");

CREATE TABLE IF NOT EXISTS "sites" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "sites_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "sites_organization_id_idx" ON "sites"("organization_id");

CREATE TABLE IF NOT EXISTS "departments" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "look" TEXT NOT NULL DEFAULT 'users',
    "parent_id" UUID,
    "main_site_id" UUID,
    "site_ids" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "objectives" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "access_level" TEXT NOT NULL DEFAULT 'LIMITED',
    "head_id" UUID,
    "replacement_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "departments_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "departments_organization_id_idx" ON "departments"("organization_id");

CREATE TABLE IF NOT EXISTS "department_members" (
    "department_id" UUID NOT NULL,
    "member_id" UUID NOT NULL,
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "role" TEXT NOT NULL DEFAULT 'Membre',
    CONSTRAINT "department_members_pkey" PRIMARY KEY ("department_id","member_id")
);
CREATE INDEX IF NOT EXISTS "department_members_member_id_idx" ON "department_members"("member_id");

CREATE TABLE IF NOT EXISTS "department_deputies" (
    "department_id" UUID NOT NULL,
    "member_id" UUID NOT NULL,
    "level" TEXT NOT NULL DEFAULT 'DEPUTY',
    CONSTRAINT "department_deputies_pkey" PRIMARY KEY ("department_id","member_id")
);
CREATE INDEX IF NOT EXISTS "department_deputies_member_id_idx" ON "department_deputies"("member_id");

DO $$ BEGIN
  ALTER TABLE "organization_members" ADD CONSTRAINT "organization_members_organization_id_fkey"
    FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "organization_members" ADD CONSTRAINT "organization_members_profile_id_fkey"
    FOREIGN KEY ("profile_id") REFERENCES "profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "sites" ADD CONSTRAINT "sites_organization_id_fkey"
    FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "departments" ADD CONSTRAINT "departments_organization_id_fkey"
    FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "department_members" ADD CONSTRAINT "department_members_department_id_fkey"
    FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "department_members" ADD CONSTRAINT "department_members_member_id_fkey"
    FOREIGN KEY ("member_id") REFERENCES "organization_members"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "department_deputies" ADD CONSTRAINT "department_deputies_department_id_fkey"
    FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "department_deputies" ADD CONSTRAINT "department_deputies_member_id_fkey"
    FOREIGN KEY ("member_id") REFERENCES "organization_members"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Row Level Security: only the members of an organization can read its rows through the Supabase API.
-- (The application itself goes through Prisma and checks membership in code.)
ALTER TABLE "organizations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "organization_members" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "sites" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "departments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "department_members" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "department_deputies" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "members read their organization" ON "organizations";
CREATE POLICY "members read their organization" ON "organizations" FOR SELECT
  USING (EXISTS (SELECT 1 FROM "organization_members" m WHERE m.organization_id = id AND m.profile_id = auth.uid()));

DROP POLICY IF EXISTS "members read colleagues" ON "organization_members";
CREATE POLICY "members read colleagues" ON "organization_members" FOR SELECT
  USING (profile_id = auth.uid() OR EXISTS (
    SELECT 1 FROM "organization_members" m WHERE m.organization_id = organization_members.organization_id AND m.profile_id = auth.uid()));

DROP POLICY IF EXISTS "members read sites" ON "sites";
CREATE POLICY "members read sites" ON "sites" FOR SELECT
  USING (EXISTS (SELECT 1 FROM "organization_members" m WHERE m.organization_id = sites.organization_id AND m.profile_id = auth.uid()));

DROP POLICY IF EXISTS "members read departments" ON "departments";
CREATE POLICY "members read departments" ON "departments" FOR SELECT
  USING (EXISTS (SELECT 1 FROM "organization_members" m WHERE m.organization_id = departments.organization_id AND m.profile_id = auth.uid()));

DROP POLICY IF EXISTS "members read department members" ON "department_members";
CREATE POLICY "members read department members" ON "department_members" FOR SELECT
  USING (EXISTS (SELECT 1 FROM "departments" d JOIN "organization_members" m ON m.organization_id = d.organization_id
                 WHERE d.id = department_members.department_id AND m.profile_id = auth.uid()));

DROP POLICY IF EXISTS "members read department deputies" ON "department_deputies";
CREATE POLICY "members read department deputies" ON "department_deputies" FOR SELECT
  USING (EXISTS (SELECT 1 FROM "departments" d JOIN "organization_members" m ON m.organization_id = d.organization_id
                 WHERE d.id = department_deputies.department_id AND m.profile_id = auth.uid()));


-- ============================================================ update-0013-job-offers.sql
-- Phase 4, step 2 (Business job offers). Run after update-0012-business-organization.sql. Safe to run more than once.

-- Phase 4, step 2: job offers published by organizations.
ALTER TABLE "opportunities"
  ADD COLUMN IF NOT EXISTS "source_offer_id" UUID,
  ADD COLUMN IF NOT EXISTS "active" BOOLEAN NOT NULL DEFAULT true;
CREATE UNIQUE INDEX IF NOT EXISTS "opportunities_source_offer_id_key" ON "opportunities"("source_offer_id");

CREATE TABLE IF NOT EXISTS "job_offers" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "created_by_id" UUID,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "contract" TEXT NOT NULL DEFAULT 'CDI',
    "location" TEXT NOT NULL DEFAULT '',
    "work_mode" TEXT,
    "department_id" UUID,
    "experience" TEXT NOT NULL DEFAULT '1 à 3 ans',
    "positions" INTEGER NOT NULL DEFAULT 1,
    "deadline" DATE,
    "salary_min" INTEGER,
    "salary_max" INTEGER,
    "currency" TEXT NOT NULL DEFAULT 'FCFA',
    "skills" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "soft_skills" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "certifications" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "education" TEXT,
    "languages" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "other_language" TEXT,
    "permit" TEXT,
    "mobility" TEXT NOT NULL DEFAULT 'NONE',
    "availability" TEXT NOT NULL DEFAULT 'ASAP',
    "visibility" TEXT NOT NULL DEFAULT 'PUBLIC',
    "publish_on" DATE,
    "duration_months" INTEGER NOT NULL DEFAULT 2,
    "channels" TEXT[] DEFAULT ARRAY['PLATFORM']::TEXT[],
    "application_mode" TEXT NOT NULL DEFAULT 'SIMPLE',
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "opportunity_id" UUID,
    "published_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "job_offers_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "job_offers_organization_id_idx" ON "job_offers"("organization_id");

DO $$ BEGIN
  ALTER TABLE "job_offers" ADD CONSTRAINT "job_offers_organization_id_fkey"
    FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE "job_offers" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "members read their job offers" ON "job_offers";
CREATE POLICY "members read their job offers" ON "job_offers" FOR SELECT
  USING (EXISTS (SELECT 1 FROM "organization_members" m WHERE m.organization_id = job_offers.organization_id AND m.profile_id = auth.uid()));


-- ============================================================ update-0014-evaluations.sql
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


-- ============================================================ update-0015-organization-skills.sql
-- Phase 4, step 5 (Business skills referential). Run after update-0014-evaluations.sql. Safe to run more than once.

CREATE TABLE IF NOT EXISTS "organization_skills" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "name_key" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "kind" TEXT NOT NULL DEFAULT 'TECHNICAL',
    "description" TEXT NOT NULL DEFAULT '',
    "keywords" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "synonyms" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "organization_skills_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "organization_skills_organization_id_name_key_key" ON "organization_skills"("organization_id", "name_key");

DO $$ BEGIN
  ALTER TABLE "organization_skills" ADD CONSTRAINT "organization_skills_organization_id_fkey"
    FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Row Level Security: members read their organization's skills through the Supabase API.
-- (The application itself goes through Prisma and checks membership in code.)
ALTER TABLE "organization_skills" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "members read their skills" ON "organization_skills";
CREATE POLICY "members read their skills" ON "organization_skills" FOR SELECT
  USING (EXISTS (SELECT 1 FROM "organization_members" m WHERE m.organization_id = organization_skills.organization_id AND m.profile_id = auth.uid()));

-- ============================================================ update-0016-organization-settings.sql
-- Phase 4, step 7 (Business settings and subscription). Run after update-0015-organization-skills.sql. Safe to run more than once.

ALTER TABLE "organizations"
  ADD COLUMN IF NOT EXISTS "settings" JSONB NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS "deactivated_at" TIMESTAMP(3);

