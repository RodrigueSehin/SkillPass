import type { Metadata } from "next";
import Link from "next/link";
import {
  BadgeCheck,
  Bookmark,
  BriefcaseBusiness,
  Building2,
  ClipboardCheck,
  Clock,
  FileText,
  PauseCircle,
  Users,
} from "lucide-react";
import { DATE, DATETIME, OrgStatusPills } from "@/components/admin/pills";
import { Panel, StatCard } from "@/components/business/ui";
import { requirePlatformAdmin } from "@/lib/auth/platform-admin";
import { getPlatformAdminService } from "@/services/container";
import { AUDIT_LABELS } from "@/types/platform";
import { ROLE_LABELS, type UserRole } from "@/types/profile";

export const metadata: Metadata = { title: "Console SkillPass", robots: { index: false } };

const n = (v: number) => v.toLocaleString("fr-FR");

export default async function AdminDashboardPage() {
  const { user } = await requirePlatformAdmin();
  const { stats, pending, recentProfiles, audit } = await getPlatformAdminService().dashboard(user.id);
  const roles = (Object.entries(stats.byRole) as [UserRole, number][]).sort((a, b) => b[1] - a[1]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-navy text-2xl font-bold tracking-tight sm:text-3xl">
          Vue d&apos;ensemble de la plateforme
        </h1>
        <p className="text-muted mt-1">
          Tout ce qui se passe sur SkillPass : talents, entreprises, offres, évaluations et décisions.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={Users}
          tone="bg-blue-50 text-brand"
          value={n(stats.byRole.TALENT ?? 0)}
          label="Talents inscrits"
          caption={`${n(stats.publicTalents)} avec un profil public`}
          chip={{ text: `+${stats.newTalents30d} en 30 j`, tone: "up" }}
        />
        <StatCard
          icon={Building2}
          tone="bg-emerald-50 text-emerald-700"
          value={n(stats.organizations.verified)}
          label="Entreprises validées"
          chip={{ text: `+${stats.newOrganizations30d} en 30 j`, tone: "up" }}
        />
        <Link href="/admin/entreprises?statut=PENDING" className="block">
          <StatCard
            icon={Clock}
            tone="bg-amber-50 text-amber-700"
            value={n(stats.organizations.pending)}
            label="Demandes à examiner"
            caption={stats.organizations.pending > 0 ? "Cliquez pour traiter" : "Rien en attente"}
          />
        </Link>
        <StatCard
          icon={PauseCircle}
          tone="bg-slate-100 text-slate-600"
          value={n(stats.organizations.suspended)}
          label="Entreprises suspendues"
          caption={`${n(stats.organizations.rejected)} refusée${stats.organizations.rejected > 1 ? "s" : ""}`}
        />
        <StatCard
          icon={BriefcaseBusiness}
          tone="bg-orange-100 text-orange-600"
          value={n(stats.offers.published)}
          label="Offres publiées"
          caption={`${n(stats.offers.total)} au total`}
        />
        <StatCard
          icon={FileText}
          tone="bg-violet-50 text-violet-700"
          value={n(stats.applications)}
          label="Candidatures"
        />
        <StatCard
          icon={ClipboardCheck}
          tone="bg-blue-50 text-brand"
          value={n(stats.evaluations)}
          label="Évaluations créées"
          caption={`${n(stats.attempts)} passage${stats.attempts > 1 ? "s" : ""}`}
        />
        <StatCard
          icon={Bookmark}
          tone="bg-rose-50 text-rose-600"
          value={n(stats.savedMatches)}
          label="Talents sauvegardés"
        />
      </div>

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="min-w-0 space-y-6">
          <Panel className="p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-navy font-bold">Entreprises à examiner</h2>
              <Link
                href="/admin/entreprises?statut=PENDING"
                className="text-brand text-sm font-semibold hover:underline"
              >
                Tout voir
              </Link>
            </div>
            {pending.length === 0 ? (
              <p className="text-muted mt-3 text-sm">Aucune demande en attente.</p>
            ) : (
              <ul className="divide-border/60 mt-3 divide-y">
                {pending.map(({ organization: o, contactEmail, contactName, memberCount }) => (
                  <li key={o.id} className="flex flex-wrap items-center gap-3 py-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-navy truncate font-semibold">{o.name}</p>
                      <p className="text-muted truncate text-xs">
                        {[contactName, contactEmail].filter(Boolean).join(" · ")} · inscrite le{" "}
                        {DATE.format(new Date(o.createdAt))}
                        {memberCount > 1 ? ` · ${memberCount} membres` : ""}
                      </p>
                    </div>
                    <OrgStatusPills status={o.verificationStatus} suspended={o.deactivated} />
                    <Link
                      href={`/admin/entreprises/${o.id}`}
                      className="bg-brand flex h-9 items-center rounded-lg px-4 text-sm font-semibold text-white hover:bg-blue-700"
                    >
                      Examiner
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          <Panel className="p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-navy font-bold">Derniers comptes créés</h2>
              <Link href="/admin/utilisateurs" className="text-brand text-sm font-semibold hover:underline">
                Gérer les rôles
              </Link>
            </div>
            <ul className="divide-border/60 mt-3 divide-y">
              {recentProfiles.map((p) => (
                <li key={p.id} className="flex flex-wrap items-center gap-3 py-2.5 text-sm">
                  <span className="min-w-0 flex-1">
                    <span className="text-navy block truncate font-semibold">{p.fullName}</span>
                    <span className="text-muted block truncate text-xs">{p.email}</span>
                  </span>
                  <span className="text-muted text-xs">
                    {p.organization ? p.organization.name : "Talent"}
                  </span>
                  <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">
                    {ROLE_LABELS[p.role]}
                  </span>
                </li>
              ))}
            </ul>
          </Panel>
        </div>

        <aside className="space-y-6">
          <Panel className="p-5">
            <h2 className="text-navy font-bold">Comptes par rôle</h2>
            <ul className="mt-3 space-y-2 text-sm">
              {roles.map(([role, count]) => (
                <li key={role} className="flex items-center justify-between">
                  <span className="text-navy">{ROLE_LABELS[role]}</span>
                  <span className="text-navy font-semibold">{n(count)}</span>
                </li>
              ))}
            </ul>
            <p className="text-muted mt-3 text-xs">{n(stats.profiles)} comptes au total.</p>
          </Panel>

          <Panel className="p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-navy font-bold">Dernières décisions</h2>
              <Link href="/admin/journal" className="text-brand text-sm font-semibold hover:underline">
                Journal
              </Link>
            </div>
            {audit.length === 0 ? (
              <p className="text-muted mt-3 text-sm">Aucune action enregistrée.</p>
            ) : (
              <ul className="mt-3 space-y-3 text-sm">
                {audit.map((a) => (
                  <li key={a.id}>
                    <p className="text-navy flex items-center gap-1.5 font-semibold">
                      <BadgeCheck className="text-brand size-4 shrink-0" aria-hidden />
                      {AUDIT_LABELS[a.action]}
                    </p>
                    <p className="text-muted text-xs">
                      {a.targetLabel} · {a.actorName} · {DATETIME.format(new Date(a.createdAt))}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </aside>
      </div>
    </div>
  );
}
