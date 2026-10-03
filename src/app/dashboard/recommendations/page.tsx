import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import {
  RecommendationsManager,
  type RecommendationView,
} from "@/components/verification/recommendations-manager";
import { requireUser } from "@/lib/auth/current-user";
import { appUrl } from "@/lib/utils/app-url";
import { getRecommendationService, getSkillService } from "@/services/container";

export const metadata: Metadata = { title: "Recommandations" };

export default async function RecommendationsPage() {
  const user = await requireUser();
  const service = getRecommendationService();
  const [list, skills] = await Promise.all([
    service.list(user.id),
    getSkillService().list(user.id, { sort: "name" }),
  ]);

  const items: RecommendationView[] = list.map((r) => ({
    id: r.id,
    authorName: r.authorName,
    authorTitle: r.authorTitle,
    skillName: r.skillName,
    content: r.content,
    status: r.status,
    // The token only leaves the server while the request can still be answered.
    link:
      r.status === "REQUESTED" && service.linkState(r) === "open" ? `${appUrl()}/recommend/${r.token}` : null,
    expiresAt: r.expiresAt,
  }));

  return (
    <>
      <PageHeader
        title="Recommandations"
        description="Des témoignages de personnes qui ont travaillé avec vous. Vous validez chacun avant publication."
      />
      <RecommendationsManager items={items} skills={skills.items.map((s) => ({ id: s.id, name: s.name }))} />
    </>
  );
}
