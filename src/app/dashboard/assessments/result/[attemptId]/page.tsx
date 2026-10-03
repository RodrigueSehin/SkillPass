import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Clock, ShieldCheck, XCircle, PartyPopper } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { SkillPassScore } from "@/components/skills/skillpass-score";
import { CredentialBadge } from "@/components/verification/credential-badge";
import { DOMAIN_LABELS } from "@/config/assessment-bank";
import { requireUser } from "@/lib/auth/current-user";
import { ConflictError, NotFoundError } from "@/lib/errors";
import { appUrl } from "@/lib/utils/app-url";
import { getAssessmentService } from "@/services/container";
import { SKILL_LEVEL_LABELS } from "@/types/skill";

export const metadata: Metadata = { title: "Résultat de l'évaluation" };
export const dynamic = "force-dynamic";

export default async function ResultPage({ params }: PageProps<"/dashboard/assessments/result/[attemptId]">) {
  const user = await requireUser();
  const { attemptId } = await params;

  let result;
  try {
    result = await getAssessmentService().getResult(user.id, attemptId);
  } catch (err) {
    if (err instanceof NotFoundError) notFound();
    if (err instanceof ConflictError) redirect(`/dashboard/assessments/take/${attemptId}`);
    throw err;
  }
  const { attempt, assessment, credential } = result;

  const banner = {
    PASSED: { icon: PartyPopper, tone: "bg-green-50 text-success", text: "Bravo, évaluation réussie !" },
    FAILED: { icon: XCircle, tone: "bg-red-50 text-danger", text: "Seuil non atteint cette fois." },
    PENDING_REVIEW: {
      icon: Clock,
      tone: "bg-amber-50 text-amber-700",
      text: "Évaluation réussie, en attente de validation par un vérificateur.",
    },
    REJECTED: {
      icon: ShieldCheck,
      tone: "bg-red-50 text-danger",
      text: "Le vérificateur n'a pas validé cette évaluation.",
    },
    IN_PROGRESS: { icon: Clock, tone: "bg-blue-50 text-brand", text: "En cours" },
  }[attempt.status];
  const Icon = banner.icon;

  return (
    <>
      <PageHeader title={assessment.title} description="Résultat de votre évaluation." />
      <div
        className={`mb-6 flex items-center gap-3 rounded-xl px-4 py-3 font-semibold ${banner.tone}`}
        role="status"
      >
        <Icon className="size-5" aria-hidden /> {banner.text}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Détail par domaine</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {attempt.domainScores &&
              (Object.keys(DOMAIN_LABELS) as (keyof typeof DOMAIN_LABELS)[]).map((domain) => (
                <div key={domain}>
                  <div className="flex items-baseline justify-between text-sm">
                    <span className="font-medium">{DOMAIN_LABELS[domain]}</span>
                    <span className="font-semibold">{attempt.domainScores![domain]}%</span>
                  </div>
                  <Progress
                    value={attempt.domainScores![domain]}
                    className="mt-1.5"
                    aria-label={`${DOMAIN_LABELS[domain]} : ${attempt.domainScores![domain]}%`}
                  />
                </div>
              ))}
            <p className="text-muted text-xs">
              Les bonnes réponses ne sont pas affichées afin de préserver la valeur de l&apos;évaluation ;
              travaillez les domaines les plus faibles avant de retenter.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex flex-col items-center gap-3">
            <SkillPassScore score={attempt.overallScore ?? 0} size={130} />
            <p className="text-muted text-sm">Score global</p>
            {attempt.level && (
              <p className="text-navy text-lg font-bold">{SKILL_LEVEL_LABELS[attempt.level]}</p>
            )}
            {attempt.reviewNote && (
              <p className="text-muted rounded-lg bg-slate-50 p-3 text-sm">
                Note du vérificateur : {attempt.reviewNote}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {credential && (
        <section className="mt-6 max-w-xl" aria-label="Badge obtenu">
          <h2 className="mb-3 text-lg font-semibold">Votre badge</h2>
          <CredentialBadge
            credential={credential}
            verifyUrl={`${appUrl()}/verify/${credential.credentialId}`}
          />
        </section>
      )}

      <div className="mt-8 flex gap-3">
        <Button asChild variant="outline">
          <Link href="/dashboard/assessments">Toutes les évaluations</Link>
        </Button>
        {credential && (
          <Button asChild>
            <Link href="/dashboard/skillpass">Voir mon SkillPass</Link>
          </Button>
        )}
      </div>
    </>
  );
}
