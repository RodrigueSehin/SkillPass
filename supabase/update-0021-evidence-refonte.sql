-- Refonte "Preuves" (assistant en 4 étapes, plusieurs fichiers, plusieurs compétences, brouillons).
-- Run after update-0020-talent-plan.sql. Safe to run more than once.
-- Nouveaux types de preuve : si votre éditeur SQL refuse ALTER TYPE dans un bloc, exécutez ces deux lignes seules d'abord.
ALTER TYPE "EvidenceType" ADD VALUE IF NOT EXISTS 'DEMO';
ALTER TYPE "EvidenceType" ADD VALUE IF NOT EXISTS 'OTHER';

ALTER TABLE "skill_evidence" ADD COLUMN IF NOT EXISTS "organization" TEXT;
ALTER TABLE "skill_evidence" ADD COLUMN IF NOT EXISTS "role" TEXT;
ALTER TABLE "skill_evidence" ADD COLUMN IF NOT EXISTS "start_date" TIMESTAMP(3);
ALTER TABLE "skill_evidence" ADD COLUMN IF NOT EXISTS "end_date" TIMESTAMP(3);
ALTER TABLE "skill_evidence" ADD COLUMN IF NOT EXISTS "technologies" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "skill_evidence" ADD COLUMN IF NOT EXISTS "tags" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "skill_evidence" ADD COLUMN IF NOT EXISTS "category" TEXT;
ALTER TABLE "skill_evidence" ADD COLUMN IF NOT EXISTS "visibility" TEXT NOT NULL DEFAULT 'PUBLIC';
ALTER TABLE "skill_evidence" ADD COLUMN IF NOT EXISTS "published" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "skill_evidence" ADD COLUMN IF NOT EXISTS "allow_contact" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "skill_evidence" ADD COLUMN IF NOT EXISTS "allow_recommendations" BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS "evidence_files" (
    "id" UUID NOT NULL,
    "evidence_id" UUID NOT NULL,
    "file_path" TEXT NOT NULL,
    "file_name" TEXT NOT NULL,
    "mime_type" TEXT NOT NULL,
    "size_bytes" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "evidence_files_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "evidence_files_evidence_id_idx" ON "evidence_files"("evidence_id");

CREATE TABLE IF NOT EXISTS "evidence_skills" (
    "evidence_id" UUID NOT NULL,
    "talent_skill_id" UUID NOT NULL,
    CONSTRAINT "evidence_skills_pkey" PRIMARY KEY ("evidence_id", "talent_skill_id")
);
CREATE INDEX IF NOT EXISTS "evidence_skills_talent_skill_id_idx" ON "evidence_skills"("talent_skill_id");

DO $$ BEGIN
  ALTER TABLE "evidence_files" ADD CONSTRAINT "evidence_files_evidence_id_fkey"
    FOREIGN KEY ("evidence_id") REFERENCES "skill_evidence"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "evidence_skills" ADD CONSTRAINT "evidence_skills_evidence_id_fkey"
    FOREIGN KEY ("evidence_id") REFERENCES "skill_evidence"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "evidence_skills" ADD CONSTRAINT "evidence_skills_talent_skill_id_fkey"
    FOREIGN KEY ("talent_skill_id") REFERENCES "talent_skills"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Les fichiers déjà envoyés (un seul par preuve, ancien format) passent dans la nouvelle table.
INSERT INTO "evidence_files" ("id", "evidence_id", "file_path", "file_name", "mime_type", "size_bytes")
SELECT gen_random_uuid(), e."id", e."file_path", COALESCE(e."file_name", 'fichier'), COALESCE(e."mime_type", 'application/octet-stream'), COALESCE(e."size_bytes", 0)
FROM "skill_evidence" e
WHERE e."file_path" IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM "evidence_files" f WHERE f."file_path" = e."file_path");

-- Chaque preuve existante est rattachée à sa compétence principale.
INSERT INTO "evidence_skills" ("evidence_id", "talent_skill_id")
SELECT e."id", e."talent_skill_id" FROM "skill_evidence" e
ON CONFLICT DO NOTHING;

-- Row Level Security: owners only, through the Supabase API (the app itself goes through Prisma).
ALTER TABLE "evidence_files" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "owner reads own evidence_files" ON "evidence_files";
CREATE POLICY "owner reads own evidence_files" ON "evidence_files" FOR SELECT
  USING (EXISTS (SELECT 1 FROM "skill_evidence" e WHERE e.id = evidence_files.evidence_id AND e.profile_id = auth.uid()));
ALTER TABLE "evidence_skills" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "owner reads own evidence_skills" ON "evidence_skills";
CREATE POLICY "owner reads own evidence_skills" ON "evidence_skills" FOR SELECT
  USING (EXISTS (SELECT 1 FROM "skill_evidence" e WHERE e.id = evidence_skills.evidence_id AND e.profile_id = auth.uid()));
