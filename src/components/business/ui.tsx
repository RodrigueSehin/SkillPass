import Link from "next/link";
import { BarChart3, Coins, Megaphone, Monitor, Settings, Truck, Users, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import {
  memberInitials,
  type DepartmentLook,
  type MemberDTO,
  type MemberStatus,
  type OrgRole,
} from "@/types/business";

export const LOOKS: Record<DepartmentLook, { icon: LucideIcon; tone: string; label: string }> = {
  users: { icon: Users, tone: "bg-blue-100 text-brand", label: "Équipe" },
  settings: { icon: Settings, tone: "bg-orange-100 text-orange-600", label: "Direction" },
  truck: { icon: Truck, tone: "bg-emerald-100 text-emerald-700", label: "Logistique" },
  chart: { icon: BarChart3, tone: "bg-violet-100 text-violet-700", label: "Commercial" },
  monitor: { icon: Monitor, tone: "bg-red-100 text-red-600", label: "Technique" },
  coins: { icon: Coins, tone: "bg-amber-100 text-amber-600", label: "Finance" },
  megaphone: { icon: Megaphone, tone: "bg-pink-100 text-pink-600", label: "Communication" },
};

export function DepartmentBadge({ look, className }: { look: DepartmentLook; className?: string }) {
  const { icon: Icon, tone } = LOOKS[look] ?? LOOKS.users;
  return (
    <span
      aria-hidden
      className={cn("flex size-9 shrink-0 items-center justify-center rounded-lg", tone, className)}
    >
      <Icon className="size-5" />
    </span>
  );
}

const AVATAR_TONES = [
  "bg-blue-600",
  "bg-emerald-600",
  "bg-violet-600",
  "bg-orange-500",
  "bg-rose-600",
  "bg-cyan-600",
];

/** Initials on a colour picked from the name, so the same person always looks the same. */
export function MemberAvatar({
  member,
  className,
}: {
  member: Pick<MemberDTO, "firstName" | "lastName">;
  className?: string;
}) {
  const seed = `${member.firstName}${member.lastName}`;
  const tone = AVATAR_TONES[[...seed].reduce((sum, ch) => sum + ch.charCodeAt(0), 0) % AVATAR_TONES.length];
  return (
    <span
      aria-hidden
      className={cn(
        "flex size-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white",
        tone,
        className,
      )}
    >
      {memberInitials(member) || "?"}
    </span>
  );
}

const ROLE_TONES: Record<OrgRole, string> = {
  ADMIN: "bg-violet-100 text-violet-700",
  MANAGER: "bg-orange-100 text-orange-700",
  RECRUITER: "bg-blue-100 text-brand",
  EVALUATOR: "bg-emerald-100 text-emerald-700",
  VIEWER: "bg-slate-100 text-slate-600",
};

export function RolePill({ role, label }: { role: OrgRole; label: string }) {
  return (
    <span className={cn("rounded-md px-2.5 py-1 text-xs font-semibold", ROLE_TONES[role])}>{label}</span>
  );
}

const STATUS_TONES: Record<MemberStatus, string> = {
  ACTIVE: "bg-green-50 text-green-700",
  INACTIVE: "bg-red-50 text-red-600",
  INVITED: "bg-amber-50 text-amber-700",
};

export function StatusPill({ status, label }: { status: MemberStatus; label: string }) {
  return (
    <span className={cn("rounded-md px-2.5 py-1 text-xs font-semibold", STATUS_TONES[status])}>{label}</span>
  );
}

export function Panel({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLElement> & { children: React.ReactNode }) {
  return (
    <section className={cn("border-border/60 shadow-soft rounded-2xl border bg-white", className)} {...props}>
      {children}
    </section>
  );
}

export function StatCard({
  icon: Icon,
  tone,
  value,
  label,
  chip,
  caption,
}: {
  icon: LucideIcon;
  tone: string;
  value: React.ReactNode;
  label: string;
  /** Trend or note shown next to the value, e.g. "+18%". */
  chip?: { text: string; tone?: "up" | "down" | "flat" } | null;
  caption?: string;
}) {
  return (
    <Panel className="flex items-center gap-4 p-5">
      <span className={cn("flex size-14 shrink-0 items-center justify-center rounded-2xl", tone)}>
        <Icon className="size-7" aria-hidden />
      </span>
      <div className="min-w-0">
        <p className="flex flex-wrap items-baseline gap-2">
          <span className="text-navy text-2xl leading-none font-bold tracking-tight">{value}</span>
          {chip && (
            <span
              className={cn(
                "rounded-md px-1.5 py-0.5 text-xs font-semibold",
                chip.tone === "down"
                  ? "bg-red-50 text-red-600"
                  : chip.tone === "flat"
                    ? "bg-slate-100 text-slate-600"
                    : "bg-green-50 text-green-700",
              )}
            >
              {chip.text}
            </span>
          )}
        </p>
        <p className="text-muted mt-1 text-sm">{label}</p>
        {caption && <p className="text-muted text-xs">{caption}</p>}
      </div>
    </Panel>
  );
}

/** Tab strip made of links, so each tab is a shareable URL and the page stays a Server Component. */
export function LinkTabs({
  tabs,
  current,
  label,
}: {
  tabs: { href: string; label: string; key: string }[];
  current: string;
  label: string;
}) {
  return (
    <nav
      aria-label={label}
      className="border-border/60 flex gap-6 overflow-x-auto overflow-y-hidden border-b"
    >
      {tabs.map((t) => (
        <Link
          key={t.key}
          href={t.href}
          aria-current={t.key === current ? "page" : undefined}
          className={cn(
            "-mb-px shrink-0 border-b-2 px-1 py-3 text-sm font-medium transition-colors",
            t.key === current
              ? "border-brand text-brand font-semibold"
              : "text-navy hover:text-brand border-transparent",
          )}
        >
          {t.label}
        </Link>
      ))}
    </nav>
  );
}

export function NoAccess({ what }: { what: string }) {
  return (
    <Panel className="mx-auto max-w-xl p-8 text-center">
      <h1 className="text-navy text-xl font-bold">Accès non autorisé</h1>
      <p className="text-muted mt-2 text-sm">
        Votre rôle ne permet pas {what}. Demandez à un administrateur de votre organisation de vous donner
        cette permission.
      </p>
    </Panel>
  );
}
