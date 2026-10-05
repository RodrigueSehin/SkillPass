import Link from "next/link";
import { ChevronRight, FolderKanban } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { formatMonth } from "@/lib/utils/format";
import type { ProjectDTO } from "@/types/portfolio";

// Gradients stand in for project screenshots (images arrive with the portfolio feature).
const THUMBS = [
  "from-blue-600 to-indigo-700",
  "from-sky-500 to-blue-700",
  "from-slate-700 to-slate-900",
  "from-cyan-600 to-blue-800",
] as const;

export function RecentProjects({ projects }: { projects: ProjectDTO[] }) {
  return (
    <section
      aria-labelledby="recent-projects-title"
      className="border-border/60 shadow-soft rounded-2xl border bg-white p-6"
    >
      <div className="flex items-center justify-between gap-4">
        <h2 id="recent-projects-title" className="text-navy text-lg font-bold">
          Mes projets récents
        </h2>
        <Link href="/dashboard/projects" className="text-brand text-sm font-semibold hover:underline">
          Voir tous
        </Link>
      </div>

      {projects.length === 0 ? (
        <EmptyState
          className="mt-4 border-0 py-8"
          icon={FolderKanban}
          title="Aucun projet"
          description="Ajoutez vos réalisations pour les valoriser."
        />
      ) : (
        <ul className="divide-border/60 mt-3 divide-y">
          {projects.map((project, i) => (
            <li key={project.id}>
              <Link href="/dashboard/projects" className="group flex items-center gap-4 py-3">
                <span
                  aria-hidden
                  className={`flex size-14 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-lg font-bold text-white ${THUMBS[i % THUMBS.length]}`}
                >
                  {project.name.slice(0, 2).toUpperCase()}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="text-navy block truncate text-sm font-semibold">{project.name}</span>
                  <span className="mt-1.5 flex flex-wrap gap-1.5">
                    {project.skills.slice(0, 3).map((skill) => (
                      <span
                        key={skill}
                        className="text-brand rounded-md bg-blue-50 px-2 py-0.5 text-[11px] font-medium"
                      >
                        {skill}
                      </span>
                    ))}
                  </span>
                </span>
                <span className="text-muted hidden shrink-0 text-xs sm:block">
                  {formatMonth(project.endDate ?? project.startDate)}
                </span>
                <ChevronRight className="group-hover:text-brand size-4 shrink-0 text-slate-400" aria-hidden />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
