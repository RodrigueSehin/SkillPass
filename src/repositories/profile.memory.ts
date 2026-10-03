import { slugifyUsername } from "@/lib/utils/username";
import type { UpdateProfileInput } from "@/schemas/profile";
import type { AccountIdentity, ProfileDTO } from "@/types/profile";
import type { ProfileRepository } from "./profile.repository";

const DEMO: ProfileDTO = {
  id: "demo",
  username: "sehin-rodrigue",
  fullName: "Sehin G. Rodrigue",
  headline: "Power Platform Developer & Digital Transformation Specialist",
  bio: "Je conçois des solutions métiers simples et efficaces avec la Power Platform, de l'idée au déploiement.",
  location: "Abidjan, Côte d'Ivoire",
  profession: "Power Platform Developer",
  yearsOfExperience: 5,
  careerGoal: "Concevoir des solutions métiers à fort impact.",
  availability: "IMMEDIATE",
  isPublic: true,
  updatedAt: new Date().toISOString(),
};

export class InMemoryProfileRepository implements ProfileRepository {
  private profiles = new Map<string, ProfileDTO>();

  constructor(seedDemo = false) {
    if (seedDemo) this.profiles.set(DEMO.id, { ...DEMO });
  }

  async ensure(identity: AccountIdentity) {
    let profile = this.profiles.get(identity.id);
    if (!profile) {
      profile = {
        id: identity.id,
        username: `${slugifyUsername(identity.name)}-${identity.id.slice(0, 4)}`,
        fullName: identity.name,
        headline: null,
        bio: null,
        location: null,
        profession: null,
        yearsOfExperience: 0,
        careerGoal: null,
        availability: "IMMEDIATE",
        isPublic: true,
        updatedAt: new Date().toISOString(),
      };
      this.profiles.set(identity.id, profile);
    }
    return { ...profile };
  }

  async findByUsername(username: string) {
    const found = [...this.profiles.values()].find((p) => p.username === username);
    return found ? { ...found } : null;
  }

  async update(id: string, input: UpdateProfileInput) {
    const profile = this.profiles.get(id);
    if (!profile) return null;
    const taken = [...this.profiles.values()].some((p) => p.id !== id && p.username === input.username);
    if (taken) return "username_taken" as const;
    Object.assign(profile, {
      ...input,
      headline: input.headline ?? null,
      profession: input.profession ?? null,
      location: input.location ?? null,
      bio: input.bio ?? null,
      careerGoal: input.careerGoal ?? null,
      updatedAt: new Date().toISOString(),
    });
    return { ...profile };
  }
}
