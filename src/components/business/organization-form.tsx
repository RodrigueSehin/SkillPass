"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Save } from "lucide-react";
import { updateOrganizationAction } from "@/app/business/actions";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ORG_INDUSTRIES, ORG_SIZES, type OrganizationDTO } from "@/types/business";

const field =
  "border-border focus-visible:ring-brand/40 disabled:bg-slate-50 h-11 w-full rounded-xl border bg-white px-4 text-sm outline-none focus-visible:ring-2";

const TIMEZONES = [
  ["Africa/Abidjan", "(GMT+00:00) Abidjan"],
  ["Africa/Dakar", "(GMT+00:00) Dakar"],
  ["Africa/Lagos", "(GMT+01:00) Lagos"],
  ["Africa/Douala", "(GMT+01:00) Douala"],
  ["Europe/Paris", "(GMT+01:00) Paris"],
] as const;

/** Keeps a value that is not in the list (an older or custom one) selectable. */
function Options({ list, current }: { list: readonly string[]; current: string }) {
  return (
    <>
      <option value="">Sélectionner</option>
      {current && !list.includes(current) && <option value={current}>{current}</option>}
      {list.map((o) => (
        <option key={o} value={o}>
          {o}
        </option>
      ))}
    </>
  );
}

export function OrganizationForm({
  organization,
  canEdit,
}: {
  organization: OrganizationDTO;
  canEdit: boolean;
}) {
  const router = useRouter();
  const [values, setValues] = useState({
    name: organization.name,
    description: organization.description ?? "",
    industry: organization.industry ?? "",
    size: organization.size ?? "",
    website: organization.website ?? "",
    address: organization.address ?? "",
    phone: organization.phone ?? "",
    email: organization.email ?? "",
    timezone: organization.timezone,
    language: organization.language,
  });
  const [error, setError] = useState<string>();
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();
  const set =
    (key: keyof typeof values) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      setSaved(false);
      setValues((v) => ({ ...v, [key]: e.target.value }));
    };

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(undefined);
    if (values.name.trim().length < 2) return setError("Le nom de l'organisation est requis");
    startTransition(async () => {
      const result = await updateOrganizationAction(values);
      if (result.error) setError(result.error);
      else {
        setSaved(true);
        router.refresh();
      }
    });
  }

  return (
    <form onSubmit={submit} noValidate className="space-y-5">
      <div className="grid gap-5 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="org-name">
            Nom de l&apos;organisation <span className="text-danger">*</span>
          </Label>
          <input
            id="org-name"
            value={values.name}
            onChange={set("name")}
            disabled={!canEdit}
            className={field}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="org-industry">Domaine d&apos;activité</Label>
          <select
            id="org-industry"
            value={values.industry}
            onChange={set("industry")}
            disabled={!canEdit}
            className={field}
          >
            <Options list={ORG_INDUSTRIES} current={values.industry} />
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="org-website">Site web</Label>
          <input
            id="org-website"
            type="url"
            inputMode="url"
            value={values.website}
            onChange={set("website")}
            disabled={!canEdit}
            placeholder="https://www.votre-entreprise.com"
            className={field}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="org-size">Taille de l&apos;entreprise</Label>
          <select
            id="org-size"
            value={values.size}
            onChange={set("size")}
            disabled={!canEdit}
            className={field}
          >
            <Options list={ORG_SIZES} current={values.size} />
          </select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="org-description">Description de l&apos;organisation</Label>
        <div className="relative">
          <textarea
            id="org-description"
            rows={4}
            maxLength={500}
            value={values.description}
            onChange={set("description")}
            disabled={!canEdit}
            className="border-border focus-visible:ring-brand/40 w-full resize-none rounded-xl border bg-white px-4 py-3 pb-7 text-sm outline-none focus-visible:ring-2 disabled:bg-slate-50"
          />
          <span className="text-muted absolute right-3 bottom-2 text-xs">
            {values.description.length}/500
          </span>
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="org-address">Adresse du siège</Label>
          <input
            id="org-address"
            value={values.address}
            onChange={set("address")}
            disabled={!canEdit}
            className={field}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="org-phone">Téléphone</Label>
          <input
            id="org-phone"
            value={values.phone}
            onChange={set("phone")}
            disabled={!canEdit}
            placeholder="+225 27 22 00 00 00"
            className={field}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="org-email">E-mail de contact</Label>
          <input
            id="org-email"
            type="email"
            value={values.email}
            onChange={set("email")}
            disabled={!canEdit}
            className={field}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="org-timezone">Fuseau horaire</Label>
          <select
            id="org-timezone"
            value={values.timezone}
            onChange={set("timezone")}
            disabled={!canEdit}
            className={field}
          >
            {TIMEZONES.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="org-language">Langue par défaut</Label>
          <select
            id="org-language"
            value={values.language}
            onChange={set("language")}
            disabled={!canEdit}
            className={field}
          >
            <option value="fr">Français</option>
            <option value="en">English</option>
          </select>
        </div>
      </div>

      {error && (
        <p role="alert" className="text-danger rounded-lg bg-red-50 px-3 py-2 text-sm">
          {error}
        </p>
      )}
      {canEdit && (
        <div className="flex items-center justify-end gap-3">
          {saved && (
            <span role="status" className="text-success flex items-center gap-1.5 text-sm font-medium">
              <Check className="size-4" aria-hidden /> Modifications enregistrées
            </span>
          )}
          <Button type="submit" disabled={pending}>
            <Save /> {pending ? "Enregistrement…" : "Enregistrer les modifications"}
          </Button>
        </div>
      )}
    </form>
  );
}
