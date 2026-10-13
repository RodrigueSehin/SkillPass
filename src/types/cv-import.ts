import type { SkillLevel } from "./skill";

/** What the assistant read in a CV. Nothing is saved until the person ticks it on the review screen. */
export interface CvProposal {
  skills: { name: string; level: SkillLevel; yearsOfExperience: number; exists: boolean }[];
  experiences: {
    title: string;
    company: string;
    location: string | null;
    description: string | null;
    contractType: string | null;
    startDate: string;
    endDate: string | null;
    skills: string[];
    exists: boolean;
  }[];
  certifications: {
    name: string;
    issuer: string;
    issueDate: string;
    expirationDate: string | null;
    exists: boolean;
  }[];
}

export type CvKind = "skills" | "experiences" | "certifications";

export interface CvImportResult {
  imported: Record<CvKind, number>;
  skipped: { kind: CvKind; label: string; reason: string }[];
}
