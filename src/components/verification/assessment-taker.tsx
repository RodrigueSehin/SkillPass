"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DOMAIN_LABELS } from "@/config/assessment-bank";
import { submitAssessmentAction } from "@/app/dashboard/assessments/actions";
import type { TakeableAssessment } from "@/services/assessment.service";

interface AssessmentTakerProps {
  assessment: TakeableAssessment;
  /** Time left according to the SERVER clock, so a wrong device clock cannot extend the exam. */
  secondsLeft: number;
}

const format = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

export function AssessmentTaker({ assessment, secondsLeft }: AssessmentTakerProps) {
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [remaining, setRemaining] = useState(secondsLeft);
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();
  const submitted = useRef(false);

  const submit = useCallback(() => {
    if (submitted.current) return;
    submitted.current = true;
    setError(undefined);
    startTransition(async () => {
      const payload = assessment.questions.map((q) => ({
        questionId: q.id,
        selected: answers[q.id] ?? null,
      }));
      const result = await submitAssessmentAction(assessment.attemptId, payload);
      // On success the action redirects; reaching this line means it failed.
      if (result?.error) {
        setError(result.error);
        submitted.current = false;
      }
    });
  }, [assessment, answers]);

  useEffect(() => {
    const timer = setInterval(() => setRemaining((r) => Math.max(0, r - 1)), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (remaining === 0) submit();
  }, [remaining, submit]);

  const answered = Object.keys(answers).length;
  const total = assessment.questions.length;
  const low = remaining <= 60;

  return (
    <div>
      <div className="border-border bg-background/95 sticky top-16 z-10 -mx-4 mb-6 flex items-center justify-between gap-4 border-b px-4 py-3 backdrop-blur sm:mx-0 sm:rounded-xl sm:border">
        <p className="text-muted text-sm">
          <span className="text-foreground font-semibold">{answered}</span>/{total} réponses
        </p>
        <p
          className={`inline-flex items-center gap-1.5 font-mono text-lg font-bold ${low ? "text-danger" : "text-navy"}`}
          role="timer"
          aria-label={`Temps restant ${format(remaining)}`}
        >
          <Clock className="size-5" aria-hidden /> {format(remaining)}
        </p>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
        className="space-y-5"
      >
        {assessment.questions.map((q, index) => (
          <Card key={q.id} className="p-5">
            <fieldset>
              <legend className="text-brand mb-1 text-xs font-semibold tracking-wide uppercase">
                {DOMAIN_LABELS[q.domain]} · Question {index + 1}
              </legend>
              <p className="mb-4 font-medium">{q.prompt}</p>
              <div className="space-y-2">
                {q.options.map((option, i) => {
                  const checked = answers[q.id] === i;
                  return (
                    <label
                      key={i}
                      className={`flex cursor-pointer items-start gap-3 rounded-xl border px-4 py-3 text-sm ${checked ? "border-brand bg-blue-50" : "border-border hover:bg-slate-50"}`}
                    >
                      <input
                        type="radio"
                        name={q.id}
                        checked={checked}
                        onChange={() => setAnswers((a) => ({ ...a, [q.id]: i }))}
                        className="mt-0.5"
                      />
                      <span>{option}</span>
                    </label>
                  );
                })}
              </div>
            </fieldset>
          </Card>
        ))}

        {error && (
          <p role="alert" className="text-danger rounded-lg bg-red-50 px-3 py-2 text-sm">
            {error}
          </p>
        )}
        <div className="flex items-center justify-between gap-4">
          <p className="text-muted text-sm">
            {answered < total
              ? `${total - answered} question(s) sans réponse compteront comme fausses.`
              : "Prêt à soumettre."}
          </p>
          <Button type="submit" size="lg" disabled={pending}>
            {pending ? "Correction…" : "Soumettre mes réponses"}
          </Button>
        </div>
      </form>
    </div>
  );
}
