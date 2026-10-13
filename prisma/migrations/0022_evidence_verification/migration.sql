-- Vérification des preuves par l'équipe SkillPass (demande côté talent, décision dans la console admin).
ALTER TABLE "skill_evidence" ADD COLUMN IF NOT EXISTS "verification_note" TEXT;
ALTER TABLE "skill_evidence" ADD COLUMN IF NOT EXISTS "verification_requested_at" TIMESTAMP(3);
