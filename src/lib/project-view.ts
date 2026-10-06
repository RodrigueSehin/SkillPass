import type { ProjectDTO } from "@/types/portfolio";

export type ProjectStatus = "COMPLETED" | "IN_PROGRESS" | "PAUSED" | "PLANNED";

export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  COMPLETED: "Réalisé",
  IN_PROGRESS: "En cours",
  PAUSED: "En pause",
  PLANNED: "En planification",
};

export const PROJECT_SORTS = [
  ["recent", "Plus récents"],
  ["oldest", "Plus anciens"],
  ["name", "Nom (A–Z)"],
] as const;
export type ProjectSort = (typeof PROJECT_SORTS)[number][0];

export const parseProjectSort = (v: string | undefined): ProjectSort =>
  PROJECT_SORTS.find(([key]) => key === v)?.[0] ?? "recent";

export const PROJECTS_PER_PAGE = 6;
export const TECH_FILTERS_SHOWN = 5;

const isStatus = (v: string | null | undefined): v is ProjectStatus =>
  Boolean(v && v in PROJECT_STATUS_LABELS);

/** The owner's explicit status, otherwise derived from the dates so the project moves on by itself. */
export function projectStatus(
  p: Pick<ProjectDTO, "startDate" | "endDate"> & { status?: string | null },
  today: string,
): ProjectStatus {
  if (isStatus(p.status)) return p.status;
  if (p.startDate && p.startDate > today) return "PLANNED";
  if (!p.endDate && p.startDate) return "IN_PROGRESS";
  if (p.endDate && p.endDate > today) return "IN_PROGRESS";
  return "COMPLETED";
}

export interface ProjectFilters {
  q?: string;
  status?: string[];
  domain?: string[];
  tech?: string[];
  sort?: string;
}

const anyMatch = (selected: string[] | undefined, values: (string | null)[]) =>
  !selected?.length || values.some((v) => v !== null && selected.includes(v));

export function filterProjects(all: ProjectDTO[], f: ProjectFilters, today: string): ProjectDTO[] {
  const q = f.q?.trim().toLowerCase();
  const rows = all.filter(
    (p) =>
      (!q ||
        [p.name, p.description, p.organization, p.domain, ...p.skills].some((t) =>
          t?.toLowerCase().includes(q),
        )) &&
      anyMatch(f.status, [projectStatus(p, today)]) &&
      anyMatch(f.domain, [p.domain]) &&
      anyMatch(f.tech, p.skills),
  );
  const sort = parseProjectSort(f.sort);
  const byStart = (p: ProjectDTO) => p.startDate ?? "";
  return rows.sort((a, b) =>
    sort === "name"
      ? a.name.localeCompare(b.name, "fr")
      : sort === "oldest"
        ? byStart(a).localeCompare(byStart(b))
        : byStart(b).localeCompare(byStart(a)),
  );
}

/** Counts per value over the whole list (not the filtered one), as the filter panel shows them. */
export function countBy(values: (string | null)[]) {
  const counts = new Map<string, number>();
  for (const v of values) if (v) counts.set(v, (counts.get(v) ?? 0) + 1);
  return [...counts]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, "fr"));
}

export function projectStats(all: ProjectDTO[], today: string) {
  const statuses = all.map((p) => projectStatus(p, today));
  const count = (s: ProjectStatus) => statuses.filter((x) => x === s).length;
  return {
    total: all.length,
    completed: count("COMPLETED"),
    inProgress: count("IN_PROGRESS"),
    paused: count("PAUSED"),
    planned: count("PLANNED"),
    featured: all.filter((p) => p.featured).length,
  };
}

/** Share of projects that use each technology (a project can use several, so the shares overlap). */
export function topTechnologies(all: ProjectDTO[], limit = 5) {
  if (all.length === 0) return [];
  return countBy(all.flatMap((p) => p.skills))
    .slice(0, limit)
    .map(({ name, count }) => ({ name, percent: Math.round((count / all.length) * 100) }));
}

/** The planned project that starts first. */
export function nextProject(all: ProjectDTO[], today: string) {
  return (
    all
      .filter((p) => projectStatus(p, today) === "PLANNED")
      .sort((a, b) => (a.startDate ?? "").localeCompare(b.startDate ?? ""))[0] ?? null
  );
}

export function paginate<T>(items: T[], requested: number, size = PROJECTS_PER_PAGE) {
  const pages = Math.max(1, Math.ceil(items.length / size));
  const page = Math.min(Math.max(1, Math.floor(requested) || 1), pages);
  return { page, pages, items: items.slice((page - 1) * size, page * size) };
}

const month = new Intl.DateTimeFormat("fr-FR", { month: "short", year: "numeric", timeZone: "UTC" });
/** "2025-04-12" → "Avr. 2025". */
export function monthLabel(day: string) {
  const text = month.format(new Date(`${day}T00:00:00Z`));
  return text.charAt(0).toUpperCase() + text.slice(1);
}
