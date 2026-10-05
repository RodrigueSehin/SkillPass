import Link from "next/link";
import { Target } from "lucide-react";

/**
 * The mockup lists job offers with a match score. Offers come with SkillPass Business (companies
 * publish them), so until then this card says so instead of showing invented jobs.
 */
export function OpportunitiesTeaser() {
  return (
    <section
      aria-labelledby="opportunities-title"
      className="border-border/60 shadow-soft rounded-2xl border bg-white p-6"
    >
      <div className="flex items-center justify-between gap-4">
        <h2 id="opportunities-title" className="text-navy text-lg font-bold">
          Opportunités d&apos;emploi
        </h2>
        <Link href="/dashboard/opportunities" className="text-brand text-sm font-semibold hover:underline">
          Voir toutes
        </Link>
      </div>
      <div className="mt-4 flex flex-col items-center rounded-xl bg-blue-50/60 px-6 py-8 text-center">
        <span className="text-brand shadow-soft flex size-12 items-center justify-center rounded-2xl bg-white">
          <Target className="size-6" aria-hidden />
        </span>
        <p className="text-navy mt-4 text-sm font-semibold">Le matching arrive bientôt</p>
        <p className="text-muted mt-1 max-w-xs text-xs leading-relaxed">
          Dès que des entreprises publient leurs offres, vous verrez ici celles qui correspondent à vos
          compétences vérifiées, avec votre score d&apos;adéquation.
        </p>
      </div>
    </section>
  );
}
