/**
 * Static showcase data for Phase 1 UI. Replaced by service calls in Phase 2.
 * Mirrors the seed in prisma/seed.ts.
 */
export const DEMO_STATS = { skills: 18, badges: 12, projects: 7, certifications: 5 };

export const DEMO_PROFILE_COMPLETION = 86;

export const DEMO_TOP_SKILLS = [
  { name: "Power Apps", score: 95 },
  { name: "Power Automate", score: 82 },
  { name: "Dataverse", score: 80 },
  { name: "Power BI", score: 78 },
  { name: "AI & Automation", score: 65 },
];

export const DEMO_PROJECTS = [
  { name: "A' Quotation", role: "Power Platform Developer", tech: ["Power Apps", "Dataverse", "Power Automate"] },
  { name: "MODOCK", role: "Solution Architect", tech: ["Power Apps", "Power BI"] },
  { name: "K@PELE", role: "Power Platform Developer", tech: ["Power Apps", "Dataverse"] },
  { name: "CRUISE", role: "Digital Transformation Lead", tech: ["Power Automate", "AI"] },
];

export const DEMO_ASSESSMENTS = [
  { title: "Power Apps — Niveau Avancé", meta: "25 questions · 25 minutes" },
  { title: "Dataverse — Niveau Avancé", meta: "20 questions · 20 minutes" },
];

export const DEMO_JOBS = [
  { title: "Power Platform Developer", company: "AGL", match: 92 },
  { title: "Digital Transformation Specialist", company: "Orange CI", match: 78 },
  { title: "Business Applications Consultant", company: "SIFCA", match: 75 },
];
