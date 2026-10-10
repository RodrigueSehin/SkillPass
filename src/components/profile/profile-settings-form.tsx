"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateProfileAction } from "@/app/dashboard/settings/actions";
import { updateProfileSchema } from "@/schemas/profile";
import { AVAILABILITIES, AVAILABILITY_LABELS, type ProfileDTO } from "@/types/profile";

type Values = {
  fullName: string;
  username: string;
  headline: string;
  profession: string;
  location: string;
  bio: string;
  careerGoal: string;
  yearsOfExperience: string;
  availability: string;
  isPublic: boolean;
};

const TEXT_FIELDS: { name: keyof Values; label: string; type?: string; placeholder?: string }[] = [
  { name: "fullName", label: "Nom complet" },
  { name: "headline", label: "Titre professionnel", placeholder: "Power Platform Developer" },
  { name: "profession", label: "Profession" },
  { name: "location", label: "Localisation", placeholder: "Abidjan, Côte d'Ivoire" },
  { name: "yearsOfExperience", label: "Années d'expérience", type: "number" },
];

export function ProfileSettingsForm({ profile }: { profile: ProfileDTO }) {
  const [values, setValues] = useState<Values>({
    fullName: profile.fullName,
    username: profile.username,
    headline: profile.headline ?? "",
    profession: profile.profession ?? "",
    location: profile.location ?? "",
    bio: profile.bio ?? "",
    careerGoal: profile.careerGoal ?? "",
    yearsOfExperience: String(profile.yearsOfExperience),
    availability: profile.availability,
    isPublic: profile.isPublic,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string>();
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();

  const set = (name: keyof Values, value: string | boolean) => {
    setSaved(false);
    setValues((v) => ({ ...v, [name]: value }));
  };

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setServerError(undefined);
    setSaved(false);
    const parsed = updateProfileSchema.safeParse(values);
    if (!parsed.success) {
      const next: Record<string, string> = {};
      for (const issue of parsed.error.issues) next[String(issue.path[0])] ??= issue.message;
      setErrors(next);
      return;
    }
    setErrors({});
    startTransition(async () => {
      const result = await updateProfileAction(values);
      if (result.error) setServerError(result.error);
      else setSaved(true);
    });
  }

  const field = (name: keyof Values, label: string, type = "text", placeholder?: string) => (
    <div key={name} className="space-y-2">
      <Label htmlFor={`profile-${name}`}>{label}</Label>
      <Input
        id={`profile-${name}`}
        type={type}
        min={type === "number" ? 0 : undefined}
        placeholder={placeholder}
        value={String(values[name])}
        onChange={(e) => set(name, e.target.value)}
        aria-invalid={Boolean(errors[name])}
      />
      {errors[name] && (
        <p role="alert" className="text-danger text-sm">
          {errors[name]}
        </p>
      )}
    </div>
  );

  const area = (name: "bio" | "careerGoal", label: string) => (
    <div className="space-y-2">
      <Label htmlFor={`profile-${name}`}>{label}</Label>
      <textarea
        id={`profile-${name}`}
        rows={3}
        value={values[name]}
        onChange={(e) => set(name, e.target.value)}
        className="border-border bg-surface w-full rounded-xl border px-4 py-3 text-sm"
      />
      {errors[name] && (
        <p role="alert" className="text-danger text-sm">
          {errors[name]}
        </p>
      )}
    </div>
  );

  return (
    <form onSubmit={submit} noValidate>
      <div className="space-y-5">
        {TEXT_FIELDS.map((f) => field(f.name, f.label, f.type, f.placeholder))}
        {field("username", "Nom d'utilisateur (URL publique)")}
        <p className="text-muted -mt-3 text-xs">Votre profil public : /{values.username || "…"}</p>
        {area("bio", "À propos")}
        {area("careerGoal", "Objectif professionnel (privé)")}
        <div className="space-y-2">
          <Label htmlFor="profile-availability">Disponibilité</Label>
          <select
            id="profile-availability"
            value={values.availability}
            onChange={(e) => set("availability", e.target.value)}
            className="border-border bg-surface h-11 w-full rounded-xl border px-4 text-sm"
          >
            {AVAILABILITIES.map((a) => (
              <option key={a} value={a}>
                {AVAILABILITY_LABELS[a]}
              </option>
            ))}
          </select>
        </div>
        <label className="flex items-start gap-3 text-sm">
          <input
            type="checkbox"
            checked={values.isPublic}
            onChange={(e) => set("isPublic", e.target.checked)}
            className="mt-1 size-4"
          />
          <span>
            <span className="font-medium">Profil public</span>
            <span className="text-muted block">
              Visible par tous à l&apos;adresse /{values.username || "…"}. Décochez pour le masquer.
            </span>
          </span>
        </label>

        {serverError && (
          <p role="alert" className="text-danger rounded-lg bg-red-50 px-3 py-2 text-sm">
            {serverError}
          </p>
        )}
        {saved && (
          <p role="status" className="text-success rounded-lg bg-green-50 px-3 py-2 text-sm">
            Profil enregistré.
          </p>
        )}
        <Button type="submit" disabled={pending}>
          {pending ? "Enregistrement…" : "Enregistrer"}
        </Button>
      </div>
    </form>
  );
}
