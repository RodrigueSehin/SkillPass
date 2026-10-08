import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { EvaluationRunner } from "@/components/evaluation/evaluation-runner";
import { requireUser } from "@/lib/auth/current-user";
import { NotFoundError } from "@/lib/errors";
import { getEvaluationAttemptService } from "@/services/container";

export const metadata: Metadata = {
  title: "Évaluation en cours",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};
export const dynamic = "force-dynamic";

export default async function RunEvaluationPage({ params }: PageProps<"/e/[token]/passer/[attemptId]">) {
  const { token, attemptId } = await params;
  const user = await requireUser();
  let data;
  try {
    data = await getEvaluationAttemptService().load(attemptId, user.id);
  } catch (err) {
    if (err instanceof NotFoundError) notFound();
    throw err;
  }
  // Finished or timed out: back to the result.
  if (!data) redirect(`/e/${token}`);
  return (
    <main className="min-h-screen bg-slate-50">
      <EvaluationRunner token={token} data={data} />
    </main>
  );
}
