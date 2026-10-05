import Image from "next/image";
import Link from "next/link";
import { Award, Play } from "lucide-react";
import heroPhoto from "@/assets/skills/hero.jpg";
import { buttonVariants } from "@/components/ui/button";
import { StartAssessmentButton } from "@/components/verification/start-assessment-button";
import type { AssessmentOverview } from "@/services/assessment.service";

/** The primary button opens the most useful assessment: the running one, else the first startable. */
export function AssessmentsHero({ items }: { items: AssessmentOverview[] }) {
  const target =
    items.find((a) => a.activeAttemptId) ??
    items.find((a) => !a.blockedReason && !a.lastAttempt) ??
    items.find((a) => !a.blockedReason);
  return (
    <section
      aria-label="Présentation"
      className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-50 via-blue-100/70 to-blue-200/60 p-6 sm:p-8"
    >
      <div className="relative z-10 max-w-lg">
        <h2 className="text-navy text-2xl leading-tight font-extrabold sm:text-3xl">
          Mesurez aujourd&apos;hui vos compétences de demain.
        </h2>
        <p className="text-navy/80 mt-3 text-sm sm:text-base">
          Passez des évaluations pratiques, obtenez des badges et renforcez votre crédibilité sur le marché.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          {target ? (
            <StartAssessmentButton
              slug={target.slug}
              resume={Boolean(target.activeAttemptId)}
              label="Passer une évaluation"
              size="md"
            />
          ) : (
            <a href="#liste-evaluations" className={buttonVariants()}>
              <Play /> Voir les évaluations
            </a>
          )}
          <Link
            href="/dashboard/certifications"
            className="text-brand border-brand/40 inline-flex h-11 items-center gap-2 rounded-xl border bg-white/70 px-5 text-sm font-semibold hover:bg-white"
          >
            <Award className="size-4" aria-hidden /> Voir mes certifications
          </Link>
        </div>
      </div>
      <div aria-hidden className="absolute inset-y-0 right-0 hidden w-2/5 md:block">
        <Image
          src={heroPhoto}
          alt=""
          fill
          sizes="(min-width: 1280px) 360px, 280px"
          className="[mask-image:linear-gradient(to_right,transparent,black_35%)] object-cover object-top"
        />
      </div>
    </section>
  );
}
