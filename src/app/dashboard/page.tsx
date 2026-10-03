import type { Metadata } from "next";
import Link from "next/link";
import { Award, FolderKanban, Medal, Sparkles, ArrowRight, Clock, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { StatCard } from "@/components/skills/stat-card";
import { SkillProgress } from "@/components/skills/skill-progress";
import { requireUser } from "@/lib/auth/current-user";
import {
  DEMO_ASSESSMENTS,
  DEMO_JOBS,
  DEMO_PROFILE_COMPLETION,
  DEMO_PROJECTS,
  DEMO_STATS,
  DEMO_TOP_SKILLS,
} from "@/config/demo-data";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const user = await requireUser();
  const firstName = user.name.split(" ")[0];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Bonjour {firstName} 👋</h1>
        <p className="text-muted mt-1">Voici l&apos;état de votre passeport de compétences.</p>
      </div>

      <section aria-label="Indicateurs" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Compétences" value={DEMO_STATS.skills} icon={Sparkles} />
        <StatCard label="Badges" value={DEMO_STATS.badges} icon={Medal} />
        <StatCard label="Projets" value={DEMO_STATS.projects} icon={FolderKanban} />
        <StatCard label="Certifications" value={DEMO_STATS.certifications} icon={Award} />
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
            {DEMO_TOP_SKILLS.map((skill) => (
              <SkillProgress key={skill.name} {...skill} />
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Complétion du profil</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-navy text-4xl font-bold">{DEMO_PROFILE_COMPLETION}%</p>
            <Progress
              value={DEMO_PROFILE_COMPLETION}
              className="mt-3"
              indicatorClassName="bg-success"
              aria-label="Complétion du profil"
            />
            <p className="text-muted mt-3 text-sm">
              Ajoutez une preuve à vos compétences pour atteindre 100 %.
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Projets récents</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            {DEMO_PROJECTS.map((project) => (
              <div key={project.name} className="border-border rounded-xl border p-4">
                <p className="font-semibold">{project.name}</p>
                <p className="text-muted text-sm">{project.role}</p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {project.tech.map((t) => (
                    <Badge key={t} tone="brand">
                      {t}
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
            <CardContent className="space-y-4">
              {DEMO_ASSESSMENTS.map((a) => (
                <div key={a.title} className="flex items-start gap-3">
                  <Clock className="text-accent mt-0.5 size-4" aria-hidden />
                  <div>
                    <p className="text-sm font-medium">{a.title}</p>
                    <p className="text-muted text-xs">{a.meta}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Opportunités</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {DEMO_JOBS.map((job) => (
                <div key={job.title} className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{job.title}</p>
                    <p className="text-muted flex items-center gap-1 text-xs">
                      <MapPin className="size-3" aria-hidden /> {job.company}
                    </p>
                  </div>
                  <Badge tone="success">{job.match}% match</Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
