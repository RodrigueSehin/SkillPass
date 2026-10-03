"use client";

import { useState, useTransition } from "react";
import { Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { startAssessmentAction } from "@/app/dashboard/assessments/actions";

export function StartAssessmentButton({ slug, resume }: { slug: string; resume: boolean }) {
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();

  return (
    <div>
      <Button
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            // On success the action redirects, so a returned value is always an error.
            const result = await startAssessmentAction(slug);
            if (result?.error) setError(result.error);
          })
        }
      >
        <Play /> {pending ? "Ouverture…" : resume ? "Reprendre l'évaluation" : "Commencer l'évaluation"}
      </Button>
      {error && (
        <p role="alert" className="text-danger mt-2 text-sm">
          {error}
        </p>
      )}
    </div>
  );
}
