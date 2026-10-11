"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { registerCompanyAction } from "@/app/(auth)/actions";
import { registerCompanySchema } from "@/schemas/auth";
import { ORG_INDUSTRIES, ORG_SIZES } from "@/types/business";
import { FormField } from "./form-field";

const selectClass =
  "border-border focus-visible:ring-brand/40 h-11 w-full rounded-xl border bg-white px-4 text-sm outline-none focus-visible:ring-2";

const EMPTY = {
  fullName: "",
  email: "",
  password: "",
  organization: "",
  industry: "",
  size: "",
  website: "",
};

/** One form for a company: the contact person's login, then the organization they will administer. */
export function CompanyRegisterForm() {
  const [values, setValues] = useState(EMPTY);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string>();
  const [pending, startTransition] = useTransition();
  const set = (key: keyof typeof EMPTY) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setValues((v) => ({ ...v, [key]: e.target.value }));

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setServerError(undefined);
    const parsed = registerCompanySchema.safeParse({
      ...values,
      industry: values.industry || undefined,
      size: values.size || undefined,
      website: values.website || undefined,
    });
    if (!parsed.success) {
      const next: Record<string, string> = {};
      for (const issue of parsed.error.issues) next[String(issue.path[0])] ??= issue.message;
      setErrors(next);
      return;
    }
    setErrors({});
    startTransition(async () => {
      const result = await registerCompanyAction(parsed.data);
      // On success the action redirects, so a returned value is always an error.
      if (result?.error) setServerError(result.error);
    });
  }

  return (
    <form onSubmit={submit} noValidate className="space-y-5">
      <fieldset className="space-y-4">
        <legend className="text-navy mb-1 text-sm font-bold">Vous</legend>
        <FormField
          label="Nom complet"
          name="fullName"
          autoComplete="name"
          value={values.fullName}
          onChange={set("fullName")}
          error={errors.fullName}
        />
        <FormField
          label="E-mail professionnel"
          name="email"
          type="email"
          autoComplete="email"
          value={values.email}
          onChange={set("email")}
          error={errors.email}
        />
        <FormField
          label="Mot de passe"
          name="password"
          type="password"
          autoComplete="new-password"
          value={values.password}
          onChange={set("password")}
          error={errors.password}
        />
        <p className="text-muted -mt-2 text-xs">8 caractères minimum, une majuscule et un chiffre.</p>
      </fieldset>

      <fieldset className="space-y-4">
        <legend className="text-navy mb-1 text-sm font-bold">Votre organisation</legend>
        <FormField
          label="Nom de l'organisation"
          name="organization"
          autoComplete="organization"
          placeholder="Ex : AGL Côte d'Ivoire"
          value={values.organization}
          onChange={set("organization")}
          error={errors.organization}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="company-industry">Domaine d&apos;activité</Label>
            <select
              id="company-industry"
              value={values.industry}
              onChange={set("industry")}
              className={selectClass}
            >
              <option value="">Sélectionner</option>
              {ORG_INDUSTRIES.map((i) => (
                <option key={i} value={i}>
                  {i}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="company-size">Taille</Label>
            <select id="company-size" value={values.size} onChange={set("size")} className={selectClass}>
              <option value="">Sélectionner</option>
              {ORG_SIZES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </div>
        <FormField
          label="Site web"
          name="website"
          type="url"
          inputMode="url"
          placeholder="https://www.votre-entreprise.com"
          value={values.website}
          onChange={set("website")}
          error={errors.website}
        />
      </fieldset>

      {serverError && (
        <p role="alert" className="text-danger rounded-lg bg-red-50 px-3 py-2 text-sm">
          {serverError}
        </p>
      )}
      <Button type="submit" size="lg" className="w-full" disabled={pending}>
        {pending ? "Création…" : "Créer mon espace entreprise"}
      </Button>
    </form>
  );
}
