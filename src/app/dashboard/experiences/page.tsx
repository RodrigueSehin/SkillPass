import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Briefcase, Building2, CalendarClock, ChevronRight, FolderKanban } from "lucide-react";
import heroPhoto from "@/assets/skills/hero.jpg";
import { ExperienceCard } from "@/components/experiences/experience-card";
import { ExperienceFilters, ExperienceSort } from "@/components/experiences/experience-controls";
import { ExperienceEditor } from "@/components/experiences/experience-editor";
import {
  AddExperiencePanel,
  CareerFigures,
  TopSkills,
  ValuePromo,
} from "@/components/experiences/experience-side";
import type { ItemView } from "@/components/resources/resource-manager";
import { StatCard } from "@/components/skills/stat-card";
import { EmptyState } from "@/components/ui/empty-state";
import { requireUser } from "@/lib/auth/current-user";
import { DOMAIN_IDEAS } from "@/lib/experience-options";
import {
  experienceStats,
  facetCounts,
  filterExperiences,
  isCurrent,
  parseList,
  placeOf,
  skillsByUsage,
} from "@/lib/experience-view";
import { CONTRACT_LABELS } from "@/schemas/portfolio";
import { getExperienceService, getProjectService, getSkillService } from "@/services/container";

export const metadata: Metadata = { title: "Expériences" };

const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

export default async function ExperiencesPage({ searchParams }: PageProps<"/dashboard/experiences">) {
  const user = await requireUser();
  const raw = await searchParams;
  const [all, skills, projects] = await Promise.all([
    getExperienceService().list(user.id),
    getSkillService().list(user.id),
    getProjectService().list(user.id),
  ]);

  const shown = filterExperiences(all, {
    q: first(raw.q),
    contract: parseList(raw.contract),
    period: parseList(raw.period),
    domain: parseList(raw.domain),
    place: parseList(raw.place),
    sort: first(raw.sort),
  });
  const stats = experienceStats(all);
  const grid = first(raw.view) === "grid";

  const contractLabels = CONTRACT_LABELS as Record<string, string>;
  const current = all.filter(isCurrent).length;
  const filters = {
    contracts: facetCounts(all, (e) => e.contractType).map((c) => ({
      value: c.name,
      label: contractLabels[c.name] ?? c.name,
      count: c.count,
    })),
    periods: [
      { value: "current", label: "En cours", count: current },
      { value: "past", label: "Passées", count: all.length - current },
    ],
    domains: [
      ...facetCounts(all, (e) => e.domain),
      ...DOMAIN_IDEAS.filter((d) => !all.some((e) => e.domain === d)).map((name) => ({ name, count: 0 })),
    ].map((d) => ({ value: d.name, label: d.name, count: d.count })),
    places: facetCounts(all, placeOf).map((p) => ({ value: p.name, label: p.name, count: p.count })),
  };

  // Skills actually used in experiences, with the user's own score; fall back to the best skills overall.
  const scoreOf = new Map(skills.items.map((s) => [s.name, s.score]));
  const linked = skillsByUsage(all).filter((name) => scoreOf.has(name));
  const topSkills = (
    linked.length ? linked.map((name) => ({ name, score: scoreOf.get(name)! })) : skills.items
  )
    .map((s) => ({ name: s.name, score: s.score }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  const view = (e: (typeof all)[number]): ItemView => ({
    id: e.id,
    title: e.title,
    subtitle: e.company,
    lines: [],
    badges: [],
    links: [],
    values: {
      title: e.title,
      company: e.company,
      location: e.location ?? "",
      description: e.description ?? "",
      contractType: e.contractType ?? "",
      workMode: e.workMode ?? "",
      domain: e.domain ?? "",
      startDate: e.startDate,
      endDate: e.endDate ?? "",
      skills: e.skills,
    },
  });

  return (
    <ExperienceEditor skillOptions={skills.items.map((s) => s.name)}>
      <div className="space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-navy flex items-center gap-3 text-2xl font-bold tracking-tight sm:text-3xl">
              <Briefcase className="text-brand size-8" aria-hidden /> Expériences
            </h1>
            <p className="text-muted mt-1">
              Valorisez votre parcours professionnel et montrez l&apos;impact de vos réalisations.
            </p>
          </div>
          <nav aria-label="Fil d'Ariane" className="text-muted flex items-center gap-1.5 text-xs">
            <Link href="/dashboard" className="hover:text-brand">
              Accueil
            </Link>
            <ChevronRight className="size-3" aria-hidden /> <span aria-current="page">Expériences</span>
          </nav>
        </div>

        <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_300px]">
          <div className="min-w-0 space-y-6">
            <section
              aria-label="Présentation"
              className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-50 via-blue-100/70 to-blue-200/60 p-6 sm:p-8"
            >
              <div className="relative z-10 max-w-md">
                <h2 className="text-navy text-2xl leading-tight font-extrabold sm:text-3xl">
                  Transformez votre parcours en opportunités.
                </h2>
                <p className="text-navy/80 mt-3 text-sm sm:text-base">
                  Ajoutez vos expériences professionnelles, mettez en avant vos réalisations et faites la
                  différence auprès des recruteurs.
                </p>
              </div>
              <div aria-hidden className="absolute inset-y-0 right-0 hidden w-2/5 md:block">
                <Image
                  src={heroPhoto}
                  alt=""
                  fill
                  sizes="(min-width: 1280px) 360px, 280px"
                  className="[mask-image:linear-gradient(to_right,transparent,black_35%)] object-cover object-top"
                />
              </div>
            </section>

            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              <StatCard label="Expériences" value={stats.total} icon={Briefcase} />
              <StatCard label="Entreprises" value={stats.companies} icon={Building2} />
              <StatCard
                label={stats.years > 1 ? "ans d'expérience" : "an d'expérience"}
                value={stats.years}
                icon={CalendarClock}
              />
              <StatCard label="Projets" value={projects.length} icon={FolderKanban} />
            </div>

            <div className="grid items-start gap-6 lg:grid-cols-[220px_minmax(0,1fr)]">
              <ExperienceFilters {...filters} />
              <section aria-label="Liste des expériences" className="min-w-0">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <h2 className="text-navy text-lg font-bold">
                    {shown.length === all.length
                      ? `${all.length} expérience${all.length > 1 ? "s" : ""}`
                      : `${shown.length} sur ${all.length} expériences`}
                  </h2>
                  <ExperienceSort />
                </div>
                {all.length === 0 ? (
                  <EmptyState
                    icon={Briefcase}
                    title="Aucune expérience pour l'instant"
                    description="Ajoutez vos postes pour appuyer vos années d'expérience."
                  />
                ) : shown.length === 0 ? (
                  <EmptyState
                    icon={Briefcase}
                    title="Aucun résultat"
                    description="Modifiez vos filtres pour élargir la recherche."
                  />
                ) : grid ? (
                  <ul className="grid gap-4 md:grid-cols-2">
                    {shown.map((e) => (
                      <li key={e.id}>
                        <ExperienceCard experience={e} item={view(e)} />
                      </li>
                    ))}
                  </ul>
                ) : (
                  <ol className="relative space-y-4 border-l-2 border-blue-100 pl-6">
                    {shown.map((e) => (
                      <li key={e.id} className="relative">
                        <span
                          aria-hidden
                          className="bg-brand absolute top-6 -left-[calc(1.5rem+6px)] size-2.5 rounded-full ring-4 ring-white"
                        />
                        <ExperienceCard experience={e} item={view(e)} />
                      </li>
                    ))}
                  </ol>
                )}
              </section>
            </div>
          </div>

          <aside className="grid min-w-0 gap-6 md:grid-cols-2 xl:grid-cols-1">
            <AddExperiencePanel />
            <CareerFigures
              figures={{
                years: stats.years,
                companies: stats.companies,
                countries: stats.countries,
                domains: stats.domains,
              }}
            />
            <TopSkills skills={topSkills} />
            <ValuePromo />
          </aside>
        </div>
      </div>
    </ExperienceEditor>
  );
}
