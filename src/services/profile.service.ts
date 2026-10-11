import { randomBytes } from "node:crypto";
import { prisma } from "@/lib/db/prisma";
import type { Availability } from "@/generated/prisma/enums";

export interface EnsureProfileInput {
  id: string;
  email: string;
  fullName: string;
  profession?: string;
  location?: string;
  yearsOfExperience?: number;
  careerGoal?: string;
  availability?: Availability;
  /** False for company accounts: they are never listed as talents. Defaults to true. */
  isPublic?: boolean;
}

export function slugifyUsername(fullName: string) {
  const base = fullName
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 30);
  return base || "talent";
}

/** Creates the Profile row for an auth user if it does not exist yet. Idempotent. */
export async function ensureProfile(input: EnsureProfileInput) {
  const existing = await prisma.profile.findUnique({ where: { id: input.id } });
  if (existing) return existing;

  const username = `${slugifyUsername(input.fullName)}-${randomBytes(2).toString("hex")}`;
  return prisma.profile.create({
    data: {
      id: input.id,
      email: input.email,
      username,
      fullName: input.fullName,
      profession: input.profession,
      headline: input.profession,
      location: input.location,
      yearsOfExperience: input.yearsOfExperience ?? 0,
      careerGoal: input.careerGoal,
      availability: input.availability,
      isPublic: input.isPublic,
    },
  });
}

export function getProfileById(id: string) {
  return prisma.profile.findUnique({ where: { id } });
}
