import type { Metadata } from "next";
import Link from "next/link";
import { Sparkles } from "lucide-react";
import { HistoryTab } from "@/components/business/matching/history-tab";
import { RecommendationsTab } from "@/components/business/matching/recommendations-tab";
import { SavedTab } from "@/components/business/matching/saved-tab";
import { SearchTab } from "@/components/business/matching/search-tab";
import { MatchingHeader, MatchTabs } from "@/components/business/matching/shell";
import { first } from "@/components/business/matching/data";
import { NoAccess, Panel } from "@/components/business/ui";
import { buttonVariants } from "@/components/ui/button";
import { requireBusiness } from "@/lib/business/context";
import { parseMatchTab } from "@/lib/business/matching-view";
import { planHasMatching, PLANS } from "@/lib/business/plans";
import { cn } from "@/lib/utils/cn";

export const metadata: Metadata = { title: "Matching" };
export const dynamic = "force-dynamic";

export default async function MatchingPage({ searchParams }: PageProps<"/business/matching">) {
  const ctx = await requireBusiness();
  if (!ctx.can("talents.view")) return <NoAccess what="de consulter les talents" />;

  const raw = await searchParams;
  const tab = parseMatchTab(first(raw.tab));

  if (!planHasMatching(ctx.organization.plan)) {
    return (
      <div className="space-y-6">
        <MatchingHeader tab={tab} />
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

  return (
    <div className="space-y-6">
      <MatchingHeader tab={tab} />
      <MatchTabs current={tab} />
      {tab === "recherche" && <SearchTab ctx={ctx} raw={raw} />}
      {tab === "recommandations" &&
        (ctx.can("talents.recommendations") ? (
          <RecommendationsTab ctx={ctx} raw={raw} />
        ) : (
          <NoAccess what="d'accéder aux recommandations" />
        ))}
      {tab === "sauvegardes" && <SavedTab ctx={ctx} raw={raw} />}
      {tab === "historique" && <HistoryTab ctx={ctx} raw={raw} />}
    </div>
  );
}
