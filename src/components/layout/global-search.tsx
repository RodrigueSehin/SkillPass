"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Search } from "lucide-react";

/** Top-bar search. For now it looks a skill up: it opens the skills list filtered by the query. */
export function GlobalSearch() {
  const router = useRouter();
  const [query, setQuery] = useState("");

  return (
    <form
      role="search"
      className="relative hidden max-w-xl flex-1 sm:block"
      onSubmit={(e) => {
        e.preventDefault();
        const q = query.trim();
        router.push(q ? `/dashboard/skills?q=${encodeURIComponent(q)}` : "/dashboard/skills");
      }}
    >
      <Search
        className="pointer-events-none absolute top-1/2 left-4 size-[1.1rem] -translate-y-1/2 text-slate-400"
        aria-hidden
      />
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        aria-label="Rechercher dans mon espace"
        placeholder="Rechercher une compétence…"
        className="border-border shadow-soft h-11 w-full rounded-xl border bg-white pr-4 pl-11 text-sm placeholder:text-slate-400"
      />
    </form>
  );
}
