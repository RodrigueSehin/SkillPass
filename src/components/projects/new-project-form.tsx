"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import {
  ArrowRight,
  CalendarDays,
  Check,
  CheckCircle2,
  Clock,
  ExternalLink,
  FileText,
  FolderKanban,
  ImageIcon,
  Link2,
  Pause,
  Save,
  Search,
  Settings2,
  Trash2,
  UploadCloud,
  X,
} from "lucide-react";
import { addProjectAction } from "@/app/dashboard/projects/actions";
import { Button, buttonVariants } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { PROJECT_STATUS_LABELS, type ProjectStatus } from "@/lib/project-view";
import { cn } from "@/lib/utils/cn";
import { createProjectSchema, type CreateProjectInput } from "@/schemas/portfolio";
import { ProjectQuote, ProjectTips, PopularProjects } from "./project-form-side";

/** The page makes mandatory what the quick edit dialog leaves optional. */
const formSchema = createProjectSchema.superRefine((v, ctx) => {
  const need = (path: string, ok: unknown, message: string) =>
    ok || ctx.addIssue({ code: "custom", path: [path], message });
  need("domain", v.domain, "Choisissez une catégorie");
  need("status", v.status, "Choisissez un statut");
  need("description", v.description, "Décrivez votre projet");
  need("role", v.role, "Indiquez votre rôle");
  need("startDate", v.startDate, "La date de début est requise");
});

type FormValues = z.input<typeof createProjectSchema>;

const inputClass =
  "border-border focus-visible:ring-brand/40 h-11 w-full rounded-xl border bg-white px-4 text-sm outline-none focus-visible:ring-2 aria-[invalid=true]:border-danger disabled:bg-slate-50 disabled:opacity-60";
const cardClass = "border-border/60 shadow-soft space-y-5 rounded-2xl border bg-white p-6";
const MAX_BYTES = 5 * 1024 * 1024;
const ACCEPTED = ["image/png", "image/jpeg", "image/webp"];
const ROLE_IDEAS = [
  "Développeur principal",
  "Chef de projet",
  "Architecte de solution",
  "Analyste fonctionnel",
  "Designer UX/UI",
  "Data analyst",
  "Consultant",
];
const DEFAULT_TECHS = ["Power Apps", "Power Automate", "Dataverse", "JavaScript", "React"];

const STATUS_CHOICES: { value: ProjectStatus; icon: typeof Check }[] = [
  { value: "COMPLETED", icon: Check },
  { value: "IN_PROGRESS", icon: Clock },
  { value: "PAUSED", icon: Pause },
  { value: "PLANNED", icon: CalendarDays },
];
const STATUS_LABEL_OVERRIDE: Partial<Record<ProjectStatus, string>> = { COMPLETED: "Terminé" };

function SectionTitle({ icon: Icon, children }: { icon: typeof FileText; children: React.ReactNode }) {
  return (
    <h2 className="text-navy flex items-center gap-3 text-lg font-bold">
      <span className="bg-brand flex size-9 items-center justify-center rounded-lg text-white">
        <Icon className="size-5" aria-hidden />
      </span>
      {children}
    </h2>
  );
}

function FieldError({ message }: { message?: string }) {
  return message ? (
    <p role="alert" className="text-danger text-sm">
      {message}
    </p>
  ) : null;
}

const Required = () => <span className="text-danger"> *</span>;
const optional = <span className="text-muted font-normal"> (optionnel)</span>;

interface Props {
  categories: string[];
  /** The user's skills, offered as suggestions. */
  skillNames: string[];
  defaults?: { name?: string };
}

export function NewProjectForm({ categories, skillNames, defaults }: Props) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string>();
  const [pending, startTransition] = useTransition();
  const [current, setCurrent] = useState(false);
  const [isPublic, setIsPublic] = useState(true);
  const [cover, setCover] = useState<File | null>(null);
  const [coverError, setCoverError] = useState<string>();
  const [dragging, setDragging] = useState(false);
  const [skills, setSkills] = useState<string[]>([]);
  const [skillsError, setSkillsError] = useState<string>();
  const [skillQuery, setSkillQuery] = useState("");
  /** Set once the project exists, so a failed upload can be retried without creating a duplicate. */
  const [createdId, setCreatedId] = useState<string>();

  const {
    register,
    control,
    handleSubmit,
    setValue,
    setError,
    formState: { errors },
  } = useForm<FormValues, unknown, CreateProjectInput>({
    resolver: zodResolver(formSchema),
    defaultValues: { name: defaults?.name ?? "", status: "COMPLETED", description: "" },
  });
  const w = useWatch({ control }) as Partial<Record<keyof FormValues, string>>;
  const name = w.name ?? "";
  const description = w.description ?? "";
  const url = w.url ?? "";
  const status = (w.status as ProjectStatus | undefined) ?? "COMPLETED";

  const previewUrl = useMemo(() => (cover ? URL.createObjectURL(cover) : null), [cover]);
  useEffect(
    () => () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    },
    [previewUrl],
  );
  useEffect(() => {
    if (current) setValue("endDate", "");
  }, [current, setValue]);

  const suggested = (skillNames.length ? skillNames : DEFAULT_TECHS).slice(0, 5);
  const matches = skillNames
    .filter((s) => !skills.includes(s) && s.toLowerCase().includes(skillQuery.trim().toLowerCase()))
    .slice(0, 6);

  const toggleSkill = (value: string) => {
    setSkillsError(undefined);
    setSkills((list) =>
      list.some((s) => s.toLowerCase() === value.toLowerCase())
        ? list.filter((s) => s.toLowerCase() !== value.toLowerCase())
        : list.length < 30
          ? [...list, value]
          : list,
    );
  };
  function addSkill(value: string) {
    const clean = value.trim().slice(0, 60);
    if (clean && !skills.some((s) => s.toLowerCase() === clean.toLowerCase())) toggleSkill(clean);
    setSkillQuery("");
  }

  function pickCover(file: File | undefined) {
    if (!file) return;
    if (!ACCEPTED.includes(file.type)) return setCoverError("Format non accepté (PNG, JPG ou WebP).");
    if (file.size > MAX_BYTES) return setCoverError("Fichier trop volumineux (5 Mo maximum).");
    setCoverError(undefined);
    setCover(file);
  }

  async function uploadCover(id: string) {
    if (!cover) return true;
    const body = new FormData();
    body.append("file", cover);
    const res = await fetch(`/api/projects/${id}/cover`, { method: "POST", body });
    if (res.ok) return true;
    const json = (await res.json().catch(() => null)) as { error?: { message?: string } } | null;
    setServerError(
      `Projet enregistré, mais l'image n'a pas pu être envoyée : ${json?.error?.message ?? "erreur inconnue"}`,
    );
    return false;
  }

  const submit = handleSubmit((values) => {
    setServerError(undefined);
    if (skills.length === 0) return setSkillsError("Ajoutez au moins une technologie");
    if (!current && !values.endDate && values.status === "COMPLETED") {
      return setError("endDate", { message: "Indiquez la date de fin d'un projet terminé" });
    }
    startTransition(async () => {
      let id = createdId;
      if (!id) {
        const result = await addProjectAction({
          ...values,
          endDate: current ? undefined : values.endDate,
          isPublic,
          skills,
        });
        if (result.error || !result.id) return setServerError(result.error ?? "Une erreur est survenue.");
        id = result.id;
        setCreatedId(id);
      }
      if (await uploadCover(id)) router.push("/dashboard/projects");
    });
  });

  return (
    <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
      <form onSubmit={submit} noValidate className="space-y-6">
        <section aria-label="Informations générales" className={cardClass}>
          <SectionTitle icon={FileText}>Informations générales</SectionTitle>
          <div className="grid gap-5 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">
                Titre du projet
                <Required />
              </Label>
              <input
                id="name"
                placeholder="Ex : Application de gestion de tickets"
                aria-invalid={Boolean(errors.name)}
                className={inputClass}
                {...register("name")}
              />
              <FieldError message={errors.name?.message} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="domain">
                Catégorie
                <Required />
              </Label>
              <select
                id="domain"
                aria-invalid={Boolean(errors.domain)}
                className={inputClass}
                defaultValue=""
                {...register("domain")}
              >
                <option value="">Sélectionner une catégorie</option>
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              <FieldError message={errors.domain?.message} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="url">URL du projet{optional}</Label>
              <div className="flex gap-3">
                <div className="relative flex-1">
                  <Link2
                    className="text-muted pointer-events-none absolute top-3.5 left-3.5 size-4"
                    aria-hidden
                  />
                  <input
                    id="url"
                    type="url"
                    inputMode="url"
                    placeholder="https://"
                    aria-invalid={Boolean(errors.url)}
                    className={cn(inputClass, "pl-10")}
                    {...register("url")}
                  />
                </div>
                {/^https?:\/\//.test(url) ? (
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(buttonVariants({ variant: "outline" }), "shrink-0")}
                  >
                    <ExternalLink /> Visiter
                  </a>
                ) : (
                  <Button type="button" variant="outline" disabled className="shrink-0">
                    <ExternalLink /> Visiter
                  </Button>
                )}
              </div>
              <FieldError message={errors.url?.message} />
            </div>
            <fieldset className="space-y-2">
              <legend className="text-foreground text-sm font-medium">
                Statut
                <Required />
              </legend>
              <div className="flex flex-wrap gap-2">
                {STATUS_CHOICES.map(({ value, icon: Icon }) => (
                  <label
                    key={value}
                    className={cn(
                      "focus-within:ring-brand/40 flex h-11 cursor-pointer items-center gap-2 rounded-xl border px-4 text-sm font-medium focus-within:ring-2",
                      status === value
                        ? "border-brand bg-brand text-white"
                        : "border-border text-navy bg-white hover:bg-slate-50",
                    )}
                  >
                    <input
                      type="radio"
                      value={value}
                      className="sr-only"
                      {...register("status", { onChange: () => setCurrent(value === "IN_PROGRESS") })}
                    />
                    <Icon className="size-4" aria-hidden />{" "}
                    {STATUS_LABEL_OVERRIDE[value] ?? PROJECT_STATUS_LABELS[value]}
                  </label>
                ))}
              </div>
              <FieldError message={errors.status?.message} />
            </fieldset>
          </div>
        </section>

        <section aria-label="Description" className={cn(cardClass, "space-y-3")}>
          <SectionTitle icon={FileText}>Description</SectionTitle>
          <Label htmlFor="description">
            Résumé du projet
            <Required />
          </Label>
          <div className="relative">
            <textarea
              id="description"
              rows={4}
              maxLength={500}
              placeholder="Décrivez brièvement votre projet, ses objectifs et sa valeur ajoutée…"
              aria-invalid={Boolean(errors.description)}
              className="border-border focus-visible:ring-brand/40 aria-[invalid=true]:border-danger w-full resize-none rounded-xl border bg-white px-4 py-3 pb-8 text-sm outline-none focus-visible:ring-2"
              {...register("description")}
            />
            <span className="text-muted absolute right-3 bottom-2 text-xs">{description.length}/500</span>
          </div>
          <FieldError message={errors.description?.message} />
        </section>

        <section aria-label="Détails du projet" className={cardClass}>
          <SectionTitle icon={Settings2}>Détails du projet</SectionTitle>
          <div className="grid items-end gap-5 md:grid-cols-[1.3fr_1fr_1fr_auto]">
            <div className="space-y-2">
              <Label htmlFor="role">
                Rôle dans le projet
                <Required />
              </Label>
              <input
                id="role"
                list="project-roles"
                placeholder="Ex : Développeur principal"
                aria-invalid={Boolean(errors.role)}
                className={inputClass}
                {...register("role")}
              />
              <datalist id="project-roles">
                {ROLE_IDEAS.map((r) => (
                  <option key={r} value={r} />
                ))}
              </datalist>
              <FieldError message={errors.role?.message} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="startDate">
                Date de début
                <Required />
              </Label>
              <input
                id="startDate"
                type="date"
                aria-invalid={Boolean(errors.startDate)}
                className={inputClass}
                {...register("startDate")}
              />
              <FieldError message={errors.startDate?.message} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">Date de fin</Label>
              <input
                id="endDate"
                type="date"
                disabled={current}
                aria-invalid={Boolean(errors.endDate)}
                className={inputClass}
                {...register("endDate")}
              />
              <FieldError message={errors.endDate?.message} />
            </div>
            <label className="text-navy flex h-11 items-center gap-2 text-sm font-medium">
              <input
                type="checkbox"
                checked={current}
                onChange={(e) => setCurrent(e.target.checked)}
                className="accent-brand size-4"
              />
              Projet en cours
            </label>
          </div>

          <div className="space-y-3">
            <Label htmlFor="tech-search">
              Technologies utilisées
              <Required />
            </Label>
            <div className="grid items-start gap-4 md:grid-cols-[minmax(0,280px)_1fr]">
              <div className="relative">
                <Search
                  className="text-muted pointer-events-none absolute top-3.5 left-3.5 size-4"
                  aria-hidden
                />
                <input
                  id="tech-search"
                  value={skillQuery}
                  onChange={(e) => setSkillQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addSkill(skillQuery);
                    }
                  }}
                  placeholder="Rechercher une technologie…"
                  className={cn(inputClass, "pl-10")}
                />
                {skillQuery.trim() && (
                  <ul className="border-border shadow-lift absolute z-10 mt-1 w-full overflow-hidden rounded-xl border bg-white text-sm">
                    {matches.map((s) => (
                      <li key={s}>
                        <button
                          type="button"
                          onClick={() => addSkill(s)}
                          className="w-full px-4 py-2 text-left hover:bg-blue-50"
                        >
                          {s}
                        </button>
                      </li>
                    ))}
                    <li>
                      <button
                        type="button"
                        onClick={() => addSkill(skillQuery)}
                        className="text-brand w-full px-4 py-2 text-left font-medium hover:bg-blue-50"
                      >
                        Ajouter « {skillQuery.trim()} »
                      </button>
                    </li>
                  </ul>
                )}
              </div>
              <ul aria-label="Suggestions" className="flex flex-wrap gap-2">
                {suggested.map((s) => {
                  const on = skills.includes(s);
                  return (
                    <li key={s}>
                      <button
                        type="button"
                        aria-pressed={on}
                        onClick={() => toggleSkill(s)}
                        className={cn(
                          "rounded-lg px-3 py-1.5 text-xs font-medium",
                          on ? "bg-brand text-white" : "text-brand bg-blue-50 hover:bg-blue-100",
                        )}
                      >
                        {s}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
            {skills.length > 0 && (
              <ul aria-label="Technologies sélectionnées" className="flex flex-wrap gap-2">
                {skills.map((s) => (
                  <li
                    key={s}
                    className="text-brand flex items-center gap-1.5 rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-medium"
                  >
                    {s}
                    <button type="button" aria-label={`Retirer ${s}`} onClick={() => toggleSkill(s)}>
                      <X className="size-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <FieldError message={skillsError} />
          </div>
        </section>

        <section aria-label="Médias et liens" className={cardClass}>
          <SectionTitle icon={ImageIcon}>Médias et liens</SectionTitle>
          <p className="text-muted -mt-2 text-sm">
            Ajoutez une image de couverture et des liens pour illustrer votre projet.
          </p>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-3">
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragging(true);
                }}
                onDragLeave={() => setDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragging(false);
                  pickCover(e.dataTransfer.files[0]);
                }}
                className={cn(
                  "border-brand/40 flex min-h-44 flex-col items-center justify-center rounded-xl border-2 border-dashed p-5 text-center",
                  dragging ? "bg-blue-100/60" : "bg-blue-50/40",
                )}
              >
                <UploadCloud className="text-brand size-10" aria-hidden />
                <p className="mt-2 text-sm">
                  <label className="text-brand cursor-pointer font-semibold hover:underline">
                    Glissez-déposez votre image ici
                    <input
                      type="file"
                      accept=".png,.jpg,.jpeg,.webp,image/png,image/jpeg,image/webp"
                      aria-label="Image de couverture"
                      className="sr-only"
                      onChange={(e) => {
                        pickCover(e.target.files?.[0]);
                        e.target.value = "";
                      }}
                    />
                  </label>{" "}
                  <span className="text-navy">ou cliquez pour parcourir</span>
                </p>
                <p className="text-muted mt-2 text-xs">Formats acceptés : PNG, JPG, WebP (Max 5 Mo)</p>
              </div>
              <FieldError message={coverError} />
              {cover && previewUrl && (
                <div className="border-border flex items-center gap-3 rounded-lg border p-2">
                  {/* eslint-disable-next-line @next/next/no-img-element -- local blob preview, nothing to optimize */}
                  <img
                    src={previewUrl}
                    alt="Aperçu de la couverture"
                    className="size-14 rounded-md object-cover"
                  />
                  <span className="text-navy min-w-0 flex-1 truncate text-sm font-medium">{cover.name}</span>
                  <button
                    type="button"
                    aria-label="Retirer l'image"
                    onClick={() => setCover(null)}
                    className="text-muted hover:text-danger"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              )}
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="repositoryUrl">Lien GitHub{optional}</Label>
                <input
                  id="repositoryUrl"
                  type="url"
                  inputMode="url"
                  placeholder="https://github.com/…"
                  aria-invalid={Boolean(errors.repositoryUrl)}
                  className={inputClass}
                  {...register("repositoryUrl")}
                />
                <FieldError message={errors.repositoryUrl?.message} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="videoUrl">Lien vidéo{optional}</Label>
                <input
                  id="videoUrl"
                  type="url"
                  inputMode="url"
                  placeholder="https://youtube.com/…"
                  aria-invalid={Boolean(errors.videoUrl)}
                  className={inputClass}
                  {...register("videoUrl")}
                />
                <FieldError message={errors.videoUrl?.message} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="otherUrl">Autre lien{optional}</Label>
                <input
                  id="otherUrl"
                  type="url"
                  inputMode="url"
                  placeholder="https://…"
                  aria-invalid={Boolean(errors.otherUrl)}
                  className={inputClass}
                  {...register("otherUrl")}
                />
                <FieldError message={errors.otherUrl?.message} />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-1">
            <button
              type="button"
              role="switch"
              aria-checked={isPublic}
              aria-label="Rendre ce projet public"
              onClick={() => setIsPublic((v) => !v)}
              className={cn(
                "relative h-7 w-12 shrink-0 rounded-full transition-colors",
                isPublic ? "bg-brand" : "bg-slate-300",
              )}
            >
              <span
                aria-hidden
                className={cn(
                  "absolute top-0.5 size-6 rounded-full bg-white shadow transition-all",
                  isPublic ? "left-[1.4rem]" : "left-0.5",
                )}
              />
            </button>
            <div>
              <p className="text-navy text-sm font-semibold">Rendre ce projet public</p>
              <p className="text-muted text-xs">
                Votre projet sera visible sur votre profil et pourra être découvert par des recruteurs.
              </p>
            </div>
          </div>
        </section>

        {serverError && (
          <p role="alert" className="text-danger rounded-lg bg-red-50 px-3 py-2 text-sm">
            {serverError}
          </p>
        )}
        <div className="flex flex-wrap justify-center gap-3">
          <Link href="/dashboard/projects" className={buttonVariants({ variant: "outline" })}>
            Annuler
          </Link>
          <Button type="submit" disabled={pending}>
            <Save />{" "}
            {pending
              ? "Enregistrement…"
              : createdId
                ? "Réessayer l'envoi de l'image"
                : "Enregistrer le projet"}
          </Button>
        </div>
      </form>

      <aside className="grid min-w-0 gap-6 md:grid-cols-2 xl:grid-cols-1">
        <ProjectTips />
        <ProjectQuote />
        <section
          aria-labelledby="preview-title"
          className="border-border/60 shadow-soft rounded-2xl border bg-white p-5 md:col-span-2 xl:col-span-1"
        >
          <h2 id="preview-title" className="text-navy flex items-center gap-2 font-bold">
            <FolderKanban className="text-brand size-5" aria-hidden /> Aperçu
          </h2>
          <div className="mt-4 h-36 overflow-hidden rounded-xl bg-gradient-to-br from-blue-500 to-indigo-700">
            {previewUrl && (
              // eslint-disable-next-line @next/next/no-img-element -- local blob preview, nothing to optimize
              <img src={previewUrl} alt="" className="h-full w-full object-cover" />
            )}
          </div>
          <div className="mt-3 flex items-start justify-between gap-2">
            <p className="text-navy font-bold">{name || "Titre du projet"}</p>
            <span className="text-success flex shrink-0 items-center gap-1 rounded-full bg-green-50 px-2.5 py-0.5 text-[11px] font-semibold">
              <CheckCircle2 className="size-3" aria-hidden />{" "}
              {STATUS_LABEL_OVERRIDE[status] ?? PROJECT_STATUS_LABELS[status]}
            </span>
          </div>
          <p className="text-muted mt-1 line-clamp-4 text-sm">
            {description || "Votre résumé apparaîtra ici."}
          </p>
          {skills.length > 0 && (
            <ul className="mt-3 flex flex-wrap gap-1.5">
              {skills.slice(0, 5).map((s) => (
                <li key={s} className="text-brand rounded-md bg-blue-50 px-2.5 py-1 text-[11px] font-medium">
                  {s}
                </li>
              ))}
            </ul>
          )}
          <Link
            href="/dashboard/skillpass"
            className="text-brand mt-4 flex items-center justify-center gap-1.5 text-sm font-semibold hover:underline"
          >
            Voir sur mon profil <ArrowRight className="size-4" aria-hidden />
          </Link>
        </section>
        <PopularProjects />
      </aside>
    </div>
  );
}
