import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Award, BadgeCheck, BookOpenCheck, FolderKanban, Sparkles, Target } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { SkillPassScore } from "@/components/skills/skillpass-score";
import { SkillProgress } from "@/components/skills/skill-progress";
import { StatCard } from "@/components/skills/stat-card";
import { requireUser } from "@/lib/auth/current-user";
import { computeCompletion } from "@/lib/completion";
import { getEvidenceService, getPassportService, getProfileAccountService } from "@/services/container";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const user = await requireUser();
  const profile = await getProfileAccountService().get(user);
  const [passport, evidence] = await Promise.all([
    getPassportService().build(user.id, profile),
    getEvidenceService().list(user.id),
  ]);
  const { stats } = passport;
  const completion = computeCompletion({
    profile,
    counts: {
      skills: stats.skills,
      verifiedSkills: stats.verifiedSkills,
      projects: stats.projects,
      experiences: passport.experiences.length,
      certifications: stats.certifications,
      evidence: evidence.length,
    },
  });
  const firstName = profile.fullName.split(" ")[0];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Bonjour {firstName} 👋</h1>
        <p className="text-muted mt-1">Voici l&apos;état de votre passeport de compétences.</p>
      </div>

      <section aria-label="Indicateurs" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Compétences" value={stats.skills} icon={Sparkles} />
        <StatCard label="Compétences vérifiées" value={stats.verifiedSkills} icon={BadgeCheck} />
        <StatCard label="Projets" value={stats.projects} icon={FolderKanban} />
        <StatCard label="Certifications" value={stats.certifications} icon={Award} />
      </section>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Top compétences</CardTitle>
            <Button asChild variant="link" size="sm">
              <Link href="/dashboard/skills">
                Tout voir <ArrowRight />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-5">
            {passport.skills.length === 0 && (
              <p className="text-muted text-sm">
                Ajoutez votre première compétence pour la voir apparaître ici.
              </p>
            )}
            {passport.skills.slice(0, 5).map((skill) => (
              <SkillProgress key={skill.id} name={skill.name} score={skill.score} />
            ))}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>SkillPass Score</CardTitle>
              <Button asChild variant="link" size="sm">
                <Link href="/dashboard/skillpass">Détail</Link>
              </Button>
            </CardHeader>
            <CardContent className="flex justify-center">
              <SkillPassScore score={passport.score.total} verified={passport.isVerified} size={120} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Complétion du profil</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-navy text-4xl font-bold">{completion.percent}%</p>
              <Progress
                value={completion.percent}
                className="mt-3"
                indicatorClassName="bg-success"
                aria-label="Complétion du profil"
              />
              {completion.next ? (
                <Button asChild variant="link" size="sm" className="mt-3 h-auto p-0">
                  <Link href={completion.next.href}>
                    {completion.next.label} <ArrowRight />
                  </Link>
                </Button>
              ) : (
                <p className="text-success mt-3 text-sm">Votre profil est complet 🎉</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Projets récents</CardTitle>
            <Button asChild variant="link" size="sm">
              <Link href="/dashboard/projects">
                Tout voir <ArrowRight />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            {passport.projects.length === 0 && (
              <p className="text-muted text-sm sm:col-span-2">Aucun projet pour l&apos;instant.</p>
            )}
            {passport.projects.slice(0, 4).map((project) => (
              <div key={project.id} className="border-border rounded-xl border p-4">
                <p className="font-semibold">{project.name}</p>
                <p className="text-muted text-sm">{project.role ?? project.organization}</p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {project.skills.map((s) => (
                    <Badge key={s} tone="brand">
                      {s}
                    </Badge>
                  ))}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Évaluations à venir</CardTitle>
            </CardHeader>
            <CardContent className="text-muted flex items-start gap-3 text-sm">
              <BookOpenCheck className="text-accent mt-0.5 size-4 shrink-0" aria-hidden />
              Les évaluations de compétences arrivent prochainement.
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Opportunités</CardTitle>
            </CardHeader>
            <CardContent className="text-muted flex items-start gap-3 text-sm">
              <Target className="text-accent mt-0.5 size-4 shrink-0" aria-hidden />
              Le matching avec les offres des entreprises arrive avec SkillPass Business.
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
