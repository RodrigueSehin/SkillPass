"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Filter, LayoutGrid, List, Search } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import {
  SKILL_LEVELS,
  SKILL_LEVEL_LABELS,
  SKILL_VERIFICATION_STATUSES,
  VERIFICATION_STATUS_LABELS,
} from "@/types/skill";

const SORTS = [
  ["score", "Meilleur score"],
  ["name", "Nom"],
  ["level", "Niveau"],
  ["experience", "Expérience"],
] as const;

/** Filters live in the URL, so views are shareable and the page stays a Server Component. */
function useUrlParams() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  function set(key: string, value: string) {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }
  return { params, set, reset: () => router.replace(pathname, { scroll: false }) };
}

/** "Toutes" plus one pill per category the user actually has. */
export function CategoryTabs({ categories }: { categories: string[] }) {
  const { params, set } = useUrlParams();
  const current = params.get("category") ?? "";
  const tabs = ["", ...categories];
  return (
    <div
      role="group"
      aria-label="Catégories"
      className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0"
    >
      {tabs.map((c) => (
        <button
          key={c || "all"}
          type="button"
          aria-pressed={current === c}
          onClick={() => set("category", c)}
          className={cn(
            "h-10 shrink-0 rounded-full px-5 text-sm font-medium transition-colors",
            current === c ? "bg-brand shadow-soft text-white" : "text-navy bg-blue-50 hover:bg-blue-100",
          )}
        >
          {c || "Toutes"}
        </button>
      ))}
    </div>
  );
}

function RadioGroup({
  legend,
  name,
  options,
}: {
  legend: string;
  name: string;
  options: readonly (readonly [string, string])[];
}) {
  const { params, set } = useUrlParams();
  const current = params.get(name) ?? "";
  return (
    <fieldset className="mt-5">
      <legend className="text-navy mb-2 text-sm font-bold">{legend}</legend>
      <div className="space-y-1.5">
        {[["", "Tous"] as const, ...options].map(([value, label]) => (
          <label key={value || "all"} className="text-navy flex cursor-pointer items-center gap-2.5 text-sm">
            <input
              type="radio"
              name={name}
              checked={current === value}
              onChange={() => set(name, value)}
              className="accent-brand size-4"
            />
            {label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export function SkillsFilters() {
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
          aria-label="Rechercher une compétence"
          placeholder="Rechercher…"
          className="border-border h-10 w-full rounded-lg border bg-slate-50 pr-3 pl-9 text-sm"
        />
      </div>
      <RadioGroup
        legend="Niveau"
        name="level"
        options={SKILL_LEVELS.map((l) => [l, SKILL_LEVEL_LABELS[l]] as const)}
      />
      <RadioGroup
        legend="Statut"
        name="status"
        options={SKILL_VERIFICATION_STATUSES.map((s) => [s, VERIFICATION_STATUS_LABELS[s]] as const)}
      />
    </div>
  );
}

export function SkillsSortBar({ view }: { view: "grid" | "list" }) {
  const { params, set } = useUrlParams();
  const toggle = (value: "grid" | "list", Icon: typeof List, label: string) => (
    <button
      type="button"
      aria-label={label}
      aria-pressed={view === value}
      onClick={() => set("view", value === "grid" ? "" : value)}
      className={cn(
        "flex size-9 items-center justify-center rounded-lg",
        view === value ? "bg-brand text-white" : "text-muted hover:bg-slate-100",
      )}
    >
      <Icon className="size-4" aria-hidden />
    </button>
  );
  return (
    <div className="flex items-center gap-2 text-sm">
      <label htmlFor="skills-sort" className="text-muted hidden sm:block">
        Trier par
      </label>
      <select
        id="skills-sort"
        aria-label="Trier par"
        className="border-border h-9 rounded-lg border bg-white px-3 text-sm"
        value={params.get("sort") ?? "score"}
        onChange={(e) => set("sort", e.target.value === "score" ? "" : e.target.value)}
      >
        {SORTS.map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>
      {toggle("grid", LayoutGrid, "Affichage en grille")}
      {toggle("list", List, "Affichage en liste")}
    </div>
  );
}
