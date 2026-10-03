import type { Metadata } from "next";
import Link from "next/link";
import { BookOpenCheck, Clock, ShieldCheck } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { StartAssessmentButton } from "@/components/verification/start-assessment-button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { requireUser } from "@/lib/auth/current-user";
import { getAssessmentService } from "@/services/container";
import { SKILL_LEVEL_LABELS } from "@/types/skill";
import { ATTEMPT_STATUS_LABELS, type AttemptStatus } from "@/types/verification";

export const metadata: Metadata = { title: "Évaluations" };

const TONES: Record<AttemptStatus, "neutral" | "success" | "danger" | "accent" | "brand"> = {
  IN_PROGRESS: "brand",
  PASSED: "success",
  FAILED: "danger",
  PENDING_REVIEW: "accent",
  REJECTED: "danger",
};

export default async function AssessmentsPage() {
  const user = await requireUser();
  const items = await getAssessmentService().list(user.id);

  return (
    <>
      <PageHeader
        title="Évaluations"
        description="Prouvez votre niveau : une évaluation réussie vérifie la compétence et délivre un badge."
      />
      <ul className="grid gap-4 lg:grid-cols-2">
        {items.map((a) => (
          <li key={a.slug}>
            <Card className="flex h-full flex-col p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="font-semibold">{a.title}</h2>
                  <p className="text-muted mt-1 text-sm">{a.description}</p>
                </div>
                <BookOpenCheck className="text-brand size-6 shrink-0" aria-hidden />
              </div>

              <p className="text-muted mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                <span>{a.questionCount} questions</span>
                <span className="inline-flex items-center gap-1">
                  <Clock className="size-3.5" aria-hidden /> {a.durationMinutes} minutes
                </span>
                {a.requiresReview && (
                  <span className="inline-flex items-center gap-1 text-amber-700">
                    <ShieldCheck className="size-3.5" aria-hidden /> Validation par un vérificateur
                  </span>
                )}
              </p>

              {a.lastAttempt && (
                <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
                  <Badge tone={TONES[a.lastAttempt.status]}>
                    {ATTEMPT_STATUS_LABELS[a.lastAttempt.status]}
                  </Badge>
                  {a.lastAttempt.overallScore !== null && (
                    <span className="text-muted">
                      {a.lastAttempt.overallScore}%
                      {a.lastAttempt.level && ` · ${SKILL_LEVEL_LABELS[a.lastAttempt.level]}`}
                    </span>
                  )}
                  <Link
                    href={`/dashboard/assessments/result/${a.lastAttempt.id}`}
                    className="text-brand font-medium hover:underline"
                  >
                    Voir le résultat
                  </Link>
                </div>
              )}

              <div className="mt-auto pt-5">
                {a.blockedReason ? (
                  <p className="text-muted text-sm">{a.blockedReason}</p>
                ) : (
                  <StartAssessmentButton slug={a.slug} resume={Boolean(a.activeAttemptId)} />
                )}
              </div>
            </Card>
          </li>
        ))}
      </ul>
    </>
  );
}
