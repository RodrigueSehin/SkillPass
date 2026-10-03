import { computeSkillPassScore, type ScoreResult } from "@/lib/score";
import type { TalentSkillDTO } from "@/repositories/talent-skill.repository";
import type { CertificationDTO, ExperienceDTO, ProjectDTO } from "@/types/portfolio";
import type { SkillService } from "./skill.service";

export interface Passport {
  skills: TalentSkillDTO[];
  projects: ProjectDTO[];
  experiences: ExperienceDTO[];
  certifications: (CertificationDTO & { expired: boolean })[];
  score: ScoreResult;
  stats: {
    skills: number;
    verifiedSkills: number;
    projects: number;
    certifications: number;
    recommendations: number;
  };
  isVerified: boolean;
}

/** The passport only reads: any service exposing list() fits. */
type Crud<T> = { list(profileId: string): Promise<T[]> };

const DAY_MS = 86_400_000;

/** Whole years covered by dated positions. Overlapping positions are counted once per position. */
export function yearsFromExperiences(experiences: ExperienceDTO[], today = new Date()) {
  const days = experiences.reduce((sum, e) => {
    const start = Date.parse(`${e.startDate}T00:00:00Z`);
    const end = e.endDate ? Date.parse(`${e.endDate}T00:00:00Z`) : today.getTime();
    return sum + Math.max(0, end - start) / DAY_MS;
  }, 0);
  return Math.floor(days / 365);
}

/** Aggregates everything shown on "Mon SkillPass" and on the public profile, plus the explainable score. */
export class PassportService {
  constructor(
    private readonly skills: SkillService,
    private readonly projects: Crud<ProjectDTO>,
    private readonly experiences: Crud<ExperienceDTO>,
    private readonly certifications: Crud<CertificationDTO>,
  ) {}

  async build(
    profileId: string,
    profile: { yearsOfExperience: number; updatedAt: string },
    now = new Date(),
  ): Promise<Passport> {
    const [skillList, projects, experiences, certs] = await Promise.all([
      this.skills.list(profileId, { sort: "score" }),
      this.projects.list(profileId),
      this.experiences.list(profileId),
      this.certifications.list(profileId),
    ]);
    const today = now.toISOString().slice(0, 10);
    const certifications = certs.map((c) => ({
      ...c,
      expired: Boolean(c.expirationDate && c.expirationDate < today),
    }));
    const skills = skillList.items;
    const recommendations = 0; // Recommendations table arrives in Phase 3.

    const score = computeSkillPassScore({
      skills,
      yearsOfExperience: Math.max(profile.yearsOfExperience, yearsFromExperiences(experiences, now)),
      projectCount: projects.length,
      certifications,
      recommendationCount: recommendations,
      daysSinceActivity: Math.floor((now.getTime() - Date.parse(profile.updatedAt)) / DAY_MS),
    });
    const verifiedSkills = skills.filter((s) => s.verificationStatus === "VERIFIED").length;

    return {
      skills,
      projects,
      experiences: [...experiences].sort((a, b) => b.startDate.localeCompare(a.startDate)),
      certifications,
      score,
      stats: {
        skills: skills.length,
        verifiedSkills,
        projects: projects.length,
        certifications: certifications.length,
        recommendations,
      },
      isVerified: verifiedSkills > 0,
    };
  }
}
