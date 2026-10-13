-- Vérification des preuves par l'équipe SkillPass (demande côté talent, décision dans la console admin).
-- Run after update-0021-evidence-refonte.sql. Safe to run more than once.
ALTER TABLE "skill_evidence" ADD COLUMN IF NOT EXISTS "verification_note" TEXT;
ALTER TABLE "skill_evidence" ADD COLUMN IF NOT EXISTS "verification_requested_at" TIMESTAMP(3);
