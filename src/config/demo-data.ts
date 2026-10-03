/** Demo data backing the in-memory repositories used when no database is configured. */
/** Deterministic ids for the in-memory demo skills, so seeded evidence can reference them. */
export const demoSkillId = (name: string) =>
  `demo-skill-${name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")}`;

export const DEMO_EVIDENCE = [
  {
    skill: "Power Apps",
    type: "PROJECT",
    title: "A' Quotation",
    description: "Application de devis déployée en production.",
    status: "VERIFIED",
  },
  {
    skill: "Power Apps",
    type: "PROJECT",
    title: "MODOCK",
    description: "Pilotage logistique multi-sites.",
    status: "VERIFIED",
  },
  { skill: "Power Apps", type: "CERTIFICATION", title: "PL-200", description: null, status: "VERIFIED" },
  {
    skill: "Power Automate",
    type: "PROJECT",
    title: "CRUISE",
    description: "Automatisation de bout en bout.",
    status: "VERIFIED",
  },
  {
    skill: "Dataverse",
    type: "PROJECT",
    title: "K@PELE",
    description: "Modèle de données et sécurité par rôles.",
    status: "VERIFIED",
  },
  { skill: "Power BI", type: "CERTIFICATION", title: "PL-300", description: null, status: "VERIFIED" },
  {
    skill: "AI & Automation",
    type: "LINK",
    title: "Démo d'un assistant interne",
    description: null,
    status: "PENDING",
    url: "https://example.com/demo",
  },
] as const;

export const DEMO_SKILL_ROWS = [
  {
    name: "Power Apps",
    category: "Power Platform",
    level: "EXPERT",
    score: 95,
    yearsOfExperience: 5,
    verificationStatus: "VERIFIED",
    evidenceCount: 6,
    recommendationCount: 3,
  },
  {
    name: "Power Automate",
    category: "Power Platform",
    level: "ADVANCED",
    score: 82,
    yearsOfExperience: 5,
    verificationStatus: "VERIFIED",
    evidenceCount: 4,
    recommendationCount: 2,
  },
  {
    name: "Dataverse",
    category: "Power Platform",
    level: "ADVANCED",
    score: 80,
    yearsOfExperience: 4,
    verificationStatus: "VERIFIED",
    evidenceCount: 4,
    recommendationCount: 1,
  },
  {
    name: "Power BI",
    category: "Data & Analytics",
    level: "ADVANCED",
    score: 78,
    yearsOfExperience: 3,
    verificationStatus: "VERIFIED",
    evidenceCount: 2,
    recommendationCount: 1,
  },
  {
    name: "AI & Automation",
    category: "AI & Automation",
    level: "INTERMEDIATE",
    score: 65,
    yearsOfExperience: 2,
    verificationStatus: "PENDING",
    evidenceCount: 1,
    recommendationCount: 0,
  },
  {
    name: "Digital Transformation",
    category: "Transformation & Design",
    level: "ADVANCED",
    score: 76,
    yearsOfExperience: 4,
    verificationStatus: "UNVERIFIED",
    evidenceCount: 1,
    recommendationCount: 1,
  },
  {
    name: "UI/UX",
    category: "Transformation & Design",
    level: "INTERMEDIATE",
    score: 60,
    yearsOfExperience: 3,
    verificationStatus: "UNVERIFIED",
    evidenceCount: 0,
    recommendationCount: 0,
  },
] as const;

export const DEMO_PROJECT_ROWS = [
  {
    name: "A' Quotation",
    description: "Application de devis et de suivi commercial.",
    organization: "AGL",
    role: "Power Platform Developer",
    startDate: "2024-01-15",
    endDate: "2024-06-30",
    repositoryUrl: null,
    url: null,
    skills: ["Power Apps", "Dataverse", "Power Automate"],
  },
  {
    name: "MODOCK",
    description: "Pilotage logistique et tableaux de bord.",
    organization: "Port d'Abidjan",
    role: "Solution Architect",
    startDate: "2023-03-01",
    endDate: "2023-11-30",
    repositoryUrl: null,
    url: null,
    skills: ["Power Apps", "Power BI"],
  },
  {
    name: "K@PELE",
    description: "Gestion des demandes internes.",
    organization: "Groupe KAP",
    role: "Power Platform Developer",
    startDate: "2022-09-01",
    endDate: "2023-02-28",
    repositoryUrl: null,
    url: null,
    skills: ["Power Apps", "Dataverse"],
  },
  {
    name: "CRUISE",
    description: "Automatisation des processus de croisière.",
    organization: "CRUISE",
    role: "Digital Transformation Lead",
    startDate: "2025-01-10",
    endDate: null,
    repositoryUrl: null,
    url: null,
    skills: ["Power Automate", "AI & Automation"],
  },
] as const;

export const DEMO_EXPERIENCES = [
  {
    title: "Power Platform Developer",
    company: "AGL",
    location: "Abidjan",
    description: "Conception de solutions métiers Power Apps et Dataverse.",
    startDate: "2021-02-01",
    endDate: null,
  },
  {
    title: "Digital Transformation Specialist",
    company: "Groupe KAP",
    location: "Abidjan",
    description: "Pilotage de la digitalisation des processus.",
    startDate: "2019-06-01",
    endDate: "2021-01-31",
  },
] as const;

export const DEMO_CERTIFICATIONS = [
  {
    name: "PL-200: Power Platform Functional Consultant",
    issuer: "Microsoft",
    issueDate: "2025-06-01",
    expirationDate: "2026-06-01",
    credentialId: "PL-200",
    credentialUrl: null,
    verificationStatus: "VERIFIED",
  },
  {
    name: "Power BI Data Analyst (PL-300)",
    issuer: "Microsoft",
    issueDate: "2025-03-12",
    expirationDate: null,
    credentialId: "PL-300",
    credentialUrl: null,
    verificationStatus: "VERIFIED",
  },
  {
    name: "Azure AI Fundamentals (AI-900)",
    issuer: "Microsoft",
    issueDate: "2024-11-20",
    expirationDate: null,
    credentialId: "AI-900",
    credentialUrl: null,
    verificationStatus: "PENDING",
  },
] as const;
