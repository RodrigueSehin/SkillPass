"use client";

import { useState } from "react";
import { Check, Share2 } from "lucide-react";
import { cn } from "@/lib/utils/cn";

/** Copies the talent's public profile link. */
export function CopyLink({ path, className }: { path: string; className?: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(`${window.location.origin}${path}`);
          setDone(true);
          setTimeout(() => setDone(false), 2000);
        } catch {
          window.prompt("Copiez ce lien", `${window.location.origin}${path}`);
        }
      }}
      className={cn(
        "border-brand/40 text-brand flex h-11 items-center justify-center gap-2 rounded-xl border bg-white px-4 text-sm font-semibold hover:bg-blue-50",
        className,
      )}
    >
      {done ? <Check className="size-4" aria-hidden /> : <Share2 className="size-4" aria-hidden />}
      {done ? "Lien copié" : "Partager le profil"}
    </button>
  );
}
