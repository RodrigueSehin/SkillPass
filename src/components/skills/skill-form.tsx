"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { FormField } from "@/components/auth/form-field";
import {
  createTalentSkillSchema,
  type CreateTalentSkillFormValues,
  type CreateTalentSkillInput,
} from "@/schemas/skill";
import { SKILL_LEVELS, SKILL_LEVEL_LABELS } from "@/types/skill";
import type { SkillActionResult } from "@/app/dashboard/skills/actions";

interface SkillFormProps {
  defaults?: Partial<CreateTalentSkillFormValues>;
  /** Edit mode locks name and category: only level and experience are editable. */
  lockIdentity?: boolean;
  submitLabel: string;
  onSubmit: (values: CreateTalentSkillInput) => Promise<SkillActionResult>;
  onDone: () => void;
}

export function SkillForm({ defaults, lockIdentity, submitLabel, onSubmit, onDone }: SkillFormProps) {
  const [serverError, setServerError] = useState<string>();
  const [pending, startTransition] = useTransition();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateTalentSkillFormValues, unknown, CreateTalentSkillInput>({
    resolver: zodResolver(createTalentSkillSchema),
    defaultValues: { level: "INTERMEDIATE", yearsOfExperience: 1, ...defaults },
  });

  const submit = handleSubmit((values) => {
    setServerError(undefined);
    startTransition(async () => {
      const result = await onSubmit(values);
      if (result.error) setServerError(result.error);
      else onDone();
    });
  });

  return (
    <form onSubmit={submit} noValidate className="space-y-4">
      <FormField
        label="Nom de la compétence"
        readOnly={lockIdentity}
        error={errors.name?.message}
        {...register("name")}
      />
      {!lockIdentity && (
        <FormField
          label="Catégorie (optionnel)"
          placeholder="Power Platform"
          error={errors.category?.message}
          {...register("category", { setValueAs: (v: string) => v || undefined })}
        />
      )}
      <div className="space-y-2">
        <Label htmlFor="level">Niveau</Label>
        <select
          id="level"
          className="border-border bg-surface h-11 w-full rounded-xl border px-4 text-sm"
          {...register("level")}
        >
          {SKILL_LEVELS.map((l) => (
            <option key={l} value={l}>
              {SKILL_LEVEL_LABELS[l]}
            </option>
          ))}
        </select>
      </div>
      <FormField
        label="Années d'expérience"
        type="number"
        min={0}
        error={errors.yearsOfExperience?.message}
        {...register("yearsOfExperience")}
      />
      {serverError && (
        <p role="alert" className="text-danger rounded-lg bg-red-50 px-3 py-2 text-sm">
          {serverError}
        </p>
      )}
      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="outline" onClick={onDone}>
          Annuler
        </Button>
        <Button type="submit" disabled={pending}>
          {pending ? "Enregistrement…" : submitLabel}
        </Button>
      </div>
    </form>
  );
}
