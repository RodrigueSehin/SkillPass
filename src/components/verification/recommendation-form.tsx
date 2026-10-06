"use client";

import { useState, useTransition } from "react";
import { CheckCircle2, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useHydrated } from "@/hooks/use-hydrated";
import { cn } from "@/lib/utils/cn";
import {
  RECOMMENDATION_RELATIONS,
  RECOMMENDATION_RELATION_LABELS,
  submitRecommendationSchema,
} from "@/schemas/verification";

export function RecommendationForm({ token, holderName }: { token: string; holderName: string }) {
  const [values, setValues] = useState({
    content: "",
    authorTitle: "",
    relation: "",
    rating: 0,
    keywords: "",
  });
  const [error, setError] = useState<string>();
  const [done, setDone] = useState(false);
  const [pending, startTransition] = useTransition();
  const hydrated = useHydrated();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const payload = {
      ...values,
      keywords: values.keywords
        .split(",")
        .map((k) => k.trim())
        .filter(Boolean),
    };
    const parsed = submitRecommendationSchema.safeParse(payload);
    if (!parsed.success) return setError(parsed.error.issues[0]?.message);
    setError(undefined);
    startTransition(async () => {
      try {
        const res = await fetch(`/api/recommend/${token}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (res.ok) return setDone(true);
        const answer = await res.json().catch(() => null);
        setError(answer?.error?.message ?? "L'envoi a échoué. Veuillez réessayer.");
      } catch {
        setError("Connexion impossible. Vérifiez votre réseau et réessayez.");
      }
    });
  }

  if (done) {
    return (
      <div className="py-6 text-center" role="status">
        <CheckCircle2 className="text-success mx-auto size-10" aria-hidden />
        <h2 className="mt-4 text-xl font-bold">Merci !</h2>
        <p className="text-muted mt-2 text-sm">
          {holderName} validera votre recommandation avant sa publication.
        </p>
      </div>
    );
  }

  // data-hydrated lets tests wait until submit is handled by React, not by the browser.
  return (
    <form onSubmit={submit} noValidate data-hydrated={hydrated} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="rec-title">Votre fonction (optionnel)</Label>
        <Input
          id="rec-title"
          placeholder="Directrice des systèmes d'information"
          value={values.authorTitle}
          onChange={(e) => setValues((v) => ({ ...v, authorTitle: e.target.value }))}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="rec-relation">Votre lien avec {holderName} (optionnel)</Label>
        <select
          id="rec-relation"
          value={values.relation}
          onChange={(e) => setValues((v) => ({ ...v, relation: e.target.value }))}
          className="border-border bg-surface h-11 w-full rounded-xl border px-4 text-sm"
        >
          <option value="">Non précisé</option>
          {RECOMMENDATION_RELATIONS.map((r) => (
            <option key={r} value={r}>
              {RECOMMENDATION_RELATION_LABELS[r]}
            </option>
          ))}
        </select>
      </div>
      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">Votre note (optionnel)</legend>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              aria-label={`${n} étoile${n > 1 ? "s" : ""}`}
              aria-pressed={values.rating === n}
              onClick={() => setValues((v) => ({ ...v, rating: v.rating === n ? 0 : n }))}
              className="rounded p-0.5"
            >
              <Star
                className={cn(
                  "size-7",
                  n <= values.rating ? "fill-amber-400 text-amber-400" : "text-slate-300",
                )}
                aria-hidden
              />
            </button>
          ))}
        </div>
      </fieldset>
      <div className="space-y-2">
        <Label htmlFor="rec-content">Votre recommandation</Label>
        <textarea
          id="rec-content"
          rows={6}
          value={values.content}
          onChange={(e) => setValues((v) => ({ ...v, content: e.target.value }))}
          className="border-border bg-surface w-full rounded-xl border px-4 py-3 text-sm"
        />
        <p className="text-muted text-xs">{values.content.length}/2000</p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="rec-keywords">Mots-clés (optionnel)</Label>
        <Input
          id="rec-keywords"
          placeholder="Power Platform, Leadership, Communication…"
          value={values.keywords}
          onChange={(e) => setValues((v) => ({ ...v, keywords: e.target.value }))}
        />
        <p className="text-muted text-xs">Séparés par des virgules (8 maximum).</p>
      </div>
      {error && (
        <p role="alert" className="text-danger text-sm">
          {error}
        </p>
      )}
      <Button type="submit" size="lg" className="w-full" disabled={pending}>
        {pending ? "Envoi…" : "Envoyer ma recommandation"}
      </Button>
    </form>
  );
}
