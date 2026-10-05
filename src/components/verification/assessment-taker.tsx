"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { ArrowLeft, ArrowRight, CircleHelp, Lightbulb, ListChecks, Timer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DOMAIN_LABELS } from "@/config/assessment-bank";
import { cn } from "@/lib/utils/cn";
import { submitAssessmentAction } from "@/app/dashboard/assessments/actions";
import type { TakeableAssessment } from "@/services/assessment.service";

interface AssessmentTakerProps {
  assessment: TakeableAssessment;
  /** Time left according to the SERVER clock, so a wrong device clock cannot extend the exam. */
  secondsLeft: number;
  /** Server-rendered header card, shown above the question. */
  header: React.ReactNode;
}

const format = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
const card = "border-border/60 shadow-soft rounded-2xl border bg-white p-5 sm:p-6";

const TIPS = [
  "Lisez toute la question et toutes les réponses avant de choisir.",
  "Éliminez d'abord les options manifestement fausses.",
  "Vous pouvez revenir sur une question tant que vous n'avez pas soumis.",
];

export function AssessmentTaker({ assessment, secondsLeft, header }: AssessmentTakerProps) {
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [current, setCurrent] = useState(0);
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

  const questions = assessment.questions;
  const total = questions.length;
  const q = questions[current];
  const answered = Object.keys(answers).length;
  const low = remaining <= 60;
  const totalSeconds = Math.max(assessment.durationMinutes * 60, 1);
  const timeLeftPct = Math.min(100, Math.round((remaining / totalSeconds) * 100));
  const progress = Math.round(((current + 1) / total) * 100);

  return (
    <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
      <div className="min-w-0 space-y-6">
        {header}

        <section aria-label="Question" className={card}>
          <div className="flex items-baseline justify-between gap-4">
            <h2 className="text-navy text-lg font-bold">
              Question {current + 1} sur {total}
            </h2>
            <span className="text-navy font-bold">{progress}%</span>
          </div>
          <div
            role="progressbar"
            aria-label="Progression dans l'évaluation"
            aria-valuenow={progress}
            aria-valuemin={0}
            aria-valuemax={100}
            className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100"
          >
            <div className="bg-brand h-full rounded-full transition-all" style={{ width: `${progress}%` }} />
          </div>

          <div className="mt-5 flex flex-wrap items-center justify-between gap-2 text-xs font-medium">
            <span className="text-brand inline-flex items-center gap-1.5 rounded-lg bg-blue-50 px-3 py-1.5">
              <CircleHelp className="size-3.5" aria-hidden /> Type : question à choix unique
            </span>
            <span className="rounded-lg bg-amber-50 px-3 py-1.5 text-amber-700">
              Domaine : {DOMAIN_LABELS[q.domain]}
            </span>
          </div>

          <fieldset className="mt-5" key={q.id}>
            <legend className="text-navy text-lg leading-snug font-bold">{q.prompt}</legend>
            <div className="mt-4 space-y-3">
              {q.options.map((option, i) => {
                const checked = answers[q.id] === i;
                return (
                  <label
                    key={i}
                    className={cn(
                      "focus-within:ring-brand/40 flex cursor-pointer items-center gap-4 rounded-xl border px-4 py-3.5 text-sm focus-within:ring-2",
                      checked
                        ? "border-brand shadow-soft bg-blue-50"
                        : "border-border bg-white hover:bg-slate-50",
                    )}
                  >
                    <input
                      type="radio"
                      name={q.id}
                      checked={checked}
                      onChange={() => setAnswers((a) => ({ ...a, [q.id]: i }))}
                      className="accent-brand size-5 shrink-0"
                    />
                    <span className="text-navy">
                      <span className="font-semibold">{String.fromCharCode(65 + i)}.</span> {option}
                    </span>
                  </label>
                );
              })}
            </div>
          </fieldset>

          <div className="mt-6 flex flex-wrap items-center justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              className="text-brand border-brand/40"
              disabled={current === 0}
              onClick={() => setCurrent((c) => Math.max(0, c - 1))}
            >
              <ArrowLeft /> Question précédente
            </Button>
            <Button
              type="button"
              disabled={current === total - 1}
              onClick={() => setCurrent((c) => Math.min(total - 1, c + 1))}
            >
              Question suivante <ArrowRight />
            </Button>
          </div>
        </section>
      </div>

      <aside className="grid min-w-0 gap-6 md:grid-cols-2 xl:grid-cols-1">
        <section aria-label="Temps restant" className={card}>
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-navy flex items-center gap-2 font-bold">
                <Timer className="text-brand size-5" aria-hidden /> Temps restant
              </p>
              <p
                role="timer"
                aria-label={`Temps restant ${format(remaining)}`}
                className={cn(
                  "mt-2 text-4xl font-extrabold tracking-tight tabular-nums",
                  low ? "text-danger" : "text-navy",
                )}
              >
                {format(remaining)}
              </p>
            </div>
            <p className="text-muted max-w-[8rem] text-right text-xs">
              {low ? "Dernière minute !" : "Restez concentré !"}
            </p>
          </div>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">
            <div
              className={cn("h-full rounded-full", low ? "bg-danger" : "bg-brand")}
              style={{ width: `${timeLeftPct}%` }}
            />
          </div>
        </section>

        <section aria-label="Plan de l'évaluation" className={card}>
          <h2 className="text-navy flex items-center gap-2 font-bold">
            <ListChecks className="text-brand size-5" aria-hidden /> Plan de l&apos;évaluation
          </h2>
          <ul className="text-muted mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs">
            <li className="flex items-center gap-1.5">
              <span className="size-2.5 rounded-full bg-green-500" aria-hidden /> Répondue
            </li>
            <li className="flex items-center gap-1.5">
              <span className="bg-brand size-2.5 rounded-full" aria-hidden /> Question actuelle
            </li>
            <li className="flex items-center gap-1.5">
              <span className="size-2.5 rounded-full bg-slate-200" aria-hidden /> Non répondue
            </li>
          </ul>
          <ol className="mt-4 grid grid-cols-5 gap-2">
            {questions.map((item, i) => (
              <li key={item.id}>
                <button
                  type="button"
                  aria-label={`Aller à la question ${i + 1}${answers[item.id] !== undefined ? " (répondue)" : ""}`}
                  aria-current={i === current ? "step" : undefined}
                  onClick={() => setCurrent(i)}
                  className={cn(
                    "h-10 w-full rounded-lg text-sm font-semibold transition-colors",
                    i === current
                      ? "bg-brand text-white"
                      : answers[item.id] !== undefined
                        ? "bg-green-500 text-white"
                        : "text-navy bg-slate-100 hover:bg-slate-200",
                  )}
                >
                  {i + 1}
                </button>
              </li>
            ))}
          </ol>

          <p className="text-muted mt-4 text-sm">
            <span className="text-navy font-semibold">{answered}</span>/{total} réponses
          </p>
          {error && (
            <p role="alert" className="text-danger mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm">
              {error}
            </p>
          )}
          <Button type="button" className="mt-3 w-full" disabled={pending} onClick={submit}>
            {pending ? "Correction…" : "Soumettre mes réponses"}
          </Button>
          <p className="text-muted mt-2 text-xs">
            {answered < total
              ? `${total - answered} question(s) sans réponse compteront comme fausses.`
              : "Toutes les questions sont répondues."}
          </p>
        </section>

        <section
          aria-label="Besoin d'aide ?"
          className="rounded-2xl border border-blue-100 bg-blue-50/60 p-5 sm:p-6 md:col-span-2 xl:col-span-1"
        >
          <h2 className="text-navy flex items-center gap-2 font-bold">
            <Lightbulb className="size-5 text-amber-500" aria-hidden /> Besoin d&apos;aide ?
          </h2>
          <p className="text-navy mt-3 text-sm font-semibold">Quelques conseils :</p>
          <ul className="text-navy/80 mt-2 list-disc space-y-1.5 pl-5 text-sm">
            {TIPS.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        </section>
      </aside>
    </div>
  );
}
