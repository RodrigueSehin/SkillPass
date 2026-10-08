import type { Metadata } from "next";
import Link from "next/link";
import { CalendarDays, Crown, Hash, Mail, Phone, Users, Wrench } from "lucide-react";
import { LogoUploader } from "@/components/business/logo-uploader";
import { OrganizationForm } from "@/components/business/organization-form";
import { BrandingTab } from "@/components/business/settings/branding";
import { ComplianceTab } from "@/components/business/settings/compliance";
import { DangerTab } from "@/components/business/settings/danger";
import { QuickSettings } from "@/components/business/settings/general";
import { IntegrationsTab } from "@/components/business/settings/integrations";
import { parseSettingsTab, SettingsLayout } from "@/components/business/settings/layout";
import { NotificationsTab } from "@/components/business/settings/notifications";
import { SecurityTab } from "@/components/business/settings/security";
import { MemberAvatar, Panel, RolePill } from "@/components/business/ui";
import { requireBusiness } from "@/lib/business/context";
import { PLANS } from "@/lib/business/plans";
import { getOrganizationService } from "@/services/container";
import { ORG_ROLE_LABELS } from "@/types/business";

export const metadata: Metadata = { title: "Paramètres" };
export const dynamic = "force-dynamic";

const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
const DATE = new Intl.DateTimeFormat("fr-FR", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

export default async function SettingsPage({ searchParams }: PageProps<"/business/parametres">) {
  const ctx = await requireBusiness();
  const raw = await searchParams;
  const tab = parseSettingsTab(first(raw.tab));
  const org = ctx.organization;
  const canEdit = ctx.can("org.manage");
  const isAdmin = ctx.member.role === "ADMIN";

  let content: React.ReactNode;
  if (tab === "general") {
    const members = await getOrganizationService().listMembers(org.id);
    const admin = members.find((m) => m.role === "ADMIN" && m.status === "ACTIVE");
    content = (
      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <Panel className="min-w-0 p-6">
          <h2 className="text-navy text-xl font-bold">Informations générales</h2>
          <p className="text-muted text-sm">
            Mettez à jour les informations principales de votre organisation.
          </p>
          <div className="mt-5">
            <p className="text-sm font-semibold">Logo de l&apos;organisation</p>
            <div className="mt-2">
              <LogoUploader name={org.name} version={org.logoVersion} canEdit={canEdit} />
            </div>
          </div>
          <div className="mt-6">
            <OrganizationForm organization={org} canEdit={canEdit} />
          </div>
        </Panel>
        <aside className="space-y-6">
          <QuickSettings maintenance={org.settings.maintenance} canEdit={canEdit} />
          {admin && (
            <Panel className="p-5">
              <h2 className="text-navy font-bold">Contact administrateur</h2>
              <p className="text-muted text-sm">Personne principale pour la gestion du compte.</p>
              <div className="mt-4 flex items-center gap-3">
                <MemberAvatar member={admin} className="size-14 text-base" />
                <div className="min-w-0 flex-1">
                  <p className="text-navy font-bold">
                    {admin.firstName} {admin.lastName}
                  </p>
                  <RolePill role={admin.role} label={ORG_ROLE_LABELS[admin.role]} />
                </div>
                {ctx.can("team.manage") && (
                  <Link
                    href="/business/equipes"
                    className="border-brand/40 text-brand flex h-9 items-center rounded-lg border px-3 text-sm font-semibold hover:bg-blue-50"
                  >
                    Modifier
                  </Link>
                )}
              </div>
              <ul className="text-navy mt-4 space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <Mail className="text-muted size-4" aria-hidden /> {admin.email}
                </li>
                {admin.phone && (
                  <li className="flex items-center gap-2">
                    <Phone className="text-muted size-4" aria-hidden /> {admin.phone}
                  </li>
                )}
              </ul>
            </Panel>
          )}
          <Panel className="p-5">
            <h2 className="text-navy font-bold">Informations du compte</h2>
            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex items-center gap-3">
                <Hash className="text-muted size-4" aria-hidden />
                <dt className="text-muted w-32">ID organisation</dt>
                <dd className="text-navy truncate font-mono text-xs">{org.id}</dd>
              </div>
              <div className="flex items-center gap-3">
                <CalendarDays className="text-muted size-4" aria-hidden />
                <dt className="text-muted w-32">Date de création</dt>
                <dd className="text-navy">{DATE.format(new Date(org.createdAt))}</dd>
              </div>
              <div className="flex items-center gap-3">
                <Crown className="text-muted size-4" aria-hidden />
                <dt className="text-muted w-32">Plan actuel</dt>
                <dd className="text-navy font-semibold">{PLANS[org.plan].name}</dd>
                <Link
                  href="/business/abonnements"
                  className="text-brand ml-auto text-xs font-semibold hover:underline"
                >
                  Voir les détails
                </Link>
              </div>
              <div className="flex items-center gap-3">
                <Wrench className="text-muted size-4" aria-hidden />
                <dt className="text-muted w-32">Statut</dt>
                <dd>
                  <span
                    className={
                      org.settings.maintenance
                        ? "rounded-md bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700"
                        : "rounded-md bg-green-50 px-2 py-0.5 text-xs font-semibold text-green-700"
                    }
                  >
                    {org.settings.maintenance ? "Maintenance" : "Actif"}
                  </span>
                </dd>
              </div>
              <div className="flex items-center gap-3">
                <Users className="text-muted size-4" aria-hidden />
                <dt className="text-muted w-32">Nombre de membres</dt>
                <dd className="text-navy">{members.length}</dd>
                <Link
                  href="/business/equipes"
                  className="text-brand ml-auto text-xs font-semibold hover:underline"
                >
                  Gérer les membres
                </Link>
              </div>
            </dl>
          </Panel>
        </aside>
      </div>
    );
  } else if (tab === "security") content = <SecurityTab />;
  else if (tab === "notifications")
    content = (
      <NotificationsTab initial={org.settings.notifications} timezone={org.timezone} canEdit={canEdit} />
    );
  else if (tab === "integrations")
    content = <IntegrationsTab category={first(raw.cat) ?? "all"} query={first(raw.q) ?? ""} />;
  else if (tab === "branding")
    content = (
      <BrandingTab
        initial={org.settings.branding}
        organizationName={org.name}
        canEdit={canEdit}
        logo={<LogoUploader name={org.name} version={org.logoVersion} canEdit={canEdit} />}
      />
    );
  else if (tab === "compliance")
    content = <ComplianceTab initial={org.settings.compliance} canEdit={canEdit} />;
  else content = <DangerTab organizationName={org.name} isAdmin={isAdmin} />;

  return <SettingsLayout tab={tab}>{content}</SettingsLayout>;
}
