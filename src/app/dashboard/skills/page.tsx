import type { Metadata } from "next";
import { Sparkles } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { AddSkillButton } from "@/components/skills/add-skill-button";
import { SkillRow } from "@/components/skills/skill-row";
import { SkillsToolbar } from "@/components/skills/skills-toolbar";
import { requireUser } from "@/lib/auth/current-user";
import { listTalentSkillsQuerySchema } from "@/schemas/skill";
import { getSkillService } from "@/services/container";

export const metadata: Metadata = { title: "Compétences" };

export default async function SkillsPage({ searchParams }: PageProps<"/dashboard/skills">) {
  const user = await requireUser();
  const parsed = listTalentSkillsQuerySchema.safeParse(await searchParams);
  // Invalid URL params fall back to defaults instead of breaking the page.
  const query = parsed.success ? parsed.data : listTalentSkillsQuerySchema.parse({});
  const { items, categories, total } = await getSkillService().list(user.id, query);

  return (
    <>
      <PageHeader
        title="Compétences"
        description={`${total} compétence${total > 1 ? "s" : ""} dans votre SkillPass`}
        actions={<AddSkillButton />}
      />
      <SkillsToolbar categories={categories} />
      {total === 0 ? (
        <EmptyState
          icon={Sparkles}
          title="Aucune compétence pour l'instant"
          description="Ajoutez votre première compétence, puis reliez-y des preuves pour la faire vérifier."
          action={<AddSkillButton />}
        />
      ) : items.length === 0 ? (
        <EmptyState icon={Sparkles} title="Aucun résultat" description="Modifiez vos filtres pour élargir la recherche." />
      ) : (
        <ul className="grid gap-4 lg:grid-cols-2">
          {items.map((skill) => (
            <li key={skill.id}>
              <SkillRow skill={skill} />
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
