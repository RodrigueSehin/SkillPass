"use client";

import { useState } from "react";
import Link from "next/link";
import { MapPin, Search } from "lucide-react";
import { TECH_SKILLS } from "@/config/job-catalog";
import { SKILL_LEVELS, SKILL_LEVEL_LABELS } from "@/types/skill";
import type { TalentFilters as Filters } from "@/lib/business/talent-search";
import { TagInput } from "./tag-input";

const select =
  "border-border focus-visible:ring-brand/40 h-11 w-full rounded-xl border bg-white px-3 text-sm outline-none focus-visible:ring-2";
const EXPERIENCE = [
  ["0", "Toutes"],
  ["1", "1+ an"],
  ["3", "3+ ans"],
  ["5", "5+ ans"],
  ["8", "8+ ans"],
] as const;

/** Plain GET form: every filter is a query parameter, so a search is a shareable link. */
export function TalentsFilters({
  filters,
  locations,
  certificationOptions,
}: {
  filters: Filters;
  locations: string[];
  certificationOptions: string[];
}) {
  const [skills, setSkills] = useState(filters.skills);
  const group = "space-y-2";
  return (
    <form action="/business/talents" method="get" className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-navy text-base font-bold">Filtres de recherche</h2>
        <Link href="/business/talents" className="text-brand text-xs font-semibold hover:underline">
          Réinitialiser
        </Link>
      </div>
      <div className="relative">
        <Search className="text-muted pointer-events-none absolute top-3.5 left-3.5 size-4" aria-hidden />
        <input
          name="q"
          defaultValue={filters.q}
          aria-label="Rechercher par nom ou titre"
          placeholder="Rechercher par nom, titre…"
          className={`${select} pl-10`}
        />
      </div>

      <div className={group}>
        <label htmlFor="talent-skills" className="text-navy text-sm font-semibold">
          Compétences
        </label>
        <TagInput
          id="talent-skills"
          label="Compétences"
          value={skills}
          onChange={setSkills}
          catalog={TECH_SKILLS}
          placeholder="Ajouter une compétence…"
          max={10}
        />
        {skills.map((s) => (
          <input key={s} type="hidden" name="skill" value={s} />
        ))}
      </div>

      <fieldset className={group}>
        <legend className="text-navy text-sm font-semibold">Niveau de compétence</legend>
        {SKILL_LEVELS.map((l) => (
          <label key={l} className="flex items-center gap-2.5 text-sm">
            <input
              type="checkbox"
              name="level"
              value={l}
              defaultChecked={filters.levels.includes(l)}
              className="accent-brand size-4"
            />
            {SKILL_LEVEL_LABELS[l]}
          </label>
        ))}
      </fieldset>

      <div className={group}>
        <label htmlFor="talent-location" className="text-navy text-sm font-semibold">
          Localisation
        </label>
        <div className="relative">
          <MapPin className="text-brand pointer-events-none absolute top-3.5 left-3.5 size-4" aria-hidden />
          <select
            id="talent-location"
            name="location"
            defaultValue={filters.location}
            className={`${select} pl-10`}
          >
            <option value="">Toutes les localisations</option>
            {locations.map((l) => (
              <option key={l}>{l}</option>
            ))}
          </select>
        </div>
      </div>

      <div className={group}>
        <label htmlFor="talent-years" className="text-navy text-sm font-semibold">
          Expérience
        </label>
        <select id="talent-years" name="years" defaultValue={String(filters.minYears)} className={select}>
          {EXPERIENCE.map(([v, label]) => (
            <option key={v} value={v}>
              {label}
            </option>
          ))}
        </select>
      </div>

      {certificationOptions.length > 0 && (
        <fieldset className={group}>
          <legend className="text-navy text-sm font-semibold">Certifications</legend>
          {certificationOptions.map((c) => (
            <label key={c} className="flex items-center gap-2.5 text-sm">
              <input
                type="checkbox"
                name="cert"
                value={c}
                defaultChecked={filters.certs.includes(c)}
                className="accent-brand size-4"
              />
              {c}
            </label>
          ))}
        </fieldset>
      )}

      <fieldset className={group}>
        <legend className="text-navy text-sm font-semibold">Disponibilité</legend>
        <label className="flex items-center gap-2.5 text-sm">
          <input
            type="checkbox"
            name="available"
            value="1"
            defaultChecked={filters.availableNow}
            className="accent-brand size-4"
          />
          Disponible maintenant
        </label>
      </fieldset>

      <input type="hidden" name="sort" value={filters.sort} />
      <button
        type="submit"
        className="bg-brand h-11 w-full rounded-xl text-sm font-semibold text-white hover:bg-blue-700"
      >
        Appliquer les filtres
      </button>
    </form>
  );
}
