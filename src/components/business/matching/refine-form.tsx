"use client";

import { useState } from "react";
import Link from "next/link";
import { RefreshCw, SlidersHorizontal } from "lucide-react";
import { recommendAction } from "@/app/business/matching/actions";
import { TECH_SKILLS } from "@/config/job-catalog";
import type { Refinement } from "@/lib/business/matching-view";
import { TagInput } from "../tag-input";

const YEARS = [
  ["0", "Tous niveaux"],
  ["1", "1 an et plus"],
  ["3", "3 ans et plus"],
  ["5", "5 ans et plus"],
  ["8", "8 ans et plus"],
] as const;

/** Narrows the recommendations of one offer. Re-running the analysis records it in the history. */
export function RefineForm({
  offerId,
  offerSkills,
  refinement,
  canRun,
}: {
  offerId: string;
  offerSkills: string[];
  refinement: Refinement;
  canRun: boolean;
}) {
  const [skills, setSkills] = useState(refinement.skills.length > 0 ? refinement.skills : offerSkills);
  const field =
    "border-border focus-visible:ring-brand/40 h-10 w-full rounded-xl border bg-white px-3 text-sm outline-none focus-visible:ring-2";
  return (
    <form action={recommendAction} className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-navy flex items-center gap-2 font-bold">
          <SlidersHorizontal className="text-brand size-5" aria-hidden /> Affiner les recommandations
        </h3>
        <Link
          href={`/business/matching?tab=recommandations&offre=${offerId}`}
          className="text-brand text-xs font-semibold hover:underline"
        >
          Réinitialiser
        </Link>
      </div>
      <input type="hidden" name="offre" value={offerId} />
      <div>
        <label htmlFor="refine-years" className="text-navy mb-1 block text-sm font-semibold">
          Niveau d&apos;expérience
        </label>
        <select id="refine-years" name="years" defaultValue={String(refinement.minYears)} className={field}>
          {YEARS.map(([v, label]) => (
            <option key={v} value={v}>
              {label}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="refine-skills" className="text-navy mb-1 block text-sm font-semibold">
          Compétences clés
        </label>
        <TagInput
          id="refine-skills"
          label="Compétences clés"
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
      <div>
        <label htmlFor="refine-location" className="text-navy mb-1 block text-sm font-semibold">
          Localisation
        </label>
        <input
          id="refine-location"
          name="location"
          defaultValue={refinement.location}
          placeholder="Ville ou pays"
          className={field}
        />
      </div>
      <button
        type="submit"
        disabled={!canRun}
        className="bg-brand flex h-11 w-full items-center justify-center gap-2 rounded-xl text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
      >
        <RefreshCw className="size-4" aria-hidden /> Relancer l&apos;analyse
      </button>
    </form>
  );
}
