import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BadgeCheck, ShieldAlert, TimerOff } from "lucide-react";
import { Logo } from "@/components/layout/logo";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { NotFoundError } from "@/lib/errors";
import { formatMonth } from "@/lib/utils/format";
import { appUrl } from "@/lib/utils/app-url";
import { getCredentialService } from "@/services/container";
import { SKILL_LEVEL_LABELS } from "@/types/skill";
import { CREDENTIAL_STATUS_LABELS, type CredentialEffectiveStatus } from "@/types/verification";

async function load(credentialId: string) {
  try {
    return await getCredentialService().verify(credentialId);
  } catch (err) {
    if (err instanceof NotFoundError) return null;
    throw err;
  }
}

export async function generateMetadata({ params }: PageProps<"/verify/[credentialId]">): Promise<Metadata> {
  const credential = await load((await params).credentialId);
  if (!credential) return { title: "Credential introuvable", robots: { index: false } };
  const title = `${credential.skillName} — ${SKILL_LEVEL_LABELS[credential.level]} · ${credential.holderName}`;
  return {
    title,
    description: `Credential SkillPass ${credential.credentialId} : ${CREDENTIAL_STATUS_LABELS[credential.status].toLowerCase()}.`,
    alternates: { canonical: `${appUrl()}/verify/${credential.credentialId}` },
    openGraph: { title, type: "website", siteName: "SkillPass" },
  };
}

const PRESENTATION: Record<
  CredentialEffectiveStatus,
  { icon: typeof BadgeCheck; title: string; tone: string }
> = {
  VALID: { icon: BadgeCheck, title: "Credential vérifié", tone: "bg-green-50 text-success" },
  EXPIRED: { icon: TimerOff, title: "Credential expiré", tone: "bg-amber-50 text-amber-700" },
  REVOKED: { icon: ShieldAlert, title: "Credential révoqué", tone: "bg-red-50 text-danger" },
};

export default async function VerifyPage({ params }: PageProps<"/verify/[credentialId]">) {
  const credential = await load((await params).credentialId);
  if (!credential) notFound();

  const { icon: Icon, title, tone } = PRESENTATION[credential.status];
  const rows: [string, React.ReactNode][] = [
    ["Credential", credential.skillName],
    ["Niveau", SKILL_LEVEL_LABELS[credential.level]],
    ["Titulaire", credential.holderName],
    ["Émis par", credential.issuer],
    ["Émis en", formatMonth(credential.issuedAt.slice(0, 10))],
    ...(credential.expiresAt
      ? ([["Expire en", formatMonth(credential.expiresAt.slice(0, 10))]] as [string, string][])
      : []),
    ["Statut", CREDENTIAL_STATUS_LABELS[credential.status]],
    [
      "Identifiant",
      <span key="id" className="font-mono">
        {credential.credentialId}
      </span>,
    ],
  ];

  return (
    <div className="min-h-screen">
      <header className="border-border bg-surface border-b">
        <div className="mx-auto flex h-16 max-w-3xl items-center justify-between px-4">
          <Logo />
          <span className="text-muted text-sm">Vérification de credential</span>
        </div>
      </header>
      <main className="mx-auto max-w-xl px-4 py-10">
        <Card>
          <CardContent>
            <div
              className={`flex items-center gap-3 rounded-xl px-4 py-3 font-semibold ${tone}`}
              role="status"
            >
              <Icon className="size-6" aria-hidden /> {title}
            </div>
            <dl className="divide-border mt-6 divide-y">
              {rows.map(([label, value]) => (
                <div key={label} className="flex justify-between gap-4 py-3 text-sm">
                  <dt className="text-muted">{label}</dt>
                  <dd className="text-right font-medium">{value}</dd>
                </div>
              ))}
            </dl>
            {credential.holderUsername && (
              <Button asChild variant="outline" className="mt-6 w-full">
                <Link href={`/${credential.holderUsername}`}>
                  Voir le SkillPass de {credential.holderName}
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>
        <p className="text-muted mt-4 text-center text-xs">
          Cette page confirme l&apos;authenticité du credential à la date de consultation.
        </p>
      </main>
    </div>
  );
}
