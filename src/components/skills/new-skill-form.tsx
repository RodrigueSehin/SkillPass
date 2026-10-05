"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { BarChart3, FileCheck2, ListChecks, Save } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils/cn";
import {
  createTalentSkillSchema,
  type CreateTalentSkillFormValues,
  type CreateTalentSkillInput,
} from "@/schemas/skill";
import { SKILL_LEVELS, SKILL_LEVEL_LABELS } from "@/types/skill";
import { addSkillAction } from "@/app/dashboard/skills/actions";

const inputClass =
  "border-border focus-visible:ring-brand/40 h-11 w-full rounded-xl border bg-white px-4 text-sm outline-none focus-visible:ring-2";

function SectionTitle({ icon: Icon, children }: { icon: typeof ListChecks; children: React.ReactNode }) {
  return (
    <h2 className="text-navy flex items-center gap-3 text-lg font-bold">
      <span className="bg-brand flex size-9 items-center justify-center rounded-lg text-white">
        <Icon className="size-5" aria-hidden />
      </span>
      {children}
    </h2>
  );
}

interface NewSkillFormProps {
  defaultName?: string;
  /** Categories offered as suggestions (the user may still type another one). */
  categories: string[];
}

export function NewSkillForm({ defaultName, categories }: NewSkillFormProps) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string>();
  const [pending, startTransition] = useTransition();
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateTalentSkillFormValues, unknown, CreateTalentSkillInput>({
    resolver: zodResolver(createTalentSkillSchema),
    defaultValues: { name: defaultName ?? "", level: "INTERMEDIATE", yearsOfExperience: 1 },
  });
  const level = useWatch({ control, name: "level" });

  const submit = handleSubmit((values) => {
    setServerError(undefined);
    startTransition(async () => {
      const result = await addSkillAction(values);
      if (result.error) setServerError(result.error);
      else router.push("/dashboard/skills");
    });
  });

  return (
    <form onSubmit={submit} noValidate>
      <div className="border-border/60 shadow-soft space-y-8 rounded-2xl border bg-white p-6 sm:p-8">
        <section aria-label="Informations générales" className="space-y-5">
          <SectionTitle icon={ListChecks}>Informations générales</SectionTitle>
          <div className="grid gap-5 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">
                Nom de la compétence <span className="text-danger">*</span>
              </Label>
              <input
                id="name"
                placeholder="Ex : Power Apps, React, Gestion de projet…"
                aria-invalid={Boolean(errors.name)}
                className={inputClass}
                {...register("name")}
              />
              {errors.name && (
                <p role="alert" className="text-danger text-sm">
                  {errors.name.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Catégorie</Label>
              <input
                id="category"
                list="skill-categories"
                placeholder="Choisir ou saisir une catégorie"
                className={inputClass}
                {...register("category", { setValueAs: (v: string) => v.trim() || undefined })}
              />
              <datalist id="skill-categories">
                {categories.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
              {errors.category && (
                <p role="alert" className="text-danger text-sm">
                  {errors.category.message}
                </p>
              )}
            </div>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <fieldset className="space-y-2">
              <legend className="text-foreground text-sm font-medium">
                Niveau de maîtrise <span className="text-danger">*</span>
              </legend>
              <div className="flex flex-wrap gap-2">
                {SKILL_LEVELS.map((l) => (
                  <label
                    key={l}
                    className={cn(
                      "focus-within:ring-brand/40 flex h-10 cursor-pointer items-center gap-2 rounded-xl border px-4 text-sm font-medium focus-within:ring-2",
                      level === l
                        ? "border-brand bg-brand text-white"
                        : "border-border text-navy bg-white hover:bg-slate-50",
                    )}
                  >
                    <input type="radio" value={l} className="sr-only" {...register("level")} />
                    <BarChart3 className="size-4" aria-hidden /> {SKILL_LEVEL_LABELS[l]}
                  </label>
                ))}
              </div>
            </fieldset>
            <div className="space-y-2">
              <Label htmlFor="yearsOfExperience">Années d&apos;expérience</Label>
              <div className="flex">
                <input
                  id="yearsOfExperience"
                  type="number"
                  min={0}
                  max={60}
                  aria-invalid={Boolean(errors.yearsOfExperience)}
                  className={cn(inputClass, "rounded-r-none")}
                  {...register("yearsOfExperience")}
                />
                <span className="border-border text-muted flex items-center rounded-r-xl border border-l-0 bg-slate-50 px-4 text-sm">
                  ans
                </span>
              </div>
              {errors.yearsOfExperience && (
                <p role="alert" className="text-danger text-sm">
                  {errors.yearsOfExperience.message}
                </p>
              )}
            </div>
          </div>
        </section>

        <section aria-label="Preuves et validation" className="space-y-3">
          <SectionTitle icon={FileCheck2}>Preuves et validation</SectionTitle>
          <p className="text-muted text-sm leading-relaxed">
            Une fois la compétence enregistrée, ouvrez sa fiche pour y joindre des liens ou des fichiers (PDF,
            PNG, JPG, 10 Mo max) et la faire vérifier. Le niveau déclaré ici reste « non vérifié » tant
            qu&apos;une évaluation ou un vérificateur ne l&apos;a pas confirmé.
          </p>
        </section>
      </div>

      {serverError && (
        <p role="alert" className="text-danger mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm">
          {serverError}
        </p>
      )}
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Link href="/dashboard/skills" className={buttonVariants({ variant: "outline" })}>
          Annuler
        </Link>
        <Button type="submit" disabled={pending}>
          <Save /> {pending ? "Enregistrement…" : "Enregistrer la compétence"}
        </Button>
      </div>
    </form>
  );
}
