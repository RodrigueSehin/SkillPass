"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { FileCheck2, MessageSquareQuote, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Modal } from "@/components/ui/modal";
import { SkillProgress } from "./skill-progress";
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

  function remove() {
    startTransition(async () => {
      const result = await deleteSkillAction(skill.id);
      if (result.error) setError(result.error);
      setConfirming(false);
    });
  }

  return (
    <Card className="p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <Link href={`/dashboard/skills/${skill.id}`} className="font-semibold hover:text-brand hover:underline">
            {skill.name}
          </Link>
          <p className="text-sm text-muted">
            {skill.category ?? "Sans catégorie"} · {plural(skill.yearsOfExperience, "an")} · {SKILL_LEVEL_LABELS[skill.level]}
          </p>
        </div>
        <VerificationBadge status={skill.verificationStatus} />
      </div>
      <div className="mt-4">
        <SkillProgress name="Score" score={skill.score} />
      </div>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <p className="flex items-center gap-4 text-xs text-muted">
          <span className="flex items-center gap-1">
            <FileCheck2 className="size-3.5" aria-hidden /> {plural(skill.evidenceCount, "preuve")}
          </span>
          <span className="flex items-center gap-1">
            <MessageSquareQuote className="size-3.5" aria-hidden /> {plural(skill.recommendationCount, "recommandation")}
          </span>
        </p>
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" aria-label={`Modifier ${skill.name}`} onClick={() => setEditing(true)}>
            <Pencil />
          </Button>
          <Button variant="ghost" size="icon" aria-label={`Supprimer ${skill.name}`} onClick={() => setConfirming(true)}>
            <Trash2 />
          </Button>
        </div>
      </div>
      {error && (
        <p role="alert" className="mt-3 text-sm text-danger">
          {error}
        </p>
      )}

      <Modal open={editing} onClose={() => setEditing(false)} title={`Modifier ${skill.name}`}>
        <SkillForm
          lockIdentity
          defaults={{ name: skill.name, level: skill.level, yearsOfExperience: skill.yearsOfExperience }}
          submitLabel="Enregistrer"
          onSubmit={(v) => updateSkillAction(skill.id, { level: v.level, yearsOfExperience: v.yearsOfExperience })}
          onDone={() => setEditing(false)}
        />
      </Modal>
      <Modal open={confirming} onClose={() => setConfirming(false)} title="Supprimer cette compétence ?">
        <p className="text-sm text-muted">
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
    </Card>
  );
}
