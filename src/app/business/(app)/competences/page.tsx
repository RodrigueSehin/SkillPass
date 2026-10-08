import type { Metadata } from "next";
import Link from "next/link";
import { BadgeCheck, Database, Plus, Star, Target, Users } from "lucide-react";
import { Pagination } from "@/components/business/pagination";
import { SkillsTable } from "@/components/business/skills-table";
import { SkillsToolbar } from "@/components/business/skills-toolbar";
import { CategoryShare, DemandTrend, MostDemanded } from "@/components/business/skills-side";
import { LinkTabs, Panel, StatCard } from "@/components/business/ui";
import { buttonVariants } from "@/components/ui/button";
import { requireBusiness } from "@/lib/business/context";
import { canManageSkills } from "@/lib/business/skill-access";
import {
  SKILL_TABS,
  SKILLS_PER_PAGE,
  buildSkillRows,
  categoryShare,
  demandTrend,
  filterSkillRows,
  parseSkillTab,
  skillStats,
  topDemanded,
} from "@/lib/business/skill-insights";
import { paginate } from "@/lib/project-view";
import { cn } from "@/lib/utils/cn";
import { getOpportunityRepository, getTalentDirectoryRepository } from "@/repositories";
import { getOrgSkillService } from "@/services/container";

export const metadata: Metadata = { title: "Compétences" };
export const dynamic = "force-dynamic";

const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
const DIRECTORY_LIMIT = 500;

export default async function SkillsPage({ searchParams }: PageProps<"/business/competences">) {
  const ctx = await requireBusiness();
  const raw = await searchParams;
  const [talents, offers, orgSkills] = await Promise.all([
    getTalentDirectoryRepository().listPublic(DIRECTORY_LIMIT),
    getOpportunityRepository().list(),
    getOrgSkillService().list(ctx.organization.id),
  ]);
  const rows = buildSkillRows(talents, offers, orgSkills);
  const tab = parseSkillTab(first(raw.tab));
  const filtered = filterSkillRows(rows, {
    tab,
    q: first(raw.q),
    category: first(raw.category),
    demand: first(raw.demand),
  });
  const { page, pages, items } = paginate(filtered, Number(first(raw.page)), SKILLS_PER_PAGE);
  const stats = skillStats(rows, talents);
  const canManage = canManageSkills(ctx.can);
  const counts = {
    all: rows.length,
    technical: stats.technical,
    transversal: stats.transversal,
    referential: orgSkills.length,
  };
  const demanded = topDemanded(rows, 5);
  const trend = demandTrend(
    offers,
    topDemanded(rows, 4).map((r) => r.name),
    new Date(),
  );

  const hrefFor = (n: number) => {
    const next = new URLSearchParams();
    for (const [key, value] of Object.entries(raw)) {
      const v = first(value);
      if (v && key !== "page") next.set(key, v);
    }
    if (n > 1) next.set("page", String(n));
    const qs = next.toString();
    return qs ? `/business/competences?${qs}` : "/business/competences";
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-navy text-2xl font-bold tracking-tight sm:text-3xl">Compétences</h1>
          <p className="text-muted mt-1">
            Explorez les compétences disponibles dans la base de talents et identifiez celles dont vous avez
            besoin.
          </p>
        </div>
        {canManage && (
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/business/competences?tab=referential"
              className={cn(buttonVariants({ variant: "outline" }), "border-brand text-brand h-12 px-5")}
            >
              Gérer le référentiel
            </Link>
            <Link href="/business/competences/ajouter" className={cn(buttonVariants(), "h-12 px-5")}>
              <Plus /> Ajouter une compétence
            </Link>
          </div>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={Database}
          tone="bg-blue-50 text-brand"
          value={stats.unique.toLocaleString("fr-FR")}
          label="Compétences uniques"
        />
        <StatCard
          icon={Users}
          tone="bg-blue-50 text-brand"
          value={stats.talents.toLocaleString("fr-FR")}
          label="Talents possédant au moins une compétence"
        />
        <StatCard
          icon={Target}
          tone="bg-violet-100 text-violet-600"
          value={stats.veryDemanded}
          label="Compétences très demandées"
        />
        <StatCard
          icon={Star}
          tone="bg-amber-100 text-amber-600"
          value={stats.averageLevel === null ? "—" : `${String(stats.averageLevel).replace(".", ",")}/5`}
          label="Niveau moyen des talents"
        />
      </div>

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <Panel className="min-w-0">
          <div className="px-5 pt-1">
            <LinkTabs
              label="Types de compétences"
              current={tab}
              tabs={SKILL_TABS.filter(
                ([key]) => key !== "referential" || canManage || counts.referential > 0,
              ).map(([key, label]) => ({
                key,
                label: `${label} (${counts[key].toLocaleString("fr-FR")})`,
                href: key === "all" ? "/business/competences" : `/business/competences?tab=${key}`,
              }))}
            />
          </div>
          <div className="pt-4">
            <SkillsToolbar
              categories={[...new Set(rows.map((r) => r.category))].sort((a, b) => a.localeCompare(b))}
            />
          </div>
          <SkillsTable rows={items} canManage={canManage} canSeeTalents={ctx.can("talents.view")} />
          <Pagination
            page={page}
            pages={pages}
            total={filtered.length}
            size={SKILLS_PER_PAGE}
            noun="compétences"
            hrefFor={hrefFor}
          />
        </Panel>

        <aside className="grid min-w-0 gap-6 md:grid-cols-2 xl:grid-cols-1">
          <CategoryShare items={categoryShare(rows)} total={rows.length} />
          <MostDemanded rows={demanded} seeAllHref="/business/competences?demand=VERY_HIGH" />
          <div className="md:col-span-2 xl:col-span-1">
            <DemandTrend labels={trend.labels} series={trend.series} />
          </div>
        </aside>
      </div>
      <p className="text-muted flex items-center gap-1.5 text-xs">
        <BadgeCheck className="size-3.5" aria-hidden /> Les chiffres portent sur les profils publics et sur
        les offres actuellement publiées sur SkillPass.
      </p>
    </div>
  );
}
