import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronLeft, ChevronRight, Quote, ShieldCheck } from "lucide-react";
import heroPhoto from "@/assets/skills/hero.jpg";
import { OpportunityCard } from "@/components/opportunities/opportunity-card";
import {
  OpportunityFilters,
  OpportunitySort,
  OpportunityTabs,
  SearchOpportunitiesButton,
} from "@/components/opportunities/opportunity-controls";
import {
  CreateAlertButton,
  OpportunityProvider,
  type AlertView,
  type OfferView,
} from "@/components/opportunities/opportunity-editor";
import {
  CareerTips,
  JobAlertsCard,
  NextStepPromo,
  ProfileMatch,
  RecruitingCompanies,
} from "@/components/opportunities/opportunity-side";
import { EmptyState } from "@/components/ui/empty-state";
import { requireUser } from "@/lib/auth/current-user";
import { parseList } from "@/lib/experience-view";
import {
  alertFilters,
  alertHref,
  COMPANIES_SHOWN,
  companyRanking,
  filterOpportunities,
  matchScore,
  OPPORTUNITIES_PER_PAGE,
  relativeDate,
  selectionMatch,
} from "@/lib/opportunity-view";
import { countBy, paginate } from "@/lib/project-view";
import { cn } from "@/lib/utils/cn";
import { getOpportunityService, getSkillService } from "@/services/container";
import {
  OPPORTUNITY_KINDS,
  OPPORTUNITY_KIND_LABELS,
  OPPORTUNITY_LEVELS,
  OPPORTUNITY_LEVEL_LABELS,
  OPPORTUNITY_REGIONS,
  OPPORTUNITY_REGION_LABELS,
  WORK_MODE_SHORT_LABELS,
  type OpportunityDTO,
} from "@/types/opportunity";

export const metadata: Metadata = { title: "Opportunités" };
export const dynamic = "force-dynamic";

const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
const DOMAINS = ["Tech & Digital", "Gestion & Business", "Data & IA", "Cloud & Infrastructure", "Autres"];

export default async function OpportunitiesPage({ searchParams }: PageProps<"/dashboard/opportunities">) {
  const user = await requireUser();
  const raw = await searchParams;
  // Links copied before offers had their own page still work.
  const legacyOffer = first(raw.offer);
  if (legacyOffer) redirect(`/dashboard/opportunities/${encodeURIComponent(legacyOffer)}`);
  const service = getOpportunityService();
  const [all, savedIds, alerts, skills] = await Promise.all([
    service.list(),
    service.savedIds(user.id),
    service.listAlerts(user.id),
    getSkillService().list(user.id),
  ]);
  const now = new Date();
  const mine = new Set(skills.items.map((s) => s.name.toLowerCase()));

  const filters = {
    q: first(raw.q),
    tab: first(raw.tab),
    kind: parseList(raw.kind),
    region: parseList(raw.region),
    domain: parseList(raw.domain),
    level: parseList(raw.level),
    company: first(raw.company),
    sort: first(raw.sort),
  };
  const filtered = filterOpportunities(all, filters, mine);
  const { page, pages, items: shown } = paginate(filtered, Number(first(raw.page)), OPPORTUNITIES_PER_PAGE);
  const list = first(raw.view) === "list";

  const view = (o: OpportunityDTO): OfferView => ({
    id: o.id,
    title: o.title,
    company: o.company,
    companyName: o.companyLabel ?? o.company,
    badge:
      o.kind === "EMPLOI" && o.workMode === "REMOTE"
        ? "Remote"
        : ((OPPORTUNITY_KIND_LABELS as Record<string, string>)[o.kind] ?? o.kind),
    location: o.location,
    workMode: o.workMode && o.workMode !== "REMOTE" ? (WORK_MODE_SHORT_LABELS[o.workMode] ?? null) : null,
    commitment: o.commitment,
    domain: o.domain,
    levelLabel: (OPPORTUNITY_LEVEL_LABELS as Record<string, string>)[o.level] ?? o.level,
    skills: o.skills.map((name) => ({ name, owned: mine.has(name.toLowerCase()) })),
    description: o.description,
    applyUrl: o.applyUrl,
    published: relativeDate(o.publishedAt, now),
    match: matchScore(o, mine),
  });

  const count = (pick: (o: OpportunityDTO) => string) =>
    new Map(countBy(all.map(pick)).map((c) => [c.name, c.count]));
  const kindCounts = count((o) => o.kind);
  const regionCounts = count((o) => o.region);
  const domainCounts = count((o) => o.domain);
  const levelCounts = count((o) => o.level);
  const facets = {
    kinds: OPPORTUNITY_KINDS.map((k) => ({
      value: k,
      label: OPPORTUNITY_KIND_LABELS[k],
      count: kindCounts.get(k) ?? 0,
    })),
    regions: OPPORTUNITY_REGIONS.map((r) => ({
      value: r,
      label: OPPORTUNITY_REGION_LABELS[r],
      count: regionCounts.get(r) ?? 0,
    })),
    domains: DOMAINS.map((d) => ({ value: d, label: d, count: domainCounts.get(d) ?? 0 })),
    levels: OPPORTUNITY_LEVELS.map((l) => ({
      value: l,
      label: OPPORTUNITY_LEVEL_LABELS[l],
      count: levelCounts.get(l) ?? 0,
    })),
  };

  const ranking = companyRanking(all);
  const showAllCompanies = first(raw.companies) === "all";

  const alertViews: AlertView[] = alerts.map((a) => ({
    id: a.id,
    name: a.name,
    count: filterOpportunities(all, alertFilters(a)).length,
    href: alertHref(a),
  }));

  /** Keeps the active filters when moving between pages. */
  const hrefWith = (overrides: Record<string, string | undefined>) => {
    const next = new URLSearchParams();
    for (const [key, value] of Object.entries(raw)) {
      const v = first(value);
      if (v && key !== "offer") next.set(key, v);
    }
    for (const [key, value] of Object.entries(overrides)) {
      if (value) next.set(key, value);
      else next.delete(key);
    }
    const qs = next.toString();
    return qs ? `/dashboard/opportunities?${qs}` : "/dashboard/opportunities";
  };
  const pageHref = (n: number) => hrefWith({ page: n > 1 ? String(n) : undefined });

  // Page numbers with gaps collapsed: 1 … 4 5 6 … 12
  const pageNumbers = Array.from({ length: pages }, (_, i) => i + 1).filter(
    (n) => pages <= 7 || n === 1 || n === pages || Math.abs(n - page) <= 1,
  );

  return (
    <OpportunityProvider initialSaved={savedIds} alerts={alertViews} domains={DOMAINS}>
      <div className="space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-navy flex items-center gap-3 text-2xl font-bold tracking-tight sm:text-3xl">
              <ShieldCheck className="text-brand size-9" aria-hidden /> Opportunités
            </h1>
            <p className="text-muted mt-1">
              Trouvez des opportunités qui correspondent à vos compétences et à vos ambitions.
            </p>
          </div>
          <nav aria-label="Fil d'Ariane" className="text-muted flex items-center gap-1.5 text-xs">
            <Link href="/dashboard" className="hover:text-brand">
              Accueil
            </Link>
            <ChevronRight className="size-3" aria-hidden /> <span aria-current="page">Opportunités</span>
          </nav>
        </div>

        <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_300px]">
          <div className="min-w-0 space-y-6">
            <section
              aria-label="Présentation"
              className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-50 via-blue-100/70 to-blue-200/60 p-6 sm:p-8"
            >
              <div className="relative z-10 max-w-md">
                <h2 className="text-navy text-2xl leading-tight font-extrabold sm:text-3xl">
                  Votre prochaine opportunité vous attend !
                </h2>
                <p className="text-navy/80 mt-3 text-sm sm:text-base">
                  Explorez des offres d&apos;emploi, des missions freelance, des stages et des projets qui
                  correspondent à votre profil.
                </p>
                <div className="mt-5 flex flex-wrap gap-3">
                  <SearchOpportunitiesButton />
                  <CreateAlertButton
                    variant="outline"
                    className="text-brand border-brand/40 bg-white/70 hover:bg-white"
                  />
                </div>
              </div>
              <div aria-hidden className="absolute inset-y-0 right-[24%] hidden w-[26%] md:block">
                <Image
                  src={heroPhoto}
                  alt=""
                  fill
                  sizes="260px"
                  className="[mask-image:linear-gradient(to_right,transparent,black_35%)] object-cover object-top"
                />
              </div>
              <p
                aria-hidden
                className="text-navy absolute top-5 right-[24%] hidden max-w-[10rem] -rotate-[10deg] text-xl leading-tight md:block"
                style={{ fontFamily: "var(--font-script), cursive" }}
              >
                Plus qu&apos;un emploi, une histoire à construire !
                <span className="mt-1 block text-2xl">Sehin</span>
              </p>
              <figure className="shadow-soft absolute top-1/2 right-5 hidden w-[22%] min-w-44 -translate-y-1/2 rounded-2xl bg-white/80 p-4 backdrop-blur lg:block">
                <Quote className="text-brand size-6 fill-current" aria-hidden />
                <blockquote className="text-navy mt-1 text-xs leading-relaxed">
                  Les opportunités ne se trouvent pas, elles se créent grâce à la préparation et à la
                  visibilité de votre talent.
                </blockquote>
                <figcaption className="text-navy mt-2 text-[11px] font-semibold">
                  — Sehin G. Rodrigue
                </figcaption>
              </figure>
            </section>

            <OpportunityTabs />

            <div className="grid items-start gap-6 lg:grid-cols-[220px_minmax(0,1fr)]">
              <OpportunityFilters {...facets} />
              <section
                id="opportunities-list"
                aria-label="Liste des opportunités"
                className="min-w-0 scroll-mt-24"
              >
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <h2 className="text-navy text-lg font-bold">
                    {filtered.length} opportunité{filtered.length > 1 ? "s" : ""} trouvée
                    {filtered.length > 1 ? "s" : ""}
                  </h2>
                  <OpportunitySort />
                </div>
                {shown.length === 0 ? (
                  <EmptyState
                    icon={ShieldCheck}
                    title="Aucune opportunité trouvée"
                    description="Modifiez vos filtres ou créez une alerte pour retrouver ces critères plus tard."
                  />
                ) : (
                  <ul
                    className={cn(
                      "grid gap-4",
                      list ? "grid-cols-1" : "min-[1500px]:grid-cols-3 sm:grid-cols-2",
                    )}
                  >
                    {shown.map((o) => (
                      <li key={o.id}>
                        <OpportunityCard offer={view(o)} />
                      </li>
                    ))}
                  </ul>
                )}

                {pages > 1 && (
                  <nav aria-label="Pagination" className="mt-6 flex items-center justify-center gap-2">
                    <Link
                      href={pageHref(page - 1)}
                      aria-label="Page précédente"
                      aria-disabled={page === 1}
                      className={cn(
                        "border-border text-navy flex size-9 items-center justify-center rounded-lg border bg-white",
                        page === 1 && "pointer-events-none opacity-40",
                      )}
                    >
                      <ChevronLeft className="size-4" aria-hidden />
                    </Link>
                    {pageNumbers.map((n, i) => (
                      <span key={n} className="flex items-center gap-2">
                        {i > 0 && n - pageNumbers[i - 1] > 1 && <span className="text-muted">…</span>}
                        <Link
                          href={pageHref(n)}
                          aria-current={n === page ? "page" : undefined}
                          className={cn(
                            "flex size-9 items-center justify-center rounded-lg border text-sm font-semibold",
                            n === page
                              ? "bg-brand border-brand text-white"
                              : "border-border text-navy bg-white hover:bg-slate-50",
                          )}
                        >
                          {n}
                        </Link>
                      </span>
                    ))}
                    <Link
                      href={pageHref(page + 1)}
                      aria-label="Page suivante"
                      aria-disabled={page === pages}
                      className={cn(
                        "border-border text-navy flex size-9 items-center justify-center rounded-lg border bg-white",
                        page === pages && "pointer-events-none opacity-40",
                      )}
                    >
                      <ChevronRight className="size-4" aria-hidden />
                    </Link>
                  </nav>
                )}
              </section>
            </div>
          </div>

          <aside className="grid min-w-0 gap-6 md:grid-cols-2 xl:grid-cols-1">
            <ProfileMatch percent={selectionMatch(filtered, mine)} />
            <RecruitingCompanies
              companies={showAllCompanies ? ranking : ranking.slice(0, COMPANIES_SHOWN)}
              total={ranking.length}
              showingAll={showAllCompanies}
              allHref={hrefWith({ companies: showAllCompanies ? undefined : "all" })}
              baseHref={(company) => hrefWith({ company, page: undefined })}
            />
            <JobAlertsCard />
            <CareerTips />
            <NextStepPromo />
          </aside>
        </div>
      </div>
    </OpportunityProvider>
  );
}
