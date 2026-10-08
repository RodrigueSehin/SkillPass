import type { Metadata } from "next";
import { JobOfferWizard } from "@/components/business/job-offer-wizard";
import { NoAccess } from "@/components/business/ui";
import { requireBusiness } from "@/lib/business/context";
import { getOrganizationService, getOrgSkillService } from "@/services/container";

export const metadata: Metadata = { title: "Créer une offre d'emploi" };
export const dynamic = "force-dynamic";

export default async function NewJobOfferPage() {
  const ctx = await requireBusiness();
  if (!ctx.can("jobs.create")) return <NoAccess what="de créer des offres d'emploi" />;
  const [departments, orgSkills] = await Promise.all([
    getOrganizationService().listDepartments(ctx.organization.id),
    getOrgSkillService().list(ctx.organization.id),
  ]);
  const { name, industry, address, logoVersion } = ctx.organization;
  return (
    <JobOfferWizard
      organization={{ name, industry, address, logoVersion }}
      departments={departments.map((d) => ({ id: d.id, name: d.name }))}
      orgSkills={orgSkills.map((s) => ({ name: s.name, kind: s.kind }))}
    />
  );
}
