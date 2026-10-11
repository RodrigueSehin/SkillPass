"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { requestReviewAction, saveVerificationNoteAction } from "@/app/business/verification/actions";
import { Button } from "@/components/ui/button";

/** The company's message to the administrator, and the request for a new review after a refusal. */
export function VerificationForm({
  initialNote,
  rejected,
  canEdit,
}: {
  initialNote: string;
  rejected: boolean;
  canEdit: boolean;
}) {
  const router = useRouter();
  const [note, setNote] = useState(initialNote);
  const [message, setMessage] = useState<{ ok: boolean; text: string }>();
  const [pending, startTransition] = useTransition();

  function run(action: () => Promise<{ error?: string }>, success: string, refresh = false) {
    setMessage(undefined);
    startTransition(async () => {
      const result = await action();
      if (result.error) setMessage({ ok: false, text: result.error });
      else {
        setMessage({ ok: true, text: success });
        if (refresh) router.refresh();
      }
    });
  }

  return (
    <div className="mt-6 space-y-3">
      <label htmlFor="verification-note" className="text-navy block text-sm font-semibold">
        Informations pour l&apos;équipe SkillPass
      </label>
      <textarea
        id="verification-note"
        rows={4}
        maxLength={1000}
        value={note}
        disabled={!canEdit}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Numéro d'immatriculation (RCCM, SIRET…), site officiel, rôle de la personne qui crée le compte…"
        className="border-border focus-visible:ring-brand/40 w-full rounded-xl border bg-white px-4 py-3 text-sm outline-none focus-visible:ring-2 disabled:opacity-60"
      />
      {message && (
        <p
          role={message.ok ? "status" : "alert"}
          className={
            message.ok
              ? "text-success rounded-lg bg-green-50 px-3 py-2 text-sm"
              : "text-danger rounded-lg bg-red-50 px-3 py-2 text-sm"
          }
        >
          {message.text}
        </p>
      )}
      {canEdit ? (
        <div className="flex flex-wrap gap-3">
          <Button
            type="button"
            disabled={pending}
            onClick={() => run(() => saveVerificationNoteAction(note), "Informations enregistrées.")}
          >
            Enregistrer
          </Button>
          {rejected && (
            <Button
              type="button"
              variant="outline"
              disabled={pending}
              onClick={() => run(() => requestReviewAction(), "Nouvelle demande envoyée.", true)}
            >
              Demander un nouvel examen
            </Button>
          )}
        </div>
      ) : (
        <p className="text-muted text-xs">
          Seul un administrateur de l&apos;organisation peut modifier ces informations.
        </p>
      )}
    </div>
  );
}
