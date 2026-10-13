import type { Metadata } from "next";
import { FileCheck2 } from "lucide-react";
import { EvidenceReviewCard } from "@/components/admin/evidence-review-card";
import { DATETIME } from "@/components/admin/pills";
import { Panel } from "@/components/business/ui";
import { requirePlatformAdmin } from "@/lib/auth/platform-admin";
import { getEvidenceReviewService } from "@/services/container";

export const metadata: Metadata = { title: "Vérification des preuves", robots: { index: false } };

export default async function AdminEvidencePage() {
  const { user } = await requirePlatformAdmin();
  const items = await getEvidenceReviewService().listPending(user.id);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-navy text-2xl font-bold tracking-tight sm:text-3xl">Vérification des preuves</h1>
        <p className="text-muted mt-1">
          Preuves publiées par les talents qui demandent à être vérifiées, de la plus ancienne à la plus
          récente. Une preuve refusée repart avec votre explication.
        </p>
      </div>
      {items.length === 0 ? (
        <Panel className="flex flex-col items-center gap-3 p-10 text-center">
          <FileCheck2 className="text-brand size-8" aria-hidden />
          <p className="text-muted text-sm">Aucune preuve en attente de vérification.</p>
        </Panel>
      ) : (
        <ul className="space-y-4">
          {items.map((item) => (
            <li key={item.id}>
              <EvidenceReviewCard
                item={item}
                requestedAt={
                  item.verificationRequestedAt ? DATETIME.format(new Date(item.verificationRequestedAt)) : "—"
                }
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
