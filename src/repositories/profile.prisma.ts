import { prisma } from "@/lib/db/prisma";
import { Prisma } from "@/generated/prisma/client";
import { ensureProfile } from "@/services/profile.service";
import type { UpdateProfileInput } from "@/schemas/profile";
import type { AccountIdentity, ProfileDTO } from "@/types/profile";
import { parseAvatar } from "@/lib/avatars";
import { parseTalentPlan, type TalentPlanCode } from "@/lib/plans/entitlements";
import { profileSettingsWithDefaults, type ProfileSettings } from "@/types/profile-settings";
import type { ProfileRepository } from "./profile.repository";

type Row = Prisma.ProfileGetPayload<object>;

const toDTO = (r: Row): ProfileDTO => ({
  id: r.id,
  username: r.username,
  fullName: r.fullName,
  headline: r.headline,
  bio: r.bio,
  location: r.location,
  profession: r.profession,
  yearsOfExperience: r.yearsOfExperience,
  careerGoal: r.careerGoal,
  availability: r.availability,
  isPublic: r.isPublic,
  settings: profileSettingsWithDefaults(r.settings),
  plan: parseTalentPlan(r.plan),
  avatar: parseAvatar(r.avatarUrl),
  role: r.role,
  updatedAt: r.updatedAt.toISOString(),
});

export class PrismaProfileRepository implements ProfileRepository {
  async ensure(identity: AccountIdentity) {
    return toDTO(await ensureProfile({ id: identity.id, email: identity.email, fullName: identity.name }));
  }

  async findById(id: string) {
    const row = await prisma.profile.findUnique({ where: { id } });
    return row ? toDTO(row) : null;
  }

  async findByUsername(username: string) {
    const row = await prisma.profile.findUnique({ where: { username } });
    return row ? toDTO(row) : null;
  }

  async update(id: string, input: UpdateProfileInput) {
    try {
      const row = await prisma.profile.update({
        where: { id },
        data: {
          ...input,
          headline: input.headline ?? null,
          profession: input.profession ?? null,
          location: input.location ?? null,
          bio: input.bio ?? null,
          careerGoal: input.careerGoal ?? null,
        },
      });
      return toDTO(row);
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError) {
        if (err.code === "P2002") return "username_taken" as const;
        if (err.code === "P2025") return null;
      }
      throw err;
    }
  }

  async saveSettings(id: string, patch: Partial<ProfileSettings>) {
    const row = await prisma.profile.findUnique({ where: { id } });
    if (!row) return null;
    const next = { ...profileSettingsWithDefaults(row.settings), ...patch };
    const saved = await prisma.profile.update({
      where: { id },
      data: { settings: next as unknown as Prisma.InputJsonValue },
    });
    return toDTO(saved);
  }

  async getAvatarStored(id: string) {
    const row = await prisma.profile.findUnique({ where: { id }, select: { avatarUrl: true } });
    return row?.avatarUrl ?? null;
  }

  async setAvatarStored(id: string, stored: string | null) {
    const row = await prisma.profile.findUnique({ where: { id }, select: { avatarUrl: true } });
    if (!row) return undefined;
    await prisma.profile.update({ where: { id }, data: { avatarUrl: stored } });
    return { previous: row.avatarUrl };
  }

  async setPlan(id: string, plan: TalentPlanCode) {
    try {
      return toDTO(await prisma.profile.update({ where: { id }, data: { plan } }));
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2025") return null;
      throw err;
    }
  }

  async setPublic(id: string, isPublic: boolean) {
    try {
      return toDTO(await prisma.profile.update({ where: { id }, data: { isPublic } }));
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2025") return null;
      throw err;
    }
  }
}
