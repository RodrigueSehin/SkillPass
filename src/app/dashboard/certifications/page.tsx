import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { ResourceManager, type ItemView } from "@/components/resources/resource-manager";
import { requireUser } from "@/lib/auth/current-user";
import { formatMonth } from "@/lib/utils/format";
import { getCertificationService } from "@/services/container";
import { VERIFICATION_STATUS_LABELS } from "@/types/skill";

export const metadata: Metadata = { title: "Certifications" };

const TONES = { VERIFIED: "success", PENDING: "accent", UNVERIFIED: "neutral", EXPIRED: "danger" } as const;

export default async function CertificationsPage() {
  const user = await requireUser();
  const certifications = await getCertificationService().list(user.id);
  const today = new Date().toISOString().slice(0, 10);

  const items: ItemView[] = certifications.map((c) => {
    // Expiry is derived from the date, so a lapsed certification is flagged without a background job.
    const status = c.expirationDate && c.expirationDate < today ? "EXPIRED" : c.verificationStatus;
    return {
      id: c.id,
      title: c.name,
      subtitle: c.issuer,
      lines: [
        `Émise en ${formatMonth(c.issueDate)}${c.expirationDate ? ` · expire en ${formatMonth(c.expirationDate)}` : ""}`,
        c.credentialId ? `Credential ID : ${c.credentialId}` : "",
      ].filter(Boolean),
      badges: [{ label: VERIFICATION_STATUS_LABELS[status], tone: TONES[status] }],
      links: c.credentialUrl ? [{ label: "Voir la credential", href: c.credentialUrl }] : [],
      values: {
        name: c.name,
        issuer: c.issuer,
        issueDate: c.issueDate,
        expirationDate: c.expirationDate ?? "",
        credentialId: c.credentialId ?? "",
        credentialUrl: c.credentialUrl ?? "",
      },
    };
  });

  return (
    <>
      <PageHeader title="Certifications" description="Vos certifications et leur statut de vérification." />
      <ResourceManager resource="certification" items={items} />
    </>
  );
}
