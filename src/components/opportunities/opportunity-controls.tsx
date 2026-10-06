"use client";

import { useEffect, useState } from "react";
import { Filter, LayoutGrid, List, Search } from "lucide-react";
import { FilterChecks, type FilterOption } from "@/components/ui/filter-checks";
import { useUrlParams } from "@/lib/hooks/use-url-params";
import {
  OPPORTUNITY_SORTS,
  OPPORTUNITY_TABS,
  parseOpportunitySort,
  parseOpportunityTab,
} from "@/lib/opportunity-view";
import { cn } from "@/lib/utils/cn";

export function OpportunityTabs() {
  const { params, set } = useUrlParams();
  const current = parseOpportunityTab(params.get("tab") ?? undefined);
  return (
    <div
      role="group"
      aria-label="Filtrer par catégorie"
      className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0"
    >
      {OPPORTUNITY_TABS.map(([key, label]) => (
        <button
          key={key}
          type="button"
          aria-pressed={current === key}
          onClick={() => {
            set("tab", key === "all" ? "" : key);
            if (params.get("page")) set("page", "");
          }}
          className={cn(
            "h-10 shrink-0 rounded-full px-5 text-sm font-medium transition-colors",
            current === key ? "bg-brand shadow-soft text-white" : "text-navy bg-blue-50 hover:bg-blue-100",
          )}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

interface FiltersProps {
  kinds: FilterOption[];
  regions: FilterOption[];
  domains: FilterOption[];
  levels: FilterOption[];
}

export function OpportunityFilters({ kinds, regions, domains, levels }: FiltersProps) {
  const { params, set, reset } = useUrlParams();
  const [q, setQ] = useState(params.get("q") ?? "");

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
          id="opportunity-search"
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          aria-label="Rechercher une opportunité"
          placeholder="Rechercher une opportunité…"
          className="border-border h-10 w-full rounded-lg border bg-slate-50 pr-3 pl-9 text-sm"
        />
      </div>
      <FilterChecks legend="Type d'opportunité" name="kind" options={kinds} resetPage />
      <FilterChecks legend="Localisation" name="region" options={regions} resetPage />
      <FilterChecks legend="Domaine" name="domain" options={domains} resetPage />
      <FilterChecks legend="Niveau d'expérience" name="level" options={levels} resetPage />
    </div>
  );
}

export function OpportunitySort() {
  const { params, set } = useUrlParams();
  const view = params.get("view") === "list" ? "list" : "grid";
  return (
    <div className="flex items-center gap-2 text-sm">
      <label htmlFor="opportunity-sort" className="text-muted hidden sm:block">
        Trier par
      </label>
      <select
        id="opportunity-sort"
        className="border-border h-9 rounded-lg border bg-white px-3 text-sm"
        value={parseOpportunitySort(params.get("sort") ?? undefined)}
        onChange={(e) => set("sort", e.target.value === "recent" ? "" : e.target.value)}
      >
        {OPPORTUNITY_SORTS.map(([value, label]) => (
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

/** Hero button: jumps to the search field of the filter panel. */
export function SearchOpportunitiesButton() {
  return (
    <button
      type="button"
      onClick={() => {
        const field = document.getElementById("opportunity-search");
        field?.scrollIntoView({ behavior: "smooth", block: "center" });
        field?.focus({ preventScroll: true });
      }}
      className="bg-brand shadow-soft inline-flex h-11 items-center gap-2 rounded-xl px-5 text-sm font-semibold text-white hover:bg-blue-700"
    >
      <Search className="size-4" aria-hidden /> Rechercher des opportunités
    </button>
  );
}
