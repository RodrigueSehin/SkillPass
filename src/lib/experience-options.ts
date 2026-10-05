/** Dependency-free, so client components can import it. */
export const EXPERIENCE_SORTS = [
  ["recent", "Plus récentes"],
  ["oldest", "Plus anciennes"],
  ["company", "Entreprise (A–Z)"],
] as const;
export type ExperienceSort = (typeof EXPERIENCE_SORTS)[number][0];

export const parseExperienceSort = (v: string | undefined): ExperienceSort =>
  EXPERIENCE_SORTS.find(([key]) => key === v)?.[0] ?? "recent";

export const DOMAIN_IDEAS = ["Tech & Digital", "Gestion & Business", "Data & Analytics", "Autres"];
