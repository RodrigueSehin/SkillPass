-- Fictitious job board for demos (generated from src/config/demo-opportunities.ts).
-- Run it once in the Supabase SQL editor, after prisma/migrations/0010_opportunities_contacts.
-- It only inserts when the table is empty, so it never duplicates or overwrites real offers.

INSERT INTO opportunities
  (id, title, company, company_label, kind, region, location, work_mode, commitment, domain, level, skills, description, apply_url, published_at)
SELECT * FROM (VALUES
  (gen_random_uuid(), 'Développeur Power Platform', 'AGL', NULL, 'EMPLOI', 'CI', 'Abidjan, Côte d''Ivoire', 'HYBRID', 'CDI', 'Tech & Digital', 'INTERMEDIATE', ARRAY['Power Apps', 'Power Automate', 'Dataverse']::text[], 'AGL recherche un(e) Développeur Power Platform (Abidjan, Côte d''Ivoire). Vous interviendrez sur des sujets liés à Power Apps, Power Automate, Dataverse au sein d''une équipe pluridisciplinaire, avec des objectifs clairs et un vrai impact sur les utilisateurs.

Compétences recherchées : Power Apps, Power Automate, Dataverse.
Type de contrat : CDI.', NULL, now() - interval '2 days'),
  (gen_random_uuid(), 'Solution Architect (Power Platform)', 'Microsoft', NULL, 'EMPLOI', 'REMOTE', 'Remote (Worldwide)', 'REMOTE', 'Temps plein', 'Tech & Digital', 'SENIOR', ARRAY['Power Platform', 'Azure', 'AI']::text[], 'Microsoft recherche un(e) Solution Architect (Power Platform) (Remote (Worldwide)). Vous interviendrez sur des sujets liés à Power Platform, Azure, AI au sein d''une équipe pluridisciplinaire, avec des objectifs clairs et un vrai impact sur les utilisateurs.

Compétences recherchées : Power Platform, Azure, AI.
Type de contrat : Temps plein.', NULL, now() - interval '5 days'),
  (gen_random_uuid(), 'Stagiaire Développeur', 'SEHIN GROUP', NULL, 'STAGE', 'CI', 'Abidjan, Côte d''Ivoire', NULL, 'Stage (6 mois)', 'Tech & Digital', 'BEGINNER', ARRAY['React', 'Power Apps', 'SharePoint']::text[], 'SEHIN GROUP recherche un(e) Stagiaire Développeur (Abidjan, Côte d''Ivoire). Vous interviendrez sur des sujets liés à React, Power Apps, SharePoint au sein d''une équipe pluridisciplinaire, avec des objectifs clairs et un vrai impact sur les utilisateurs.

Compétences recherchées : React, Power Apps, SharePoint.
Type de contrat : Stage (6 mois).', NULL, now() - interval '7 days'),
  (gen_random_uuid(), 'Développement d''une app métier', 'Upwork', NULL, 'FREELANCE', 'REMOTE', 'Remote', NULL, 'Mission (1-3 mois)', 'Tech & Digital', 'INTERMEDIATE', ARRAY['Power Apps', 'API', 'SQL']::text[], 'Upwork recherche un(e) Développement d''une app métier (Remote). Vous interviendrez sur des sujets liés à Power Apps, API, SQL au sein d''une équipe pluridisciplinaire, avec des objectifs clairs et un vrai impact sur les utilisateurs.

Compétences recherchées : Power Apps, API, SQL.
Type de contrat : Mission (1-3 mois).', NULL, now() - interval '1 days'),
  (gen_random_uuid(), 'Consultant Data & BI', 'Banque Atlantique', NULL, 'PROJET', 'CI', 'Abidjan, Côte d''Ivoire', NULL, 'Mission', 'Data & IA', 'INTERMEDIATE', ARRAY['Power BI', 'Dataverse', 'Data Analysis']::text[], 'Banque Atlantique recherche un(e) Consultant Data & BI (Abidjan, Côte d''Ivoire). Vous interviendrez sur des sujets liés à Power BI, Dataverse, Data Analysis au sein d''une équipe pluridisciplinaire, avec des objectifs clairs et un vrai impact sur les utilisateurs.

Compétences recherchées : Power BI, Dataverse, Data Analysis.
Type de contrat : Mission.', NULL, now() - interval '3 days'),
  (gen_random_uuid(), 'Product Owner Digital', 'Orange CI', 'Orange Digital Center', 'EMPLOI', 'AFRICA', 'Côte d''Ivoire / Afrique de l''Ouest', NULL, 'CDI', 'Gestion & Business', 'SENIOR', ARRAY['Gestion de projet', 'Agile', 'Communication']::text[], 'Orange Digital Center recherche un(e) Product Owner Digital (Côte d''Ivoire / Afrique de l''Ouest). Vous interviendrez sur des sujets liés à Gestion de projet, Agile, Communication au sein d''une équipe pluridisciplinaire, avec des objectifs clairs et un vrai impact sur les utilisateurs.

Compétences recherchées : Gestion de projet, Agile, Communication.
Type de contrat : CDI.', NULL, now() - interval '7 days'),
  (gen_random_uuid(), 'Chef de projet digital', 'AGL', NULL, 'EMPLOI', 'CI', 'Abidjan, Côte d''Ivoire', 'HYBRID', 'CDI', 'Gestion & Business', 'SENIOR', ARRAY['Gestion de projet', 'Agile', 'Leadership']::text[], 'AGL recherche un(e) Chef de projet digital (Abidjan, Côte d''Ivoire). Vous interviendrez sur des sujets liés à Gestion de projet, Agile, Leadership au sein d''une équipe pluridisciplinaire, avec des objectifs clairs et un vrai impact sur les utilisateurs.

Compétences recherchées : Gestion de projet, Agile, Leadership.
Type de contrat : CDI.', NULL, now() - interval '9 days'),
  (gen_random_uuid(), 'Analyste Business Intelligence', 'AGL', NULL, 'EMPLOI', 'CI', 'Abidjan, Côte d''Ivoire', 'ONSITE', 'CDI', 'Data & IA', 'INTERMEDIATE', ARRAY['Power BI', 'SQL', 'Data Analysis']::text[], 'AGL recherche un(e) Analyste Business Intelligence (Abidjan, Côte d''Ivoire). Vous interviendrez sur des sujets liés à Power BI, SQL, Data Analysis au sein d''une équipe pluridisciplinaire, avec des objectifs clairs et un vrai impact sur les utilisateurs.

Compétences recherchées : Power BI, SQL, Data Analysis.
Type de contrat : CDI.', NULL, now() - interval '12 days'),
  (gen_random_uuid(), 'Consultant Dataverse', 'AGL', NULL, 'PROJET', 'CI', 'Abidjan, Côte d''Ivoire', NULL, 'Mission (3-6 mois)', 'Tech & Digital', 'INTERMEDIATE', ARRAY['Dataverse', 'Power Apps', 'Power Automate']::text[], 'AGL recherche un(e) Consultant Dataverse (Abidjan, Côte d''Ivoire). Vous interviendrez sur des sujets liés à Dataverse, Power Apps, Power Automate au sein d''une équipe pluridisciplinaire, avec des objectifs clairs et un vrai impact sur les utilisateurs.

Compétences recherchées : Dataverse, Power Apps, Power Automate.
Type de contrat : Mission (3-6 mois).', NULL, now() - interval '14 days'),
  (gen_random_uuid(), 'Développeur Full Stack', 'AGL', NULL, 'EMPLOI', 'CI', 'Abidjan, Côte d''Ivoire', 'HYBRID', 'CDI', 'Tech & Digital', 'INTERMEDIATE', ARRAY['React', 'Node.js', 'SQL']::text[], 'AGL recherche un(e) Développeur Full Stack (Abidjan, Côte d''Ivoire). Vous interviendrez sur des sujets liés à React, Node.js, SQL au sein d''une équipe pluridisciplinaire, avec des objectifs clairs et un vrai impact sur les utilisateurs.

Compétences recherchées : React, Node.js, SQL.
Type de contrat : CDI.', NULL, now() - interval '15 days'),
  (gen_random_uuid(), 'Product Owner', 'AGL', NULL, 'EMPLOI', 'CI', 'Abidjan, Côte d''Ivoire', 'HYBRID', 'CDI', 'Gestion & Business', 'SENIOR', ARRAY['Agile', 'Gestion de projet', 'Communication']::text[], 'AGL recherche un(e) Product Owner (Abidjan, Côte d''Ivoire). Vous interviendrez sur des sujets liés à Agile, Gestion de projet, Communication au sein d''une équipe pluridisciplinaire, avec des objectifs clairs et un vrai impact sur les utilisateurs.

Compétences recherchées : Agile, Gestion de projet, Communication.
Type de contrat : CDI.', NULL, now() - interval '18 days'),
  (gen_random_uuid(), 'Data Engineer', 'AGL', NULL, 'EMPLOI', 'CI', 'Abidjan, Côte d''Ivoire', 'ONSITE', 'CDI', 'Data & IA', 'SENIOR', ARRAY['Python', 'SQL', 'Azure']::text[], 'AGL recherche un(e) Data Engineer (Abidjan, Côte d''Ivoire). Vous interviendrez sur des sujets liés à Python, SQL, Azure au sein d''une équipe pluridisciplinaire, avec des objectifs clairs et un vrai impact sur les utilisateurs.

Compétences recherchées : Python, SQL, Azure.
Type de contrat : CDI.', NULL, now() - interval '20 days'),
  (gen_random_uuid(), 'Administrateur SharePoint', 'AGL', NULL, 'EMPLOI', 'CI', 'Abidjan, Côte d''Ivoire', 'ONSITE', 'CDD', 'Cloud & Infrastructure', 'INTERMEDIATE', ARRAY['SharePoint', 'Microsoft 365', 'Power Automate']::text[], 'AGL recherche un(e) Administrateur SharePoint (Abidjan, Côte d''Ivoire). Vous interviendrez sur des sujets liés à SharePoint, Microsoft 365, Power Automate au sein d''une équipe pluridisciplinaire, avec des objectifs clairs et un vrai impact sur les utilisateurs.

Compétences recherchées : SharePoint, Microsoft 365, Power Automate.
Type de contrat : CDD.', NULL, now() - interval '22 days'),
  (gen_random_uuid(), 'Architecte de solutions', 'AGL', NULL, 'EMPLOI', 'CI', 'Abidjan, Côte d''Ivoire', 'HYBRID', 'CDI', 'Tech & Digital', 'SENIOR', ARRAY['Azure', 'Power Platform', 'API']::text[], 'AGL recherche un(e) Architecte de solutions (Abidjan, Côte d''Ivoire). Vous interviendrez sur des sujets liés à Azure, Power Platform, API au sein d''une équipe pluridisciplinaire, avec des objectifs clairs et un vrai impact sur les utilisateurs.

Compétences recherchées : Azure, Power Platform, API.
Type de contrat : CDI.', NULL, now() - interval '25 days'),
  (gen_random_uuid(), 'Stagiaire Power Apps', 'AGL', NULL, 'STAGE', 'CI', 'Abidjan, Côte d''Ivoire', NULL, 'Stage (4 mois)', 'Tech & Digital', 'BEGINNER', ARRAY['Power Apps', 'Dataverse']::text[], 'AGL recherche un(e) Stagiaire Power Apps (Abidjan, Côte d''Ivoire). Vous interviendrez sur des sujets liés à Power Apps, Dataverse au sein d''une équipe pluridisciplinaire, avec des objectifs clairs et un vrai impact sur les utilisateurs.

Compétences recherchées : Power Apps, Dataverse.
Type de contrat : Stage (4 mois).', NULL, now() - interval '26 days'),
  (gen_random_uuid(), 'Support applicatif niveau 2', 'AGL', NULL, 'EMPLOI', 'CI', 'Abidjan, Côte d''Ivoire', 'ONSITE', 'CDI', 'Cloud & Infrastructure', 'BEGINNER', ARRAY['Support IT', 'SQL', 'Communication']::text[], 'AGL recherche un(e) Support applicatif niveau 2 (Abidjan, Côte d''Ivoire). Vous interviendrez sur des sujets liés à Support IT, SQL, Communication au sein d''une équipe pluridisciplinaire, avec des objectifs clairs et un vrai impact sur les utilisateurs.

Compétences recherchées : Support IT, SQL, Communication.
Type de contrat : CDI.', NULL, now() - interval '29 days'),
  (gen_random_uuid(), 'Formateur Power Platform', 'AGL', NULL, 'FREELANCE', 'CI', 'Abidjan, Côte d''Ivoire', NULL, 'Mission (1 mois)', 'Tech & Digital', 'SENIOR', ARRAY['Power Apps', 'Power Automate', 'Communication']::text[], 'AGL recherche un(e) Formateur Power Platform (Abidjan, Côte d''Ivoire). Vous interviendrez sur des sujets liés à Power Apps, Power Automate, Communication au sein d''une équipe pluridisciplinaire, avec des objectifs clairs et un vrai impact sur les utilisateurs.

Compétences recherchées : Power Apps, Power Automate, Communication.
Type de contrat : Mission (1 mois).', NULL, now() - interval '31 days'),
  (gen_random_uuid(), 'Cloud Solution Architect', 'Microsoft', NULL, 'EMPLOI', 'EUROPE', 'Paris, France', 'HYBRID', 'Temps plein', 'Cloud & Infrastructure', 'SENIOR', ARRAY['Azure', 'Cloud', 'Architecture']::text[], 'Microsoft recherche un(e) Cloud Solution Architect (Paris, France). Vous interviendrez sur des sujets liés à Azure, Cloud, Architecture au sein d''une équipe pluridisciplinaire, avec des objectifs clairs et un vrai impact sur les utilisateurs.

Compétences recherchées : Azure, Cloud, Architecture.
Type de contrat : Temps plein.', NULL, now() - interval '11 days'),
  (gen_random_uuid(), 'Customer Success Manager', 'Microsoft', NULL, 'EMPLOI', 'EUROPE', 'Dublin, Irlande', 'HYBRID', 'Temps plein', 'Gestion & Business', 'INTERMEDIATE', ARRAY['Communication', 'Power Platform', 'Gestion de projet']::text[], 'Microsoft recherche un(e) Customer Success Manager (Dublin, Irlande). Vous interviendrez sur des sujets liés à Communication, Power Platform, Gestion de projet au sein d''une équipe pluridisciplinaire, avec des objectifs clairs et un vrai impact sur les utilisateurs.

Compétences recherchées : Communication, Power Platform, Gestion de projet.
Type de contrat : Temps plein.', NULL, now() - interval '10 days'),
  (gen_random_uuid(), 'Technical Trainer Power Platform', 'Microsoft', NULL, 'FREELANCE', 'REMOTE', 'Remote (Europe)', NULL, 'Mission (1-3 mois)', 'Tech & Digital', 'SENIOR', ARRAY['Power Apps', 'Power BI', 'Communication']::text[], 'Microsoft recherche un(e) Technical Trainer Power Platform (Remote (Europe)). Vous interviendrez sur des sujets liés à Power Apps, Power BI, Communication au sein d''une équipe pluridisciplinaire, avec des objectifs clairs et un vrai impact sur les utilisateurs.

Compétences recherchées : Power Apps, Power BI, Communication.
Type de contrat : Mission (1-3 mois).', NULL, now() - interval '13 days'),
  (gen_random_uuid(), 'Data & AI Specialist', 'Microsoft', NULL, 'EMPLOI', 'NORTH_AMERICA', 'Redmond, États-Unis', 'ONSITE', 'Temps plein', 'Data & IA', 'SENIOR', ARRAY['AI', 'Azure', 'Python']::text[], 'Microsoft recherche un(e) Data & AI Specialist (Redmond, États-Unis). Vous interviendrez sur des sujets liés à AI, Azure, Python au sein d''une équipe pluridisciplinaire, avec des objectifs clairs et un vrai impact sur les utilisateurs.

Compétences recherchées : AI, Azure, Python.
Type de contrat : Temps plein.', NULL, now() - interval '16 days'),
  (gen_random_uuid(), 'Program Manager Power Apps', 'Microsoft', NULL, 'EMPLOI', 'NORTH_AMERICA', 'Seattle, États-Unis', 'HYBRID', 'Temps plein', 'Gestion & Business', 'SENIOR', ARRAY['Power Apps', 'Gestion de projet', 'Leadership']::text[], 'Microsoft recherche un(e) Program Manager Power Apps (Seattle, États-Unis). Vous interviendrez sur des sujets liés à Power Apps, Gestion de projet, Leadership au sein d''une équipe pluridisciplinaire, avec des objectifs clairs et un vrai impact sur les utilisateurs.

Compétences recherchées : Power Apps, Gestion de projet, Leadership.
Type de contrat : Temps plein.', NULL, now() - interval '19 days'),
  (gen_random_uuid(), 'Support Engineer Dynamics 365', 'Microsoft', NULL, 'EMPLOI', 'AFRICA', 'Casablanca, Maroc', 'ONSITE', 'CDI', 'Cloud & Infrastructure', 'BEGINNER', ARRAY['Dynamics 365', 'Support IT', 'Dataverse']::text[], 'Microsoft recherche un(e) Support Engineer Dynamics 365 (Casablanca, Maroc). Vous interviendrez sur des sujets liés à Dynamics 365, Support IT, Dataverse au sein d''une équipe pluridisciplinaire, avec des objectifs clairs et un vrai impact sur les utilisateurs.

Compétences recherchées : Dynamics 365, Support IT, Dataverse.
Type de contrat : CDI.', NULL, now() - interval '21 days'),
  (gen_random_uuid(), 'Partner Development Manager', 'Microsoft', NULL, 'EMPLOI', 'AFRICA', 'Johannesburg, Afrique du Sud', 'HYBRID', 'Temps plein', 'Gestion & Business', 'SENIOR', ARRAY['Communication', 'Leadership', 'Power Platform']::text[], 'Microsoft recherche un(e) Partner Development Manager (Johannesburg, Afrique du Sud). Vous interviendrez sur des sujets liés à Communication, Leadership, Power Platform au sein d''une équipe pluridisciplinaire, avec des objectifs clairs et un vrai impact sur les utilisateurs.

Compétences recherchées : Communication, Leadership, Power Platform.
Type de contrat : Temps plein.', NULL, now() - interval '27 days'),
  (gen_random_uuid(), 'Développeur Mobile', 'Orange CI', 'Orange Digital Center', 'EMPLOI', 'CI', 'Abidjan, Côte d''Ivoire', 'HYBRID', 'CDI', 'Tech & Digital', 'INTERMEDIATE', ARRAY['React', 'API', 'SQL']::text[], 'Orange Digital Center recherche un(e) Développeur Mobile (Abidjan, Côte d''Ivoire). Vous interviendrez sur des sujets liés à React, API, SQL au sein d''une équipe pluridisciplinaire, avec des objectifs clairs et un vrai impact sur les utilisateurs.

Compétences recherchées : React, API, SQL.
Type de contrat : CDI.', NULL, now() - interval '8 days'),
  (gen_random_uuid(), 'Data Analyst', 'Orange CI', NULL, 'EMPLOI', 'CI', 'Abidjan, Côte d''Ivoire', 'HYBRID', 'CDI', 'Data & IA', 'INTERMEDIATE', ARRAY['Power BI', 'SQL', 'Python']::text[], 'Orange CI recherche un(e) Data Analyst (Abidjan, Côte d''Ivoire). Vous interviendrez sur des sujets liés à Power BI, SQL, Python au sein d''une équipe pluridisciplinaire, avec des objectifs clairs et un vrai impact sur les utilisateurs.

Compétences recherchées : Power BI, SQL, Python.
Type de contrat : CDI.', NULL, now() - interval '11 days'),
  (gen_random_uuid(), 'Chef de projet réseau', 'Orange CI', NULL, 'EMPLOI', 'CI', 'Abidjan, Côte d''Ivoire', 'ONSITE', 'CDI', 'Cloud & Infrastructure', 'SENIOR', ARRAY['Réseau', 'Gestion de projet', 'Leadership']::text[], 'Orange CI recherche un(e) Chef de projet réseau (Abidjan, Côte d''Ivoire). Vous interviendrez sur des sujets liés à Réseau, Gestion de projet, Leadership au sein d''une équipe pluridisciplinaire, avec des objectifs clairs et un vrai impact sur les utilisateurs.

Compétences recherchées : Réseau, Gestion de projet, Leadership.
Type de contrat : CDI.', NULL, now() - interval '17 days'),
  (gen_random_uuid(), 'Stagiaire Marketing digital', 'Orange CI', NULL, 'STAGE', 'CI', 'Abidjan, Côte d''Ivoire', NULL, 'Stage (6 mois)', 'Autres', 'BEGINNER', ARRAY['Communication', 'Analyse fonctionnelle']::text[], 'Orange CI recherche un(e) Stagiaire Marketing digital (Abidjan, Côte d''Ivoire). Vous interviendrez sur des sujets liés à Communication, Analyse fonctionnelle au sein d''une équipe pluridisciplinaire, avec des objectifs clairs et un vrai impact sur les utilisateurs.

Compétences recherchées : Communication, Analyse fonctionnelle.
Type de contrat : Stage (6 mois).', NULL, now() - interval '23 days'),
  (gen_random_uuid(), 'Ingénieur Cloud', 'Orange CI', NULL, 'EMPLOI', 'CI', 'Abidjan, Côte d''Ivoire', 'HYBRID', 'CDI', 'Cloud & Infrastructure', 'INTERMEDIATE', ARRAY['Azure', 'Cloud', 'Réseau']::text[], 'Orange CI recherche un(e) Ingénieur Cloud (Abidjan, Côte d''Ivoire). Vous interviendrez sur des sujets liés à Azure, Cloud, Réseau au sein d''une équipe pluridisciplinaire, avec des objectifs clairs et un vrai impact sur les utilisateurs.

Compétences recherchées : Azure, Cloud, Réseau.
Type de contrat : CDI.', NULL, now() - interval '28 days'),
  (gen_random_uuid(), 'Développeur React', 'SEHIN GROUP', NULL, 'EMPLOI', 'CI', 'Abidjan, Côte d''Ivoire', 'HYBRID', 'CDI', 'Tech & Digital', 'INTERMEDIATE', ARRAY['React', 'TypeScript', 'Node.js']::text[], 'SEHIN GROUP recherche un(e) Développeur React (Abidjan, Côte d''Ivoire). Vous interviendrez sur des sujets liés à React, TypeScript, Node.js au sein d''une équipe pluridisciplinaire, avec des objectifs clairs et un vrai impact sur les utilisateurs.

Compétences recherchées : React, TypeScript, Node.js.
Type de contrat : CDI.', NULL, now() - interval '10 days'),
  (gen_random_uuid(), 'Consultant Power Automate', 'SEHIN GROUP', NULL, 'PROJET', 'CI', 'Abidjan, Côte d''Ivoire', NULL, 'Mission (2 mois)', 'Tech & Digital', 'INTERMEDIATE', ARRAY['Power Automate', 'SharePoint', 'API']::text[], 'SEHIN GROUP recherche un(e) Consultant Power Automate (Abidjan, Côte d''Ivoire). Vous interviendrez sur des sujets liés à Power Automate, SharePoint, API au sein d''une équipe pluridisciplinaire, avec des objectifs clairs et un vrai impact sur les utilisateurs.

Compétences recherchées : Power Automate, SharePoint, API.
Type de contrat : Mission (2 mois).', NULL, now() - interval '12 days'),
  (gen_random_uuid(), 'Alternant Chef de projet', 'SEHIN GROUP', NULL, 'ALTERNANCE', 'CI', 'Abidjan, Côte d''Ivoire', NULL, 'Alternance (12 mois)', 'Gestion & Business', 'BEGINNER', ARRAY['Gestion de projet', 'Agile', 'Communication']::text[], 'SEHIN GROUP recherche un(e) Alternant Chef de projet (Abidjan, Côte d''Ivoire). Vous interviendrez sur des sujets liés à Gestion de projet, Agile, Communication au sein d''une équipe pluridisciplinaire, avec des objectifs clairs et un vrai impact sur les utilisateurs.

Compétences recherchées : Gestion de projet, Agile, Communication.
Type de contrat : Alternance (12 mois).', NULL, now() - interval '20 days'),
  (gen_random_uuid(), 'Designer UX/UI', 'SEHIN GROUP', NULL, 'EMPLOI', 'CI', 'Abidjan, Côte d''Ivoire', 'HYBRID', 'CDD', 'Autres', 'INTERMEDIATE', ARRAY['Design', 'UI/UX', 'Communication']::text[], 'SEHIN GROUP recherche un(e) Designer UX/UI (Abidjan, Côte d''Ivoire). Vous interviendrez sur des sujets liés à Design, UI/UX, Communication au sein d''une équipe pluridisciplinaire, avec des objectifs clairs et un vrai impact sur les utilisateurs.

Compétences recherchées : Design, UI/UX, Communication.
Type de contrat : CDD.', NULL, now() - interval '30 days'),
  (gen_random_uuid(), 'Analyste risques', 'Banque Atlantique', NULL, 'EMPLOI', 'CI', 'Abidjan, Côte d''Ivoire', 'ONSITE', 'CDI', 'Gestion & Business', 'INTERMEDIATE', ARRAY['Analyse fonctionnelle', 'SQL', 'Communication']::text[], 'Banque Atlantique recherche un(e) Analyste risques (Abidjan, Côte d''Ivoire). Vous interviendrez sur des sujets liés à Analyse fonctionnelle, SQL, Communication au sein d''une équipe pluridisciplinaire, avec des objectifs clairs et un vrai impact sur les utilisateurs.

Compétences recherchées : Analyse fonctionnelle, SQL, Communication.
Type de contrat : CDI.', NULL, now() - interval '9 days'),
  (gen_random_uuid(), 'Développeur Power Apps', 'Banque Atlantique', NULL, 'EMPLOI', 'CI', 'Abidjan, Côte d''Ivoire', 'HYBRID', 'CDI', 'Tech & Digital', 'INTERMEDIATE', ARRAY['Power Apps', 'Dataverse', 'Power Automate']::text[], 'Banque Atlantique recherche un(e) Développeur Power Apps (Abidjan, Côte d''Ivoire). Vous interviendrez sur des sujets liés à Power Apps, Dataverse, Power Automate au sein d''une équipe pluridisciplinaire, avec des objectifs clairs et un vrai impact sur les utilisateurs.

Compétences recherchées : Power Apps, Dataverse, Power Automate.
Type de contrat : CDI.', NULL, now() - interval '15 days'),
  (gen_random_uuid(), 'Chef de projet transformation digitale', 'Banque Atlantique', NULL, 'EMPLOI', 'CI', 'Abidjan, Côte d''Ivoire', 'ONSITE', 'CDI', 'Gestion & Business', 'SENIOR', ARRAY['Gestion de projet', 'Leadership', 'Agile']::text[], 'Banque Atlantique recherche un(e) Chef de projet transformation digitale (Abidjan, Côte d''Ivoire). Vous interviendrez sur des sujets liés à Gestion de projet, Leadership, Agile au sein d''une équipe pluridisciplinaire, avec des objectifs clairs et un vrai impact sur les utilisateurs.

Compétences recherchées : Gestion de projet, Leadership, Agile.
Type de contrat : CDI.', NULL, now() - interval '24 days')
) AS v(id, title, company, company_label, kind, region, location, work_mode, commitment, domain, level, skills, description, apply_url, published_at)
WHERE NOT EXISTS (SELECT 1 FROM opportunities);
