import Link from "next/link";
import { Crown } from "lucide-react";

/** Upsell card pinned at the bottom of the sidebar. Plans are described on the landing page for now. */
export function ProCard() {
  return (
    <section
      aria-labelledby="pro-card-title"
      className="rounded-2xl border border-white/10 bg-gradient-to-b from-white/10 to-white/5 p-5 text-white"
    >
      <span className="flex size-11 items-center justify-center rounded-xl bg-amber-400/20 text-amber-300 ring-1 ring-amber-300/30">
        <Crown className="size-6" aria-hidden />
      </span>
      <h2 id="pro-card-title" className="mt-4 text-lg font-bold">
        Passer à Pro
      </h2>
      <p className="mt-1.5 text-sm leading-snug text-blue-100/85">
        Débloquez toutes les fonctionnalités et accélérez votre carrière.
      </p>
      <Link
        href="/#tarifs"
        className="text-navy shadow-soft mt-4 flex h-11 w-full items-center justify-center rounded-xl bg-amber-400 text-sm font-bold transition-colors hover:bg-amber-300"
      >
        Voir les offres
      </Link>
    </section>
  );
}
