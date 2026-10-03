"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils/cn";
import { FormField } from "./form-field";
import { registerAction } from "@/app/(auth)/actions";
import { registerSchema, type RegisterFormValues, type RegisterInput } from "@/schemas/auth";

const STEPS = [
  { title: "Compte", fields: ["fullName", "email", "password"] },
  { title: "Profil", fields: ["profession", "location", "yearsOfExperience"] },
  { title: "Objectifs", fields: ["mainSkills", "careerGoal", "availability"] },
] as const satisfies readonly { title: string; fields: readonly (keyof RegisterFormValues)[] }[];

const AVAILABILITY_OPTIONS = [
  { value: "IMMEDIATE", label: "Immédiatement" },
  { value: "ONE_MONTH", label: "Sous 1 mois" },
  { value: "THREE_MONTHS", label: "Sous 3 mois" },
  { value: "NOT_AVAILABLE", label: "Non disponible" },
] as const;

export function RegisterWizard() {
  const [step, setStep] = useState(0);
  const [serverError, setServerError] = useState<string>();
  const [pending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    trigger,
    formState: { errors },
  } = useForm<RegisterFormValues, unknown, RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: { availability: "IMMEDIATE", yearsOfExperience: 0 },
    mode: "onTouched",
  });

  const isLast = step === STEPS.length - 1;

  async function next() {
    if (await trigger([...STEPS[step].fields])) setStep((s) => s + 1);
  }

  const onSubmit = handleSubmit((values) => {
    setServerError(undefined);
    startTransition(async () => {
      const result = await registerAction(values);
      // On success the action redirects, so a returned value is always an error.
      if (result?.error) setServerError(result.error);
    });
  });

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-6">
      <ol aria-label="Étapes d'inscription" className="flex items-center gap-2">
        {STEPS.map((s, index) => (
          <li
            key={s.title}
            className="flex flex-1 items-center gap-2"
            aria-current={index === step ? "step" : undefined}
          >
            <span
              className={cn(
                "flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                index < step && "bg-success text-white",
                index === step && "bg-brand text-white",
                index > step && "text-muted bg-slate-200",
              )}
            >
              {index < step ? <Check className="size-4" aria-hidden /> : index + 1}
            </span>
            <span className={cn("hidden text-sm font-medium sm:inline", index > step && "text-muted")}>
              {s.title}
            </span>
            {index < STEPS.length - 1 && <span aria-hidden className="bg-border h-px flex-1" />}
          </li>
        ))}
      </ol>

      {step === 0 && (
        <div className="space-y-4">
          <FormField
            label="Nom complet"
            autoComplete="name"
            error={errors.fullName?.message}
            {...register("fullName")}
          />
          <FormField
            label="Adresse e-mail"
            type="email"
            autoComplete="email"
            error={errors.email?.message}
            {...register("email")}
          />
          <FormField
            label="Mot de passe"
            type="password"
            autoComplete="new-password"
            error={errors.password?.message}
            {...register("password")}
          />
        </div>
      )}

      {step === 1 && (
        <div className="space-y-4">
          <FormField
            label="Profession"
            placeholder="Power Platform Developer"
            error={errors.profession?.message}
            {...register("profession")}
          />
          <FormField
            label="Localisation"
            placeholder="Abidjan, Côte d'Ivoire"
            error={errors.location?.message}
            {...register("location")}
          />
          <FormField
            label="Années d'expérience"
            type="number"
            min={0}
            error={errors.yearsOfExperience?.message}
            {...register("yearsOfExperience")}
          />
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <FormField
            label="Compétences principales"
            placeholder="Power Apps, Dataverse, Power BI"
            error={errors.mainSkills?.message}
            {...register("mainSkills")}
          />
          <FormField
            label="Objectif professionnel"
            error={errors.careerGoal?.message}
            {...register("careerGoal")}
          />
          <div className="space-y-2">
            <Label htmlFor="availability">Disponibilité</Label>
            <select
              id="availability"
              className="border-border bg-surface h-11 w-full rounded-xl border px-4 text-sm"
              {...register("availability")}
            >
              {AVAILABILITY_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {serverError && (
        <p role="alert" className="text-danger rounded-lg bg-red-50 px-3 py-2 text-sm">
          {serverError}
        </p>
      )}

      <div className="flex gap-3">
        {step > 0 && (
          <Button type="button" variant="outline" size="lg" onClick={() => setStep((s) => s - 1)}>
            Retour
          </Button>
        )}
        {isLast ? (
          <Button type="submit" size="lg" className="flex-1" disabled={pending}>
            {pending ? "Création…" : "Créer mon SkillPass"}
          </Button>
        ) : (
          <Button type="button" size="lg" className="flex-1" onClick={next}>
            Continuer
          </Button>
        )}
      </div>
    </form>
  );
}
