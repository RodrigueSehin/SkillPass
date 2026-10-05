"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import {
  Bold,
  Building2,
  CalendarDays,
  CalendarRange,
  FileText,
  Info,
  Italic,
  Link2,
  List,
  ListOrdered,
  MapPin,
  Paperclip,
  Save,
  Search,
  Settings2,
  Trash2,
  UploadCloud,
  X,
} from "lucide-react";
import { createExperienceAction } from "@/app/dashboard/experiences/actions";
import { Button, buttonVariants } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { experiencePeriod } from "@/lib/experience-view";
import { stripFormatting } from "@/lib/rich-text";
import { cn } from "@/lib/utils/cn";
import {
  CONTRACT_LABELS,
  CONTRACT_TYPES,
  WORK_MODE_LABELS,
  WORK_MODES,
  createExperienceSchema,
  type CreateExperienceInput,
} from "@/schemas/portfolio";
import { ExperienceQuote, ExperienceTips, ExperienceValueHint } from "./experience-form-side";

/** The page adds the fields the quick edit dialog leaves optional. */
const formSchema = createExperienceSchema.superRefine((v, ctx) => {
  const need = (path: string, ok: unknown, message: string) =>
    ok || ctx.addIssue({ code: "custom", path: [path], message });
  need("contractType", v.contractType, "Choisissez un type d'emploi");
  need("location", v.location, "Le lieu est requis");
  need("description", v.description, "Décrivez vos missions");
});

type FormValues = z.input<typeof createExperienceSchema>;

const inputClass =
  "border-border focus-visible:ring-brand/40 h-11 w-full rounded-xl border bg-white px-4 text-sm outline-none focus-visible:ring-2 aria-[invalid=true]:border-danger disabled:bg-slate-50 disabled:opacity-60";
const cardClass = "border-border/60 shadow-soft space-y-5 rounded-2xl border bg-white p-6";
const MAX_BYTES = 5 * 1024 * 1024;
const MAX_FILES = 5;
const ACCEPTED = ["application/pdf", "image/png", "image/jpeg", "image/webp"];
const DEFAULT_SUGGESTIONS = ["Power Apps", "Power Automate", "Dataverse", "Gestion de projet", "Leadership"];

function SectionTitle({
  icon: Icon,
  children,
  hint,
}: {
  icon: typeof FileText;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <h2 className="text-navy flex items-center gap-3 text-lg font-bold">
      <span className="bg-brand flex size-9 items-center justify-center rounded-lg text-white">
        <Icon className="size-5" aria-hidden />
      </span>
      <span>
        {children} {hint && <span className="text-muted text-base font-normal">{hint}</span>}
      </span>
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

type ToolKind = "bold" | "italic" | "bullets" | "numbers" | "link";
const TOOLS = [
  { kind: "bold", label: "Gras", icon: Bold },
  { kind: "italic", label: "Italique", icon: Italic },
  { kind: "bullets", label: "Liste à puces", icon: List },
  { kind: "numbers", label: "Liste numérotée", icon: ListOrdered },
  { kind: "link", label: "Lien", icon: Link2 },
] as const;

const Required = () => <span className="text-danger"> *</span>;

const formatSize = (bytes: number) =>
  bytes >= 1024 * 1024
    ? `${(bytes / 1024 / 1024).toFixed(1)} Mo`
    : `${Math.max(1, Math.round(bytes / 1024))} Ko`;

const initialsOf = (company: string) =>
  company
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");

interface Props {
  companies: string[];
  locations: string[];
  domains: string[];
  /** The user's skills, offered as suggestions. */
  skillNames: string[];
}

export function NewExperienceForm({ companies, locations, domains, skillNames }: Props) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string>();
  const [pending, startTransition] = useTransition();
  const [current, setCurrent] = useState(true);
  const [files, setFiles] = useState<File[]>([]);
  const [fileError, setFileError] = useState<string>();
  const [dragging, setDragging] = useState(false);
  const [skills, setSkills] = useState<string[]>([]);
  const [skillQuery, setSkillQuery] = useState("");
  /** Set once the experience exists, so a failed upload can be retried without creating a duplicate. */
  const [createdId, setCreatedId] = useState<string>();
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const fileInput = useRef<HTMLInputElement>(null);
  const companyInput = useRef<HTMLInputElement | null>(null);
  const textarea = useRef<HTMLTextAreaElement | null>(null);

  const {
    register,
    control,
    handleSubmit,
    setValue,
    setError,
    formState: { errors },
  } = useForm<FormValues, unknown, CreateExperienceInput>({
    resolver: zodResolver(formSchema),
    defaultValues: { title: "", company: "", location: "", description: "" },
  });
  const w = useWatch({ control }) as Partial<Record<keyof FormValues, string>>;
  const title = w.title ?? "";
  const company = w.company ?? "";
  const location = w.location ?? "";
  const description = w.description ?? "";
  const startDate = w.startDate ?? "";
  const endDate = w.endDate ?? "";

  const suggested = (skillNames.length ? skillNames : DEFAULT_SUGGESTIONS).slice(0, 5);
  const matches = skillNames
    .filter((s) => !skills.includes(s) && s.toLowerCase().includes(skillQuery.trim().toLowerCase()))
    .slice(0, 6);

  const toggleSkill = (name: string) =>
    setSkills((list) =>
      list.some((s) => s.toLowerCase() === name.toLowerCase())
        ? list.filter((s) => s.toLowerCase() !== name.toLowerCase())
        : list.length < 30
          ? [...list, name]
          : list,
    );

  function addSkill(name: string) {
    const clean = name.trim().slice(0, 60);
    if (clean && !skills.some((s) => s.toLowerCase() === clean.toLowerCase())) toggleSkill(clean);
    setSkillQuery("");
  }

  function addFiles(picked: FileList | File[]) {
    const next = [...files];
    let message: string | undefined;
    for (const f of picked) {
      if (!ACCEPTED.includes(f.type)) message = "Format non accepté (PDF, PNG ou JPG).";
      else if (f.size > MAX_BYTES) message = "Fichier trop volumineux (5 Mo maximum).";
      else if (next.length >= MAX_FILES) message = `${MAX_FILES} fichiers maximum.`;
      else next.push(f);
    }
    setFileError(message);
    setFiles(next);
  }

  // Toolbar: light markdown around the selection (see lib/rich-text.ts for the reverse).
  function edit(transform: (selected: string, lines: boolean) => string, lines = false) {
    const el = textarea.current;
    if (!el) return;
    let start = el.selectionStart;
    let end = el.selectionEnd;
    if (lines) {
      start = el.value.lastIndexOf("\n", start - 1) + 1;
      const nl = el.value.indexOf("\n", end);
      end = nl === -1 ? el.value.length : nl;
    }
    const replacement = transform(el.value.slice(start, end), lines);
    const next = el.value.slice(0, start) + replacement + el.value.slice(end);
    setValue("description", next.slice(0, 2000), { shouldValidate: true, shouldDirty: true });
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(start, start + replacement.length);
    });
  }

  function applyTool(kind: ToolKind) {
    const list = (prefix: (i: number) => string) => (s: string) =>
      (s || "Élément")
        .split("\n")
        .map((l, i) => `${prefix(i)}${l.replace(/^(?:[-*]|\d+\.)\s+/, "")}`)
        .join("\n");
    if (kind === "bold") edit((s) => `**${s || "texte"}**`);
    else if (kind === "italic") edit((s) => `*${s || "texte"}*`);
    else if (kind === "bullets")
      edit(
        list(() => "- "),
        true,
      );
    else if (kind === "numbers")
      edit(
        list((i) => `${i + 1}. `),
        true,
      );
    else edit((s) => `[${s || "texte"}](https://)`);
  }

  useEffect(() => {
    if (current) setValue("endDate", "");
  }, [current, setValue]);

  async function uploadAll(id: string, list: File[]) {
    const failed: File[] = [];
    let reason = "";
    for (const f of list) {
      const body = new FormData();
      body.append("file", f);
      const res = await fetch(`/api/experiences/${id}/documents`, { method: "POST", body });
      if (!res.ok) {
        failed.push(f);
        const json = (await res.json().catch(() => null)) as { error?: { message?: string } } | null;
        reason = json?.error?.message ?? "erreur inconnue";
      }
    }
    setPendingFiles(failed);
    if (failed.length) {
      setServerError(
        `Expérience enregistrée, mais ${failed.length} fichier(s) n'ont pas pu être envoyés : ${reason}`,
      );
    }
    return failed.length === 0;
  }

  const submit = handleSubmit((values) => {
    setServerError(undefined);
    if (!current && !values.endDate) {
      return setError("endDate", {
        message: "Indiquez la date de fin ou cochez « Je travaille encore ici »",
      });
    }
    startTransition(async () => {
      let id = createdId;
      let toSend = pendingFiles;
      if (!id) {
        const result = await createExperienceAction({
          ...values,
          endDate: current ? undefined : values.endDate,
          skills,
        });
        if (result.error || !result.id) return setServerError(result.error ?? "Une erreur est survenue.");
        id = result.id;
        toSend = files;
        setCreatedId(id);
      }
      if (await uploadAll(id, toSend)) router.push("/dashboard/experiences");
    });
  });

  const { ref: descriptionRef, ...descriptionField } = register("description");

  return (
    <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
      <form onSubmit={submit} noValidate className="space-y-6">
        <section aria-label="Informations générales" className={cardClass}>
          <SectionTitle icon={Building2}>Informations générales</SectionTitle>
          <div className="grid gap-5 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="title">
                Intitulé du poste
                <Required />
              </Label>
              <input
                id="title"
                placeholder="Ex : Développeur Power Platform"
                aria-invalid={Boolean(errors.title)}
                className={inputClass}
                {...register("title")}
              />
              <FieldError message={errors.title?.message} />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <Label htmlFor="company">
                  Entreprise
                  <Required />
                </Label>
                {companies.length > 0 && (
                  <button
                    type="button"
                    onClick={() => companyInput.current?.focus()}
                    className="text-brand flex items-center gap-1 text-xs font-semibold hover:underline"
                  >
                    <Building2 className="size-3.5" aria-hidden /> Sélectionner une entreprise existante
                  </button>
                )}
              </div>
              <input
                id="company"
                list="exp-companies"
                placeholder="Ex : SEHIN GROUP, Microsoft…"
                aria-invalid={Boolean(errors.company)}
                className={inputClass}
                {...register("company")}
                ref={(el) => {
                  register("company").ref(el);
                  companyInput.current = el;
                }}
              />
              <datalist id="exp-companies">
                {companies.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
              <FieldError message={errors.company?.message} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contractType">
                Type d&apos;emploi
                <Required />
              </Label>
              <select
                id="contractType"
                aria-invalid={Boolean(errors.contractType)}
                className={inputClass}
                defaultValue=""
                {...register("contractType")}
              >
                <option value="">Sélectionner un type d&apos;emploi</option>
                {CONTRACT_TYPES.map((c) => (
                  <option key={c} value={c}>
                    {CONTRACT_LABELS[c]}
                  </option>
                ))}
              </select>
              <FieldError message={errors.contractType?.message} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="location">
                Lieu
                <Required />
              </Label>
              <div className="relative">
                <MapPin
                  className="text-muted pointer-events-none absolute top-3.5 left-3.5 size-4"
                  aria-hidden
                />
                <input
                  id="location"
                  list="exp-locations"
                  placeholder="Ex : Abidjan, Côte d'Ivoire"
                  aria-invalid={Boolean(errors.location)}
                  className={cn(inputClass, "pl-10")}
                  {...register("location")}
                />
              </div>
              <datalist id="exp-locations">
                {locations.map((l) => (
                  <option key={l} value={l} />
                ))}
              </datalist>
              <FieldError message={errors.location?.message} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="workMode">Mode de travail</Label>
              <select id="workMode" className={inputClass} defaultValue="" {...register("workMode")}>
                <option value="">Non précisé</option>
                {WORK_MODES.map((m) => (
                  <option key={m} value={m}>
                    {WORK_MODE_LABELS[m]}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="domain">Domaine</Label>
              <input
                id="domain"
                list="exp-domains"
                placeholder="Ex : Tech & Digital"
                className={inputClass}
                {...register("domain")}
              />
              <datalist id="exp-domains">
                {domains.map((d) => (
                  <option key={d} value={d} />
                ))}
              </datalist>
            </div>
          </div>
        </section>

        <section aria-label="Période" className={cardClass}>
          <SectionTitle icon={CalendarRange}>Période</SectionTitle>
          <div className="grid items-end gap-5 md:grid-cols-[1fr_auto_1fr]">
            <div className="space-y-2">
              <Label htmlFor="startDate">
                Date de début
                <Required />
              </Label>
              <div className="relative">
                <input
                  id="startDate"
                  type="date"
                  aria-invalid={Boolean(errors.startDate)}
                  className={inputClass}
                  {...register("startDate")}
                />
                <CalendarDays
                  className="text-muted pointer-events-none absolute top-3.5 right-3 size-4 bg-white"
                  aria-hidden
                />
              </div>
              <FieldError message={errors.startDate?.message} />
            </div>
            <label className="text-navy flex h-11 items-center gap-2 text-sm font-medium">
              <input
                type="checkbox"
                checked={current}
                onChange={(e) => setCurrent(e.target.checked)}
                className="accent-brand size-4"
              />
              Je travaille encore ici
            </label>
            <div className="space-y-2">
              <Label htmlFor="endDate">Date de fin</Label>
              <div className="relative">
                <input
                  id="endDate"
                  type="date"
                  disabled={current}
                  aria-invalid={Boolean(errors.endDate)}
                  className={inputClass}
                  {...register("endDate")}
                />
                <CalendarDays
                  className="text-muted pointer-events-none absolute top-3.5 right-3 size-4 bg-white"
                  aria-hidden
                />
              </div>
              <FieldError message={errors.endDate?.message} />
            </div>
          </div>
          <p className="text-brand flex items-start gap-2 rounded-xl bg-blue-50 px-4 py-3 text-sm">
            <Info className="mt-0.5 size-4 shrink-0" aria-hidden />
            Cochez « Je travaille encore ici » si vous occupez toujours ce poste.
          </p>
        </section>

        <section aria-label="Description" className={cn(cardClass, "space-y-3")}>
          <SectionTitle icon={FileText}>Description</SectionTitle>
          <Label htmlFor="description">
            Description des missions, réalisations et responsabilités
            <Required />
          </Label>
          <div className="border-border focus-within:ring-brand/40 overflow-hidden rounded-xl border focus-within:ring-2">
            <div className="flex flex-wrap items-center gap-1 border-b border-slate-200 bg-slate-50 px-2 py-1.5">
              <select
                aria-label="Style du paragraphe"
                className="border-border mr-1 h-8 rounded-md border bg-white px-2 text-sm"
                defaultValue="p"
                onChange={(e) => {
                  const heading = e.target.value === "h";
                  edit((s) => `${heading ? "## " : ""}${s.replace(/^#{1,3}\s+/, "") || "Titre"}`, true);
                  e.target.value = "p";
                }}
              >
                <option value="p">Paragraphe</option>
                <option value="h">Titre</option>
              </select>
              {TOOLS.map(({ kind, label, icon: Icon }) => (
                <button
                  key={label}
                  type="button"
                  aria-label={label}
                  title={label}
                  onClick={() => applyTool(kind)}
                  className="text-navy flex size-8 items-center justify-center rounded-md hover:bg-blue-100"
                >
                  <Icon className="size-4" aria-hidden />
                </button>
              ))}
            </div>
            <div className="relative">
              <textarea
                id="description"
                rows={6}
                maxLength={2000}
                placeholder="Décrivez vos principales missions, réalisations et l'impact de votre travail…"
                aria-invalid={Boolean(errors.description)}
                className="w-full resize-y bg-white px-4 py-3 pb-8 text-sm outline-none"
                {...descriptionField}
                ref={(el) => {
                  descriptionRef(el);
                  textarea.current = el;
                }}
              />
              <span className="text-muted absolute right-3 bottom-2 text-xs">{description.length}/2000</span>
            </div>
          </div>
          <FieldError message={errors.description?.message} />
        </section>

        <section aria-label="Compétences associées" className={cn(cardClass, "space-y-4")}>
          <SectionTitle icon={Settings2}>Compétences associées</SectionTitle>
          <p className="text-muted text-sm">
            Ajoutez les compétences que vous avez utilisées ou développées durant cette expérience.
          </p>
          <div className="grid items-start gap-4 md:grid-cols-[minmax(0,280px)_1fr]">
            <div className="relative">
              <Search
                className="text-muted pointer-events-none absolute top-3.5 left-3.5 size-4"
                aria-hidden
              />
              <input
                value={skillQuery}
                onChange={(e) => setSkillQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addSkill(skillQuery);
                  }
                }}
                aria-label="Rechercher une compétence"
                placeholder="Rechercher une compétence…"
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
            <div>
              <p className="text-navy mb-2 text-sm font-medium">Compétences suggérées</p>
              <ul className="flex flex-wrap gap-2">
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
          </div>
          {skills.length > 0 && (
            <ul aria-label="Compétences sélectionnées" className="flex flex-wrap gap-2">
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
        </section>

        <section aria-label="Pièces jointes" className={cn(cardClass, "space-y-4")}>
          <SectionTitle icon={Paperclip} hint="(optionnel)">
            Pièces jointes
          </SectionTitle>
          <p className="text-muted text-sm">
            Ajoutez des documents pour appuyer votre expérience (lettre de recommandation, attestation, etc.).
          </p>
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              addFiles(e.dataTransfer.files);
            }}
            className={cn(
              "border-brand/40 flex items-center gap-4 rounded-xl border-2 border-dashed p-5",
              dragging ? "bg-blue-100/60" : "bg-blue-50/40",
            )}
          >
            <UploadCloud className="text-brand size-10 shrink-0" aria-hidden />
            <div className="text-sm">
              <p className="text-navy">
                <button
                  type="button"
                  onClick={() => fileInput.current?.click()}
                  className="text-brand font-semibold hover:underline"
                >
                  Glissez-déposez vos fichiers ici
                </button>{" "}
                ou cliquez pour parcourir
              </p>
              <p className="text-muted mt-1 text-xs">
                Formats acceptés : PDF, PNG, JPG (Max 5 Mo, {MAX_FILES} fichiers)
              </p>
            </div>
            <input
              ref={fileInput}
              type="file"
              multiple
              accept=".pdf,.png,.jpg,.jpeg,.webp,application/pdf,image/png,image/jpeg,image/webp"
              aria-label="Pièces jointes"
              className="sr-only"
              onChange={(e) => {
                if (e.target.files) addFiles(e.target.files);
                e.target.value = "";
              }}
            />
          </div>
          <FieldError message={fileError} />
          {files.length > 0 && (
            <ul aria-label="Fichiers sélectionnés" className="space-y-2">
              {files.map((f) => (
                <li
                  key={`${f.name}-${f.size}`}
                  className="border-border flex items-center justify-between gap-3 rounded-lg border px-3 py-2 text-sm"
                >
                  <span className="text-navy truncate font-medium">{f.name}</span>
                  <span className="text-muted flex shrink-0 items-center gap-3 text-xs">
                    {formatSize(f.size)}
                    <button
                      type="button"
                      aria-label={`Retirer ${f.name}`}
                      onClick={() => setFiles(files.filter((x) => x !== f))}
                      className="hover:text-danger"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        {serverError && (
          <p role="alert" className="text-danger rounded-lg bg-red-50 px-3 py-2 text-sm">
            {serverError}
          </p>
        )}
        <div className="flex flex-wrap justify-center gap-3">
          <Link href="/dashboard/experiences" className={buttonVariants({ variant: "outline" })}>
            Annuler
          </Link>
          <Button type="submit" disabled={pending}>
            <Save />{" "}
            {pending
              ? "Enregistrement…"
              : createdId
                ? "Réessayer l'envoi des fichiers"
                : "Enregistrer l'expérience"}
          </Button>
        </div>
      </form>

      <aside className="grid min-w-0 gap-6 md:grid-cols-2 xl:grid-cols-1">
        <ExperienceTips />
        <ExperienceQuote />
        <section
          aria-labelledby="preview-title"
          className="border-border/60 shadow-soft rounded-2xl border bg-white p-5 md:col-span-2 xl:col-span-1"
        >
          <h2 id="preview-title" className="text-navy flex items-center gap-2 font-bold">
            <FileText className="text-brand size-5" aria-hidden /> Aperçu de l&apos;affichage
          </h2>
          <div className="mt-4 flex items-start gap-3">
            <span
              aria-hidden
              className="bg-navy flex size-14 shrink-0 items-center justify-center rounded-xl text-lg font-bold text-white"
            >
              {initialsOf(company) || "?"}
            </span>
            <div className="min-w-0">
              <p className="text-navy font-bold">{title || "Intitulé du poste"}</p>
              <p className="text-brand text-sm font-semibold">{company || "Entreprise"}</p>
              <p className="text-muted mt-1.5 flex items-center gap-1.5 text-xs">
                <CalendarDays className="size-3.5" aria-hidden />
                {startDate
                  ? experiencePeriod({ startDate, endDate: current ? null : endDate || null })
                  : "Période"}
              </p>
              <p className="text-muted mt-1 flex items-center gap-1.5 text-xs">
                <MapPin className="size-3.5" aria-hidden /> {location || "Lieu"}
              </p>
            </div>
          </div>
          <p className="text-navy/80 mt-3 line-clamp-4 text-xs">
            {stripFormatting(description) || "Votre description apparaîtra ici."}
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
        </section>
        <ExperienceValueHint />
      </aside>
    </div>
  );
}
