import Link from "next/link";
import { Crown } from "lucide-react";

/** Upsell card pinned at the bottom of the sidebar. Only shown on the Free plan. */
export function ProCard() {
  return (
    <section
      aria-labelledby="pro-card-title"
      className="rounded-xl border border-white/10 bg-gradient-to-b from-white/10 to-white/5 p-3.5 text-white"
    >
      <div className="flex items-center gap-2.5">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-amber-400/20 text-amber-300 ring-1 ring-amber-300/30">
          <Crown className="size-4" aria-hidden />
        </span>
        <h2 id="pro-card-title" className="text-sm font-bold">
          Passer à Pro
        </h2>
      </div>
      <p className="mt-2 text-xs leading-snug text-blue-100/85">
        Débloquez toutes les fonctionnalités et accélérez votre carrière.
      </p>
      <Link
        href="/dashboard/settings?tab=plan"
        className="text-navy shadow-soft mt-3 flex h-9 w-full items-center justify-center rounded-lg bg-amber-400 text-xs font-bold transition-colors hover:bg-amber-300"
      >
        Voir mon plan
      </Link>
    </section>
  );
}
