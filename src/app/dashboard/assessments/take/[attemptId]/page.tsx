import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { AssessmentTaker } from "@/components/verification/assessment-taker";
import { requireUser } from "@/lib/auth/current-user";
import { ConflictError, NotFoundError } from "@/lib/errors";
import { getAssessmentService } from "@/services/container";

export const metadata: Metadata = { title: "Évaluation en cours" };
// The countdown depends on the current time: never cache this page.
export const dynamic = "force-dynamic";

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
  return (
    <>
      <PageHeader
        title={assessment.title}
        description="Répondez à toutes les questions avant la fin du temps imparti."
      />
      <AssessmentTaker assessment={assessment} secondsLeft={secondsLeft} />
    </>
  );
}
