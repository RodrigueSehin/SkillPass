"use client";

import { useState } from "react";
import { Plus, Search, X } from "lucide-react";

/** Search box with matching suggestions and removable chips. Free entries are added with Enter. */
export function TagInput({
  id,
  label,
  value,
  onChange,
  catalog,
  placeholder,
  max = 30,
}: {
  id: string;
  label: string;
  value: string[];
  onChange: (next: string[]) => void;
  catalog: readonly string[];
  placeholder: string;
  max?: number;
}) {
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();
  const has = (v: string) => value.some((x) => x.toLowerCase() === v.toLowerCase());
  const matches = catalog.filter((c) => !has(c) && c.toLowerCase().includes(q)).slice(0, 6);

  function add(raw: string) {
    const clean = raw.trim().slice(0, 60);
    if (clean && !has(clean) && value.length < max) onChange([...value, clean]);
    setQuery("");
  }

  return (
    <div>
      <div className="relative">
        <Search className="text-muted pointer-events-none absolute top-3.5 left-3.5 size-4" aria-hidden />
        <input
          id={id}
          aria-label={label}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add(matches[0] && q && matches[0].toLowerCase() === q ? matches[0] : query);
            }
          }}
          placeholder={placeholder}
          className="border-border focus-visible:ring-brand/40 h-11 w-full rounded-xl border bg-white pr-4 pl-10 text-sm outline-none focus-visible:ring-2"
        />
        {q && (
          <ul className="border-border shadow-lift absolute z-20 mt-1 w-full overflow-hidden rounded-xl border bg-white text-sm">
            {matches.map((m) => (
              <li key={m}>
                <button
                  type="button"
                  onClick={() => add(m)}
                  className="w-full px-4 py-2 text-left hover:bg-blue-50"
                >
                  {m}
                </button>
              </li>
            ))}
            {!has(query.trim()) && (
              <li>
                <button
                  type="button"
                  onClick={() => add(query)}
                  className="text-brand w-full px-4 py-2 text-left font-medium hover:bg-blue-50"
                >
                  Ajouter « {query.trim()} »
                </button>
              </li>
            )}
          </ul>
        )}
      </div>
      {value.length > 0 && (
        <ul aria-label={`${label} sélectionnées`} className="mt-3 flex flex-wrap gap-2">
          {value.map((v) => (
            <li
              key={v}
              className="text-brand flex items-center gap-1.5 rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-medium"
            >
              {v}
              <button
                type="button"
                aria-label={`Retirer ${v}`}
                onClick={() => onChange(value.filter((x) => x !== v))}
              >
                <X className="size-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** One-click suggestions shown under a TagInput. */
export function SuggestedTags({
  suggestions,
  value,
  onChange,
}: {
  suggestions: readonly string[];
  value: string[];
  onChange: (next: string[]) => void;
}) {
  const available = suggestions.filter((s) => !value.some((x) => x.toLowerCase() === s.toLowerCase()));
  if (available.length === 0) return null;
  return (
    <ul className="flex flex-wrap gap-2">
      {available.map((s) => (
        <li key={s}>
          <button
            type="button"
            onClick={() => onChange([...value, s])}
            className="border-border text-navy flex items-center gap-1 rounded-lg border bg-white px-3 py-1.5 text-xs font-medium hover:bg-blue-50"
          >
            <Plus className="size-3" aria-hidden /> {s}
          </button>
        </li>
      ))}
    </ul>
  );
}
