import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight, ExternalLink, Globe, Mail, MapPin, Phone } from "lucide-react";
import { MemberAccess } from "@/components/admin/member-access";
import { OrgActions } from "@/components/admin/org-actions";
import { DATE, OrgStatusPills } from "@/components/admin/pills";
import { Panel } from "@/components/business/ui";
import { requirePlatformAdmin } from "@/lib/auth/platform-admin";
import { PLANS } from "@/lib/business/plans";
import { NotFoundError } from "@/lib/errors";
import { getPlatformAdminService } from "@/services/container";

export const metadata: Metadata = { title: "Examen d'une entreprise", robots: { index: false } };

export default async function AdminOrganizationPage({ params }: PageProps<"/admin/entreprises/[id]">) {
  const { user } = await requirePlatformAdmin();
  const { id } = await params;
  let detail;
  try {
    detail = await getPlatformAdminService().organization(user.id, id);
  } catch (err) {
    if (err instanceof NotFoundError) notFound();
    throw err;
  }
  const { organization: o, members, offers, contactName, contactEmail } = detail;

  return (
    <div className="space-y-6">
      <nav aria-label="Fil d'Ariane" className="text-muted flex items-center gap-2 text-sm">
        <Link href="/admin/entreprises" className="hover:text-brand">
          Entreprises
        </Link>
        <ChevronRight className="size-3.5" aria-hidden />
        <span className="text-navy font-medium">{o.name}</span>
      </nav>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-navy text-2xl font-bold tracking-tight sm:text-3xl">{o.name}</h1>
          <p className="text-muted mt-1">
            Inscrite le {DATE.format(new Date(o.createdAt))} · Plan {PLANS[o.plan].name}
            {o.verifiedAt ? ` · validée le ${DATE.format(new Date(o.verifiedAt))}` : ""}
          </p>
        </div>
        <OrgStatusPills status={o.verificationStatus} suspended={o.deactivated} />
      </div>

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="min-w-0 space-y-6">
          <Panel className="p-5">
            <h2 className="text-navy font-bold">Décision</h2>
            <p className="text-muted mb-4 text-sm">
              Vérifiez que l&apos;entreprise existe et que la personne qui l&apos;a créée la représente, puis
              décidez.
            </p>
            <OrgActions
              id={o.id}
              status={o.verificationStatus}
              suspended={o.deactivated}
              plan={o.plan}
              maintenance={o.settings.maintenance}
            />
            {o.verificationStatus === "REJECTED" && o.rejectionReason && (
              <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800">
                <span className="font-semibold">Motif du refus : </span>
                {o.rejectionReason}
              </p>
            )}
          </Panel>

          <Panel className="p-5">
            <h2 className="text-navy font-bold">
              Membres et permissions <span className="text-muted font-normal">({members.length})</span>
            </h2>
            <p className="text-muted mb-4 text-sm">
              Modifiez le rôle, les permissions et l&apos;état de chaque compte de cette entreprise.
            </p>
            <ul className="space-y-2">
              {members.map((m) => (
                <MemberAccess key={m.id} orgId={o.id} member={m} plan={o.plan} />
              ))}
            </ul>
          </Panel>

          <Panel className="p-5">
            <h2 className="text-navy font-bold">
              Offres d&apos;emploi <span className="text-muted font-normal">({offers.length})</span>
            </h2>
            {offers.length === 0 ? (
              <p className="text-muted mt-3 text-sm">Aucune offre créée.</p>
            ) : (
              <ul className="divide-border/60 mt-3 divide-y text-sm">
                {offers.map((offer) => (
                  <li key={offer.id} className="flex items-center justify-between gap-3 py-2.5">
                    <span className="text-navy min-w-0 flex-1 truncate font-medium">{offer.title}</span>
                    <span className="text-muted text-xs">{DATE.format(new Date(offer.createdAt))}</span>
                    <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">
                      {offer.status}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>

        <aside className="space-y-6">
          <Panel className="p-5">
            <h2 className="text-navy font-bold">Informations déclarées</h2>
            <ul className="mt-3 space-y-2.5 text-sm">
              <li className="flex items-center gap-2.5">
                <Mail className="text-muted size-4 shrink-0" aria-hidden />
                <span className="text-navy min-w-0 truncate">
                  {contactName ?? "—"} {contactEmail ? `· ${contactEmail}` : ""}
                </span>
              </li>
              {o.website && (
                <li className="flex items-center gap-2.5">
                  <Globe className="text-muted size-4 shrink-0" aria-hidden />
                  <a
                    href={o.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-brand flex min-w-0 items-center gap-1 truncate hover:underline"
                  >
                    {o.website} <ExternalLink className="size-3 shrink-0" aria-hidden />
                  </a>
                </li>
              )}
              {o.phone && (
                <li className="flex items-center gap-2.5">
                  <Phone className="text-muted size-4 shrink-0" aria-hidden /> {o.phone}
                </li>
              )}
              {o.address && (
                <li className="flex items-center gap-2.5">
                  <MapPin className="text-muted size-4 shrink-0" aria-hidden /> {o.address}
                </li>
              )}
              <li className="text-muted text-xs">
                {[o.industry, o.size].filter(Boolean).join(" · ") || "Domaine et taille non renseignés"}
              </li>
            </ul>
          </Panel>

          <Panel className="p-5">
            <h2 className="text-navy font-bold">Justificatif de l&apos;entreprise</h2>
            {o.verificationNote ? (
              <p className="text-navy/90 mt-3 text-sm whitespace-pre-line">{o.verificationNote}</p>
            ) : (
              <p className="text-muted mt-3 text-sm">
                L&apos;entreprise n&apos;a ajouté aucune information. Vous pouvez refuser en demandant un
                justificatif.
              </p>
            )}
          </Panel>
        </aside>
      </div>
    </div>
  );
}
