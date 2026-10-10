"use client";

import { useState, useTransition } from "react";
import { Bookmark } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { saveMatchAction, unsaveMatchAction } from "@/app/business/matching/actions";

/** Bookmark toggle: keeps a talent in the organization's saved list, or removes it. */
export function SaveButton({
  username,
  saved,
  jobOfferId,
  match,
  disabled,
  label,
  className,
}: {
  username: string;
  saved: boolean;
  jobOfferId: string | null;
  match: number | null;
  disabled?: boolean;
  /** Visible text next to the icon; icon only when absent. */
  label?: string;
  className?: string;
}) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  return (
    <>
      <button
        type="button"
        disabled={disabled || pending}
        aria-pressed={saved}
        aria-label={saved ? "Retirer des correspondances sauvegardées" : "Sauvegarder ce talent"}
        title={disabled ? "Votre rôle ne permet pas de sauvegarder des talents" : undefined}
        onClick={() =>
          start(async () => {
            const res = saved
              ? await unsaveMatchAction(username)
              : await saveMatchAction(username, jobOfferId, match);
            setError(res.error ?? null);
          })
        }
        className={cn(
          "border-brand/40 text-brand flex items-center justify-center gap-2 rounded-xl border bg-white text-sm font-semibold hover:bg-blue-50 disabled:opacity-50",
          label ? "h-11 px-4" : "size-10",
          className,
        )}
      >
        <Bookmark className={cn("size-4", saved && "fill-current")} aria-hidden />
        {label}
      </button>
      {error && (
        <span role="alert" className="text-danger text-xs">
          {error}
        </span>
      )}
    </>
  );
}
