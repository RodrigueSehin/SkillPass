import { slugifyUsername } from "@/lib/utils/username";
import type { UpdateProfileInput } from "@/schemas/profile";
import type { AccountIdentity, ProfileDTO } from "@/types/profile";
import { parseAvatar } from "@/lib/avatars";
import type { TalentPlanCode } from "@/lib/plans/entitlements";
import { DEFAULT_PROFILE_SETTINGS, type ProfileSettings } from "@/types/profile-settings";
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
  settings: DEFAULT_PROFILE_SETTINGS,
  plan: "PRO",
  avatar: null,
  role: "TALENT",
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
        settings: structuredClone(DEFAULT_PROFILE_SETTINGS),
        plan: "FREE",
        avatar: null,
        role: "TALENT",
        updatedAt: new Date().toISOString(),
      };
      this.profiles.set(identity.id, profile);
    }
    return { ...profile };
  }

  /** Platform administration: every profile. */
  all(): ProfileDTO[] {
    return [...this.profiles.values()].map((p) => structuredClone(p));
  }

  /** Test/dev helper: roles are granted by administrators, never by user input. */
  setRole(id: string, role: ProfileDTO["role"]) {
    const profile = this.profiles.get(id);
    if (profile) profile.role = role;
  }

  async findById(id: string) {
    const found = this.profiles.get(id);
    return found ? { ...found } : null;
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

  async saveSettings(id: string, patch: Partial<ProfileSettings>) {
    const profile = this.profiles.get(id);
    if (!profile) return null;
    profile.settings = structuredClone({ ...profile.settings, ...patch });
    profile.updatedAt = new Date().toISOString();
    return structuredClone(profile);
  }

  private avatars = new Map<string, string>();

  async getAvatarStored(id: string) {
    return this.avatars.get(id) ?? null;
  }

  async setAvatarStored(id: string, stored: string | null) {
    const profile = this.profiles.get(id);
    if (!profile) return undefined;
    const previous = this.avatars.get(id) ?? null;
    if (stored) this.avatars.set(id, stored);
    else this.avatars.delete(id);
    profile.avatar = parseAvatar(stored);
    return { previous };
  }

  async setPlan(id: string, plan: TalentPlanCode) {
    const profile = this.profiles.get(id);
    if (!profile) return null;
    profile.plan = plan;
    return structuredClone(profile);
  }

  async setPublic(id: string, isPublic: boolean) {
    const profile = this.profiles.get(id);
    if (!profile) return null;
    profile.isPublic = isPublic;
    profile.updatedAt = new Date().toISOString();
    return structuredClone(profile);
  }
}
