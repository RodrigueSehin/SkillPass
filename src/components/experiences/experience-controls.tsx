"use client";

import { useEffect, useState } from "react";
import { Filter, LayoutGrid, List, Search } from "lucide-react";
import { EXPERIENCE_SORTS, parseExperienceSort } from "@/lib/experience-options";
import { useUrlParams } from "@/lib/hooks/use-url-params";
import { cn } from "@/lib/utils/cn";

export interface FilterOption {
  value: string;
  label: string;
  count: number;
}

/** Multi-select facet: the URL keeps the chosen values as a comma-separated list. */
function Checks({ legend, name, options }: { legend: string; name: string; options: FilterOption[] }) {
  const { params, set } = useUrlParams();
  const current = (params.get(name) ?? "").split(",").filter(Boolean);
  if (options.length === 0) return null;

  function toggle(value: string) {
    const next = current.includes(value) ? current.filter((v) => v !== value) : [...current, value];
    set(name, next.join(","));
  }

  return (
    <fieldset className="mt-5">
      <legend className="text-navy mb-2 text-sm font-bold">{legend}</legend>
      <div className="space-y-1.5">
        {options.map((o) => (
          <label key={o.value} className="text-navy flex cursor-pointer items-center gap-2.5 text-sm">
            <input
              type="checkbox"
              checked={current.includes(o.value)}
              onChange={() => toggle(o.value)}
              className="accent-brand size-4 rounded"
            />
            {o.label} ({o.count})
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export function ExperienceFilters({
  contracts,
  periods,
  domains,
  places,
}: {
  contracts: FilterOption[];
  periods: FilterOption[];
  domains: FilterOption[];
  places: FilterOption[];
}) {
  const { params, set, reset } = useUrlParams();
  const [q, setQ] = useState(params.get("q") ?? "");

  useEffect(() => {
    if (q === (params.get("q") ?? "")) return;
    const t = setTimeout(() => set("q", q), 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  return (
    <div
      role="search"
      className="border-border/60 shadow-soft rounded-2xl border bg-white p-5 lg:sticky lg:top-24"
    >
      <div className="flex items-center justify-between">
        <h2 className="text-navy flex items-center gap-2 font-bold">
          <Filter className="text-brand size-4" aria-hidden /> Filtres
        </h2>
        <button
          type="button"
          onClick={() => {
            setQ("");
            reset();
          }}
          className="text-brand text-xs font-semibold hover:underline"
        >
          Réinitialiser
        </button>
      </div>
      <div className="relative mt-4">
        <Search
          className="text-muted pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2"
          aria-hidden
        />
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          aria-label="Rechercher une expérience"
          placeholder="Entreprise, poste…"
          className="border-border h-10 w-full rounded-lg border bg-slate-50 pr-3 pl-9 text-sm"
        />
      </div>
      <Checks legend="Type de contrat" name="contract" options={contracts} />
      <Checks legend="Période" name="period" options={periods} />
      <Checks legend="Domaine" name="domain" options={domains} />
      <Checks legend="Lieu" name="place" options={places} />
    </div>
  );
}

export function ExperienceSort() {
  const { params, set } = useUrlParams();
  const view = params.get("view") === "grid" ? "grid" : "list";
  return (
    <div className="flex items-center gap-2 text-sm">
      <label htmlFor="experience-sort" className="text-muted hidden sm:block">
        Trier par
      </label>
      <select
        id="experience-sort"
        className="border-border h-9 rounded-lg border bg-white px-3 text-sm"
        value={parseExperienceSort(params.get("sort") ?? undefined)}
        onChange={(e) => set("sort", e.target.value === "recent" ? "" : e.target.value)}
      >
        {EXPERIENCE_SORTS.map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>
      <div role="group" aria-label="Affichage" className="flex gap-1">
        {(
          [
            ["grid", LayoutGrid, "Affichage en grille"],
            ["list", List, "Affichage en liste"],
          ] as const
        ).map(([key, Icon, label]) => (
          <button
            key={key}
            type="button"
            aria-label={label}
            aria-pressed={view === key}
            onClick={() => set("view", key === "list" ? "" : key)}
            className={cn(
              "flex size-9 items-center justify-center rounded-lg",
              view === key
                ? "bg-brand text-white"
                : "text-muted border-border border bg-white hover:bg-slate-50",
            )}
          >
            <Icon className="size-4" aria-hidden />
          </button>
        ))}
      </div>
    </div>
  );
}
