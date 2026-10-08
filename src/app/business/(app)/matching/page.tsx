import type { Metadata } from "next";
import Link from "next/link";
import { BadgeCheck, Check, MapPin, Sparkles, X } from "lucide-react";
import { Pagination } from "@/components/business/pagination";
import { AVAILABILITY_SHORT, TalentAvatar } from "@/components/business/talent-cards";
import { NoAccess, Panel } from "@/components/business/ui";
import { buttonVariants } from "@/components/ui/button";
import { requireBusiness } from "@/lib/business/context";
import { isMatchable, matchTalents, MATCHES_PER_PAGE, PROPOSAL_THRESHOLD } from "@/lib/business/matching";
import { planHasMatching, PLANS } from "@/lib/business/plans";
import { paginate } from "@/lib/project-view";
import { cn } from "@/lib/utils/cn";
import { getTalentDirectoryRepository } from "@/repositories";
import { getJobOfferService } from "@/services/container";

export const metadata: Metadata = { title: "Matching" };
export const dynamic = "force-dynamic";

const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
const DIRECTORY_LIMIT = 500;

export default async function MatchingPage({ searchParams }: PageProps<"/business/matching">) {
  const ctx = await requireBusiness();
  if (!ctx.can("talents.view")) return <NoAccess what="de consulter les talents" />;

  const header = (
    <div>
      <h1 className="text-navy text-2xl font-bold tracking-tight sm:text-3xl">Matching</h1>
      <p className="text-muted mt-1">
        Les talents dont le profil public correspond le mieux aux compétences demandées par vos offres.
      </p>
    </div>
  );

  if (!planHasMatching(ctx.organization.plan)) {
    return (
      <div className="space-y-6">
        {header}
        <Panel className="mx-auto max-w-xl p-8 text-center">
          <Sparkles className="text-brand mx-auto size-8" aria-hidden />
          <h2 className="text-navy mt-3 text-lg font-bold">
            Le matching n&apos;est pas inclus dans votre plan
          </h2>
          <p className="text-muted mt-1 text-sm">
            Le plan {PLANS[ctx.organization.plan].name} donne accès à la recherche de talents. Passez au plan
            Pro ou supérieur pour recevoir des talents proposés pour chaque offre.
          </p>
          <Link
            href="/business/abonnements"
            className={cn(buttonVariants(), "bg-orange mt-5 h-11 px-6 hover:bg-orange-600")}
          >
            Voir les abonnements
          </Link>
        </Panel>
      </div>
    );
  }

  const raw = await searchParams;
  const offers = (await getJobOfferService().list(ctx.organization.id)).filter(isMatchable);
  const selected = offers.find((o) => o.id === first(raw.offre)) ?? offers.find((o) => o.skills.length > 0);

  const records = selected ? await getTalentDirectoryRepository().listPublic(DIRECTORY_LIMIT) : [];
  const matches = selected ? matchTalents(selected, records) : [];
  const { page, pages, items } = paginate(matches, Number(first(raw.page)), MATCHES_PER_PAGE);

  const hrefFor = (offre: string, n = 1) => `/business/matching?offre=${offre}${n > 1 ? `&page=${n}` : ""}`;

  return (
    <div className="space-y-6">
      {header}

      {offers.length === 0 ? (
        <Panel className="p-8 text-center">
          <p className="text-navy font-semibold">Aucune offre à analyser.</p>
          <p className="text-muted mt-1 text-sm">
            Créez une offre avec ses compétences requises pour voir les talents correspondants.
          </p>
          {ctx.can("jobs.create") && (
            <Link
              href="/business/offres/nouvelle"
              className={cn(buttonVariants(), "bg-orange mt-5 h-11 px-6 hover:bg-orange-600")}
            >
              Publier une offre
            </Link>
          )}
        </Panel>
      ) : (
        <div className="grid items-start gap-6 xl:grid-cols-[300px_minmax(0,1fr)]">
          <Panel className="p-3">
            <h2 className="text-navy px-2 pt-1 pb-2 text-sm font-bold">Vos offres</h2>
            <ul className="space-y-1">
              {offers.map((o) => (
                <li key={o.id}>
                  <Link
                    href={hrefFor(o.id)}
                    aria-current={o.id === selected?.id ? "page" : undefined}
                    className={cn(
                      "block rounded-xl px-3 py-2.5 text-sm",
                      o.id === selected?.id
                        ? "text-brand bg-blue-50 font-semibold"
                        : "text-navy hover:bg-slate-50",
                    )}
                  >
                    <span className="block truncate">{o.title}</span>
                    <span className="text-muted block text-xs font-normal">
                      {o.skills.length} compétence{o.skills.length > 1 ? "s" : ""} requise
                      {o.skills.length > 1 ? "s" : ""}
                      {o.displayStatus === "DRAFT" ? " · brouillon" : ""}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </Panel>

          <div className="min-w-0 space-y-4">
            {!selected || selected.skills.length === 0 ? (
              <Panel className="p-8 text-center">
                <p className="text-navy font-semibold">Cette offre n&apos;a pas de compétences requises.</p>
                <p className="text-muted mt-1 text-sm">
                  Ajoutez-en pour que SkillPass puisse proposer des talents.
                </p>
              </Panel>
            ) : (
              <>
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h2 className="text-navy font-bold">
                    {matches.length.toLocaleString("fr-FR")} talent{matches.length > 1 ? "s" : ""} proposé
                    {matches.length > 1 ? "s" : ""} pour « {selected.title} »
                  </h2>
                  <p className="text-muted text-xs">
                    Correspondance d&apos;au moins {PROPOSAL_THRESHOLD} % : compétences, certifications,
                    expérience, lieu, disponibilité.
                  </p>
                </div>
                {items.length === 0 ? (
                  <Panel className="p-8 text-center">
                    <p className="text-navy font-semibold">
                      Aucun talent ne correspond encore à cette offre.
                    </p>
                    <p className="text-muted mt-1 text-sm">
                      Réduisez les compétences exigées ou revenez quand de nouveaux profils seront publics.
                    </p>
                  </Panel>
                ) : (
                  <ul className="space-y-3">
                    {items.map((m) => {
                      const t = m.record;
                      const availability = AVAILABILITY_SHORT[t.availability];
                      return (
                        <li key={t.id}>
                          <article className="border-border/70 shadow-soft flex flex-wrap items-start gap-4 rounded-2xl border bg-white p-4 sm:flex-nowrap">
                            <TalentAvatar name={t.fullName} />
                            <div className="min-w-0 flex-1">
                              <h3 className="text-navy flex items-center gap-1.5 text-lg font-bold">
                                <span className="truncate">{t.fullName}</span>
                                {t.skills.some((s) => s.verified) && (
                                  <BadgeCheck
                                    className="text-brand size-5 shrink-0"
                                    aria-label="Compétences vérifiées"
                                  />
                                )}
                              </h3>
                              <p className="text-navy/85 truncate text-sm">
                                {t.profession ?? t.headline ?? "—"}
                              </p>
                              <p className="text-muted mt-1 flex flex-wrap gap-x-4 text-sm">
                                {t.location && (
                                  <span className="flex items-center gap-1">
                                    <MapPin className="size-3.5" aria-hidden /> {t.location.split(",")[0]}
                                  </span>
                                )}
                                <span className="flex items-center gap-1.5">
                                  <span
                                    className={cn("size-2 rounded-full", availability.tone)}
                                    aria-hidden
                                  />
                                  {availability.label}
                                </span>
                              </p>
                              <ul className="mt-2 flex flex-wrap gap-1.5">
                                {m.matchedSkills.map((s) => (
                                  <li
                                    key={s}
                                    className="flex items-center gap-1 rounded-md bg-green-50 px-2.5 py-1 text-xs font-medium text-green-700"
                                  >
                                    <Check className="size-3" aria-hidden /> {s}
                                  </li>
                                ))}
                                {m.missingSkills.map((s) => (
                                  <li
                                    key={s}
                                    className="flex items-center gap-1 rounded-md bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-500"
                                  >
                                    <X className="size-3" aria-hidden /> {s}
                                  </li>
                                ))}
                              </ul>
                              {m.reasons.length > 0 && (
                                <p className="text-muted mt-2 text-xs">{m.reasons.join(" · ")}</p>
                              )}
                            </div>
                            <div className="flex w-full shrink-0 items-center justify-between gap-4 sm:w-auto sm:flex-col sm:items-end">
                              <p className="text-center">
                                <span className="text-brand block text-2xl leading-none font-bold">
                                  {m.score}%
                                </span>
                                <span className="text-muted text-xs">Match</span>
                              </p>
                              <Link
                                href={`/business/talents?profil=${encodeURIComponent(t.username)}`}
                                className="border-brand/40 text-brand flex h-10 items-center rounded-xl border bg-white px-4 text-sm font-semibold hover:bg-blue-50"
                              >
                                Voir profil →
                              </Link>
                            </div>
                          </article>
                        </li>
                      );
                    })}
                  </ul>
                )}
                <Pagination
                  page={page}
                  pages={pages}
                  total={matches.length}
                  size={MATCHES_PER_PAGE}
                  noun="talents"
                  hrefFor={(n) => hrefFor(selected.id, n)}
                />
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
