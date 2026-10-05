import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  ArrowLeft,
  ChevronRight,
  ClipboardList,
  Clock,
  Code2,
  FileQuestion,
  Medal,
  ShieldCheck,
  Target,
} from "lucide-react";
import { AssessmentTaker } from "@/components/verification/assessment-taker";
import { requireUser } from "@/lib/auth/current-user";
import { ConflictError, NotFoundError } from "@/lib/errors";
import { getAssessmentService } from "@/services/container";

export const metadata: Metadata = { title: "Évaluation en cours" };
// The countdown depends on the current time: never cache this page.
export const dynamic = "force-dynamic";

const card = "border-border/60 shadow-soft rounded-2xl border bg-white p-5 sm:p-6";

export default async function TakeAssessmentPage({
  params,
}: PageProps<"/dashboard/assessments/take/[attemptId]">) {
  const user = await requireUser();
  const { attemptId } = await params;

  let assessment;
  try {
    assessment = await getAssessmentService().getTakeable(user.id, attemptId);
  } catch (err) {
    if (err instanceof NotFoundError) notFound();
    // Already submitted (or expired): show the result instead of the questions.
    if (err instanceof ConflictError) redirect(`/dashboard/assessments/result/${attemptId}`);
    throw err;
  }

  const secondsLeft = Math.max(0, Math.floor((Date.parse(assessment.deadlineAt) - Date.now()) / 1000));
  const meta = [
    [FileQuestion, `${assessment.questions.length} questions`],
    [Clock, `${assessment.durationMinutes} minutes`],
    [Target, `Seuil de réussite : ${assessment.passScore} %`],
    ...(assessment.requiresReview ? [[ShieldCheck, "Validation par un vérificateur"] as const] : []),
  ] as const;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/dashboard/assessments"
          className="text-muted hover:text-brand inline-flex items-center gap-2 text-sm"
        >
          <ArrowLeft className="size-4" aria-hidden /> Retour aux évaluations
        </Link>
        <nav aria-label="Fil d'Ariane" className="text-muted flex items-center gap-1.5 text-xs">
          <Link href="/dashboard/assessments" className="hover:text-brand">
            Évaluations
          </Link>
          <ChevronRight className="size-3" aria-hidden />
          <span aria-current="page">Passer une évaluation</span>
        </nav>
      </div>

      <AssessmentTaker
        assessment={assessment}
        secondsLeft={secondsLeft}
        header={
          <header className={card}>
            <div className="flex items-start gap-4">
              <span className="bg-brand flex size-14 shrink-0 items-center justify-center rounded-2xl text-white">
                <Code2 className="size-8" aria-hidden />
              </span>
              <div className="min-w-0">
                <h1 className="text-navy text-xl leading-tight font-extrabold sm:text-2xl">
                  Évaluation : {assessment.title}
                </h1>
                <p className="text-muted mt-1 text-sm">
                  Répondez à toutes les questions avant la fin du temps imparti.
                </p>
              </div>
            </div>
            <ul className="text-navy mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm">
              {meta.map(([Icon, text]) => (
                <li key={text} className="flex items-center gap-2">
                  <Icon className="text-brand size-4" aria-hidden /> {text}
                </li>
              ))}
            </ul>
          </header>
        }
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <section aria-labelledby="about-eval" className={card}>
          <h2 id="about-eval" className="text-navy flex items-center gap-2 text-lg font-bold">
            <ClipboardList className="text-brand size-5" aria-hidden /> À propos de cette évaluation
          </h2>
          <p className="text-muted mt-3 text-sm leading-relaxed">{assessment.description}</p>
          <p className="mt-3">
            <span className="text-brand inline-block rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-medium">
              {assessment.skillName}
            </span>
          </p>
        </section>
        <section aria-labelledby="goal-eval" className={card}>
          <h2 id="goal-eval" className="text-navy flex items-center gap-2 text-lg font-bold">
            <Target className="text-brand size-5" aria-hidden /> Votre objectif
          </h2>
          <div className="mt-3 flex items-center justify-between gap-4">
            <p className="text-muted text-sm leading-relaxed">
              Obtenez au moins {assessment.passScore} % pour réussir cette évaluation et recevoir votre badge
              de compétence.
            </p>
            <Medal className="size-14 shrink-0 text-amber-500" aria-hidden />
          </div>
        </section>
      </div>
    </div>
  );
}
