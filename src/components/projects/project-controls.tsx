"use client";

import { useEffect, useState } from "react";
import { Filter, LayoutGrid, List, Search } from "lucide-react";
import { FilterChecks, type FilterOption } from "@/components/ui/filter-checks";
import { useUrlParams } from "@/lib/hooks/use-url-params";
import { PROJECT_SORTS, parseProjectSort } from "@/lib/project-view";
import { cn } from "@/lib/utils/cn";

interface FiltersProps {
  total: number;
  statuses: FilterOption[];
  domains: FilterOption[];
  technologies: FilterOption[];
  /** Technologies beyond the first few, revealed by "Voir plus". */
  moreTechnologies: number;
}

export function ProjectFilters({ total, statuses, domains, technologies, moreTechnologies }: FiltersProps) {
  const { params, set, reset } = useUrlParams();
  const [q, setQ] = useState(params.get("q") ?? "");
  const expanded = params.get("more") === "1";
  const noStatus = !params.get("status");

  useEffect(() => {
    if (q === (params.get("q") ?? "")) return;
    const t = setTimeout(() => {
      set("q", q);
      if (params.get("page")) set("page", "");
    }, 300);
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
          aria-label="Rechercher un projet"
          placeholder="Rechercher un projet…"
          className="border-border h-10 w-full rounded-lg border bg-slate-50 pr-3 pl-9 text-sm"
        />
      </div>

      <fieldset className="mt-5">
        <legend className="text-navy mb-2 text-sm font-bold">Statut</legend>
        <label className="text-navy mb-1.5 flex cursor-pointer items-center gap-2.5 text-sm">
          <input
            type="checkbox"
            checked={noStatus}
            onChange={() => set("status", "")}
            className="accent-brand size-4 rounded"
          />
          Tous ({total})
        </label>
      </fieldset>
      <div className="-mt-3">
        <FilterChecks legend="" name="status" options={statuses} resetPage />
      </div>
      <FilterChecks legend="Domaine" name="domain" options={domains} resetPage />
      <FilterChecks legend="Technologies" name="tech" options={technologies} resetPage />
      {moreTechnologies > 0 && (
        <button
          type="button"
          onClick={() => set("more", expanded ? "" : "1")}
          className="text-brand mt-3 text-sm font-semibold hover:underline"
        >
          {expanded ? "Voir moins" : `Voir plus (${moreTechnologies})`}
        </button>
      )}
    </div>
  );
}

export function ProjectSort() {
  const { params, set } = useUrlParams();
  const view = params.get("view") === "list" ? "list" : "grid";
  return (
    <div className="flex items-center gap-2 text-sm">
      <label htmlFor="project-sort" className="text-muted hidden sm:block">
        Trier par
      </label>
      <select
        id="project-sort"
        className="border-border h-9 rounded-lg border bg-white px-3 text-sm"
        value={parseProjectSort(params.get("sort") ?? undefined)}
        onChange={(e) => set("sort", e.target.value === "recent" ? "" : e.target.value)}
      >
        {PROJECT_SORTS.map(([value, label]) => (
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
            onClick={() => set("view", key === "grid" ? "" : key)}
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
