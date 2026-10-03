"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import {
  SKILL_LEVELS,
  SKILL_LEVEL_LABELS,
  SKILL_VERIFICATION_STATUSES,
  VERIFICATION_STATUS_LABELS,
} from "@/types/skill";

const SORTS = [
  ["score", "Score"],
  ["name", "Nom"],
  ["level", "Niveau"],
  ["experience", "Expérience"],
] as const;

const selectClass = "h-11 rounded-xl border border-border bg-surface px-3 text-sm";

/** Filters live in the URL, so views are shareable and the page stays a Server Component. */
export function SkillsToolbar({ categories }: { categories: string[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [q, setQ] = useState(params.get("q") ?? "");

  function setParam(key: string, value: string) {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    router.replace(`${pathname}?${next.toString()}`, { scroll: false });
  }

  useEffect(() => {
    if (q === (params.get("q") ?? "")) return;
    const t = setTimeout(() => setParam("q", q), 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  return (
    <div role="search" className="mb-6 flex flex-wrap gap-3">
      <div className="relative min-w-[200px] flex-1">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted" aria-hidden />
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          aria-label="Rechercher une compétence"
          placeholder="Rechercher une compétence…"
          className="h-11 w-full rounded-xl border border-border bg-surface pl-10 pr-4 text-sm"
        />
      </div>
      <select aria-label="Niveau" className={selectClass} value={params.get("level") ?? ""} onChange={(e) => setParam("level", e.target.value)}>
        <option value="">Tous niveaux</option>
        {SKILL_LEVELS.map((l) => (
          <option key={l} value={l}>
            {SKILL_LEVEL_LABELS[l]}
          </option>
        ))}
      </select>
      <select aria-label="Statut" className={selectClass} value={params.get("status") ?? ""} onChange={(e) => setParam("status", e.target.value)}>
        <option value="">Tous statuts</option>
        {SKILL_VERIFICATION_STATUSES.map((s) => (
          <option key={s} value={s}>
            {VERIFICATION_STATUS_LABELS[s]}
          </option>
        ))}
      </select>
      {categories.length > 0 && (
        <select aria-label="Catégorie" className={selectClass} value={params.get("category") ?? ""} onChange={(e) => setParam("category", e.target.value)}>
          <option value="">Toutes catégories</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      )}
      <select aria-label="Trier par" className={selectClass} value={params.get("sort") ?? "score"} onChange={(e) => setParam("sort", e.target.value)}>
        {SORTS.map(([value, label]) => (
          <option key={value} value={value}>
            Tri : {label}
          </option>
        ))}
      </select>
    </div>
  );
}
