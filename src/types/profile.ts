export const AVAILABILITIES = ["IMMEDIATE", "ONE_MONTH", "THREE_MONTHS", "NOT_AVAILABLE"] as const;
export type Availability = (typeof AVAILABILITIES)[number];

export const AVAILABILITY_LABELS: Record<Availability, string> = {
  IMMEDIATE: "Disponible immédiatement",
  ONE_MONTH: "Disponible sous 1 mois",
  THREE_MONTHS: "Disponible sous 3 mois",
  NOT_AVAILABLE: "Non disponible",
};

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
  /** ISO timestamp of the last profile update, used as the activity signal in the score. */
  updatedAt: string;
}

/** What anyone may see on /[username]. No id, e-mail, career goal or visibility flag. */
export type PublicProfileDTO = Omit<ProfileDTO, "id" | "careerGoal" | "isPublic" | "updatedAt">;

export interface AccountIdentity {
  id: string;
  email: string;
  name: string;
}
