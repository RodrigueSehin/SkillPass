"use client";

import { createContext, useContext, useState, useTransition } from "react";
import Link from "next/link";
import { Check, Copy, Trash2, UserPlus, X } from "lucide-react";
import {
  deleteRecommendationAction,
  moderateRecommendationAction,
} from "@/app/dashboard/recommendations/actions";
import { Button, buttonVariants, type ButtonProps } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";

interface Editor {
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

function CopyLink({ link }: { link: string }) {
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

/** Owns the per-card actions (publish, decline, delete) and shows their errors. */
export function RecommendationEditor({ children }: { children: React.ReactNode }) {
  const [rowError, setRowError] = useState<string>();
  const [pending, startTransition] = useTransition();

  function act(fn: () => Promise<{ error?: string }>) {
    setRowError(undefined);
    startTransition(async () => setRowError((await fn()).error));
  }

  return (
    <EditorContext.Provider value={{ act, pending }}>
      {children}
      {rowError && (
        <p role="alert" className="text-danger mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm">
          {rowError}
        </p>
      )}
    </EditorContext.Provider>
  );
}

/** Asking happens on its own page (contact, message, aspects, preview). */
export function RequestRecommendationButton({
  variant,
  className,
}: Pick<ButtonProps, "variant" | "className">) {
  return (
    <Link href="/dashboard/recommendations/new" className={cn(buttonVariants({ variant }), className)}>
      <UserPlus /> Demander une recommandation
    </Link>
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
