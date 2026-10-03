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

