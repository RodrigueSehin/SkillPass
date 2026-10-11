import type { Metadata } from "next";
import { HistoryTab } from "@/components/business/matching/history-tab";
import { RecommendationsTab } from "@/components/business/matching/recommendations-tab";
import { SavedTab } from "@/components/business/matching/saved-tab";
import { SearchTab } from "@/components/business/matching/search-tab";
import { MatchingHeader, MatchTabs } from "@/components/business/matching/shell";
import { first } from "@/components/business/matching/data";
import { NoAccess } from "@/components/business/ui";
import { requireBusiness } from "@/lib/business/context";
import { requireBusinessFeature } from "@/lib/business/features";
import { parseMatchTab } from "@/lib/business/matching-view";

export const metadata: Metadata = { title: "Matching" };
export const dynamic = "force-dynamic";

export default async function MatchingPage({ searchParams }: PageProps<"/business/matching">) {
  const ctx = await requireBusiness();
  requireBusinessFeature(ctx, "matching");
  if (!ctx.can("talents.view")) return <NoAccess what="de consulter les talents" />;

  const raw = await searchParams;
  const tab = parseMatchTab(first(raw.tab));

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
