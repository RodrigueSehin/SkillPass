"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Briefcase, MapPin } from "lucide-react";
import {
  closeJobOfferAction,
  deleteJobOfferAction,
  duplicateJobOfferAction,
  publishJobOfferAction,
} from "@/app/business/offres/actions";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { cn } from "@/lib/utils/cn";
import {
  JOB_CONTRACT_LABELS,
  JOB_STATUS_LABELS,
  type JobContract,
  type JobDisplayStatus,
} from "@/types/job-offer";
import { OrgLogo } from "./org-logo";
import { RowMenu, type RowMenuItem } from "./row-menu";

export interface OfferTableRow {
  id: string;
  title: string;
  skills: string[];
  location: string;
  contract: JobContract;
  applicants: number;
  status: JobDisplayStatus;
  /** Already formatted, "25 sept. 2026", or an empty string for a draft. */
  date: string;
}

const STATUS_TONES: Record<JobDisplayStatus, string> = {
  PUBLISHED: "bg-green-50 text-green-700",
  DRAFT: "bg-amber-50 text-amber-700",
  EXPIRED: "bg-red-50 text-red-600",
  CLOSED: "bg-slate-100 text-slate-600",
};

/** Job offers of the organization with their actions: edit, duplicate, publish, close, delete. */
export function OffersTable({
  rows,
  organization,
  canCreate,
  canEdit,
  canDelete,
}: {
  rows: OfferTableRow[];
  organization: { name: string; logoVersion: string | null };
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
}) {
  const router = useRouter();
  const [deleting, setDeleting] = useState<OfferTableRow | null>(null);
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();

  const run = (fn: () => Promise<{ error?: string }>) =>
    startTransition(async () => {
      setError(undefined);
      const result = await fn();
      if (result.error) setError(result.error);
      router.refresh();
    });

  function menu(o: OfferTableRow): RowMenuItem[] {
    const items: RowMenuItem[] = [];
    if (canEdit || canCreate) items.push({ label: "Modifier", href: `/business/offres/${o.id}/modifier` });
    if (canCreate)
      items.push({ label: "Dupliquer", onSelect: () => run(() => duplicateJobOfferAction(o.id)) });
    if (canCreate && (o.status === "DRAFT" || o.status === "CLOSED" || o.status === "EXPIRED")) {
      items.push({ label: "Publier", onSelect: () => run(() => publishJobOfferAction(o.id)) });
    }
    if ((canEdit || canCreate) && (o.status === "PUBLISHED" || o.status === "EXPIRED")) {
      items.push({ label: "Clôturer", onSelect: () => run(() => closeJobOfferAction(o.id)) });
    }
    if (canDelete) items.push({ label: "Supprimer", danger: true, onSelect: () => setDeleting(o) });
    return items;
  }

  if (rows.length === 0) {
    return (
      <p className="text-muted px-5 py-12 text-center text-sm">Aucune offre ne correspond à vos critères.</p>
    );
  }

  return (
    <>
      {error && (
        <p role="alert" className="text-danger mx-4 mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm">
          {error}
        </p>
      )}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[820px] text-left text-sm">
          <thead>
            <tr className="text-navy border-y border-slate-100 text-xs font-semibold">
              <th scope="col" className="px-4 py-3">
                Offre d&apos;emploi
              </th>
              <th scope="col" className="px-3 py-3">
                Localisation
              </th>
              <th scope="col" className="px-3 py-3">
                Type de contrat
              </th>
              <th scope="col" className="px-3 py-3">
                Candidatures
              </th>
              <th scope="col" className="px-3 py-3">
                Statut
              </th>
              <th scope="col" className="px-3 py-3">
                Date de publication
              </th>
              <th scope="col" className="px-3 py-3">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((o) => (
              <tr key={o.id}>
                <td className="px-4 py-3">
                  <span className="flex items-center gap-3">
                    <OrgLogo
                      name={organization.name}
                      version={organization.logoVersion}
                      className="size-11 text-xs"
                    />
                    <span className="min-w-0">
                      <span className="text-navy block font-semibold">{o.title}</span>
                      <span className="mt-1 flex flex-wrap gap-1.5">
                        {o.skills.slice(0, 3).map((s) => (
                          <span
                            key={s}
                            className="text-brand rounded-md bg-blue-50 px-2 py-0.5 text-[11px] font-medium"
                          >
                            {s}
                          </span>
                        ))}
                      </span>
                    </span>
                  </span>
                </td>
                <td className="text-muted px-3 py-3 whitespace-nowrap">
                  <span className="flex items-center gap-1.5">
                    <MapPin className="size-4 shrink-0" aria-hidden /> {o.location.split(",")[0] || "—"}
                    {o.location.includes("Côte d'Ivoire") ? ", CI" : ""}
                  </span>
                </td>
                <td className="text-muted px-3 py-3 whitespace-nowrap">
                  <span className="flex items-center gap-1.5">
                    <Briefcase className="size-4 shrink-0" aria-hidden /> {JOB_CONTRACT_LABELS[o.contract]}
                  </span>
                </td>
                <td className="text-navy px-3 py-3 font-medium">{o.applicants}</td>
                <td className="px-3 py-3">
                  <span
                    className={cn("rounded-md px-2.5 py-1 text-xs font-semibold", STATUS_TONES[o.status])}
                  >
                    {JOB_STATUS_LABELS[o.status]}
                  </span>
                </td>
                <td className="text-muted px-3 py-3 whitespace-nowrap">{o.date || "-"}</td>
                <td className="px-3 py-3 text-right">
                  <RowMenu label={`Actions pour ${o.title}`} items={menu(o)} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={deleting !== null} onClose={() => setDeleting(null)} title="Supprimer cette offre ?">
        <p className="text-muted text-sm">
          « {deleting?.title} » sera supprimée et retirée de la plateforme. Les candidatures déjà reçues
          restent dans l&apos;historique des talents.
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="outline" onClick={() => setDeleting(null)}>
            Annuler
          </Button>
          <Button
            className="bg-danger hover:bg-red-700"
            disabled={pending}
            onClick={() =>
              run(async () => {
                const target = deleting;
                setDeleting(null);
                return target ? deleteJobOfferAction(target.id) : {};
              })
            }
          >
            {pending ? "Suppression…" : "Supprimer"}
          </Button>
        </div>
      </Modal>
    </>
  );
}
