import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  Briefcase,
  CalendarClock,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  FolderKanban,
  IdCard,
  Star,
  Timer,
} from "lucide-react";
import heroPhoto from "@/assets/skills/hero.jpg";
import { ProjectCard } from "@/components/projects/project-card";
import { ProjectFilters, ProjectSort } from "@/components/projects/project-controls";
import { ProjectEditor } from "@/components/projects/project-editor";
import {
  AddProjectPanel,
  DomainBreakdown,
  FeatureTip,
  NextProject,
  TopTechnologies,
} from "@/components/projects/project-side";
import type { ItemView } from "@/components/resources/resource-manager";
import { StatCard } from "@/components/skills/stat-card";
import { EmptyState } from "@/components/ui/empty-state";
import { requireUser } from "@/lib/auth/current-user";
import { parseList } from "@/lib/experience-view";
import {
  countBy,
  filterProjects,
  nextProject,
  paginate,
  PROJECT_STATUS_LABELS,
  projectStats,
  projectStatus,
  TECH_FILTERS_SHOWN,
  topTechnologies,
  type ProjectStatus,
} from "@/lib/project-view";
import { cn } from "@/lib/utils/cn";
import { getProjectService, getSkillService } from "@/services/container";

export const metadata: Metadata = { title: "Projets" };

const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

export default async function ProjectsPage({ searchParams }: PageProps<"/dashboard/projects">) {
  const user = await requireUser();
  const raw = await searchParams;
  const [all, skills] = await Promise.all([
    getProjectService().list(user.id),
    getSkillService().list(user.id),
  ]);
  const today = new Date().toISOString().slice(0, 10);

  const filtered = filterProjects(
    all,
    {
      q: first(raw.q),
      status: parseList(raw.status),
      domain: parseList(raw.domain),
      tech: parseList(raw.tech),
      sort: first(raw.sort),
    },
    today,
  );
  const { page, pages, items: shown } = paginate(filtered, Number(first(raw.page)));
  const list = first(raw.view) === "list";
  const stats = projectStats(all, today);

  const statusCounts: Record<ProjectStatus, number> = {
    COMPLETED: stats.completed,
    IN_PROGRESS: stats.inProgress,
    PAUSED: stats.paused,
    PLANNED: stats.planned,
  };
  const domains = countBy(all.map((p) => p.domain));
  const technologies = countBy(all.flatMap((p) => p.skills));
  const showAllTech = first(raw.more) === "1";
  const visibleTech = showAllTech ? technologies : technologies.slice(0, TECH_FILTERS_SHOWN);
  const filters = {
    total: all.length,
    statuses: (Object.keys(statusCounts) as ProjectStatus[]).map((s) => ({
      value: s,
      label: PROJECT_STATUS_LABELS[s],
      count: statusCounts[s],
    })),
    domains: domains.map((d) => ({ value: d.name, label: d.name, count: d.count })),
    technologies: visibleTech.map((t) => ({ value: t.name, label: t.name, count: t.count })),
    moreTechnologies: Math.max(0, technologies.length - TECH_FILTERS_SHOWN),
  };

  const view = (p: (typeof all)[number]): ItemView => ({
    id: p.id,
    title: p.name,
    subtitle: p.organization ?? undefined,
    lines: [],
    badges: [],
    links: [],
    values: {
      name: p.name,
      organization: p.organization ?? "",
      role: p.role ?? "",
      description: p.description ?? "",
      startDate: p.startDate ?? "",
      endDate: p.endDate ?? "",
      repositoryUrl: p.repositoryUrl ?? "",
      url: p.url ?? "",
      domain: p.domain ?? "",
      teamSize: p.teamSize ? String(p.teamSize) : "",
      featured: p.featured ? "true" : "",
      status: p.status ?? "",
      videoUrl: p.videoUrl ?? "",
      otherUrl: p.otherUrl ?? "",
      isPublic: p.isPublic ? "true" : "",
      cover: "",
      skills: p.skills,
    },
  });

  /** Keeps the active filters when moving between pages. */
  const pageHref = (n: number) => {
    const next = new URLSearchParams();
    for (const [key, value] of Object.entries(raw)) {
      const v = first(value);
      if (v && key !== "page") next.set(key, v);
    }
    if (n > 1) next.set("page", String(n));
    const qs = next.toString();
    return qs ? `/dashboard/projects?${qs}` : "/dashboard/projects";
  };

  return (
    <ProjectEditor skillOptions={skills.items.map((s) => s.name).sort()}>
      <div className="space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-navy flex items-center gap-3 text-2xl font-bold tracking-tight sm:text-3xl">
              <Briefcase className="text-brand size-8" aria-hidden /> Projets
            </h1>
            <p className="text-muted mt-1">
              Découvrez mes réalisations, explorez mes projets et voyez comment je transforme les idées en
              solutions concrètes.
            </p>
          </div>
          <nav aria-label="Fil d'Ariane" className="text-muted flex items-center gap-1.5 text-xs">
            <Link href="/dashboard" className="hover:text-brand">
              Accueil
            </Link>
            <ChevronRight className="size-3" aria-hidden /> <span aria-current="page">Projets</span>
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
                  Des projets concrets pour un impact réel.
                </h2>
                <p className="text-navy/80 mt-3 text-sm sm:text-base">
                  Découvrez mes réalisations, les technologies que j&apos;utilise et la valeur que
                  j&apos;apporte à travers chaque projet.
                </p>
                <div className="mt-5 flex flex-wrap gap-3">
                  <Link
                    href="/dashboard/skillpass"
                    className="text-brand border-brand/40 inline-flex h-11 items-center gap-2 rounded-xl border bg-white/70 px-5 text-sm font-semibold hover:bg-white"
                  >
                    <IdCard className="size-4" aria-hidden /> Voir mon portfolio
                  </Link>
                </div>
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
              <StatCard label="Projets réalisés" value={stats.completed} icon={CheckCircle2} />
              <StatCard label="En cours" value={stats.inProgress} icon={Timer} />
              <StatCard label="En planification" value={stats.planned} icon={CalendarClock} />
              <StatCard label="Projets mis en avant" value={stats.featured} icon={Star} />
            </div>

            <div className="grid items-start gap-6 lg:grid-cols-[220px_minmax(0,1fr)]">
              <ProjectFilters {...filters} />
              <section aria-label="Liste des projets" className="min-w-0">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <h2 className="text-navy text-lg font-bold">
                    {filtered.length === all.length
                      ? `${all.length} projet${all.length > 1 ? "s" : ""}`
                      : `${filtered.length} sur ${all.length} projets`}
                  </h2>
                  <ProjectSort />
                </div>
                {all.length === 0 ? (
                  <EmptyState
                    icon={FolderKanban}
                    title="Aucun projet pour l'instant"
                    description="Les projets sont vos meilleures preuves : reliez-les aux compétences qu'ils démontrent."
                  />
                ) : shown.length === 0 ? (
                  <EmptyState
                    icon={FolderKanban}
                    title="Aucun résultat"
                    description="Modifiez vos filtres pour élargir la recherche."
                  />
                ) : (
                  <ul className={cn("grid gap-4", list ? "grid-cols-1" : "sm:grid-cols-2 2xl:grid-cols-3")}>
                    {shown.map((p) => (
                      <li key={p.id}>
                        <ProjectCard project={p} status={projectStatus(p, today)} item={view(p)} />
                      </li>
                    ))}
                  </ul>
                )}

                {pages > 1 && (
                  <nav aria-label="Pagination" className="mt-6 flex items-center justify-center gap-2">
                    <Link
                      href={pageHref(page - 1)}
                      aria-label="Page précédente"
                      aria-disabled={page === 1}
                      className={cn(
                        "border-border text-navy flex size-9 items-center justify-center rounded-lg border bg-white",
                        page === 1 && "pointer-events-none opacity-40",
                      )}
                    >
                      <ChevronLeft className="size-4" aria-hidden />
                    </Link>
                    {Array.from({ length: pages }, (_, i) => i + 1).map((n) => (
                      <Link
                        key={n}
                        href={pageHref(n)}
                        aria-current={n === page ? "page" : undefined}
                        className={cn(
                          "flex size-9 items-center justify-center rounded-lg border text-sm font-semibold",
                          n === page
                            ? "bg-brand border-brand text-white"
                            : "border-border text-navy bg-white hover:bg-slate-50",
                        )}
                      >
                        {n}
                      </Link>
                    ))}
                    <Link
                      href={pageHref(page + 1)}
                      aria-label="Page suivante"
                      aria-disabled={page === pages}
                      className={cn(
                        "border-border text-navy flex size-9 items-center justify-center rounded-lg border bg-white",
                        page === pages && "pointer-events-none opacity-40",
                      )}
                    >
                      <ChevronRight className="size-4" aria-hidden />
                    </Link>
                  </nav>
                )}
              </section>
            </div>
          </div>

          <aside className="grid min-w-0 gap-6 md:grid-cols-2 xl:grid-cols-1">
            <AddProjectPanel />
            <FeatureTip />
            <DomainBreakdown domains={domains} total={all.length} />
            <TopTechnologies items={topTechnologies(all)} />
            <NextProject project={nextProject(all, today)} />
          </aside>
        </div>
      </div>
    </ProjectEditor>
  );
}
