"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Layers, ShieldCheck, Code2 } from "lucide-react";
import {
  archiveEvaluationAction,
  deleteEvaluationAction,
  duplicateEvaluationAction,
  publishEvaluationAction,
  restoreEvaluationAction,
} from "@/app/business/evaluations/actions";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { skillVisual } from "@/config/skill-visuals";
import { cn } from "@/lib/utils/cn";
import {
  EVALUATION_STATUS_LABELS,
  EVALUATION_TYPE_LABELS,
  type EvaluationDisplayStatus,
  type EvaluationType,
} from "@/types/evaluation";
import { RateBar } from "./charts";
import { RowMenu, type RowMenuItem } from "./row-menu";

export interface EvaluationTableRow {
  id: string;
  title: string;
  description: string;
  skill: string;
  type: EvaluationType;
  candidates: number;
  successRate: number | null;
  status: EvaluationDisplayStatus;
}

const STATUS_TONES: Record<EvaluationDisplayStatus, string> = {
  PUBLISHED: "bg-green-50 text-green-700",
  DRAFT: "bg-blue-50 text-brand",
  SCHEDULED: "bg-violet-50 text-violet-700",
  ARCHIVED: "bg-amber-50 text-amber-700",
};
const TYPE_ICONS = { TECHNICAL: Code2, TRANSVERSAL: Layers, CERTIFICATION: ShieldCheck } as const;

export function EvaluationsTable({
  rows,
  canCreate,
  canEdit,
  canDelete,
}: {
  rows: EvaluationTableRow[];
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
}) {
  const router = useRouter();
  const [deleting, setDeleting] = useState<EvaluationTableRow | null>(null);
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();

  const run = (fn: () => Promise<{ error?: string }>) =>
    startTransition(async () => {
      setError(undefined);
      const result = await fn();
      if (result.error) setError(result.error);
      router.refresh();
    });

  function menu(e: EvaluationTableRow): RowMenuItem[] {
    const items: RowMenuItem[] = [];
    if (canEdit) items.push({ label: "Modifier", href: `/business/evaluations/${e.id}/modifier` });
    if (canCreate)
      items.push({ label: "Dupliquer", onSelect: () => run(() => duplicateEvaluationAction(e.id)) });
    if (canEdit && e.status === "DRAFT")
      items.push({ label: "Publier", onSelect: () => run(() => publishEvaluationAction(e.id)) });
    if (canEdit && e.status === "ARCHIVED")
      items.push({
        label: "Restaurer en brouillon",
        onSelect: () => run(() => restoreEvaluationAction(e.id)),
      });
    if (canEdit && e.status !== "ARCHIVED")
      items.push({ label: "Archiver", onSelect: () => run(() => archiveEvaluationAction(e.id)) });
    if (canDelete) items.push({ label: "Supprimer", danger: true, onSelect: () => setDeleting(e) });
    return items;
  }

  if (rows.length === 0) {
    return (
      <p className="text-muted px-5 py-12 text-center text-sm">
        Aucune évaluation ne correspond à vos critères.
      </p>
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
        <table className="w-full min-w-[800px] text-left text-sm">
          <thead>
            <tr className="text-navy border-y border-slate-100 text-xs font-semibold">
              <th scope="col" className="px-4 py-3">
                Titre de l&apos;évaluation
              </th>
              <th scope="col" className="px-3 py-3">
                Compétence évaluée
              </th>
              <th scope="col" className="px-3 py-3">
                Type
              </th>
              <th scope="col" className="px-3 py-3">
                Candidats
              </th>
              <th scope="col" className="px-3 py-3 whitespace-nowrap">
                Taux de réussite
              </th>
              <th scope="col" className="px-3 py-3">
                Statut
              </th>
              <th scope="col" className="px-3 py-3">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((e) => {
              const visual = skillVisual(e.skill || e.title);
              const TypeIcon = TYPE_ICONS[e.type];
              return (
                <tr key={e.id}>
                  <td className="px-4 py-3">
                    <span className="flex items-center gap-3">
                      <span
                        className={cn(
                          "flex size-10 shrink-0 items-center justify-center rounded-xl",
                          visual.tile,
                        )}
                      >
                        <visual.icon className="size-5" aria-hidden />
                      </span>
                      <span className="min-w-0">
                        <span className="text-navy block font-semibold">{e.title}</span>
                        <span className="text-muted block max-w-[200px] truncate text-xs">
                          {e.description || "—"}
                        </span>
                      </span>
                    </span>
                  </td>
                  <td className="px-3 py-3">
                    {e.skill ? (
                      <span className="text-brand rounded-md bg-blue-50 px-2 py-0.5 text-[11px] font-medium whitespace-nowrap">
                        {e.skill}
                      </span>
                    ) : (
                      <span className="text-muted">—</span>
                    )}
                  </td>
                  <td className="text-muted px-3 py-3 whitespace-nowrap">
                    <span className="flex items-center gap-1.5">
                      <TypeIcon className="size-4 shrink-0" aria-hidden />{" "}
                      {EVALUATION_TYPE_LABELS[e.type].title}
                    </span>
                  </td>
                  <td className="text-navy px-3 py-3 font-medium">{e.candidates}</td>
                  <td className="px-3 py-3">
                    {e.successRate === null ? (
                      <span className="text-muted">—</span>
                    ) : (
                      <span className="block w-24">
                        <span className="text-navy mb-1 block text-xs font-medium">{e.successRate}%</span>
                        <RateBar value={e.successRate} />
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-3">
                    <span
                      className={cn("rounded-md px-2.5 py-1 text-xs font-semibold", STATUS_TONES[e.status])}
                    >
                      {EVALUATION_STATUS_LABELS[e.status]}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-right">
                    <RowMenu label={`Actions pour ${e.title}`} items={menu(e)} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <Modal open={deleting !== null} onClose={() => setDeleting(null)} title="Supprimer cette évaluation ?">
        <p className="text-muted text-sm">
          « {deleting?.title} » et tous les résultats des candidats seront supprimés définitivement. Pour la
          conserver sans qu&apos;elle soit proposée, archivez-la plutôt.
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
                return target ? deleteEvaluationAction(target.id) : {};
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
