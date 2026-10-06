"use client";

import { useEffect, useState } from "react";
import { Filter, LayoutGrid, List, Search } from "lucide-react";
import { FilterChecks, type FilterOption } from "@/components/ui/filter-checks";
import { useUrlParams } from "@/lib/hooks/use-url-params";
import { RECOMMENDATION_SORTS, parseRecommendationSort } from "@/lib/recommendation-view";
import { cn } from "@/lib/utils/cn";

interface FiltersProps {
  statuses: FilterOption[];
  relations: FilterOption[];
  keywords: FilterOption[];
  years: FilterOption[];
  /** Keywords beyond the first few, revealed by "Voir plus". */
  moreKeywords: number;
}

export function RecommendationFilters({ statuses, relations, keywords, years, moreKeywords }: FiltersProps) {
  const { params, set, reset } = useUrlParams();
  const [q, setQ] = useState(params.get("q") ?? "");
  const expanded = params.get("more") === "1";

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
          aria-label="Rechercher une recommandation"
          placeholder="Rechercher une recommandation…"
          className="border-border h-10 w-full rounded-lg border bg-slate-50 pr-3 pl-9 text-sm"
        />
      </div>
      <FilterChecks legend="Statut" name="status" options={statuses} />
      <FilterChecks legend="Type de relation" name="relation" options={relations} />
      <FilterChecks legend="Compétences mentionnées" name="keyword" options={keywords} />
      {moreKeywords > 0 && (
        <button
          type="button"
          onClick={() => set("more", expanded ? "" : "1")}
          className="text-brand mt-3 text-sm font-semibold hover:underline"
        >
          {expanded ? "Voir moins" : `Voir plus (${moreKeywords})`}
        </button>
      )}
      <FilterChecks legend="Période" name="year" options={years} />
    </div>
  );
}

export function RecommendationSort() {
  const { params, set } = useUrlParams();
  const view = params.get("view") === "grid" ? "grid" : "list";
  return (
    <div className="flex items-center gap-2 text-sm">
      <label htmlFor="reco-sort" className="text-muted hidden sm:block">
        Trier par
      </label>
      <select
        id="reco-sort"
        className="border-border h-9 rounded-lg border bg-white px-3 text-sm"
        value={parseRecommendationSort(params.get("sort") ?? undefined)}
        onChange={(e) => set("sort", e.target.value === "recent" ? "" : e.target.value)}
      >
        {RECOMMENDATION_SORTS.map(([value, label]) => (
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
