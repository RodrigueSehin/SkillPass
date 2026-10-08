"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, X } from "lucide-react";
import { reviewAttemptAction } from "@/app/business/evaluations/review-actions";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";
import { QUESTION_TYPE_LABELS, type AttemptResponse, type EvaluationQuestion } from "@/types/evaluation";

const isChoice = (q: EvaluationQuestion) =>
  q.type === "SINGLE" || q.type === "MULTIPLE" || q.type === "TRUE_FALSE";

/** Every answer of one attempt: choice questions are shown as marked, open ones get a field for points. */
export function AttemptReview({
  attemptId,
  questions,
  responses,
  review,
  graded,
  canReview,
}: {
  attemptId: string;
  questions: EvaluationQuestion[];
  responses: Record<string, AttemptResponse>;
  review: Record<string, number>;
  graded: boolean;
  canReview: boolean;
}) {
  const router = useRouter();
  const [points, setPoints] = useState<Record<string, string>>(
    Object.fromEntries(Object.entries(review).map(([id, p]) => [id, String(p)])),
  );
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();
  const open = questions.filter((q) => !isChoice(q));

  function save() {
    const missing = open.find((q) => points[q.id] === undefined || points[q.id] === "");
    if (missing) return setError("Notez toutes les questions ouvertes.");
    setError(undefined);
    startTransition(async () => {
      const result = await reviewAttemptAction(
        attemptId,
        Object.fromEntries(open.map((q) => [q.id, Number(points[q.id])])),
      );
      if (result.error) setError(result.error);
      else router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      <ol className="space-y-4">
        {questions.map((q, i) => {
          const given = responses[q.id];
          const chosen = given?.choices ?? [];
          const right = [...q.correct].sort().join() === [...chosen].sort().join();
          return (
            <li key={q.id} className="border-border/70 rounded-xl border p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-muted text-xs">
                    Question {i + 1} · {QUESTION_TYPE_LABELS[q.type].title} · {q.points} point
                    {q.points > 1 ? "s" : ""}
                  </p>
                  <p className="text-navy mt-1 font-semibold whitespace-pre-line">{q.prompt}</p>
                </div>
                {isChoice(q) && (
                  <span
                    className={cn(
                      "flex shrink-0 items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold",
                      right ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600",
                    )}
                  >
                    {right ? (
                      <Check className="size-3.5" aria-hidden />
                    ) : (
                      <X className="size-3.5" aria-hidden />
                    )}{" "}
                    {right ? "Correct" : "Incorrect"}
                  </span>
                )}
              </div>
              {isChoice(q) ? (
                <ul className="mt-3 space-y-1.5 text-sm">
                  {q.options.map((label, index) => {
                    const isRight = q.correct.includes(index);
                    const picked = chosen.includes(index);
                    return (
                      <li
                        key={index}
                        className={cn(
                          "flex items-center gap-2 rounded-lg px-3 py-1.5",
                          isRight ? "bg-green-50" : picked ? "bg-red-50" : "bg-slate-50",
                        )}
                      >
                        <span className="w-24 shrink-0 text-xs font-medium">
                          {picked ? "Choisi" : ""}
                          {isRight ? (picked ? " · attendu" : "Attendu") : ""}
                        </span>
                        <span>{label}</span>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <div className="mt-3 space-y-3">
                  <p className="rounded-lg bg-slate-50 p-3 text-sm whitespace-pre-wrap">
                    {given?.text?.trim() || <span className="text-muted">Aucune réponse.</span>}
                  </p>
                  <label className="flex items-center gap-2 text-sm">
                    Note
                    <input
                      type="number"
                      min={0}
                      max={q.points}
                      step={0.5}
                      disabled={!canReview}
                      value={points[q.id] ?? ""}
                      onChange={(e) => setPoints((p) => ({ ...p, [q.id]: e.target.value }))}
                      className="border-border h-10 w-24 rounded-xl border px-3 text-sm"
                    />
                    <span className="text-muted">/ {q.points}</span>
                  </label>
                </div>
              )}
            </li>
          );
        })}
      </ol>
      {error && (
        <p role="alert" className="text-danger rounded-lg bg-red-50 px-3 py-2 text-sm">
          {error}
        </p>
      )}
      {canReview && (
        <div className="flex justify-end">
          <Button disabled={pending} onClick={save}>
            {pending
              ? "Enregistrement…"
              : graded
                ? "Mettre à jour la correction"
                : open.length > 0
                  ? "Enregistrer la correction"
                  : "Valider le résultat"}
          </Button>
        </div>
      )}
    </div>
  );
}
