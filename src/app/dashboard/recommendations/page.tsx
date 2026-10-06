import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ChevronRight, MessageSquareQuote, Share2, Star, ThumbsUp, Users } from "lucide-react";
import heroPhoto from "@/assets/skills/hero.jpg";
import { RecommendationCard } from "@/components/recommendations/recommendation-card";
import {
  RecommendationFilters,
  RecommendationSort,
} from "@/components/recommendations/recommendation-controls";
import {
  RecommendationEditor,
  RequestRecommendationButton,
} from "@/components/recommendations/recommendation-editor";
import {
  CredibilityIndex,
  KeywordCloud,
  NetworkPromo,
  WhoCanRecommend,
} from "@/components/recommendations/recommendation-side";
import { StatCard } from "@/components/skills/stat-card";
import { EmptyState } from "@/components/ui/empty-state";
import { requireUser } from "@/lib/auth/current-user";
import { profileFor } from "@/lib/auth/profile";
import { parseList } from "@/lib/experience-view";
import { countBy } from "@/lib/project-view";
import {
  filterRecommendations,
  isPublished,
  KEYWORD_FILTERS_SHOWN,
  ratingDistribution,
  recommendationStats,
  topKeywords,
  yearOf,
} from "@/lib/recommendation-view";
import { appUrl } from "@/lib/utils/app-url";
import { RECOMMENDATION_RELATION_LABELS } from "@/schemas/verification";
import { getRecommendationService } from "@/services/container";
import { RECOMMENDATION_STATUS_LABELS, type RecommendationStatus } from "@/types/verification";

export const metadata: Metadata = { title: "Recommandations" };

const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

export default async function RecommendationsPage({ searchParams }: PageProps<"/dashboard/recommendations">) {
  const user = await requireUser();
  const raw = await searchParams;
  const service = getRecommendationService();
  const [all, profile] = await Promise.all([service.list(user.id), profileFor(user)]);

  const shown = filterRecommendations(all, {
    q: first(raw.q),
    status: parseList(raw.status),
    relation: parseList(raw.relation),
    keyword: parseList(raw.keyword),
    year: parseList(raw.year),
    sort: first(raw.sort),
  });
  const stats = recommendationStats(all);
  const grid = first(raw.view) === "grid";

  const relationLabels = RECOMMENDATION_RELATION_LABELS as Record<string, string>;
  const keywords = countBy(all.filter(isPublished).flatMap((r) => r.keywords));
  const visibleKeywords = first(raw.more) === "1" ? keywords : keywords.slice(0, KEYWORD_FILTERS_SHOWN);
  const filters = {
    statuses: (["APPROVED", "SUBMITTED", "REQUESTED", "DECLINED"] as RecommendationStatus[]).map((s) => ({
      value: s,
      label: RECOMMENDATION_STATUS_LABELS[s],
      count: all.filter((r) => r.status === s).length,
    })),
    relations: countBy(all.map((r) => r.relation)).map((c) => ({
      value: c.name,
      label: relationLabels[c.name] ?? c.name,
      count: c.count,
    })),
    keywords: visibleKeywords.map((k) => ({ value: k.name, label: k.name, count: k.count })),
    moreKeywords: Math.max(0, keywords.length - KEYWORD_FILTERS_SHOWN),
    years: countBy(all.map(yearOf))
      .sort((a, b) => b.name.localeCompare(a.name))
      .map((y) => ({ value: y.name, label: y.name, count: y.count })),
  };

  return (
    <RecommendationEditor>
      <div className="space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-navy flex items-center gap-3 text-2xl font-bold tracking-tight sm:text-3xl">
              <MessageSquareQuote className="text-brand size-8" aria-hidden /> Recommandations
            </h1>
            <p className="text-muted mt-1">
              Des témoignages authentiques qui renforcent votre crédibilité professionnelle.
            </p>
          </div>
          <nav aria-label="Fil d'Ariane" className="text-muted flex items-center gap-1.5 text-xs">
            <Link href="/dashboard" className="hover:text-brand">
              Accueil
            </Link>
            <ChevronRight className="size-3" aria-hidden /> <span aria-current="page">Recommandations</span>
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
                  La confiance se construit avec des gens qui comptent.
                </h2>
                <p className="text-navy/80 mt-3 text-sm sm:text-base">
                  Recevez des recommandations de vos collègues, managers, clients ou partenaires et mettez en
                  valeur votre impact.
                </p>
                <div className="mt-5 flex flex-wrap gap-3">
                  <RequestRecommendationButton />
                  <Link
                    href={profile.isPublic ? `/${profile.username}` : "/dashboard/settings"}
                    className="text-brand border-brand/40 inline-flex h-11 items-center gap-2 rounded-xl border bg-white/70 px-5 text-sm font-semibold hover:bg-white"
                  >
                    <Share2 className="size-4" aria-hidden />
                    {profile.isPublic ? "Partager mon profil" : "Rendre mon profil public"}
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

            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              <StatCard label="Recommandations reçues" value={stats.received} icon={MessageSquareQuote} />
              <StatCard label="Recommandeurs" value={stats.recommenders} icon={Users} />
              <StatCard label="Note moyenne" value={stats.average ?? "–"} icon={Star} />
              <StatCard
                label="Recommanderaient"
                value={stats.recommendPercent === null ? "–" : `${stats.recommendPercent}%`}
                icon={ThumbsUp}
              />
            </div>

            <div className="grid items-start gap-6 lg:grid-cols-[220px_minmax(0,1fr)]">
              <RecommendationFilters {...filters} />
              <section aria-label="Liste des recommandations" className="min-w-0">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <h2 className="text-navy text-lg font-bold">
                    {shown.length === all.length
                      ? `${all.length} recommandation${all.length > 1 ? "s" : ""}`
                      : `${shown.length} sur ${all.length} recommandations`}
                  </h2>
                  <RecommendationSort />
                </div>
                {all.length === 0 ? (
                  <EmptyState
                    icon={MessageSquareQuote}
                    title="Aucune recommandation pour l'instant"
                    description="Demandez à un collègue ou un client d'attester votre travail. Il reçoit un lien, sans compte à créer."
                  />
                ) : shown.length === 0 ? (
                  <EmptyState
                    icon={MessageSquareQuote}
                    title="Aucun résultat"
                    description="Modifiez vos filtres pour élargir la recherche."
                  />
                ) : (
                  <ul className={grid ? "grid gap-4 md:grid-cols-2" : "space-y-4"}>
                    {shown.map((r) => (
                      <li key={r.id}>
                        <RecommendationCard
                          recommendation={r}
                          // The token only leaves the server while the request can still be answered.
                          link={
                            r.status === "REQUESTED" && service.linkState(r) === "open"
                              ? `${appUrl()}/recommend/${r.token}`
                              : null
                          }
                        />
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </div>
          </div>

          <aside className="grid min-w-0 gap-6 md:grid-cols-2 xl:grid-cols-1">
            <CredibilityIndex average={stats.average} distribution={ratingDistribution(all)} />
            <KeywordCloud keywords={topKeywords(all)} />
            <WhoCanRecommend />
            <NetworkPromo />
          </aside>
        </div>
      </div>
    </RecommendationEditor>
  );
}
