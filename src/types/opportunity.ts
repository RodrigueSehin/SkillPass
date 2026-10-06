export const OPPORTUNITY_KINDS = ["EMPLOI", "FREELANCE", "STAGE", "PROJET", "ALTERNANCE"] as const;
export type OpportunityKind = (typeof OPPORTUNITY_KINDS)[number];

export const OPPORTUNITY_KIND_LABELS: Record<OpportunityKind, string> = {
  EMPLOI: "Emploi",
  FREELANCE: "Freelance",
  STAGE: "Stage",
  PROJET: "Projet",
  ALTERNANCE: "Alternance",
};

export const OPPORTUNITY_REGIONS = ["CI", "AFRICA", "EUROPE", "NORTH_AMERICA", "REMOTE"] as const;
export const OPPORTUNITY_REGION_LABELS: Record<(typeof OPPORTUNITY_REGIONS)[number], string> = {
  CI: "Côte d'Ivoire",
  AFRICA: "Afrique",
  EUROPE: "Europe",
  NORTH_AMERICA: "Amérique du Nord",
  REMOTE: "Remote",
};

export const OPPORTUNITY_LEVELS = ["BEGINNER", "INTERMEDIATE", "SENIOR"] as const;
export const OPPORTUNITY_LEVEL_LABELS: Record<(typeof OPPORTUNITY_LEVELS)[number], string> = {
  BEGINNER: "Débutant",
  INTERMEDIATE: "Intermédiaire",
  SENIOR: "Senior",
};

export const WORK_MODE_SHORT_LABELS: Record<string, string> = {
  HYBRID: "Hybride",
  ONSITE: "Sur site",
  REMOTE: "Remote",
};

/** A job, mission, internship or project offer. */
export interface OpportunityDTO {
  id: string;
  title: string;
  /** The employer, used to group offers ("Entreprises qui recrutent"). */
  company: string;
  /** Name shown on the card when it differs from the employer (a unit or brand). */
  companyLabel: string | null;
  kind: string;
  region: string;
  location: string;
  workMode: string | null;
  /** Free label: "CDI", "Temps plein", "Mission (1-3 mois)"… */
  commitment: string | null;
  domain: string;
  level: string;
  /** Names of the skills the offer asks for. */
  skills: string[];
  description: string;
  applyUrl: string | null;
  publishedAt: string;
  /** Last day to apply, if the employer set one. */
  deadline: string | null;
  views: number;
  /** People who applied through SkillPass. */
  applicants: number;
  /** "Hybride (2-3 jours sur site)". */
  workModeDetail: string | null;
  /** "Intermédiaire / Senior". */
  experienceRange: string | null;
  salary: string | null;
  /** What the person will do ("Vos principales missions"). */
  missions: string[];
  /** The profile looked for. */
  requirements: string[];
  perks: string[];
  /** Hiring steps, in order. */
  process: string[];
  /** Skills that are a plus rather than a requirement. */
  optionalSkills: string[];
  companyLegalName: string | null;
  companySector: string | null;
  companySize: string | null;
  companyAbout: string | null;
  companyTagline: string | null;
  companyVerified: boolean;
  companyWebsite: string | null;
}

/** A saved search: the filters are re-applied from the alert. */
export interface JobAlertDTO {
  id: string;
  name: string;
  query: string | null;
  kind: string | null;
  region: string | null;
  domain: string | null;
  level: string | null;
  createdAt: string;
}

/** An entry of the address book. */
export interface ContactDTO {
  id: string;
  name: string;
  email: string | null;
  title: string | null;
  company: string | null;
}
