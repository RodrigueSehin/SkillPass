"use client";

import { useState } from "react";
import { ChevronDown, Handshake, Search, Sparkles, X } from "lucide-react";
import { Label } from "@/components/ui/label";
import { EVIDENCE_CATEGORIES, TAG_IDEAS } from "@/lib/evidence-options";
import { cn } from "@/lib/utils/cn";
import { VisibilityPicker } from "./visibility-picker";
import type { Patch, WizardState } from "./wizard-types";
import { cardClass, inputClass } from "./wizard-ui";

const same = (a: string, b: string) => a.toLowerCase() === b.toLowerCase();

function Check({
  checked,
  onChange,
  icon: Icon,
  title,
  hint,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  icon: typeof Sparkles;
  title: string;
  hint: string;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-3 py-3">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="accent-brand mt-1 size-4 shrink-0"
      />
      <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-brand">
        <Icon className="size-4" aria-hidden />
      </span>
      <span>
        <span className="text-navy block text-sm font-semibold">{title}</span>
        <span className="text-muted block text-xs">{hint}</span>
      </span>
    </label>
  );
}

export function StepPublish({ values: v, patch }: { values: WizardState; patch: Patch }) {
  const [query, setQuery] = useState("");

  const addTag = (value: string) => {
    const tag = value.trim().slice(0, 60);
    if (tag && v.tags.length < 15 && !v.tags.some((t) => same(t, tag))) patch({ tags: [...v.tags, tag] });
    setQuery("");
  };
  const ideas = TAG_IDEAS.filter((t) => !v.tags.some((x) => same(x, t)));

  return (
    <section aria-label="Publication" className={cn(cardClass, "space-y-6")}>
      <div>
        <h2 className="text-navy text-xl font-extrabold">Publication</h2>
        <p className="text-muted text-sm">
          Choisissez la visibilité de cette preuve, ajoutez des tags et publiez-la sur votre profil.
        </p>
      </div>

      <div className="space-y-2">
        <p className="text-navy text-sm font-bold">
          Visibilité<span className="text-danger"> *</span>
        </p>
        <VisibilityPicker withIcons value={v.visibility} onChange={(visibility) => patch({ visibility })} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="ev-tag">
          Tags <span className="text-muted font-normal">(optionnel)</span>
        </Label>
        <p className="text-muted text-xs">Ajoutez des mots-clés pour améliorer la découverte de votre preuve.</p>
        <div className="relative">
          <Search className="text-muted pointer-events-none absolute top-3.5 left-3.5 size-4" aria-hidden />
          <input
            id="ev-tag"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === ",") {
                e.preventDefault();
                addTag(query);
              }
            }}
            placeholder="Rechercher ou ajouter un tag… (Entrée pour valider)"
            className={cn(inputClass, "pl-10")}
          />
        </div>
        {v.tags.length > 0 && (
          <ul aria-label="Tags" className="flex flex-wrap gap-2">
            {v.tags.map((t) => (
              <li key={t} className="text-brand border-brand/40 flex items-center gap-2 rounded-full border bg-blue-50/50 px-3.5 py-1.5 text-xs font-medium">
                {t}
                <button type="button" aria-label={`Retirer ${t}`} onClick={() => patch({ tags: v.tags.filter((x) => x !== t) })}>
                  <X className="size-3.5" />
                </button>
              </li>
            ))}
          </ul>
        )}
        {ideas.length > 0 && (
          <ul aria-label="Suggestions de tags" className="flex flex-wrap gap-2 pt-1">
            {ideas.map((t) => (
              <li key={t}>
                <button
                  type="button"
                  onClick={() => addTag(t)}
                  className="border-border text-navy rounded-full border bg-white px-3 py-1 text-xs hover:bg-slate-50"
                >
                  + {t}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="ev-category">
          Catégorie <span className="text-muted font-normal">(optionnel)</span>
        </Label>
        <div className="relative">
          <select
            id="ev-category"
            value={v.category}
            onChange={(e) => patch({ category: e.target.value })}
            className={cn(inputClass, "appearance-none pr-9")}
          >
            <option value="">Aucune catégorie</option>
            {EVIDENCE_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <ChevronDown className="text-muted pointer-events-none absolute top-3.5 right-3 size-4" aria-hidden />
        </div>
      </div>

      <div>
        <p className="text-navy text-sm font-bold">
          Autoriser l&apos;utilisation de cette preuve <span className="text-muted font-normal">(optionnel)</span>
        </p>
        <div className="border-border mt-2 divide-y rounded-xl border px-4">
          <Check
            checked={v.allowContact}
            onChange={(allowContact) => patch({ allowContact })}
            icon={Handshake}
            title="Permettre aux recruteurs de me contacter à propos de cette preuve"
            hint="Les recruteurs pourront vous contacter pour des opportunités liées à cette réalisation."
          />
          <Check
            checked={v.allowRecommendations}
            onChange={(allowRecommendations) => patch({ allowRecommendations })}
            icon={Sparkles}
            title="Autoriser l'affichage de cette preuve dans les recommandations automatiques"
            hint="Cette preuve pourra être utilisée pour renforcer la pertinence des recommandations IA."
          />
        </div>
      </div>
    </section>
  );
}
