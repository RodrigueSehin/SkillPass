import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { NoAccess } from "@/components/business/ui";
import { SkillForm } from "@/components/business/skill-form";
import { requireBusiness } from "@/lib/business/context";
import { canManageSkills } from "@/lib/business/skill-access";
import { NotFoundError } from "@/lib/errors";
import { getTalentDirectoryRepository } from "@/repositories";
import { getOrgSkillService } from "@/services/container";

export const metadata: Metadata = { title: "Modifier la compétence" };
export const dynamic = "force-dynamic";

export default async function EditSkillPage({ params }: PageProps<"/business/competences/[id]/modifier">) {
  const ctx = await requireBusiness();
  if (!canManageSkills(ctx.can)) return <NoAccess what="de modifier le référentiel" />;
  const { id } = await params;
  let skill;
  try {
    skill = await getOrgSkillService().get(ctx.organization.id, id);
  } catch (err) {
    if (err instanceof NotFoundError) notFound();
    throw err;
  }
  const talents = await getTalentDirectoryRepository().listPublic(500);
  const categories = [
    ...new Set(
      talents.flatMap((t) => t.skills.map((s) => s.category).filter((c): c is string => Boolean(c))),
    ),
  ];
  return <SkillForm skill={skill} knownCategories={categories} />;
}
