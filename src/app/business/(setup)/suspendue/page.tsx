import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PauseCircle } from "lucide-react";
import { ReactivateButton } from "@/components/business/settings/reactivate-button";
import { Card, CardContent } from "@/components/ui/card";
import { requireUser } from "@/lib/auth/current-user";
import { loadBusinessScope } from "@/lib/business/context";

export const metadata: Metadata = { title: "Organisation désactivée" };
export const dynamic = "force-dynamic";

export default async function SuspendedPage() {
  const user = await requireUser();
  const scope = await loadBusinessScope(user.id);
  if (!scope) redirect("/business/onboarding");
  if (!scope.organization.deactivated) redirect("/business");
  const isAdmin = scope.member.role === "ADMIN" && scope.member.status === "ACTIVE";
  return (
    <Card>
      <CardContent className="space-y-4 text-center">
        <PauseCircle className="mx-auto size-12 text-amber-500" aria-hidden />
        <h1 className="text-navy text-2xl font-bold">« {scope.organization.name} » est désactivée</h1>
        <p className="text-muted text-sm">
          L&apos;accès est suspendu pour tous les membres. Les données sont conservées et les offres publiées
          sont retirées de la plateforme jusqu&apos;à la réactivation.
        </p>
        {isAdmin ? (
          <ReactivateButton />
        ) : (
          <p className="text-muted text-sm">
            Demandez à un administrateur de votre organisation de la réactiver.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
