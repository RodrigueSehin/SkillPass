import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ChevronRight, FolderPlus } from "lucide-react";
import { NewProjectForm } from "@/components/projects/new-project-form";
import { requireUser } from "@/lib/auth/current-user";
import { DOMAIN_IDEAS } from "@/lib/experience-options";
import { getProjectService, getSkillService } from "@/services/container";

export const metadata: Metadata = { title: "Ajouter un projet" };

const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

export default async function NewProjectPage({ searchParams }: PageProps<"/dashboard/projects/new">) {
  const user = await requireUser();
  const name = first((await searchParams).name)?.slice(0, 120);
  const [projects, skills] = await Promise.all([
    getProjectService().list(user.id),
    getSkillService().list(user.id),
  ]);
  const categories = [
    ...new Set([
      ...projects.map((p) => p.domain).filter((d): d is string => Boolean(d)),
      ...DOMAIN_IDEAS,
      "Cloud & Infra",
      "Mobile",
    ]),
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link
            href="/dashboard/projects"
            className="text-muted hover:text-brand inline-flex items-center gap-2 text-sm"
          >
            <ArrowLeft className="size-4" aria-hidden /> Retour aux projets
          </Link>
          <h1 className="text-navy mt-3 flex items-center gap-3 text-2xl font-bold tracking-tight sm:text-3xl">
            <FolderPlus className="text-brand size-9" aria-hidden /> Ajouter un projet
          </h1>
          <p className="text-muted mt-1">
            Présentez un projet qui démontre vos compétences et votre savoir-faire.
          </p>
        </div>
        <nav aria-label="Fil d'Ariane" className="text-muted flex items-center gap-1.5 text-xs">
          <Link href="/dashboard/projects" className="hover:text-brand">
            Projets
          </Link>
          <ChevronRight className="size-3" aria-hidden />
          <span aria-current="page">Ajouter un projet</span>
        </nav>
      </div>

      <NewProjectForm
        key={name ?? ""}
        categories={categories}
        skillNames={skills.items.map((s) => s.name)}
        defaults={{ name }}
      />
    </div>
  );
}
