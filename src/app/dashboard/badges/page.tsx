import type { Metadata } from "next";
import Link from "next/link";
import { Medal } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { CredentialBadge } from "@/components/verification/credential-badge";
import { requireUser } from "@/lib/auth/current-user";
import { appUrl } from "@/lib/utils/app-url";
import { getCredentialService } from "@/services/container";

export const metadata: Metadata = { title: "Badges" };

export default async function BadgesPage() {
  const user = await requireUser();
  const credentials = await getCredentialService().listForProfile(user.id);

  return (
    <>
      <PageHeader
        title="Badges"
        description="Vos credentials vérifiables : chacun se contrôle par QR code ou par son identifiant."
      />
      {credentials.length === 0 ? (
        <EmptyState
          icon={Medal}
          title="Aucun badge pour l'instant"
          description="Réussissez une évaluation pour obtenir votre premier badge vérifiable."
          action={
            <Button asChild>
              <Link href="/dashboard/assessments">Passer une évaluation</Link>
            </Button>
          }
        />
      ) : (
        <ul className="grid gap-4 lg:grid-cols-2">
          {credentials.map((c) => (
            <li key={c.credentialId}>
              <CredentialBadge credential={c} verifyUrl={`${appUrl()}/verify/${c.credentialId}`} />
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
