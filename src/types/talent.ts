import type { AvatarRef } from "@/lib/avatars";
import type { Availability } from "./profile";
import type { SkillLevel } from "./skill";

/** What a company may see about a talent: only profiles that opted into being public. No e-mail, no phone. */
export interface TalentRecord {
  id: string;
  /** The talent's picture, as they chose it. */
  avatar: AvatarRef | null;
  username: string;
  fullName: string;
  headline: string | null;
  profession: string | null;
  location: string | null;
  yearsOfExperience: number;
  availability: Availability;
  updatedAt: string;
  skills: {
    name: string;
    category: string | null;
    level: SkillLevel;
    score: number;
    verified: boolean;
    evidenceCount: number;
  }[];
  certifications: { name: string; issuer: string; date: string; verified: boolean; expired: boolean }[];
  projectCount: number;
  recommendationCount: number;
}

export interface TalentDetail {
  record: TalentRecord;
  projects: { name: string; organization: string | null; domain: string | null }[];
  experiences: { title: string; company: string; startDate: string; endDate: string | null }[];
}

export interface TalentHit {
  record: TalentRecord;
  /** 0-100 against the requested skills and certifications; null when the search names none. */
  match: number | null;
}
