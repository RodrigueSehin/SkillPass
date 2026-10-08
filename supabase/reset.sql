-- SkillPass — REMISE À ZÉRO. ⚠️ DESTRUCTIF : supprime les tables SkillPass ET leurs données.
-- À n'utiliser que si la base ne contient rien à conserver (premier essai d'installation).
-- Ne touche ni aux utilisateurs Supabase Auth, ni aux tables qui ne sont pas listées ici.
-- Ensuite, exécutez supabase/setup.sql en entier.

drop policy if exists "owner reads own evidence files" on storage.objects;

drop table if exists
  recommendations,
  credentials,
  assessment_attempts,
  skill_evidence,
  project_skills,
  organization_skills,
  evaluation_attempts,
  evaluations,
  job_offers,
  department_deputies,
  department_members,
  departments,
  sites,
  organization_members,
  organizations,
  applications,
  contacts,
  job_alerts,
  saved_opportunities,
  opportunities,
  experience_documents,
  experience_skills,
  experiences,
  certification_skills,
  certifications,
  projects,
  talent_skills,
  skills,
  skill_categories,
  profiles
cascade;

drop type if exists
  "AttemptStatus",
  "CredentialStatus",
  "RecommendationStatus",
  "EvidenceType",
  "EvidenceVerificationStatus",
  "UserRole",
  "SkillLevel",
  "SkillVerificationStatus",
  "CertificationVerificationStatus",
  "Availability"
cascade;
