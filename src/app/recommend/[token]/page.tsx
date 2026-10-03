import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CheckCircle2, Clock } from "lucide-react";
import { Logo } from "@/components/layout/logo";
import { Card, CardContent } from "@/components/ui/card";
import { RecommendationForm } from "@/components/verification/recommendation-form";
import { NotFoundError } from "@/lib/errors";
import { getRecommendationService } from "@/services/container";

// Private link: keep it out of search engines and out of the Referer header.
export const metadata: Metadata = {
  title: "Écrire une recommandation",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};
export const dynamic = "force-dynamic";

export default async function RecommendPage({ params }: PageProps<"/recommend/[token]">) {
  const { token } = await params;
  let invite;
  try {
    invite = await getRecommendationService().getInvite(token);
  } catch (err) {
    if (err instanceof NotFoundError) notFound();
    throw err;
  }

  return (
    <div className="min-h-screen">
      <header className="border-border bg-surface border-b">
        <div className="mx-auto flex h-16 max-w-3xl items-center px-4">
          <Logo />
        </div>
      </header>
      <main className="mx-auto max-w-xl px-4 py-10">
        <Card>
          <CardContent>
            {invite.state === "open" ? (
              <>
                <h1 className="text-2xl font-bold tracking-tight">Recommander {invite.holderName}</h1>
                <p className="text-muted mt-2 text-sm">
                  Bonjour {invite.authorName}, {invite.holderName} vous demande de témoigner de son travail
                  {invite.skillName ? ` (${invite.skillName})` : ""}. Quelques phrases sincères suffisent.
                  Vous n&apos;avez pas besoin de compte.
                </p>
                <div className="mt-6">
                  <RecommendationForm token={token} holderName={invite.holderName} />
                </div>
              </>
            ) : (
              <div className="py-6 text-center">
                {invite.state === "answered" ? (
                  <CheckCircle2 className="text-success mx-auto size-10" aria-hidden />
                ) : (
                  <Clock className="mx-auto size-10 text-amber-600" aria-hidden />
                )}
                <h1 className="mt-4 text-xl font-bold">
                  {invite.state === "answered" ? "Merci, c'est déjà envoyé" : "Ce lien a expiré"}
                </h1>
                <p className="text-muted mt-2 text-sm">
                  {invite.state === "answered"
                    ? "Votre recommandation a bien été transmise."
                    : `Demandez à ${invite.holderName} de vous envoyer un nouveau lien.`}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
