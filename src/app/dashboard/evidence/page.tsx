import type { Metadata } from "next";
import { FileCheck2 } from "lucide-react";
import { AddEvidenceButton } from "@/components/evidence/add-evidence-button";
import { EvidenceList } from "@/components/evidence/evidence-list";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { requireUser } from "@/lib/auth/current-user";
import { getEvidenceService, getProjectService, getSkillService } from "@/services/container";
import Link from "next/link";

export const metadata: Metadata = { title: "Preuves" };

export default async function EvidencePage({ searchParams }: PageProps<"/dashboard/evidence">) {
  const user = await requireUser();
  const rawSkill = (await searchParams).skill;
  const skillFilter = typeof rawSkill === "string" ? rawSkill : undefined;

  const [evidence, skills, projects] = await Promise.all([
    getEvidenceService().list(user.id, skillFilter),
    getSkillService().list(user.id, { sort: "name" }),
    getProjectService().list(user.id),
  ]);
  const options = {
    skills: skills.items.map((s) => ({ id: s.id, name: s.name })),
    projects: projects.map((p) => ({ id: p.id, name: p.name })),
  };
  const add = <AddEvidenceButton {...options} skillId={skillFilter} />;

  return (
    <>
      <PageHeader
        title="Preuves"
        description="Une compétence ne se déclare pas seulement : elle se démontre."
        actions={add}
      />

      <nav aria-label="Filtrer par compétence" className="mb-6 flex flex-wrap gap-2">
        {[{ id: undefined, name: "Toutes" }, ...options.skills].map((s) => {
          const active = s.id === skillFilter;
          return (
            <Link
              key={s.id ?? "all"}
              href={s.id ? `/dashboard/evidence?skill=${s.id}` : "/dashboard/evidence"}
              aria-current={active ? "page" : undefined}
              className={`rounded-full border px-3 py-1 text-sm ${active ? "border-brand text-brand bg-blue-50" : "border-border text-muted hover:text-foreground"}`}
            >
              {s.name}
            </Link>
          );
        })}
      </nav>

      {evidence.length === 0 ? (
        <EmptyState
          icon={FileCheck2}
          title="Aucune preuve pour l'instant"
          description="Ajoutez un projet, un certificat, un lien ou un document pour étayer vos compétences."
          action={add}
        />
      ) : (
        <EvidenceList items={evidence} />
      )}
    </>
  );
}
