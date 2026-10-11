import type { Metadata } from "next";
import Link from "next/link";
import { Search } from "lucide-react";
import { DATE, OrgStatusPills } from "@/components/admin/pills";
import { LinkTabs, Panel } from "@/components/business/ui";
import { requirePlatformAdmin } from "@/lib/auth/platform-admin";
import { PLANS } from "@/lib/business/plans";
import { ORG_FILTERS, type OrgFilter } from "@/services/platform-admin.service";
import { getPlatformAdminService } from "@/services/container";

export const metadata: Metadata = { title: "Entreprises", robots: { index: false } };

const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
const TAB_LABELS: Record<OrgFilter, string> = {
  PENDING: "En attente",
  VERIFIED: "Validées",
  REJECTED: "Refusées",
  SUSPENDED: "Suspendues",
  ALL: "Toutes",
};

export default async function AdminOrganizationsPage({ searchParams }: PageProps<"/admin/entreprises">) {
  const { user } = await requirePlatformAdmin();
  const raw = await searchParams;
  const statut = first(raw.statut);
  const filter = ORG_FILTERS.find((f) => f === statut) ?? "PENDING";
  const q = first(raw.q) ?? "";
  const service = getPlatformAdminService();
  const [rows, all] = await Promise.all([
    service.listOrganizations(user.id, filter, q),
    service.listOrganizations(user.id, "ALL"),
  ]);
  const count = (f: OrgFilter) =>
    f === "ALL"
      ? all.length
      : all.filter(({ organization: o }) => (f === "SUSPENDED" ? o.deactivated : o.verificationStatus === f))
          .length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-navy text-2xl font-bold tracking-tight sm:text-3xl">Entreprises</h1>
        <p className="text-muted mt-1">
          Une entreprise n&apos;accède à SkillPass Business qu&apos;après votre validation.
        </p>
      </div>

      <Panel>
        <div className="space-y-4 px-5 pt-1 pb-4">
          <LinkTabs
            label="Statut des entreprises"
            current={filter}
            tabs={ORG_FILTERS.map((f) => ({
              key: f,
              label: `${TAB_LABELS[f]} (${count(f)})`,
              href: `/admin/entreprises?statut=${f}${q ? `&q=${encodeURIComponent(q)}` : ""}`,
            }))}
          />
          <form method="get" className="relative max-w-md">
            <input type="hidden" name="statut" value={filter} />
            <Search className="text-muted pointer-events-none absolute top-3.5 left-3.5 size-4" aria-hidden />
            <input
              name="q"
              defaultValue={q}
              aria-label="Rechercher une entreprise"
              placeholder="Nom, site, e-mail du contact…"
              className="border-border focus-visible:ring-brand/40 h-11 w-full rounded-xl border bg-white pr-4 pl-10 text-sm outline-none focus-visible:ring-2"
            />
          </form>
        </div>

        {rows.length === 0 ? (
          <p className="text-muted px-5 pb-8 text-center text-sm">Aucune entreprise dans cette liste.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="text-muted border-border/60 border-y text-xs">
                <tr>
                  <th className="px-5 py-3 font-semibold">Entreprise</th>
                  <th className="px-3 py-3 font-semibold">Contact</th>
                  <th className="px-3 py-3 font-semibold">Membres</th>
                  <th className="px-3 py-3 font-semibold">Offres</th>
                  <th className="px-3 py-3 font-semibold">Plan</th>
                  <th className="px-3 py-3 font-semibold">Statut</th>
                  <th className="px-3 py-3 font-semibold">Inscrite le</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-border/50 divide-y">
                {rows.map(({ organization: o, contactName, contactEmail, memberCount, offerCount }) => (
                  <tr key={o.id}>
                    <td className="px-5 py-3">
                      <p className="text-navy font-semibold">{o.name}</p>
                      <p className="text-muted max-w-56 truncate text-xs">{o.website ?? o.industry ?? "—"}</p>
                    </td>
                    <td className="px-3 py-3">
                      <p className="text-navy">{contactName ?? "—"}</p>
                      <p className="text-muted max-w-48 truncate text-xs">{contactEmail}</p>
                    </td>
                    <td className="text-navy px-3 py-3">{memberCount}</td>
                    <td className="text-navy px-3 py-3">{offerCount}</td>
                    <td className="text-navy px-3 py-3">{PLANS[o.plan].name}</td>
                    <td className="px-3 py-3">
                      <OrgStatusPills status={o.verificationStatus} suspended={o.deactivated} />
                    </td>
                    <td className="text-muted px-3 py-3 whitespace-nowrap">
                      {DATE.format(new Date(o.createdAt))}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <Link
                        href={`/admin/entreprises/${o.id}`}
                        className="border-brand/40 text-brand rounded-lg border px-3 py-1.5 text-xs font-semibold hover:bg-blue-50"
                      >
                        Examiner
                      </Link>
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
