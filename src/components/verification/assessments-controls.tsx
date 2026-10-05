"use client";

import { useEffect, useState } from "react";
import { Filter, Search } from "lucide-react";
import { ASSESSMENT_TABS, ASSESSMENT_TAB_LABELS, RESULT_FILTERS, parseTab } from "@/lib/assessment-filter";
import { useUrlParams } from "@/lib/hooks/use-url-params";
import { cn } from "@/lib/utils/cn";

export function AssessmentTabs() {
  const { params, set } = useUrlParams();
  const current = parseTab(params.get("tab") ?? undefined);
  return (
    <div
      role="group"
      aria-label="Filtrer par état"
      className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0"
    >
      {ASSESSMENT_TABS.map((tab) => (
        <button
          key={tab}
          type="button"
          aria-pressed={current === tab}
          onClick={() => set("tab", tab === "all" ? "" : tab)}
          className={cn(
            "h-10 shrink-0 rounded-full px-5 text-sm font-medium transition-colors",
            current === tab ? "bg-brand shadow-soft text-white" : "text-navy bg-blue-50 hover:bg-blue-100",
          )}
        >
          {ASSESSMENT_TAB_LABELS[tab]}
        </button>
      ))}
    </div>
  );
}

export function AssessmentFilters() {
  const { params, set, reset } = useUrlParams();
  const [q, setQ] = useState(params.get("q") ?? "");
  const result = params.get("result") ?? "";

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
          aria-label="Rechercher une évaluation"
          placeholder="Rechercher…"
          className="border-border h-10 w-full rounded-lg border bg-slate-50 pr-3 pl-9 text-sm"
        />
      </div>
      <fieldset className="mt-5">
        <legend className="text-navy mb-2 text-sm font-bold">Dernier résultat</legend>
        <div className="space-y-1.5">
          {[["", "Tous"] as const, ...RESULT_FILTERS].map(([value, label]) => (
            <label
              key={value || "all"}
              className="text-navy flex cursor-pointer items-center gap-2.5 text-sm"
            >
              <input
                type="radio"
                name="result"
                checked={result === value}
                onChange={() => set("result", value)}
                className="accent-brand size-4"
              />
              {label}
            </label>
          ))}
        </div>
      </fieldset>
    </div>
  );
}
