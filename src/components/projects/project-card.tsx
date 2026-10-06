import Image from "next/image";
import {
  CalendarDays,
  CheckCircle2,
  ExternalLink,
  FolderKanban,
  Pause,
  Star,
  Timer,
  Users,
} from "lucide-react";
import type { ItemView } from "@/components/resources/resource-manager";
import { monthLabel, PROJECT_STATUS_LABELS, type ProjectStatus } from "@/lib/project-view";
import { cn } from "@/lib/utils/cn";
import type { ProjectDTO } from "@/types/portfolio";
import { ProjectCardActions } from "./project-editor";

const STATUS_STYLE: Record<ProjectStatus, { tone: string; icon: typeof Timer }> = {
  COMPLETED: { tone: "bg-green-50 text-green-700", icon: CheckCircle2 },
  IN_PROGRESS: { tone: "bg-blue-50 text-brand", icon: Timer },
  PAUSED: { tone: "bg-amber-50 text-amber-700", icon: Pause },
  PLANNED: { tone: "bg-purple-50 text-purple-700", icon: CalendarDays },
};

const COVERS = [
  "from-blue-500 to-indigo-700",
  "from-emerald-500 to-teal-700",
  "from-orange-400 to-rose-600",
  "from-violet-500 to-fuchsia-700",
  "from-sky-500 to-blue-800",
];

/** Same gradient for the same project, whatever the order of the list. */
const coverFor = (name: string) =>
  COVERS[[...name].reduce((sum, ch) => sum + ch.charCodeAt(0), 0) % COVERS.length];

const MAX_SKILLS = 3;

export function ProjectCard({
  project: p,
  status,
  item,
}: {
  project: ProjectDTO;
  status: ProjectStatus;
  item: ItemView;
}) {
  const { tone, icon: StatusIcon } = STATUS_STYLE[status];

  return (
    <article className="border-border/60 shadow-soft hover:shadow-lift flex h-full flex-col rounded-2xl border bg-white p-3 transition-shadow">
      <div className="relative h-36 overflow-hidden rounded-xl">
        {p.coverUrl?.startsWith("/api/") ? (
          // eslint-disable-next-line @next/next/no-img-element -- private, owner-only image served by the API
          <img src={p.coverUrl} alt="" className="h-full w-full object-cover" />
        ) : p.coverUrl ? (
          <Image
            src={p.coverUrl}
            alt=""
            fill
            sizes="(min-width: 1536px) 320px, (min-width: 640px) 45vw, 100vw"
            className="object-cover object-top"
          />
        ) : (
          <div
            aria-hidden
            className={cn(
              "flex h-full w-full items-center justify-center bg-gradient-to-br",
              coverFor(p.name),
            )}
          >
            <FolderKanban className="size-12 text-white/70" />
          </div>
        )}
        <div className="absolute top-2 left-2 flex flex-wrap gap-1.5 text-[11px] font-semibold">
          {p.featured && (
            <span className="flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-amber-800 shadow-sm">
              <Star className="size-3 fill-current" aria-hidden /> Mis en avant
            </span>
          )}
          <span className={cn("flex items-center gap-1 rounded-full px-2.5 py-1 shadow-sm", tone)}>
            <StatusIcon className="size-3" aria-hidden /> {PROJECT_STATUS_LABELS[status]}
          </span>
        </div>
      </div>

      <div className="flex flex-1 flex-col px-2 pt-3 pb-1">
        <div className="flex items-start justify-between gap-2">
          <h2 className="text-navy font-bold">{p.name}</h2>
          <ProjectCardActions item={item} />
        </div>
        {p.description && <p className="text-muted mt-1 line-clamp-2 text-sm">{p.description}</p>}

        {p.skills.length > 0 && (
          <ul aria-label="Technologies" className="mt-3 flex flex-wrap gap-1.5">
            {p.skills.slice(0, MAX_SKILLS).map((s) => (
              <li key={s} className="text-brand rounded-md bg-blue-50 px-2.5 py-1 text-[11px] font-medium">
                {s}
              </li>
            ))}
            {p.skills.length > MAX_SKILLS && (
              <li className="text-brand rounded-md bg-blue-50 px-2.5 py-1 text-[11px] font-medium">
                +{p.skills.length - MAX_SKILLS}
              </li>
            )}
          </ul>
        )}

        <div className="text-muted mt-auto flex flex-wrap items-center gap-x-4 gap-y-1 pt-4 text-xs">
          {p.startDate && (
            <span className="flex items-center gap-1.5">
              <CalendarDays className="size-3.5" aria-hidden /> {monthLabel(p.startDate)}
            </span>
          )}
          {p.teamSize && (
            <span className="flex items-center gap-1.5">
              <Users className="size-3.5" aria-hidden /> Équipe de {p.teamSize}
            </span>
          )}
          {p.url && (
            <a
              href={p.url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Ouvrir ${p.name}`}
              className="text-brand ml-auto flex items-center gap-1 font-semibold hover:underline"
            >
              Voir <ExternalLink className="size-3.5" aria-hidden />
            </a>
          )}
        </div>
      </div>
    </article>
  );
}
