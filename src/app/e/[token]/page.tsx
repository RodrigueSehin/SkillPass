import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CheckCircle2, Clock, FileText, Globe, Layers, ShieldAlert, Target } from "lucide-react";
import { StartEvaluationButton } from "@/components/evaluation/start-button";
import { Logo } from "@/components/layout/logo";
import { Card, CardContent } from "@/components/ui/card";
import { requireUser } from "@/lib/auth/current-user";
import { profileFor } from "@/lib/auth/profile";
import { NotFoundError } from "@/lib/errors";
import { getEvaluationAttemptService } from "@/services/container";
import { EVALUATION_TYPE_LABELS } from "@/types/evaluation";
import { SKILL_LEVEL_LABELS } from "@/types/skill";

// Private link: keep it out of search engines and out of the Referer header.
export const metadata: Metadata = {
  title: "Évaluation",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};
export const dynamic = "force-dynamic";

export default async function CandidateEvaluationPage({ params }: PageProps<"/e/[token]">) {
  const { token } = await params;
  const user = await requireUser();
  await profileFor(user);
  let intro;
  try {
    intro = await getEvaluationAttemptService().intro(token, user.id);
  } catch (err) {
    if (err instanceof NotFoundError) notFound();
    throw err;
  }
  const { evaluation: e, organization, last } = intro;
  const remaining = e.attemptsAllowed === 0 ? null : Math.max(e.attemptsAllowed - intro.attemptsUsed, 0);
  const canStart = !intro.blocked && (intro.inProgressId !== null || remaining === null || remaining > 0);

  return (
    <div className="min-h-screen">
      <header className="border-border bg-surface border-b">
        <div className="mx-auto flex h-16 max-w-3xl items-center px-4">
          <Logo />
        </div>
      </header>
      <main className="mx-auto max-w-2xl space-y-5 px-4 py-10">
        <Card>
          <CardContent>
            <p className="text-muted text-sm">{organization.name} vous invite à passer une évaluation</p>
            <h1 className="text-navy mt-1 text-2xl font-bold tracking-tight">{e.title}</h1>
            {e.description && <p className="text-muted mt-3 text-sm leading-relaxed">{e.description}</p>}
            <ul className="text-navy mt-5 grid gap-3 text-sm sm:grid-cols-2">
              <li className="flex items-center gap-2">
                <Clock className="text-brand size-4" aria-hidden /> {e.durationMinutes} minutes
              </li>
              <li className="flex items-center gap-2">
                <FileText className="text-brand size-4" aria-hidden /> {e.questionCount} question
                {e.questionCount > 1 ? "s" : ""}
              </li>
              <li className="flex items-center gap-2">
                <Layers className="text-brand size-4" aria-hidden /> {EVALUATION_TYPE_LABELS[e.type].title} ·{" "}
                {SKILL_LEVEL_LABELS[e.difficulty]}
              </li>
              <li className="flex items-center gap-2">
                <Globe className="text-brand size-4" aria-hidden /> {e.language}
              </li>
              <li className="flex items-center gap-2">
                <Target className="text-brand size-4" aria-hidden /> Score pour réussir : {e.passScore} %
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="text-brand size-4" aria-hidden />
                {remaining === null
                  ? "Tentatives illimitées"
                  : `${remaining} tentative${remaining > 1 ? "s" : ""} restante${remaining > 1 ? "s" : ""}`}
              </li>
            </ul>
            {e.hasOpenQuestions && (
              <p className="text-muted mt-4 rounded-lg bg-slate-50 p-3 text-xs">
                Certaines questions sont corrigées par une personne de l&apos;équipe de {organization.name} :
                votre résultat peut arriver après quelques jours.
              </p>
            )}
          </CardContent>
        </Card>

        {last && (
          <Card>
            <CardContent>
              <h2 className="text-navy font-bold">Votre dernier résultat</h2>
              {last.score !== null ? (
                <p className="mt-2 text-sm">
                  <span className="text-navy text-3xl font-bold">{last.score} %</span>{" "}
                  <span
                    className={last.passed ? "font-semibold text-green-700" : "font-semibold text-red-600"}
                  >
                    {last.passed ? "Réussi" : "Non réussi"}
                  </span>
                </p>
              ) : last.status === "SUBMITTED" ? (
                <p className="text-muted mt-2 text-sm">
                  Vos réponses ont bien été envoyées. L&apos;équipe de {organization.name} va les corriger.
                </p>
              ) : (
                <p className="text-muted mt-2 text-sm">
                  Vos réponses ont bien été envoyées. {organization.name} vous communiquera votre résultat.
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {intro.blocked && (
          <p
            role="alert"
            className="flex items-center gap-2 rounded-xl bg-amber-50 p-4 text-sm text-amber-800"
          >
            <ShieldAlert className="size-5 shrink-0" aria-hidden /> {intro.blocked}
          </p>
        )}
        {canStart ? (
          <StartEvaluationButton token={token} resume={intro.inProgressId !== null} />
        ) : (
          !intro.blocked && (
            <p className="text-muted text-center text-sm">Vous avez utilisé toutes vos tentatives.</p>
          )
        )}
      </main>
    </div>
  );
}
