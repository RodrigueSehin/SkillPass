import type { Metadata } from "next";
import Link from "next/link";
import { DATETIME } from "@/components/admin/pills";
import { Panel } from "@/components/business/ui";
import { requirePlatformAdmin } from "@/lib/auth/platform-admin";
import { getPlatformAdminService } from "@/services/container";
import { AUDIT_LABELS } from "@/types/platform";

export const metadata: Metadata = { title: "Journal d'audit", robots: { index: false } };

export default async function AdminAuditPage() {
  const { user } = await requirePlatformAdmin();
  const entries = await getPlatformAdminService().listAudit(user.id, 200);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-navy text-2xl font-bold tracking-tight sm:text-3xl">Journal d&apos;audit</h1>
        <p className="text-muted mt-1">
          Toutes les décisions prises depuis la console, de la plus récente à la plus ancienne.
        </p>
      </div>
      <Panel>
        {entries.length === 0 ? (
          <p className="text-muted p-8 text-center text-sm">Aucune action enregistrée pour le moment.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="text-muted border-border/60 border-b text-xs">
                <tr>
                  <th className="px-5 py-3 font-semibold">Date</th>
                  <th className="px-3 py-3 font-semibold">Action</th>
                  <th className="px-3 py-3 font-semibold">Cible</th>
                  <th className="px-3 py-3 font-semibold">Détail</th>
                  <th className="px-5 py-3 font-semibold">Par</th>
                </tr>
              </thead>
              <tbody className="divide-border/50 divide-y">
                {entries.map((e) => (
                  <tr key={e.id}>
                    <td className="text-muted px-5 py-3 whitespace-nowrap">
                      {DATETIME.format(new Date(e.createdAt))}
                    </td>
                    <td className="text-navy px-3 py-3 font-semibold">{AUDIT_LABELS[e.action]}</td>
                    <td className="px-3 py-3">
                      {e.targetType === "ORGANIZATION" && e.targetId ? (
                        <Link
                          href={`/admin/entreprises/${e.targetId}`}
                          className="text-brand hover:underline"
                        >
                          {e.targetLabel}
                        </Link>
                      ) : (
                        e.targetLabel
                      )}
                    </td>
                    <td className="text-muted max-w-72 truncate px-3 py-3">{e.detail || "—"}</td>
                    <td className="text-navy px-5 py-3">{e.actorName}</td>
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
