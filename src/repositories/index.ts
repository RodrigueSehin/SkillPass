import { InMemoryTalentSkillRepository } from "./talent-skill.memory";
import { PrismaTalentSkillRepository } from "./talent-skill.prisma";
import type { TalentSkillRepository } from "./talent-skill.repository";

const globalForRepos = globalThis as unknown as { memoryTalentSkills?: InMemoryTalentSkillRepository };

/**
 * Prisma when DATABASE_URL is set. Otherwise (never in production) an in-memory
 * repository seeded with demo data for the preview user.
 */
export function getTalentSkillRepository(): TalentSkillRepository {
  if (process.env.DATABASE_URL) return new PrismaTalentSkillRepository();
  if (process.env.NODE_ENV === "production") throw new Error("DATABASE_URL is required in production");
  return (globalForRepos.memoryTalentSkills ??= new InMemoryTalentSkillRepository("demo"));
}
