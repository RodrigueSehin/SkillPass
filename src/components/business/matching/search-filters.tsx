"use client";

import { useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { searchAction } from "@/app/business/matching/actions";
import { TECH_SKILLS } from "@/config/job-catalog";
import { AVAILABILITY_OPTIONS, EXPERIENCE_BUCKETS, type MatchSearch } from "@/lib/business/matching-view";
import { TagInput } from "../tag-input";

const field =
  "border-border focus-visible:ring-brand/40 h-11 w-full rounded-xl border bg-white px-3 text-sm outline-none focus-visible:ring-2";

/** The search bar and the filters are one form: submitting it records the search, then shows the results. */
export function SearchForm({
  search,
  offers,
  locations,
  wide,
  children,
}: {
  search: MatchSearch;
  offers: { id: string; title: string }[];
  locations: string[];
  /** True when the profile panel is open next to the results. */
  wide: boolean;
  children: React.ReactNode;
}) {
  const [skills, setSkills] = useState(search.skills);
  const group = "space-y-2";
  return (
    <form action={searchAction} className="space-y-6">
      <div className="flex flex-wrap gap-3">
        <div className="relative min-w-60 flex-1">
          <Search className="text-muted pointer-events-none absolute top-3.5 left-3.5 size-4" aria-hidden />
          <input
            name="q"
            defaultValue={search.q}
            aria-label="Rechercher par nom, poste ou secteur"
            placeholder="Rechercher par nom, poste, compétence…"
            className={`${field} pl-10`}
          />
        </div>
        <button
          type="submit"
          className="bg-brand flex h-11 items-center gap-2 rounded-xl px-6 text-sm font-semibold text-white hover:bg-blue-700"
        >
          <Search className="size-4" aria-hidden /> Rechercher
        </button>
      </div>

      <div
        className={
          wide
            ? "grid items-start gap-6 xl:grid-cols-[280px_minmax(0,1fr)_440px]"
            : "grid items-start gap-6 xl:grid-cols-[280px_minmax(0,1fr)]"
        }
      >
        <div className="border-border/60 shadow-soft space-y-5 rounded-2xl border bg-white p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-navy font-bold">Filtres</h2>
            <Link href="/business/matching" className="text-brand text-xs font-semibold hover:underline">
              Réinitialiser
            </Link>
          </div>

          <div className={group}>
            <label htmlFor="match-skills" className="text-navy text-sm font-semibold">
              Compétences
            </label>
            <TagInput
              id="match-skills"
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

          <div className={group}>
            <label htmlFor="match-poste" className="text-navy text-sm font-semibold">
              Poste recherché
            </label>
            <select id="match-poste" name="poste" defaultValue={search.offerId} className={field}>
              <option value="">Sélectionner un poste</option>
              {offers.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.title}
                </option>
              ))}
            </select>
            <p className="text-muted text-xs">
              Sans compétence saisie, celles de l&apos;offre sont utilisées.
            </p>
          </div>

          <div className={group}>
            <label htmlFor="match-location" className="text-navy text-sm font-semibold">
              Localisation
            </label>
            <select id="match-location" name="location" defaultValue={search.location} className={field}>
              <option value="">Toutes les localisations</option>
              {locations.map((l) => (
                <option key={l}>{l}</option>
              ))}
            </select>
          </div>

          <fieldset className={group}>
            <legend className="text-navy text-sm font-semibold">Expérience</legend>
            {EXPERIENCE_BUCKETS.map(([key, label]) => (
              <label key={key} className="flex items-center gap-2.5 text-sm">
                <input
                  type="checkbox"
                  name="exp"
                  value={key}
                  defaultChecked={search.exp.includes(key)}
                  className="accent-brand size-4"
                />
                {label}
              </label>
            ))}
          </fieldset>

          <fieldset className={group}>
            <legend className="text-navy text-sm font-semibold">Disponibilité</legend>
            {AVAILABILITY_OPTIONS.map(([key, label]) => (
              <label key={key} className="flex items-center gap-2.5 text-sm">
                <input
                  type="checkbox"
                  name="dispo"
                  value={key}
                  defaultChecked={search.dispo.includes(key)}
                  className="accent-brand size-4"
                />
                {label}
              </label>
            ))}
          </fieldset>
          <input type="hidden" name="sort" value={search.sort} />
        </div>
        {children}
      </div>
    </form>
  );
}
