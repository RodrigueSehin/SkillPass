import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ChevronRight, UserRoundPlus } from "lucide-react";
import { NewRequestForm, type Contact } from "@/components/recommendations/new-request-form";
import { requireUser } from "@/lib/auth/current-user";
import { profileFor } from "@/lib/auth/profile";
import { appUrl } from "@/lib/utils/app-url";
import { getRecommendationService } from "@/services/container";

export const metadata: Metadata = { title: "Demander une recommandation" };

export default async function NewRecommendationRequestPage() {
  const user = await requireUser();
  const [requests, profile] = await Promise.all([getRecommendationService().list(user.id), profileFor(user)]);

  // People already asked, most recent first: the closest thing to an address book.
  const seen = new Set<string>();
  const contacts: Contact[] = [];
  for (const r of [...requests].sort((a, b) => b.createdAt.localeCompare(a.createdAt))) {
    const key = r.authorName.trim().toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    contacts.push({ name: r.authorName, email: r.authorEmail, title: r.authorTitle });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link
            href="/dashboard/recommendations"
            className="text-muted hover:text-brand inline-flex items-center gap-2 text-sm"
          >
            <ArrowLeft className="size-4" aria-hidden /> Retour aux recommandations
          </Link>
          <h1 className="text-navy mt-3 flex items-center gap-3 text-2xl font-bold tracking-tight sm:text-3xl">
            <UserRoundPlus className="text-brand size-9" aria-hidden /> Demander une recommandation
          </h1>
          <p className="text-muted mt-1">
            Sollicitez une recommandation auprès d&apos;un ancien manager, collègue, client ou partenaire.
          </p>
        </div>
        <nav aria-label="Fil d'Ariane" className="text-muted flex items-center gap-1.5 text-xs">
          <Link href="/dashboard/recommendations" className="hover:text-brand">
            Recommandations
          </Link>
          <ChevronRight className="size-3" aria-hidden />
          <span aria-current="page">Demander une recommandation</span>
        </nav>
      </div>

      <NewRequestForm
        contacts={contacts}
        holderName={user.name}
        holderSlug={profile.username}
        appOrigin={appUrl()}
      />
    </div>
  );
}
