import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, Sparkles } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { AddSkillButton } from "@/components/skills/add-skill-button";
import { LevelOverview } from "@/components/skills/level-overview";
import { SkillRow } from "@/components/skills/skill-row";
import { SkillsHero } from "@/components/skills/skills-hero";
import { CategoryTabs, SkillsFilters, SkillsSortBar } from "@/components/skills/skills-controls";
import { requireUser } from "@/lib/auth/current-user";
import { listTalentSkillsQuerySchema } from "@/schemas/skill";
import { getSkillService } from "@/services/container";

export const metadata: Metadata = { title: "Compétences" };

export default async function SkillsPage({ searchParams }: PageProps<"/dashboard/skills">) {
  const user = await requireUser();
  const raw = await searchParams;
  const parsed = listTalentSkillsQuerySchema.safeParse(raw);
  // Invalid URL params fall back to defaults instead of breaking the page.
  const query = parsed.success ? parsed.data : listTalentSkillsQuerySchema.parse({});
  const view = raw.view === "list" ? "list" : "grid";
  const { items, categories, total, levels } = await getSkillService().list(user.id, query);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-navy text-2xl font-bold tracking-tight sm:text-3xl">Compétences</h1>
          <p className="text-muted mt-1">
            Explorez, développez et valorisez vos compétences pour construire votre avenir.
          </p>
        </div>
        <nav aria-label="Fil d'Ariane" className="text-muted flex items-center gap-1.5 text-xs">
          <Link href="/dashboard" className="hover:text-brand">
            Accueil
          </Link>
          <ChevronRight className="size-3" aria-hidden /> <span aria-current="page">Compétences</span>
        </nav>
      </div>

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_300px]">
        <div className="min-w-0 space-y-6">
          <SkillsHero />
          <CategoryTabs categories={categories} />

          <div className="grid items-start gap-6 lg:grid-cols-[220px_minmax(0,1fr)]">
            <SkillsFilters />
            <section aria-label="Liste des compétences" className="min-w-0">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-navy text-lg font-bold">
                  {items.length === total
                    ? `${total} compétence${total > 1 ? "s" : ""}`
                    : `${items.length} sur ${total} compétences`}
                </h2>
                <SkillsSortBar view={view} />
              </div>
              {total === 0 ? (
                <EmptyState
                  icon={Sparkles}
                  title="Aucune compétence pour l'instant"
                  description="Ajoutez votre première compétence, puis reliez-y des preuves pour la faire vérifier."
                  action={<AddSkillButton />}
                />
              ) : items.length === 0 ? (
                <EmptyState
                  icon={Sparkles}
                  title="Aucun résultat"
                  description="Modifiez vos filtres pour élargir la recherche."
                />
              ) : (
                <ul
                  className={
                    view === "list" ? "grid gap-4" : "grid gap-4 min-[1800px]:grid-cols-3 sm:grid-cols-2"
                  }
                >
                  {items.map((skill) => (
                    <li key={skill.id}>
                      <SkillRow skill={skill} />
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        </div>

        <aside className="grid min-w-0 gap-6 md:grid-cols-2 xl:grid-cols-1">
          <section
            aria-labelledby="add-skill-title"
            className="border-border/60 shadow-soft rounded-2xl border bg-white p-5"
          >
            <h2 id="add-skill-title" className="text-navy font-bold">
              Nouvelle compétence
            </h2>
            <p className="text-muted mt-2 text-sm">
              Ajoutez une nouvelle compétence à votre profil et commencez à la valoriser.
            </p>
            <div className="mt-4 [&_button]:w-full">
              <AddSkillButton />
            </div>
          </section>
          <LevelOverview levels={levels} total={total} />
        </aside>
      </div>
    </div>
  );
}
