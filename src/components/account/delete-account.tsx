"use client";

import { useState, useTransition } from "react";
import { Trash2 } from "lucide-react";
import { deleteAccountAction } from "@/app/dashboard/settings/actions";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";

const field =
  "border-border focus-visible:ring-danger/40 h-11 w-full rounded-xl border bg-white px-3 text-sm outline-none focus-visible:ring-2";

/** The last line of defence: retype the e-mail address and the password before anything is erased. */
export function DeleteAccount({ email, needsPassword }: { email: string; needsPassword: boolean }) {
  const [open, setOpen] = useState(false);
  const [confirmation, setConfirmation] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();

  const ready =
    confirmation.trim().toLowerCase() === email.toLowerCase() && (!needsPassword || password.length > 0);

  function close() {
    if (pending) return;
    setOpen(false);
    setConfirmation("");
    setPassword("");
    setError(undefined);
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(undefined);
    startTransition(async () => {
      // On success the action redirects to the home page; only a refusal comes back here.
      const result = await deleteAccountAction({ confirmation, password });
      if (result?.error) setError(result.error);
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="border-danger text-danger flex h-11 items-center gap-2 rounded-xl border bg-white px-5 text-sm font-semibold hover:bg-red-50"
      >
        <Trash2 className="size-4" aria-hidden /> Supprimer mon compte
      </button>
      <Modal open={open} onClose={close} title="Supprimer définitivement mon compte ?">
        <form onSubmit={submit} className="space-y-4">
          <p className="text-muted text-sm">
            Tout sera effacé, sans retour possible : profil, compétences, projets, expériences,
            certifications, preuves et fichiers. Si vous faites partie d&apos;une organisation, vous la
            quittez.
          </p>
          <div>
            <label htmlFor="delete-email" className="text-navy mb-1 block text-sm font-semibold">
              Pour confirmer, saisissez votre adresse e-mail ({email})
            </label>
            <input
              id="delete-email"
              type="email"
              autoComplete="off"
              value={confirmation}
              onChange={(e) => setConfirmation(e.target.value)}
              className={field}
            />
          </div>
          {needsPassword && (
            <div>
              <label htmlFor="delete-password" className="text-navy mb-1 block text-sm font-semibold">
                Mot de passe
              </label>
              <input
                id="delete-password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={field}
              />
            </div>
          )}
          {error && (
            <p role="alert" className="text-danger rounded-lg bg-red-50 px-3 py-2 text-sm">
              {error}
            </p>
          )}
          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={close} disabled={pending}>
              Annuler
            </Button>
            <Button type="submit" className="bg-danger hover:bg-red-700" disabled={!ready || pending}>
              {pending ? "Suppression…" : "Supprimer définitivement"}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
