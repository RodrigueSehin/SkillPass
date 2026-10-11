import type { Metadata } from "next";
import Link from "next/link";
import { BriefcaseBusiness, Eye, Plus, Target, UsersRound } from "lucide-react";
import { OffersTable, type OfferTableRow } from "@/components/business/offers-table";
import { CreateOfferCard } from "@/components/business/offers-side";
import { ApplicationSources, RecentOffers, TopOffers } from "@/components/business/offers-panels";
import { OffersToolbar } from "@/components/business/offers-toolbar";
import { Pagination } from "@/components/business/pagination";
import { LinkTabs, NoAccess, Panel, StatCard } from "@/components/business/ui";
import { RowMenu } from "@/components/business/row-menu";
import { requireBusiness } from "@/lib/business/context";
import {
  filterOffers,
  OFFER_TABS,
  OFFERS_PER_PAGE,
  offerStats,
  parseOfferTab,
  recentOffers,
  tabCounts,
  topOffers,
} from "@/lib/business/job-offer-view";
import { proposedTalentCount } from "@/lib/business/matching";
import { planHasMatching } from "@/lib/business/plans";
import { paginate } from "@/lib/project-view";
import { getTalentDirectoryRepository } from "@/repositories";
import { cn } from "@/lib/utils/cn";
import { buttonVariants } from "@/components/ui/button";
import { getJobOfferService, getOrganizationService } from "@/services/container";

export const metadata: Metadata = { title: "Offres d'emploi" };
export const dynamic = "force-dynamic";

const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
const DATE = new Intl.DateTimeFormat("fr-FR", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});
const dateLabel = (iso: string | null) => (iso ? DATE.format(new Date(iso)) : "");

export default async function JobOffersPage({ searchParams }: PageProps<"/business/offres">) {
  const ctx = await requireBusiness();
  const canView = ctx.can("jobs.applications") || ctx.can("jobs.create") || ctx.can("jobs.edit");
  if (!canView) return <NoAccess what="de consulter les offres d'emploi" />;

  const raw = await searchParams;
  const orgId = ctx.organization.id;
  const [offers, departments] = await Promise.all([
    getJobOfferService().list(orgId),
    getOrganizationService().listDepartments(orgId),
  ]);
  const tab = parseOfferTab(first(raw.tab));
  const filtered = filterOffers(offers, {
    tab,
    q: first(raw.q),
    contract: first(raw.contract),
    department: first(raw.department),
  });
  const { page, pages, items } = paginate(filtered, Number(first(raw.page)), OFFERS_PER_PAGE);
  const counts = tabCounts(offers);
  const stats = offerStats(offers);
  const proposed =
    planHasMatching(ctx.organization.plan) && ctx.can("talents.view")
      ? proposedTalentCount(
          offers.filter((o) => o.displayStatus === "PUBLISHED"),
          await getTalentDirectoryRepository().listPublic(500),
        )
      : null;
  const canCreate = ctx.can("jobs.create");
  const canEdit = ctx.can("jobs.edit");

  const rows: OfferTableRow[] = items.map((o) => ({
    id: o.id,
    title: o.title,
    skills: o.skills,
    location: o.location,
    contract: o.contract,
    applicants: o.applicants,
    status: o.displayStatus,
    date: dateLabel(o.publishedAt),
  }));

  const hrefFor = (n: number) => {
    const next = new URLSearchParams();
    for (const [key, value] of Object.entries(raw)) {
      const v = first(value);
      if (v && key !== "page") next.set(key, v);
    }
    if (n > 1) next.set("page", String(n));
    const qs = next.toString();
    return qs ? `/business/offres?${qs}` : "/business/offres";
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-navy text-2xl font-bold tracking-tight sm:text-3xl">Offres d&apos;emploi</h1>
          <p className="text-muted mt-1">
            Créez, gérez et suivez vos offres d&apos;emploi pour attirer les meilleurs talents.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {canCreate && (
            <Link
              href="/business/offres/nouvelle"
              className={cn(buttonVariants(), "bg-orange h-12 px-6 hover:bg-orange-600")}
            >
              <Plus /> Publier une offre
            </Link>
          )}
          <div className="border-border flex h-12 items-center rounded-xl border bg-white px-1.5">
            <RowMenu
              label="Plus d'actions"
              items={[{ label: "Exporter en CSV", href: "/api/business/offers/export" }]}
            />
          </div>
        </div>
      </div>

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0 space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              icon={BriefcaseBusiness}
              tone="bg-orange-100 text-orange-600"
              value={stats.published}
              label="Offres publiées"
              chip={
                stats.deltaPercent === null
                  ? null
                  : {
                      text: `${stats.deltaPercent >= 0 ? "↑" : "↓"} ${Math.abs(stats.deltaPercent)}%`,
                      tone: stats.deltaPercent < 0 ? "down" : "up",
                    }
              }
            />
            <StatCard
              icon={UsersRound}
              tone="bg-blue-50 text-brand"
              value={stats.applicants.toLocaleString("fr-FR")}
              label="Candidatures"
            />
            <StatCard
              icon={Eye}
              tone="bg-orange-100 text-orange-600"
              value={stats.views.toLocaleString("fr-FR")}
              label="Vues des offres"
            />
            {proposed !== null && (
              <StatCard
                icon={Target}
                tone="bg-blue-50 text-brand"
                value={proposed.toLocaleString("fr-FR")}
                label="Talents proposés"
                caption="pour vos offres ouvertes"
              />
            )}
          </div>

          <Panel>
            <div className="space-y-4 px-5 pt-1 pb-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <LinkTabs
                  label="Statut des offres"
                  current={tab}
                  tabs={OFFER_TABS.map(([key, label]) => ({
                    key,
                    label: `${label} (${counts[key]})`,
                    href: key === "all" ? "/business/offres" : `/business/offres?tab=${key}`,
                  }))}
                />
              </div>
              <OffersToolbar departments={departments.map((d) => ({ id: d.id, name: d.name }))} />
            </div>
            <OffersTable
              rows={rows}
              organization={{ name: ctx.organization.name, logoVersion: ctx.organization.logoVersion }}
              canCreate={canCreate}
              canEdit={canEdit}
              canDelete={ctx.can("jobs.delete")}
            />
            <Pagination
              page={page}
              pages={pages}
              total={filtered.length}
              size={OFFERS_PER_PAGE}
              noun="offres"
              hrefFor={hrefFor}
            />
          </Panel>
        </div>

        <aside className="grid min-w-0 gap-6 md:grid-cols-2 xl:grid-cols-1">
          <CreateOfferCard canCreate={canCreate} />
          <TopOffers offers={topOffers(offers)} />
          <ApplicationSources total={stats.applicants} />
          <RecentOffers
            offers={recentOffers(offers)}
            organization={{ name: ctx.organization.name, logoVersion: ctx.organization.logoVersion }}
            dateLabel={(o) => dateLabel(o.publishedAt ?? o.createdAt)}
          />
        </aside>
      </div>
    </div>
  );
}
