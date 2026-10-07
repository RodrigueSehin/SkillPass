export const JOB_CONTRACTS = ["CDI", "CDD", "STAGE", "FREELANCE", "ALTERNANCE", "PROJET"] as const;
export type JobContract = (typeof JOB_CONTRACTS)[number];
export const JOB_CONTRACT_LABELS: Record<JobContract, string> = {
  CDI: "CDI",
  CDD: "CDD",
  STAGE: "Stage",
  FREELANCE: "Freelance",
  ALTERNANCE: "Alternance",
  PROJET: "Projet / Mission",
};

export const JOB_WORK_MODES = ["ONSITE", "HYBRID", "REMOTE"] as const;
export type JobWorkMode = (typeof JOB_WORK_MODES)[number];
export const JOB_WORK_MODE_LABELS: Record<JobWorkMode, string> = {
  ONSITE: "Sur site",
  HYBRID: "Hybride",
  REMOTE: "Télétravail",
};

export const EXPERIENCE_LEVELS = [
  "Moins d'1 an",
  "1 à 3 ans",
  "3 à 5 ans",
  "5 à 10 ans",
  "10 ans et plus",
] as const;
export const EDUCATION_LEVELS = [
  "Sans diplôme requis",
  "Bac / Bac+2",
  "Licence / Bac+3",
  "Master / Bac+5",
  "Doctorat",
] as const;
export const CURRENCIES = ["FCFA", "EUR", "USD"] as const;
export const PERMITS = ["Aucun", "Permis B", "Permis A et B", "Permis professionnel"] as const;

export const MOBILITIES = ["NONE", "OCCASIONAL", "FREQUENT"] as const;
export const MOBILITY_LABELS: Record<(typeof MOBILITIES)[number], string> = {
  NONE: "Aucune",
  OCCASIONAL: "Ponctuelle",
  FREQUENT: "Fréquente",
};

export const AVAILABILITIES = ["ASAP", "ONE_MONTH", "TWO_THREE_MONTHS", "FLEXIBLE"] as const;
export const AVAILABILITY_LABELS: Record<(typeof AVAILABILITIES)[number], string> = {
  ASAP: "Dès que possible",
  ONE_MONTH: "Dans 1 mois",
  TWO_THREE_MONTHS: "Dans 2 à 3 mois",
  FLEXIBLE: "Flexible",
};

export const VISIBILITIES = ["PUBLIC", "RESTRICTED", "INTERNAL"] as const;
export type JobVisibility = (typeof VISIBILITIES)[number];
export const VISIBILITY_LABELS: Record<JobVisibility, { title: string; description: string }> = {
  PUBLIC: { title: "Publique", description: "Visible par tous les talents sur SkillPass" },
  RESTRICTED: { title: "Restreinte", description: "Visible uniquement par invitation" },
  INTERNAL: { title: "Interne", description: "Visible uniquement aux talents de votre organisation" },
};

export const PUBLICATION_DURATIONS = [
  ["1", "1 mois"],
  ["2", "2 mois"],
  ["3", "3 mois"],
  ["6", "6 mois"],
] as const;

export const JOB_CHANNELS = ["PLATFORM", "LINKEDIN", "EMAIL", "CAREER_SITE"] as const;
export type JobChannel = (typeof JOB_CHANNELS)[number];
export const JOB_CHANNEL_LABELS: Record<JobChannel, { title: string; description: string }> = {
  PLATFORM: {
    title: "Sur la plateforme SkillPass",
    description: "Diffusée auprès de tous les talents qualifiés",
  },
  LINKEDIN: { title: "Sur LinkedIn", description: "Publier automatiquement sur votre page LinkedIn" },
  EMAIL: {
    title: "Par e-mail aux talents correspondant",
    description: "Notifier les talents qui correspondent à vos critères",
  },
  CAREER_SITE: {
    title: "Sur votre site carrière",
    description: "Obtenir un lien pour intégrer l'offre sur votre site",
  },
};

export const APPLICATION_MODES = ["SIMPLE", "ADVANCED", "ASSESSMENT"] as const;
export const APPLICATION_MODE_LABELS: Record<
  (typeof APPLICATION_MODES)[number],
  { title: string; description: string }
> = {
  SIMPLE: { title: "Candidature simple", description: "CV + lettre de motivation (optionnelle)" },
  ADVANCED: { title: "Candidature avancée", description: "Formulaire détaillé avec questions" },
  ASSESSMENT: { title: "Avec évaluation", description: "Ajoutez un test de compétences automatique" },
};

export const JOB_STATUSES = ["DRAFT", "PUBLISHED", "CLOSED"] as const;
export type JobStatus = (typeof JOB_STATUSES)[number];
/** What the list shows: a published offer past its deadline reads as expired. */
export type JobDisplayStatus = "DRAFT" | "PUBLISHED" | "EXPIRED" | "CLOSED";
export const JOB_STATUS_LABELS: Record<JobDisplayStatus, string> = {
  DRAFT: "Brouillon",
  PUBLISHED: "Publiée",
  EXPIRED: "Expirée",
  CLOSED: "Clôturée",
};

export interface JobOfferDTO {
  id: string;
  title: string;
  description: string;
  contract: JobContract;
  location: string;
  workMode: JobWorkMode | null;
  departmentId: string | null;
  experience: string;
  positions: number;
  /** Last day to apply, "YYYY-MM-DD". */
  deadline: string | null;
  salaryMin: number | null;
  salaryMax: number | null;
  currency: string;
  skills: string[];
  softSkills: string[];
  certifications: string[];
  education: string | null;
  languages: string[];
  otherLanguage: string | null;
  permit: string | null;
  mobility: (typeof MOBILITIES)[number];
  availability: (typeof AVAILABILITIES)[number];
  visibility: JobVisibility;
  /** "YYYY-MM-DD" */
  publishOn: string | null;
  durationMonths: number;
  channels: JobChannel[];
  applicationMode: (typeof APPLICATION_MODES)[number];
  status: JobStatus;
  /** The talent-side opportunity this offer is published as. */
  opportunityId: string | null;
  createdById: string | null;
  publishedAt: string | null;
  createdAt: string;
}

export type JobOfferInput = Omit<
  JobOfferDTO,
  "id" | "status" | "opportunityId" | "createdById" | "publishedAt" | "createdAt"
>;

/** An offer with the figures measured on the talent side. */
export interface JobOfferRow extends JobOfferDTO {
  displayStatus: JobDisplayStatus;
  applicants: number;
  views: number;
}
