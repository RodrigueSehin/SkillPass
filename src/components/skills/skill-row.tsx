"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { ArrowRight, FileCheck2, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { LEVEL_CHIP, skillVisual } from "@/config/skill-visuals";
import { cn } from "@/lib/utils/cn";
import { SkillForm } from "./skill-form";
import { VerificationBadge } from "./verification-badge";
import { deleteSkillAction, updateSkillAction } from "@/app/dashboard/skills/actions";
import type { TalentSkillDTO } from "@/repositories/talent-skill.repository";
import { SKILL_LEVEL_LABELS } from "@/types/skill";

const plural = (n: number, word: string) => `${n} ${word}${n > 1 ? "s" : ""}`;

export function SkillRow({ skill }: { skill: TalentSkillDTO }) {
  const [editing, setEditing] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();
  const { icon: Icon, tile } = skillVisual(skill.name);

  function remove() {
    startTransition(async () => {
      const result = await deleteSkillAction(skill.id);
      if (result.error) setError(result.error);
      setConfirming(false);
    });
  }

  return (
    <article className="border-border/60 shadow-soft hover:shadow-lift flex h-full flex-col rounded-2xl border bg-white p-4 transition-shadow">
      <div className="flex items-start gap-3">
        <span className={cn("flex size-11 shrink-0 items-center justify-center rounded-xl", tile)}>
          <Icon className="size-6" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <Link
            href={`/dashboard/skills/${skill.id}`}
            className="text-navy hover:text-brand block truncate text-sm font-bold hover:underline"
          >
            {skill.name}
          </Link>
          <span
            className={cn(
              "mt-1 inline-block rounded-md px-2 py-0.5 text-xs font-semibold",
              LEVEL_CHIP[skill.level],
            )}
          >
            {SKILL_LEVEL_LABELS[skill.level]}
          </span>
        </div>
        <div className="flex shrink-0 gap-0.5">
          <Button
            variant="ghost"
            size="icon"
            className="size-8"
            aria-label={`Modifier ${skill.name}`}
            onClick={() => setEditing(true)}
          >
            <Pencil />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="size-8"
            aria-label={`Supprimer ${skill.name}`}
            onClick={() => setConfirming(true)}
          >
            <Trash2 />
          </Button>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-3">
        <span
          role="progressbar"
          aria-label={`${skill.name} : ${skill.score}%`}
          aria-valuenow={skill.score}
          aria-valuemin={0}
          aria-valuemax={100}
          className="block h-2 flex-1 overflow-hidden rounded-full bg-slate-100"
        >
          <span className="bg-brand block h-full rounded-full" style={{ width: `${skill.score}%` }} />
        </span>
        <span className="text-navy text-sm font-bold">{skill.score}%</span>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        <VerificationBadge status={skill.verificationStatus} />
        <span className="text-muted rounded-md bg-slate-100 px-2 py-0.5 text-xs">
          {skill.category ?? "Sans catégorie"}
        </span>
        <span className="text-muted rounded-md bg-slate-100 px-2 py-0.5 text-xs">
          {plural(skill.yearsOfExperience, "an")}
        </span>
      </div>

      <p className="text-muted mt-3 flex items-center gap-1 text-xs">
        <FileCheck2 className="size-3.5" aria-hidden /> {plural(skill.evidenceCount, "preuve")} ·{" "}
        {plural(skill.recommendationCount, "recommandation")}
      </p>

      <Link
        href={`/dashboard/skills/${skill.id}`}
        className="text-brand mt-4 flex h-9 items-center justify-center gap-1.5 rounded-lg bg-blue-50 text-xs font-semibold hover:bg-blue-100"
      >
        Voir détails <ArrowRight className="size-3.5" aria-hidden />
      </Link>

      {error && (
        <p role="alert" className="text-danger mt-3 text-sm">
          {error}
        </p>
      )}

      <Modal open={editing} onClose={() => setEditing(false)} title={`Modifier ${skill.name}`}>
        <SkillForm
          lockIdentity
          defaults={{ name: skill.name, level: skill.level, yearsOfExperience: skill.yearsOfExperience }}
          submitLabel="Enregistrer"
          onSubmit={(v) =>
            updateSkillAction(skill.id, { level: v.level, yearsOfExperience: v.yearsOfExperience })
          }
          onDone={() => setEditing(false)}
        />
      </Modal>
      <Modal open={confirming} onClose={() => setConfirming(false)} title="Supprimer cette compétence ?">
        <p className="text-muted text-sm">
          « {skill.name} » sera retirée de votre SkillPass. Les preuves associées ne seront plus rattachées.
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="outline" onClick={() => setConfirming(false)}>
            Annuler
          </Button>
          <Button className="bg-danger hover:bg-red-700" onClick={remove} disabled={pending}>
            {pending ? "Suppression…" : "Supprimer"}
          </Button>
        </div>
      </Modal>
    </article>
  );
}
