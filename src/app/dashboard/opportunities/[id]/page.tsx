import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowRight,
  BadgeCheck,
  Briefcase,
  ChevronLeft,
  ChevronRight,
  Clock,
  Eye,
  Laptop,
  Lightbulb,
  MapPin,
  Users,
} from "lucide-react";
import { CompanyLogo } from "@/components/opportunities/company-logo";
import {
  ApplyBar,
  DetailProvider,
  DetailTabs,
  SaveButton,
  ShareButton,
} from "@/components/opportunities/offer-detail-client";
import {
  AboutCompanyCard,
  CompanyPanel,
  OverviewPanel,
  PerksPanel,
  ProcessPanel,
  ProfilePanel,
  RolePanel,
  type DetailView,
} from "@/components/opportunities/offer-detail-sections";
import { requireUser } from "@/lib/auth/current-user";
import { NotFoundError } from "@/lib/errors";
import {
  longDate,
  matchLabel,
  matchScore,
  neighbours,
  relativeDate,
  similarOffers,
} from "@/lib/opportunity-view";
import { getOpportunityService, getSkillService } from "@/services/container";
import { WORK_MODE_SHORT_LABELS, type OpportunityDTO } from "@/types/opportunity";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: PageProps<"/dashboard/opportunities/[id]">): Promise<Metadata> {
  const { id } = await params;
  try {
    const offer = await getOpportunityService().get(id);
    return { title: `${offer.title} · ${offer.companyLabel ?? offer.company}` };
  } catch {
    return { title: "Opportunité" };
  }
}

const firstPart = (location: string) => location.split(",")[0]?.split("/")[0]?.trim() ?? location;

export default async function OpportunityPage({ params }: PageProps<"/dashboard/opportunities/[id]">) {
  const user = await requireUser();
  const { id } = await params;
  const service = getOpportunityService();

  // Count the visit first so the figure on the page includes it.
  await service.trackView(id);
  let offer: OpportunityDTO;
  try {
    offer = await service.get(id);
  } catch (err) {
    if (err instanceof NotFoundError) notFound();
    throw err;
  }

  const [all, savedIds, appliedIds, skills] = await Promise.all([
    service.list(),
    service.savedIds(user.id),
    service.appliedIds(user.id),
    getSkillService().list(user.id),
  ]);
  const now = new Date();
  const mine = new Set(skills.items.map((s) => s.name.toLowerCase()));
  const match = matchScore(offer, mine);
  const similar = similarOffers(all, offer);
  const { previous, next } = neighbours(all, offer.id);
  const companyName = offer.companyLabel ?? offer.company;

  const view: DetailView = {
    id: offer.id,
    title: offer.title,
    company: offer.company,
    companyName,
    legalName: offer.companyLegalName ?? offer.company,
    verified: offer.companyVerified,
    tagline: offer.companyTagline,
    location: offer.location,
    workMode:
      offer.workMode && offer.workMode !== "REMOTE" ? (WORK_MODE_SHORT_LABELS[offer.workMode] ?? null) : null,
    workModeDetail: offer.workModeDetail,
    commitment: offer.commitment,
    published: relativeDate(offer.publishedAt, now),
    publishedDate: longDate(offer.publishedAt),
    deadlineDate: offer.deadline ? longDate(offer.deadline) : null,
    experienceRange: offer.experienceRange,
    salary: offer.salary,
    domain: offer.domain,
    description: offer.description,
    missions: offer.missions,
    requirements: offer.requirements,
    perks: offer.perks,
    process: offer.process,
    skills: offer.skills.map((name) => ({ name, owned: mine.has(name.toLowerCase()) })),
    companySector: offer.companySector,
    companySize: offer.companySize,
    companyAbout: offer.companyAbout,
    companyWebsite: offer.companyWebsite,
    views: offer.views,
    applicants: offer.applicants,
    match,
  };

  const navButton =
    "border-border/60 text-brand flex h-9 items-center gap-1.5 rounded-lg border bg-blue-50/60 px-4 text-sm font-medium hover:bg-blue-50";

  return (
    <DetailProvider
      offerId={offer.id}
      offerTitle={offer.title}
      companyName={companyName}
      initialSaved={savedIds}
      initiallyApplied={appliedIds.includes(offer.id)}
    >
      <div className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <nav aria-label="Fil d'Ariane" className="text-muted flex flex-wrap items-center gap-1.5 text-xs">
            <Link href="/dashboard" className="hover:text-brand">
              Accueil
            </Link>
            <ChevronRight className="size-3" aria-hidden />
            <Link href="/dashboard/opportunities" className="hover:text-brand">
              Opportunités
            </Link>
            <ChevronRight className="size-3" aria-hidden />
            <span aria-current="page">{offer.title}</span>
          </nav>
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/dashboard/opportunities"
              className="text-brand flex items-center gap-1.5 text-sm font-medium hover:underline"
            >
              <ArrowRight className="size-4 rotate-180" aria-hidden /> Retour aux résultats
            </Link>
            {previous ? (
              <Link href={`/dashboard/opportunities/${previous.id}`} className={navButton}>
                <ChevronLeft className="size-4" aria-hidden /> Précédente
              </Link>
            ) : (
              <span aria-disabled className={`${navButton} opacity-40`}>
                <ChevronLeft className="size-4" aria-hidden /> Précédente
              </span>
            )}
            {next ? (
              <Link href={`/dashboard/opportunities/${next.id}`} className={navButton}>
                Suivante <ChevronRight className="size-4" aria-hidden />
              </Link>
            ) : (
              <span aria-disabled className={`${navButton} opacity-40`}>
                Suivante <ChevronRight className="size-4" aria-hidden />
              </span>
            )}
          </div>
        </div>

        <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
          <div className="min-w-0 space-y-5">
            <header className="from-navy relative overflow-hidden rounded-2xl bg-gradient-to-br via-[#0B2A6B] to-[#0F3F96] p-6 text-white sm:p-8">
              {/* Decorative skyline, purely visual. */}
              <svg
                aria-hidden
                viewBox="0 0 400 200"
                preserveAspectRatio="xMaxYMax slice"
                className="absolute inset-y-0 right-0 h-full w-3/5 text-white/10"
                fill="currentColor"
              >
                <rect x="40" y="70" width="70" height="130" />
                <rect x="120" y="30" width="90" height="170" />
                <rect x="220" y="90" width="60" height="110" />
                <rect x="290" y="50" width="80" height="150" />
              </svg>
              <div className="relative flex flex-wrap items-start gap-6">
                <span className="flex size-24 shrink-0 items-center justify-center rounded-2xl bg-white sm:size-28">
                  <CompanyLogo company={offer.company} className="size-20 [&>span]:scale-125" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="min-w-0">
                      <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{offer.title}</h1>
                      <p className="mt-2 flex items-center gap-2 text-lg">
                        {offer.company === view.legalName
                          ? view.legalName
                          : `${offer.company} - ${view.legalName}`}
                        {view.verified && (
                          <BadgeCheck
                            className="size-5 fill-blue-500 text-white"
                            aria-label="Entreprise vérifiée"
                          />
                        )}
                      </p>
                    </div>
                    <div className="flex gap-3">
                      <ShareButton />
                      <SaveButton id={offer.id} title={offer.title} variant="hero" />
                    </div>
                  </div>
                  <ul className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
                    <li className="flex items-center gap-2">
                      <MapPin className="size-4" aria-hidden /> {offer.location}
                    </li>
                    {view.workMode && (
                      <li className="flex items-center gap-2">
                        <Laptop className="size-4" aria-hidden /> {view.workMode}
                      </li>
                    )}
                    {offer.commitment && (
                      <li className="flex items-center gap-2">
                        <Briefcase className="size-4" aria-hidden /> {offer.commitment}
                      </li>
                    )}
                  </ul>
                  <ul className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-white/85">
                    <li className="flex items-center gap-1.5">
                      <Clock className="size-3.5" aria-hidden /> Publié {view.published}
                    </li>
                    <li className="flex items-center gap-1.5">
                      <Eye className="size-3.5" aria-hidden /> {offer.views} vues
                    </li>
                    <li className="flex items-center gap-1.5">
                      <Users className="size-3.5" aria-hidden /> {offer.applicants} candidature
                      {offer.applicants > 1 ? "s" : ""}
                    </li>
                  </ul>
                </div>
              </div>
              {view.tagline && (
                <p className="relative mt-4 ml-auto max-w-56 text-right text-sm leading-snug whitespace-pre-line text-white/90 sm:absolute sm:right-8 sm:bottom-6 sm:mt-0">
                  {view.tagline}
                </p>
              )}
            </header>

            <div className="border-border/60 shadow-soft rounded-2xl border bg-white px-5 pb-6 sm:px-6">
              <DetailTabs
                panels={{
                  overview: <OverviewPanel offer={view} />,
                  company: <CompanyPanel offer={view} />,
                  role: <RolePanel offer={view} />,
                  profile: <ProfilePanel offer={view} />,
                  perks: <PerksPanel offer={view} />,
                  process: <ProcessPanel offer={view} />,
                }}
              />
            </div>

            <ApplyBar offerId={offer.id} title={offer.title} applyUrl={offer.applyUrl} />
          </div>

          <aside className="grid min-w-0 gap-6 md:grid-cols-2 xl:grid-cols-1">
            <AboutCompanyCard offer={view} />

            <section
              aria-labelledby="similar-title"
              className="border-border/60 shadow-soft rounded-2xl border bg-white p-5"
            >
              <div className="flex items-center justify-between gap-2">
                <h2 id="similar-title" className="text-navy font-bold">
                  Autres offres similaires
                </h2>
                <Link
                  href={`/dashboard/opportunities?domain=${encodeURIComponent(offer.domain)}`}
                  className="text-brand flex items-center gap-1 text-xs font-semibold hover:underline"
                >
                  Voir tout <ArrowRight className="size-3.5" aria-hidden />
                </Link>
              </div>
              {similar.length === 0 ? (
                <p className="text-muted mt-3 text-sm">Aucune offre similaire pour le moment.</p>
              ) : (
                <ul className="mt-3 divide-y divide-slate-100">
                  {similar.map((s) => (
                    <li key={s.id} className="flex items-start gap-3 py-3">
                      <Link href={`/dashboard/opportunities/${s.id}`} className="shrink-0">
                        <CompanyLogo company={s.company} className="size-12 [&>span]:scale-90" />
                      </Link>
                      <div className="min-w-0 flex-1 text-sm">
                        <Link
                          href={`/dashboard/opportunities/${s.id}`}
                          className="text-navy hover:text-brand block leading-snug font-semibold"
                        >
                          {s.title}
                        </Link>
                        <p className="text-muted text-xs">{s.companyLabel ?? s.company}</p>
                        <p className="text-muted mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px]">
                          <span className="flex items-center gap-1">
                            <MapPin className="size-3" aria-hidden /> {firstPart(s.location)}
                          </span>
                          {s.commitment && (
                            <span className="flex items-center gap-1">
                              <Briefcase className="size-3" aria-hidden /> {s.commitment.split(" (")[0]}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Clock className="size-3" aria-hidden /> {relativeDate(s.publishedAt, now)}
                          </span>
                        </p>
                      </div>
                      <SaveButton id={s.id} title={s.title} variant="plain" />
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="border-border/60 shadow-soft rounded-2xl bg-amber-50/60 p-5 md:col-span-2 xl:col-span-1">
              <div className="flex items-start gap-3">
                <Lightbulb className="size-8 shrink-0 text-amber-500" aria-hidden />
                <div className="min-w-0 flex-1">
                  <h2 className="text-navy text-sm leading-snug font-bold">
                    {match >= 50
                      ? "Cette offre correspond à vos compétences !"
                      : "Cette offre demande des compétences à renforcer."}
                  </h2>
                  <p className="text-muted mt-1.5 text-xs leading-relaxed">
                    Votre profil correspond à {match}% des compétences recherchées par l&apos;entreprise.
                  </p>
                </div>
                <MatchRing percent={match} label={matchLabel(match)} />
              </div>
              <Link
                href="/dashboard/skills"
                className="text-brand border-brand/40 mt-4 flex h-10 items-center justify-center gap-2 rounded-xl border bg-white text-sm font-semibold hover:bg-blue-50"
              >
                Voir mon adéquation <ArrowRight className="size-4" aria-hidden />
              </Link>
            </section>
          </aside>
        </div>
      </div>
    </DetailProvider>
  );
}

function MatchRing({ percent, label }: { percent: number; label: string }) {
  const size = 72;
  const stroke = 8;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const filled = (percent / 100) * c;
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        role="img"
        aria-label={`${percent} % : ${label}`}
      >
        <g
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
        >
          <circle cx={size / 2} cy={size / 2} r={r} stroke="#E2E8F0" />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            stroke="#16A34A"
            strokeDasharray={`${filled} ${c - filled}`}
          />
        </g>
      </svg>
      <span className="text-navy absolute inset-0 flex items-center justify-center text-lg font-extrabold">
        {percent}
        <span className="text-[10px]">%</span>
      </span>
    </div>
  );
}
