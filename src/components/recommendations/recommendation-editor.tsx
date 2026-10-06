"use client";

import { createContext, useContext, useState, useTransition } from "react";
import { Check, Copy, Trash2, UserPlus, X } from "lucide-react";
import {
  deleteRecommendationAction,
  moderateRecommendationAction,
  requestRecommendationAction,
} from "@/app/dashboard/recommendations/actions";
import { Button, type ButtonProps } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Modal } from "@/components/ui/modal";
import { requestRecommendationSchema } from "@/schemas/verification";

interface Editor {
  openRequest: () => void;
  /** Runs a row action and shows its error, if any, above the list. */
  act: (fn: () => Promise<{ error?: string }>) => void;
  pending: boolean;
}

const EditorContext = createContext<Editor | null>(null);

function useEditor() {
  const editor = useContext(EditorContext);
  if (!editor) throw new Error("Recommendation controls must be rendered inside <RecommendationEditor>");
  return editor;
}

export function CopyLink({ link }: { link: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="flex items-center gap-2">
      <input
        readOnly
        value={link}
        aria-label="Lien à envoyer"
        onFocus={(e) => e.currentTarget.select()}
        className="border-border h-10 min-w-0 flex-1 rounded-lg border bg-slate-50 px-3 font-mono text-xs"
      />
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(link);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          } catch {
            window.prompt("Copiez ce lien :", link);
          }
        }}
      >
        {copied ? <Check /> : <Copy />} {copied ? "Copié" : "Copier"}
      </Button>
    </div>
  );
}

const EMPTY = { authorName: "", authorEmail: "", talentSkillId: "" };

/** Owns the "request a recommendation" dialog and the per-card actions (publish, decline, delete). */
export function RecommendationEditor({
  skills,
  children,
}: {
  skills: { id: string; name: string }[];
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [values, setValues] = useState(EMPTY);
  const [error, setError] = useState<string>();
  const [created, setCreated] = useState<string>();
  const [rowError, setRowError] = useState<string>();
  const [pending, startTransition] = useTransition();

  function close() {
    setOpen(false);
    setCreated(undefined);
    setError(undefined);
    setValues(EMPTY);
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = requestRecommendationSchema.safeParse(values);
    if (!parsed.success) return setError(parsed.error.issues[0]?.message);
    setError(undefined);
    startTransition(async () => {
      const result = await requestRecommendationAction(values);
      if (result.error) setError(result.error);
      else setCreated(result.link);
    });
  }

  function act(fn: () => Promise<{ error?: string }>) {
    setRowError(undefined);
    startTransition(async () => setRowError((await fn()).error));
  }

  return (
    <EditorContext.Provider value={{ openRequest: () => setOpen(true), act, pending }}>
      {children}
      {rowError && (
        <p role="alert" className="text-danger mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm">
          {rowError}
        </p>
      )}
      <Modal open={open} onClose={close} title="Demander une recommandation">
        {created ? (
          <div className="space-y-4">
            <p className="text-muted text-sm">
              Demande créée. Envoyez ce lien personnel à votre recommandeur : il est valable 30 jours et ne
              peut être utilisé qu&apos;une fois.
            </p>
            <CopyLink link={created} />
            <div className="flex justify-end">
              <Button onClick={close}>Terminer</Button>
            </div>
          </div>
        ) : (
          <form onSubmit={submit} noValidate className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reco-name">Nom du recommandeur</Label>
              <Input
                id="reco-name"
                value={values.authorName}
                onChange={(e) => setValues((v) => ({ ...v, authorName: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reco-email">E-mail (optionnel)</Label>
              <Input
                id="reco-email"
                type="email"
                value={values.authorEmail}
                onChange={(e) => setValues((v) => ({ ...v, authorEmail: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reco-skill">Compétence concernée (optionnel)</Label>
              <select
                id="reco-skill"
                value={values.talentSkillId}
                onChange={(e) => setValues((v) => ({ ...v, talentSkillId: e.target.value }))}
                className="border-border bg-surface h-11 w-full rounded-xl border px-4 text-sm"
              >
                <option value="">Aucune en particulier</option>
                {skills.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
            {error && (
              <p role="alert" className="text-danger text-sm">
                {error}
              </p>
            )}
            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={close}>
                Annuler
              </Button>
              <Button type="submit" disabled={pending}>
                {pending ? "Création…" : "Créer le lien"}
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </EditorContext.Provider>
  );
}

export function RequestRecommendationButton({
  variant,
  className,
}: Pick<ButtonProps, "variant" | "className">) {
  const { openRequest } = useEditor();
  return (
    <Button variant={variant} className={className} onClick={openRequest}>
      <UserPlus /> Demander une recommandation
    </Button>
  );
}

export function RecommendationActions({
  id,
  authorName,
  submitted,
  link,
}: {
  id: string;
  authorName: string;
  /** Waiting for the holder's decision. */
  submitted: boolean;
  /** Link to send to the recommender while the request is open. */
  link: string | null;
}) {
  const { act, pending } = useEditor();
  return (
    <div className="mt-3 space-y-3">
      {link && (
        <div>
          <p className="text-muted mb-1 text-xs">Envoyez ce lien à {authorName} :</p>
          <CopyLink link={link} />
        </div>
      )}
      <div className="flex flex-wrap gap-2">
        {submitted && (
          <>
            <Button
              size="sm"
              disabled={pending}
              onClick={() => act(() => moderateRecommendationAction(id, "APPROVED"))}
            >
              <Check /> Publier
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={pending}
              onClick={() => act(() => moderateRecommendationAction(id, "DECLINED"))}
            >
              <X /> Refuser
            </Button>
          </>
        )}
        <Button
          size="sm"
          variant="ghost"
          disabled={pending}
          aria-label={`Supprimer la demande de ${authorName}`}
          onClick={() => act(() => deleteRecommendationAction(id))}
        >
          <Trash2 /> Supprimer
        </Button>
      </div>
    </div>
  );
}
