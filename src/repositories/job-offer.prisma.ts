import { prisma } from "@/lib/db/prisma";
import type { Prisma } from "@/generated/prisma/client";
import type { JobChannel, JobOfferDTO, JobOfferInput } from "@/types/job-offer";
import type { JobOfferRepository, JobPublication } from "./job-offer.repository";

type Row = Prisma.JobOfferGetPayload<object>;

const day = (d: Date | null) => (d ? d.toISOString().slice(0, 10) : null);
const date = (s: string | null | undefined) => (s ? new Date(`${s}T00:00:00.000Z`) : null);

const toOffer = (r: Row): JobOfferDTO => ({
  id: r.id,
  title: r.title,
  description: r.description,
  contract: r.contract as JobOfferDTO["contract"],
  location: r.location,
  workMode: r.workMode as JobOfferDTO["workMode"],
  departmentId: r.departmentId,
  experience: r.experience,
  positions: r.positions,
  deadline: day(r.deadline),
  salaryMin: r.salaryMin,
  salaryMax: r.salaryMax,
  currency: r.currency,
  skills: r.skills,
  softSkills: r.softSkills,
  certifications: r.certifications,
  education: r.education,
  languages: r.languages,
  otherLanguage: r.otherLanguage,
  permit: r.permit,
  mobility: r.mobility as JobOfferDTO["mobility"],
  availability: r.availability as JobOfferDTO["availability"],
  visibility: r.visibility as JobOfferDTO["visibility"],
  publishOn: day(r.publishOn),
  durationMonths: r.durationMonths,
  channels: r.channels as JobChannel[],
  applicationMode: r.applicationMode as JobOfferDTO["applicationMode"],
  status: r.status as JobOfferDTO["status"],
  opportunityId: r.opportunityId,
  createdById: r.createdById,
  publishedAt: r.publishedAt ? r.publishedAt.toISOString() : null,
  createdAt: r.createdAt.toISOString(),
});

const data = (i: JobOfferInput) => ({
  title: i.title,
  description: i.description,
  contract: i.contract,
  location: i.location,
  workMode: i.workMode,
  departmentId: i.departmentId,
  experience: i.experience,
  positions: i.positions,
  deadline: date(i.deadline),
  salaryMin: i.salaryMin,
  salaryMax: i.salaryMax,
  currency: i.currency,
  skills: i.skills,
  softSkills: i.softSkills,
  certifications: i.certifications,
  education: i.education,
  languages: i.languages,
  otherLanguage: i.otherLanguage,
  permit: i.permit,
  mobility: i.mobility,
  availability: i.availability,
  visibility: i.visibility,
  publishOn: date(i.publishOn),
  durationMonths: i.durationMonths,
  channels: i.channels,
  applicationMode: i.applicationMode,
});

export class PrismaJobOfferRepository implements JobOfferRepository {
  async list(orgId: string) {
    const rows = await prisma.jobOffer.findMany({
      where: { organizationId: orgId },
      orderBy: { createdAt: "desc" },
    });
    return rows.map(toOffer);
  }

  async get(orgId: string, id: string) {
    const row = await prisma.jobOffer.findFirst({ where: { id, organizationId: orgId } });
    return row ? toOffer(row) : null;
  }

  async create(orgId: string, input: JobOfferInput, createdById: string | null) {
    const row = await prisma.jobOffer.create({
      data: { organizationId: orgId, createdById, status: "DRAFT", ...data(input) },
    });
    return toOffer(row);
  }

  async update(orgId: string, id: string, input: JobOfferInput) {
    const { count } = await prisma.jobOffer.updateMany({
      where: { id, organizationId: orgId },
      data: data(input),
    });
    return count === 0 ? null : this.get(orgId, id);
  }

  async setPublication(orgId: string, id: string, p: JobPublication) {
    const { count } = await prisma.jobOffer.updateMany({
      where: { id, organizationId: orgId },
      data: {
        status: p.status,
        opportunityId: p.opportunityId,
        publishedAt: p.publishedAt ? new Date(p.publishedAt) : null,
      },
    });
    return count === 0 ? null : this.get(orgId, id);
  }

  async delete(orgId: string, id: string) {
    const existing = await this.get(orgId, id);
    if (!existing) return null;
    await prisma.jobOffer.deleteMany({ where: { id, organizationId: orgId } });
    return existing;
  }
}
