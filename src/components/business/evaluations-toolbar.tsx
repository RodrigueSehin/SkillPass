"use client";

import { useEffect, useState } from "react";
import { CalendarDays, Search } from "lucide-react";
import { DATE_RANGES } from "@/lib/business/evaluation-view";
import { useUrlParams } from "@/lib/hooks/use-url-params";
import { EVALUATION_STATUS_LABELS, EVALUATION_TYPES, EVALUATION_TYPE_LABELS } from "@/types/evaluation";

const select = "border-border h-11 w-full rounded-xl border bg-white px-3 text-sm";

/** Search and filters of the evaluations list; each one lives in the URL. */
export function EvaluationsToolbar({ skills }: { skills: string[] }) {
  const { params, set, reset } = useUrlParams();
  const [q, setQ] = useState(params.get("q") ?? "");
  const active = ["q", "type", "skill", "status", "range"].some((k) => params.get(k));

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
    <div
      role="search"
      className="grid gap-3 px-5 pb-4 sm:grid-cols-2 lg:grid-cols-[minmax(0,1.6fr)_repeat(4,minmax(0,1fr))_auto] lg:items-center"
    >
      <div className="relative sm:col-span-2 lg:col-span-1">
        <Search className="text-muted pointer-events-none absolute top-3.5 left-3.5 size-4" aria-hidden />
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          aria-label="Rechercher une évaluation"
          placeholder="Rechercher une évaluation…"
          className="border-border h-11 w-full rounded-xl border bg-white pr-3 pl-10 text-sm"
        />
      </div>
      <select aria-label="Type" value={params.get("type") ?? ""} onChange={change("type")} className={select}>
        <option value="">Type</option>
        {EVALUATION_TYPES.map((t) => (
          <option key={t} value={t}>
            {EVALUATION_TYPE_LABELS[t].title}
          </option>
        ))}
      </select>
      <select
        aria-label="Compétence"
        value={params.get("skill") ?? ""}
        onChange={change("skill")}
        className={select}
      >
        <option value="">Compétence</option>
        {skills.map((s) => (
          <option key={s}>{s}</option>
        ))}
      </select>
      <select
        aria-label="Statut"
        value={params.get("status") ?? ""}
        onChange={change("status")}
        className={select}
      >
        <option value="">Statut</option>
        {(["PUBLISHED", "DRAFT", "SCHEDULED", "ARCHIVED"] as const).map((s) => (
          <option key={s} value={s}>
            {EVALUATION_STATUS_LABELS[s]}
          </option>
        ))}
      </select>
      <div className="relative">
        <CalendarDays
          className="text-muted pointer-events-none absolute top-3.5 left-3.5 size-4"
          aria-hidden
        />
        <select
          aria-label="Période"
          value={params.get("range") ?? ""}
          onChange={change("range")}
          className={`${select} pl-10`}
        >
          {DATE_RANGES.map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>
      {active && (
        <button
          type="button"
          onClick={() => reset()}
          className="text-brand text-xs font-semibold hover:underline"
        >
          Réinitialiser
        </button>
      )}
    </div>
  );
}
