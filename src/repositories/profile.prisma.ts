import { prisma } from "@/lib/db/prisma";
import { Prisma } from "@/generated/prisma/client";
import { ensureProfile } from "@/services/profile.service";
import type { UpdateProfileInput } from "@/schemas/profile";
import type { AccountIdentity, ProfileDTO } from "@/types/profile";
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
  updatedAt: r.updatedAt.toISOString(),
});

export class PrismaProfileRepository implements ProfileRepository {
  async ensure(identity: AccountIdentity) {
    return toDTO(await ensureProfile({ id: identity.id, email: identity.email, fullName: identity.name }));
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
}
