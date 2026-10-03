"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ALLOWED_UPLOADS, createEvidenceSchema, MAX_UPLOAD_BYTES, requiresFile } from "@/schemas/evidence";
import {
  EVIDENCE_TYPE_LABELS,
  URL_EVIDENCE_TYPES,
  USER_EVIDENCE_TYPES,
  type EvidenceType,
} from "@/types/evidence";

export interface EvidenceFormOptions {
  skills: { id: string; name: string }[];
  projects: { id: string; name: string }[];
}

interface EvidenceFormProps extends EvidenceFormOptions {
  /** Pre-selected skill (e.g. when opened from a skill's detail page). */
  skillId?: string;
  onDone: () => void;
}

const selectClass = "h-11 w-full rounded-xl border border-border bg-surface px-4 text-sm";
const ACCEPT = Object.keys(ALLOWED_UPLOADS).join(",");

export function EvidenceForm({ skills, projects, skillId, onDone }: EvidenceFormProps) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [values, setValues] = useState({
    talentSkillId: skillId ?? skills[0]?.id ?? "",
    projectId: "",
    type: "PROJECT" as EvidenceType,
    title: "",
    description: "",
    url: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string>();
  const [pending, startTransition] = useTransition();

  const set = (name: keyof typeof values, value: string) => setValues((v) => ({ ...v, [name]: value }));
  const isUrlType = URL_EVIDENCE_TYPES.includes(values.type);
  const fileRequired = requiresFile(values.type as never);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setServerError(undefined);

    const next: Record<string, string> = {};
    const parsed = createEvidenceSchema.safeParse(values);
    if (!parsed.success)
      for (const issue of parsed.error.issues) next[String(issue.path[0])] ??= issue.message;

    const file = fileRef.current?.files?.[0];
    if (!isUrlType) {
      if (fileRequired && !file) next.file = "Ajoutez un fichier pour ce type de preuve";
      if (file && file.size > MAX_UPLOAD_BYTES) next.file = "Fichier trop volumineux (5 Mo maximum)";
      if (file && !(file.type in ALLOWED_UPLOADS)) next.file = "Format non accepté (PDF, PNG, JPEG ou WebP)";
    }
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    const body = new FormData();
    for (const [key, value] of Object.entries(values)) body.append(key, value);
    if (file && !isUrlType) body.append("file", file);

    startTransition(async () => {
      try {
        const res = await fetch("/api/evidence", { method: "POST", body });
        if (!res.ok) {
          const payload = await res.json().catch(() => null);
          setServerError(payload?.error?.message ?? "L'envoi a échoué. Veuillez réessayer.");
          return;
        }
        router.refresh();
        onDone();
      } catch {
        setServerError("Connexion impossible. Vérifiez votre réseau et réessayez.");
      }
    });
  }

  if (skills.length === 0) {
    return (
      <p className="text-muted text-sm">
        Ajoutez d&apos;abord une compétence pour pouvoir y rattacher une preuve.
      </p>
    );
  }

  const error = (name: string) =>
    errors[name] && (
      <p role="alert" className="text-danger text-sm">
        {errors[name]}
      </p>
    );

  return (
    <form onSubmit={submit} noValidate className="max-h-[70vh] space-y-4 overflow-y-auto pr-1">
      <div className="space-y-2">
        <Label htmlFor="ev-skill">Compétence démontrée</Label>
        <select
          id="ev-skill"
          className={selectClass}
          value={values.talentSkillId}
          onChange={(e) => set("talentSkillId", e.target.value)}
        >
          {skills.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
        {error("talentSkillId")}
      </div>

      <div className="space-y-2">
        <Label htmlFor="ev-type">Type de preuve</Label>
        <select
          id="ev-type"
          className={selectClass}
          value={values.type}
          onChange={(e) => set("type", e.target.value)}
        >
          {USER_EVIDENCE_TYPES.map((t) => (
            <option key={t} value={t}>
              {EVIDENCE_TYPE_LABELS[t]}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="ev-title">Titre</Label>
        <Input
          id="ev-title"
          value={values.title}
          onChange={(e) => set("title", e.target.value)}
          aria-invalid={Boolean(errors.title)}
        />
        {error("title")}
      </div>

      <div className="space-y-2">
        <Label htmlFor="ev-description">Description (optionnel)</Label>
        <textarea
          id="ev-description"
          rows={3}
          value={values.description}
          onChange={(e) => set("description", e.target.value)}
          className="border-border bg-surface w-full rounded-xl border px-4 py-3 text-sm"
        />
      </div>

      {isUrlType ? (
        <div className="space-y-2">
          <Label htmlFor="ev-url">URL</Label>
          <Input
            id="ev-url"
            type="url"
            placeholder="https://…"
            value={values.url}
            onChange={(e) => set("url", e.target.value)}
            aria-invalid={Boolean(errors.url)}
          />
          {error("url")}
        </div>
      ) : (
        <div className="space-y-2">
          <Label htmlFor="ev-file">Fichier {fileRequired ? "" : "(optionnel)"}</Label>
          <input
            id="ev-file"
            ref={fileRef}
            type="file"
            accept={ACCEPT}
            className="file:text-brand block w-full text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-blue-50 file:px-4 file:py-2 file:font-semibold"
          />
          <p className="text-muted text-xs">PDF, PNG, JPEG ou WebP · 5 Mo maximum</p>
          {error("file")}
        </div>
      )}

      {values.type === "PROJECT" && projects.length > 0 && (
        <div className="space-y-2">
          <Label htmlFor="ev-project">Projet associé (optionnel)</Label>
          <select
            id="ev-project"
            className={selectClass}
            value={values.projectId}
            onChange={(e) => set("projectId", e.target.value)}
          >
            <option value="">Aucun</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {serverError && (
        <p role="alert" className="text-danger rounded-lg bg-red-50 px-3 py-2 text-sm">
          {serverError}
        </p>
      )}
      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="outline" onClick={onDone}>
          Annuler
        </Button>
        <Button type="submit" disabled={pending}>
          {pending ? "Envoi…" : "Ajouter la preuve"}
        </Button>
      </div>
    </form>
  );
}
