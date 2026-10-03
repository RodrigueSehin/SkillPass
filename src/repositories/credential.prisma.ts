import { prisma } from "@/lib/db/prisma";
import { Prisma } from "@/generated/prisma/client";
import type { CredentialDTO } from "@/types/verification";
import type { CredentialRepository, NewCredential } from "./credential.repository";

type Row = Prisma.CredentialGetPayload<object>;

const toDTO = (r: Row): CredentialDTO => ({
  credentialId: r.credentialId,
  profileId: r.profileId,
  talentSkillId: r.talentSkillId,
  skillName: r.skillName,
  level: r.level,
  issuer: r.issuer,
  issuedAt: r.issuedAt.toISOString(),
  expiresAt: r.expiresAt ? r.expiresAt.toISOString() : null,
  status: r.status,
  attemptId: r.attemptId,
});

export class PrismaCredentialRepository implements CredentialRepository {
  async create(profileId: string, input: NewCredential) {
    try {
      const row = await prisma.credential.create({
        data: {
          credentialId: input.credentialId,
          profileId,
          talentSkillId: input.talentSkillId,
          skillName: input.skillName,
          level: input.level,
          issuedAt: new Date(input.issuedAt),
          expiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
          attemptId: input.attemptId,
        },
      });
      return toDTO(row);
    } catch (err) {
      // Unique violation: id collision (caller retries) or credential already issued for this attempt.
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") return null;
      throw err;
    }
  }

  async findByCredentialId(credentialId: string) {
    const row = await prisma.credential.findUnique({ where: { credentialId } });
    return row ? toDTO(row) : null;
  }

  async listByProfile(profileId: string) {
    const rows = await prisma.credential.findMany({ where: { profileId }, orderBy: { issuedAt: "desc" } });
    return rows.map(toDTO);
  }

  async findByAttempt(attemptId: string) {
    const row = await prisma.credential.findUnique({ where: { attemptId } });
    return row ? toDTO(row) : null;
  }
}
