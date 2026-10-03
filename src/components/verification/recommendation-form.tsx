"use client";

import { useState, useTransition } from "react";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { submitRecommendationSchema } from "@/schemas/verification";

export function RecommendationForm({ token, holderName }: { token: string; holderName: string }) {
  const [values, setValues] = useState({ content: "", authorTitle: "" });
  const [error, setError] = useState<string>();
  const [done, setDone] = useState(false);
  const [pending, startTransition] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = submitRecommendationSchema.safeParse(values);
    if (!parsed.success) return setError(parsed.error.issues[0]?.message);
    setError(undefined);
    startTransition(async () => {
      try {
        const res = await fetch(`/api/recommend/${token}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(values),
        });
        if (res.ok) return setDone(true);
        const payload = await res.json().catch(() => null);
        setError(payload?.error?.message ?? "L'envoi a échoué. Veuillez réessayer.");
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

  return (
    <form onSubmit={submit} noValidate className="space-y-4">
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
