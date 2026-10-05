export const AVAILABILITIES = ["IMMEDIATE", "ONE_MONTH", "THREE_MONTHS", "NOT_AVAILABLE"] as const;
export type Availability = (typeof AVAILABILITIES)[number];

export const AVAILABILITY_LABELS: Record<Availability, string> = {
  IMMEDIATE: "Disponible immédiatement",
  ONE_MONTH: "Disponible sous 1 mois",
  THREE_MONTHS: "Disponible sous 3 mois",
  NOT_AVAILABLE: "Non disponible",
};

export type UserRole =
  | "TALENT"
  | "RECRUITER"
  | "MANAGER"
  | "EVALUATOR"
  | "TRAINER"
  | "COMPANY_ADMIN"
  | "ACADEMY_ADMIN"
  | "SKILLPASS_ADMIN"
  | "VERIFIER";

export const ROLE_LABELS: Record<UserRole, string> = {
  TALENT: "Talent",
  RECRUITER: "Recruteur",
  MANAGER: "Manager",
  EVALUATOR: "Évaluateur",
  TRAINER: "Formateur",
  COMPANY_ADMIN: "Admin entreprise",
  ACADEMY_ADMIN: "Admin académie",
  SKILLPASS_ADMIN: "Administrateur",
  VERIFIER: "Vérificateur",
};

/** Roles allowed to review critical assessments. */
export const REVIEWER_ROLES: readonly UserRole[] = ["VERIFIER", "EVALUATOR", "SKILLPASS_ADMIN"];

export interface ProfileDTO {
  id: string;
  username: string;
  fullName: string;
  headline: string | null;
  bio: string | null;
  location: string | null;
  profession: string | null;
  yearsOfExperience: number;
  careerGoal: string | null;
  availability: Availability;
  isPublic: boolean;
  role: UserRole;
  /** ISO timestamp of the last profile update, used as the activity signal in the score. */
  updatedAt: string;
}

/** What anyone may see on /[username]. No id, e-mail, career goal or visibility flag. */
export type PublicProfileDTO = Omit<ProfileDTO, "id" | "careerGoal" | "isPublic" | "updatedAt" | "role">;

export interface AccountIdentity {
  id: string;
  email: string;
  name: string;
}
