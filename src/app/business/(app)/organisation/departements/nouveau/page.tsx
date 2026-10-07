import type { Metadata } from "next";
import { DepartmentWizard } from "@/components/business/department-wizard";
import { NoAccess } from "@/components/business/ui";
import { requireBusiness } from "@/lib/business/context";
import { getOrganizationService } from "@/services/container";

export const metadata: Metadata = { title: "Ajouter un département" };
export const dynamic = "force-dynamic";

export default async function NewDepartmentPage() {
  const ctx = await requireBusiness();
  if (!ctx.can("team.manage")) return <NoAccess what="de créer des départements" />;
  const service = getOrganizationService();
  const orgId = ctx.organization.id;
  const [members, departments, sites] = await Promise.all([
    service.listMembers(orgId),
    service.listDepartments(orgId),
    service.listSites(orgId),
  ]);
  return (
    <DepartmentWizard
      members={members.map(({ id, firstName, lastName, email, jobTitle, status }) => ({
        id,
        firstName,
        lastName,
        email,
        jobTitle,
        status,
      }))}
      departments={departments.map(({ id, name }) => ({ id, name }))}
      sites={sites.map(({ id, name }) => ({ id, name }))}
    />
  );
}
