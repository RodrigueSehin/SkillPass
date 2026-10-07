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
