import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { AttemptReview } from "@/components/business/attempt-review";
import { NoAccess, Panel } from "@/components/business/ui";
import { requireBusiness } from "@/lib/business/context";
import { scoreAttempt } from "@/lib/business/evaluation-view";
import { NotFoundError } from "@/lib/errors";
import { cn } from "@/lib/utils/cn";
import { getEvaluationAttemptService } from "@/services/container";

export const metadata: Metadata = { title: "Résultat d'évaluation" };
export const dynamic = "force-dynamic";

const WHEN = new Intl.DateTimeFormat("fr-FR", { dateStyle: "long", timeStyle: "short", timeZone: "UTC" });

export default async function AttemptResultPage({
  params,
}: PageProps<"/business/evaluations/resultats/[attemptId]">) {
  const ctx = await requireBusiness();
  if (!ctx.can("evaluations.results")) return <NoAccess what="de consulter les résultats des évaluations" />;
  const { attemptId } = await params;
  let found;
  try {
    found = await getEvaluationAttemptService().getForReview(ctx, attemptId);
  } catch (err) {
    if (err instanceof NotFoundError) notFound();
    throw err;
  }
  const { attempt, evaluation, candidate } = found;
  const finished = attempt.status !== "IN_PROGRESS";
  const provisional = scoreAttempt(
    evaluation.questions,
    attempt.responses,
    attempt.review,
    evaluation.settings,
  );

  return (
    <div className="space-y-6">
      <nav aria-label="Fil d'Ariane" className="text-muted flex items-center gap-2 text-sm">
        <Link href="/business/evaluations?tab=results" className="hover:text-brand">
          Résultats
        </Link>
        <ChevronRight className="size-3.5" aria-hidden />
        <span className="text-navy font-medium">{candidate.name}</span>
      </nav>
      <Panel className="p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-navy text-2xl font-bold">{candidate.name}</h1>
            <p className="text-muted mt-1 text-sm">
              {evaluation.title}
              {attempt.submittedAt && ` · envoyé le ${WHEN.format(new Date(attempt.submittedAt))}`}
            </p>
            {candidate.username && (
              <Link
                href={`/${candidate.username}`}
                target="_blank"
                rel="noopener"
                className="text-brand mt-1 inline-block text-sm font-semibold hover:underline"
              >
                Voir le profil public
              </Link>
            )}
          </div>
          <div className="text-right">
            {attempt.status === "GRADED" && attempt.score !== null ? (
              <>
                <p className="text-navy text-3xl font-bold">{attempt.score} %</p>
                <p
                  className={cn("text-sm font-semibold", attempt.passed ? "text-green-700" : "text-red-600")}
                >
                  {attempt.passed ? "Réussi" : "Non réussi"} · seuil {evaluation.settings.passScore} %
                </p>
              </>
            ) : (
              <p className="rounded-md bg-amber-50 px-2.5 py-1 text-sm font-semibold text-amber-700">
                {finished
                  ? `À corriger (${provisional.pending} question${provisional.pending > 1 ? "s" : ""} ouverte${provisional.pending > 1 ? "s" : ""})`
                  : "En cours"}
              </p>
            )}
          </div>
        </div>
      </Panel>
      {finished ? (
        <Panel className="p-6">
          <AttemptReview
            attemptId={attempt.id}
            questions={evaluation.questions}
            responses={attempt.responses}
            review={attempt.review}
            graded={attempt.status === "GRADED"}
            canReview
          />
        </Panel>
      ) : (
        <Panel className="text-muted p-6 text-sm">
          Le candidat n&apos;a pas encore terminé cette évaluation.
        </Panel>
      )}
    </div>
  );
}
