import type { Metadata } from "next";
import { Award, FolderKanban, Medal, ShieldCheck, Sparkles } from "lucide-react";
import { CompletionCard } from "@/components/dashboard/completion-card";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { OpportunitiesTeaser } from "@/components/dashboard/opportunities-teaser";
import { PassportBanner } from "@/components/dashboard/passport-banner";
import { QuickActions } from "@/components/dashboard/quick-actions";
import { RecentProjects } from "@/components/dashboard/recent-projects";
import { TopSkills } from "@/components/dashboard/top-skills";
import { UpcomingAssessments } from "@/components/dashboard/upcoming-assessments";
import { requireUser } from "@/lib/auth/current-user";
import { profileFor } from "@/lib/auth/profile";
import { computeCompletion } from "@/lib/completion";
import { appUrl } from "@/lib/utils/app-url";
import { getAssessmentService, getEvidenceService, getPassportService } from "@/services/container";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const user = await requireUser();
  const profile = await profileFor(user);
  const [passport, evidence, assessments] = await Promise.all([
    getPassportService().build(user.id, profile),
    getEvidenceService().list(user.id),
    getAssessmentService().list(user.id),
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

  // Assessments that can be taken now, a running one first.
  const available = assessments
    .filter((a) => !a.blockedReason || a.activeAttemptId)
    .sort((a, b) => Number(Boolean(b.activeAttemptId)) - Number(Boolean(a.activeAttemptId)))
    .slice(0, 3);

  const firstName = profile.fullName.split(" ")[0];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_26rem]">
        <div>
          <h1 className="text-navy text-3xl font-extrabold tracking-tight sm:text-4xl">
            Bonjour {firstName} 👋
          </h1>
          <p className="mt-1.5 text-slate-600">Voici un aperçu de votre activité sur SkillPass.</p>

          <section aria-label="Indicateurs" className="mt-6 grid grid-cols-2 gap-4 2xl:grid-cols-4">
            <KpiCard
              href="/dashboard/skills"
              label="Compétences"
              value={stats.skills}
              icon={Sparkles}
              tile="bg-emerald-100 text-emerald-600"
            />
            <KpiCard
              href="/dashboard/badges"
              label="Badges"
              value={passport.credentials.length}
              icon={Medal}
              tile="bg-violet-100 text-violet-600"
            />
            <KpiCard
              href="/dashboard/projects"
              label="Projets"
              value={stats.projects}
              icon={FolderKanban}
              tile="bg-blue-100 text-brand"
            />
            <KpiCard
              href="/dashboard/certifications"
              label="Certifications"
              value={stats.certifications}
              icon={Award}
              tile="bg-pink-100 text-pink-600"
            />
          </section>
        </div>
        <CompletionCard completion={completion} />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.15fr_1fr]">
        <TopSkills skills={passport.skills.slice(0, 5)} />
        <div className="space-y-6">
          <PassportBanner
            name={profile.fullName}
            headline={profile.headline ?? profile.profession}
            score={passport.score.total}
            verified={passport.isVerified}
            publicUrl={`${appUrl()}/${profile.username}`}
            counts={{ skills: stats.skills, projects: stats.projects, certifications: stats.certifications }}
          />
          <QuickActions />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 2xl:grid-cols-3">
        <RecentProjects projects={passport.projects.slice(0, 4)} />
        <UpcomingAssessments assessments={available} />
        <div className="lg:col-span-2 2xl:col-span-1">
          <OpportunitiesTeaser />
        </div>
      </div>

      <p className="flex items-center gap-2 px-1 text-xs text-slate-600">
        <ShieldCheck className="text-brand size-4 shrink-0" aria-hidden />
        {profile.isPublic ? (
          <span>
            <strong className="text-navy font-semibold">Votre profil</strong> est visible publiquement via un
            lien sécurisé et un QR code.
          </span>
        ) : (
          <span>
            <strong className="text-navy font-semibold">Votre profil</strong> est privé : seul vous pouvez le
            voir. Vous pouvez le rendre public dans les paramètres.
          </span>
        )}
      </p>
    </div>
  );
}
