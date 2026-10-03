import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ClipboardCheck } from "lucide-react";
import { Logo } from "@/components/layout/logo";
import { EmptyState } from "@/components/ui/empty-state";
import { ReviewCard } from "@/components/verification/review-card";
import { requireUser } from "@/lib/auth/current-user";
import { ForbiddenError } from "@/lib/errors";
import { getAssessmentService } from "@/services/container";
import { DOMAIN_LABELS } from "@/config/assessment-bank";

export const metadata: Metadata = { title: "Validations en attente", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function VerificationsPage() {
  const user = await requireUser();

  let items;
  try {
    items = await getAssessmentService().listPendingReview(user.id);
  } catch (err) {
    // Do not reveal that the page exists to users without a reviewer role.
    if (err instanceof ForbiddenError) notFound();
    throw err;
  }

  return (
    <div className="min-h-screen">
      <header className="border-border bg-surface border-b">
        <div className="mx-auto flex h-16 max-w-4xl items-center justify-between px-4">
          <Logo href="/dashboard" />
          <Link href="/dashboard" className="text-muted hover:text-foreground text-sm">
            Retour au dashboard
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-4xl px-4 py-8">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Validations en attente</h1>
        <p className="text-muted mt-1 mb-6">
          Évaluations critiques réussies, en attente de la décision d&apos;un vérificateur.
        </p>
        {items.length === 0 ? (
          <EmptyState
            icon={ClipboardCheck}
            title="Rien à valider"
            description="Toutes les évaluations ont été traitées."
          />
        ) : (
          <ul className="space-y-4">
            {items.map((item) => (
              <li key={item.attempt.id}>
                <ReviewCard
                  attemptId={item.attempt.id}
                  holderName={item.holderName}
                  title={item.assessmentTitle}
                  score={item.attempt.overallScore ?? 0}
                  domains={Object.entries(item.attempt.domainScores ?? {}).map(([k, v]) => ({
                    label: DOMAIN_LABELS[k as keyof typeof DOMAIN_LABELS],
                    score: v,
                  }))}
                  submittedAt={item.attempt.submittedAt}
                />
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
