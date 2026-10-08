"use client";

import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { useUrlParams } from "@/lib/hooks/use-url-params";
import { DEMAND_LABELS, DEMAND_LEVELS } from "@/types/org-skill";

const select = "border-border h-11 w-full rounded-xl border bg-white px-3 text-sm";

/** Search and the category and demand filters of the skills table; each one lives in the URL. */
export function SkillsToolbar({ categories }: { categories: string[] }) {
  const { params, set } = useUrlParams();
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

  const change = (key: string) => (e: React.ChangeEvent<HTMLSelectElement>) => {
    set(key, e.target.value);
    if (params.get("page")) set("page", "");
  };

  return (
    <div role="search" className="grid gap-3 px-5 pb-4 sm:grid-cols-2 lg:grid-cols-[minmax(0,1.6fr)_1fr_1fr]">
      <div className="relative sm:col-span-2 lg:col-span-1">
        <Search className="text-muted pointer-events-none absolute top-3.5 left-3.5 size-4" aria-hidden />
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          aria-label="Rechercher une compétence"
          placeholder="Rechercher une compétence…"
          className="border-border h-11 w-full rounded-xl border bg-white pr-3 pl-10 text-sm"
        />
      </div>
      <select
        aria-label="Catégorie"
        value={params.get("category") ?? ""}
        onChange={change("category")}
        className={select}
      >
        <option value="">Catégorie</option>
        {categories.map((c) => (
          <option key={c}>{c}</option>
        ))}
      </select>
      <select
        aria-label="Niveau de demande"
        value={params.get("demand") ?? ""}
        onChange={change("demand")}
        className={select}
      >
        <option value="">Niveau de demande</option>
        {DEMAND_LEVELS.map((d) => (
          <option key={d} value={d}>
            {DEMAND_LABELS[d]}
          </option>
        ))}
      </select>
    </div>
  );
}
