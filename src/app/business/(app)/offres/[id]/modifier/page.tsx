import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { JobOfferWizard } from "@/components/business/job-offer-wizard";
import { NoAccess } from "@/components/business/ui";
import { requireBusiness } from "@/lib/business/context";
import { NotFoundError } from "@/lib/errors";
import { getJobOfferService, getOrganizationService, getOrgSkillService } from "@/services/container";

export const metadata: Metadata = { title: "Modifier l'offre d'emploi" };
export const dynamic = "force-dynamic";

export default async function EditJobOfferPage({ params }: PageProps<"/business/offres/[id]/modifier">) {
  const ctx = await requireBusiness();
  if (!(ctx.can("jobs.edit") || ctx.can("jobs.create")))
    return <NoAccess what="de modifier des offres d'emploi" />;
  const { id } = await params;
  let offer;
  try {
    offer = await getJobOfferService().get(ctx.organization.id, id);
  } catch (err) {
    if (err instanceof NotFoundError) notFound();
    throw err;
  }
  const [departments, orgSkills] = await Promise.all([
    getOrganizationService().listDepartments(ctx.organization.id),
    getOrgSkillService().list(ctx.organization.id),
  ]);
  const { name, industry, address, logoVersion } = ctx.organization;
  return (
    <JobOfferWizard
      offer={offer}
      organization={{ name, industry, address, logoVersion }}
      departments={departments.map((d) => ({ id: d.id, name: d.name }))}
      orgSkills={orgSkills.map((s) => ({ name: s.name, kind: s.kind }))}
    />
  );
}
