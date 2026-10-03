-- SkillPass — schéma complet (Phases 2 et 3). À exécuter UNE fois dans Supabase → SQL Editor, sur une base vierge.
-- Déjà exécuté (même en partie) ? Lancez d'abord supabase/reset.sql.

-- Garde : ce script crée le schéma depuis zéro. S'il est déjà (même partiellement) installé, on s'arrête
-- avec un message clair au lieu d'échouer au milieu. Dans ce cas : exécuter supabase/reset.sql d'abord.
do $$
begin
  if exists (select 1 from pg_type where typname = 'UserRole')
     or to_regclass('public.profiles') is not null then
    raise exception 'SkillPass est déjà (au moins partiellement) installé. Exécutez supabase/reset.sql, puis relancez ce script.';
  end if;
end $$;

-- Partie 1 : tables, enums, index, clés étrangères (générée depuis prisma/schema.prisma).

-- CreateSchema

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('TALENT', 'RECRUITER', 'MANAGER', 'EVALUATOR', 'TRAINER', 'COMPANY_ADMIN', 'ACADEMY_ADMIN', 'SKILLPASS_ADMIN', 'VERIFIER');

-- CreateEnum
CREATE TYPE "SkillLevel" AS ENUM ('BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT');

-- CreateEnum
CREATE TYPE "SkillVerificationStatus" AS ENUM ('UNVERIFIED', 'PENDING', 'VERIFIED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "CertificationVerificationStatus" AS ENUM ('UNVERIFIED', 'PENDING', 'VERIFIED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "Availability" AS ENUM ('IMMEDIATE', 'ONE_MONTH', 'THREE_MONTHS', 'NOT_AVAILABLE');

-- CreateEnum
CREATE TYPE "EvidenceType" AS ENUM ('PROJECT', 'CERTIFICATION', 'DOCUMENT', 'SCREENSHOT', 'LINK', 'REPOSITORY', 'PORTFOLIO', 'ASSESSMENT', 'RECOMMENDATION', 'EXPERIENCE');

-- CreateEnum
CREATE TYPE "EvidenceVerificationStatus" AS ENUM ('UNVERIFIED', 'PENDING', 'VERIFIED');

-- CreateTable
CREATE TABLE "profiles" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "full_name" TEXT NOT NULL,
    "headline" TEXT,
    "bio" TEXT,
    "location" TEXT,
    "avatar_url" TEXT,
    "profession" TEXT,
    "years_of_experience" INTEGER NOT NULL DEFAULT 0,
    "career_goal" TEXT,
    "availability" "Availability" NOT NULL DEFAULT 'IMMEDIATE',
    "role" "UserRole" NOT NULL DEFAULT 'TALENT',
    "is_public" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "skill_categories" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,

    CONSTRAINT "skill_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "skills" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "category_id" UUID,

    CONSTRAINT "skills_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "talent_skills" (
    "id" UUID NOT NULL,
    "profile_id" UUID NOT NULL,
    "skill_id" UUID NOT NULL,
    "level" "SkillLevel" NOT NULL DEFAULT 'BEGINNER',
    "score" INTEGER NOT NULL DEFAULT 0,
    "years_of_experience" INTEGER NOT NULL DEFAULT 0,
    "verification_status" "SkillVerificationStatus" NOT NULL DEFAULT 'UNVERIFIED',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "talent_skills_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "projects" (
    "id" UUID NOT NULL,
    "profile_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "organization" TEXT,
    "role" TEXT,
    "start_date" TIMESTAMP(3),
    "end_date" TIMESTAMP(3),
    "repository_url" TEXT,
    "url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_skills" (
    "project_id" UUID NOT NULL,
    "skill_id" UUID NOT NULL,

    CONSTRAINT "project_skills_pkey" PRIMARY KEY ("project_id","skill_id")
);

-- CreateTable
CREATE TABLE "experiences" (
    "id" UUID NOT NULL,
    "profile_id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "company" TEXT NOT NULL,
    "location" TEXT,
    "description" TEXT,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "experiences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "certifications" (
    "id" UUID NOT NULL,
    "profile_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "issuer" TEXT NOT NULL,
    "issue_date" TIMESTAMP(3) NOT NULL,
    "expiration_date" TIMESTAMP(3),
    "credential_id" TEXT,
    "credential_url" TEXT,
    "document_path" TEXT,
    "verification_status" "CertificationVerificationStatus" NOT NULL DEFAULT 'UNVERIFIED',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "certifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "skill_evidence" (
    "id" UUID NOT NULL,
    "profile_id" UUID NOT NULL,
    "talent_skill_id" UUID NOT NULL,
    "project_id" UUID,
    "type" "EvidenceType" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "url" TEXT,
    "file_path" TEXT,
    "file_name" TEXT,
    "mime_type" TEXT,
    "size_bytes" INTEGER,
    "status" "EvidenceVerificationStatus" NOT NULL DEFAULT 'UNVERIFIED',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "skill_evidence_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "profiles_email_key" ON "profiles"("email");

-- CreateIndex
CREATE UNIQUE INDEX "profiles_username_key" ON "profiles"("username");

-- CreateIndex
CREATE UNIQUE INDEX "skill_categories_name_key" ON "skill_categories"("name");

-- CreateIndex
CREATE UNIQUE INDEX "skill_categories_slug_key" ON "skill_categories"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "skills_name_key" ON "skills"("name");

-- CreateIndex
CREATE UNIQUE INDEX "skills_slug_key" ON "skills"("slug");

-- CreateIndex
CREATE INDEX "skills_category_id_idx" ON "skills"("category_id");

-- CreateIndex
CREATE INDEX "talent_skills_skill_id_idx" ON "talent_skills"("skill_id");

-- CreateIndex
CREATE UNIQUE INDEX "talent_skills_profile_id_skill_id_key" ON "talent_skills"("profile_id", "skill_id");

-- CreateIndex
CREATE INDEX "projects_profile_id_idx" ON "projects"("profile_id");

-- CreateIndex
CREATE INDEX "experiences_profile_id_idx" ON "experiences"("profile_id");

-- CreateIndex
CREATE INDEX "certifications_profile_id_idx" ON "certifications"("profile_id");

-- CreateIndex
CREATE INDEX "skill_evidence_profile_id_idx" ON "skill_evidence"("profile_id");

-- CreateIndex
CREATE INDEX "skill_evidence_talent_skill_id_idx" ON "skill_evidence"("talent_skill_id");

-- AddForeignKey
ALTER TABLE "skills" ADD CONSTRAINT "skills_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "skill_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "talent_skills" ADD CONSTRAINT "talent_skills_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "talent_skills" ADD CONSTRAINT "talent_skills_skill_id_fkey" FOREIGN KEY ("skill_id") REFERENCES "skills"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_skills" ADD CONSTRAINT "project_skills_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_skills" ADD CONSTRAINT "project_skills_skill_id_fkey" FOREIGN KEY ("skill_id") REFERENCES "skills"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "experiences" ADD CONSTRAINT "experiences_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "certifications" ADD CONSTRAINT "certifications_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "skill_evidence" ADD CONSTRAINT "skill_evidence_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "skill_evidence" ADD CONSTRAINT "skill_evidence_talent_skill_id_fkey" FOREIGN KEY ("talent_skill_id") REFERENCES "talent_skills"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "skill_evidence" ADD CONSTRAINT "skill_evidence_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;


-- Partie 1b : vérification (évaluations, credentials, recommandations).

-- CreateEnum
CREATE TYPE "AttemptStatus" AS ENUM ('IN_PROGRESS', 'PASSED', 'FAILED', 'PENDING_REVIEW', 'REJECTED');

-- CreateEnum
CREATE TYPE "CredentialStatus" AS ENUM ('VALID', 'REVOKED');

-- CreateEnum
CREATE TYPE "RecommendationStatus" AS ENUM ('REQUESTED', 'SUBMITTED', 'APPROVED', 'DECLINED');

-- CreateTable
CREATE TABLE "assessment_attempts" (
    "id" UUID NOT NULL,
    "profile_id" UUID NOT NULL,
    "talent_skill_id" UUID NOT NULL,
    "assessment_slug" TEXT NOT NULL,
    "bank_version" INTEGER NOT NULL,
    "status" "AttemptStatus" NOT NULL DEFAULT 'IN_PROGRESS',
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deadline_at" TIMESTAMP(3) NOT NULL,
    "submitted_at" TIMESTAMP(3),
    "answers" JSONB,
    "overall_score" INTEGER,
    "domain_scores" JSONB,
    "level" "SkillLevel",
    "reviewed_by_id" UUID,
    "reviewed_at" TIMESTAMP(3),
    "review_note" TEXT,

    CONSTRAINT "assessment_attempts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "credentials" (
    "id" UUID NOT NULL,
    "credential_id" TEXT NOT NULL,
    "profile_id" UUID NOT NULL,
    "talent_skill_id" UUID,
    "skill_name" TEXT NOT NULL,
    "level" "SkillLevel" NOT NULL,
    "issuer" TEXT NOT NULL DEFAULT 'SkillPass',
    "issued_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3),
    "status" "CredentialStatus" NOT NULL DEFAULT 'VALID',
    "revoked_at" TIMESTAMP(3),
    "attempt_id" UUID,

    CONSTRAINT "credentials_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recommendations" (
    "id" UUID NOT NULL,
    "profile_id" UUID NOT NULL,
    "talent_skill_id" UUID,
    "project_id" UUID,
    "token" TEXT NOT NULL,
    "author_name" TEXT NOT NULL,
    "author_email" TEXT,
    "author_title" TEXT,
    "content" TEXT,
    "status" "RecommendationStatus" NOT NULL DEFAULT 'REQUESTED',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "submitted_at" TIMESTAMP(3),
    "expires_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "recommendations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "assessment_attempts_profile_id_assessment_slug_idx" ON "assessment_attempts"("profile_id", "assessment_slug");

-- CreateIndex
CREATE INDEX "assessment_attempts_status_idx" ON "assessment_attempts"("status");

-- CreateIndex
CREATE UNIQUE INDEX "credentials_credential_id_key" ON "credentials"("credential_id");

-- CreateIndex
CREATE UNIQUE INDEX "credentials_attempt_id_key" ON "credentials"("attempt_id");

-- CreateIndex
CREATE INDEX "credentials_profile_id_idx" ON "credentials"("profile_id");

-- CreateIndex
CREATE UNIQUE INDEX "recommendations_token_key" ON "recommendations"("token");

-- CreateIndex
CREATE INDEX "recommendations_profile_id_idx" ON "recommendations"("profile_id");

-- AddForeignKey
ALTER TABLE "assessment_attempts" ADD CONSTRAINT "assessment_attempts_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessment_attempts" ADD CONSTRAINT "assessment_attempts_talent_skill_id_fkey" FOREIGN KEY ("talent_skill_id") REFERENCES "talent_skills"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "credentials" ADD CONSTRAINT "credentials_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "credentials" ADD CONSTRAINT "credentials_talent_skill_id_fkey" FOREIGN KEY ("talent_skill_id") REFERENCES "talent_skills"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "credentials" ADD CONSTRAINT "credentials_attempt_id_fkey" FOREIGN KEY ("attempt_id") REFERENCES "assessment_attempts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recommendations" ADD CONSTRAINT "recommendations_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recommendations" ADD CONSTRAINT "recommendations_talent_skill_id_fkey" FOREIGN KEY ("talent_skill_id") REFERENCES "talent_skills"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recommendations" ADD CONSTRAINT "recommendations_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;


-- Partie 2 : sécurité (RLS) et bucket privé de stockage des preuves.

-- Row Level Security for SkillPass. Apply after `prisma migrate deploy`.
-- Prisma connects with a privileged role and bypasses RLS: services MUST also filter by profile_id.
-- These policies protect every access that goes through the Supabase API (anon / authenticated keys).

alter table profiles enable row level security;
create policy "own profile"        on profiles for all    using (auth.uid() = id) with check (auth.uid() = id);
create policy "public profiles"    on profiles for select using (is_public);

-- Owner-only tables (profile_id = auth.uid()).
do $$
declare t text;
begin
  foreach t in array array['talent_skills','projects','experiences','certifications','skill_evidence'] loop
    execute format('alter table %I enable row level security', t);
    execute format('create policy "owner full access" on %I for all using (auth.uid() = profile_id) with check (auth.uid() = profile_id)', t);
    execute format('create policy "public read when profile is public" on %I for select using (exists (select 1 from profiles p where p.id = %I.profile_id and p.is_public))', t, t);
  end loop;
end $$;

-- Reference data: readable by everyone, writable only through the service role.
alter table skills enable row level security;
alter table skill_categories enable row level security;
alter table project_skills enable row level security;
create policy "skills readable" on skills for select using (true);
create policy "categories readable" on skill_categories for select using (true);
create policy "project skills readable" on project_skills for select using (true);

-- Storage: private bucket "evidence"; objects live under "<profile_id>/...".
insert into storage.buckets (id, name, public) values ('evidence', 'evidence', false) on conflict do nothing;
drop policy if exists "owner reads own evidence files" on storage.objects;
create policy "owner reads own evidence files" on storage.objects for select
  using (bucket_id = 'evidence' and (storage.foldername(name))[1] = auth.uid()::text);

-- Phase 3: verification tables are SERVER-ONLY. RLS is enabled with no policy on purpose:
-- the Supabase API (anon/authenticated keys) can read and write nothing here. All access goes
-- through the application, which checks ownership and roles.
--   assessment_attempts : answers and scores must not be forged or read in bulk.
--   credentials         : public verification is served by /verify, never by direct table reads.
--   recommendations     : rows hold single-use secret tokens.
alter table assessment_attempts enable row level security;
alter table credentials enable row level security;
alter table recommendations enable row level security;
