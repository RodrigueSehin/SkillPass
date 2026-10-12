"use client";

import { useState } from "react";
import { ChevronDown, FileText, FolderOpen, Link2, Plus, UploadCloud, X } from "lucide-react";
import { Label } from "@/components/ui/label";
import { formatSize } from "@/lib/evidence-view";
import { cn } from "@/lib/utils/cn";
import { MAX_EVIDENCE_FILES } from "@/schemas/evidence";
import { EVIDENCE_TYPE_LABELS, USER_EVIDENCE_TYPES, type UserEvidenceType } from "@/types/evidence";
import { TYPE_ICONS } from "../evidence-bits";
import type { Patch, StepErrors, WizardState } from "./wizard-types";
import { cardClass, FieldError, inputClass, Optional, Required } from "./wizard-ui";

interface Props {
  values: WizardState;
  errors: StepErrors;
  patch: Patch;
  onFiles: (files: File[]) => void;
  onRemoveFile: (id: string) => void;
  fileError?: string;
}

const FORMATS = ["PNG", "JPG", "PDF", "WebP"];
const ACCEPT = ".png,.jpg,.jpeg,.pdf,.webp,image/png,image/jpeg,image/webp,application/pdf";

export function StepProof({ values: v, errors, patch, onFiles, onRemoveFile, fileError }: Props) {
  const [dragging, setDragging] = useState(false);
  const TypeIcon = TYPE_ICONS[v.type];
  const full = v.files.length >= MAX_EVIDENCE_FILES;
  const allImages = v.files.length > 0 && v.files.every((f) => f.preview);

  return (
    <section aria-label="Preuve" className={cardClass}>
      <div className="flex items-start gap-3">
        <span className="text-brand flex size-10 shrink-0 items-center justify-center rounded-xl bg-blue-50">
          <FileText className="size-5" aria-hidden />
        </span>
        <div>
          <h2 className="text-navy text-xl font-extrabold">Preuve</h2>
          <p className="text-muted text-sm">Ajoutez les éléments qui prouvent votre réalisation.</p>
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="ev-type">
            Type de preuve
            <Required />
          </Label>
          <div className="relative">
            <TypeIcon
              className="text-brand pointer-events-none absolute top-3.5 left-3.5 size-4"
              aria-hidden
            />
            <select
              id="ev-type"
              value={v.type}
              onChange={(e) => patch({ type: e.target.value as UserEvidenceType })}
              className={cn(inputClass, "appearance-none pr-9 pl-10")}
            >
              {USER_EVIDENCE_TYPES.map((t) => (
                <option key={t} value={t}>
                  {EVIDENCE_TYPE_LABELS[t]}
                </option>
              ))}
            </select>
            <ChevronDown
              className="text-muted pointer-events-none absolute top-3.5 right-3 size-4"
              aria-hidden
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="ev-title-3">
            Titre de la preuve
            <Required />
          </Label>
          <input
            id="ev-title-3"
            value={v.title}
            maxLength={100}
            onChange={(e) => patch({ title: e.target.value })}
            className={inputClass}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="ev-description-3">
          Description
          <Required />
        </Label>
        <div className="relative">
          <textarea
            id="ev-description-3"
            rows={3}
            maxLength={500}
            value={v.description}
            onChange={(e) => patch({ description: e.target.value })}
            className="border-border focus-visible:ring-brand/40 w-full resize-none rounded-xl border bg-white px-4 py-3 pb-8 text-sm outline-none focus-visible:ring-2"
          />
          <span className="text-muted absolute right-3 bottom-2 text-xs">{v.description.length}/500</span>
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-foreground text-sm font-medium">
          Fichiers{" "}
          <span className="text-muted font-normal">(jusqu&apos;à {MAX_EVIDENCE_FILES} fichiers)</span>
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
            onFiles([...e.dataTransfer.files]);
          }}
          className={cn(
            "border-brand/40 grid items-center gap-5 rounded-xl border-2 border-dashed p-5 md:grid-cols-[1.2fr_1fr]",
            dragging ? "bg-blue-100/60" : "bg-blue-50/30",
          )}
        >
          <div className="flex items-center justify-center gap-5">
            <UploadCloud className="text-brand size-14 shrink-0" aria-hidden />
            <div className="text-center">
              <p className="text-navy text-sm font-bold">Glissez-déposez vos fichiers ici</p>
              <p className="text-muted my-1 text-xs">ou</p>
              <label
                className={cn(
                  "bg-brand focus-within:ring-brand/40 inline-flex h-10 cursor-pointer items-center gap-2 rounded-lg px-5 text-sm font-semibold text-white focus-within:ring-2 hover:bg-blue-700",
                  full && "pointer-events-none opacity-50",
                )}
              >
                <FolderOpen className="size-4" aria-hidden /> Choisir des fichiers
                <input
                  type="file"
                  multiple
                  accept={ACCEPT}
                  disabled={full}
                  aria-label="Choisir des fichiers"
                  className="sr-only"
                  onChange={(e) => {
                    onFiles([...(e.target.files ?? [])]);
                    e.target.value = "";
                  }}
                />
              </label>
            </div>
          </div>
          <div className="md:border-border/70 md:border-l md:pl-5">
            <p className="text-navy text-xs font-semibold">Formats acceptés :</p>
            <ul className="mt-2 flex flex-wrap gap-1.5">
              {FORMATS.map((f) => (
                <li
                  key={f}
                  className="text-brand rounded-md bg-blue-100/70 px-2.5 py-1 text-[11px] font-semibold"
                >
                  {f}
                </li>
              ))}
            </ul>
            <p className="text-navy mt-2 text-xs">Taille max : 5 Mo par fichier</p>
          </div>
        </div>
        <FieldError message={fileError ?? errors.files} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="ev-url-3">
          Liens complémentaires
          <Optional />
        </Label>
        <div className="relative">
          <Link2 className="text-muted pointer-events-none absolute top-3.5 left-3.5 size-4" aria-hidden />
          <input
            id="ev-url-3"
            type="url"
            inputMode="url"
            value={v.url}
            onChange={(e) => patch({ url: e.target.value })}
            placeholder="https://…"
            aria-invalid={Boolean(errors.url)}
            className={cn(inputClass, "pl-10")}
          />
        </div>
        <FieldError message={errors.url} />
      </div>

      {v.files.length > 0 && (
        <div className="space-y-2">
          <p className="text-navy text-sm font-bold">
            {allImages ? "Captures d'écran ajoutées" : "Fichiers ajoutés"} ({v.files.length})
          </p>
          <ul className="flex flex-wrap gap-3">
            {v.files.map((f) => (
              <li
                key={f.id}
                className="border-border relative w-44 overflow-hidden rounded-xl border bg-white"
              >
                {f.preview ? (
                  // eslint-disable-next-line @next/next/no-img-element -- local blob preview, nothing to optimize
                  <img src={f.preview} alt={f.name} className="h-24 w-full object-cover" />
                ) : (
                  <div className="flex h-24 w-full items-center justify-center bg-red-50 text-red-500">
                    <FileText className="size-8" aria-hidden />
                  </div>
                )}
                <p className="text-navy truncate px-2.5 pt-1.5 text-xs font-medium">{f.name}</p>
                <p className="text-muted px-2.5 pb-1.5 text-[11px]">{formatSize(f.size)}</p>
                <button
                  type="button"
                  aria-label={`Retirer ${f.name}`}
                  onClick={() => onRemoveFile(f.id)}
                  className="text-brand absolute top-1.5 right-1.5 flex size-6 items-center justify-center rounded-md bg-white/95 shadow"
                >
                  <X className="size-4" />
                </button>
              </li>
            ))}
            {!full && (
              <li>
                <label className="border-brand/40 text-brand focus-within:ring-brand/40 flex h-full min-h-32 w-44 cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed text-xs font-medium focus-within:ring-2 hover:bg-blue-50">
                  <Plus className="size-6" aria-hidden /> Ajouter un fichier
                  <input
                    type="file"
                    multiple
                    accept={ACCEPT}
                    aria-label="Ajouter un fichier"
                    className="sr-only"
                    onChange={(e) => {
                      onFiles([...(e.target.files ?? [])]);
                      e.target.value = "";
                    }}
                  />
                </label>
              </li>
            )}
          </ul>
        </div>
      )}
    </section>
  );
}
