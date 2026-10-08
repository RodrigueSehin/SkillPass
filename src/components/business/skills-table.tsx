"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Star } from "lucide-react";
import { deleteOrgSkillAction } from "@/app/business/competences/actions";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { skillVisual } from "@/config/skill-visuals";
import { cn } from "@/lib/utils/cn";
import { DEMAND_LABELS, SKILL_KIND_LABELS, type DemandLevel, type SkillRow } from "@/types/org-skill";
import { RowMenu, type RowMenuItem } from "./row-menu";

const DEMAND_TONES: Record<DemandLevel, string> = {
  VERY_HIGH: "bg-red-50 text-red-600",
  HIGH: "bg-orange-50 text-orange-600",
  MEDIUM: "bg-amber-50 text-amber-700",
  LOW: "bg-slate-100 text-slate-600",
  NONE: "bg-slate-100 text-slate-500",
};

export function SkillsTable({
  rows,
  canManage,
  canSeeTalents,
}: {
  rows: SkillRow[];
  canManage: boolean;
  canSeeTalents: boolean;
}) {
  const router = useRouter();
  const [deleting, setDeleting] = useState<SkillRow | null>(null);
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();

  function menu(r: SkillRow): RowMenuItem[] {
    const items: RowMenuItem[] = [];
    if (canSeeTalents && r.talents > 0)
      items.push({
        label: "Voir les talents",
        href: `/business/talents?skill=${encodeURIComponent(r.name)}`,
      });
    if (canManage && r.orgSkillId) {
      items.push({ label: "Modifier", href: `/business/competences/${r.orgSkillId}/modifier` });
      items.push({ label: "Supprimer", danger: true, onSelect: () => setDeleting(r) });
    }
    return items;
  }

  if (rows.length === 0) {
    return (
      <p className="text-muted px-5 py-12 text-center text-sm">
        Aucune compétence ne correspond à vos critères.
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
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead>
            <tr className="text-navy border-y border-slate-100 text-xs font-semibold">
              <th scope="col" className="px-4 py-3">
                Compétence
              </th>
              <th scope="col" className="px-3 py-3">
                Catégorie
              </th>
              <th scope="col" className="px-3 py-3">
                Nombre de talents
              </th>
              <th scope="col" className="px-3 py-3">
                Niveau moyen
              </th>
              <th scope="col" className="px-3 py-3">
                Demande
              </th>
              <th scope="col" className="px-3 py-3">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((r) => {
              const visual = skillVisual(r.name);
              const items = menu(r);
              return (
                <tr key={r.name}>
                  <td className="px-4 py-3">
                    <span className="flex items-center gap-3">
                      <span
                        className={cn(
                          "flex size-9 shrink-0 items-center justify-center rounded-xl",
                          visual.tile,
                        )}
                      >
                        <visual.icon className="size-4" aria-hidden />
                      </span>
                      <span className="min-w-0">
                        <span className="text-navy block font-semibold">{r.name}</span>
                        {r.orgSkillId && (
                          <span className="text-muted block text-[11px]">
                            Votre référentiel · {SKILL_KIND_LABELS[r.kind].short}
                          </span>
                        )}
                      </span>
                    </span>
                  </td>
                  <td className="px-3 py-3">
                    <span className="text-brand rounded-md bg-blue-50 px-2 py-0.5 text-[11px] font-medium whitespace-nowrap">
                      {r.category}
                    </span>
                  </td>
                  <td className="text-navy px-3 py-3 font-medium">{r.talents.toLocaleString("fr-FR")}</td>
                  <td className="px-3 py-3">
                    {r.averageLevel === null ? (
                      <span className="text-muted">—</span>
                    ) : (
                      <span className="text-navy flex items-center gap-1.5 font-medium">
                        <Star className="size-4 fill-amber-400 text-amber-400" aria-hidden />{" "}
                        {String(r.averageLevel).replace(".", ",")}/5
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-3">
                    <span
                      className={cn(
                        "rounded-md px-2.5 py-1 text-xs font-semibold whitespace-nowrap",
                        DEMAND_TONES[r.demand],
                      )}
                    >
                      {DEMAND_LABELS[r.demand]}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-right">
                    {items.length > 0 && <RowMenu label={`Actions pour ${r.name}`} items={items} />}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <Modal open={deleting !== null} onClose={() => setDeleting(null)} title="Supprimer cette compétence ?">
        <p className="text-muted text-sm">
          « {deleting?.name} » sera retirée de votre référentiel. Les offres et évaluations qui
          l&apos;utilisent déjà la conservent.
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
                const target = deleting;
                setDeleting(null);
                setError(undefined);
                const result = target?.orgSkillId ? await deleteOrgSkillAction(target.orgSkillId) : {};
                if (result.error) setError(result.error);
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
