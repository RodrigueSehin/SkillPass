"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import {
  CalendarDays,
  ExternalLink,
  FileText,
  FileUp,
  Image as ImageIcon,
  Link2,
  ListChecks,
  Save,
  Search,
  Sparkles,
  Trash2,
  UploadCloud,
  X,
} from "lucide-react";
import { createCertificationAction } from "@/app/dashboard/certifications/actions";
import { IssuerLogo } from "@/components/certifications/issuer-logo";
import { Button, buttonVariants } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils/cn";
import {
  CERTIFICATION_LEVEL_LABELS,
  CERTIFICATION_LEVELS,
  createCertificationSchema,
  type CreateCertificationInput,
} from "@/schemas/portfolio";

type FormValues = z.input<typeof createCertificationSchema>;

const inputClass =
  "border-border focus-visible:ring-brand/40 h-11 w-full rounded-xl border bg-white px-4 text-sm outline-none focus-visible:ring-2 aria-[invalid=true]:border-danger";
const cardClass = "border-border/60 shadow-soft space-y-5 rounded-2xl border bg-white p-6";
const MAX_BYTES = 5 * 1024 * 1024;
const ACCEPTED = ["application/pdf", "image/png", "image/jpeg", "image/webp"];

function SectionTitle({
  icon: Icon,
  children,
  hint,
}: {
  icon: typeof ListChecks;
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

const formatSize = (bytes: number) =>
  bytes >= 1024 * 1024
    ? `${(bytes / 1024 / 1024).toFixed(1)} Mo`
    : `${Math.max(1, Math.round(bytes / 1024))} Ko`;

interface Props {
  issuers: string[];
  categories: string[];
  /** Names of the user's skills, offered while searching. */
  skillNames: string[];
  defaults?: { name?: string; issuer?: string };
}

export function NewCertificationForm({ issuers, categories, skillNames, defaults }: Props) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string>();
  const [pending, startTransition] = useTransition();
  const [noExpiry, setNoExpiry] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string>();
  const [dragging, setDragging] = useState(false);
  const [skills, setSkills] = useState<string[]>([]);
  const [skillQuery, setSkillQuery] = useState("");
  /** Set once the certification exists, so a failed upload can be retried without creating a duplicate. */
  const [createdId, setCreatedId] = useState<string>();
  const fileInput = useRef<HTMLInputElement>(null);

  const {
    register,
    control,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<FormValues, unknown, CreateCertificationInput>({
    resolver: zodResolver(createCertificationSchema),
    defaultValues: { name: defaults?.name ?? "", issuer: defaults?.issuer ?? "", description: "" },
  });
  const issuer = (useWatch({ control, name: "issuer" }) as string | undefined) ?? "";
  const description = (useWatch({ control, name: "description" }) as string | undefined) ?? "";
  const credentialUrl = (useWatch({ control, name: "credentialUrl" }) as string | undefined) ?? "";

  const previewUrl = useMemo(
    () => (file?.type.startsWith("image/") ? URL.createObjectURL(file) : null),
    [file],
  );
  useEffect(
    () => () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    },
    [previewUrl],
  );

  const suggestions = skillNames
    .filter((s) => !skills.includes(s) && s.toLowerCase().includes(skillQuery.trim().toLowerCase()))
    .slice(0, 6);

  function addSkill(name: string) {
    const clean = name.trim().slice(0, 60);
    if (clean && !skills.some((s) => s.toLowerCase() === clean.toLowerCase()) && skills.length < 30) {
      setSkills([...skills, clean]);
    }
    setSkillQuery("");
  }

  function pickFile(picked: File | undefined) {
    if (!picked) return;
    if (!ACCEPTED.includes(picked.type)) return setFileError("Format non accepté (PDF, PNG ou JPG).");
    if (picked.size > MAX_BYTES) return setFileError("Fichier trop volumineux (5 Mo maximum).");
    setFileError(undefined);
    setFile(picked);
  }

  async function uploadProof(id: string) {
    if (!file) return true;
    const body = new FormData();
    body.append("file", file);
    const res = await fetch(`/api/certifications/${id}/document`, { method: "POST", body });
    if (res.ok) return true;
    const json = (await res.json().catch(() => null)) as { error?: { message?: string } } | null;
    setServerError(
      `Certification enregistrée, mais le fichier n'a pas pu être envoyé : ${json?.error?.message ?? "erreur inconnue"}`,
    );
    return false;
  }

  const submit = handleSubmit((values) => {
    setServerError(undefined);
    startTransition(async () => {
      let id = createdId;
      if (!id) {
        const result = await createCertificationAction({
          ...values,
          expirationDate: noExpiry ? undefined : values.expirationDate,
          skills,
        });
        if (result.error || !result.id) return setServerError(result.error ?? "Une erreur est survenue.");
        id = result.id;
        setCreatedId(id);
      }
      if (await uploadProof(id)) router.push("/dashboard/certifications");
    });
  });

  return (
    <form onSubmit={submit} noValidate className="space-y-6">
      <section aria-label="Informations générales" className={cardClass}>
        <SectionTitle icon={ListChecks}>Informations générales</SectionTitle>
        <div className="grid gap-5 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="name">
              Nom de la certification <span className="text-danger">*</span>
            </Label>
            <input
              id="name"
              placeholder="Ex : Microsoft Certified: Power Platform Developer Associate"
              aria-invalid={Boolean(errors.name)}
              className={inputClass}
              {...register("name")}
            />
            <FieldError message={errors.name?.message} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="issuer">
              Organisme certificateur <span className="text-danger">*</span>
            </Label>
            <div className="flex items-center gap-3">
              <input
                id="issuer"
                list="cert-issuers"
                placeholder="Ex : Microsoft, AWS, Google, Scrum.org…"
                aria-invalid={Boolean(errors.issuer)}
                className={inputClass}
                {...register("issuer")}
              />
              <IssuerLogo issuer={issuer} />
            </div>
            <datalist id="cert-issuers">
              {issuers.map((i) => (
                <option key={i} value={i} />
              ))}
            </datalist>
            <FieldError message={errors.issuer?.message} />
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-2">
            <Label htmlFor="category">Catégorie</Label>
            <input
              id="category"
              list="cert-categories"
              placeholder="Choisir ou saisir"
              className={inputClass}
              {...register("category")}
            />
            <datalist id="cert-categories">
              {categories.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
            <FieldError message={errors.category?.message} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="level">Niveau</Label>
            <select id="level" className={inputClass} defaultValue="" {...register("level")}>
              <option value="">Sélectionner un niveau</option>
              {CERTIFICATION_LEVELS.map((l) => (
                <option key={l} value={l}>
                  {CERTIFICATION_LEVEL_LABELS[l]}
                </option>
              ))}
            </select>
            <FieldError message={errors.level?.message} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="issueDate">
              Date d&apos;obtention <span className="text-danger">*</span>
            </Label>
            <div className="relative">
              <input
                id="issueDate"
                type="date"
                aria-invalid={Boolean(errors.issueDate)}
                className={inputClass}
                {...register("issueDate")}
              />
              <CalendarDays
                className="text-muted pointer-events-none absolute top-3.5 right-3 size-4 bg-white"
                aria-hidden
              />
            </div>
            <FieldError message={errors.issueDate?.message} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="expirationDate">Date d&apos;expiration</Label>
            <div className="relative">
              <input
                id="expirationDate"
                type="date"
                disabled={noExpiry}
                aria-invalid={Boolean(errors.expirationDate)}
                className={cn(inputClass, "disabled:bg-slate-50 disabled:opacity-60")}
                {...register("expirationDate")}
              />
              <CalendarDays
                className="text-muted pointer-events-none absolute top-3.5 right-3 size-4 bg-white"
                aria-hidden
              />
            </div>
            <FieldError message={errors.expirationDate?.message} />
          </div>
        </div>
        <label className="text-muted flex w-fit items-center gap-2 text-sm lg:ml-auto">
          <input
            type="checkbox"
            checked={noExpiry}
            onChange={(e) => {
              setNoExpiry(e.target.checked);
              if (e.target.checked) setValue("expirationDate", "");
            }}
            className="accent-brand size-4"
          />
          Cette certification n&apos;expire pas
        </label>

        <div className="grid gap-5 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="credentialId">
              Identifiant de la certification <span className="text-muted font-normal">(optionnel)</span>
            </Label>
            <input
              id="credentialId"
              placeholder="Ex : MS-102, C1234567"
              className={inputClass}
              {...register("credentialId")}
            />
            <FieldError message={errors.credentialId?.message} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="credentialUrl">
              URL de vérification <span className="text-muted font-normal">(optionnel)</span>
            </Label>
            <div className="flex gap-3">
              <div className="relative flex-1">
                <Link2
                  className="text-muted pointer-events-none absolute top-3.5 left-3.5 size-4"
                  aria-hidden
                />
                <input
                  id="credentialUrl"
                  type="url"
                  inputMode="url"
                  placeholder="https://"
                  aria-invalid={Boolean(errors.credentialUrl)}
                  className={cn(inputClass, "pl-10")}
                  {...register("credentialUrl")}
                />
              </div>
              {/^https?:\/\//.test(credentialUrl) ? (
                <a
                  href={credentialUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(buttonVariants({ variant: "outline" }), "shrink-0")}
                >
                  <ExternalLink /> Vérifier
                </a>
              ) : (
                <Button type="button" variant="outline" disabled className="shrink-0">
                  <ExternalLink /> Vérifier
                </Button>
              )}
            </div>
            <FieldError message={errors.credentialUrl?.message} />
          </div>
        </div>
      </section>

      <section aria-label="Description" className={cn(cardClass, "space-y-4")}>
        <SectionTitle icon={FileText} hint="(optionnelle)">
          Description
        </SectionTitle>
        <div className="relative">
          <textarea
            id="description"
            rows={4}
            maxLength={500}
            aria-label="Description"
            placeholder="Décrivez brièvement cette certification, ce que vous avez appris et en quoi elle est utile pour votre parcours professionnel…"
            className="border-border focus-visible:ring-brand/40 w-full resize-none rounded-xl border bg-white px-4 py-3 pb-8 text-sm outline-none focus-visible:ring-2"
            {...register("description")}
          />
          <span className="text-muted absolute right-3 bottom-2 text-xs">{description.length}/500</span>
        </div>
        <FieldError message={errors.description?.message} />
      </section>

      <section aria-label="Preuve de certification" className={cn(cardClass, "space-y-4")}>
        <SectionTitle icon={ImageIcon}>Preuve de certification</SectionTitle>
        <div className="grid gap-4 md:grid-cols-2">
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              pickFile(e.dataTransfer.files[0]);
            }}
            className={cn(
              "border-brand/40 flex min-h-36 flex-col items-center justify-center rounded-xl border-2 border-dashed p-5 text-center",
              dragging ? "bg-blue-100/60" : "bg-blue-50/40",
            )}
          >
            <UploadCloud className="text-brand size-9" aria-hidden />
            <p className="text-navy mt-2 text-sm font-semibold">Glissez-déposez votre certificat ici</p>
            <button
              type="button"
              onClick={() => fileInput.current?.click()}
              className="text-brand mt-0.5 text-xs font-medium hover:underline"
            >
              ou cliquez pour parcourir vos fichiers
            </button>
            <p className="text-muted mt-2 text-[11px]">Formats acceptés : PDF, PNG, JPG (Max 5 Mo)</p>
            <input
              ref={fileInput}
              type="file"
              accept=".pdf,.png,.jpg,.jpeg,.webp,application/pdf,image/png,image/jpeg,image/webp"
              aria-label="Fichier du certificat"
              className="sr-only"
              onChange={(e) => {
                pickFile(e.target.files?.[0]);
                e.target.value = "";
              }}
            />
          </div>
          {file && (
            <div className="border-border flex flex-col overflow-hidden rounded-xl border">
              <div className="relative flex min-h-24 flex-1 items-center justify-center bg-slate-50">
                {previewUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element -- local blob preview, nothing to optimize
                  <img
                    src={previewUrl}
                    alt="Aperçu du certificat"
                    className="max-h-40 w-full object-contain"
                  />
                ) : (
                  <FileUp className="text-brand size-10" aria-hidden />
                )}
                <button
                  type="button"
                  onClick={() => setFile(null)}
                  aria-label="Retirer le fichier"
                  className="text-navy absolute top-2 right-2 rounded-full bg-white/90 p-1 hover:bg-white"
                >
                  <X className="size-4" />
                </button>
              </div>
              <div className="flex items-center justify-between gap-3 px-3 py-2">
                <div className="min-w-0">
                  <p className="text-navy truncate text-xs font-semibold">{file.name}</p>
                  <p className="text-muted text-xs">{formatSize(file.size)}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setFile(null)}
                  aria-label="Supprimer le fichier"
                  className="text-muted hover:text-danger shrink-0"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            </div>
          )}
        </div>
        <FieldError message={fileError} />
      </section>

      <section aria-label="Compétences associées" className={cn(cardClass, "space-y-4")}>
        <SectionTitle icon={Sparkles} hint="(optionnel)">
          Compétences associées
        </SectionTitle>
        <p className="text-muted text-sm">
          Ajoutez les compétences liées à cette certification pour améliorer votre visibilité.
        </p>
        <div className="flex flex-wrap items-start gap-3">
          <div className="relative w-full max-w-xs">
            <Search className="text-muted pointer-events-none absolute top-3.5 left-3.5 size-4" aria-hidden />
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
                {suggestions.map((s) => (
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
          <ul aria-label="Compétences sélectionnées" className="flex flex-1 flex-wrap gap-2 pt-1">
            {skills.map((s) => (
              <li
                key={s}
                className="text-brand flex items-center gap-1.5 rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-medium"
              >
                {s}
                <button
                  type="button"
                  aria-label={`Retirer ${s}`}
                  onClick={() => setSkills(skills.filter((x) => x !== s))}
                >
                  <X className="size-3.5" />
                </button>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {serverError && (
        <p role="alert" className="text-danger rounded-lg bg-red-50 px-3 py-2 text-sm">
          {serverError}
        </p>
      )}
      <div className="flex flex-wrap justify-center gap-3">
        <Link href="/dashboard/certifications" className={buttonVariants({ variant: "outline" })}>
          Annuler
        </Link>
        <Button type="submit" disabled={pending}>
          <Save />{" "}
          {pending
            ? "Enregistrement…"
            : createdId
              ? "Réessayer l'envoi du fichier"
              : "Enregistrer la certification"}
        </Button>
      </div>
    </form>
  );
}
