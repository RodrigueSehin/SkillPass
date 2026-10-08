"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { saveOrgSkillAction } from "@/app/business/competences/actions";
import { Label } from "@/components/ui/label";
import { skillVisual } from "@/config/skill-visuals";
import { stripFormatting } from "@/lib/rich-text";
import { orgSkillSchema } from "@/schemas/org-skill";
import { cn } from "@/lib/utils/cn";
import {
  SKILL_CATEGORIES,
  SKILL_KINDS,
  SKILL_KIND_LABELS,
  type OrgSkillDTO,
  type SkillKind,
} from "@/types/org-skill";
import { SKILL_LEVELS, SKILL_LEVEL_LABELS } from "@/types/skill";
import { MarkdownEditor } from "./markdown-editor";
import { TagInput } from "./tag-input";
import { PreviewPanel, WizardHeader, InfoBox } from "./wizard-parts";
import { Panel } from "./ui";

const field =
  "border-border focus-visible:ring-brand/40 h-11 w-full rounded-xl border bg-white px-4 text-sm outline-none focus-visible:ring-2 aria-[invalid=true]:border-danger";
const MAX_NAME = 100;
const MAX_DESCRIPTION = 2000;
const TIPS = [
  "Utilisez un nom clair et reconnu sur le marché",
  "Ajoutez une description précise et concise",
  "Choisissez la bonne catégorie",
  "Renseignez des mots-clés pertinents",
  "Incluez des synonymes pour améliorer la recherche",
];

function Section({
  n,
  title,
  text,
  children,
}: {
  n: number;
  title: string;
  text: string;
  children: React.ReactNode;
}) {
  return (
    <Panel className="p-6">
      <div className="flex items-start gap-3">
        <span className="bg-brand flex size-9 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white">
          {n}
        </span>
        <div>
          <h2 className="text-navy text-lg font-bold">{title}</h2>
          <p className="text-muted text-sm">{text}</p>
        </div>
      </div>
      <div className="mt-5 space-y-5">{children}</div>
    </Panel>
  );
}

export function SkillForm({ skill, knownCategories }: { skill?: OrgSkillDTO; knownCategories: string[] }) {
  const router = useRouter();
  const editing = Boolean(skill);
  const [name, setName] = useState(skill?.name ?? "");
  const [category, setCategory] = useState(skill?.category ?? "");
  const [kind, setKind] = useState<SkillKind>(skill?.kind ?? "TECHNICAL");
  const [description, setDescription] = useState(skill?.description ?? "");
  const [keywords, setKeywords] = useState(skill?.keywords ?? []);
  const [synonyms, setSynonyms] = useState(skill?.synonyms ?? []);
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();
  const categories = [...new Set([...SKILL_CATEGORIES, ...knownCategories, ...(category ? [category] : [])])];
  const visual = skillVisual(name);

  function save() {
    setError(undefined);
    const values = { name, category, kind, description, keywords, synonyms };
    const parsed = orgSkillSchema.safeParse(values);
    if (!parsed.success) return setError(parsed.error.issues[0]?.message ?? "Compétence invalide");
    startTransition(async () => {
      const result = await saveOrgSkillAction(skill?.id ?? null, values);
      if (result.error) setError(result.error);
      else router.push("/business/competences?tab=referential");
    });
  }

  return (
    <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
      <div className="min-w-0 space-y-6">
        <WizardHeader
          trail={[
            { label: "Compétences", href: "/business/competences" },
            { label: editing ? "Modifier la compétence" : "Ajouter une compétence" },
          ]}
          title={editing ? "Modifier la compétence" : "Ajouter une compétence"}
          description="Ajoutez une compétence à votre référentiel pour l'utiliser dans vos offres d'emploi et évaluations."
          backHref="/business/competences"
        />

        <Section n={1} title="Informations générales" text="Définissez les détails de la compétence.">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="skill-name">
                Nom de la compétence <span className="text-danger">*</span>
              </Label>
              <input
                id="skill-name"
                value={name}
                maxLength={MAX_NAME}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex : Power Apps"
                className={field}
              />
              <p className="text-muted text-right text-xs">
                {name.length}/{MAX_NAME}
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="skill-category">
                Catégorie <span className="text-danger">*</span>
              </Label>
              <select
                id="skill-category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className={field}
              >
                <option value="">Choisir une catégorie</option>
                {categories.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="skill-description">
              Description <span className="text-danger">*</span>
            </Label>
            <MarkdownEditor
              id="skill-description"
              value={description}
              onChange={setDescription}
              maxLength={MAX_DESCRIPTION}
            />
          </div>
        </Section>

        <Section
          n={2}
          title="Classification et niveau"
          text="Définissez les niveaux de maîtrise et les critères d'évaluation."
        >
          <div className="grid gap-5 md:grid-cols-[1fr_1.2fr]">
            <fieldset className="space-y-2">
              <legend className="text-sm font-medium">
                Type de compétence <span className="text-danger">*</span>
              </legend>
              {SKILL_KINDS.map((k) => (
                <label key={k} className="flex items-center gap-2.5 text-sm">
                  <input
                    type="radio"
                    name="skill-kind"
                    checked={kind === k}
                    onChange={() => setKind(k)}
                    className="accent-brand size-4"
                  />
                  {SKILL_KIND_LABELS[k].title}
                </label>
              ))}
            </fieldset>
            <div className="space-y-2">
              <span className="text-sm font-medium">Niveaux de maîtrise</span>
              <p className="border-border flex h-11 items-center rounded-xl border bg-slate-50 px-4 text-sm">
                4 niveaux (Débutant → Expert)
              </p>
              <p className="text-muted text-[11px]">
                Échelle standard de SkillPass, la même pour tous les talents.
              </p>
              <p className="text-muted text-[11px]">
                La demande du marché est calculée à partir des offres publiées.
              </p>
            </div>
          </div>
        </Section>

        <Section
          n={3}
          title="Mots-clés et synonymes"
          text="Ajoutez des termes associés pour améliorer la recherche."
        >
          <div className="space-y-2">
            <Label htmlFor="skill-keywords">
              Mots-clés <span className="text-danger">*</span>
            </Label>
            <TagInput
              id="skill-keywords"
              label="Mots-clés"
              value={keywords}
              onChange={setKeywords}
              catalog={[]}
              placeholder="Ajouter un mot-clé… (Entrée pour valider)"
              max={20}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="skill-synonyms">Synonymes</Label>
            <TagInput
              id="skill-synonyms"
              label="Synonymes"
              value={synonyms}
              onChange={setSynonyms}
              catalog={[]}
              placeholder="Ajouter un synonyme… (Entrée pour valider)"
              max={20}
            />
          </div>
        </Section>

        {error && (
          <p role="alert" className="text-danger rounded-lg bg-red-50 px-3 py-2 text-sm">
            {error}
          </p>
        )}
        <div className="flex items-center justify-between">
          <Link
            href="/business/competences"
            className="border-brand/40 text-brand flex h-11 items-center rounded-xl border bg-white px-6 text-sm font-semibold hover:bg-blue-50"
          >
            Annuler
          </Link>
          <button
            type="button"
            disabled={pending}
            onClick={save}
            className="bg-brand h-11 rounded-xl px-6 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
          >
            {pending ? "Enregistrement…" : "Enregistrer la compétence"}
          </button>
        </div>
      </div>

      <aside className="space-y-5 xl:pt-1">
        <InfoBox tone="tip" title="Conseils pour une bonne compétence">
          <ul className="mt-1 space-y-2">
            {TIPS.map((t) => (
              <li key={t} className="text-navy flex items-start gap-2.5 text-sm">
                <Check className="mt-0.5 size-4 shrink-0 text-green-600" aria-hidden /> {t}
              </li>
            ))}
          </ul>
        </InfoBox>
        <PreviewPanel title="Aperçu de la compétence">
          <div className="border-border/70 rounded-xl border p-4">
            <div className="flex items-start gap-3">
              <span
                className={cn("flex size-14 shrink-0 items-center justify-center rounded-2xl", visual.tile)}
              >
                <visual.icon className="size-7" aria-hidden />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-navy text-lg font-bold">{name || "Nom de la compétence"}</p>
                {category && (
                  <span className="text-brand mt-1 inline-block rounded-md bg-blue-50 px-2 py-0.5 text-xs font-medium">
                    {category}
                  </span>
                )}
              </div>
              <span className="text-brand rounded-md bg-blue-50 px-2.5 py-1 text-xs font-medium">
                {SKILL_KIND_LABELS[kind].short}
              </span>
            </div>
            <p className="text-muted mt-3 line-clamp-6 text-sm leading-relaxed">
              {stripFormatting(description) || "La description apparaîtra ici."}
            </p>
            <h3 className="text-navy mt-5 text-sm font-bold">Niveaux de maîtrise</h3>
            <ol className="relative mt-3 grid grid-cols-4 text-center text-xs">
              {SKILL_LEVELS.map((l, i) => (
                <li key={l} className="relative">
                  <span
                    className={cn(
                      "mx-auto flex size-7 items-center justify-center rounded-full text-xs font-bold",
                      "text-brand bg-blue-100",
                    )}
                  >
                    {i + 1}
                  </span>
                  <span className="text-navy mt-1 block">{SKILL_LEVEL_LABELS[l]}</span>
                </li>
              ))}
            </ol>
            {keywords.length > 0 && (
              <>
                <h3 className="text-navy mt-5 text-sm font-bold">Mots-clés</h3>
                <ul className="mt-2 flex flex-wrap gap-1.5">
                  {keywords.map((k) => (
                    <li key={k} className="text-brand rounded-lg bg-blue-50 px-2.5 py-1 text-xs font-medium">
                      {k}
                    </li>
                  ))}
                </ul>
              </>
            )}
            {synonyms.length > 0 && (
              <>
                <h3 className="text-navy mt-5 text-sm font-bold">Synonymes</h3>
                <ul className="mt-2 flex flex-wrap gap-1.5">
                  {synonyms.map((k) => (
                    <li key={k} className="text-brand rounded-lg bg-blue-50 px-2.5 py-1 text-xs font-medium">
                      {k}
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        </PreviewPanel>
      </aside>
    </div>
  );
}
