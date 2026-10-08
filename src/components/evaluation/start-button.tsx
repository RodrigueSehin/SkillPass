"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { startEvaluationAction } from "@/app/e/actions";
import { Button } from "@/components/ui/button";

export function StartEvaluationButton({ token, resume }: { token: string; resume: boolean }) {
  const router = useRouter();
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();
  return (
    <div className="space-y-3 text-center">
      <Button
        size="lg"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            const result = await startEvaluationAction(token);
            if (result.attemptId) router.push(`/e/${token}/passer/${result.attemptId}`);
            else setError(result.error);
          })
        }
      >
        {pending ? "Ouverture…" : resume ? "Reprendre l'évaluation" : "Commencer l'évaluation"}
      </Button>
      <p className="text-muted text-xs">Le chronomètre démarre dès que vous commencez.</p>
      {error && (
        <p role="alert" className="text-danger text-sm">
          {error}
        </p>
      )}
    </div>
  );
}
