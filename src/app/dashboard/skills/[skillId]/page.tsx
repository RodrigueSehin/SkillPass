import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Check, Clock, FileCheck2, Minus } from "lucide-react";
import { AddEvidenceButton } from "@/components/evidence/add-evidence-button";
import { EvidenceList } from "@/components/evidence/evidence-list";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { SkillPassScore } from "@/components/skills/skillpass-score";
import { VerificationBadge } from "@/components/skills/verification-badge";
import { requireUser } from "@/lib/auth/current-user";
import { NotFoundError } from "@/lib/errors";
import { explainVerification } from "@/lib/verification-explainer";
import { getEvidenceService, getProjectService, getSkillService } from "@/services/container";
import { SKILL_LEVEL_LABELS } from "@/types/skill";

export const metadata: Metadata = { title: "Détail de la compétence" };

export default async function SkillDetailPage({ params }: PageProps<"/dashboard/skills/[skillId]">) {
  const user = await requireUser();
  const { skillId } = await params;

  let skill;
  try {
    skill = await getSkillService().get(user.id, skillId);
  } catch (err) {
    if (err instanceof NotFoundError) notFound();
    throw err;
  }

  const [evidence, allProjects, allSkills] = await Promise.all([
    getEvidenceService().list(user.id, skill.id),
    getProjectService().list(user.id),
    getSkillService().list(user.id, { sort: "name" }),
  ]);
  const projects = allProjects.filter((p) => p.skills.includes(skill.name));
  const explanation = explainVerification({
    status: skill.verificationStatus,
    yearsOfExperience: skill.yearsOfExperience,
    evidence,
    projectCount: projects.length,
  });

  return (
    <div className="space-y-6">
      <Link
        href="/dashboard/skills"
        className="text-muted hover:text-foreground inline-flex items-center gap-1 text-sm"
      >
        <ArrowLeft className="size-4" aria-hidden /> Toutes les compétences
      </Link>

      <Card>
        <CardContent className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{skill.name}</h1>
            <p className="text-muted mt-1">{skill.category ?? "Sans catégorie"}</p>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <Badge tone="navy">{SKILL_LEVEL_LABELS[skill.level]}</Badge>
              <VerificationBadge status={skill.verificationStatus} />
              <span className="text-muted text-sm">
                {skill.yearsOfExperience} an{skill.yearsOfExperience > 1 ? "s" : ""} d&apos;expérience
              </span>
            </div>
          </div>
          <SkillPassScore score={skill.score} max={100} size={120} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{explanation.title}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted mb-4 text-sm">{explanation.summary}</p>
          <ul className="space-y-3">
            {explanation.checks.map((c) => (
              <li key={c.key} className="flex items-start gap-3">
                <span
                  className={`mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full ${
                    c.met
                      ? "text-success bg-green-50"
                      : c.upcoming
                        ? "bg-amber-50 text-amber-700"
                        : "text-muted bg-slate-100"
                  }`}
                >
                  {c.met ? (
                    <Check className="size-4" aria-label="Rempli" />
                  ) : c.upcoming ? (
                    <Clock className="size-4" aria-label="À venir" />
                  ) : (
                    <Minus className="size-4" aria-label="Non rempli" />
                  )}
                </span>
                <div>
                  <p className="text-sm font-medium">{c.label}</p>
                  <p className="text-muted text-xs">{c.detail}</p>
                </div>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <section aria-labelledby="evidence-title">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 id="evidence-title" className="text-lg font-semibold">
            Preuves ({evidence.length})
          </h2>
          <AddEvidenceButton
            skillId={skill.id}
            skills={allSkills.items.map((s) => ({ id: s.id, name: s.name }))}
            projects={allProjects.map((p) => ({ id: p.id, name: p.name }))}
          />
        </div>
        {evidence.length === 0 ? (
          <EmptyState
            icon={FileCheck2}
            title="Aucune preuve rattachée"
            description="Ajoutez un projet, un certificat ou un lien qui démontre cette compétence."
          />
        ) : (
          <EvidenceList items={evidence} showSkill={false} />
        )}
      </section>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Projets</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {projects.length === 0 && <p className="text-muted">Aucun projet ne cite cette compétence.</p>}
            {projects.map((p) => (
              <p key={p.id} className="font-medium">
                {p.name}
              </p>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Évaluations</CardTitle>
          </CardHeader>
          <CardContent className="text-muted text-sm">Bientôt disponible.</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Recommandations</CardTitle>
          </CardHeader>
          <CardContent className="text-muted text-sm">
            {skill.recommendationCount === 0
              ? "Aucune recommandation pour l'instant."
              : `${skill.recommendationCount} reçue(s)`}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
