"use client";

import { useState } from "react";
import { Check, Plus, Search, X } from "lucide-react";
import { TECH_CATALOG, TECH_GROUPS, type TechGroup } from "@/lib/evidence-options";
import { cn } from "@/lib/utils/cn";
import type { Patch, StepErrors, WizardState } from "./wizard-types";
import { cardClass, FieldError, inputClass } from "./wizard-ui";

interface Props {
  values: WizardState;
  errors: StepErrors;
  patch: Patch;
  skills: { id: string; name: string }[];
}

const same = (a: string, b: string) => a.toLowerCase() === b.toLowerCase();

export function StepTech({ values: v, errors, patch, skills }: Props) {
  const [query, setQuery] = useState("");
  const [group, setGroup] = useState<TechGroup | "ALL">("ALL");
  const [skillQuery, setSkillQuery] = useState("");

  const q = query.trim().toLowerCase();
  const tiles = TECH_CATALOG.filter(
    (t) => (group === "ALL" || t.group === group) && (!q || t.name.toLowerCase().includes(q)),
  );
  const custom = v.technologies.filter((t) => !TECH_CATALOG.some((c) => same(c.name, t)));
  const canAddCustom =
    q.length > 0 &&
    !v.technologies.some((t) => same(t, query.trim())) &&
    !tiles.some((t) => same(t.name, query.trim()));

  const toggleTech = (name: string) =>
    patch({
      technologies: v.technologies.some((t) => same(t, name))
        ? v.technologies.filter((t) => !same(t, name))
        : v.technologies.length < 30
          ? [...v.technologies, name]
          : v.technologies,
    });
  const addCustom = () => {
    const name = query.trim().slice(0, 60);
    if (name && !v.technologies.some((t) => same(t, name))) toggleTech(name);
    setQuery("");
  };

  const selected = skills.filter((s) => v.skillIds.includes(s.id));
  const skillMatches = skills.filter(
    (s) => !v.skillIds.includes(s.id) && s.name.toLowerCase().includes(skillQuery.trim().toLowerCase()),
  );
  const addSkill = (id: string) => {
    patch({ skillIds: v.skillIds.length < 10 ? [...v.skillIds, id] : v.skillIds });
    setSkillQuery("");
  };

  return (
    <section aria-label="Technologies et compétences" className={cn(cardClass, "space-y-6")}>
      <div>
        <h2 className="text-navy text-xl font-extrabold">Technologies et compétences</h2>
        <p className="text-muted text-sm">
          Sélectionnez les technologies et compétences utilisées dans ce projet.
        </p>
      </div>

      <div className="space-y-3">
        <h3 className="text-navy text-sm font-bold">
          Technologies utilisées<span className="text-danger"> *</span>
        </h3>
        <div className="relative">
          <Search className="text-muted pointer-events-none absolute top-3.5 left-3.5 size-4" aria-hidden />
          <input
            aria-label="Rechercher une technologie"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                if (canAddCustom) addCustom();
              }
            }}
            placeholder="Rechercher une technologie (ex: Power Apps, React, Azure…)"
            className={cn(inputClass, "pl-10")}
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {(["ALL", ...TECH_GROUPS] as const).map((g) => (
            <button
              key={g}
              type="button"
              aria-pressed={group === g}
              onClick={() => setGroup(g)}
              className={cn(
                "rounded-lg border px-3.5 py-1.5 text-xs font-medium",
                group === g
                  ? "border-brand bg-brand text-white"
                  : "border-border text-navy bg-white hover:bg-slate-50",
              )}
            >
              {g === "ALL" ? "Toutes" : g}
            </button>
          ))}
        </div>

        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {tiles.map((t) => {
            const on = v.technologies.some((x) => same(x, t.name));
            return (
              <li key={t.name}>
                <button
                  type="button"
                  aria-pressed={on}
                  onClick={() => toggleTech(t.name)}
                  className={cn(
                    "relative flex h-24 w-full flex-col items-center justify-center gap-2 rounded-xl border text-center",
                    on ? "border-brand bg-blue-50" : "border-border bg-white hover:bg-slate-50",
                  )}
                >
                  <span
                    className={cn(
                      "absolute top-2 left-2 flex size-4 items-center justify-center rounded border",
                      on ? "border-brand bg-brand text-white" : "border-border bg-white",
                    )}
                    aria-hidden
                  >
                    {on && <Check className="size-3" />}
                  </span>
                  <span
                    aria-hidden
                    className="flex size-9 items-center justify-center rounded-lg text-[11px] font-extrabold text-white"
                    style={{
                      backgroundColor: t.color,
                      color: t.color === "#f7df1e" || t.color === "#f2c811" ? "#111" : "#fff",
                    }}
                  >
                    {t.mark}
                  </span>
                  <span className="text-navy px-1 text-xs font-medium">{t.name}</span>
                </button>
              </li>
            );
          })}
        </ul>
        {tiles.length === 0 && !canAddCustom && (
          <p className="text-muted text-sm">Aucune technologie trouvée.</p>
        )}
        {canAddCustom && (
          <button
            type="button"
            onClick={addCustom}
            className="text-brand inline-flex items-center gap-1.5 rounded-lg bg-blue-50 px-3 py-2 text-sm font-medium hover:bg-blue-100"
          >
            <Plus className="size-4" aria-hidden /> Ajouter « {query.trim()} »
          </button>
        )}
        {custom.length > 0 && (
          <ul aria-label="Autres technologies" className="flex flex-wrap gap-2">
            {custom.map((t) => (
              <li
                key={t}
                className="text-brand flex items-center gap-1.5 rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-medium"
              >
                {t}
                <button type="button" aria-label={`Retirer ${t}`} onClick={() => toggleTech(t)}>
                  <X className="size-3.5" />
                </button>
              </li>
            ))}
          </ul>
        )}
        <FieldError message={errors.technologies} />
      </div>

      <div className="space-y-3">
        <div>
          <h3 className="text-navy text-sm font-bold">
            Compétences associées<span className="text-danger"> *</span>
          </h3>
          <p className="text-muted text-xs">Choisissez les compétences démontrées par cette preuve.</p>
        </div>
        {skills.length === 0 ? (
          <p className="text-muted text-sm">
            Vous n&apos;avez pas encore de compétence : ajoutez-en une depuis la page Compétences pour pouvoir
            y rattacher cette preuve.
          </p>
        ) : (
          <>
            <div className="relative">
              <Search
                className="text-muted pointer-events-none absolute top-3.5 left-3.5 size-4"
                aria-hidden
              />
              <input
                aria-label="Rechercher une compétence"
                value={skillQuery}
                onChange={(e) => setSkillQuery(e.target.value)}
                placeholder="Rechercher une compétence…"
                className={cn(inputClass, "pl-10")}
              />
              {skillQuery.trim() && (
                <ul className="border-border shadow-lift absolute z-10 mt-1 w-full overflow-hidden rounded-xl border bg-white text-sm">
                  {skillMatches.slice(0, 6).map((s) => (
                    <li key={s.id}>
                      <button
                        type="button"
                        onClick={() => addSkill(s.id)}
                        className="w-full px-4 py-2 text-left hover:bg-blue-50"
                      >
                        {s.name}
                      </button>
                    </li>
                  ))}
                  {skillMatches.length === 0 && (
                    <li className="text-muted px-4 py-2">Aucune compétence trouvée</li>
                  )}
                </ul>
              )}
            </div>
            {selected.length > 0 && (
              <ul aria-label="Compétences sélectionnées" className="flex flex-wrap gap-2">
                {selected.map((s) => (
                  <li
                    key={s.id}
                    className="text-brand border-brand/40 flex items-center gap-2 rounded-full border bg-blue-50/50 px-3.5 py-1.5 text-xs font-medium"
                  >
                    {s.name}
                    <button
                      type="button"
                      aria-label={`Retirer ${s.name}`}
                      onClick={() => patch({ skillIds: v.skillIds.filter((id) => id !== s.id) })}
                    >
                      <X className="size-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {skillMatches.length > 0 && (
              <div>
                <p className="text-navy mb-2 text-xs font-bold">Suggestions de compétences</p>
                <ul className="flex flex-wrap gap-2">
                  {skillMatches.slice(0, 10).map((s) => (
                    <li key={s.id}>
                      <button
                        type="button"
                        onClick={() => addSkill(s.id)}
                        className="border-border text-navy inline-flex items-center gap-1.5 rounded-full border bg-white px-3.5 py-1.5 text-xs hover:bg-slate-50"
                      >
                        <Plus className="size-3.5" aria-hidden /> {s.name}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        )}
        <FieldError message={errors.skills} />
      </div>
    </section>
  );
}
