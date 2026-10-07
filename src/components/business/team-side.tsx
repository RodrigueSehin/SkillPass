import Link from "next/link";
import { cn } from "@/lib/utils/cn";
import { ORG_ROLE_LABELS, type MemberInvite, type OrgRole } from "@/types/business";
import { shortDate } from "@/lib/business/org-stats";
import { MemberAvatar, Panel, RolePill } from "./ui";

const ROLE_COLORS: Record<OrgRole, string> = {
  ADMIN: "#7C3AED",
  RECRUITER: "#2563EB",
  MANAGER: "#F59E0B",
  EVALUATOR: "#16A34A",
  VIEWER: "#94A3B8",
};
const PLURAL: Record<OrgRole, string> = {
  ADMIN: "Administrateurs",
  RECRUITER: "Recruteurs",
  MANAGER: "Managers",
  EVALUATOR: "Évaluateurs",
  VIEWER: "Autres",
};
const BAR_COLORS = ["#2563EB", "#7C3AED", "#F59E0B", "#16A34A", "#EC4899", "#94A3B8"];

/** Members by role as a donut (pure SVG, rendered on the server) with its legend. */
export function RoleDonut({ roles, total }: { roles: { role: OrgRole; count: number }[]; total: number }) {
  const size = 132;
  const stroke = 18;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const used = roles.filter((x) => x.count > 0);
  const arcs = used.reduce<{ role: OrgRole; count: number; len: number; start: number }[]>((acc, x) => {
    const len = (x.count / Math.max(1, total)) * c;
    const start = acc.length ? acc[acc.length - 1].start + acc[acc.length - 1].len : 0;
    return [...acc, { ...x, len, start }];
  }, []);
  const order: OrgRole[] = ["ADMIN", "RECRUITER", "MANAGER", "EVALUATOR", "VIEWER"];

  return (
    <Panel className="p-5">
      <h2 className="text-navy font-bold">Répartition des membres</h2>
      <div className="mt-4 flex items-center gap-5">
        <div className="relative shrink-0" style={{ width: size, height: size }}>
          <svg
            width={size}
            height={size}
            viewBox={`0 0 ${size} ${size}`}
            role="img"
            aria-label="Répartition des membres par rôle"
          >
            <g transform={`rotate(-90 ${size / 2} ${size / 2})`} fill="none" strokeWidth={stroke}>
              <circle cx={size / 2} cy={size / 2} r={r} stroke="#E2E8F0" />
              {arcs.map((a) => (
                <circle
                  key={a.role}
                  cx={size / 2}
                  cy={size / 2}
                  r={r}
                  stroke={ROLE_COLORS[a.role]}
                  strokeDasharray={`${a.len} ${c - a.len}`}
                  strokeDashoffset={-a.start}
                />
              ))}
            </g>
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center leading-tight">
            <span className="text-navy text-2xl font-extrabold">{total}</span>
            <span className="text-muted text-xs">membres</span>
          </div>
        </div>
        <ul className="min-w-0 flex-1 space-y-2 text-sm">
          {order.map((role) => (
            <li key={role} className="flex items-center gap-2.5">
              <span
                aria-hidden
                className="size-2.5 shrink-0 rounded-full"
                style={{ background: ROLE_COLORS[role] }}
              />
              <span className="text-navy truncate">{PLURAL[role]}</span>
              <span className="text-navy ml-auto font-semibold">
                {roles.find((x) => x.role === role)?.count ?? 0}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </Panel>
  );
}

export function TeamBars({ teams }: { teams: { id: string; name: string; count: number }[] }) {
  const max = Math.max(1, ...teams.map((t) => t.count));
  return (
    <Panel className="p-5">
      <h2 className="text-navy font-bold">Répartition par équipe</h2>
      {teams.length === 0 ? (
        <p className="text-muted mt-3 text-sm">
          Affectez vos membres à des équipes pour voir la répartition.
        </p>
      ) : (
        <ul className="mt-4 space-y-3">
          {teams.slice(0, 6).map((t, i) => (
            <li key={t.id} className="flex items-center gap-3 text-sm">
              <span className="text-navy w-24 shrink-0 truncate">{t.name}</span>
              <span className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
                <span
                  className="block h-full rounded-full"
                  style={{
                    width: `${(t.count / max) * 100}%`,
                    background: BAR_COLORS[i % BAR_COLORS.length],
                  }}
                />
              </span>
              <span className="text-navy w-4 text-right font-semibold">{t.count}</span>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}

export function PendingInvitations({ invites, timeZone }: { invites: MemberInvite[]; timeZone: string }) {
  const latest = [...invites]
    .sort((a, b) => (b.invitedAt ?? "").localeCompare(a.invitedAt ?? ""))
    .slice(0, 3);
  return (
    <Panel className="p-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-navy font-bold">Invitations en attente</h2>
        {invites.length > 0 && (
          <Link
            href="/business/equipes?tab=invitations"
            className="text-brand text-sm font-semibold hover:underline"
          >
            Voir tout
          </Link>
        )}
      </div>
      {latest.length === 0 ? (
        <p className="text-muted mt-3 text-sm">Aucune invitation en attente.</p>
      ) : (
        <ul className="mt-3 divide-y divide-slate-100">
          {latest.map((m) => (
            <li key={m.id} className="flex items-center gap-3 py-3">
              <MemberAvatar member={m} className="text-brand size-11 bg-blue-100" />
              <div className="min-w-0 flex-1">
                <p className="text-navy truncate text-sm font-semibold">
                  {m.firstName} {m.lastName}
                </p>
                <p className="text-muted truncate text-xs">{m.email}</p>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1">
                <RolePill role={m.role} label={ORG_ROLE_LABELS[m.role]} />
                <span className={cn("text-muted text-[11px]")}>
                  Envoyée le {shortDate(m.invitedAt, timeZone)}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}
