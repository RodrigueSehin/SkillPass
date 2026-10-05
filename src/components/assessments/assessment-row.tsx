import Link from "next/link";
import { Clock, FileQuestion, ShieldCheck } from "lucide-react";
import { StartAssessmentButton } from "@/components/verification/start-assessment-button";
import { skillVisual } from "@/config/skill-visuals";
import { cn } from "@/lib/utils/cn";
import { formatDay } from "@/lib/utils/format";
import type { AssessmentOverview } from "@/services/assessment.service";
import { SKILL_LEVEL_LABELS } from "@/types/skill";
import type { AttemptStatus } from "@/types/verification";

const STATUS: Record<AttemptStatus, { label: string; tone: string }> = {
  IN_PROGRESS: { label: "En cours", tone: "bg-blue-50 text-brand" },
  PASSED: { label: "Réussi", tone: "bg-green-50 text-success" },
  FAILED: { label: "Échoué", tone: "bg-red-50 text-danger" },
  PENDING_REVIEW: { label: "En validation", tone: "bg-amber-50 text-amber-700" },
  REJECTED: { label: "Refusé", tone: "bg-red-50 text-danger" },
};

export function AssessmentRow({ item }: { item: AssessmentOverview }) {
  const { icon: Icon, tile } = skillVisual(item.skillName);
  const last = item.lastAttempt;
  const status = item.activeAttemptId ? STATUS.IN_PROGRESS : last ? STATUS[last.status] : null;

  return (
    <article className="border-border/60 shadow-soft flex flex-wrap items-center gap-x-4 gap-y-3 rounded-2xl border bg-white p-4">
      <span className={cn("flex size-14 shrink-0 items-center justify-center rounded-full", tile)}>
        <Icon className="size-7" aria-hidden />
      </span>

      <div className="min-w-0 flex-1 basis-56">
        <h2 className="text-navy text-base font-bold">{item.title}</h2>
        <p className="mt-1.5 flex flex-wrap items-center gap-1.5 text-xs">
          <span className="text-brand rounded-md bg-blue-50 px-2 py-0.5 font-medium">{item.skillName}</span>
          {item.requiresReview && (
            <span className="inline-flex items-center gap-1 rounded-md bg-violet-50 px-2 py-0.5 font-medium text-violet-700">
              <ShieldCheck className="size-3" aria-hidden /> Validation requise
            </span>
          )}
        </p>
        <p className="text-muted mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
          <span className="inline-flex items-center gap-1">
            <Clock className="size-3.5" aria-hidden /> {item.durationMinutes} min
          </span>
          <span className="inline-flex items-center gap-1">
            <FileQuestion className="size-3.5" aria-hidden /> {item.questionCount} questions
          </span>
          {last?.level && <span>Niveau obtenu : {SKILL_LEVEL_LABELS[last.level]}</span>}
        </p>
      </div>

      <div className="min-w-24 text-right text-sm">
        {status ? (
          <>
            <span
              className={cn("inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold", status.tone)}
            >
              {status.label}
            </span>
            {last?.overallScore != null && !item.activeAttemptId && (
              <p className="text-navy mt-1 text-lg font-bold">{last.overallScore}%</p>
            )}
            {last?.submittedAt && !item.activeAttemptId && (
              <p className="text-muted text-xs">{formatDay(last.submittedAt)}</p>
            )}
          </>
        ) : (
          <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600">
            Non passé
          </span>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-end gap-2">
        {last && !item.activeAttemptId && (
          <Link
            href={`/dashboard/assessments/result/${last.id}`}
            className="text-brand border-brand/40 inline-flex h-9 items-center rounded-xl border px-3 text-sm font-semibold hover:bg-blue-50"
          >
            Voir le résultat
          </Link>
        )}
        {item.blockedReason ? (
          <p className="text-muted max-w-56 text-xs">{item.blockedReason}</p>
        ) : (
          <StartAssessmentButton
            slug={item.slug}
            resume={Boolean(item.activeAttemptId)}
            label={!item.activeAttemptId && last ? "Réessayer" : undefined}
            variant={last && !item.activeAttemptId ? "outline" : "primary"}
          />
        )}
      </div>
    </article>
  );
}
