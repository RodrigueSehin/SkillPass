import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { ResourceManager, type ItemView } from "@/components/resources/resource-manager";
import { requireUser } from "@/lib/auth/current-user";
import { formatPeriod } from "@/lib/utils/format";
import { getProjectService, getSkillService } from "@/services/container";

export const metadata: Metadata = { title: "Projets" };

export default async function ProjectsPage() {
  const user = await requireUser();
  const [projects, skills] = await Promise.all([
    getProjectService().list(user.id),
    getSkillService().list(user.id),
  ]);

  const items: ItemView[] = projects.map((p) => ({
    id: p.id,
    title: p.name,
    subtitle: [p.organization, p.role].filter(Boolean).join(" · ") || undefined,
    lines: [formatPeriod(p.startDate, p.endDate), p.description ?? ""].filter(Boolean),
    badges: p.skills.map((label) => ({ label })),
    links: [
      ...(p.url ? [{ label: "Voir le projet", href: p.url }] : []),
      ...(p.repositoryUrl ? [{ label: "Dépôt", href: p.repositoryUrl }] : []),
    ],
    values: {
      name: p.name,
      organization: p.organization ?? "",
      role: p.role ?? "",
      description: p.description ?? "",
      startDate: p.startDate ?? "",
      endDate: p.endDate ?? "",
      repositoryUrl: p.repositoryUrl ?? "",
      url: p.url ?? "",
      skills: p.skills,
    },
  }));

  return (
    <>
      <PageHeader
        title="Projets"
        description="Vos réalisations, reliées aux compétences qu'elles démontrent."
      />
      <ResourceManager
        resource="project"
        items={items}
        skillOptions={skills.items.map((s) => s.name).sort()}
      />
    </>
  );
}
