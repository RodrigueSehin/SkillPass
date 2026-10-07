import type { Metadata } from "next";
import Link from "next/link";
import { Check, Minus, Plus, ShieldCheck, UserPlus, UsersRound } from "lucide-react";
import { MembersFilters } from "@/components/business/members-controls";
import { MembersTable, type MemberRow } from "@/components/business/members-table";
import { Pagination } from "@/components/business/pagination";
import { PendingInvitations, RoleDonut, TeamBars } from "@/components/business/team-side";
import { DepartmentBadge, LinkTabs, Panel, StatCard } from "@/components/business/ui";
import { requireBusiness } from "@/lib/business/context";
import { filterMembers, MEMBERS_PER_PAGE } from "@/lib/business/members-view";
import {
  activeGrowth,
  activityLabel,
  joined,
  pending,
  roleDistribution,
  teamDistribution,
} from "@/lib/business/org-stats";
import { PERMISSION_GROUPS, ROLE_PRESETS } from "@/lib/business/permissions";
import { paginate } from "@/lib/project-view";
import { cn } from "@/lib/utils/cn";
import { getOrganizationService } from "@/services/container";
import { ORG_ROLES, ORG_ROLE_DESCRIPTIONS, ORG_ROLE_LABELS, type MemberDTO } from "@/types/business";
import { buttonVariants } from "@/components/ui/button";

export const metadata: Metadata = { title: "Équipes" };
export const dynamic = "force-dynamic";

const TABS = [
  ["members", "Membres"],
  ["teams", "Équipes"],
  ["roles", "Rôles et permissions"],
  ["invitations", "Invitations"],
] as const;
type Tab = (typeof TABS)[number][0];

const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

export default async function TeamsPage({ searchParams }: PageProps<"/business/equipes">) {
  const ctx = await requireBusiness();
  const raw = await searchParams;
  const tab: Tab = TABS.find(([key]) => key === first(raw.tab))?.[0] ?? "members";
  const service = getOrganizationService();
  const orgId = ctx.organization.id;
  const tz = ctx.organization.timezone;
  const [members, departments] = await Promise.all([
    service.listMembers(orgId),
    service.listDepartments(orgId),
  ]);
  const canEdit = ctx.can("team.manage");
  const now = new Date();

  const teamOf = (m: MemberDTO) => {
    const main = m.teams.find((t) => t.primary) ?? m.teams[0];
    return departments.find((d) => d.id === main?.departmentId)?.name ?? null;
  };
  const toRow = (m: MemberDTO): MemberRow => ({
    id: m.id,
    firstName: m.firstName,
    lastName: m.lastName,
    email: m.email,
    role: m.role,
    permissions: m.permissions,
    status: m.status,
    team: teamOf(m),
    activity: activityLabel(m.lastActiveAt, now, tz),
    isSelf: m.id === ctx.member.id,
  });

  const filtered = filterMembers(
    members,
    { q: first(raw.q), team: first(raw.team), role: first(raw.role), status: first(raw.status) },
    departments,
  );
  const { page, pages, items } = paginate(filtered, Number(first(raw.page)), MEMBERS_PER_PAGE);
  const growth = activeGrowth(members, now);
  const roles = roleDistribution(members);
  const invited = pending(members);
  const usedRoles = roles.filter((r) => r.count > 0).length;
  const invites = canEdit ? await service.listInvites(orgId) : [];
  const invitesPending = invites.filter((m) => m.status === "INVITED");

  const hrefFor = (n: number) => {
    const next = new URLSearchParams();
    for (const [key, value] of Object.entries(raw)) {
      const v = first(value);
      if (v && key !== "page") next.set(key, v);
    }
    if (n > 1) next.set("page", String(n));
    const qs = next.toString();
    return qs ? `/business/equipes?${qs}` : "/business/equipes";
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-navy text-2xl font-bold tracking-tight sm:text-3xl">Équipes</h1>
          <p className="text-muted mt-1">
            Gérez les membres de votre organisation et leurs rôles sur SkillPass.
          </p>
        </div>
        {canEdit && (
          <Link href="/business/equipes/membres/nouveau" className={cn(buttonVariants(), "h-12 px-6")}>
            <Plus /> Ajouter un membre
          </Link>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={UsersRound}
          tone="bg-blue-50 text-brand"
          value={joined(members).length}
          label="Membres"
          chip={growth.newThisMonth > 0 ? { text: `↑ ${growth.newThisMonth} ce mois` } : null}
        />
        <StatCard icon={ShieldCheck} tone="bg-violet-100 text-violet-700" value={usedRoles} label="Rôles" />
        <StatCard
          icon={UsersRound}
          tone="bg-orange-100 text-orange-600"
          value={departments.length}
          label="Équipes"
        />
        <StatCard
          icon={UserPlus}
          tone="bg-blue-50 text-brand"
          value={invited.length}
          label="Invitations en attente"
        />
      </div>

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <Panel className="min-w-0">
          <div className="px-5 pt-1">
            <LinkTabs
              label="Sections des équipes"
              current={tab}
              tabs={TABS.map(([key, label]) => ({
                key,
                label,
                href: key === "members" ? "/business/equipes" : `/business/equipes?tab=${key}`,
              }))}
            />
          </div>

          {tab === "members" && (
            <>
              <MembersFilters teams={departments.map((d) => ({ id: d.id, name: d.name }))} />
              <MembersTable rows={items.map(toRow)} canEdit={canEdit} />
              <Pagination
                page={page}
                pages={pages}
                total={filtered.length}
                size={MEMBERS_PER_PAGE}
                noun="membres"
                hrefFor={hrefFor}
              />
            </>
          )}

          {tab === "teams" && (
            <div className="grid gap-4 p-5 sm:grid-cols-2">
              {departments.length === 0 && (
                <p className="text-muted col-span-full py-6 text-center text-sm">
                  Aucune équipe pour l&apos;instant.
                </p>
              )}
              {departments.map((d) => {
                const head = members.find((m) => m.id === d.headId);
                return (
                  <div key={d.id} className="border-border/70 flex items-start gap-3 rounded-xl border p-4">
                    <DepartmentBadge look={d.look} className="size-11" />
                    <div className="min-w-0 flex-1">
                      <p className="text-navy font-bold">{d.name}</p>
                      <p className="text-muted text-xs">
                        {d.members.length} membre{d.members.length > 1 ? "s" : ""}
                        {head ? ` · ${head.firstName} ${head.lastName}` : ""}
                      </p>
                      {d.description && (
                        <p className="text-muted mt-1 line-clamp-2 text-xs">{d.description}</p>
                      )}
                    </div>
                    {canEdit && (
                      <Link
                        href={`/business/organisation/departements/${d.id}/modifier`}
                        className="text-brand text-sm font-semibold hover:underline"
                      >
                        Modifier
                      </Link>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {tab === "roles" && (
            <div className="overflow-x-auto p-5">
              <table className="w-full min-w-[640px] text-left text-sm">
                <caption className="text-muted pb-3 text-left text-sm">
                  Permissions données par défaut à chaque rôle. Elles peuvent être ajustées membre par membre.
                </caption>
                <thead>
                  <tr className="text-navy border-b border-slate-100 text-xs font-semibold">
                    <th scope="col" className="py-3 pr-3">
                      Permission
                    </th>
                    {ORG_ROLES.map((r) => (
                      <th key={r} scope="col" className="px-3 py-3 text-center">
                        <span className="block">{ORG_ROLE_LABELS[r]}</span>
                        <span className="text-muted block text-[11px] font-normal">
                          {roles.find((x) => x.role === r)?.count ?? 0} membre(s)
                        </span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {PERMISSION_GROUPS.map((g) => (
                    <FragmentRows key={g.key} title={g.title} permissions={g.permissions} />
                  ))}
                </tbody>
              </table>
              <ul className="text-muted mt-4 space-y-1 text-xs">
                {ORG_ROLES.map((r) => (
                  <li key={r}>
                    <strong className="text-navy">{ORG_ROLE_LABELS[r]}</strong> — {ORG_ROLE_DESCRIPTIONS[r]}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {tab === "invitations" && (
            <div className="pt-3">
              <MembersTable
                rows={members.filter((m) => m.status === "INVITED").map(toRow)}
                canEdit={canEdit}
                showCheckboxes={false}
                emptyLabel="Aucune invitation en attente."
              />
            </div>
          )}
        </Panel>

        <aside className="grid min-w-0 gap-6 md:grid-cols-2 xl:grid-cols-1">
          <RoleDonut roles={roles} total={joined(members).length} />
          <TeamBars teams={teamDistribution(members, departments)} />
          <div className="md:col-span-2 xl:col-span-1">
            <PendingInvitations
              invites={canEdit ? invitesPending : invited.map((m) => ({ ...m, inviteToken: null }))}
              timeZone={tz}
            />
          </div>
        </aside>
      </div>
    </div>
  );
}

function FragmentRows({
  title,
  permissions,
}: {
  title: string;
  permissions: { key: string; label: string }[];
}) {
  return (
    <>
      <tr className="bg-slate-50">
        <th scope="colgroup" colSpan={6} className="text-navy px-3 py-2 text-xs font-bold">
          {title}
        </th>
      </tr>
      {permissions.map((p) => (
        <tr key={p.key} className="border-b border-slate-100">
          <th scope="row" className="text-navy py-2.5 pr-3 font-normal">
            {p.label}
          </th>
          {ORG_ROLES.map((r) => {
            const on = r === "ADMIN" || ROLE_PRESETS[r].includes(p.key);
            return (
              <td key={r} className="px-3 py-2.5 text-center">
                {on ? (
                  <Check className="mx-auto size-4 text-green-600" aria-label="Oui" />
                ) : (
                  <Minus className="mx-auto size-4 text-slate-300" aria-label="Non" />
                )}
              </td>
            );
          })}
        </tr>
      ))}
    </>
  );
}
