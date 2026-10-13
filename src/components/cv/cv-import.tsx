"use client";

import { useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckCircle2, FileText, Info, ShieldCheck, Sparkles, UploadCloud } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";
import { MAX_UPLOAD_BYTES } from "@/schemas/evidence";
import type { CvImportResult, CvProposal } from "@/types/cv-import";
import { SKILL_LEVELS, SKILL_LEVEL_LABELS, type SkillLevel } from "@/types/skill";

const MONTH = new Intl.DateTimeFormat("fr-FR", { month: "short", year: "numeric", timeZone: "UTC" });
const month = (iso: string) => MONTH.format(new Date(`${iso}T00:00:00Z`));

type Selection = { skills: Set<number>; experiences: Set<number>; certifications: Set<number> };

const apiError = async (res: Response | null, fallback: string) => {
  const json = (await res?.json().catch(() => null)) as { error?: { message?: string } } | null;
  return json?.error?.message ?? fallback;
};

/** Upload → review → import. The model only proposes: nothing is created before the person confirms. */
export function CvImport() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [agreed, setAgreed] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [proposal, setProposal] = useState<CvProposal>();
  const [levels, setLevels] = useState<Record<number, SkillLevel>>({});
  const [selection, setSelection] = useState<Selection>();
  const [result, setResult] = useState<CvImportResult>();
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();

  function pick(candidate: File | undefined) {
    setError(undefined);
    if (!candidate) return;
    if (candidate.type !== "application/pdf") return setError("Importez votre CV au format PDF.");
    if (candidate.size > MAX_UPLOAD_BYTES) return setError("Fichier trop volumineux (5 Mo maximum).");
    setFile(candidate);
  }

  function analyze() {
    if (!file) return;
    setError(undefined);
    startTransition(async () => {
      const body = new FormData();
      body.append("file", file);
      const res = await fetch("/api/cv/analyze", { method: "POST", body }).catch(() => null);
      if (!res?.ok) return setError(await apiError(res, "L'analyse a échoué. Veuillez réessayer."));
      const found = (await res.json()) as CvProposal;
      setProposal(found);
      setLevels(Object.fromEntries(found.skills.map((s, i) => [i, s.level])));
      const fresh = (list: { exists: boolean }[]) =>
        new Set(list.flatMap((item, i) => (item.exists ? [] : [i])));
      setSelection({
        skills: fresh(found.skills),
        experiences: fresh(found.experiences),
        certifications: fresh(found.certifications),
      });
    });
  }

  function toggle(kind: keyof Selection, index: number) {
    setSelection((current) => {
      if (!current) return current;
      const next = new Set(current[kind]);
      if (!next.delete(index)) next.add(index);
      return { ...current, [kind]: next };
    });
  }

  function save() {
    if (!proposal || !selection) return;
    setError(undefined);
    // Optional fields are left out rather than sent as null: the forms' schemas expect them absent.
    const strip = <T extends Record<string, unknown>>(o: T) =>
      Object.fromEntries(
        Object.entries(o).filter(([k, v]) => k !== "exists" && v !== null && v !== undefined),
      );
    const body = {
      skills: proposal.skills
        .map((s, i) => ({ s, i }))
        .filter(({ i }) => selection.skills.has(i))
        .map(({ s, i }) => ({
          name: s.name,
          level: levels[i] ?? s.level,
          yearsOfExperience: s.yearsOfExperience,
        })),
      experiences: proposal.experiences.filter((_, i) => selection.experiences.has(i)).map((e) => strip(e)),
      certifications: proposal.certifications
        .filter((_, i) => selection.certifications.has(i))
        .map((c) => strip(c)),
    };
    startTransition(async () => {
      const res = await fetch("/api/cv/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }).catch(() => null);
      if (!res?.ok) return setError(await apiError(res, "L'import a échoué. Veuillez réessayer."));
      setResult((await res.json()) as CvImportResult);
      router.refresh();
    });
  }

  if (result) return <Done result={result} />;

  if (!proposal || !selection) {
    return (
      <section className="border-border/60 shadow-soft space-y-5 rounded-2xl border bg-white p-6">
        <div className="flex items-start gap-3">
          <ShieldCheck className="text-brand mt-0.5 size-6 shrink-0" aria-hidden />
          <div className="space-y-1 text-sm">
            <p className="text-navy font-semibold">Votre CV est lu, pas conservé.</p>
            <p className="text-muted">
              Le PDF est transmis à notre prestataire d&apos;IA (Anthropic) le temps de l&apos;analyse, puis
              oublié par SkillPass. Vous vérifiez ensuite chaque élément avant qu&apos;il n&apos;entre dans
              votre profil.
            </p>
          </div>
        </div>

        <label className="flex items-start gap-3 text-sm">
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            className="accent-brand mt-0.5 size-4"
          />
          J&apos;ai compris que mon CV sera transmis à ce prestataire pour être analysé.
        </label>

        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            if (agreed) pick(e.dataTransfer.files[0]);
          }}
          className={cn(
            "border-brand/40 flex min-h-40 flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-6 text-center",
            agreed ? "bg-blue-50/40" : "bg-slate-50 opacity-60",
          )}
        >
          <UploadCloud className="text-brand size-10" aria-hidden />
          {file ? (
            <p className="text-navy flex items-center gap-2 text-sm font-medium">
              <FileText className="size-4" aria-hidden /> {file.name}
            </p>
          ) : (
            <p className="text-navy text-sm">Glissez votre CV ici ou</p>
          )}
          <Button type="button" variant="outline" disabled={!agreed} onClick={() => fileRef.current?.click()}>
            Choisir un fichier PDF
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept=".pdf,application/pdf"
            aria-label="CV au format PDF"
            className="sr-only"
            onChange={(e) => {
              pick(e.target.files?.[0]);
              e.target.value = "";
            }}
          />
          <p className="text-muted text-xs">PDF uniquement · 5 Mo maximum</p>
        </div>

        {error && (
          <p role="alert" className="text-danger rounded-lg bg-red-50 px-3 py-2 text-sm">
            {error}
          </p>
        )}
        <Button type="button" onClick={analyze} disabled={!agreed || !file || pending}>
          <Sparkles /> {pending ? "Analyse en cours… (jusqu'à une minute)" : "Analyser mon CV"}
        </Button>
      </section>
    );
  }

  const total = selection.skills.size + selection.experiences.size + selection.certifications.size;
  const empty = !proposal.skills.length && !proposal.experiences.length && !proposal.certifications.length;

  return (
    <div className="space-y-6">
      <p className="text-muted flex items-start gap-2 text-sm">
        <Info className="mt-0.5 size-4 shrink-0" aria-hidden />
        Relisez ce que l&apos;assistant a trouvé : l&apos;IA peut se tromper. Décochez ce que vous ne voulez
        pas importer ; vous pourrez tout modifier ensuite depuis chaque page.
      </p>
      {empty && (
        <p className="border-border rounded-xl border border-dashed p-6 text-center text-sm">
          Rien d&apos;exploitable n&apos;a été trouvé dans ce document. Vérifiez qu&apos;il s&apos;agit bien
          d&apos;un CV en PDF avec du texte.
        </p>
      )}

      <Group title="Compétences" count={proposal.skills.length} show={proposal.skills.length > 0}>
        {proposal.skills.map((s, i) => (
          <Row
            key={s.name}
            checked={selection.skills.has(i)}
            exists={s.exists}
            onToggle={() => toggle("skills", i)}
            label={s.name}
          >
            <select
              aria-label={`Niveau de ${s.name}`}
              disabled={s.exists}
              value={levels[i] ?? s.level}
              onChange={(e) => setLevels((l) => ({ ...l, [i]: e.target.value as SkillLevel }))}
              className="border-border h-8 rounded-lg border bg-white px-2 text-xs"
            >
              {SKILL_LEVELS.map((l) => (
                <option key={l} value={l}>
                  {SKILL_LEVEL_LABELS[l]}
                </option>
              ))}
            </select>
          </Row>
        ))}
      </Group>

      <Group title="Expériences" count={proposal.experiences.length} show={proposal.experiences.length > 0}>
        {proposal.experiences.map((e, i) => (
          <Row
            key={`${e.company}${e.title}${e.startDate}`}
            checked={selection.experiences.has(i)}
            exists={e.exists}
            onToggle={() => toggle("experiences", i)}
            label={`${e.title} · ${e.company}`}
            detail={`${month(e.startDate)} – ${e.endDate ? month(e.endDate) : "en cours"}`}
          >
            {e.description && <p className="text-muted mt-1 text-xs">{e.description}</p>}
          </Row>
        ))}
      </Group>

      <Group
        title="Certifications"
        count={proposal.certifications.length}
        show={proposal.certifications.length > 0}
      >
        {proposal.certifications.map((c, i) => (
          <Row
            key={`${c.name}${c.issuer}`}
            checked={selection.certifications.has(i)}
            exists={c.exists}
            onToggle={() => toggle("certifications", i)}
            label={`${c.name} · ${c.issuer}`}
            detail={`Obtenue en ${month(c.issueDate)}`}
          />
        ))}
      </Group>

      {error && (
        <p role="alert" className="text-danger rounded-lg bg-red-50 px-3 py-2 text-sm">
          {error}
        </p>
      )}
      <div className="flex flex-wrap items-center gap-3">
        <Button type="button" onClick={save} disabled={pending || total === 0}>
          {pending ? "Import…" : `Importer ${total} élément${total > 1 ? "s" : ""}`}
        </Button>
        <Button type="button" variant="outline" disabled={pending} onClick={() => setProposal(undefined)}>
          Recommencer
        </Button>
      </div>
    </div>
  );
}

function Group({
  title,
  count,
  show,
  children,
}: {
  title: string;
  count: number;
  show: boolean;
  children: React.ReactNode;
}) {
  if (!show) return null;
  return (
    <section className="border-border/60 shadow-soft rounded-2xl border bg-white p-5">
      <h2 className="text-navy text-lg font-bold">
        {title} <span className="text-muted text-sm font-normal">({count})</span>
      </h2>
      <ul className="divide-border/60 mt-3 divide-y">{children}</ul>
    </section>
  );
}

function Row({
  checked,
  exists,
  onToggle,
  label,
  detail,
  children,
}: {
  checked: boolean;
  exists: boolean;
  onToggle: () => void;
  label: string;
  detail?: string;
  children?: React.ReactNode;
}) {
  return (
    <li className="flex items-start gap-3 py-3">
      <input
        type="checkbox"
        aria-label={label}
        checked={checked}
        disabled={exists}
        onChange={onToggle}
        className="accent-brand mt-1 size-4 shrink-0"
      />
      <div className="min-w-0 flex-1">
        <p className="text-navy text-sm font-semibold">{label}</p>
        {detail && <p className="text-muted text-xs">{detail}</p>}
        {exists && <p className="text-muted text-xs">Déjà dans votre profil</p>}
        {!detail && !exists && null}
        {children && !exists && <div className="mt-1.5">{children}</div>}
      </div>
    </li>
  );
}

function Done({ result }: { result: CvImportResult }) {
  const links = [
    ["skills", "compétence", "/dashboard/skills"],
    ["experiences", "expérience", "/dashboard/experiences"],
    ["certifications", "certification", "/dashboard/certifications"],
  ] as const;
  return (
    <section className="border-border/60 shadow-soft space-y-4 rounded-2xl border bg-white p-6">
      <h2 className="text-navy flex items-center gap-2 text-lg font-bold">
        <CheckCircle2 className="text-success size-6" aria-hidden /> Import terminé
      </h2>
      <ul className="space-y-1 text-sm">
        {links.map(([kind, noun, href]) => (
          <li key={kind}>
            {result.imported[kind]} {noun}
            {result.imported[kind] > 1 ? "s" : ""} ajoutée{result.imported[kind] > 1 ? "s" : ""} ·{" "}
            <Link href={href} className="text-brand hover:underline">
              Voir
            </Link>
          </li>
        ))}
      </ul>
      {result.skipped.length > 0 && (
        <div className="rounded-xl bg-amber-50 p-4 text-sm">
          <p className="font-semibold text-amber-800">Non importés ({result.skipped.length})</p>
          <ul className="mt-1 list-disc space-y-0.5 pl-5 text-amber-900">
            {result.skipped.map((s) => (
              <li key={`${s.kind}${s.label}`}>
                {s.label} : {s.reason}
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
