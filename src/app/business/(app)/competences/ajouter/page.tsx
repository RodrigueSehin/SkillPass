import type { Metadata } from "next";
import { NoAccess } from "@/components/business/ui";
import { SkillForm } from "@/components/business/skill-form";
import { requireBusiness } from "@/lib/business/context";
import { canManageSkills } from "@/lib/business/skill-access";
import { getTalentDirectoryRepository } from "@/repositories";

export const metadata: Metadata = { title: "Ajouter une compétence" };
export const dynamic = "force-dynamic";

export default async function AddSkillPage() {
  const ctx = await requireBusiness();
  if (!canManageSkills(ctx.can)) return <NoAccess what="d'ajouter des compétences au référentiel" />;
  const talents = await getTalentDirectoryRepository().listPublic(500);
  const categories = [
    ...new Set(
      talents.flatMap((t) => t.skills.map((s) => s.category).filter((c): c is string => Boolean(c))),
    ),
  ];
  return <SkillForm knownCategories={categories} />;
}
