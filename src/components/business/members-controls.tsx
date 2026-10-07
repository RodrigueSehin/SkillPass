"use client";

import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { useUrlParams } from "@/lib/hooks/use-url-params";
import { ORG_ROLES, ORG_ROLE_LABELS } from "@/types/business";

const select = "border-border h-11 w-full rounded-xl border bg-white px-4 text-sm";

/** Search and the three filters of the members table; each one lives in the URL. */
export function MembersFilters({ teams }: { teams: { id: string; name: string }[] }) {
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
    <div role="search" className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-[minmax(0,1.4fr)_1fr_1fr_1fr]">
      <div className="relative sm:col-span-2 lg:col-span-1 lg:self-end">
        <Search className="text-muted pointer-events-none absolute top-3.5 left-3.5 size-4" aria-hidden />
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          aria-label="Rechercher un membre"
          placeholder="Rechercher un membre…"
          className="border-border h-11 w-full rounded-xl border bg-white pr-3 pl-10 text-sm"
        />
      </div>
      <label className="text-navy block text-sm font-medium">
        Équipe
        <select value={params.get("team") ?? ""} onChange={change("team")} className={`${select} mt-1`}>
          <option value="">Toutes</option>
          {teams.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
      </label>
      <label className="text-navy block text-sm font-medium">
        Rôle
        <select value={params.get("role") ?? ""} onChange={change("role")} className={`${select} mt-1`}>
          <option value="">Tous</option>
          {ORG_ROLES.map((r) => (
            <option key={r} value={r}>
              {ORG_ROLE_LABELS[r]}
            </option>
          ))}
        </select>
      </label>
      <label className="text-navy block text-sm font-medium">
        Statut
        <select value={params.get("status") ?? ""} onChange={change("status")} className={`${select} mt-1`}>
          <option value="">Tous</option>
          <option value="ACTIVE">Actif</option>
          <option value="INACTIVE">Inactif</option>
          <option value="INVITED">Invité</option>
        </select>
      </label>
    </div>
  );
}
