"use client";

import { useState, useTransition } from "react";
import { Check, Sparkles, TriangleAlert } from "lucide-react";
import { explainMatchAction } from "@/app/business/matching/actions";
import type { MatchExplanation } from "@/services/ai.service";

/** The assistant's reading of a profile, on request. The rule-based synthesis above it stays the baseline. */
export function AiSynthesis({
  username,
  wanted,
  jobOfferId,
}: {
  username: string;
  wanted: string[];
  jobOfferId: string | null;
}) {
  const [result, setResult] = useState<MatchExplanation>();
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();

  function ask() {
    setError(undefined);
    startTransition(async () => {
      const answer = await explainMatchAction(username, wanted, jobOfferId);
      if (answer.error) setError(answer.error);
      else setResult(answer.data);
    });
  }

  if (!result) {
    return (
      <section className="border-brand/30 space-y-2 rounded-xl border border-dashed p-4">
        <button
          type="button"
          onClick={ask}
          disabled={pending}
          className="text-brand flex items-center gap-2 text-sm font-semibold hover:underline disabled:opacity-60"
        >
          <Sparkles className="size-4" aria-hidden />{" "}
          {pending ? "Analyse en cours…" : "Générer la synthèse IA"}
        </button>
        <p className="text-muted text-xs">
          Lecture du profil public par rapport à votre recherche. Les coordonnées ne sont jamais transmises.
        </p>
        {error && (
          <p role="alert" className="text-danger text-xs">
            {error}
          </p>
        )}
      </section>
    );
  }

  return (
    <section aria-label="Synthèse IA" className="space-y-3 rounded-xl bg-blue-50/60 p-4">
      <h3 className="text-navy flex items-center gap-2 text-sm font-bold">
        <Sparkles className="text-brand size-4" aria-hidden /> Synthèse IA
      </h3>
      <p className="text-navy/90 text-sm">{result.summary}</p>
      {result.strengths.length > 0 && (
        <ul className="space-y-1.5">
          {result.strengths.map((s) => (
            <li key={s} className="flex items-start gap-2 text-sm">
              <Check
                className="mt-0.5 size-4 shrink-0 rounded-full bg-green-600 p-0.5 text-white"
                aria-hidden
              />{" "}
              {s}
            </li>
          ))}
        </ul>
      )}
      {result.gaps.length > 0 && (
        <ul className="space-y-1.5">
          {result.gaps.map((g) => (
            <li key={g} className="flex items-start gap-2 text-sm">
              <TriangleAlert className="mt-0.5 size-4 shrink-0 text-amber-600" aria-hidden /> {g}
            </li>
          ))}
        </ul>
      )}
      <p className="text-muted text-[11px]">
        Généré par IA à partir du profil public : à vérifier avant toute décision.
      </p>
    </section>
  );
}
