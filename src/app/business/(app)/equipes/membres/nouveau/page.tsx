import type { Metadata } from "next";
import { MemberWizard } from "@/components/business/member-wizard";
import { NoAccess } from "@/components/business/ui";
import { requireBusiness } from "@/lib/business/context";
import { getOrganizationService } from "@/services/container";
import { memberName } from "@/types/business";

export const metadata: Metadata = { title: "Ajouter un membre" };
export const dynamic = "force-dynamic";

export default async function NewMemberPage() {
  const ctx = await requireBusiness();
  if (!ctx.can("team.manage")) return <NoAccess what="d'inviter des membres" />;
  const service = getOrganizationService();
  const [departments, members] = await Promise.all([
    service.listDepartments(ctx.organization.id),
    service.listMembers(ctx.organization.id),
  ]);
  return (
    <MemberWizard
      plan={ctx.organization.plan}
      organizationName={ctx.organization.name}
      teams={departments.map((d) => ({ id: d.id, name: d.name, look: d.look, members: d.members.length }))}
      managers={members.filter((m) => m.status === "ACTIVE").map((m) => ({ id: m.id, name: memberName(m) }))}
    />
  );
}
