"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { memberName, type MemberDTO } from "@/types/business";
import { MemberAvatar } from "./ui";

export type PickableMember = Pick<
  MemberDTO,
  "id" | "firstName" | "lastName" | "email" | "jobTitle" | "status"
>;

/** Search box with a short list of matching people; picking one calls `onPick` and clears the box. */
export function MemberSearch({
  options,
  exclude = [],
  placeholder,
  onPick,
  label,
}: {
  options: PickableMember[];
  exclude?: string[];
  placeholder: string;
  onPick: (id: string) => void;
  label: string;
}) {
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();
  const matches = options
    .filter((m) => !exclude.includes(m.id))
    .filter((m) => !q || [memberName(m), m.email, m.jobTitle].some((t) => t?.toLowerCase().includes(q)))
    .slice(0, 6);

  return (
    <div className="relative">
      <Search className="text-muted pointer-events-none absolute top-3.5 left-3.5 size-4" aria-hidden />
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        aria-label={label}
        placeholder={placeholder}
        className="border-border focus-visible:ring-brand/40 h-11 w-full rounded-xl border bg-white pr-4 pl-10 text-sm outline-none focus-visible:ring-2"
      />
      {query.trim() && (
        <ul className="border-border shadow-lift absolute z-20 mt-1 w-full overflow-hidden rounded-xl border bg-white">
          {matches.length === 0 ? (
            <li className="text-muted px-4 py-3 text-sm">Aucun collaborateur trouvé.</li>
          ) : (
            matches.map((m) => (
              <li key={m.id}>
                <button
                  type="button"
                  onClick={() => {
                    onPick(m.id);
                    setQuery("");
                  }}
                  className="flex w-full items-center gap-3 px-4 py-2 text-left hover:bg-blue-50"
                >
                  <MemberAvatar member={m} className="size-8 text-xs" />
                  <span className="min-w-0 text-sm">
                    <span className="text-navy block truncate font-medium">{memberName(m)}</span>
                    <span className="text-muted block truncate text-xs">{m.jobTitle || m.email}</span>
                  </span>
                </button>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
