import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Wrench } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { requireUser } from "@/lib/auth/current-user";
import { loadBusinessScope } from "@/lib/business/context";

export const metadata: Metadata = { title: "Maintenance" };
export const dynamic = "force-dynamic";

export default async function MaintenancePage() {
  const user = await requireUser();
  const scope = await loadBusinessScope(user.id);
  if (!scope) redirect("/business/onboarding");
  if (!scope.organization.settings.maintenance || scope.member.role === "ADMIN") redirect("/business");
  return (
    <Card>
      <CardContent className="space-y-4 text-center">
        <Wrench className="mx-auto size-12 text-amber-500" aria-hidden />
        <h1 className="text-navy text-2xl font-bold">Maintenance en cours</h1>
        <p className="text-muted text-sm">
          Un administrateur de « {scope.organization.name} » a réservé temporairement l&apos;accès à SkillPass
          Business. Revenez dans un instant.
        </p>
      </CardContent>
    </Card>
  );
}
