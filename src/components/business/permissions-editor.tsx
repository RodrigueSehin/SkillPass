"use client";

import { Briefcase, ClipboardList, Eye, Shield, UserCog, Users, type LucideIcon } from "lucide-react";
import { PERMISSION_GROUPS, ROLE_PRESETS } from "@/lib/business/permissions";
import { cn } from "@/lib/utils/cn";
import { ORG_ROLES, ORG_ROLE_DESCRIPTIONS, ORG_ROLE_LABELS, type OrgRole } from "@/types/business";

export const ROLE_ICONS: Record<OrgRole, { icon: LucideIcon; tone: string }> = {
  ADMIN: { icon: Shield, tone: "bg-violet-100 text-violet-700" },
  MANAGER: { icon: Users, tone: "bg-emerald-100 text-emerald-700" },
  RECRUITER: { icon: Briefcase, tone: "bg-violet-100 text-violet-600" },
  EVALUATOR: { icon: ClipboardList, tone: "bg-orange-100 text-orange-600" },
  VIEWER: { icon: Eye, tone: "bg-blue-100 text-brand" },
};

const GROUP_ICONS: Record<string, { icon: LucideIcon; tone: string }> = {
  talents: { icon: Users, tone: "bg-violet-100 text-violet-700" },
  jobs: { icon: Briefcase, tone: "bg-emerald-100 text-emerald-700" },
  evaluations: { icon: ClipboardList, tone: "bg-orange-100 text-orange-600" },
  administration: { icon: UserCog, tone: "bg-blue-100 text-brand" },
};

/**
 * Role cards and the detailed permission boxes. Picking a role ticks its preset; the boxes can then be
 * adjusted one by one. An administrator always holds every permission, whatever the boxes say.
 */
export function PermissionsEditor({
  role,
  permissions,
  onChange,
}: {
  role: OrgRole;
  permissions: string[];
  onChange: (role: OrgRole, permissions: string[]) => void;
}) {
  const toggle = (key: string) =>
    onChange(role, permissions.includes(key) ? permissions.filter((p) => p !== key) : [...permissions, key]);

  return (
    <div className="space-y-6">
      <div role="radiogroup" aria-label="Rôle" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {ORG_ROLES.map((r) => {
          const { icon: Icon, tone } = ROLE_ICONS[r];
          const on = role === r;
          return (
            <label
              key={r}
              className={cn(
                "focus-within:ring-brand/40 relative flex cursor-pointer flex-col items-center rounded-xl border p-3 text-center focus-within:ring-2",
                on ? "border-brand bg-blue-50/60" : "border-border hover:bg-slate-50",
              )}
            >
              <input
                type="radio"
                name="role"
                value={r}
                checked={on}
                onChange={() => onChange(r, ROLE_PRESETS[r])}
                className="sr-only"
              />
              {on && (
                <span
                  aria-hidden
                  className="bg-brand absolute top-2 left-2 flex size-5 items-center justify-center rounded-full text-[10px] text-white"
                >
                  ✓
                </span>
              )}
              <span className={cn("flex size-10 items-center justify-center rounded-lg", tone)}>
                <Icon className="size-5" aria-hidden />
              </span>
              <span className="text-navy mt-2 text-sm font-bold">{ORG_ROLE_LABELS[r]}</span>
              <span className="text-muted mt-1 text-[11px] leading-snug">{ORG_ROLE_DESCRIPTIONS[r]}</span>
            </label>
          );
        })}
      </div>

      <div>
        <h3 className="text-navy font-bold">Permissions détaillées</h3>
        <p className="text-muted text-sm">Ajustez les permissions spécifiques pour ce membre.</p>
        {role === "ADMIN" && (
          <p className="text-brand mt-2 rounded-lg bg-blue-50 px-3 py-2 text-xs">
            Un administrateur dispose de toutes les permissions, même celles qui ne sont pas cochées ici.
          </p>
        )}
        <div className="mt-3 space-y-3">
          {PERMISSION_GROUPS.map((group) => {
            const { icon: Icon, tone } = GROUP_ICONS[group.key] ?? GROUP_ICONS.talents;
            return (
              <fieldset key={group.key} className="border-border/70 rounded-xl border p-4">
                <legend className="sr-only">{group.title}</legend>
                <div className="flex gap-3">
                  <span className={cn("flex size-10 shrink-0 items-center justify-center rounded-lg", tone)}>
                    <Icon className="size-5" aria-hidden />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-navy font-bold">{group.title}</p>
                    <p className="text-muted text-xs">{group.description}</p>
                    <div className="mt-3 grid gap-x-6 gap-y-2 sm:grid-cols-2">
                      {group.permissions.map((p) => (
                        <label
                          key={p.key}
                          className="text-navy flex cursor-pointer items-center gap-2.5 text-sm"
                        >
                          <input
                            type="checkbox"
                            checked={permissions.includes(p.key)}
                            onChange={() => toggle(p.key)}
                            className="accent-brand size-4 rounded"
                          />
                          {p.label}
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </fieldset>
            );
          })}
        </div>
      </div>
    </div>
  );
}
