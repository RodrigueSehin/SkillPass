import type { Metadata } from "next";
import Link from "next/link";
import { Search } from "lucide-react";
import { DATE } from "@/components/admin/pills";
import { PlanSelect, RoleSelect } from "@/components/admin/role-select";
import { Panel } from "@/components/business/ui";
import { requirePlatformAdmin } from "@/lib/auth/platform-admin";
import { getPlatformAdminService } from "@/services/container";
import { ROLE_LABELS, type UserRole } from "@/types/profile";

export const metadata: Metadata = { title: "Utilisateurs et rôles", robots: { index: false } };

const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
const ROLES = Object.keys(ROLE_LABELS) as UserRole[];

export default async function AdminUsersPage({ searchParams }: PageProps<"/admin/utilisateurs">) {
  const { user } = await requirePlatformAdmin();
  const raw = await searchParams;
  const q = first(raw.q) ?? "";
  const role = ROLES.find((r) => r === first(raw.role)) ?? "";
  const rows = await getPlatformAdminService().listProfiles(user.id, q, role);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-navy text-2xl font-bold tracking-tight sm:text-3xl">Utilisateurs et rôles</h1>
        <p className="text-muted mt-1">
          Le rôle d&apos;un compte décide de ce qu&apos;il peut faire sur la plateforme : vérificateur et
          évaluateur valident les évaluations, l&apos;administrateur général gère tout. Les accès des membres
          d&apos;une entreprise se règlent dans la fiche de l&apos;entreprise.
        </p>
      </div>

      <Panel>
        <form method="get" className="flex flex-wrap gap-3 px-5 py-4">
          <div className="relative min-w-60 flex-1">
            <Search className="text-muted pointer-events-none absolute top-3.5 left-3.5 size-4" aria-hidden />
            <input
              name="q"
              defaultValue={q}
              aria-label="Rechercher un compte"
              placeholder="Nom, e-mail, identifiant, entreprise…"
              className="border-border focus-visible:ring-brand/40 h-11 w-full rounded-xl border bg-white pr-4 pl-10 text-sm outline-none focus-visible:ring-2"
            />
          </div>
          <select
            name="role"
            defaultValue={role}
            aria-label="Rôle"
            className="border-border h-11 rounded-xl border bg-white px-3 text-sm"
          >
            <option value="">Tous les rôles</option>
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {ROLE_LABELS[r]}
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="border-brand/40 text-brand h-11 rounded-xl border bg-white px-5 text-sm font-semibold hover:bg-blue-50"
          >
            Filtrer
          </button>
        </form>

        {rows.length === 0 ? (
          <p className="text-muted px-5 pb-8 text-center text-sm">Aucun compte ne correspond.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="text-muted border-border/60 border-y text-xs">
                <tr>
                  <th className="px-5 py-3 font-semibold">Compte</th>
                  <th className="px-3 py-3 font-semibold">Entreprise</th>
                  <th className="px-3 py-3 font-semibold">Profil</th>
                  <th className="px-3 py-3 font-semibold">Créé le</th>
                  <th className="px-3 py-3 font-semibold">Plan</th>
                  <th className="px-5 py-3 font-semibold">Rôle sur la plateforme</th>
                </tr>
              </thead>
              <tbody className="divide-border/50 divide-y">
                {rows.map((p) => (
                  <tr key={p.id}>
                    <td className="px-5 py-3">
                      <p className="text-navy font-semibold">{p.fullName}</p>
                      <p className="text-muted text-xs">{p.email}</p>
                    </td>
                    <td className="px-3 py-3">
                      {p.organization ? (
                        <Link
                          href={`/admin/entreprises/${p.organization.id}`}
                          className="text-brand hover:underline"
                        >
                          {p.organization.name}
                        </Link>
                      ) : (
                        <span className="text-muted">—</span>
                      )}
                    </td>
                    <td className="px-3 py-3">
                      <span className={p.isPublic ? "text-green-700" : "text-muted"}>
                        {p.isPublic ? "Public" : "Privé"}
                      </span>
                    </td>
                    <td className="text-muted px-3 py-3 whitespace-nowrap">
                      {DATE.format(new Date(p.createdAt))}
                    </td>
                    <td className="px-3 py-3">
                      <PlanSelect profileId={p.id} plan={p.plan} />
                    </td>
                    <td className="px-5 py-3">
                      <RoleSelect profileId={p.id} role={p.role} disabled={p.id === user.id} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </div>
  );
}
