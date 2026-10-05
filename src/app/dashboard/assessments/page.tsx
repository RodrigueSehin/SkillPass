import type { Metadata } from "next";
import Link from "next/link";
import { BookOpenCheck, ChevronRight } from "lucide-react";
import { AssessmentRow } from "@/components/assessments/assessment-row";
import { AssessmentsHero } from "@/components/assessments/assessments-hero";
import { AssessmentKpis, RecentBadges, ScoreSummary } from "@/components/assessments/assessments-summary";
import { AssessmentFilters, AssessmentTabs } from "@/components/verification/assessments-controls";
import { EmptyState } from "@/components/ui/empty-state";
import { filterAssessments } from "@/lib/assessment-filter";
import { requireUser } from "@/lib/auth/current-user";
import { getCredentialRepository } from "@/repositories";
import { getAssessmentService } from "@/services/container";

export const metadata: Metadata = { title: "Évaluations" };

const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

export default async function AssessmentsPage({ searchParams }: PageProps<"/dashboard/assessments">) {
  const user = await requireUser();
  const raw = await searchParams;
  const service = getAssessmentService();
  const [items, summary, credentials] = await Promise.all([
    service.list(user.id),
    service.summary(user.id),
    getCredentialRepository().listByProfile(user.id),
  ]);
  const shown = filterAssessments(items, { tab: first(raw.tab), q: first(raw.q), result: first(raw.result) });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-navy flex items-center gap-3 text-2xl font-bold tracking-tight sm:text-3xl">
            <BookOpenCheck className="text-brand size-8" aria-hidden /> Évaluations
          </h1>
          <p className="text-muted mt-1">
            Testez vos compétences, suivez vos résultats et obtenez des badges vérifiables.
          </p>
        </div>
        <nav aria-label="Fil d'Ariane" className="text-muted flex items-center gap-1.5 text-xs">
          <Link href="/dashboard" className="hover:text-brand">
            Accueil
          </Link>
          <ChevronRight className="size-3" aria-hidden /> <span aria-current="page">Évaluations</span>
        </nav>
      </div>

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_300px]">
        <div className="min-w-0 space-y-6">
          <AssessmentsHero items={items} />
          <AssessmentKpis summary={summary} />
          <AssessmentTabs />

          <div
            id="liste-evaluations"
            className="grid scroll-mt-24 items-start gap-6 lg:grid-cols-[220px_minmax(0,1fr)]"
          >
            <AssessmentFilters />
            <section aria-label="Liste des évaluations" className="min-w-0">
              <h2 className="text-navy mb-4 text-lg font-bold">
                {shown.length} évaluation{shown.length > 1 ? "s" : ""}
              </h2>
              {shown.length === 0 ? (
                <EmptyState
                  icon={BookOpenCheck}
                  title="Aucune évaluation"
                  description="Modifiez vos filtres pour élargir la recherche."
                />
              ) : (
                <ul className="space-y-4">
                  {shown.map((item) => (
                    <li key={item.slug}>
                      <AssessmentRow item={item} />
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        </div>

        <aside className="grid min-w-0 gap-6 md:grid-cols-2 xl:grid-cols-1">
          <ScoreSummary summary={summary} />
          <RecentBadges credentials={credentials} />
        </aside>
      </div>
    </div>
  );
}
