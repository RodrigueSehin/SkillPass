import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  Building2,
  CalendarDays,
  Globe,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Plus,
  UserPlus,
  Users,
  UsersRound,
} from "lucide-react";
import { DepartmentsTable, type DepartmentRow } from "@/components/business/departments-table";
import { LogoUploader } from "@/components/business/logo-uploader";
import { OrgLogo } from "@/components/business/org-logo";
import { OrganizationForm } from "@/components/business/organization-form";
import { SitesPanel, type SiteView } from "@/components/business/sites-panel";
import { LinkTabs, NoAccess, Panel, StatCard } from "@/components/business/ui";
import { buttonVariants } from "@/components/ui/button";
import { requireBusiness } from "@/lib/business/context";
import { activeGrowth, joined, pending, siteHeadcount } from "@/lib/business/org-stats";
import { cn } from "@/lib/utils/cn";
import { getOrganizationService } from "@/services/container";

export const metadata: Metadata = { title: "Organisation" };
export const dynamic = "force-dynamic";

const TABS = [
  ["overview", "Vue d'ensemble"],
  ["informations", "Informations"],
  ["departements", "Départements"],
  ["sites", "Sites / Localisations"],
  ["parametres", "Paramètres"],
] as const;
type Tab = (typeof TABS)[number][0];

const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

function Fact({
  icon: Icon,
  label,
  children,
}: {
  icon: typeof Building2;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="text-brand flex size-10 shrink-0 items-center justify-center rounded-xl bg-blue-50">
        <Icon className="size-5" aria-hidden />
      </span>
      <div className="min-w-0">
        <p className="text-muted text-xs">{label}</p>
        <p className="text-navy truncate text-sm font-semibold">{children || "—"}</p>
      </div>
    </div>
  );
}

export default async function OrganisationPage({ searchParams }: PageProps<"/business/organisation">) {
  const ctx = await requireBusiness();
  const raw = await searchParams;
  const tab: Tab = TABS.find(([key]) => key === first(raw.tab))?.[0] ?? "overview";
  const service = getOrganizationService();
  const orgId = ctx.organization.id;
  const [members, departments, sites] = await Promise.all([
    service.listMembers(orgId),
    service.listDepartments(orgId),
    service.listSites(orgId),
  ]);
  const org = ctx.organization;
  const canEditOrg = ctx.can("org.manage");
  const canEditTeams = ctx.can("team.manage");
  const growth = activeGrowth(members);
  const byId = new Map(members.map((m) => [m.id, m]));

  const rows: DepartmentRow[] = departments.map((d) => {
    const head = d.headId ? byId.get(d.headId) : undefined;
    return {
      id: d.id,
      name: d.name,
      description: d.description,
      look: d.look,
      draft: d.status === "DRAFT",
      head: head ? { firstName: head.firstName, lastName: head.lastName } : null,
      members: d.members.length,
    };
  });
  const siteViews: SiteView[] = sites.map((s) => ({ ...s, members: siteHeadcount(members, s.id) }));
  const invited = pending(members);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-navy text-2xl font-bold tracking-tight sm:text-3xl">Organisation</h1>
        <p className="text-muted mt-1">
          Gérez les informations de votre organisation, vos départements et vos paramètres de collaboration.
        </p>
      </div>

      <LinkTabs
        label="Sections de l'organisation"
        current={tab}
        tabs={TABS.map(([key, label]) => ({
          key,
          label,
          href: key === "overview" ? "/business/organisation" : `/business/organisation?tab=${key}`,
        }))}
      />

      {tab === "overview" && (
        <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
          <div className="min-w-0 space-y-6">
            <Panel className="p-6">
              <div className="flex flex-wrap items-start gap-5">
                <span className="relative">
                  <OrgLogo name={org.name} version={org.logoVersion} className="size-20 text-2xl" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h2 className="text-navy flex flex-wrap items-center gap-2 text-2xl font-bold">
                        {org.name}
                        {org.verified && (
                          <span className="flex items-center gap-1.5 rounded-md bg-green-50 px-2.5 py-1 text-xs font-semibold text-green-700">
                            <BadgeCheck className="size-4" aria-hidden /> Organisation vérifiée
                          </span>
                        )}
                      </h2>
                      {org.description && <p className="text-muted mt-1 text-sm">{org.description}</p>}
                    </div>
                    {canEditOrg && (
                      <Link
                        href="/business/organisation?tab=informations"
                        className="border-brand/40 text-brand flex h-10 items-center gap-2 rounded-xl border bg-white px-4 text-sm font-semibold hover:bg-blue-50"
                      >
                        <Pencil className="size-4" aria-hidden /> Modifier les informations
                      </Link>
                    )}
                  </div>
                </div>
              </div>
              <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <Fact icon={Building2} label="Industrie">
                  {org.industry}
                </Fact>
                <Fact icon={Users} label="Taille">
                  {org.size}
                </Fact>
                <Fact icon={MapPin} label="Localisation">
                  {org.address}
                </Fact>
                <Fact icon={Globe} label="Site web">
                  {org.website}
                </Fact>
              </div>
            </Panel>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard
                icon={UsersRound}
                tone="bg-blue-50 text-brand"
                value={growth.active}
                label="Membres actifs"
                chip={
                  growth.deltaPercent === null
                    ? null
                    : {
                        text: `${growth.deltaPercent >= 0 ? "+" : ""}${growth.deltaPercent}%`,
                        tone: growth.deltaPercent < 0 ? "down" : "up",
                      }
                }
                caption={growth.deltaPercent === null ? "Nouvelle organisation" : "sur le mois dernier"}
              />
              <StatCard
                icon={Building2}
                tone="bg-violet-100 text-violet-700"
                value={departments.length}
                label="Départements"
                caption={`${departments.filter((d) => d.headId).length} avec responsable`}
              />
              <StatCard
                icon={MapPin}
                tone="bg-green-100 text-green-700"
                value={sites.length}
                label="Sites / Localisations"
                caption={`${joined(members).filter((m) => m.siteId).length} membres rattachés`}
              />
              <StatCard
                icon={UserPlus}
                tone="bg-orange-100 text-orange-600"
                value={invited.length}
                label="Invitations en attente"
                caption={invited.length ? "à relancer si besoin" : "aucune en attente"}
              />
            </div>

            <Panel>
              <div className="flex flex-wrap items-start justify-between gap-3 p-5 pb-3">
                <div>
                  <h2 className="text-navy font-bold">Départements</h2>
                  <p className="text-muted mt-1 text-sm">
                    Organisez votre équipe par départements pour mieux gérer les accès et les évaluations.
                  </p>
                </div>
                {canEditTeams && (
                  <Link
                    href="/business/organisation/departements/nouveau"
                    className="border-brand/40 text-brand flex h-10 items-center gap-2 rounded-xl border bg-white px-4 text-sm font-semibold hover:bg-blue-50"
                  >
                    <Plus className="size-4" aria-hidden /> Ajouter un département
                  </Link>
                )}
              </div>
              <DepartmentsTable rows={rows.slice(0, 6)} canEdit={canEditTeams} />
              {rows.length > 0 && (
                <div className="p-5 pt-3">
                  <Link
                    href="/business/organisation?tab=departements"
                    className="border-brand/40 text-brand inline-flex h-9 items-center gap-2 rounded-lg border px-3 text-sm font-semibold hover:bg-blue-50"
                  >
                    Voir tous les départements <ArrowRight className="size-4" aria-hidden />
                  </Link>
                </div>
              )}
            </Panel>
          </div>

          <aside className="grid min-w-0 gap-6 md:grid-cols-2 xl:grid-cols-1">
            <Panel className="p-5">
              <h2 className="text-navy font-bold">Logo et identité visuelle</h2>
              <LogoUploader name={org.name} version={org.logoVersion} canEdit={canEditOrg} />
            </Panel>
            <Panel className="p-5">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-navy font-bold">Informations de contact</h2>
                {canEditOrg && (
                  <Link
                    href="/business/organisation?tab=informations"
                    className="border-brand/40 text-brand flex h-9 items-center gap-1.5 rounded-lg border px-3 text-sm font-semibold hover:bg-blue-50"
                  >
                    <Pencil className="size-3.5" aria-hidden /> Modifier
                  </Link>
                )}
              </div>
              <dl className="mt-4 space-y-3 text-sm">
                {[
                  { icon: MapPin, label: "Adresse", value: org.address },
                  { icon: Phone, label: "Téléphone", value: org.phone },
                  { icon: Mail, label: "E-mail", value: org.email },
                  { icon: Globe, label: "Site web", value: org.website },
                ].map(({ icon: Icon, label, value }) => (
                  <div key={label} className="flex items-start gap-3">
                    <Icon className="text-brand mt-0.5 size-5 shrink-0" aria-hidden />
                    <dt className="text-navy w-20 shrink-0">{label}</dt>
                    <dd className="text-brand min-w-0 break-words">
                      {value || <span className="text-muted">—</span>}
                    </dd>
                  </div>
                ))}
              </dl>
            </Panel>
            <div className="md:col-span-2 xl:col-span-1">
              <SitesPanel sites={siteViews} canEdit={canEditOrg} compact />
            </div>
          </aside>
        </div>
      )}

      {tab === "informations" &&
        (canEditOrg ? (
          <Panel className="max-w-4xl p-6">
            <h2 className="text-navy text-lg font-bold">Informations de l&apos;organisation</h2>
            <p className="text-muted mt-1 mb-5 text-sm">
              Ces informations apparaissent sur vos offres et votre profil.
            </p>
            <OrganizationForm organization={org} canEdit />
          </Panel>
        ) : (
          <NoAccess what="de modifier les informations de l'organisation" />
        ))}

      {tab === "departements" && (
        <Panel>
          <div className="flex flex-wrap items-start justify-between gap-3 p-5 pb-3">
            <div>
              <h2 className="text-navy font-bold">Départements ({departments.length})</h2>
              <p className="text-muted mt-1 text-sm">
                Chaque département a un responsable, des membres et un niveau d&apos;accès aux données.
              </p>
            </div>
            {canEditTeams && (
              <Link
                href="/business/organisation/departements/nouveau"
                className={cn(buttonVariants({ variant: "outline" }), "border-brand/40 text-brand")}
              >
                <Plus /> Ajouter un département
              </Link>
            )}
          </div>
          <DepartmentsTable rows={rows} canEdit={canEditTeams} />
        </Panel>
      )}

      {tab === "sites" && <SitesPanel sites={siteViews} canEdit={canEditOrg} />}

      {tab === "parametres" && (
        <Panel className="max-w-3xl p-6">
          <h2 className="text-navy text-lg font-bold">Paramètres de collaboration</h2>
          <p className="text-muted mt-2 text-sm">
            Ce que vos membres peuvent faire dépend de leur rôle et de leurs permissions. Vous les réglez
            depuis la page Équipes ; la sécurité, les notifications et les intégrations se trouvent dans
            Paramètres.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link href="/business/equipes?tab=roles" className={buttonVariants({ variant: "outline" })}>
              <UsersRound /> Rôles et permissions
            </Link>
            <Link href="/business/parametres" className={buttonVariants({ variant: "outline" })}>
              <CalendarDays /> Paramètres
            </Link>
          </div>
        </Panel>
      )}
    </div>
  );
}
