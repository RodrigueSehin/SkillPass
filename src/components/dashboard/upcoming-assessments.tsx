import Link from "next/link";
import { BookOpenCheck, Clock } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { skillVisual } from "@/config/skill-visuals";
import { cn } from "@/lib/utils/cn";
import type { AssessmentOverview } from "@/services/assessment.service";

/** Assessments the user can take now (or resume), most useful first. */
export function UpcomingAssessments({ assessments }: { assessments: AssessmentOverview[] }) {
  return (
    <section
      aria-labelledby="assessments-title"
      className="border-border/60 shadow-soft rounded-2xl border bg-white p-6"
    >
      <div className="flex items-center justify-between gap-4">
        <h2 id="assessments-title" className="text-navy text-lg font-bold">
          Prochaines évaluations
        </h2>
        <Link href="/dashboard/assessments" className="text-brand text-sm font-semibold hover:underline">
          Voir tout
        </Link>
      </div>

      {assessments.length === 0 ? (
        <EmptyState
          className="mt-4 border-0 py-8"
          icon={BookOpenCheck}
          title="Rien à passer pour l'instant"
          description="Ajoutez une compétence évaluable (Power Apps, Power Automate, Dataverse) pour la faire vérifier."
        />
      ) : (
        <ul className="divide-border/60 mt-3 divide-y">
          {assessments.map((a) => {
            const { icon: Icon, tile } = skillVisual(a.skillName);
            return (
              <li key={a.slug} className="flex items-center gap-4 py-3.5">
                <span className={cn("flex size-11 shrink-0 items-center justify-center rounded-xl", tile)}>
                  <Icon className="size-6" aria-hidden />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="text-navy block truncate text-sm font-semibold">{a.title}</span>
                  <span className="text-muted mt-1 flex items-center gap-3 text-xs">
                    <span className="text-brand rounded-md bg-blue-50 px-2 py-0.5 font-medium">
                      {a.skillName}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="size-3.5" aria-hidden /> {a.durationMinutes} min
                    </span>
                  </span>
                </span>
                <Link
                  href="/dashboard/assessments"
                  aria-label={`${a.activeAttemptId ? "Reprendre" : "Commencer"} ${a.title}`}
                  className="bg-brand shadow-soft shrink-0 rounded-lg px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-blue-700"
                >
                  {a.activeAttemptId ? "Reprendre" : "Commencer"}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
