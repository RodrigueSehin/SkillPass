"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, FilePlus2, Save, Send } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { MAX_EVIDENCE_FILES, type CreateEvidenceValues } from "@/schemas/evidence";
import { StepGeneral } from "./step-general";
import { StepProof } from "./step-proof";
import { StepPublish } from "./step-publish";
import { StepTech } from "./step-tech";
import {
  STEPS,
  validateDraft,
  validateFile,
  validateStep,
  type StepErrors,
  type WizardFile,
  type WizardState,
} from "./wizard-types";
import { Example, ProofSideNotes, PublishPreview, Recap, Tips } from "./wizard-side";
import { Stepper } from "./wizard-ui";

interface Props {
  skills: { id: string; name: string }[];
  /** Skill pre-selected when the wizard is opened from a skill's page. */
  initialSkillId?: string;
}

const LIST_HREF = "/dashboard/evidence";

export function EvidenceWizard({ skills, initialSkillId }: Props) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [values, setValues] = useState<WizardState>({
    type: "PROJECT",
    title: "",
    description: "",
    organization: "",
    startDate: "",
    endDate: "",
    role: "",
    url: "",
    visibility: "PUBLIC",
    technologies: [],
    skillIds: initialSkillId && skills.some((s) => s.id === initialSkillId) ? [initialSkillId] : [],
    files: [],
    tags: [],
    category: "",
    allowContact: true,
    allowRecommendations: false,
  });
  const [errors, setErrors] = useState<StepErrors>({});
  const [fileError, setFileError] = useState<string>();
  const [serverError, setServerError] = useState<string>();
  const [pending, startTransition] = useTransition();
  const previews = useRef(new Set<string>());

  // Blob URLs are released when the wizard closes.
  useEffect(() => {
    const urls = previews.current;
    return () => urls.forEach((u) => URL.revokeObjectURL(u));
  }, []);

  const patch = (next: Partial<WizardState>) => {
    setValues((v) => ({ ...v, ...next }));
    setErrors((e) => {
      const copy = { ...e };
      for (const key of Object.keys(next)) delete copy[key === "skillIds" ? "skills" : key];
      return copy;
    });
  };

  function addFiles(list: File[]) {
    const problems: string[] = [];
    const accepted: WizardFile[] = [];
    for (const file of list) {
      if (values.files.length + accepted.length >= MAX_EVIDENCE_FILES) {
        problems.push(`${MAX_EVIDENCE_FILES} fichiers maximum.`);
        break;
      }
      const problem = validateFile(file);
      if (problem) {
        problems.push(problem);
        continue;
      }
      const preview = file.type.startsWith("image/") ? URL.createObjectURL(file) : null;
      if (preview) previews.current.add(preview);
      accepted.push({ id: crypto.randomUUID(), file, preview });
    }
    setFileError(problems[0]);
    if (accepted.length) patch({ files: [...values.files, ...accepted] });
  }

  function removeFile(id: string) {
    const target = values.files.find((f) => f.id === id);
    if (target?.preview) {
      URL.revokeObjectURL(target.preview);
      previews.current.delete(target.preview);
    }
    setFileError(undefined);
    patch({ files: values.files.filter((f) => f.id !== id) });
  }

  const goTo = (next: number) => {
    setStep(next);
    setServerError(undefined);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  function next() {
    const found = validateStep(step, values);
    setErrors(found);
    if (Object.keys(found).length === 0) goTo(step + 1);
  }

  function submit(publish: boolean) {
    setServerError(undefined);
    if (publish) {
      // Everything the earlier steps ask for, in order: jump back to the first one that is incomplete.
      for (const s of [0, 1, 2]) {
        const found = validateStep(s, values);
        if (Object.keys(found).length > 0) {
          setErrors(found);
          return goTo(s);
        }
      }
    } else {
      const problem = validateDraft(values);
      if (problem) {
        setErrors(problem.errors);
        return goTo(problem.step);
      }
    }

    const data: CreateEvidenceValues = {
      talentSkillIds: values.skillIds,
      type: values.type,
      title: values.title,
      description: values.description,
      url: values.url,
      organization: values.organization,
      role: values.role,
      startDate: values.startDate,
      endDate: values.endDate,
      technologies: values.technologies,
      tags: values.tags,
      category: values.category,
      visibility: values.visibility,
      allowContact: values.allowContact,
      allowRecommendations: values.allowRecommendations,
      publish,
    };
    const body = new FormData();
    body.append("data", JSON.stringify(data));
    for (const f of values.files) body.append("files", f.file);

    startTransition(async () => {
      try {
        const res = await fetch("/api/evidence", { method: "POST", body });
        if (!res.ok) {
          const json = (await res.json().catch(() => null)) as { error?: { message?: string } } | null;
          setServerError(json?.error?.message ?? "L'envoi a échoué. Veuillez réessayer.");
          return;
        }
        const created = (await res.json()) as { id: string };
        router.push(`${LIST_HREF}?sel=${created.id}`);
        router.refresh();
      } catch {
        setServerError("Connexion impossible. Vérifiez votre réseau et réessayez.");
      }
    });
  }

  const skillNames = skills.filter((s) => values.skillIds.includes(s.id)).map((s) => s.name);
  const last = step === STEPS.length - 1;

  if (skills.length === 0) {
    return (
      <div className="border-border bg-surface rounded-2xl border border-dashed px-6 py-14 text-center">
        <h2 className="text-lg font-semibold">Ajoutez d&apos;abord une compétence</h2>
        <p className="text-muted mx-auto mt-1 max-w-md text-sm">
          Une preuve démontre une compétence : créez-en une pour pouvoir y rattacher votre preuve.
        </p>
        <Link href="/dashboard/skills/new" className={buttonVariants({ className: "mt-5" })}>
          Ajouter une compétence
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <nav aria-label="Fil d'Ariane" className="text-muted flex items-center gap-2 text-sm">
            <Link href={LIST_HREF} className="text-brand hover:underline">
              Preuves
            </Link>
            <span aria-hidden>›</span>
            <span className={last ? "text-brand" : "text-navy font-semibold"}>Ajouter une preuve</span>
            {last && (
              <>
                <span aria-hidden>›</span>
                <span aria-current="page" className="text-navy font-semibold">
                  Publication
                </span>
              </>
            )}
          </nav>
          <div className="mt-3 flex items-start gap-4">
            <span className="text-brand flex size-14 shrink-0 items-center justify-center rounded-2xl bg-blue-50">
              <FilePlus2 className="size-7" aria-hidden />
            </span>
            <div>
              <h1 className="text-navy text-2xl font-extrabold tracking-tight sm:text-3xl">Ajouter une preuve</h1>
              <p className="text-muted mt-1">
                Présentez une preuve concrète de vos compétences à travers un projet, une réalisation, une
                certification, etc.
              </p>
            </div>
          </div>
        </div>
        {step < 2 && (
          <Button type="button" variant="outline" disabled={pending} onClick={() => submit(false)}>
            <Save /> Enregistrer comme brouillon
          </Button>
        )}
      </div>

      <Stepper current={step} />

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <form
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            if (last) submit(true);
            else next();
          }}
          className="space-y-6"
        >
          {step === 0 && <StepGeneral values={values} errors={errors} patch={patch} />}
          {step === 1 && <StepTech values={values} errors={errors} patch={patch} skills={skills} />}
          {step === 2 && (
            <StepProof
              values={values}
              errors={errors}
              patch={patch}
              onFiles={addFiles}
              onRemoveFile={removeFile}
              fileError={fileError}
            />
          )}
          {step === 3 && <StepPublish values={values} patch={patch} />}

          {serverError && (
            <p role="alert" className="text-danger rounded-lg bg-red-50 px-3 py-2 text-sm">
              {serverError}
            </p>
          )}
          {Object.keys(errors).length > 0 && step !== 0 && step !== 1 && step !== 2 && (
            <p role="alert" className="text-danger rounded-lg bg-red-50 px-3 py-2 text-sm">
              {Object.values(errors)[0]}
            </p>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3">
            {step === 0 ? (
              <Link href={LIST_HREF} className={buttonVariants({ variant: "outline" })}>
                Annuler
              </Link>
            ) : (
              <Button type="button" variant="outline" disabled={pending} onClick={() => goTo(step - 1)}>
                <ArrowLeft /> Précédent
              </Button>
            )}
            <div className="flex flex-wrap items-center gap-3">
              {last && (
                <Button type="button" variant="outline" disabled={pending} onClick={() => submit(false)}>
                  <Save /> Enregistrer comme brouillon
                </Button>
              )}
              {last ? (
                <Button type="submit" disabled={pending}>
                  {pending ? "Publication…" : "Publier ma preuve"} <Send />
                </Button>
              ) : (
                <Button type="submit" disabled={pending}>
                  Suivant <ArrowRight />
                </Button>
              )}
            </div>
          </div>
        </form>

        <aside className="grid min-w-0 gap-6 md:grid-cols-2 xl:grid-cols-1">
          {step === 0 && (
            <>
              <Tips step={0} />
              <Example />
            </>
          )}
          {step === 1 && (
            <>
              <Recap step={1} values={values} skillNames={skillNames} />
              <Tips step={1} />
            </>
          )}
          {step === 2 && (
            <>
              <Recap step={2} values={values} skillNames={skillNames} onEdit={() => goTo(0)} />
              <ProofSideNotes />
            </>
          )}
          {step === 3 && <PublishPreview values={values} skillNames={skillNames} onEdit={() => goTo(0)} />}
        </aside>
      </div>
    </div>
  );
}
