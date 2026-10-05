"use client";

import { useState, useTransition } from "react";
import { Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { startAssessmentAction } from "@/app/dashboard/assessments/actions";

interface StartAssessmentButtonProps {
  slug: string;
  resume: boolean;
  /** Overrides the default wording, e.g. "Réessayer" after a failed attempt. */
  label?: string;
  variant?: "primary" | "outline";
}

export function StartAssessmentButton({
  slug,
  resume,
  label,
  variant = "primary",
}: StartAssessmentButtonProps) {
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();
  const text = label ?? (resume ? "Reprendre" : "Commencer");

  return (
    <div>
      <Button
        variant={variant}
        size="sm"
        className={variant === "outline" ? "text-brand border-brand/40" : undefined}
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            // On success the action redirects, so a returned value is always an error.
            const result = await startAssessmentAction(slug);
            if (result?.error) setError(result.error);
          })
        }
      >
        <Play /> {pending ? "Ouverture…" : text}
      </Button>
      {error && (
        <p role="alert" className="text-danger mt-2 text-sm">
          {error}
        </p>
      )}
    </div>
  );
}
