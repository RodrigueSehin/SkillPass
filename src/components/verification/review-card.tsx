"use client";

import { useState, useTransition } from "react";
import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { reviewAttemptAction } from "@/app/admin/verifications/actions";

interface ReviewCardProps {
  attemptId: string;
  holderName: string;
  title: string;
  score: number;
  domains: { label: string; score: number }[];
  submittedAt: string | null;
}

export function ReviewCard({ attemptId, holderName, title, score, domains, submittedAt }: ReviewCardProps) {
  const [note, setNote] = useState("");
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();

  function decide(decision: "approve" | "reject") {
    setError(undefined);
    startTransition(async () => {
      const result = await reviewAttemptAction(attemptId, { decision, note });
      if (result.error) setError(result.error);
    });
  }

  return (
    <Card className="p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-semibold">{title}</h2>
          <p className="text-muted text-sm">
            {holderName}
            {submittedAt && ` · soumis le ${new Date(submittedAt).toLocaleDateString("fr-FR")}`}
          </p>
        </div>
        <p className="text-navy text-2xl font-bold">{score}%</p>
      </div>
      <ul className="text-muted mt-3 flex flex-wrap gap-x-6 gap-y-1 text-sm">
        {domains.map((d) => (
          <li key={d.label}>
            {d.label} : <span className="text-foreground font-semibold">{d.score}%</span>
          </li>
        ))}
      </ul>
      <div className="mt-4 space-y-2">
        <Label htmlFor={`note-${attemptId}`}>Note pour le candidat (optionnel)</Label>
        <textarea
          id={`note-${attemptId}`}
          rows={2}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className="border-border bg-surface w-full rounded-xl border px-4 py-3 text-sm"
        />
      </div>
      {error && (
        <p role="alert" className="text-danger mt-3 text-sm">
          {error}
        </p>
      )}
      <div className="mt-4 flex gap-2">
        <Button disabled={pending} onClick={() => decide("approve")}>
          <Check /> Valider et délivrer le badge
        </Button>
        <Button variant="outline" disabled={pending} onClick={() => decide("reject")}>
          <X /> Refuser
        </Button>
      </div>
    </Card>
  );
}
