import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  BarChart3,
  BriefcaseBusiness,
  ChevronRight,
  ClipboardList,
  Database,
  FilePlus2,
  Medal,
  Quote,
  Search,
  UserCheck,
  Users,
  UsersRound,
  type LucideIcon,
} from "lucide-react";
import heroOffice from "../../../../public/images/hero-office.png";
import { ComboChart, Donut } from "@/components/business/charts";
import { RecentOffers } from "@/components/business/offers-panels";
import { TalentAvatar } from "@/components/business/talent-cards";
import { Panel, StatCard } from "@/components/business/ui";
import { computeAnalytics } from "@/lib/business/analytics";
import { requireBusiness } from "@/lib/business/context";
import { businessHas } from "@/lib/plans/entitlements";
import { activityFeed, levelDistribution, relativeTime } from "@/lib/business/dashboard";
import { recentOffers } from "@/lib/business/job-offer-view";
import { parseTalentFilters, searchTalents } from "@/lib/business/talent-search";
import { cn } from "@/lib/utils/cn";
import { getTalentDirectoryRepository } from "@/repositories";
import { getEvaluationService, getJobOfferService, getOrganizationService } from "@/services/container";
import { SKILL_LEVEL_LABELS } from "@/types/skill";

export const metadata: Metadata = { title: "Tableau de bord" };
export const dynamic = "force-dynamic";

const LEVEL_COLORS = {
  EXPERT: "#2563EB",
  ADVANCED: "#16A34A",
  INTERMEDIATE: "#F59E0B",
  BEGINNER: "#94A3B8",
} as const;
const DATE = new Intl.DateTimeFormat("fr-FR", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});
const FEED_TONES = {
  evaluation: "bg-green-50 text-green-700",
  offer: "bg-blue-50 text-brand",
  member: "bg-violet-50 text-violet-700",
} as const;

export default async function BusinessDashboardPage() {
  const ctx = await requireBusiness();
  const orgId = ctx.organization.id;
  const now = new Date();
  const canTalents = ctx.can("talents.view");
  // What the plan includes: the sections of a feature the plan lacks are not shown at all.
  const plan = ctx.organization.plan;
  const hasEvaluations = businessHas(plan, "evaluations");
  const hasMatching = businessHas(plan, "matching");
  const [talents, offers, evaluations, attempts, members] = await Promise.all([
    getTalentDirectoryRepository().listPublic(500),
    getJobOfferService().list(orgId),
    getEvaluationService().list(orgId),
    getEvaluationService().recentAttempts(orgId, 5000),
    getOrganizationService().listMembers(orgId),
  ]);
  const analytics = computeAnalytics({ evaluations, attempts, offers, days: 180, now });
  const open = offers.filter((o) => o.displayStatus === "PUBLISHED").length;
  const applications = offers.reduce((n, o) => n + o.applicants, 0);
  const levels = levelDistribution(talents);
  const suggestions = searchTalents(talents, parseTalentFilters({})).slice(0, 3);
  const feed = activityFeed({ attempts, evaluations, offers, members }).filter(
    (f) => hasEvaluations || f.kind !== "evaluation",
  );
  const { branding } = ctx.organization.settings;

  const actions: { href: string; label: string; icon: LucideIcon; show: boolean }[] = [
    {
      href: "/business/offres/nouvelle",
      label: "Publier une offre d'emploi",
      icon: BriefcaseBusiness,
      show: ctx.can("jobs.create"),
    },
    { href: "/business/talents", label: "Rechercher des talents", icon: Search, show: canTalents },
    {
      href: "/business/evaluations/nouvelle",
      label: "Créer une évaluation",
      icon: FilePlus2,
      show: ctx.can("evaluations.create"),
    },
    { href: "/business/competences", label: "Analyser les compétences", icon: Database, show: true },
  ];

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-50 via-blue-100/70 to-blue-200/60 p-6 sm:p-8">
        <div className="relative z-10 max-w-md">
          <p className="text-navy text-xl font-bold">Bonjour,</p>
          <h1 className="text-navy mt-1 text-3xl font-extrabold tracking-tight sm:text-4xl">
            {ctx.organization.name}
          </h1>
          <p className="text-navy/80 mt-3 text-sm sm:text-base">{branding.welcomeText}</p>
        </div>
        {branding.showCover && (
          <div aria-hidden className="absolute inset-y-0 right-[22%] hidden w-[34%] md:block">
            <Image
              src={heroOffice}
              alt=""
              fill
              sizes="420px"
              className="[mask-image:linear-gradient(to_right,transparent,black_35%)] object-cover object-top"
            />
          </div>
        )}
        <figure className="shadow-soft absolute top-1/2 right-5 hidden w-[20%] min-w-44 -translate-y-1/2 rounded-2xl bg-white/80 p-4 backdrop-blur lg:block">
          <Quote className="text-brand size-6 fill-current" aria-hidden />
          <blockquote className="text-navy mt-1 text-sm leading-snug font-semibold">
            Des talents qualifiés aujourd&apos;hui pour les défis de demain.
          </blockquote>
          <span aria-hidden className="bg-orange mt-3 block h-1 w-10 rounded-full" />
        </figure>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={Users}
          tone="bg-blue-50 text-brand"
          value={talents.length.toLocaleString("fr-FR")}
          label="Talents disponibles"
          caption="avec un profil public"
        />
        <StatCard
          icon={BriefcaseBusiness}
          tone="bg-orange-100 text-orange-600"
          value={offers.length}
          label="Offres d'emploi"
          caption={`dont ${open} ouverte${open > 1 ? "s" : ""}`}
        />
        <StatCard
          icon={UsersRound}
          tone="bg-blue-50 text-brand"
          value={applications.toLocaleString("fr-FR")}
          label="Candidatures reçues"
          caption="sur vos offres"
        />
        {hasEvaluations && (
          <StatCard
            icon={Medal}
            tone="bg-orange-100 text-orange-600"
            value={analytics.kpis.successRate.value === null ? "—" : `${analytics.kpis.successRate.value}%`}
            label="Taux de réussite aux évaluations"
            caption="6 derniers mois"
          />
        )}
      </div>

      <div
        className={cn(
          "grid items-start gap-6",
          hasEvaluations
            ? "xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_320px]"
            : "xl:grid-cols-[minmax(0,1fr)_320px]",
        )}
      >
        {hasEvaluations && (
          <Panel className="p-5">
            <h2 className="text-navy font-bold">Activité des évaluations</h2>
            <p className="text-muted text-xs">Évaluations créées et passages terminés, sur 6 mois</p>
            <ul className="text-muted mt-2 flex gap-4 text-xs">
              <li className="flex items-center gap-1.5">
                <span aria-hidden className="size-2.5 rounded-full bg-blue-300" /> Évaluations créées
              </li>
              <li className="flex items-center gap-1.5">
                <span aria-hidden className="size-2.5 rounded-full bg-green-600" /> Passages terminés
              </li>
            </ul>
            <div className="mt-3">
              <ComboChart
                labels={analytics.trend.labels}
                bars={analytics.trend.created}
                line={analytics.trend.evaluated}
                label="Évaluations créées et passages terminés, 6 derniers mois"
              />
            </div>
          </Panel>
        )}

        <Panel className="p-5">
          <h2 className="text-navy font-bold">Répartition par niveau de compétence</h2>
          <div className="mt-4 flex items-center gap-4">
            <Donut
              label="Répartition des compétences des talents par niveau"
              center={talents.length.toLocaleString("fr-FR")}
              caption="talents"
              size={120}
              segments={levels.map((l) => ({ label: l.level, value: l.count, color: LEVEL_COLORS[l.level] }))}
            />
            <ul className="min-w-0 flex-1 space-y-2 text-sm">
              {levels.map((l) => (
                <li key={l.level} className="flex items-center gap-2">
                  <span
                    aria-hidden
                    className="size-2.5 shrink-0 rounded-full"
                    style={{ background: LEVEL_COLORS[l.level] }}
                  />
                  <span className="text-navy truncate">{SKILL_LEVEL_LABELS[l.level]}</span>
                  <span className="text-navy ml-auto font-semibold">{l.percent}%</span>
                </li>
              ))}
            </ul>
          </div>
        </Panel>

        <Panel className="p-5">
          <h2 className="text-navy font-bold">Actions rapides</h2>
          <ul className="mt-3 space-y-2">
            {actions
              .filter((a) => a.show)
              .map(({ href, label, icon: Icon }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="border-border text-navy flex h-11 items-center gap-3 rounded-xl border bg-white px-3 text-sm font-medium hover:bg-blue-50"
                  >
                    <Icon className="text-brand size-4" aria-hidden /> <span className="flex-1">{label}</span>{" "}
                    <ChevronRight className="text-muted size-4" aria-hidden />
                  </Link>
                </li>
              ))}
          </ul>
        </Panel>
      </div>

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_320px]">
        {canTalents ? (
          <Panel className="p-5">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-navy font-bold">Talents à découvrir</h2>
              <Link href="/business/talents" className="text-brand text-sm font-semibold hover:underline">
                Voir tout
              </Link>
            </div>
            {suggestions.length === 0 ? (
              <p className="text-muted mt-3 text-sm">Aucun profil public pour l&apos;instant.</p>
            ) : (
              <ul className="mt-4 divide-y divide-slate-100">
                {suggestions.map(({ record: t }) => (
                  <li key={t.id} className="flex items-center gap-3 py-3">
                    <TalentAvatar
                      name={t.fullName}
                      avatar={t.avatar}
                      profileId={t.id}
                      className="size-11 text-sm"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="text-navy block truncate font-semibold">{t.fullName}</span>
                      <span className="text-muted block truncate text-xs">{t.profession ?? t.headline}</span>
                      <span className="mt-1 flex flex-wrap gap-1">
                        {t.skills.slice(0, 3).map((s) => (
                          <span
                            key={s.name}
                            className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-600"
                          >
                            {s.name}
                          </span>
                        ))}
                      </span>
                    </span>
                    <Link
                      href={`/business/talents?profil=${t.username}`}
                      className="border-brand/40 text-brand flex h-9 items-center rounded-lg border px-3 text-sm font-semibold hover:bg-blue-50"
                    >
                      Voir profil
                    </Link>
                  </li>
                ))}
              </ul>
            )}
            <p className="text-muted mt-2 text-[11px]">
              Sélection selon la vérification des compétences, les certifications et l&apos;expérience.
              {hasMatching && " Pour les talents proposés par offre, ouvrez le Matching."}
            </p>
          </Panel>
        ) : (
          <div />
        )}

        <RecentOffers
          offers={recentOffers(offers)}
          organization={{ name: ctx.organization.name, logoVersion: ctx.organization.logoVersion }}
          dateLabel={(o) =>
            (o.publishedAt ?? o.createdAt) ? DATE.format(new Date(o.publishedAt ?? o.createdAt)) : ""
          }
        />

        <Panel className="p-5">
          <h2 className="text-navy font-bold">Activités récentes</h2>
          {feed.length === 0 ? (
            <p className="text-muted mt-3 text-sm">Les événements de votre organisation apparaîtront ici.</p>
          ) : (
            <ul className="mt-4 space-y-4">
              {feed.map((f) => {
                const inner = (
                  <>
                    <span
                      className={cn(
                        "flex size-9 shrink-0 items-center justify-center rounded-full",
                        FEED_TONES[f.kind],
                      )}
                    >
                      {f.kind === "evaluation" ? (
                        <ClipboardList className="size-4" aria-hidden />
                      ) : f.kind === "offer" ? (
                        <BarChart3 className="size-4" aria-hidden />
                      ) : (
                        <UserCheck className="size-4" aria-hidden />
                      )}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="text-navy block text-sm font-semibold">{f.title}</span>
                      <span className="text-muted block truncate text-xs">{f.detail}</span>
                      <span className="text-muted block text-[11px]">{relativeTime(f.at, now)}</span>
                    </span>
                    {f.badge && (
                      <span className="rounded-md bg-green-50 px-2 py-1 text-xs font-semibold text-green-700">
                        {f.badge}
                      </span>
                    )}
                  </>
                );
                return (
                  <li key={f.id}>
                    {f.href ? (
                      <Link href={f.href} className="flex items-center gap-3 hover:opacity-80">
                        {inner}
                      </Link>
                    ) : (
                      <div className="flex items-center gap-3">{inner}</div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </Panel>
      </div>
    </div>
  );
}
