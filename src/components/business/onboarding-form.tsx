"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createOrganizationAction } from "@/app/business/actions";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ORG_INDUSTRIES, ORG_SIZES } from "@/types/business";

const fieldClass =
  "border-border focus-visible:ring-brand/40 h-11 w-full rounded-xl border bg-white px-4 text-sm outline-none focus-visible:ring-2";

export function OnboardingForm() {
  const router = useRouter();
  const [values, setValues] = useState({ name: "", industry: "", size: "", website: "" });
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();
  const set = (key: keyof typeof values) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setValues((v) => ({ ...v, [key]: e.target.value }));

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(undefined);
    if (values.name.trim().length < 2) return setError("Indiquez le nom de votre organisation");
    startTransition(async () => {
      const result = await createOrganizationAction(values);
      if (result.error) setError(result.error);
      else router.push("/business");
    });
  }

  return (
    <form onSubmit={submit} noValidate className="mt-6 space-y-4">
      <div className="space-y-2">
        <Label htmlFor="org-name">
          Nom de l&apos;organisation <span className="text-danger">*</span>
        </Label>
        <input
          id="org-name"
          value={values.name}
          onChange={set("name")}
          placeholder="Ex : AGL Côte d'Ivoire"
          className={fieldClass}
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="org-industry">Domaine d&apos;activité</Label>
          <select id="org-industry" value={values.industry} onChange={set("industry")} className={fieldClass}>
            <option value="">Sélectionner</option>
            {ORG_INDUSTRIES.map((i) => (
              <option key={i} value={i}>
                {i}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="org-size">Taille de l&apos;entreprise</Label>
          <select id="org-size" value={values.size} onChange={set("size")} className={fieldClass}>
            <option value="">Sélectionner</option>
            {ORG_SIZES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="org-website">Site web</Label>
        <input
          id="org-website"
          type="url"
          inputMode="url"
          value={values.website}
          onChange={set("website")}
          placeholder="https://www.votre-entreprise.com"
          className={fieldClass}
        />
      </div>
      {error && (
        <p role="alert" className="text-danger rounded-lg bg-red-50 px-3 py-2 text-sm">
          {error}
        </p>
      )}
      <Button type="submit" size="lg" className="w-full" disabled={pending}>
        {pending ? "Création…" : "Créer mon organisation"}
      </Button>
    </form>
  );
}
