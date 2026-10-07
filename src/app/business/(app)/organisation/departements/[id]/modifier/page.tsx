import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DepartmentWizard } from "@/components/business/department-wizard";
import { NoAccess } from "@/components/business/ui";
import { requireBusiness } from "@/lib/business/context";
import { NotFoundError } from "@/lib/errors";
import { getOrganizationService } from "@/services/container";

export const metadata: Metadata = { title: "Modifier le département" };
export const dynamic = "force-dynamic";

export default async function EditDepartmentPage({
  params,
}: PageProps<"/business/organisation/departements/[id]/modifier">) {
  const ctx = await requireBusiness();
  if (!ctx.can("team.manage")) return <NoAccess what="de modifier des départements" />;
  const { id } = await params;
  const service = getOrganizationService();
  const orgId = ctx.organization.id;
  let department;
  try {
    department = await service.getDepartment(orgId, id);
  } catch (err) {
    if (err instanceof NotFoundError) notFound();
    throw err;
  }
  const [members, departments, sites] = await Promise.all([
    service.listMembers(orgId),
    service.listDepartments(orgId),
    service.listSites(orgId),
  ]);
  return (
    <DepartmentWizard
      department={department}
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
