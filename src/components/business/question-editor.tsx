"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Label } from "@/components/ui/label";
import { questionSchema } from "@/schemas/evaluation";
import {
  QUESTION_DIFFICULTIES,
  QUESTION_DIFFICULTY_LABELS,
  QUESTION_TYPE_LABELS,
  TRUE_FALSE_OPTIONS,
  isChoice,
  type EvaluationQuestion,
} from "@/types/evaluation";

const field =
  "border-border focus-visible:ring-brand/40 w-full rounded-xl border bg-white px-3 text-sm outline-none focus-visible:ring-2";
const MAX_OPTIONS = 6;

/** Form for one question. Nothing reaches the test until the question is valid and saved. */
export function QuestionEditor({
  question,
  onSave,
  onCancel,
}: {
  question: EvaluationQuestion;
  onSave: (q: EvaluationQuestion) => void;
  onCancel: () => void;
}) {
  const [q, setQ] = useState<EvaluationQuestion>(() =>
    question.type === "TRUE_FALSE"
      ? { ...question, options: [...TRUE_FALSE_OPTIONS] }
      : isChoice(question.type) && question.options.length === 0
        ? { ...question, options: ["", ""] }
        : question,
  );
  const [error, setError] = useState<string>();
  const choice = isChoice(q.type);
  const multiple = q.type === "MULTIPLE";

  const setOption = (i: number, value: string) =>
    setQ((p) => ({ ...p, options: p.options.map((o, j) => (j === i ? value : o)) }));
  const toggleCorrect = (i: number) =>
    setQ((p) => ({
      ...p,
      correct: multiple
        ? p.correct.includes(i)
          ? p.correct.filter((c) => c !== i)
          : [...p.correct, i].sort()
        : [i],
    }));
  const removeOption = (i: number) =>
    setQ((p) => ({
      ...p,
      options: p.options.filter((_, j) => j !== i),
      correct: p.correct.filter((c) => c !== i).map((c) => (c > i ? c - 1 : c)),
    }));

  function save() {
    const parsed = questionSchema.safeParse(q);
    if (!parsed.success) return setError(parsed.error.issues[0]?.message ?? "Question invalide");
    onSave(parsed.data);
  }

  return (
    <div className="border-brand/40 space-y-4 rounded-xl border bg-blue-50/30 p-4">
      <p className="text-navy text-sm font-bold">{QUESTION_TYPE_LABELS[q.type].title}</p>
      <div className="space-y-2">
        <Label htmlFor="question-prompt">Énoncé de la question</Label>
        <textarea
          id="question-prompt"
          value={q.prompt}
          maxLength={500}
          rows={3}
          onChange={(e) => setQ({ ...q, prompt: e.target.value })}
          className={`${field} py-2`}
        />
      </div>

      {q.type === "TRUE_FALSE" && (
        <fieldset className="space-y-2">
          <legend className="text-sm font-medium">Bonne réponse</legend>
          <div className="flex gap-5">
            {TRUE_FALSE_OPTIONS.map((label, i) => (
              <label key={label} className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="tf"
                  checked={q.correct[0] === i}
                  onChange={() => setQ({ ...q, correct: [i] })}
                  className="accent-brand size-4"
                />
                {label}
              </label>
            ))}
          </div>
        </fieldset>
      )}

      {choice && (
        <fieldset className="space-y-2">
          <legend className="text-sm font-medium">
            Réponses possibles{" "}
            <span className="text-muted font-normal">
              ({multiple ? "cochez toutes les bonnes réponses" : "sélectionnez la bonne réponse"})
            </span>
          </legend>
          {q.options.map((option, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                type={multiple ? "checkbox" : "radio"}
                name="correct"
                aria-label={`Réponse ${i + 1} correcte`}
                checked={q.correct.includes(i)}
                onChange={() => toggleCorrect(i)}
                className="accent-brand size-4 shrink-0"
              />
              <input
                aria-label={`Réponse ${i + 1}`}
                value={option}
                maxLength={200}
                onChange={(e) => setOption(i, e.target.value)}
                placeholder={`Réponse ${i + 1}`}
                className={`${field} h-10`}
              />
              {q.options.length > 2 && (
                <button
                  type="button"
                  aria-label={`Supprimer la réponse ${i + 1}`}
                  onClick={() => removeOption(i)}
                  className="text-muted hover:text-danger p-1"
                >
                  <Trash2 className="size-4" />
                </button>
              )}
            </div>
          ))}
          {q.options.length < MAX_OPTIONS && (
            <button
              type="button"
              onClick={() => setQ({ ...q, options: [...q.options, ""] })}
              className="text-brand flex items-center gap-1 text-sm font-semibold"
            >
              <Plus className="size-4" aria-hidden /> Ajouter une réponse
            </button>
          )}
        </fieldset>
      )}

      {!choice && q.type !== "TRUE_FALSE" && (
        <p className="text-muted rounded-lg bg-white p-3 text-xs">
          Cette question est lue et notée par une personne de votre équipe : elle n&apos;est pas corrigée
          automatiquement.
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="question-difficulty">Difficulté</Label>
          <select
            id="question-difficulty"
            value={q.difficulty}
            onChange={(e) => setQ({ ...q, difficulty: e.target.value as EvaluationQuestion["difficulty"] })}
            className={`${field} h-10`}
          >
            {QUESTION_DIFFICULTIES.map((d) => (
              <option key={d} value={d}>
                {QUESTION_DIFFICULTY_LABELS[d]}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="question-points">Points</Label>
          <input
            id="question-points"
            type="number"
            min={1}
            max={20}
            value={q.points}
            onChange={(e) => setQ({ ...q, points: Number(e.target.value) })}
            className={`${field} h-10`}
          />
        </div>
      </div>

      {error && (
        <p role="alert" className="text-danger text-sm">
          {error}
        </p>
      )}
      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="border-border text-navy h-10 rounded-xl border bg-white px-4 text-sm font-semibold hover:bg-slate-50"
        >
          Annuler
        </button>
        <button
          type="button"
          onClick={save}
          className="bg-brand h-10 rounded-xl px-5 text-sm font-semibold text-white hover:bg-blue-700"
        >
          Enregistrer la question
        </button>
      </div>
    </div>
  );
}
