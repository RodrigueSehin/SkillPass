"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { updateMemberAccessAction } from "@/app/admin/actions";
import { permissionGroupsFor, ROLE_PRESETS } from "@/lib/business/permissions";
import { cn } from "@/lib/utils/cn";
import { ORG_ROLES, ORG_ROLE_LABELS, type MemberDTO, type OrgRole, type PlanCode } from "@/types/business";

/** One member of a company: role, status and the permissions the administrator ticks. */
export function MemberAccess({ orgId, member, plan }: { orgId: string; member: MemberDTO; plan: PlanCode }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [role, setRole] = useState<OrgRole>(member.role);
  const [permissions, setPermissions] = useState<string[]>(member.permissions);
  const [error, setError] = useState<string>();
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();
  const editable = member.status !== "INVITED";

  function save(extra: { status?: "ACTIVE" | "INACTIVE" } = {}) {
    setError(undefined);
    setSaved(false);
    startTransition(async () => {
      const result = await updateMemberAccessAction(orgId, member.id, { role, permissions, ...extra });
      if (result.error) setError(result.error);
      else {
        setSaved(true);
        router.refresh();
      }
    });
  }

  return (
    <li className="border-border/70 rounded-xl border">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center gap-3 px-4 py-3 text-left"
      >
        <span className="min-w-0 flex-1">
          <span className="text-navy block truncate text-sm font-semibold">
            {member.firstName} {member.lastName}
          </span>
          <span className="text-muted block truncate text-xs">{member.email}</span>
        </span>
        <span className="text-brand rounded-md bg-blue-50 px-2.5 py-1 text-xs font-semibold">
          {ORG_ROLE_LABELS[member.role]}
        </span>
        <span
          className={cn(
            "rounded-md px-2.5 py-1 text-xs font-semibold",
            member.status === "ACTIVE"
              ? "bg-green-50 text-green-700"
              : member.status === "INVITED"
                ? "bg-amber-50 text-amber-700"
                : "bg-red-50 text-red-600",
          )}
        >
          {member.status === "ACTIVE" ? "Actif" : member.status === "INVITED" ? "Invité" : "Désactivé"}
        </span>
        <ChevronDown
          className={cn("text-muted size-4 transition-transform", open && "rotate-180")}
          aria-hidden
        />
      </button>

      {open && (
        <div className="border-border/60 space-y-4 border-t px-4 py-4">
          {!editable && (
            <p className="text-muted text-sm">Cette personne n&apos;a pas encore accepté son invitation.</p>
          )}
          <div className="max-w-xs">
            <label htmlFor={`role-${member.id}`} className="text-navy mb-1 block text-sm font-semibold">
              Rôle
            </label>
            <select
              id={`role-${member.id}`}
              value={role}
              disabled={!editable || pending}
              onChange={(e) => {
                const next = e.target.value as OrgRole;
                setRole(next);
                setPermissions(ROLE_PRESETS[next]);
              }}
              className="border-border h-11 w-full rounded-xl border bg-white px-3 text-sm"
            >
              {ORG_ROLES.map((r) => (
                <option key={r} value={r}>
                  {ORG_ROLE_LABELS[r]}
                </option>
              ))}
            </select>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {permissionGroupsFor(plan).map((group) => (
              <fieldset key={group.key} disabled={!editable || pending} className="space-y-1.5">
                <legend className="text-navy mb-1 text-sm font-bold">{group.title}</legend>
                {group.permissions.map((p) => (
                  <label key={p.key} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={permissions.includes(p.key)}
                      onChange={(e) =>
                        setPermissions((cur) =>
                          e.target.checked ? [...cur, p.key] : cur.filter((k) => k !== p.key),
                        )
                      }
                      className="accent-brand size-4"
                    />
                    {p.label}
                  </label>
                ))}
              </fieldset>
            ))}
          </div>

          {error && (
            <p role="alert" className="text-danger rounded-lg bg-red-50 px-3 py-2 text-sm">
              {error}
            </p>
          )}
          {saved && (
            <p role="status" className="text-success rounded-lg bg-green-50 px-3 py-2 text-sm">
              Accès enregistrés.
            </p>
          )}
          {editable && (
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                disabled={pending}
                onClick={() => save()}
                className="bg-brand h-10 rounded-xl px-5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
              >
                Enregistrer les accès
              </button>
              <button
                type="button"
                disabled={pending}
                onClick={() => save({ status: member.status === "ACTIVE" ? "INACTIVE" : "ACTIVE" })}
                className="border-border text-navy h-10 rounded-xl border bg-white px-5 text-sm font-semibold hover:bg-slate-50 disabled:opacity-50"
              >
                {member.status === "ACTIVE" ? "Désactiver le compte" : "Réactiver le compte"}
              </button>
            </div>
          )}
        </div>
      )}
    </li>
  );
}
