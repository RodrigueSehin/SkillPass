"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteDepartmentAction } from "@/app/business/actions";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { RowMenu } from "./row-menu";
import { DepartmentBadge, MemberAvatar } from "./ui";
import type { DepartmentLook } from "@/types/business";

export interface DepartmentRow {
  id: string;
  name: string;
  description: string | null;
  look: DepartmentLook;
  draft: boolean;
  head: { firstName: string; lastName: string } | null;
  members: number;
}

/** Departments of the organization, with edit and delete for people allowed to manage teams. */
export function DepartmentsTable({ rows, canEdit }: { rows: DepartmentRow[]; canEdit: boolean }) {
  const router = useRouter();
  const [deleting, setDeleting] = useState<DepartmentRow | null>(null);
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();

  if (rows.length === 0) {
    return <p className="text-muted px-5 py-8 text-center text-sm">Aucun département pour l&apos;instant.</p>;
  }

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead>
            <tr className="text-navy bg-slate-50 text-xs font-semibold">
              <th scope="col" className="px-4 py-3">
                Nom du département
              </th>
              <th scope="col" className="px-4 py-3">
                Responsable
              </th>
              <th scope="col" className="px-4 py-3">
                Membres
              </th>
              <th scope="col" className="px-4 py-3">
                Description
              </th>
              <th scope="col" className="px-4 py-3 text-right">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((d) => (
              <tr key={d.id}>
                <td className="px-4 py-2.5">
                  <span className="flex items-center gap-3">
                    <DepartmentBadge look={d.look} />
                    <span className="text-navy font-medium">{d.name}</span>
                    {d.draft && (
                      <span className="rounded-md bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700">
                        Brouillon
                      </span>
                    )}
                  </span>
                </td>
                <td className="px-4 py-2.5">
                  {d.head ? (
                    <span className="flex items-center gap-2.5">
                      <MemberAvatar member={d.head} className="size-8 text-xs" />
                      <span className="text-navy">
                        {d.head.firstName} {d.head.lastName}
                      </span>
                    </span>
                  ) : (
                    <span className="text-muted">Non défini</span>
                  )}
                </td>
                <td className="text-navy px-4 py-2.5">{d.members}</td>
                <td className="text-muted max-w-xs truncate px-4 py-2.5">{d.description}</td>
                <td className="px-4 py-2.5 text-right">
                  {canEdit && (
                    <RowMenu
                      label={`Actions pour ${d.name}`}
                      items={[
                        { label: "Modifier", href: `/business/organisation/departements/${d.id}/modifier` },
                        { label: "Supprimer", danger: true, onSelect: () => setDeleting(d) },
                      ]}
                    />
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {error && (
        <p role="alert" className="text-danger px-4 pb-3 text-sm">
          {error}
        </p>
      )}
      <Modal open={deleting !== null} onClose={() => setDeleting(null)} title="Supprimer ce département ?">
        <p className="text-muted text-sm">
          « {deleting?.name} » sera supprimé. Ses membres restent dans l&apos;organisation, sans cette équipe.
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="outline" onClick={() => setDeleting(null)}>
            Annuler
          </Button>
          <Button
            className="bg-danger hover:bg-red-700"
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                if (deleting) {
                  const result = await deleteDepartmentAction(deleting.id);
                  setError(result.error);
                }
                setDeleting(null);
                router.refresh();
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
