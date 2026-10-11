"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ChevronDown, Search, SlidersHorizontal } from "lucide-react";
import { DISPLAY_STATUS_LABELS } from "@/lib/evidence-view";
import { EVIDENCE_TYPE_LABELS, USER_EVIDENCE_TYPES } from "@/types/evidence";

const selectClass =
  "border-border text-navy focus-visible:ring-brand/40 h-11 w-full appearance-none rounded-xl border bg-white pr-9 pl-4 text-sm outline-none focus-visible:ring-2";

/** Search + selects of the evidence page. They live in the URL so the page stays shareable. */
export function EvidenceFilters({ skills }: { skills: { id: string; name: string }[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [q, setQ] = useState(params.get("q") ?? "");
  const [more, setMore] = useState(Boolean(params.get("status")));
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => () => clearTimeout(timer.current), []);

  const update = (key: string, value: string) => {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    next.delete("sel");
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };

  return (
    <div className="border-border/60 shadow-soft flex flex-wrap items-start gap-3 rounded-2xl border bg-white p-3">
      <div className="relative min-w-56 flex-[2]">
        <Search className="text-muted pointer-events-none absolute top-3.5 left-3.5 size-4" aria-hidden />
        <input
          type="search"
          aria-label="Rechercher une preuve"
          placeholder="Rechercher une preuve, un projet, une technologie…"
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            clearTimeout(timer.current);
            timer.current = setTimeout(() => update("q", e.target.value.trim()), 300);
          }}
          className="border-border focus-visible:ring-brand/40 h-11 w-full rounded-xl border bg-white pr-4 pl-10 text-sm outline-none focus-visible:ring-2"
        />
      </div>
      <div className="relative min-w-44 flex-1">
        <select
          aria-label="Compétence"
          className={selectClass}
          value={params.get("skill") ?? ""}
          onChange={(e) => update("skill", e.target.value)}
        >
          <option value="">Toutes les compétences</option>
          {skills.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
        <ChevronDown className="text-muted pointer-events-none absolute top-3.5 right-3 size-4" aria-hidden />
      </div>
      <div className="relative min-w-36 flex-1">
        <select
          aria-label="Type de preuve"
          className={selectClass}
          value={params.get("type") ?? ""}
          onChange={(e) => update("type", e.target.value)}
        >
          <option value="">Tous les types</option>
          {USER_EVIDENCE_TYPES.map((t) => (
            <option key={t} value={t}>
              {EVIDENCE_TYPE_LABELS[t]}
            </option>
          ))}
        </select>
        <ChevronDown className="text-muted pointer-events-none absolute top-3.5 right-3 size-4" aria-hidden />
      </div>
      <button
        type="button"
        aria-expanded={more}
        onClick={() => setMore((v) => !v)}
        className="border-border text-navy flex h-11 shrink-0 items-center gap-2 rounded-xl border bg-white px-4 text-sm hover:bg-slate-50"
      >
        Plus de filtres <SlidersHorizontal className="size-4" aria-hidden />
      </button>
      {more && (
        <div className="relative w-full sm:w-64">
          <select
            aria-label="Statut"
            className={selectClass}
            value={params.get("status") ?? ""}
            onChange={(e) => update("status", e.target.value)}
          >
            <option value="">Tous les statuts</option>
            {Object.entries(DISPLAY_STATUS_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <ChevronDown className="text-muted pointer-events-none absolute top-3.5 right-3 size-4" aria-hidden />
        </div>
      )}
    </div>
  );
}
